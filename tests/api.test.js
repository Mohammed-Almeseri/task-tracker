// ==========================================
// TASK TRACKER — API Test Suite
// ==========================================

const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Use a separate test data file so we never touch production data
const TEST_DATA_FILE = path.join(__dirname, '..', 'data.test.json');

// Override config BEFORE requiring app
process.env.DATA_FILE = TEST_DATA_FILE;

const { app } = require('../server');

// ---- Helpers ----

function resetData(data = { goals: [], timerSessions: [], notes: [] }) {
    fs.writeFileSync(TEST_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

afterAll(() => {
    // Clean up test data file
    try { fs.unlinkSync(TEST_DATA_FILE); } catch (e) { /* ignore */ }
});

// ==========================================
// GOALS API
// ==========================================

describe('Goals API', () => {
    beforeEach(() => resetData());

    test('POST /api/goals creates a new goal and returns 201', async () => {
        const res = await request(app)
            .post('/api/goals')
            .send({ title: 'Learn JavaScript', description: 'Master the fundamentals' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe('Learn JavaScript');
        expect(res.body.description).toBe('Master the fundamentals');
        expect(res.body.tasks).toEqual([]);
        expect(res.body).toHaveProperty('createdAt');
    });

    test('POST /api/goals with empty title returns 400', async () => {
        const res = await request(app)
            .post('/api/goals')
            .send({ title: '', description: 'No title' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(res.body).toHaveProperty('details');
    });

    test('POST /api/goals with missing title returns 400', async () => {
        const res = await request(app)
            .post('/api/goals')
            .send({ description: 'No title field at all' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/invalid/i);
    });

    test('GET /api/goals returns all goals', async () => {
        await request(app).post('/api/goals').send({ title: 'Goal A' });
        await request(app).post('/api/goals').send({ title: 'Goal B' });

        const res = await request(app).get('/api/goals');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].title).toBe('Goal A');
        expect(res.body[1].title).toBe('Goal B');
    });

    test('GET /api/goals/:id returns a single goal', async () => {
        const created = await request(app).post('/api/goals').send({ title: 'Solo Goal' });
        const res = await request(app).get(`/api/goals/${created.body.id}`);

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Solo Goal');
    });

    test('GET /api/goals/:id with nonexistent id returns 404', async () => {
        const res = await request(app).get('/api/goals/nonexistent-id');

        expect(res.status).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    test('PUT /api/goals/:id updates a goal', async () => {
        const created = await request(app).post('/api/goals').send({ title: 'Old Title' });
        const res = await request(app)
            .put(`/api/goals/${created.body.id}`)
            .send({ title: 'New Title', description: 'Updated desc' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('New Title');
        expect(res.body.description).toBe('Updated desc');
    });

    test('PUT /api/goals/:id with nonexistent id returns 404', async () => {
        const res = await request(app)
            .put('/api/goals/fake-id')
            .send({ title: 'Nope' });

        expect(res.status).toBe(404);
    });

    test('DELETE /api/goals/:id removes the goal and returns 204', async () => {
        const created = await request(app).post('/api/goals').send({ title: 'To Delete' });

        const delRes = await request(app).delete(`/api/goals/${created.body.id}`);
        expect(delRes.status).toBe(204);

        const getRes = await request(app).get('/api/goals');
        expect(getRes.body).toHaveLength(0);
    });

    test('DELETE /api/goals/:id with nonexistent id returns 404', async () => {
        const res = await request(app).delete('/api/goals/nonexistent');
        expect(res.status).toBe(404);
    });
});

// ==========================================
// TASKS API
// ==========================================

describe('Tasks API', () => {
    let goalId;

    beforeEach(async () => {
        resetData();
        const res = await request(app).post('/api/goals').send({ title: 'Test Goal' });
        goalId = res.body.id;
    });

    test('POST /api/goals/:id/tasks creates a task under a goal', async () => {
        const res = await request(app)
            .post(`/api/goals/${goalId}/tasks`)
            .send({ title: 'Task One', importance: 'high', status: 'todo' });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Task One');
        expect(res.body.importance).toBe('high');
        expect(res.body.status).toBe('todo');
        expect(res.body.goalId).toBe(goalId);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('createdAt');
        expect(res.body.timeSpent).toBe(0);
    });

    test('POST /api/goals/:id/tasks with empty title returns 400', async () => {
        const res = await request(app)
            .post(`/api/goals/${goalId}/tasks`)
            .send({ title: '' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('POST /api/goals/:id/tasks with nonexistent goal returns 404', async () => {
        const res = await request(app)
            .post('/api/goals/fake-goal-id/tasks')
            .send({ title: 'Orphan Task' });

        expect(res.status).toBe(404);
    });

    test('POST /api/goals/:id/tasks with tags, dueDate, subtasks', async () => {
        const res = await request(app)
            .post(`/api/goals/${goalId}/tasks`)
            .send({
                title: 'Rich Task',
                tags: ['coding', 'web'],
                dueDate: '2026-04-01',
                subtasks: [{ id: '1', text: 'Sub A', done: false }]
            });

        expect(res.status).toBe(201);
        expect(res.body.tags).toEqual(['coding', 'web']);
        expect(res.body.dueDate).toBe('2026-04-01');
        expect(res.body.subtasks).toHaveLength(1);
        expect(res.body.subtasks[0].text).toBe('Sub A');
    });

    test('PUT /api/tasks/:id updates task fields', async () => {
        const created = await request(app)
            .post(`/api/goals/${goalId}/tasks`)
            .send({ title: 'Original', importance: 'low', status: 'todo' });

        const res = await request(app)
            .put(`/api/tasks/${created.body.id}`)
            .send({ title: 'Updated', importance: 'urgent', status: 'in-progress' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated');
        expect(res.body.importance).toBe('urgent');
        expect(res.body.status).toBe('in-progress');
    });

    test('PUT /api/tasks/:id status to "done" sets completedAt', async () => {
        const created = await request(app)
            .post(`/api/goals/${goalId}/tasks`)
            .send({ title: 'Complete Me', status: 'todo' });

        const res = await request(app)
            .put(`/api/tasks/${created.body.id}`)
            .send({ status: 'done' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('done');
        expect(res.body.completedAt).toBeTruthy();
    });

    test('PUT /api/tasks/:id status from "done" back to "todo" clears completedAt', async () => {
        const created = await request(app)
            .post(`/api/goals/${goalId}/tasks`)
            .send({ title: 'Toggle Status', status: 'todo' });

        // Mark done
        await request(app).put(`/api/tasks/${created.body.id}`).send({ status: 'done' });

        // Mark undone
        const res = await request(app)
            .put(`/api/tasks/${created.body.id}`)
            .send({ status: 'todo' });

        expect(res.body.completedAt).toBeNull();
    });

    test('PUT /api/tasks/:id with invalid status returns 400', async () => {
        const created = await request(app)
            .post(`/api/goals/${goalId}/tasks`)
            .send({ title: 'Bad Status' });

        const res = await request(app)
            .put(`/api/tasks/${created.body.id}`)
            .send({ status: 'invalid-status' });

        expect(res.status).toBe(400);
    });

    test('PUT /api/tasks/:id with nonexistent id returns 404', async () => {
        const res = await request(app)
            .put('/api/tasks/no-such-task')
            .send({ title: 'Nope' });

        expect(res.status).toBe(404);
    });

    test('DELETE /api/tasks/:id removes the task', async () => {
        const created = await request(app)
            .post(`/api/goals/${goalId}/tasks`)
            .send({ title: 'Delete Me' });

        const delRes = await request(app).delete(`/api/tasks/${created.body.id}`);
        expect(delRes.status).toBe(204);

        // Verify task is gone from the goal
        const goalRes = await request(app).get(`/api/goals/${goalId}`);
        expect(goalRes.body.tasks).toHaveLength(0);
    });

    test('DELETE /api/tasks/:id with nonexistent id returns 404', async () => {
        const res = await request(app).delete('/api/tasks/nonexistent');
        expect(res.status).toBe(404);
    });
});

// ==========================================
// NOTES API
// ==========================================

describe('Notes API', () => {
    beforeEach(() => resetData());

    test('POST /api/notes creates a note and returns 201', async () => {
        const res = await request(app)
            .post('/api/notes')
            .send({ title: 'Meeting Notes', content: 'Discussed project timeline' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe('Meeting Notes');
        expect(res.body.content).toBe('Discussed project timeline');
        expect(res.body).toHaveProperty('createdAt');
        expect(res.body).toHaveProperty('updatedAt');
    });

    test('POST /api/notes with empty title returns 400', async () => {
        const res = await request(app)
            .post('/api/notes')
            .send({ title: '' });

        expect(res.status).toBe(400);
    });

    test('GET /api/notes returns all notes', async () => {
        await request(app).post('/api/notes').send({ title: 'Note 1' });
        await request(app).post('/api/notes').send({ title: 'Note 2' });

        const res = await request(app).get('/api/notes');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
    });

    test('PUT /api/notes/:id updates a note', async () => {
        const created = await request(app).post('/api/notes').send({ title: 'Old Note' });

        const res = await request(app)
            .put(`/api/notes/${created.body.id}`)
            .send({ title: 'Updated Note', content: 'New content' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated Note');
        expect(res.body.content).toBe('New content');
    });

    test('DELETE /api/notes/:id removes the note', async () => {
        const created = await request(app).post('/api/notes').send({ title: 'To Remove' });

        const delRes = await request(app).delete(`/api/notes/${created.body.id}`);
        expect(delRes.status).toBe(204);

        const getRes = await request(app).get('/api/notes');
        expect(getRes.body).toHaveLength(0);
    });

    test('DELETE /api/notes/:id with nonexistent id returns 404', async () => {
        const res = await request(app).delete('/api/notes/nonexistent');
        expect(res.status).toBe(404);
    });
});

// ==========================================
// TIMER SESSIONS API
// ==========================================

describe('Timer Sessions API', () => {
    beforeEach(() => resetData());

    test('POST /api/timer-sessions creates a session', async () => {
        const res = await request(app)
            .post('/api/timer-sessions')
            .send({ type: 'pomodoro', duration: 1500 });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.type).toBe('pomodoro');
        expect(res.body.duration).toBe(1500);
        expect(res.body).toHaveProperty('completedAt');
    });

    test('POST /api/timer-sessions with taskId increments task timeSpent', async () => {
        // Create a goal and task first
        const goal = await request(app).post('/api/goals').send({ title: 'Timer Goal' });
        const task = await request(app)
            .post(`/api/goals/${goal.body.id}/tasks`)
            .send({ title: 'Timed Task' });

        // Log a timer session linked to the task
        await request(app)
            .post('/api/timer-sessions')
            .send({ taskId: task.body.id, type: 'pomodoro', duration: 300 });

        // Verify task timeSpent was incremented
        const goalRes = await request(app).get(`/api/goals/${goal.body.id}`);
        const updatedTask = goalRes.body.tasks.find(t => t.id === task.body.id);
        expect(updatedTask.timeSpent).toBe(300);
    });

    test('GET /api/timer-sessions returns all sessions', async () => {
        await request(app).post('/api/timer-sessions').send({ type: 'stopwatch', duration: 600 });
        await request(app).post('/api/timer-sessions').send({ type: 'countdown', duration: 900 });

        const res = await request(app).get('/api/timer-sessions');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
    });
});

// ==========================================
// STATS API
// ==========================================

describe('Stats API', () => {
    beforeEach(() => resetData());

    test('GET /api/stats returns expected fields with empty data', async () => {
        const res = await request(app).get('/api/stats');

        expect(res.status).toBe(200);
        expect(res.body.totalGoals).toBe(0);
        expect(res.body.totalTasks).toBe(0);
        expect(res.body.streak).toBe(0);
        expect(res.body.totalTimerSessions).toBe(0);
        expect(res.body).toHaveProperty('tasksByStatus');
        expect(res.body).toHaveProperty('tasksByImportance');
        expect(res.body).toHaveProperty('completionTrend');
        expect(res.body).toHaveProperty('heatmapData');
        expect(res.body).toHaveProperty('goalsProgress');
        expect(res.body).toHaveProperty('timeByGoal');
    });

    test('GET /api/stats reflects correct counts after creating data', async () => {
        const goal = await request(app).post('/api/goals').send({ title: 'Stats Goal' });
        await request(app).post(`/api/goals/${goal.body.id}/tasks`).send({ title: 'T1', status: 'todo', importance: 'high' });
        await request(app).post(`/api/goals/${goal.body.id}/tasks`).send({ title: 'T2', status: 'done', importance: 'low' });
        await request(app).post('/api/timer-sessions').send({ type: 'pomodoro', duration: 600 });

        const res = await request(app).get('/api/stats');

        expect(res.body.totalGoals).toBe(1);
        expect(res.body.totalTasks).toBe(2);
        expect(res.body.tasksByStatus.todo).toBe(1);
        expect(res.body.tasksByStatus.done).toBe(1);
        expect(res.body.tasksByImportance.high).toBe(1);
        expect(res.body.tasksByImportance.low).toBe(1);
        expect(res.body.totalTimerSessions).toBe(1);
        expect(res.body.goalsProgress).toHaveLength(1);
        expect(res.body.goalsProgress[0].percent).toBe(50);
    });

    test('GET /api/stats completion trend has 30 entries', async () => {
        const res = await request(app).get('/api/stats');
        expect(res.body.completionTrend).toHaveLength(30);
    });
});

// ==========================================
// EXPORT API
// ==========================================

describe('Export API', () => {
    beforeEach(async () => {
        resetData();
        const goal = await request(app).post('/api/goals').send({ title: 'Export Goal' });
        await request(app).post(`/api/goals/${goal.body.id}/tasks`).send({ title: 'Export Task', status: 'in-progress', importance: 'medium' });
    });

    test('GET /api/export/json returns attachment with full data', async () => {
        const res = await request(app).get('/api/export/json');

        expect(res.status).toBe(200);
        expect(res.headers['content-disposition']).toMatch(/attachment.*tasktracker-export\.json/);
        expect(res.body).toHaveProperty('goals');
        expect(res.body.goals).toHaveLength(1);
        expect(res.body.goals[0].tasks).toHaveLength(1);
    });

    test('GET /api/export/csv returns CSV with correct headers', async () => {
        const res = await request(app).get('/api/export/csv');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/csv/);
        expect(res.headers['content-disposition']).toMatch(/attachment.*tasktracker-export\.csv/);

        const lines = res.text.split('\n');
        expect(lines[0]).toBe('Goal,Title,Status,Importance,Due Date,Time Spent (s),Tags,Created,Completed');
        expect(lines).toHaveLength(2); // header + 1 task
    });

    test('GET /api/export/csv includes task data with goal name', async () => {
        const res = await request(app).get('/api/export/csv');
        const dataLine = res.text.split('\n')[1];

        expect(dataLine).toContain('Export Goal');
        expect(dataLine).toContain('Export Task');
        expect(dataLine).toContain('in-progress');
        expect(dataLine).toContain('medium');
    });
});

// ==========================================
// ERROR HANDLING
// ==========================================

describe('Error Handling', () => {
    beforeEach(() => resetData());

    test('unknown API route returns 404 with error message', async () => {
        const res = await request(app).get('/api/nonexistent-route');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toMatch(/route not found/i);
    });

    test('invalid JSON body returns 400', async () => {
        const res = await request(app)
            .post('/api/goals')
            .set('Content-Type', 'application/json')
            .send('{ invalid json }');

        expect(res.status).toBe(400);
    });

    test('validation errors include structured details', async () => {
        const res = await request(app)
            .post('/api/goals')
            .send({ title: 123 }); // title must be string

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(res.body).toHaveProperty('details');
        expect(Array.isArray(res.body.details)).toBe(true);
    });
});

// ==========================================
// RESTORE API
// ==========================================

describe('Restore API', () => {
    beforeEach(() => resetData());

    test('POST /api/restore replaces all data and returns 200', async () => {
        // Seed some initial data
        await request(app).post('/api/goals').send({ title: 'Old Goal' });

        // Restore with new data
        const backupData = {
            goals: [{ id: 'g1', title: 'Restored Goal', description: '', createdAt: new Date().toISOString(), tasks: [] }],
            timerSessions: [],
            notes: [{ id: 'n1', title: 'Restored Note', content: 'Hello', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
            workspaces: []
        };

        const res = await request(app)
            .post('/api/restore')
            .send(backupData);

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/restored/i);
        expect(res.body).toHaveProperty('safetyBackup');

        // Verify restored data is now accessible
        const goalsRes = await request(app).get('/api/goals');
        expect(goalsRes.body).toHaveLength(1);
        expect(goalsRes.body[0].title).toBe('Restored Goal');

        const notesRes = await request(app).get('/api/notes');
        expect(notesRes.body).toHaveLength(1);
        expect(notesRes.body[0].title).toBe('Restored Note');
    });

    test('POST /api/restore with missing goals array returns 400', async () => {
        const res = await request(app)
            .post('/api/restore')
            .send({ notes: [] });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/goals/i);
    });

    test('POST /api/restore with non-object body returns 400', async () => {
        const res = await request(app)
            .post('/api/restore')
            .set('Content-Type', 'application/json')
            .send('"just a string"');

        expect(res.status).toBe(400);
    });

    test('POST /api/restore creates a safety backup before overwriting', async () => {
        // Create data that will be backed up
        await request(app).post('/api/goals').send({ title: 'Will Be Backed Up' });

        const backupsBefore = fs.existsSync(path.join(__dirname, '..', 'backups'))
            ? fs.readdirSync(path.join(__dirname, '..', 'backups')).length
            : 0;

        await request(app)
            .post('/api/restore')
            .send({ goals: [], timerSessions: [], notes: [], workspaces: [] });

        const backupsAfter = fs.readdirSync(path.join(__dirname, '..', 'backups')).length;
        expect(backupsAfter).toBeGreaterThan(backupsBefore);
    });
});
