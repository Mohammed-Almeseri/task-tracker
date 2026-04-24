// ==========================================
// TASK TRACKER — Server (Vercel-Ready)
// ==========================================

require('dotenv').config();
const express = require('express');
const { AsyncLocalStorage } = require('async_hooks');
const path = require('path');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const { supabase, goalToApi, taskToApi, timerSessionToApi, noteToApi } = require('./db');

const supabaseConfig = {
    url: String(process.env.SUPABASE_URL || '').trim().replace(/\/$/, ''),
    anonKey: String(process.env.SUPABASE_ANON_KEY || '').trim()
};

if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    console.warn('  ⚠️  SUPABASE_URL or SUPABASE_ANON_KEY not set — auth will fail until configured.');
}

// =====================
// 1. CONFIGURATION
// =====================

const config = {
    port: parseInt(process.env.PORT, 10) || 3000,
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

// =====================
// 2. CONTEXT HELPERS
// =====================

function getCurrentUserId() {
    const store = requestContext.getStore();
    return store?.userId || null;
}

function getCurrentUserEmail() {
    const store = requestContext.getStore();
    return store?.userEmail || null;
}

// =====================
// 3. ERROR CLASSES
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
// 4. ASYNC HANDLER
// =====================

function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// =====================
// 5. VALIDATION HELPERS
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

function normalizeOptionalUuid(value) {
    return typeof value === 'string' && uuidValidate(value) ? value : undefined;
}

// =====================
// 6. AUTHENTICATION
// =====================

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
        const userId = user.id;
        const userEmail = (user.email || '').trim().toLowerCase();

        requestContext.run({ userId, userEmail }, () => {
            req.user = { id: userId, email: userEmail };
            next();
        });
    } catch (error) {
        const statusCode = error instanceof AppError ? error.statusCode : 401;
        const message = error instanceof AppError ? error.message : 'Unauthorized';
        res.status(statusCode).json({ error: message });
    }
}

// =====================
// 7. RATE LIMITING
// =====================

function getRequestIp(req) {
    const forwardedFor = String(req.get('X-Forwarded-For') || '').split(',')[0].trim();
    const rawIp = forwardedFor || req.ip || req.socket?.remoteAddress || 'unknown';
    return rawIp.replace(/^::ffff:/, '');
}

function createRateLimitMiddleware({ windowMs, max, scope, message }) {
    return (req, res, next) => {
        const userId = getCurrentUserId();
        const identity = userId ? `user:${userId}` : `ip:${getRequestIp(req)}`;
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
// 8. MIDDLEWARE
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

app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

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
        const userEmail = getCurrentUserEmail();
        const userLabel = userEmail ? ` [${userEmail}]` : '';
        console.log(`  ${logLevel} ${req.method} ${req.path}${userLabel} → ${res.statusCode} (${duration}ms)`);
        originalEnd.apply(res, args);
    };
    next();
});

// =====================
// 9. SERVICE LAYER
// =====================

const goalService = {
    async getAll(userId) {
        // Fetch goals and tasks in parallel — both filtered by user_id
        const [goalsResult, tasksResult] = await Promise.all([
            supabase.from('goals').select('*').eq('user_id', userId).order('created_at'),
            supabase.from('tasks').select('*').eq('user_id', userId).order('created_at')
        ]);

        if (goalsResult.error) throw new AppError('Failed to fetch goals: ' + goalsResult.error.message, 500);
        if (tasksResult.error) throw new AppError('Failed to fetch tasks: ' + tasksResult.error.message, 500);

        const goals = goalsResult.data || [];
        const tasks = tasksResult.data || [];
        if (goals.length === 0) return [];

        return goals.map(g =>
            goalToApi(g, tasks.filter(t => t.goal_id === g.id).map(taskToApi))
        );
    },

    async getById(userId, id) {
        const { data: goal, error } = await supabase
            .from('goals')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !goal) throw new NotFoundError('Goal');

        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('goal_id', id)
            .order('created_at');

        return goalToApi(goal, (tasks || []).map(taskToApi));
    },

    async create(userId, input) {
        const { data: goal, error } = await supabase
            .from('goals')
            .insert({
                id: input.id || uuidv4(),
                user_id: userId,
                title: input.title,
                description: input.description || ''
            })
            .select()
            .single();

        if (error) throw new AppError('Failed to create goal: ' + error.message, 500);
        return goalToApi(goal, []);
    },

    async update(userId, id, input) {
        const updates = {};
        if (input.title !== undefined) updates.title = input.title;
        if (input.description !== undefined) updates.description = input.description;

        const { data: goal, error } = await supabase
            .from('goals')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error || !goal) throw new NotFoundError('Goal');

        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('goal_id', id)
            .order('created_at');

        return goalToApi(goal, (tasks || []).map(taskToApi));
    },

    async delete(userId, id) {
        const { data, error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
            .select('id');

        if (error || !data || data.length === 0) throw new NotFoundError('Goal');
    }
};

const taskService = {
    async create(userId, goalId, input) {
        // Verify goal exists and belongs to user
        const { data: goal, error: goalErr } = await supabase
            .from('goals')
            .select('id')
            .eq('id', goalId)
            .eq('user_id', userId)
            .single();

        if (goalErr || !goal) throw new NotFoundError('Goal');

        const now = new Date().toISOString();
        const { data: task, error } = await supabase
            .from('tasks')
            .insert({
                id: input.id || uuidv4(),
                user_id: userId,
                goal_id: goalId,
                title: input.title,
                description: input.description || '',
                status: input.status || 'todo',
                importance: input.importance || 'low',
                tags: input.tags || [],
                due_date: input.dueDate || null,
                subtasks: input.subtasks || [],
                time_spent: 0,
                created_at: now,
                updated_at: now,
                completed_at: (input.status || 'todo') === 'done' ? now : null
            })
            .select()
            .single();

        if (error) throw new AppError('Failed to create task: ' + error.message, 500);
        return taskToApi(task);
    },

    async update(userId, id, input) {
        // Get current task to check status transition for completedAt
        const { data: current, error: fetchErr } = await supabase
            .from('tasks')
            .select('status')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchErr || !current) throw new NotFoundError('Task');

        const updates = { updated_at: new Date().toISOString() };
        if (input.title !== undefined) updates.title = input.title;
        if (input.description !== undefined) updates.description = input.description;
        if (input.status !== undefined) updates.status = input.status;
        if (input.importance !== undefined) updates.importance = input.importance;
        if (input.tags !== undefined) updates.tags = input.tags;
        if (input.dueDate !== undefined) updates.due_date = input.dueDate;
        if (input.subtasks !== undefined) updates.subtasks = input.subtasks;
        if (input.timeSpent !== undefined) updates.time_spent = input.timeSpent;

        // Track completedAt transitions
        const newStatus = input.status !== undefined ? input.status : current.status;
        if (newStatus === 'done' && current.status !== 'done') {
            updates.completed_at = new Date().toISOString();
        } else if (newStatus !== 'done' && current.status === 'done') {
            updates.completed_at = null;
        }

        const { data: task, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error || !task) throw new NotFoundError('Task');
        return taskToApi(task);
    },

    async delete(userId, id) {
        const { data, error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
            .select('id');

        if (error || !data || data.length === 0) throw new NotFoundError('Task');
    }
};

const timerService = {
    async getAll(userId) {
        const { data, error } = await supabase
            .from('timer_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('completed_at');

        if (error) throw new AppError('Failed to fetch timer sessions', 500);
        return (data || []).map(timerSessionToApi);
    },

    async create(userId, input) {
        let taskId = null;
        let currentTask = null;

        // Verify the linked task exists (if provided)
        if (input.taskId) {
            const { data: task } = await supabase
                .from('tasks')
                .select('id, time_spent')
                .eq('id', input.taskId)
                .eq('user_id', userId)
                .single();

            if (task) {
                taskId = task.id;
                currentTask = task;
            }
        }

        const { data: session, error } = await supabase
            .from('timer_sessions')
            .insert({
                id: input.id || uuidv4(),
                user_id: userId,
                task_id: taskId,
                type: input.type || 'stopwatch',
                duration: input.duration || 0,
                completed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw new AppError('Failed to create timer session: ' + error.message, 500);

        // Increment task timeSpent
        if (currentTask) {
            await supabase
                .from('tasks')
                .update({
                    time_spent: (currentTask.time_spent || 0) + (session.duration || 0),
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentTask.id);
        }

        return timerSessionToApi(session);
    },

    async delete(userId, id) {
        // Fetch session first to get duration and task_id
        const { data: session, error: fetchErr } = await supabase
            .from('timer_sessions')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchErr || !session) throw new NotFoundError('Timer session');

        // Delete the session
        await supabase.from('timer_sessions').delete().eq('id', id);

        // Decrement task timeSpent if linked
        if (session.task_id) {
            const { data: task } = await supabase
                .from('tasks')
                .select('time_spent')
                .eq('id', session.task_id)
                .single();

            if (task) {
                await supabase
                    .from('tasks')
                    .update({
                        time_spent: Math.max(0, (task.time_spent || 0) - (session.duration || 0)),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', session.task_id);
            }
        }
    }
};

const noteService = {
    async getAll(userId) {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at');

        if (error) throw new AppError('Failed to fetch notes', 500);
        return (data || []).map(noteToApi);
    },

    async create(userId, input) {
        const now = new Date().toISOString();
        const { data: note, error } = await supabase
            .from('notes')
            .insert({
                id: input.id || uuidv4(),
                user_id: userId,
                title: input.title,
                content: input.content || '',
                created_at: now,
                updated_at: now
            })
            .select()
            .single();

        if (error) throw new AppError('Failed to create note: ' + error.message, 500);
        return noteToApi(note);
    },

    async update(userId, id, input) {
        const updates = { updated_at: new Date().toISOString() };
        if (input.title !== undefined) updates.title = input.title;
        if (input.content !== undefined) updates.content = input.content;

        const { data: note, error } = await supabase
            .from('notes')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error || !note) throw new NotFoundError('Note');
        return noteToApi(note);
    },

    async delete(userId, id) {
        const { data, error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
            .select('id');

        if (error || !data || data.length === 0) throw new NotFoundError('Note');
    }
};

const backupService = {
    async createBackup(userId) {
        const goals = await goalService.getAll(userId);
        const timerSessions = await timerService.getAll(userId);
        const notes = await noteService.getAll(userId);
        return { goals, timerSessions, notes };
    },

    async restoreBackup(userId, body) {
        if (!body || typeof body !== 'object') {
            throw new ValidationError('Backup data must be a JSON object');
        }
        if (!Array.isArray(body.goals)) {
            throw new ValidationError('Backup data must contain a "goals" array');
        }

        // Delete existing data (order matters for FK constraints)
        await supabase.from('timer_sessions').delete().eq('user_id', userId);
        await supabase.from('tasks').delete().eq('user_id', userId);
        await supabase.from('goals').delete().eq('user_id', userId);
        await supabase.from('notes').delete().eq('user_id', userId);

        // Insert goals + tasks
        for (const goal of body.goals) {
            const { data: newGoal, error: goalErr } = await supabase
                .from('goals')
                .insert({
                    id: goal.id || uuidv4(),
                    user_id: userId,
                    title: goal.title,
                    description: goal.description || '',
                    created_at: goal.createdAt || new Date().toISOString()
                })
                .select()
                .single();

            if (goalErr || !newGoal) continue;

            if (Array.isArray(goal.tasks)) {
                for (const task of goal.tasks) {
                    await supabase.from('tasks').insert({
                        id: task.id || uuidv4(),
                        goal_id: newGoal.id,
                        user_id: userId,
                        title: task.title,
                        description: task.description || '',
                        status: task.status || 'todo',
                        importance: task.importance || 'low',
                        tags: task.tags || [],
                        due_date: task.dueDate || null,
                        subtasks: task.subtasks || [],
                        time_spent: task.timeSpent || 0,
                        created_at: task.createdAt || new Date().toISOString(),
                        updated_at: task.updatedAt || new Date().toISOString(),
                        completed_at: task.completedAt || null
                    });
                }
            }
        }

        // Insert timer sessions
        if (Array.isArray(body.timerSessions)) {
            for (const session of body.timerSessions) {
                // Try with task_id; fall back to null if FK fails
                const row = {
                    id: session.id || uuidv4(),
                    user_id: userId,
                    task_id: session.taskId || null,
                    type: session.type || 'stopwatch',
                    duration: session.duration || 0,
                    completed_at: session.completedAt || new Date().toISOString()
                };
                const { error } = await supabase.from('timer_sessions').insert(row);
                if (error && row.task_id) {
                    row.task_id = null;
                    await supabase.from('timer_sessions').insert(row);
                }
            }
        }

        // Insert notes
        if (Array.isArray(body.notes)) {
            for (const note of body.notes) {
                await supabase.from('notes').insert({
                    id: note.id || uuidv4(),
                    user_id: userId,
                    title: note.title,
                    content: note.content || '',
                    created_at: note.createdAt || new Date().toISOString(),
                    updated_at: note.updatedAt || new Date().toISOString()
                });
            }
        }
    }
};

const accountService = {
    async deleteAccount(userId) {
        if (!userId) {
            throw new AppError('Unauthorized', 401);
        }

        // Remove owned app data first so the auth delete only runs after cleanup succeeds.
        const deletions = [
            { table: 'timer_sessions', label: 'timer sessions' },
            { table: 'notes', label: 'notes' },
            { table: 'goals', label: 'goals' }
        ];

        for (const { table, label } of deletions) {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('user_id', userId);

            if (error) {
                throw new AppError(`Failed to delete ${label}: ${error.message}`, 500);
            }
        }

        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
        const authNotFound = authDeleteError && (
            authDeleteError.status === 404 ||
            /not found/i.test(authDeleteError.message || '')
        );

        if (authDeleteError && !authNotFound) {
            throw new AppError(`Failed to delete Supabase account: ${authDeleteError.message}`, 500);
        }
    }
};

const statsService = {
    async getStats(userId) {
        // Parallelize DB fetches — halves response time
        const [goals, timerSessionsList] = await Promise.all([
            goalService.getAll(userId),
            timerService.getAll(userId)
        ]);
        const allTasks = goals.flatMap(g => g.tasks);
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
        const timeByGoal = goals.map(g => ({
            title: g.title,
            time: g.tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0)
        })).filter(g => g.time > 0);

        return {
            totalGoals: goals.length,
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
            totalTimerSessions: timerSessionsList.length,
            goalsProgress: goals.map(g => ({
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
// 10. ROUTES
// =====================

// Auth
app.get('/api/supabase-config', asyncHandler(async (req, res) => { res.setHeader('Cache-Control', 'public, max-age=3600'); res.json(getSupabaseConfig()); }));
app.post('/api/auth/session', authSessionRateLimit, asyncHandler(async (req, res) => {
    const user = await verifySupabaseSession(req.body?.accessToken || extractAccessToken(req));
    res.json({
        email: user.email || null,
        userId: user.id || null,
        expiresAt: user.exp || null
    });
}));
app.delete('/api/auth/session', asyncHandler(async (req, res) => { res.status(204).end(); }));
app.delete('/api/account', asyncHandler(async (req, res) => {
    await accountService.deleteAccount(getCurrentUserId());
    res.json({ message: 'Account deleted successfully' });
}));

// Goals
app.get('/api/goals', asyncHandler(async (req, res) => {
    res.json(await goalService.getAll(getCurrentUserId()));
}));
app.get('/api/goals/:id', asyncHandler(async (req, res) => {
    res.json(await goalService.getById(getCurrentUserId(), req.params.id));
}));
app.post('/api/goals', asyncHandler(async (req, res) => {
    res.status(201).json(await goalService.create(getCurrentUserId(), {
        ...validateGoalInput(req.body),
        id: normalizeOptionalUuid(req.body?.id)
    }));
}));
app.put('/api/goals/:id', asyncHandler(async (req, res) => {
    res.json(await goalService.update(getCurrentUserId(), req.params.id, validateGoalInput(req.body, true)));
}));
app.delete('/api/goals/:id', asyncHandler(async (req, res) => {
    await goalService.delete(getCurrentUserId(), req.params.id);
    res.status(204).end();
}));

// Tasks
app.post('/api/goals/:id/tasks', asyncHandler(async (req, res) => {
    res.status(201).json(await taskService.create(getCurrentUserId(), req.params.id, {
        ...validateTaskInput(req.body),
        id: normalizeOptionalUuid(req.body?.id)
    }));
}));
app.put('/api/tasks/:id', asyncHandler(async (req, res) => {
    res.json(await taskService.update(getCurrentUserId(), req.params.id, validateTaskInput(req.body, true)));
}));
app.delete('/api/tasks/:id', asyncHandler(async (req, res) => {
    await taskService.delete(getCurrentUserId(), req.params.id);
    res.status(204).end();
}));

// Timer Sessions
app.post('/api/timer-sessions', asyncHandler(async (req, res) => {
    res.status(201).json(await timerService.create(getCurrentUserId(), {
        ...validateTimerSessionInput(req.body),
        id: normalizeOptionalUuid(req.body?.id)
    }));
}));
app.get('/api/timer-sessions', asyncHandler(async (req, res) => {
    res.json(await timerService.getAll(getCurrentUserId()));
}));
app.delete('/api/timer-sessions/:id', asyncHandler(async (req, res) => {
    await timerService.delete(getCurrentUserId(), req.params.id);
    res.status(204).end();
}));

// Notes
app.get('/api/notes', asyncHandler(async (req, res) => {
    res.json(await noteService.getAll(getCurrentUserId()));
}));
app.post('/api/notes', asyncHandler(async (req, res) => {
    res.status(201).json(await noteService.create(getCurrentUserId(), {
        ...validateNoteInput(req.body),
        id: normalizeOptionalUuid(req.body?.id)
    }));
}));
app.put('/api/notes/:id', asyncHandler(async (req, res) => {
    res.json(await noteService.update(getCurrentUserId(), req.params.id, validateNoteInput(req.body, true)));
}));
app.delete('/api/notes/:id', asyncHandler(async (req, res) => {
    await noteService.delete(getCurrentUserId(), req.params.id);
    res.status(204).end();
}));

// Stats
app.get('/api/stats', asyncHandler(async (req, res) => {
    res.json(await statsService.getStats(getCurrentUserId()));
}));

// Backup — returns data as JSON (no filesystem on Vercel)
app.post('/api/backup', backupRestoreRateLimit, asyncHandler(async (req, res) => {
    const data = await backupService.createBackup(getCurrentUserId());
    res.status(201).json({ message: 'Backup created successfully', data });
}));

// Restore
app.post('/api/restore', backupRestoreRateLimit, asyncHandler(async (req, res) => {
    await backupService.restoreBackup(getCurrentUserId(), req.body);
    res.json({ message: 'Data restored successfully' });
}));

// Data Export
app.get('/api/export/json', exportRateLimit, asyncHandler(async (req, res) => {
    const userId = getCurrentUserId();
    const goals = await goalService.getAll(userId);
    const timerSessions = await timerService.getAll(userId);
    const notes = await noteService.getAll(userId);
    const data = { goals, timerSessions, notes };
    res.setHeader('Content-Disposition', 'attachment; filename=tasktracker-export.json');
    res.json(data);
}));

app.get('/api/export/csv', exportRateLimit, asyncHandler(async (req, res) => {
    const userId = getCurrentUserId();
    const goals = await goalService.getAll(userId);
    const allTasks = [];
    for (const goal of goals) {
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
// 11. ERROR HANDLING
// =====================

app.use('/api/*', (req, res) => { res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }); });

app.use((err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';
    if (!err.isOperational) console.error('  ❌ Unhandled error:', err.stack || err.message);
    res.status(statusCode).json({ error: message, ...(err.details && { details: err.details }) });
});

// =====================
// 12. STARTUP
// =====================

if (require.main === module) {
    const server = app.listen(config.port, () => {
        console.log(`\n  🚀 Task Tracker running at http://localhost:${config.port}`);
        console.log(`  🗄️  Database: Supabase PostgreSQL`);
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
}

module.exports = { app, config };
