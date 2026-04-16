-- ==========================================
-- TASK TRACKER — Supabase PostgreSQL Schema
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

-- Disable Row Level Security (the server authenticates via service-role key)
ALTER TABLE goals           DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           DISABLE ROW LEVEL SECURITY;
ALTER TABLE timer_sessions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes           DISABLE ROW LEVEL SECURITY;
