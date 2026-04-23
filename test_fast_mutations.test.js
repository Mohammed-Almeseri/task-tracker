/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

function loadScript(filePath) {
    window.eval(fs.readFileSync(filePath, 'utf8'));
}

describe('Fast save mutations', () => {
    beforeAll(() => {
        loadScript(path.join(__dirname, 'public', 'app.js'));
        loadScript(path.join(__dirname, 'public', 'notes.js'));
        loadScript(path.join(__dirname, 'public', 'settings.js'));
    });

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="modal-goal" class="modal-overlay"></div>
            <button id="modal-goal-save">Save Goal</button>
            <input id="goal-title-input" />
            <textarea id="goal-desc-input"></textarea>

            <div id="modal-task" class="modal-overlay"></div>
            <button id="modal-task-save">Save Task</button>
            <input id="task-title-input" />
            <textarea id="task-desc-input"></textarea>
            <select id="task-importance-input"><option value="low">low</option></select>
            <select id="task-status-input"><option value="todo">todo</option></select>
            <input id="task-tags-input" />
            <input id="task-duedate-input" />
            <div id="task-goal-selector-group"></div>
            <select id="task-goal-select"></select>

            <div id="modal-note" class="modal-overlay"></div>
            <button id="modal-note-save">Save Note</button>
            <input id="note-title-input" />
            <div id="note-editor-container"></div>

            <button id="btn-log-manual-time">Log Time</button>
            <select id="manual-task-select">
                <option value="">— Select a task —</option>
                <option value="task-1">Goal A → Task One</option>
            </select>
            <input id="manual-duration-input" />
        `;        

        window.requestAnimationFrame = (callback) => callback();
        window.localStorage.clear();
        window.dashboardRefreshPromise = null;
        window.dashboardRefreshQueued = false;

        window.apiPost = jest.fn(() => Promise.resolve({}));
        window.apiPut = jest.fn(() => Promise.resolve({}));
        window.apiDelete = jest.fn(() => Promise.resolve({}));
        window.loadGoals = jest.fn(() => Promise.resolve());
        window.loadNotes = jest.fn(() => Promise.resolve());
        window.loadDashboard = jest.fn(() => Promise.resolve());
        window.showToast = jest.fn();
        window.logSystemEvent = jest.fn();

        window.goals = [
            {
                id: 'goal-1',
                title: 'Goal A',
                description: '',
                tasks: [
                    {
                        id: 'task-1',
                        goalId: 'goal-1',
                        title: 'Task One',
                        description: '',
                        status: 'todo',
                        importance: 'low',
                        tags: [],
                        dueDate: null,
                        subtasks: [],
                        timeSpent: 0
                    }
                ]
            }
        ];

        window.eval(`
            notes = [];
            editingNote = false;
            currentNoteId = null;
            noteEditor = {
                getMarkdown() {
                    return 'Note body';
                },
                setMarkdown() {}
            };
        `);

        window.editingTask = false;
        window.openedFromManage = false;
        window.currentGoalId = 'goal-1';
        window.currentTaskId = null;
        window.modalSubtasks = [];
        window.editingGoal = false;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('saveTask updates local task state without reloading goals', async () => {
        document.getElementById('task-title-input').value = 'Task Two';
        document.getElementById('task-desc-input').value = 'Details';

        window.apiPost.mockResolvedValueOnce({
            id: 'task-2',
            goalId: 'goal-1',
            title: 'Task Two',
            description: 'Details',
            status: 'todo',
            importance: 'low',
            tags: [],
            dueDate: null,
            subtasks: [],
            timeSpent: 0
        });

        await window.saveTask();

        expect(window.loadGoals).not.toHaveBeenCalled();
        expect(window.loadDashboard).toHaveBeenCalled();
        expect(window.goals[0].tasks).toHaveLength(2);
        expect(window.goals[0].tasks[1].title).toBe('Task Two');
        expect(window.apiPost).toHaveBeenCalledWith('/api/goals/goal-1/tasks', expect.objectContaining({
            title: 'Task Two',
            description: 'Details'
        }));
    });

    test('saveGoal updates local goal state without reloading goals', async () => {
        document.getElementById('goal-title-input').value = 'Goal B';
        document.getElementById('goal-desc-input').value = 'More detail';
        window.currentGoalId = null;

        window.apiPost.mockResolvedValueOnce({
            id: 'goal-2',
            title: 'Goal B',
            description: 'More detail',
            tasks: []
        });

        await window.saveGoal();

        expect(window.loadGoals).not.toHaveBeenCalled();
        expect(window.loadDashboard).toHaveBeenCalled();
        expect(window.goals).toHaveLength(2);
        expect(window.goals[1].title).toBe('Goal B');
        expect(window.apiPost).toHaveBeenCalledWith('/api/goals', {
            title: 'Goal B',
            description: 'More detail'
        });
    });

    test('saveManualTime updates local time without reloading goals', async () => {
        document.getElementById('manual-task-select').value = 'task-1';
        document.getElementById('manual-duration-input').value = '45';

        window.apiPost.mockResolvedValueOnce({});

        await window.saveManualTime();

        expect(window.loadGoals).not.toHaveBeenCalled();
        expect(window.loadDashboard).toHaveBeenCalled();
        expect(window.goals[0].tasks[0].timeSpent).toBe(2700);
        expect(window.apiPost).toHaveBeenCalledWith('/api/timer-sessions', {
            taskId: 'task-1',
            type: 'manual',
            duration: 2700
        });
    });

    test('saveNote updates local notes without reloading notes', async () => {
        document.getElementById('note-title-input').value = 'New Note';

        window.apiPost.mockResolvedValueOnce({
            id: 'note-1',
            title: 'New Note',
            content: 'Note body',
            createdAt: '2026-04-23T00:00:00.000Z',
            updatedAt: '2026-04-23T00:00:00.000Z'
        });

        await window.saveNote();

        expect(window.loadNotes).not.toHaveBeenCalled();
        expect(window.loadDashboard).not.toHaveBeenCalled();
        const notesState = window.eval('notes');
        expect(notesState).toHaveLength(1);
        expect(notesState[0].title).toBe('New Note');
        expect(window.apiPost).toHaveBeenCalledWith('/api/notes', {
            title: 'New Note',
            content: 'Note body'
        });
    });
});
