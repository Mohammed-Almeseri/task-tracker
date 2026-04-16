import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer';

const workspaceRoot = 'C:/Users/moamm/OneDrive/Desktop/Test/task-tracker';
const buildRoot = path.join(workspaceRoot, 'appdeploy-build');
const authServerBase = 'https://api-v2.appdeploy.ai';
const mcpEndpoint = `${authServerBase}/mcp`;
const tokenEndpoint = `${authServerBase}/mcp/token`;
const authorizeEndpoint = `${authServerBase}/mcp/authorize`;
const clientId = 'client-08fe8526-2d26-4bc0-98dc-bef879c25052';
const redirectUri = 'http://127.0.0.1:8765/callback';
const appName = 'Task Tracker';
const appDescription = 'Responsive task tracker with goals, notes, timer, backups, and Supabase auth.';
const appType = 'frontend+backend';
const frontendTemplate = 'html-static';
const features = ['api', 'database'];
const model = 'gpt-5.4-mini';
const intent = 'Deploy Task Tracker with Supabase-authenticated backend persistence';

function readText(relativePath) {
  return fs.readFileSync(path.join(buildRoot, relativePath), 'utf8');
}

function base64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function makePkcePair() {
  const verifier = base64Url(crypto.randomBytes(32));
  const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest());
  const state = crypto.randomUUID();
  return { verifier, challenge, state };
}

async function exchangeCodeForToken(code, verifier) {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    })
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error('Token exchange did not return access_token');
  }

  return payload.access_token;
}

async function getFreshAccessToken() {
  const { verifier, challenge, state } = makePkcePair();
  const authorizeUrl = new URL(authorizeEndpoint);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', 'deploy:read deploy:write deploy:delete');
  authorizeUrl.searchParams.set('code_challenge', challenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('resource', `${authServerBase}/mcp`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(authorizeUrl.toString(), { waitUntil: 'networkidle2' });

    const clickedGuest = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find((element) =>
        (element.textContent || '').includes('Continue as Guest')
      );

      if (!button) {
        return false;
      }

      button.click();
      return true;
    });

    if (!clickedGuest) {
      throw new Error('Could not find Continue as Guest button on AppDeploy auth page');
    }

    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('a')).some((element) =>
        (element.href || '').includes('/callback?code=')
      ),
    { timeout: 30000 }).catch(() => {});

    const callbackUrl = await page.evaluate(() => {
      const anchor = Array.from(document.querySelectorAll('a')).find((element) =>
        (element.href || '').includes('/callback?code=')
      );
      return anchor ? anchor.href : '';
    });

    if (!callbackUrl) {
      throw new Error('Could not find OAuth callback URL on completion page');
    }

    const callback = new URL(callbackUrl);
    const code = callback.searchParams.get('code');
    if (!code) {
      throw new Error('OAuth callback URL did not contain a code');
    }

    console.log(`OAuth callback captured: ${callbackUrl}`);
    return await exchangeCodeForToken(code, verifier);
  } finally {
    await browser.close();
  }
}

async function mcpCall(token, methodName, argumentsObject) {
  const response = await fetch(mcpEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': '2025-06-18'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: 'tools/call',
      params: {
        name: methodName,
        arguments: argumentsObject
      }
    })
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${methodName} failed: ${response.status} ${text}`);
  }

  const parsed = JSON.parse(text);
  const innerText = parsed?.result?.content?.[0]?.text;

  if (typeof innerText === 'string' && innerText.trim()) {
    try {
      return JSON.parse(innerText);
    } catch {
      return parsed;
    }
  }

  return parsed;
}

function buildDeployFiles() {
  const templateIndexFrom = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>APP_TITLE</title>
    <link rel="stylesheet" href="./src/styles.css">
</head>
<body>
    <div id="app">APP_CONTENT</div>
    <script type="module" src="./src/main.ts"></script>
</body>
</html>
`;

  const templateBackendFrom = `interface JsonResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

const json = (data: unknown, status = 200): JsonResponse => ({
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
});

const error = (message: string, status = 400): JsonResponse =>
    json({ error: message }, status);

interface RouteParams {
    [key: string]: string;
}

const matchRoute = (
    pattern: string,
    method: string,
    path: string
): RouteParams | null => {
    const [patternMethod, patternPath] = pattern.split(" ");
    if (patternMethod !== method) return null;

    const patternParts = patternPath.split("/");
    const pathParts = path.split("/");
    if (patternParts.length !== pathParts.length) return null;

    const params: RouteParams = {};
    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(":")) {
            params[patternParts[i].slice(1)] = pathParts[i];
        } else if (patternParts[i] !== pathParts[i]) {
            return null;
        }
    }
    return params;
};

// Lambda event - use event.path/body, not Request.url
interface LambdaEvent {
    httpMethod?: string;
    requestContext?: { http?: { method?: string } };
    rawPath?: string;
    path?: string;
    body?: string | object;
    queryStringParameters?: Record<string, string>;
}

interface MiddlewareContext {
    body: unknown;
    query: Record<string, string>;
    params: RouteParams;
    event: LambdaEvent;
    user?: Record<string, unknown>;
}
type Middleware = (ctx: MiddlewareContext) => Promise<void | JsonResponse>;
type Routes = Record<string, Middleware[]>;

const runRoute = async (
    value: Middleware[],
    ctx: MiddlewareContext
): Promise<JsonResponse> => {
    const routeChain: Middleware[] = Array.isArray(value)
        ? value
        : [async mctx => (value as Function)(mctx)];
    const middlewareCtx = { ...ctx };
    for (const middleware of routeChain) {
        const res = await middleware(middlewareCtx);
        if (res) {
            return res;
        }
    }

    return error("Route chain returned no response. Last middleware must return JsonResponse.", 500);
};

const router =
    (routes: Routes) =>
    async (event: LambdaEvent): Promise<JsonResponse> => {
        const method = event.httpMethod || event.requestContext?.http?.method || "";
        const path = event.rawPath || event.path || "";

        let body: unknown = {};
        try {
            if (event.body) {
                body =
                    typeof event.body === "string" ? JSON.parse(event.body) : event.body;
            }
        } catch {}

        const query = event.queryStringParameters || {};

        for (const [pattern, middlewares] of Object.entries(routes)) {
            const params = matchRoute(pattern, method, path);
            if (params !== null) {
                try {
                    return await runRoute(middlewares, { body, query, params, event });
                } catch (err) {
                    console.error(err);
                    return error("Internal server error", 500);
                }
            }
        }

        return error("Not found", 404);
    };

export const handler = router({
    "GET /api/_healthcheck": [async () => json({ message: "Success" })],

    // Add your routes here using an array of handlers.
    // Public routes use a single handler, e.g.:
    // 'GET /api/items': [async ({ query }) => { ... }],
    // 'POST /api/items': [async ({ body }) => { ... }],
    // 'GET /api/items/:id': [async ({ params }) => { ... }],
})`;

  const files = [
    {
      filename: 'index.html',
      diffs: [{ from: templateIndexFrom, to: readText('index.html') }]
    },
    {
      filename: 'backend/index.ts',
      diffs: [{ from: templateBackendFrom, to: readText('backend/index.ts') }]
    }
  ];

  const newFiles = [
    'login.html',
    'public/app.js',
    'public/login.js',
    'public/settings.js',
    'public/dashboard.js',
    'public/timer.js',
    'public/notes.js',
    'public/style.css',
    'public/new_styles.css',
    'public/auth.css',
    'forgot-password.html',
    'public/appdeploy-client-shim.js',
    'public/appdeploy-client.js',
    'tests/tests.txt'
  ];

  for (const relativePath of newFiles) {
    files.push({
      filename: relativePath,
      content: readText(relativePath)
    });
  }

  return files;
}

async function main() {
  console.log('Starting AppDeploy OAuth flow...');
  const accessToken = await getFreshAccessToken();
  console.log('Fresh AppDeploy access token acquired.');

  const files = buildDeployFiles();
  console.log(`Prepared ${files.length} file entries for deploy.`);

  const existingAppId = process.env.APP_ID || '';

  if (existingAppId) {
    let status = 'unknown';
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const statusResponse = await mcpCall(accessToken, 'get_app_status', { app_id: existingAppId });
      console.log(JSON.stringify(statusResponse, null, 2));

      const payload = statusResponse?.result || statusResponse;
      status = payload?.deployment?.status || payload?.status || 'unknown';
      if (status === 'ready' || status === 'failed' || status === 'deleted') {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log(`FINAL_STATUS=${status}`);
    if (status !== 'ready') {
      throw new Error(`Deployment did not reach ready status. Final status: ${status}`);
    }

    return;
  }

  try {
    await mcpCall(accessToken, 'update_coding_progress', {
      step: 'prepare_deploy_manifest',
      current_task: 'Assembling the Task Tracker deploy payload from the local workspace tree.'
    });
  } catch (error) {
    console.log(`Progress update skipped: ${error.message}`);
  }

  const deployResponse = await mcpCall(accessToken, 'deploy_app', {
    app_id: null,
    app_type: appType,
    app_name: appName,
    description: appDescription,
    frontend_template: frontendTemplate,
    features,
    model,
    intent,
    files
  });

  console.log(JSON.stringify(deployResponse, null, 2));

  const resultText = JSON.stringify(deployResponse);
  const appId =
    deployResponse?.result?.app_id ||
    deployResponse?.result?.appId ||
    deployResponse?.result?.deployment?.app_id ||
    deployResponse?.result?.deployment?.appId ||
    deployResponse?.deployment?.app_id ||
    deployResponse?.deployment?.appId ||
    deployResponse?.app_id ||
    deployResponse?.appId;

  if (!appId) {
    throw new Error(`Could not determine app id from deploy response: ${resultText}`);
  }

  let status = 'unknown';
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const statusResponse = await mcpCall(accessToken, 'get_app_status', { app_id: appId });
    console.log(JSON.stringify(statusResponse, null, 2));

    const payload = statusResponse?.result || statusResponse;
    status = payload?.deployment?.status || payload?.status || 'unknown';
    if (status === 'ready' || status === 'failed' || status === 'deleted') {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log(`FINAL_STATUS=${status}`);
  if (status !== 'ready') {
    throw new Error(`Deployment did not reach ready status. Final status: ${status}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
