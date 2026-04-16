// ==========================================
// TASK TRACKER — Server (Full Feature Set)
// ==========================================

require('dotenv').config();
const express = require('express');
const { AsyncLocalStorage } = require('async_hooks');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_SUPABASE_URL = 'https://wqnrdahctafgdvsprkju.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbnJkYWhjdGFmZ2R2c3Bya2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjczNTUsImV4cCI6MjA5MTc0MzM1NX0.cRoE9OOw7xYsQ1BSsAFz1rRhfNQqF98qa8_R7E6bl7g';

const supabaseConfig = {
    url: String(process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/\/$/, ''),
    anonKey: String(process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim()
};

// =====================
// 1. CONFIGURATION
// =====================

const config = {
    port: parseInt(process.env.PORT, 10) || 3000,
    dataFile: process.env.DATA_FILE || path.join(__dirname, 'data.json'),
    maxBodySize: '1mb',
    allowedStatuses: ['todo', 'in-progress', 'blocked', 'review', 'done'],
    allowedImportance: ['low', 'medium', 'high', 'urgent'],
    allowedTimerTypes: ['pomodoro', 'stopwatch', 'countdown', 'manual']
};

function parseOriginList(value) {
    return String(value || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
}

const allowedOrigins = new Set([
    ...parseOriginList(process.env.APP_ORIGIN),
    ...parseOriginList(process.env.CORS_ORIGIN),
    ...parseOriginList(process.env.CORS_ORIGINS),
    `http://localhost:${config.port}`,
    `http://127.0.0.1:${config.port}`
]);

const app = express();
const requestContext = new AsyncLocalStorage();
const rateLimitState = new Map();

function normalizeUserKey(value) {
    return String(value || 'anonymous').trim().toLowerCase() || 'anonymous';
}

function getCurrentUserKey() {
    const store = requestContext.getStore();
    return normalizeUserKey(store?.userKey);
}

function getEmptyUserData() {
    return { goals: [], timerSessions: [], notes: [] };
}

function normalizeUserData(data) {
    return {
        goals: Array.isArray(data?.goals) ? data.goals : [],
        timerSessions: Array.isArray(data?.timerSessions) ? data.timerSessions : [],
        notes: Array.isArray(data?.notes) ? data.notes : []
    };
}

function normalizeRootData(data) {
    const root = (data && typeof data === 'object' && !Array.isArray(data)) ? { ...data } : {};
    if (!Array.isArray(root.goals)) root.goals = [];
    if (!Array.isArray(root.timerSessions)) root.timerSessions = [];
    if (!Array.isArray(root.notes)) root.notes = [];
    if (!root.users || typeof root.users !== 'object' || Array.isArray(root.users)) root.users = {};
    return root;
}

function readRootData() {
    try {
        const raw = fs.readFileSync(config.dataFile, 'utf-8');
        return normalizeRootData(JSON.parse(raw));
    } catch (err) {
        console.error('  ⚠️  Data file read error, using defaults:', err.message);
        return normalizeRootData({});
    }
}

function writeRootData(data) {
    const payload = JSON.stringify(data, null, 2);
    try {
        const tempFile = config.dataFile + '.tmp';
        fs.writeFileSync(tempFile, payload, 'utf-8');
        fs.renameSync(tempFile, config.dataFile);
    } catch (err) {
        try {
            if (fs.existsSync(config.dataFile + '.tmp')) {
                fs.unlinkSync(config.dataFile + '.tmp');
            }
        } catch (cleanupErr) {
            // Ignore cleanup errors and continue with the fallback write.
        }

        try {
            fs.writeFileSync(config.dataFile, payload, 'utf-8');
        } catch (fallbackErr) {
            console.error('  ❌ Data file write error:', fallbackErr.message);
            throw new AppError('Failed to save data', 500);
        }
    }
}

// =====================
// 2. MIDDLEWARE
// =====================

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    const origin = req.get('Origin');
    if (origin && allowedOrigins.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-TaskTracker-Token');
    }

    // Intercept OPTIONS method
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

app.use(express.json({ limit: config.maxBodySize }));

app.use('/api', authenticateApiRequest);

app.use(express.static(path.join(__dirname, 'public')));

// Serve Vercel Speed Insights script
app.use('/speed-insights', express.static(path.join(__dirname, 'node_modules/@vercel/speed-insights/dist')));

// Prevent browser caching of API responses
app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

app.use((req, res, next) => {
    const start = Date.now();
    const originalEnd = res.end;
    res.end = function (...args) {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? '⚠️' : '✅';
        const userKey = getCurrentUserKey();
        const userLabel = userKey !== 'anonymous' ? ` [${userKey}]` : '';
        console.log(`  ${logLevel} ${req.method} ${req.path}${userLabel} → ${res.statusCode} (${duration}ms)`);
        originalEnd.apply(res, args);
    };
    next();
});

// =====================
// 3. DATA ACCESS LAYER
// =====================

function readData() {
    const root = readRootData();
    const userKey = getCurrentUserKey();

    if (userKey === 'anonymous') {
        return normalizeUserData(root);
    }

    if (!root.users[userKey]) {
        const hasLegacyData = Object.keys(root.users).length === 0 && (root.goals.length > 0 || root.timerSessions.length > 0 || root.notes.length > 0);
        if (hasLegacyData) {
            root.users[userKey] = normalizeUserData({
                goals: root.goals,
                timerSessions: root.timerSessions,
                notes: root.notes
            });
            root.goals = [];
            root.timerSessions = [];
            root.notes = [];
            writeRootData(root);
            return normalizeUserData(root.users[userKey]);
        }

        return getEmptyUserData();
    }

    return normalizeUserData(root.users[userKey]);
}

function writeData(data) {
    const root = readRootData();
    const userKey = getCurrentUserKey();
    const normalized = normalizeUserData(data);

    if (userKey === 'anonymous') {
        root.goals = normalized.goals;
        root.timerSessions = normalized.timerSessions;
        root.notes = normalized.notes;
    } else {
        root.users[userKey] = normalized;
    }

    writeRootData(root);
}

// =====================
// 4. ERROR CLASSES
// =====================

class AppError extends Error {
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
    }
}

class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, details);
    }
}

// =====================
// 5. ASYNC HANDLER
// =====================

function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// =====================
// 6. VALIDATION HELPERS
// =====================

function validateGoalInput(body, isUpdate = false) {
    const errors = [];
    if (!isUpdate) {
        if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
            errors.push('title is required and must be a non-empty string');
        }
    } else {
        if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim().length === 0)) {
            errors.push('title must be a non-empty string');
        }
    }
    if (body.description !== undefined && typeof body.description !== 'string') {
        errors.push('description must be a string');
    }
    if (errors.length > 0) throw new ValidationError('Invalid goal input', errors);
    return {
        title: body.title ? body.title.trim() : undefined,
        description: body.description !== undefined ? body.description.trim() : undefined
    };
}

function validateTaskInput(body, isUpdate = false) {
    const errors = [];
    if (!isUpdate) {
        if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
            errors.push('title is required');
        }
    } else {
        if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim().length === 0)) {
            errors.push('title must be a non-empty string');
        }
    }
    if (body.description !== undefined && typeof body.description !== 'string') errors.push('description must be a string');
    if (body.status !== undefined && !config.allowedStatuses.includes(body.status)) errors.push(`status must be one of: ${config.allowedStatuses.join(', ')}`);
    if (body.importance !== undefined && !config.allowedImportance.includes(body.importance)) errors.push(`importance must be one of: ${config.allowedImportance.join(', ')}`);
    if (body.tags !== undefined) {
        if (!Array.isArray(body.tags)) errors.push('tags must be an array');
        else if (!body.tags.every(t => typeof t === 'string')) errors.push('each tag must be a string');
    }
    if (body.dueDate !== undefined && body.dueDate !== null && body.dueDate !== '') {
        if (typeof body.dueDate !== 'string' || isNaN(Date.parse(body.dueDate))) {
            errors.push('dueDate must be a valid date string or null');
        }
    }
    if (body.subtasks !== undefined) {
        if (!Array.isArray(body.subtasks)) errors.push('subtasks must be an array');
    }
    if (errors.length > 0) throw new ValidationError('Invalid task input', errors);
    return {
        title: body.title ? body.title.trim() : undefined,
        description: body.description !== undefined ? body.description.trim() : undefined,
        status: body.status,
        importance: body.importance,
        tags: body.tags,
        dueDate: body.dueDate !== undefined ? (body.dueDate || null) : undefined,
        subtasks: body.subtasks,
        timeSpent: body.timeSpent
    };
}

function validateTimerSessionInput(body) {
    const errors = [];
    if (body.taskId !== undefined && body.taskId !== null && typeof body.taskId !== 'string') errors.push('taskId must be a string or null');
    if (body.type !== undefined && !config.allowedTimerTypes.includes(body.type)) errors.push(`type must be one of: ${config.allowedTimerTypes.join(', ')}`);
    if (body.duration !== undefined && (typeof body.duration !== 'number' || body.duration < 0)) errors.push('duration must be a non-negative number');
    if (errors.length > 0) throw new ValidationError('Invalid timer session input', errors);
    return { taskId: body.taskId || null, type: body.type || 'stopwatch', duration: body.duration || 0 };
}

function validateNoteInput(body, isUpdate = false) {
    const errors = [];
    if (!isUpdate) {
        if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
            errors.push('title is required');
        }
    } else {
        if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim().length === 0)) {
            errors.push('title must be a non-empty string');
        }
    }
    if (body.content !== undefined && typeof body.content !== 'string') errors.push('content must be a string');
    if (errors.length > 0) throw new ValidationError('Invalid note input', errors);
    return {
        title: body.title ? body.title.trim() : undefined,
        content: body.content !== undefined ? body.content : undefined
    };
}

function getSupabaseConfig() {
    return {
        supabaseUrl: supabaseConfig.url,
        supabaseAnonKey: supabaseConfig.anonKey
    };
}

async function verifySupabaseSession(accessToken) {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
        throw new AppError('Supabase auth is not configured', 503);
    }

    const token = String(accessToken || '').trim();
    if (!token) {
        throw new ValidationError('accessToken is required');
    }

    let response;
    try {
        response = await fetch(`${supabaseConfig.url}/auth/v1/user`, {
            headers: {
                apikey: supabaseConfig.anonKey,
                Authorization: `Bearer ${token}`
            }
        });
    } catch (error) {
        throw new AppError('Unable to verify Supabase session', 502);
    }

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new AppError('Supabase session is invalid or expired', 401);
        }

        throw new AppError('Unable to verify Supabase session', 502);
    }

    return response.json();
}

function extractAccessToken(req) {
    const authHeader = String(req.get('Authorization') || '').trim();
    if (authHeader.toLowerCase().startsWith('bearer ')) {
        return authHeader.slice(7).trim();
    }

    return String(req.get('X-TaskTracker-Token') || req.get('X-Tasktracker-Token') || '').trim();
}

function isPublicApiRoute(req) {
    return req.path === '/supabase-config' || req.path === '/auth/session';
}

async function authenticateApiRequest(req, res, next) {
    if (req.method === 'OPTIONS' || isPublicApiRoute(req)) {
        return next();
    }

    const accessToken = extractAccessToken(req);
    if (!accessToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const user = await verifySupabaseSession(accessToken);
        const userKey = normalizeUserKey(user.email);

        requestContext.run({ userKey }, () => {
            req.user = { id: user.id || null, email: user.email || null };
            next();
        });
    } catch (error) {
        const statusCode = error instanceof AppError ? error.statusCode : 401;
        const message = error instanceof AppError ? error.message : 'Unauthorized';
        res.status(statusCode).json({ error: message });
    }
}

function getRequestIp(req) {
    const forwardedFor = String(req.get('X-Forwarded-For') || '').split(',')[0].trim();
    const rawIp = forwardedFor || req.ip || req.socket?.remoteAddress || 'unknown';
    return rawIp.replace(/^::ffff:/, '');
}

function createRateLimitMiddleware({ windowMs, max, scope, message }) {
    return (req, res, next) => {
        const userKey = getCurrentUserKey();
        const identity = userKey !== 'anonymous' ? `user:${userKey}` : `ip:${getRequestIp(req)}`;
        const bucketKey = `${scope}:${identity}`;
        const now = Date.now();

        const currentBucket = rateLimitState.get(bucketKey);
        if (!currentBucket || currentBucket.resetAt <= now) {
            rateLimitState.set(bucketKey, { count: 1, resetAt: now + windowMs });
            res.setHeader('X-RateLimit-Limit', String(max));
            res.setHeader('X-RateLimit-Remaining', String(Math.max(max - 1, 0)));
            res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
            return next();
        }

        if (currentBucket.count >= max) {
            const retryAfterSeconds = Math.max(1, Math.ceil((currentBucket.resetAt - now) / 1000));
            res.setHeader('X-RateLimit-Limit', String(max));
            res.setHeader('X-RateLimit-Remaining', '0');
            res.setHeader('X-RateLimit-Reset', String(Math.ceil(currentBucket.resetAt / 1000)));
            res.setHeader('Retry-After', String(retryAfterSeconds));
            return res.status(429).json({ error: message || 'Too many requests', retryAfterSeconds });
        }

        currentBucket.count += 1;
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(Math.max(max - currentBucket.count, 0)));
        res.setHeader('X-RateLimit-Reset', String(Math.ceil(currentBucket.resetAt / 1000)));
        next();
    };
}

const authSessionRateLimit = createRateLimitMiddleware({
    windowMs: 10 * 60 * 1000,
    max: 20,
    scope: 'auth-session',
    message: 'Too many session checks. Please wait a moment and try again.'
});

const backupRestoreRateLimit = createRateLimitMiddleware({
    windowMs: 60 * 60 * 1000,
    max: 10,
    scope: 'data-protection',
    message: 'Too many backup or restore requests. Please wait and try again.'
});

const exportRateLimit = createRateLimitMiddleware({
    windowMs: 60 * 60 * 1000,
    max: 20,
    scope: 'data-export',
    message: 'Too many export requests. Please wait and try again.'
});

// =====================
// 7. SERVICE LAYER
// =====================

const goalService = {
    getAll() { return readData().goals; },
    getById(id) {
        const goal = readData().goals.find(g => g.id === id);
        if (!goal) throw new NotFoundError('Goal');
        return goal;
    },
    create(input) {
        const data = readData();
        const goal = { id: uuidv4(), title: input.title, description: input.description || '', createdAt: new Date().toISOString(), tasks: [] };
        data.goals.push(goal);
        writeData(data);
        return goal;
    },
    update(id, input) {
        const data = readData();
        const idx = data.goals.findIndex(g => g.id === id);
        if (idx === -1) throw new NotFoundError('Goal');
        data.goals[idx] = { ...data.goals[idx], ...(input.title !== undefined && { title: input.title }), ...(input.description !== undefined && { description: input.description }) };
        writeData(data);
        return data.goals[idx];
    },
    delete(id) {
        const data = readData();
        const idx = data.goals.findIndex(g => g.id === id);
        if (idx === -1) throw new NotFoundError('Goal');
        data.goals.splice(idx, 1);
        writeData(data);
    }
};

const taskService = {
    create(goalId, input) {
        const data = readData();
        const goal = data.goals.find(g => g.id === goalId);
        if (!goal) throw new NotFoundError('Goal');
        const task = {
            id: uuidv4(), goalId: goal.id, title: input.title,
            description: input.description || '', status: input.status || 'todo',
            importance: input.importance || 'low', tags: input.tags || [],
            dueDate: input.dueDate || null,
            subtasks: input.subtasks || [],
            timeSpent: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            completedAt: null
        };
        goal.tasks.push(task);
        writeData(data);
        return task;
    },
    update(id, input) {
        const data = readData();
        let foundTask = null;
        for (const goal of data.goals) {
            const idx = goal.tasks.findIndex(t => t.id === id);
            if (idx !== -1) {
                const oldStatus = goal.tasks[idx].status;
                const newStatus = input.status !== undefined ? input.status : oldStatus;
                goal.tasks[idx] = {
                    ...goal.tasks[idx],
                    ...(input.title !== undefined && { title: input.title }),
                    ...(input.description !== undefined && { description: input.description }),
                    ...(input.status !== undefined && { status: input.status }),
                    ...(input.importance !== undefined && { importance: input.importance }),
                    ...(input.tags !== undefined && { tags: input.tags }),
                    ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
                    ...(input.subtasks !== undefined && { subtasks: input.subtasks }),
                    ...(input.timeSpent !== undefined && { timeSpent: input.timeSpent }),
                    updatedAt: new Date().toISOString()
                };
                // Track completedAt
                if (newStatus === 'done' && oldStatus !== 'done') {
                    goal.tasks[idx].completedAt = new Date().toISOString();
                } else if (newStatus !== 'done' && oldStatus === 'done') {
                    goal.tasks[idx].completedAt = null;
                }
                foundTask = goal.tasks[idx];
                break;
            }
        }
        if (!foundTask) throw new NotFoundError('Task');
        writeData(data);
        return foundTask;
    },
    delete(id) {
        const data = readData();
        let found = false;
        for (const goal of data.goals) {
            const idx = goal.tasks.findIndex(t => t.id === id);
            if (idx !== -1) { goal.tasks.splice(idx, 1); found = true; break; }
        }
        if (!found) throw new NotFoundError('Task');
        writeData(data);
    }
};

const timerService = {
    getAll() { return readData().timerSessions; },
    create(input) {
        const data = readData();
        const session = { id: uuidv4(), taskId: input.taskId, type: input.type, duration: input.duration, completedAt: new Date().toISOString() };
        data.timerSessions.push(session);
        if (session.taskId) {
            for (const goal of data.goals) {
                const task = goal.tasks.find(t => t.id === session.taskId);
                if (task) { task.timeSpent = (task.timeSpent || 0) + session.duration; task.updatedAt = new Date().toISOString(); break; }
            }
        }
        writeData(data);
        return session;
    },
    delete(id) {
        const data = readData();
        const index = data.timerSessions.findIndex(session => session.id === id);
        if (index === -1) throw new NotFoundError('Timer session');

        const [session] = data.timerSessions.splice(index, 1);
        if (session?.taskId) {
            for (const goal of data.goals) {
                const task = goal.tasks.find(t => t.id === session.taskId);
                if (task) {
                    const currentTimeSpent = Number(task.timeSpent) || 0;
                    task.timeSpent = Math.max(0, currentTimeSpent - (Number(session.duration) || 0));
                    task.updatedAt = new Date().toISOString();
                    break;
                }
            }
        }

        writeData(data);
    }
};

const noteService = {
    getAll() { return readData().notes || []; },
    create(input) {
        const data = readData();
        if (!data.notes) data.notes = [];
        const note = { id: uuidv4(), title: input.title, content: input.content || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        data.notes.push(note);
        writeData(data);
        return note;
    },
    update(id, input) {
        const data = readData();
        if (!data.notes) data.notes = [];
        const idx = data.notes.findIndex(n => n.id === id);
        if (idx === -1) throw new NotFoundError('Note');
        data.notes[idx] = { ...data.notes[idx], ...(input.title !== undefined && { title: input.title }), ...(input.content !== undefined && { content: input.content }), updatedAt: new Date().toISOString() };
        writeData(data);
        return data.notes[idx];
    },
    delete(id) {
        const data = readData();
        if (!data.notes) data.notes = [];
        const idx = data.notes.findIndex(n => n.id === id);
        if (idx === -1) throw new NotFoundError('Note');
        data.notes.splice(idx, 1);
        writeData(data);
    }
};

const backupService = {
    createBackup() {
        const data = readData();
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_data_${timestamp}.json`;
        const filepath = path.join(backupDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
        return `backups/${filename}`;
    },
    restoreBackup(body) {
        // Validate structure
        if (!body || typeof body !== 'object') {
            throw new ValidationError('Backup data must be a JSON object');
        }
        if (!Array.isArray(body.goals)) {
            throw new ValidationError('Backup data must contain a "goals" array');
        }
        // Create safety backup before overwriting
        const safetyFile = this.createBackup();
        // Normalize optional arrays
        const restored = {
            goals: body.goals,
            timerSessions: Array.isArray(body.timerSessions) ? body.timerSessions : [],
            notes: Array.isArray(body.notes) ? body.notes : []
        };
        writeData(restored);
        return { safetyBackup: safetyFile };
    }
};

const statsService = {
    getStats() {
        const data = readData();
        const allTasks = data.goals.flatMap(g => g.tasks);
        const doneTasks = allTasks.filter(t => t.status === 'done');

        // Streaks
        const completionDates = doneTasks.filter(t => t.completedAt).map(t => t.completedAt.split('T')[0]);
        const uniqueDays = [...new Set(completionDates)].sort().reverse();
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let checkDate = new Date(today);
        for (let i = 0; i < 365; i++) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (uniqueDays.includes(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (i === 0) {
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            } else {
                break;
            }
        }

        // Heatmap data (last 365 days)
        const heatmapData = {};
        const heatStart = new Date();
        heatStart.setDate(heatStart.getDate() - 364);
        for (let i = 0; i < 365; i++) {
            const d = new Date(heatStart);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split('T')[0];
            heatmapData[key] = 0;
        }
        completionDates.forEach(d => { if (heatmapData[d] !== undefined) heatmapData[d]++; });

        // Completion trend (last 30 days)
        const completionTrend = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const count = completionDates.filter(cd => cd === key).length;
            completionTrend.push({ date: key, count });
        }

        // Avg completion time
        const completedWithTimes = doneTasks.filter(t => t.completedAt && t.createdAt);
        let avgCompletionMs = 0;
        if (completedWithTimes.length > 0) {
            const totalMs = completedWithTimes.reduce((sum, t) => sum + (new Date(t.completedAt) - new Date(t.createdAt)), 0);
            avgCompletionMs = totalMs / completedWithTimes.length;
        }

        // Today's focus
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTasks = allTasks.filter(t => {
            const isDueToday = t.dueDate && t.dueDate.split('T')[0] === todayStr;
            const isInProgress = t.status === 'in-progress';
            return isDueToday || isInProgress;
        });

        // Time distribution by goal
        const timeByGoal = data.goals.map(g => ({
            title: g.title,
            time: g.tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0)
        })).filter(g => g.time > 0);

        return {
            totalGoals: data.goals.length,
            totalTasks: allTasks.length,
            tasksByStatus: {
                todo: allTasks.filter(t => t.status === 'todo').length,
                'in-progress': allTasks.filter(t => t.status === 'in-progress').length,
                blocked: allTasks.filter(t => t.status === 'blocked').length,
                review: allTasks.filter(t => t.status === 'review').length,
                done: doneTasks.length
            },
            tasksByImportance: {
                low: allTasks.filter(t => t.importance === 'low').length,
                medium: allTasks.filter(t => t.importance === 'medium').length,
                high: allTasks.filter(t => t.importance === 'high').length,
                urgent: allTasks.filter(t => t.importance === 'urgent').length
            },
            totalTimeSpent: allTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0),
            totalTimerSessions: (data.timerSessions || []).length,
            goalsProgress: data.goals.map(g => ({
                id: g.id, title: g.title, total: g.tasks.length,
                done: g.tasks.filter(t => t.status === 'done').length,
                percent: g.tasks.length > 0 ? Math.round((g.tasks.filter(t => t.status === 'done').length / g.tasks.length) * 100) : 0
            })),
            streak,
            heatmapData,
            completionTrend,
            avgCompletionMs,
            todayFocus: todayTasks.length,
            todayTasks: todayTasks.map(t => ({ id: t.id, title: t.title, status: t.status, importance: t.importance, dueDate: t.dueDate })),
            timeByGoal
        };
    }
};

// =====================
// 8. ROUTES
// =====================

// Auth
app.get('/api/supabase-config', asyncHandler(async (req, res) => { res.json(getSupabaseConfig()); }));
app.post('/api/auth/session', authSessionRateLimit, asyncHandler(async (req, res) => {
    const user = await verifySupabaseSession(req.body?.accessToken || extractAccessToken(req));
    res.json({
        email: user.email || null,
        userId: user.id || null,
        expiresAt: user.exp || null
    });
}));
app.delete('/api/auth/session', asyncHandler(async (req, res) => { res.status(204).end(); }));

// Goals
app.get('/api/goals', asyncHandler(async (req, res) => { res.json(goalService.getAll()); }));
app.get('/api/goals/:id', asyncHandler(async (req, res) => { res.json(goalService.getById(req.params.id)); }));
app.post('/api/goals', asyncHandler(async (req, res) => { res.status(201).json(goalService.create(validateGoalInput(req.body))); }));
app.put('/api/goals/:id', asyncHandler(async (req, res) => { res.json(goalService.update(req.params.id, validateGoalInput(req.body, true))); }));
app.delete('/api/goals/:id', asyncHandler(async (req, res) => { goalService.delete(req.params.id); res.status(204).end(); }));

// Tasks
app.post('/api/goals/:id/tasks', asyncHandler(async (req, res) => { res.status(201).json(taskService.create(req.params.id, validateTaskInput(req.body))); }));
app.put('/api/tasks/:id', asyncHandler(async (req, res) => { res.json(taskService.update(req.params.id, validateTaskInput(req.body, true))); }));
app.delete('/api/tasks/:id', asyncHandler(async (req, res) => { taskService.delete(req.params.id); res.status(204).end(); }));

// Timer Sessions
app.post('/api/timer-sessions', asyncHandler(async (req, res) => { res.status(201).json(timerService.create(validateTimerSessionInput(req.body))); }));
app.get('/api/timer-sessions', asyncHandler(async (req, res) => { res.json(timerService.getAll()); }));
app.delete('/api/timer-sessions/:id', asyncHandler(async (req, res) => { timerService.delete(req.params.id); res.status(204).end(); }));

// Notes
app.get('/api/notes', asyncHandler(async (req, res) => { res.json(noteService.getAll()); }));
app.post('/api/notes', asyncHandler(async (req, res) => { res.status(201).json(noteService.create(validateNoteInput(req.body))); }));
app.put('/api/notes/:id', asyncHandler(async (req, res) => { res.json(noteService.update(req.params.id, validateNoteInput(req.body, true))); }));
app.delete('/api/notes/:id', asyncHandler(async (req, res) => { noteService.delete(req.params.id); res.status(204).end(); }));

// Stats
app.get('/api/stats', asyncHandler(async (req, res) => { res.json(statsService.getStats()); }));

// Backup
app.post('/api/backup', backupRestoreRateLimit, asyncHandler(async (req, res) => {
    const backupFile = backupService.createBackup();
    res.status(201).json({ message: 'Backup created successfully', file: backupFile });
}));

// Restore
app.post('/api/restore', backupRestoreRateLimit, asyncHandler(async (req, res) => {
    const result = backupService.restoreBackup(req.body);
    res.json({ message: 'Data restored successfully', safetyBackup: result.safetyBackup });
}));

// Data Export
app.get('/api/export/json', exportRateLimit, asyncHandler(async (req, res) => {
    const data = readData();
    res.setHeader('Content-Disposition', 'attachment; filename=tasktracker-export.json');
    res.json(data);
}));

app.get('/api/export/csv', exportRateLimit, asyncHandler(async (req, res) => {
    const data = readData();
    const allTasks = [];
    for (const goal of data.goals) {
        for (const task of goal.tasks) {
            allTasks.push({ goalTitle: goal.title, ...task });
        }
    }
    const headers = ['Goal', 'Title', 'Status', 'Importance', 'Due Date', 'Time Spent (s)', 'Tags', 'Created', 'Completed'];
    const rows = allTasks.map(t => [
        `"${(t.goalTitle || '').replace(/"/g, '""')}"`,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        t.status, t.importance, t.dueDate || '', t.timeSpent || 0,
        `"${(t.tags || []).join(', ')}"`, t.createdAt || '', t.completedAt || ''
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tasktracker-export.csv');
    res.send(csv);
}));

// =====================
// 9. ERROR HANDLING
// =====================

app.use('/api/*', (req, res) => { res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }); });

app.use((err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';
    if (!err.isOperational) console.error('  ❌ Unhandled error:', err.stack || err.message);
    res.status(statusCode).json({ error: message, ...(err.details && { details: err.details }) });
});

// =====================
// 10. STARTUP
// =====================

if (require.main === module) {
    const server = app.listen(config.port, () => {
        console.log(`\n  🚀 Task Tracker running at http://localhost:${config.port}`);
        console.log(`  📁 Data file: ${config.dataFile}`);
        console.log(`  🛡️  Security headers: enabled`);
        console.log(`  ✅ Full feature set: goals, tasks, subtasks, notes, kanban, export\n`);
    });

    function shutdown(signal) {
        console.log(`\n  🛑 ${signal} received, shutting down gracefully...`);
        server.close(() => { console.log('  ✅ Server closed\n'); process.exit(0); });
        setTimeout(() => { console.error('  ❌ Forced shutdown after timeout'); process.exit(1); }, 5000);
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => { console.error('  ❌ Unhandled Promise Rejection:', reason); });
    process.on('uncaughtException', (err) => { require('fs').writeFileSync('bug.txt', err.stack); shutdown('uncaughtException'); });
}

module.exports = { app, config, readData, writeData };
