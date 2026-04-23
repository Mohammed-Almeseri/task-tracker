// Timer feature module

var timerAnchorMs = null;
var stopwatchAnchorMs = null;

function getTimerTaskStorageKey() {
    return typeof getScopedStorageKey === 'function' ? getScopedStorageKey('task_tracker_timer_selected_task') : 'task_tracker_timer_selected_task';
}

function getTimerStateStorageKey() {
    return typeof getScopedStorageKey === 'function' ? getScopedStorageKey('task_tracker_runtime_state_v1') : 'task_tracker_runtime_state_v1';
}

function nowMs() {
    return Date.now();
}

function elapsedWholeSeconds(anchorMs) {
    if (!anchorMs) return 0;
    return Math.floor((nowMs() - anchorMs) / 1000);
}

function syncActiveTimerWithClock() {
    if (!timerRunning) return;
    if (timerMode === 'pomodoro') {
        tickPomodoro();
    } else if (timerMode === 'stopwatch') {
        tickStopwatch();
    } else if (timerMode === 'countdown') {
        tickCountdown();
    }
}

    function refreshDashboardFocusCard() {
        if (typeof renderUpNext !== 'function' || typeof getAllTasks !== 'function') return;
        const dashboardView = document.getElementById('view-dashboard');
        if (!dashboardView || !dashboardView.classList.contains('active')) return;
        renderUpNext(getAllTasks());
    }

function persistTimerRuntimeState() {
    try {
        const timerSelect = document.getElementById('timer-task-select');
        const selectedTaskId = timerSelect ? (timerSelect.value || '') : (localStorage.getItem(getTimerTaskStorageKey()) || '');
        const timerLabel = document.getElementById('timer-label');

        const snapshot = {
            mode: timerMode,
            running: timerRunning,
            timerStates,
            timerSeconds,
            timerTotalSeconds,
            stopwatchSeconds,
            laps,
            pomodoroSession,
            pomodoroIsBreak,
            timerAnchorMs,
            stopwatchAnchorMs,
            selectedTaskId,
            label: timerLabel ? timerLabel.textContent : ''
        };

        localStorage.setItem(getTimerStateStorageKey(), JSON.stringify(snapshot));
    } catch (err) {
        console.warn('Failed to persist timer state:', err);
    }
}

function applyTimerModeUi(mode) {
    document.querySelectorAll('.timer-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`[data-mode="${mode}"]`);
    if (activeTab) activeTab.classList.add('active');

    document.getElementById('countdown-input').style.display = mode === 'countdown' ? 'flex' : 'none';
    document.getElementById('timer-lap').style.display = mode === 'stopwatch' ? 'inline-flex' : 'none';
    document.getElementById('laps-container').style.display = mode === 'stopwatch' ? 'block' : 'none';
    document.getElementById('pomodoro-info').style.display = mode === 'pomodoro' ? 'flex' : 'none';
}

function resumeTimerInterval() {
    clearInterval(timerInterval);
    timerInterval = null;

    if (!timerRunning) return;

    if (timerMode === 'pomodoro') timerInterval = setInterval(tickPomodoro, 1000);
    else if (timerMode === 'stopwatch') timerInterval = setInterval(tickStopwatch, 1000);
    else if (timerMode === 'countdown') timerInterval = setInterval(tickCountdown, 1000);
}

function restoreTimerRuntimeState() {
    try {
        const raw = localStorage.getItem(getTimerStateStorageKey());
        if (!raw) return;

        const saved = JSON.parse(raw);
        const allowedModes = ['pomodoro', 'stopwatch', 'countdown'];
        const restoredMode = allowedModes.includes(saved.mode) ? saved.mode : 'pomodoro';

        if (saved && typeof saved === 'object' && saved.timerStates && typeof saved.timerStates === 'object') {
            timerStates = saved.timerStates;
        }

        timerMode = restoredMode;
        timerRunning = Boolean(saved.running);
        timerSeconds = Number.isFinite(saved.timerSeconds) ? saved.timerSeconds : timerSeconds;
        timerTotalSeconds = Number.isFinite(saved.timerTotalSeconds) ? saved.timerTotalSeconds : timerTotalSeconds;
        stopwatchSeconds = Number.isFinite(saved.stopwatchSeconds) ? saved.stopwatchSeconds : stopwatchSeconds;
        laps = Array.isArray(saved.laps) ? saved.laps : laps;
        pomodoroSession = Number.isFinite(saved.pomodoroSession) ? saved.pomodoroSession : pomodoroSession;
        pomodoroIsBreak = Boolean(saved.pomodoroIsBreak);
        timerAnchorMs = Number.isFinite(saved.timerAnchorMs) ? saved.timerAnchorMs : null;
        stopwatchAnchorMs = Number.isFinite(saved.stopwatchAnchorMs) ? saved.stopwatchAnchorMs : null;

        if (saved.selectedTaskId && typeof saved.selectedTaskId === 'string') {
            localStorage.setItem(getTimerTaskStorageKey(), saved.selectedTaskId);
        }

        applyTimerModeUi(timerMode);
        loadTimerState(timerMode);

        const timerLabel = document.getElementById('timer-label');
        if (timerLabel && typeof saved.label === 'string' && saved.label.trim()) {
            timerLabel.textContent = saved.label;
        }

        resumeTimerInterval();
        syncActiveTimerWithClock();
        persistTimerRuntimeState();
    } catch (err) {
        console.warn('Failed to restore timer state:', err);
    }
}

function initTimer() {
    document.querySelectorAll('.timer-tab').forEach(tab => { tab.addEventListener('click', () => switchTimerMode(tab.dataset.mode)); });
    document.getElementById('timer-start').addEventListener('click', toggleTimer);
    document.getElementById('timer-reset').addEventListener('click', resetTimer);
    document.getElementById('timer-lap').addEventListener('click', addLap);

    const timerTaskSelect = document.getElementById('timer-task-select');
    if (timerTaskSelect && !timerTaskSelect._selectionBound) {
        timerTaskSelect._selectionBound = true;
        timerTaskSelect.addEventListener('change', () => {
            localStorage.setItem(getTimerTaskStorageKey(), timerTaskSelect.value || '');
            persistTimerRuntimeState();
            if (typeof renderUpNext === 'function' && typeof getAllTasks === 'function') {
                renderUpNext(getAllTasks());
            }
        });
    }

    if (!window._timerVisibilitySyncBound) {
        window._timerVisibilitySyncBound = true;
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                syncActiveTimerWithClock();
                persistTimerRuntimeState();
            }
        });
    }

    restoreTimerRuntimeState();
}

function switchTimerMode(mode) {
    // Save current state before switching
    saveTimerState(timerMode);

    if (timerRunning) stopTimer();
    timerMode = mode;

    document.querySelectorAll('.timer-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    document.getElementById('countdown-input').style.display = mode === 'countdown' ? 'flex' : 'none';
    document.getElementById('timer-lap').style.display = mode === 'stopwatch' ? 'inline-flex' : 'none';
    document.getElementById('laps-container').style.display = mode === 'stopwatch' ? 'block' : 'none';
    document.getElementById('pomodoro-info').style.display = mode === 'pomodoro' ? 'flex' : 'none';

    // Load state for the new mode
    loadTimerState(mode);
    persistTimerRuntimeState();
        refreshDashboardFocusCard();
}

function saveTimerState(mode) {
    if (timerRunning && mode === timerMode) {
        syncActiveTimerWithClock();
    }

    if (mode === 'pomodoro') {
        timerStates.pomodoro.seconds = timerSeconds;
        timerStates.pomodoro.total = timerTotalSeconds;
        timerStates.pomodoro.session = pomodoroSession;
        timerStates.pomodoro.isBreak = pomodoroIsBreak;
        timerStates.pomodoro.label = document.getElementById('timer-label').textContent;
    } else if (mode === 'stopwatch') {
        timerStates.stopwatch.seconds = stopwatchSeconds;
        timerStates.stopwatch.laps = [...laps];
    } else if (mode === 'countdown') {
        timerStates.countdown.seconds = timerSeconds;
        timerStates.countdown.total = timerTotalSeconds;
        timerStates.countdown.label = document.getElementById('timer-label').textContent;
    }

    persistTimerRuntimeState();
}

function loadTimerState(mode) {
    const state = timerStates[mode];
    if (mode === 'pomodoro') {
        timerSeconds = state.seconds;
        timerTotalSeconds = state.total;
        pomodoroSession = state.session;
        pomodoroIsBreak = state.isBreak;
        document.getElementById('timer-label').textContent = state.label;
        updatePomodoroInfo();
    } else if (mode === 'stopwatch') {
        stopwatchSeconds = state.seconds;
        laps = [...state.laps];
        renderLaps();
    } else if (mode === 'countdown') {
        timerSeconds = state.seconds;
        timerTotalSeconds = state.total;
        document.getElementById('timer-label').textContent = state.label;
    }

    updateTimerDisplay();
    updateTimerRing(mode === 'stopwatch' ? (stopwatchSeconds % 3600) / 3600 : timerSeconds / timerTotalSeconds);

    const btn = document.getElementById('timer-start');
    if (timerRunning) {
        btn.textContent = 'Pause'; btn.classList.remove('btn-primary'); btn.classList.add('btn-danger');
    } else {
        btn.textContent = timerSeconds === timerTotalSeconds && mode !== 'stopwatch' ? 'Start' : 'Resume';
        btn.classList.add('btn-primary'); btn.classList.remove('btn-danger');
    }
}

function renderLaps() {
    const list = document.getElementById('laps-list');
    list.innerHTML = '';
    laps.forEach((lap, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>Lap ${i + 1}</span><span>${formatTimeDisplay(lap)}</span>`;
        list.prepend(li);
    });
}

function toggleTimer() { timerRunning ? stopTimer() : startTimer(); }

function startTimer() {
    timerRunning = true;
    const btn = document.getElementById('timer-start');
    btn.textContent = 'Pause'; btn.classList.remove('btn-primary'); btn.classList.add('btn-danger');
    if (timerMode === 'pomodoro') {
        timerAnchorMs = nowMs();
        timerInterval = setInterval(tickPomodoro, 1000);
    }
    else if (timerMode === 'stopwatch') {
        stopwatchAnchorMs = nowMs();
        timerInterval = setInterval(tickStopwatch, 1000);
    }
    else if (timerMode === 'countdown') {
        if (timerSeconds <= 0) { const mins = parseInt(document.getElementById('countdown-minutes').value) || 30; timerSeconds = mins * 60; timerTotalSeconds = timerSeconds; }
        timerAnchorMs = nowMs();
        timerInterval = setInterval(tickCountdown, 1000);
    }

    persistTimerRuntimeState();
        refreshDashboardFocusCard();
}

function stopTimer(skipSync) {
    if (timerRunning && !skipSync) {
        syncActiveTimerWithClock();
    }

    timerRunning = false; clearInterval(timerInterval); timerInterval = null;
    timerAnchorMs = null;
    stopwatchAnchorMs = null;
    const btn = document.getElementById('timer-start');
    btn.textContent = 'Resume'; btn.classList.remove('btn-danger'); btn.classList.add('btn-primary');

    persistTimerRuntimeState();
        refreshDashboardFocusCard();
}

function resetTimer() {
    // If stopwatch was running with time, log it as a session before resetting
    if (timerMode === 'stopwatch' && stopwatchSeconds > 0) {
        logTimerSession('stopwatch', stopwatchSeconds);
    }

    stopTimer();
    laps = [];
    document.getElementById('laps-list').innerHTML = '';
    document.getElementById('timer-start').textContent = 'Start';

    if (timerMode === 'pomodoro') {
        pomodoroSession = 1;
        pomodoroIsBreak = false;
        timerSeconds = 25 * 60;
        timerTotalSeconds = 25 * 60;
        updatePomodoroInfo();
        document.getElementById('timer-label').textContent = 'FOCUS';
        // Sync to unified state
        saveTimerState('pomodoro');
    }
    else if (timerMode === 'stopwatch') {
        stopwatchSeconds = 0;
        timerTotalSeconds = 1;
        saveTimerState('stopwatch');
    }
    else if (timerMode === 'countdown') {
        const mins = parseInt(document.getElementById('countdown-minutes').value) || 30;
        timerSeconds = mins * 60;
        timerTotalSeconds = timerSeconds;
        document.getElementById('timer-label').textContent = 'COUNTDOWN';
        saveTimerState('countdown');
    }

    updateTimerDisplay();
    updateTimerRing(timerMode === 'stopwatch' ? 0 : 1);
    persistTimerRuntimeState();
        refreshDashboardFocusCard();
}

function tickPomodoro() {
    const elapsed = elapsedWholeSeconds(timerAnchorMs);
    if (elapsed <= 0) return;

    timerAnchorMs += elapsed * 1000;
    timerSeconds -= elapsed;

    updateTimerDisplay();
    updateTimerRing(Math.max(0, timerSeconds / timerTotalSeconds));

    if (timerSeconds <= 0) {
        timerSeconds = 0;
        stopTimer(true); logTimerSession('pomodoro', timerTotalSeconds);
        if (pomodoroIsBreak) { pomodoroIsBreak = false; pomodoroSession++; if (pomodoroSession > 4) pomodoroSession = 1; timerSeconds = 25 * 60; timerTotalSeconds = 25 * 60; document.getElementById('timer-label').textContent = 'FOCUS'; }
        else { pomodoroIsBreak = true; const bt = pomodoroSession === 4 ? 15 : 5; timerSeconds = bt * 60; timerTotalSeconds = timerSeconds; document.getElementById('timer-label').textContent = 'BREAK'; }
        updatePomodoroInfo(); updateTimerDisplay(); updateTimerRing(1);
    }

    persistTimerRuntimeState();
        refreshDashboardFocusCard();
}

function tickStopwatch() {
    const elapsed = elapsedWholeSeconds(stopwatchAnchorMs);
    if (elapsed <= 0) return;

    stopwatchAnchorMs += elapsed * 1000;
    stopwatchSeconds += elapsed;

    updateTimerDisplay();
    updateTimerRing((stopwatchSeconds % 3600) / 3600);
    persistTimerRuntimeState();
        refreshDashboardFocusCard();
}

function tickCountdown() {
    const elapsed = elapsedWholeSeconds(timerAnchorMs);
    if (elapsed <= 0) return;

    timerAnchorMs += elapsed * 1000;
    timerSeconds -= elapsed;

    updateTimerDisplay();
    updateTimerRing(Math.max(0, timerSeconds / timerTotalSeconds));

    if (timerSeconds <= 0) {
        timerSeconds = 0;
        stopTimer(true);
        logTimerSession('countdown', timerTotalSeconds);
        document.getElementById('timer-start').textContent = 'Start';
        updateTimerRing(0);
    }

    persistTimerRuntimeState();
        refreshDashboardFocusCard();
}

function addLap() {
    if (timerMode !== 'stopwatch' || !timerRunning) return;
    laps.push(stopwatchSeconds);
    const li = document.createElement('li');
    li.innerHTML = `<span>Lap ${laps.length}</span><span>${formatTimeDisplay(stopwatchSeconds)}</span>`;
    document.getElementById('laps-list').prepend(li);
}

function updateTimerDisplay() { document.getElementById('timer-display').textContent = formatTimeDisplay(timerMode === 'stopwatch' ? stopwatchSeconds : timerSeconds); }
function updateTimerRing(fraction) { const c = 2 * Math.PI * 90; document.getElementById('timer-ring-progress').style.strokeDashoffset = c * (1 - fraction); }
function updatePomodoroInfo() {
    document.getElementById('pomodoro-count').textContent = `Session ${pomodoroSession} of 4`;
    document.getElementById('pomodoro-dots').textContent = Array.from({ length: 4 }, (_, i) => i < pomodoroSession - (pomodoroIsBreak ? 0 : 1) ? '●' : '○').join(' ');
}
function populateTimerTaskSelect() {
    const select = document.getElementById('timer-task-select');
    if (!select) return;
    const savedSelection = localStorage.getItem(getTimerTaskStorageKey()) || '';
    select.innerHTML = '<option value="">— No task —</option>';
    for (const goal of goals) { for (const task of goal.tasks) { if (task.status !== 'done') { const opt = document.createElement('option'); opt.value = task.id; opt.textContent = `${goal.title} → ${task.title}`; select.appendChild(opt); } } }

    if (savedSelection && Array.from(select.options).some(option => option.value === savedSelection)) {
        select.value = savedSelection;
    } else if (savedSelection) {
        localStorage.removeItem(getTimerTaskStorageKey());
    }

    persistTimerRuntimeState();
}
async function logTimerSession(type, duration) {
    const timerTaskSelect = document.getElementById('timer-task-select');
    const taskId = timerTaskSelect ? timerTaskSelect.value || null : null;
    await apiPost('/api/timer-sessions', { taskId, type, duration });
    if (taskId) {
        const taskApplied = typeof adjustTaskTimeSpent === 'function'
            ? adjustTaskTimeSpent(taskId, duration)
            : false;
        if (!taskApplied && typeof loadGoals === 'function') {
            await loadGoals();
        } else if (typeof refreshTaskViews === 'function') {
            refreshTaskViews();
        }
    }
    if (typeof refreshDashboardData === 'function') {
        void refreshDashboardData();
    }
}
