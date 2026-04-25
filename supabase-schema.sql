-- ==========================================
-- PLANOVYA — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ==========================================

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id      UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT DEFAULT '',
    status       TEXT DEFAULT 'todo'
                    CHECK (status IN ('todo','in-progress','blocked','review','done')),
    importance   TEXT DEFAULT 'low'
                    CHECK (importance IN ('low','medium','high','urgent')),
    tags         JSONB DEFAULT '[]'::jsonb,
    due_date     TEXT,
    subtasks     JSONB DEFAULT '[]'::jsonb,
    time_spent   INTEGER DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status  ON tasks(status);

-- Timer sessions table
CREATE TABLE IF NOT EXISTS timer_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL,
    task_id      UUID REFERENCES tasks(id) ON DELETE SET NULL,
    type         TEXT DEFAULT 'stopwatch'
                    CHECK (type IN ('pomodoro','stopwatch','countdown','manual')),
    duration     INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_id ON timer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_task_id ON timer_sessions(task_id);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL,
    title      TEXT NOT NULL,
    content    TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- ==========================================
-- Row Level Security (RLS) Policies
-- Enables defense-in-depth by enforcing user_id ownership at the DB level.
-- Backend still performs server-side validation.
-- ==========================================

ALTER TABLE goals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes           ENABLE ROW LEVEL SECURITY;

-- Goals Policies
DROP POLICY IF EXISTS "Goals Select Policy" ON goals;
CREATE POLICY "Goals Select Policy" ON goals FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Goals Insert Policy" ON goals;
CREATE POLICY "Goals Insert Policy" ON goals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Goals Update Policy" ON goals;
CREATE POLICY "Goals Update Policy" ON goals FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Goals Delete Policy" ON goals;
CREATE POLICY "Goals Delete Policy" ON goals FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Tasks Policies
DROP POLICY IF EXISTS "Tasks Select Policy" ON tasks;
CREATE POLICY "Tasks Select Policy" ON tasks FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Tasks Insert Policy" ON tasks;
CREATE POLICY "Tasks Insert Policy" ON tasks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Tasks Update Policy" ON tasks;
CREATE POLICY "Tasks Update Policy" ON tasks FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Tasks Delete Policy" ON tasks;
CREATE POLICY "Tasks Delete Policy" ON tasks FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Timer Sessions Policies
DROP POLICY IF EXISTS "Timer Sessions Select Policy" ON timer_sessions;
CREATE POLICY "Timer Sessions Select Policy" ON timer_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Timer Sessions Insert Policy" ON timer_sessions;
CREATE POLICY "Timer Sessions Insert Policy" ON timer_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Timer Sessions Update Policy" ON timer_sessions;
CREATE POLICY "Timer Sessions Update Policy" ON timer_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Timer Sessions Delete Policy" ON timer_sessions;
CREATE POLICY "Timer Sessions Delete Policy" ON timer_sessions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Notes Policies
DROP POLICY IF EXISTS "Notes Select Policy" ON notes;
CREATE POLICY "Notes Select Policy" ON notes FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Notes Insert Policy" ON notes;
CREATE POLICY "Notes Insert Policy" ON notes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Notes Update Policy" ON notes;
CREATE POLICY "Notes Update Policy" ON notes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Notes Delete Policy" ON notes;
CREATE POLICY "Notes Delete Policy" ON notes FOR DELETE TO authenticated USING (user_id = auth.uid());
