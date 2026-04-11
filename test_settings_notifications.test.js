/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('Settings time logging notifications', () => {
    beforeEach(() => {
        jest.useFakeTimers();

        document.body.innerHTML = `
            <div id="toast-container" class="toast-container"></div>
            <select id="manual-task-select">
                <option value="">— Select a task —</option>
                <option value="task-1">Goal A → Task 1</option>
            </select>
            <input id="manual-duration-input" value="60" />
        `;

        window.requestAnimationFrame = (callback) => callback();

        const appPath = path.join(__dirname, 'public', 'app.js');
        const settingsPath = path.join(__dirname, 'public', 'settings.js');
        window.eval(fs.readFileSync(appPath, 'utf8'));
        window.eval(fs.readFileSync(settingsPath, 'utf8'));

        window.apiPost = jest.fn(() => Promise.resolve({}));
        window.loadGoals = jest.fn(() => Promise.resolve());
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    test('shows a success toast after logging manual time', async () => {
        document.getElementById('manual-task-select').value = 'task-1';

        await window.saveManualTime();

        const toast = document.querySelector('#toast-container .toast');
        expect(toast).not.toBeNull();
        expect(toast.classList.contains('toast-success')).toBe(true);
        expect(toast.textContent).toContain('Logged 60m to task');
        expect(window.apiPost).toHaveBeenCalledWith('/api/timer-sessions', {
            taskId: 'task-1',
            type: 'manual',
            duration: 3600
        });
    });
});