/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('Timer background drift sync', () => {
    let now;
    let nowSpy;

    function setCoreGlobals() {
        window.timerMode = 'pomodoro';
        window.timerRunning = false;
        window.timerInterval = null;

        window.timerStates = {
            pomodoro: { seconds: 25 * 60, total: 25 * 60, session: 1, isBreak: false, label: 'FOCUS' },
            stopwatch: { seconds: 0, laps: [] },
            countdown: { seconds: 30 * 60, total: 30 * 60, label: 'COUNTDOWN' }
        };

        window.timerSeconds = window.timerStates.pomodoro.seconds;
        window.timerTotalSeconds = window.timerStates.pomodoro.total;
        window.stopwatchSeconds = 0;
        window.laps = [];
        window.pomodoroSession = 1;
        window.pomodoroIsBreak = false;
        window.goals = [];

        window.loadGoals = jest.fn();
        window.apiPost = jest.fn(() => Promise.resolve({}));
        window.formatTimeDisplay = jest.fn((seconds) => {
            const s = Math.max(0, Number(seconds) || 0);
            const hh = String(Math.floor(s / 3600)).padStart(2, '0');
            const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
            const ss = String(s % 60).padStart(2, '0');
            return `${hh}:${mm}:${ss}`;
        });
    }

    function loadTimerModule() {
        const timerPath = path.join(__dirname, 'public', 'timer.js');
        const timerCode = fs.readFileSync(timerPath, 'utf8');
        window.eval(timerCode);
    }

    beforeEach(() => {
        jest.useFakeTimers();

        document.body.innerHTML = `
            <button id="timer-start" class="btn-primary"></button>
            <button id="timer-reset"></button>
            <button id="timer-lap"></button>
            <div id="timer-display"></div>
            <svg><circle id="timer-ring-progress"></circle></svg>
            <div id="timer-label">FOCUS</div>
            <div id="countdown-input" style="display:none"></div>
            <input id="countdown-minutes" value="30" />
            <div id="laps-container" style="display:none"></div>
            <ul id="laps-list"></ul>
            <div id="pomodoro-info" style="display:none"></div>
            <div id="pomodoro-count"></div>
            <div id="pomodoro-dots"></div>
            <select id="timer-task-select"></select>
            <button class="timer-tab" data-mode="pomodoro"></button>
            <button class="timer-tab" data-mode="stopwatch"></button>
            <button class="timer-tab" data-mode="countdown"></button>
        `;

        Object.defineProperty(document, 'hidden', {
            configurable: true,
            value: false,
            writable: true
        });

        now = 1_000_000;
        nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);

        setCoreGlobals();
        loadTimerModule();
    });

    afterEach(() => {
        if (window.timerRunning && typeof window.stopTimer === 'function') {
            window.stopTimer(true);
        }

        jest.clearAllTimers();
        jest.useRealTimers();

        if (nowSpy) {
            nowSpy.mockRestore();
        }
    });

    test('stopwatch catches up using wall-clock elapsed time', () => {
        window.timerMode = 'stopwatch';
        window.stopwatchSeconds = 0;

        window.startTimer();
        now += 6500;

        window.syncActiveTimerWithClock();

        expect(window.stopwatchSeconds).toBe(6);
    });

    test('countdown catches up after delayed background period', () => {
        window.timerMode = 'countdown';
        window.timerSeconds = 120;
        window.timerTotalSeconds = 120;

        window.startTimer();
        now += 30000;

        window.syncActiveTimerWithClock();

        expect(window.timerSeconds).toBe(90);
    });

    test('visibilitychange resumes with an immediate sync', () => {
        window.initTimer();

        window.timerMode = 'stopwatch';
        window.stopwatchSeconds = 0;
        window.startTimer();

        now += 4000;
        document.hidden = false;
        document.dispatchEvent(new Event('visibilitychange'));

        expect(window.stopwatchSeconds).toBe(4);
    });
});
