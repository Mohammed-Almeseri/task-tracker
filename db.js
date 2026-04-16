// ==========================================
// Supabase Database Client + Transform Helpers
// ==========================================

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const supabaseServiceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('  ⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — DB operations will fail.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// --- DB row → API response transforms (snake_case → camelCase) ---

function goalToApi(row, tasks) {
    return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        createdAt: row.created_at,
        tasks: tasks || []
    };
}

function taskToApi(row) {
    return {
        id: row.id,
        goalId: row.goal_id,
        title: row.title,
        description: row.description || '',
        status: row.status || 'todo',
        importance: row.importance || 'low',
        tags: row.tags || [],
        dueDate: row.due_date || null,
        subtasks: row.subtasks || [],
        timeSpent: row.time_spent || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at || null
    };
}

function timerSessionToApi(row) {
    return {
        id: row.id,
        taskId: row.task_id || null,
        type: row.type || 'stopwatch',
        duration: row.duration || 0,
        completedAt: row.completed_at
    };
}

function noteToApi(row) {
    return {
        id: row.id,
        title: row.title,
        content: row.content || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

module.exports = { supabase, goalToApi, taskToApi, timerSessionToApi, noteToApi };
