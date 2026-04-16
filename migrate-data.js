// ==========================================
// DATA MIGRATION: data.json → Supabase
// ==========================================
// Run once:  node migrate-data.js
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
// Tables must already exist (run supabase-schema.sql first)

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const supabaseServiceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌  Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function migrate() {
    const dataPath = path.join(__dirname, 'data.json');
    if (!fs.existsSync(dataPath)) {
        console.error('❌  data.json not found.');
        process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log('📖  Loaded data.json\n');

    // Build email → Supabase user-id mapping
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) {
        console.error('❌  Could not list Supabase users:', authErr.message);
        process.exit(1);
    }

    const emailToId = {};
    for (const user of authData.users) {
        emailToId[user.email.toLowerCase()] = user.id;
    }
    console.log(`👥  Found ${Object.keys(emailToId).length} Supabase users\n`);

    // Collect all user buckets from data.json
    const allUsers = {};
    if (rawData.users && typeof rawData.users === 'object') {
        for (const [email, userData] of Object.entries(rawData.users)) {
            allUsers[email.toLowerCase()] = userData;
        }
    }
    // Root-level anonymous data
    if (rawData.goals?.length || rawData.timerSessions?.length || rawData.notes?.length) {
        allUsers['__root__'] = {
            goals: rawData.goals || [],
            timerSessions: rawData.timerSessions || [],
            notes: rawData.notes || []
        };
    }

    let totalGoals = 0, totalTasks = 0, totalSessions = 0, totalNotes = 0;

    for (const [email, userData] of Object.entries(allUsers)) {
        const userId = emailToId[email];
        if (!userId) {
            console.log(`⚠️  Skipping "${email}" — no matching Supabase user`);
            continue;
        }

        console.log(`📦  Migrating ${email} → ${userId}`);

        // Goals + Tasks
        for (const goal of userData.goals || []) {
            const { data: newGoal, error: goalErr } = await supabase
                .from('goals')
                .insert({
                    id: goal.id,
                    user_id: userId,
                    title: goal.title,
                    description: goal.description || '',
                    created_at: goal.createdAt || new Date().toISOString()
                })
                .select()
                .single();

            if (goalErr) {
                console.error(`   ❌ Goal "${goal.title}": ${goalErr.message}`);
                continue;
            }
            totalGoals++;

            for (const task of goal.tasks || []) {
                const { error: taskErr } = await supabase.from('tasks').insert({
                    id: task.id,
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
                if (taskErr) {
                    console.error(`   ❌ Task "${task.title}": ${taskErr.message}`);
                } else {
                    totalTasks++;
                }
            }
        }

        // Timer sessions
        for (const session of userData.timerSessions || []) {
            const row = {
                id: session.id,
                user_id: userId,
                task_id: session.taskId || null,
                type: session.type || 'stopwatch',
                duration: session.duration || 0,
                completed_at: session.completedAt || new Date().toISOString()
            };
            let { error } = await supabase.from('timer_sessions').insert(row);
            if (error && row.task_id) {
                // FK issue — retry without task_id
                row.task_id = null;
                ({ error } = await supabase.from('timer_sessions').insert(row));
            }
            if (!error) totalSessions++;
        }

        // Notes
        for (const note of userData.notes || []) {
            const { error } = await supabase.from('notes').insert({
                id: note.id,
                user_id: userId,
                title: note.title,
                content: note.content || '',
                created_at: note.createdAt || new Date().toISOString(),
                updated_at: note.updatedAt || new Date().toISOString()
            });
            if (!error) totalNotes++;
        }

        console.log(`   ✅ Done\n`);
    }

    console.log('═══════════════════════════════');
    console.log(`✅  Migration complete!`);
    console.log(`   Goals:    ${totalGoals}`);
    console.log(`   Tasks:    ${totalTasks}`);
    console.log(`   Sessions: ${totalSessions}`);
    console.log(`   Notes:    ${totalNotes}`);
    console.log('═══════════════════════════════');
}

migrate().catch(err => {
    console.error('❌  Migration failed:', err);
    process.exit(1);
});
