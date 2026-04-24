// ==========================================
// TASK TRACKER — Full Feature Application
// ==========================================

const API = window.location.origin;
const AUTH_EMAIL_STORAGE_KEY = 'task_tracker_current_email';
const AUTH_TOKEN_STORAGE_KEY = 'task_tracker_supabase_access_token';
const EARLY_ACCESS_NOTICE_STORAGE_KEY = 'task_tracker_early_access_notice_seen';

function getCurrentUserKey() {
    return String(localStorage.getItem(AUTH_EMAIL_STORAGE_KEY) || 'anonymous').trim().toLowerCase() || 'anonymous';
}

function setCurrentUserEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    if (normalized) {
        localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, normalized);
    }
}

function getCurrentAccessToken() {
    return String(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || '').trim();
}

function clearCurrentAuthSession() {
    localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

function redirectToLogin() {
    window.location.replace('login.html');
}

function getScopedStorageKey(baseKey) {
    return `${baseKey}:${getCurrentUserKey()}`;
}

function buildAuthHeaders(extraHeaders = {}) {
    const headers = {
        ...extraHeaders
    };

    const accessToken = getCurrentAccessToken();
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    return headers;
}

async function ensureAuthenticatedSession() {
    const accessToken = getCurrentAccessToken();
    if (!accessToken) {
        redirectToLogin();
        return false;
    }

    try {
        const response = await fetch(API + '/api/auth/session', {
            method: 'POST',
            cache: 'no-store',
            headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ accessToken })
        });

        if (!response.ok) {
            throw new Error('Session validation failed');
        }

        const session = await response.json().catch(() => ({}));
        if (session?.email) {
            setCurrentUserEmail(session.email);
        }

        return true;
    } catch (error) {
        clearCurrentAuthSession();
        redirectToLogin();
        return false;
    }
}

// ---- SVG Icon Library (Lucide-style) ----
const ICONS = {
    target: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    checkSquare: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    timer: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="12" y2="8"/><circle cx="12" cy="14" r="8"/></svg>',
    hourglass: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>',
    clipboard: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>',
    targetLg: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    noteLg: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    checkCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    alertCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

var defaultSettings = {
    profileName: 'User',
    accentColor: 'purple',
    theme: 'dark',
    sidebarCollapsed: false,
    accents: {
        purple: '#8b5cf6',
        blue: '#3b82f6',
        green: '#10b981',
        orange: '#f59e0b',
        rose: '#f43f5e'
    }
};

var settings = { ...defaultSettings };
var goals = [];
var editingGoal = false;
var editingTask = false;
var openedFromManage = false;
var currentGoalId = null;
var currentTaskId = null;
var kanbanGoalFilter = '';
var searchQuery = '';
var filterStatus = 'all';
var filterImportance = 'all';
var modalSubtasks = [];
var pendingDeleteFn = null;
var timerMode = 'pomodoro';
var timerRunning = false;
var timerInterval = null;
var timerStates = {
    pomodoro: { seconds: 25 * 60, total: 25 * 60, session: 1, isBreak: false, label: 'FOCUS' },
    stopwatch: { seconds: 0, laps: [] },
    countdown: { seconds: 30 * 60, total: 30 * 60, label: 'COUNTDOWN' }
};
var timerSeconds = timerStates.pomodoro.seconds;
var timerTotalSeconds = timerStates.pomodoro.total;
var stopwatchSeconds = timerStates.stopwatch.seconds;
var laps = [...timerStates.stopwatch.laps];
var pomodoroSession = timerStates.pomodoro.session;
var pomodoroIsBreak = timerStates.pomodoro.isBreak;
var logsTypeFilter = 'all';

function getSystemLogsStorageKey() {
    return getScopedStorageKey('task_tracker_system_logs_v1');
}

function animateValue(element, start, end, duration) {
    if (!element) return;

    const fromValue = Number(start) || 0;
    const toValue = Number(end) || 0;

    // On mobile, skip animation entirely — set value instantly for better INP
    const isMobile = window.innerWidth <= 768;
    const totalDuration = isMobile ? 0 : Math.max(Number(duration) || 0, 0);

    if (totalDuration === 0) {
        element.textContent = String(Math.round(toValue));
        return;
    }

    const startTime = performance.now();

    const step = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / totalDuration, 1);
        const value = Math.round(fromValue + (toValue - fromValue) * progress);
        element.textContent = String(value);

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };

    requestAnimationFrame(step);
}

function formatTimeDisplay(totalSec) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function pad(n) {
    return String(n).padStart(2, '0');
}

function formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function statusLabel(status) {
    return { 'todo': 'To Do', 'in-progress': 'In Progress', 'blocked': 'Blocked', 'review': 'Review', 'done': 'Done' }[status] || status;
}

function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'error' ? ICONS.alertCircle : type === 'info' ? ICONS.info : ICONS.checkCircle;
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${escHtml(message)}</div>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    const dismiss = () => {
        toast.classList.add('toast-exit');
        window.setTimeout(() => {
            toast.remove();
        }, 250);
    };

    window.setTimeout(dismiss, 2600);
    return toast;
}

function getSystemLogs() {
    try {
        const raw = localStorage.getItem(getSystemLogsStorageKey());
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.warn('Failed to read system logs:', err);
        return [];
    }
}

function saveSystemLogs(logs) {
    localStorage.setItem(getSystemLogsStorageKey(), JSON.stringify(logs.slice(-200)));
}

function getLogEventType(message = '') {
    const normalized = String(message).toLowerCase();
    if (normalized.includes('backup')) return 'backup';
    if (normalized.includes('timer') || normalized.includes('time')) return 'timer';
    if (normalized.includes('note')) return 'note';
    if (normalized.includes('goal')) return 'goal';
    if (normalized.includes('task')) return 'task';
    return 'other';
}

function logSystemEvent(message, type) {
    const logs = getSystemLogs();
    logs.push({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message,
        type: type || getLogEventType(message),
        timestamp: new Date().toISOString()
    });
    saveSystemLogs(logs);

    if (document.getElementById('view-logs')?.classList.contains('active')) {
        renderSystemLogs();
    }
}

function clearSystemLogs() {
    localStorage.removeItem(getSystemLogsStorageKey());
    logsTypeFilter = 'all';
}

function initLogsView() {
    const clearBtn = document.getElementById('btn-clear-logs');
    if (clearBtn && !clearBtn._logsClearBound) {
        clearBtn._logsClearBound = true;
        clearBtn.addEventListener('click', () => {
            showConfirmModal('Clear all system logs?', () => {
                clearSystemLogs();
                renderSystemLogs();
                showToast('Logs cleared');
            });
        });
    }

    const filterPills = document.querySelectorAll('#logs-type-filters .filter-pill');
    filterPills.forEach(pill => {
        if (pill._logsFilterInitialized) return;
        pill._logsFilterInitialized = true;
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            logsTypeFilter = pill.dataset.logType || 'all';
            renderSystemLogs();
        });
    });

    renderSystemLogs();
}

window.logSystemEvent = logSystemEvent;
window.getSystemLogs = getSystemLogs;
window.getLogEventType = getLogEventType;
window.showToast = showToast;
// ==========================================
// NAVIGATION
// ==========================================

function showView(name) {
    // Phase 1: Instant visual switch (< 16ms, no blocking)
    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`[data-view="${name}"]`).forEach(b => {
        if (b.classList.contains('nav-btn') || b.classList.contains('mobile-nav-btn')) {
            b.classList.add('active');
        }
    });
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(`view-${name}`);
    if (targetView) targetView.classList.add('active');

    if (name === 'dashboard' && typeof renderDashboardInstant === 'function') {
        renderDashboardInstant();
    }

    // Phase 2: Data loading deferred to next frame so paint happens first
    requestAnimationFrame(() => {
        setTimeout(() => _loadViewData(name), 0);
    });
}

async function _loadViewData(name) {
    try {
        if (name === 'dashboard') await loadDashboard();
        if (name === 'timer') populateTimerTaskSelect();
        if (name === 'manage') renderManageTasks();
        if (name === 'kanban') renderKanban();
        if (name === 'notes') await loadNotes();
        if (name === 'logs') initLogsView();
        if (name === 'settings') populateSettingsTaskSelect();
    } catch (e) {
        console.error('View data load error:', e);
    }
}

function performViewSwitch(name) {
    showView(name);
}

function initNavigation() {
    document.querySelectorAll('.nav-btn[data-view], .mobile-nav-btn[data-view], .mobile-icon-btn[data-view]').forEach(btn => {
        if (btn._navBound) return;
        btn._navBound = true;
        btn.addEventListener('click', () => showView(btn.dataset.view));
    });
}

function initSidebarControls() {
    const toggleButton = document.getElementById('btn-sidebar-toggle');
    if (!toggleButton || toggleButton._sidebarToggleBound) return;

    toggleButton._sidebarToggleBound = true;
    toggleButton.addEventListener('click', () => {
        if (typeof toggleSidebarCollapsed === 'function') {
            toggleSidebarCollapsed();
        }
    });
}

// ==========================================
// CONFIRM MODAL
// ==========================================

function initConfirmModal() {
    document.getElementById('confirm-yes').addEventListener('click', () => { if (pendingDeleteFn) pendingDeleteFn(); closeConfirmModal(); });
    document.getElementById('confirm-no').addEventListener('click', closeConfirmModal);
    document.getElementById('modal-confirm').addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) closeConfirmModal(); });
}

function showConfirmModal(message, onConfirm) {
    pendingDeleteFn = onConfirm;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('modal-confirm').classList.add('open');
}

function initNotificationButtons() {
    const hasSeenNotice = localStorage.getItem(EARLY_ACCESS_NOTICE_STORAGE_KEY) === '1';
    document.querySelectorAll('.notification-trigger').forEach(btn => {
        if (btn._notificationBound) return;
        btn._notificationBound = true;
        if (!hasSeenNotice) {
            btn.classList.add('is-highlighted');
        }
        btn.addEventListener('click', () => {
            showToast('Early access: this is nowhere near the final product yet.', 'info');
            if (localStorage.getItem(EARLY_ACCESS_NOTICE_STORAGE_KEY) !== '1') {
                localStorage.setItem(EARLY_ACCESS_NOTICE_STORAGE_KEY, '1');
                document.querySelectorAll('.notification-trigger').forEach(trigger => {
                    trigger.classList.add('is-highlighted');
                    window.setTimeout(() => trigger.classList.remove('is-highlighted'), 2200);
                });
            }
        });
    });
}

function closeConfirmModal() {
    pendingDeleteFn = null;
    document.getElementById('modal-confirm').classList.remove('open');
}

async function initApp() {
    if (!(await ensureAuthenticatedSession())) {
        return;
    }

    if (typeof loadSettings === 'function') {
        loadSettings();
    }
    initNavigation();
    initNotificationButtons();
    if (typeof initSidebarControls === 'function') {
        initSidebarControls();
    }
    if (typeof initGoalModal === 'function') initGoalModal();
    if (typeof initTaskModal === 'function') initTaskModal();
    if (typeof initExportModal === 'function') initExportModal();
    if (typeof initBackupButton === 'function') initBackupButton();
    if (typeof initConfirmModal === 'function') initConfirmModal();
    if (typeof initLogsView === 'function') initLogsView();
    if (typeof initTimer === 'function') initTimer();
    if (typeof initNoteModal === 'function') initNoteModal();
    if (typeof initSettingsView === 'function') initSettingsView();
    if (typeof initManageView === 'function') initManageView();

    await Promise.allSettled([
        typeof loadGoals === 'function' ? loadGoals() : Promise.resolve(),
        typeof loadNotes === 'function' ? loadNotes() : Promise.resolve(),
    ]);

    const initialView = document.querySelector('.nav-btn.active')?.dataset.view || 'dashboard';
    showView(initialView);
}

document.addEventListener('DOMContentLoaded', () => {
    void initApp();
});

// ==========================================
// API HELPERS
// ==========================================

async function apiGet(url) {
    const res = await fetch(API + url, { cache: 'no-store', headers: buildAuthHeaders({ 'Cache-Control': 'no-cache' }) });
    if (res.status === 401) { clearCurrentAuthSession(); redirectToLogin(); return []; }
    if (!res.ok) { console.error('API GET error:', res.status, url); return []; }
    return res.json();
}
async function apiPost(url, body) {
    const res = await fetch(API + url, { method: 'POST', headers: buildAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
    if (res.status === 401) { clearCurrentAuthSession(); redirectToLogin(); throw new Error('Unauthorized'); }
    if (!res.ok) { const err = await res.json().catch(() => ({})); console.error('API POST error:', res.status, url, err); throw new Error(err.error || 'API error'); }
    return res.json();
}
async function apiPut(url, body) {
    const res = await fetch(API + url, { method: 'PUT', headers: buildAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
    if (res.status === 401) { clearCurrentAuthSession(); redirectToLogin(); throw new Error('Unauthorized'); }
    if (!res.ok) { const err = await res.json().catch(() => ({})); console.error('API PUT error:', res.status, url, err); throw new Error(err.error || 'API error'); }
    return res.json();
}
async function apiDelete(url) {
    const res = await fetch(API + url, { method: 'DELETE', headers: buildAuthHeaders() });
    if (res.status === 401) { clearCurrentAuthSession(); redirectToLogin(); throw new Error('Unauthorized'); }
}

var dashboardRefreshPromise = null;
var dashboardRefreshQueued = false;
var dashboardRefreshDebounceTimer = null;
var _pendingRefreshTaskViews = false;

function setButtonBusy(buttonId, busyText) {
    const button = document.getElementById(buttonId);
    if (!button) return () => {};

    const originalText = button.textContent;
    button.disabled = true;
    if (busyText) {
        button.textContent = busyText;
    }

    return () => {
        button.disabled = false;
        button.textContent = originalText;
    };
}

function findGoalIndex(goalId) {
    return goals.findIndex(goal => goal.id === goalId);
}

function findTaskLocation(taskId) {
    for (let goalIndex = 0; goalIndex < goals.length; goalIndex += 1) {
        const taskIndex = goals[goalIndex].tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            return { goalIndex, taskIndex };
        }
    }

    return null;
}

function upsertGoalInState(goal) {
    if (!goal || !goal.id) return false;

    const nextGoal = {
        ...goal,
        tasks: Array.isArray(goal.tasks) ? goal.tasks : []
    };
    const goalIndex = findGoalIndex(goal.id);

    if (goalIndex === -1) {
        goals = [...goals, nextGoal];
        return true;
    }

    goals = goals.map((existingGoal, index) => (
        index === goalIndex
            ? { ...existingGoal, ...nextGoal }
            : existingGoal
    ));
    return true;
}

function removeGoalFromState(goalId) {
    const nextGoals = goals.filter(goal => goal.id !== goalId);
    const removed = nextGoals.length !== goals.length;
    goals = nextGoals;
    return removed;
}

function upsertTaskInState(task) {
    if (!task || !task.id || !task.goalId) return false;

    const existingLocation = findTaskLocation(task.id);
    const targetGoalIndex = findGoalIndex(task.goalId);
    if (targetGoalIndex === -1) return false;

    goals = goals.map((goal, index) => {
        const isCurrentGoal = existingLocation && index === existingLocation.goalIndex;
        const isTargetGoal = index === targetGoalIndex;
        if (!isCurrentGoal && !isTargetGoal) {
            return goal;
        }

        const nextTasks = Array.isArray(goal.tasks) ? [...goal.tasks] : [];

        if (isCurrentGoal && isTargetGoal) {
            nextTasks[existingLocation.taskIndex] = {
                ...nextTasks[existingLocation.taskIndex],
                ...task
            };
            return { ...goal, tasks: nextTasks };
        }

        if (isCurrentGoal) {
            nextTasks.splice(existingLocation.taskIndex, 1);
            return { ...goal, tasks: nextTasks };
        }

        if (isTargetGoal) {
            const taskIndex = nextTasks.findIndex(existingTask => existingTask.id === task.id);
            if (taskIndex === -1) {
                nextTasks.push(task);
            } else {
                nextTasks[taskIndex] = { ...nextTasks[taskIndex], ...task };
            }
        }

        return { ...goal, tasks: nextTasks };
    });

    return true;
}

function removeTaskFromState(taskId) {
    let removed = false;

    goals = goals.map(goal => {
        if (!Array.isArray(goal.tasks) || goal.tasks.length === 0) {
            return goal;
        }

        const nextTasks = goal.tasks.filter(task => task.id !== taskId);
        if (nextTasks.length === goal.tasks.length) {
            return goal;
        }

        removed = true;
        return { ...goal, tasks: nextTasks };
    });

    return removed;
}

function adjustTaskTimeSpent(taskId, deltaSeconds) {
    const location = findTaskLocation(taskId);
    const delta = Number(deltaSeconds) || 0;
    if (!location || !delta) return false;

    const goal = goals[location.goalIndex];
    const task = goal.tasks[location.taskIndex];
    return upsertTaskInState({
        ...task,
        timeSpent: Math.max(0, (Number(task.timeSpent) || 0) + delta)
    });
}

function refreshTaskSelectors() {
    if (typeof populateGoalSelector === 'function' && document.getElementById('task-goal-select')) {
        populateGoalSelector();
    }

    if (typeof populateTimerTaskSelect === 'function' && document.getElementById('timer-task-select')) {
        populateTimerTaskSelect();
    }

    if (typeof populateSettingsTaskSelect === 'function') {
        populateSettingsTaskSelect();
    }
}

function _doRefreshTaskViews() {
    _pendingRefreshTaskViews = false;
    if (typeof renderGoals === 'function') {
        renderGoals();
    }

    const manageView = document.getElementById('view-manage');
    if (manageView && manageView.classList.contains('active') && typeof renderManageTasks === 'function') {
        renderManageTasks();
    }

    const kanbanView = document.getElementById('view-kanban');
    if (kanbanView && kanbanView.classList.contains('active') && typeof renderKanban === 'function') {
        renderKanban();
    }

    const dashboardView = document.getElementById('view-dashboard');
    if (dashboardView && dashboardView.classList.contains('active') && typeof renderUpNext === 'function' && typeof getAllTasks === 'function') {
        const allTasks = getAllTasks();
        renderUpNext(allTasks);
        if (typeof renderDailyPlan === 'function') {
            renderDailyPlan(allTasks);
        }
    }

    if (dashboardView && dashboardView.classList.contains('active') && typeof renderDashboardInstant === 'function') {
        renderDashboardInstant();
    }

    refreshTaskSelectors();
}

function refreshTaskViews() {
    // Coalesce multiple calls within the same frame into one render
    if (_pendingRefreshTaskViews) return;
    _pendingRefreshTaskViews = true;
    // Use microtask so all synchronous state updates settle first, then render once
    queueMicrotask(_doRefreshTaskViews);
}

function _executeRefreshDashboardData() {
    if (dashboardRefreshPromise) {
        dashboardRefreshQueued = true;
        return dashboardRefreshPromise;
    }

    dashboardRefreshQueued = false;
    dashboardRefreshPromise = loadDashboard()
        .catch((error) => {
            console.error('Dashboard refresh failed:', error);
        })
        .finally(() => {
            dashboardRefreshPromise = null;
            if (dashboardRefreshQueued) {
                dashboardRefreshQueued = false;
                void _executeRefreshDashboardData();
            }
        });

    return dashboardRefreshPromise;
}

function refreshDashboardData() {
    if (typeof loadDashboard !== 'function') {
        return Promise.resolve();
    }

    // Debounce: wait 800ms of quiet before hitting the server.
    // This lets rapid mutations (timer log + task update) coalesce into one fetch.
    if (dashboardRefreshDebounceTimer) {
        clearTimeout(dashboardRefreshDebounceTimer);
    }

    return new Promise((resolve) => {
        dashboardRefreshDebounceTimer = setTimeout(() => {
            dashboardRefreshDebounceTimer = null;
            // Use requestIdleCallback so the fetch doesn't block user interactions
            const scheduleRefresh = typeof requestIdleCallback === 'function'
                ? requestIdleCallback
                : (cb) => setTimeout(cb, 0);
            scheduleRefresh(() => {
                _executeRefreshDashboardData().then(resolve).catch(resolve);
            });
        }, 800);
    });
}

function cloneSerializable(value) {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

function createClientId(prefix) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function snapshotGoalsState() {
    return cloneSerializable(goals);
}

function restoreGoalsState(snapshot) {
    goals = cloneSerializable(snapshot);
}

function snapshotNotesState() {
    return cloneSerializable(notes);
}

function restoreNotesState(snapshot) {
    notes = cloneSerializable(snapshot);
}

function buildOptimisticTaskFromInput(baseTask, updates, now = new Date().toISOString()) {
    const nextTask = {
        ...baseTask,
        ...updates
    };

    if (updates.status !== undefined) {
        if (updates.status === 'done' && baseTask.status !== 'done') {
            nextTask.completedAt = now;
        } else if (updates.status !== 'done' && baseTask.status === 'done') {
            nextTask.completedAt = null;
        } else if (updates.status === 'done') {
            nextTask.completedAt = baseTask.completedAt || now;
        }
    }

    return nextTask;
}

// ==========================================
// GOALS & TASKS
// ==========================================

async function loadGoals() {
    goals = await apiGet('/api/goals');
    renderGoals();
    const manageView = document.getElementById('view-manage');
    if (manageView && manageView.classList.contains('active')) renderManageTasks();
    const kanbanView = document.getElementById('view-kanban');
    if (kanbanView && kanbanView.classList.contains('active')) renderKanban();
    const dashboardView = document.getElementById('view-dashboard');
    if (dashboardView && dashboardView.classList.contains('active') && typeof renderDashboardInstant === 'function') {
        renderDashboardInstant();
    }
    refreshTaskSelectors();
}

function renderGoals() {
    const container = document.getElementById('goals-container');
    if (!container) return;
    if (goals.length === 0) {
        container.innerHTML = `
            <div class="empty-state" id="empty-goals">
                <div class="empty-icon">${ICONS.targetLg}</div>
                <h3>No goals yet</h3>
                <p>Create your first goal to start tracking progress</p>
                <button class="btn btn-primary btn-glow btn-small" onclick="openAddGoal()" style="margin-top:12px;">+ Create a Goal</button>
            </div>`;
        return;
    }
    container.innerHTML = goals.map(goal => {
        const total = goal.tasks.length;
        const done = goal.tasks.filter(t => t.status === 'done').length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        return `
      <div class="goal-card" data-goal-id="${goal.id}">
        <div class="goal-header" onclick="toggleGoal('${goal.id}')">
          <span class="goal-chevron open" id="chevron-${goal.id}">▼</span>
          <div class="goal-info">
            <div class="goal-title">${escHtml(goal.title)}</div>
            <div class="goal-meta">
              <span>${total} task${total !== 1 ? 's' : ''}</span>
              <div class="goal-progress-mini">
                <div class="progress-bar-mini"><div class="progress-bar-mini-fill" style="width:${percent}%"></div></div>
                <span>${percent}%</span>
              </div>
            </div>
          </div>
          <div class="goal-actions">
            <button class="btn-icon" title="Edit goal" aria-label="Edit goal" onclick="event.stopPropagation(); openEditGoal('${goal.id}')">${ICONS.edit}</button>
            <button class="btn-icon" title="Delete goal" aria-label="Delete goal" onclick="event.stopPropagation(); deleteGoal('${goal.id}')">${ICONS.trash}</button>
          </div>
        </div>
        <div class="goal-body open" id="goal-body-${goal.id}">
          ${goal.description ? `<div class="goal-description">${escHtml(goal.description)}</div>` : ''}
          <div class="tasks-list">${goal.tasks.map(task => renderTask(task)).join('')}</div>
          <div class="add-task-row">
            <button class="btn btn-secondary btn-small" onclick="openAddTask('${goal.id}')"><span>+</span> Add Task</button>
          </div>
        </div>
      </div>`;
    }).join('');
}

function renderTask(task) {
    const timeStr = formatDuration(task.timeSpent || 0);
    const tags = (task.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('');
    const dueHtml = renderDueDate(task.dueDate);
    const subtaskHtml = renderSubtaskCount(task.subtasks);
    return `
    <div class="task-card" data-task-id="${task.id}" onclick="openEditTask('${task.id}')">
      <div class="task-importance-dot ${task.importance}"></div>
      <div class="task-info">
        <div class="task-title">${escHtml(task.title)}</div>
        ${tags ? `<div class="task-tags">${tags}</div>` : ''}
        ${dueHtml}
        ${subtaskHtml}
      </div>
      ${timeStr !== '0s' ? `<div class="task-time">${ICONS.clock} ${timeStr}</div>` : ''}
      <span class="task-status-badge ${task.status}">${statusLabel(task.status)}</span>
      <div class="task-actions">
        <button class="btn-icon" title="Delete task" aria-label="Delete task" onclick="event.stopPropagation(); deleteTask('${task.id}')">${ICONS.trash}</button>
      </div>
    </div>`;
}

function renderDueDate(dueDate) {
    if (!dueDate) return '';
    const due = new Date(dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDay = new Date(due);
    dueDay.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((dueDay - now) / (1000 * 60 * 60 * 24));
    let cls = 'due-later';
    let label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diffDays < 0) { cls = 'overdue'; label = `Overdue (${label})`; }
    else if (diffDays === 0) { cls = 'overdue'; label = 'Due today'; }
    else if (diffDays <= 3) { cls = 'due-soon'; label = `Due ${label}`; }
    return `<div class="task-due ${cls}">${ICONS.calendar} ${label}</div>`;
}

function renderSubtaskCount(subtasks) {
    if (!subtasks || subtasks.length === 0) return '';
    const done = subtasks.filter(s => s.done).length;
    return `<div class="task-subtask-count">${ICONS.checkSquare} <span class="done-ratio">${done}/${subtasks.length}</span></div>`;
}

function toggleGoal(goalId) {
    const body = document.getElementById(`goal-body-${goalId}`);
    const chevron = document.getElementById(`chevron-${goalId}`);
    if (body) {
        body.classList.toggle('open');
        if (chevron) {
            chevron.classList.toggle('open');
            chevron.textContent = body.classList.contains('open') ? '▼' : '▶';
        }
    }
}

// ---- Goal Modal ----
function initGoalModal() {
    document.getElementById('btn-add-goal').addEventListener('click', openAddGoal);
    document.getElementById('modal-goal-close').addEventListener('click', closeGoalModal);
    document.getElementById('modal-goal-cancel').addEventListener('click', closeGoalModal);
    document.getElementById('modal-goal-save').addEventListener('click', saveGoal);
    document.getElementById('modal-goal').addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) closeGoalModal(); });
}

function openAddGoal() {
    editingGoal = false; currentGoalId = null;
    document.getElementById('modal-goal-title').textContent = 'New Goal';
    document.getElementById('goal-title-input').value = '';
    document.getElementById('goal-desc-input').value = '';
    document.getElementById('modal-goal').classList.add('open');
    document.getElementById('goal-title-input').focus();
}

function openEditGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    editingGoal = true; currentGoalId = goalId;
    document.getElementById('modal-goal-title').textContent = 'Edit Goal';
    document.getElementById('goal-title-input').value = goal.title;
    document.getElementById('goal-desc-input').value = goal.description || '';
    document.getElementById('modal-goal').classList.add('open');
    document.getElementById('goal-title-input').focus();
}

function closeGoalModal() { document.getElementById('modal-goal').classList.remove('open'); }

async function saveGoal() {
    const title = document.getElementById('goal-title-input').value.trim();
    const description = document.getElementById('goal-desc-input').value.trim();
    if (!title) { document.getElementById('goal-title-input').focus(); return; }
    const releaseButton = setButtonBusy('modal-goal-save', 'Saving...');
    const isEditing = editingGoal && currentGoalId;
    const goalId = isEditing ? currentGoalId : createClientId('goal');
    const snapshot = snapshotGoalsState();
    const now = new Date().toISOString();
    const existingGoal = isEditing ? goals.find(goal => goal.id === currentGoalId) : null;
    const optimisticGoal = isEditing && existingGoal
        ? { ...existingGoal, title, description }
        : { id: goalId, title, description, createdAt: now, tasks: [] };

    upsertGoalInState(optimisticGoal);
    closeGoalModal();
    refreshTaskViews();
    try {
        const savedGoal = isEditing
            ? await apiPut(`/api/goals/${currentGoalId}`, { title, description })
            : await apiPost('/api/goals', { id: goalId, title, description });
        // Silently merge server data — no re-render needed, optimistic UI was correct
        upsertGoalInState(savedGoal);
        void refreshDashboardData();
        showToast(editingGoal ? 'Goal updated successfully' : 'Goal created successfully');
        logSystemEvent(editingGoal ? 'Goal updated' : 'Goal created');
    } catch (err) {
        console.error('Failed to save goal:', err);
        restoreGoalsState(snapshot);
        refreshTaskViews();
        showToast('Failed to save goal', 'error');
    } finally {
        releaseButton();
    }
}

function deleteGoal(goalId) {
    showConfirmModal('Delete this goal and all its tasks?', async () => {
        const snapshot = snapshotGoalsState();
        removeGoalFromState(goalId);
        refreshTaskViews();
        try {
            await apiDelete(`/api/goals/${goalId}`);
            void refreshDashboardData();
            showToast('Goal deleted');
            logSystemEvent('Goal deleted');
        } catch (err) {
            console.error('Failed to delete goal:', err);
            restoreGoalsState(snapshot);
            refreshTaskViews();
            showToast('Failed to delete goal', 'error');
        }
    });
}

// ---- Task Modal ----
function initTaskModal() {
    document.getElementById('modal-task-close').addEventListener('click', closeTaskModal);
    document.getElementById('modal-task-cancel').addEventListener('click', closeTaskModal);
    document.getElementById('modal-task-save').addEventListener('click', saveTask);
    document.getElementById('modal-task').addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) closeTaskModal(); });
    document.getElementById('btn-add-subtask').addEventListener('click', addSubtask);
    document.getElementById('subtask-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } });
}

function openAddTask(goalId) {
    editingTask = false; openedFromManage = false; currentGoalId = goalId; currentTaskId = null;
    modalSubtasks = [];
    document.getElementById('modal-task-title').textContent = 'New Task';
    document.getElementById('task-title-input').value = '';
    document.getElementById('task-desc-input').value = '';
    document.getElementById('task-importance-input').value = 'low';
    document.getElementById('task-status-input').value = 'todo';
    document.getElementById('task-tags-input').value = '';
    document.getElementById('task-duedate-input').value = '';
    document.getElementById('task-goal-selector-group').style.display = 'none';
    renderModalSubtasks();
    document.getElementById('modal-task').classList.add('open');
    document.getElementById('task-title-input').focus();
}

function openAddTaskFromManage() {
    editingTask = false; openedFromManage = true; currentGoalId = null; currentTaskId = null;
    modalSubtasks = [];
    document.getElementById('modal-task-title').textContent = 'New Task';
    document.getElementById('task-title-input').value = '';
    document.getElementById('task-desc-input').value = '';
    document.getElementById('task-importance-input').value = 'low';
    document.getElementById('task-status-input').value = 'todo';
    document.getElementById('task-tags-input').value = '';
    document.getElementById('task-duedate-input').value = '';
    const selectorGroup = document.getElementById('task-goal-selector-group');
    selectorGroup.style.display = 'block';
    populateGoalSelector();
    renderModalSubtasks();
    document.getElementById('modal-task').classList.add('open');
    document.getElementById('task-goal-select').focus();
}

function populateGoalSelector() {
    const select = document.getElementById('task-goal-select');
    if (!select) return;
    const savedSelection = select.value || '';
    select.innerHTML = '<option value="">— Select a goal —</option>';
    for (const goal of goals) {
        const opt = document.createElement('option');
        opt.value = goal.id; opt.textContent = goal.title;
        select.appendChild(opt);
    }

    if (savedSelection && Array.from(select.options).some(option => option.value === savedSelection)) {
        select.value = savedSelection;
    }
}

function openEditTask(taskId) {
    let task = null;
    for (const goal of goals) {
        task = goal.tasks.find(t => t.id === taskId);
        if (task) { currentGoalId = goal.id; break; }
    }
    if (!task) return;
    editingTask = true; openedFromManage = false; currentTaskId = taskId;
    modalSubtasks = (task.subtasks || []).map(s => ({ ...s }));
    document.getElementById('modal-task-title').textContent = 'Edit Task';
    document.getElementById('task-title-input').value = task.title;
    document.getElementById('task-desc-input').value = task.description || '';
    document.getElementById('task-importance-input').value = task.importance;
    document.getElementById('task-status-input').value = task.status;
    document.getElementById('task-tags-input').value = (task.tags || []).join(', ');
    document.getElementById('task-duedate-input').value = task.dueDate ? task.dueDate.split('T')[0] : '';
    document.getElementById('task-goal-selector-group').style.display = 'none';
    renderModalSubtasks();
    document.getElementById('modal-task').classList.add('open');
    document.getElementById('task-title-input').focus();
}

function closeTaskModal() { document.getElementById('modal-task').classList.remove('open'); }

async function saveTask() {
    const title = document.getElementById('task-title-input').value.trim();
    const description = document.getElementById('task-desc-input').value.trim();
    const importance = document.getElementById('task-importance-input').value;
    const status = document.getElementById('task-status-input').value;
    const tagsRaw = document.getElementById('task-tags-input').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const dueDate = document.getElementById('task-duedate-input').value || null;
    const subtasks = modalSubtasks;
    if (!title) { document.getElementById('task-title-input').focus(); return; }
    let goalId = currentGoalId;
    if (!editingTask && openedFromManage) {
        goalId = document.getElementById('task-goal-select').value;
        if (!goalId) { document.getElementById('task-goal-select').focus(); return; }
    }
    const releaseButton = setButtonBusy('modal-task-save', 'Saving...');
    const isEditing = editingTask && currentTaskId;
    const taskId = isEditing ? currentTaskId : createClientId('task');
    const snapshot = snapshotGoalsState();
    const now = new Date().toISOString();
    const currentTask = isEditing
        ? getAllTasks().find(task => task.id === currentTaskId)
        : null;
    const optimisticTask = isEditing && currentTask
        ? buildOptimisticTaskFromInput(currentTask, { title, description, importance, status, tags, dueDate, subtasks })
        : {
            id: taskId,
            goalId,
            title,
            description,
            status,
            importance,
            tags,
            dueDate,
            subtasks: cloneSerializable(subtasks),
            timeSpent: 0,
            createdAt: now,
            updatedAt: now,
            completedAt: status === 'done' ? now : null
        };
    if (!isEditing) {
        optimisticTask.goalId = goalId;
    }

    upsertTaskInState(optimisticTask);
    closeTaskModal();
    refreshTaskViews();
    try {
        let savedTask;
        if (isEditing) {
            savedTask = await apiPut(`/api/tasks/${currentTaskId}`, { title, description, importance, status, tags, dueDate, subtasks });
        } else {
            savedTask = await apiPost(`/api/goals/${goalId}/tasks`, { id: taskId, title, description, importance, status, tags, dueDate, subtasks });
        }
        // Silently merge server data — no re-render needed, optimistic UI was correct
        upsertTaskInState(savedTask);
        void refreshDashboardData();
        showToast(editingTask ? 'Task updated successfully' : 'Task created successfully');
        logSystemEvent(editingTask ? 'Task updated' : 'Task created');
    } catch (err) {
        console.error('Failed to save task:', err);
        restoreGoalsState(snapshot);
        refreshTaskViews();
        showToast('Failed to save task', 'error');
    } finally {
        releaseButton();
    }
}

function deleteTask(taskId) {
    showConfirmModal('Delete this task?', async () => {
        const snapshot = snapshotGoalsState();
        removeTaskFromState(taskId);
        refreshTaskViews();
        try {
            await apiDelete(`/api/tasks/${taskId}`);
            void refreshDashboardData();
            showToast('Task deleted');
            logSystemEvent('Task deleted');
        } catch (err) {
            console.error('Failed to delete task:', err);
            restoreGoalsState(snapshot);
            refreshTaskViews();
            showToast('Failed to delete task', 'error');
        }
    });
}

// ---- Subtasks in modal ----
function addSubtask() {
    const input = document.getElementById('subtask-input');
    const text = input.value.trim();
    if (!text) return;
    modalSubtasks.push({ id: Date.now().toString(), text, done: false });
    input.value = '';
    renderModalSubtasks();
    input.focus();
}

function toggleSubtask(idx) {
    if (modalSubtasks[idx]) { modalSubtasks[idx].done = !modalSubtasks[idx].done; renderModalSubtasks(); }
}

function removeSubtask(idx) {
    modalSubtasks.splice(idx, 1);
    renderModalSubtasks();
}

function renderModalSubtasks() {
    const list = document.getElementById('subtasks-list');
    if (modalSubtasks.length === 0) { list.innerHTML = ''; return; }
    list.innerHTML = modalSubtasks.map((s, i) => `
        <div class="subtask-item ${s.done ? 'completed' : ''}">
            <input type="checkbox" ${s.done ? 'checked' : ''} onchange="toggleSubtask(${i})">
            <span class="subtask-text">${escHtml(s.text)}</span>
            <button class="btn-icon" onclick="removeSubtask(${i})" title="Remove">×</button>
        </div>
    `).join('');
}

// ==========================================
// MANAGE TASKS VIEW
// ==========================================

function initManageView() {
    document.getElementById('btn-add-task-manage').addEventListener('click', openAddTaskFromManage);
    document.getElementById('task-search').addEventListener('input', (e) => { searchQuery = e.target.value.trim().toLowerCase(); renderManageTasks(); });
    document.querySelectorAll('#status-filters .filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#status-filters .filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active'); filterStatus = pill.dataset.status; renderManageTasks();
        });
    });
    document.querySelectorAll('#importance-filters .filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#importance-filters .filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active'); filterImportance = pill.dataset.importance; renderManageTasks();
        });
    });
}

function getAllTasks() {
    const allTasks = [];
    for (const goal of goals) {
        for (const task of goal.tasks) { allTasks.push({ ...task, goalTitle: goal.title, goalId: goal.id }); }
    }
    return allTasks;
}

function renderManageTasks() {
    const container = document.getElementById('manage-tasks-list');
    const summaryBar = document.getElementById('filtered-count');
    if (!container || !summaryBar) return;
    let tasks = getAllTasks();
    if (filterStatus !== 'all') tasks = tasks.filter(t => t.status === filterStatus);
    if (filterImportance !== 'all') tasks = tasks.filter(t => t.importance === filterImportance);
    if (searchQuery) {
        tasks = tasks.filter(t =>
            t.title.toLowerCase().includes(searchQuery) ||
            t.goalTitle.toLowerCase().includes(searchQuery) ||
            (t.tags || []).some(tag => tag.toLowerCase().includes(searchQuery)) ||
            (t.description || '').toLowerCase().includes(searchQuery)
        );
    }
    const statusOrder = { 'in-progress': 0, 'todo': 1, 'blocked': 2, 'review': 3, 'done': 4 };
    const importanceOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
    tasks.sort((a, b) => { const d = (importanceOrder[a.importance] || 3) - (importanceOrder[b.importance] || 3); return d !== 0 ? d : (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4); });
    summaryBar.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state" id="empty-manage-tasks">
                <div class="empty-icon">${ICONS.clipboard}</div>
                <h3>No tasks found</h3>
                <p>Create a task or adjust your filters</p>
                <button class="btn btn-primary btn-glow btn-small" onclick="openAddTaskFromManage()" style="margin-top:12px;">+ New Task</button>
            </div>`;
        return;
    }
    container.innerHTML = tasks.map(task => {
        const timeStr = formatDuration(task.timeSpent || 0);
        const tags = (task.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('');
        const dueHtml = renderDueDate(task.dueDate);
        const subtaskHtml = renderSubtaskCount(task.subtasks);
        return `
        <div class="manage-task-card importance-${task.importance}" data-task-id="${task.id}" onclick="openEditTask('${task.id}')">
          <div class="task-importance-dot ${task.importance}"></div>
          <div class="task-info">
            <div class="task-title">${escHtml(task.title)}</div>
            <div class="task-goal-label">${ICONS.target} ${escHtml(task.goalTitle)}</div>
            ${tags ? `<div class="task-tags">${tags}</div>` : ''}
            ${dueHtml}${subtaskHtml}
          </div>
          ${timeStr !== '0s' ? `<div class="task-time">${ICONS.clock} ${timeStr}</div>` : ''}
          <span class="task-status-badge ${task.status}">${statusLabel(task.status)}</span>
          <div class="task-actions">
            <button class="btn-icon" title="Delete task" aria-label="Delete task" onclick="event.stopPropagation(); deleteTask('${task.id}')">${ICONS.trash}</button>
          </div>
        </div>`;
    }).join('');
}

// ==========================================
// KANBAN BOARD
// ==========================================

function renderKanban() {
    const select = document.getElementById('kanban-goal-select');
    if (!select) return;
    select.innerHTML = '<option value="">— All Goals —</option>';
    goals.forEach(g => { const opt = document.createElement('option'); opt.value = g.id; opt.textContent = g.title; select.appendChild(opt); });
    select.value = kanbanGoalFilter;
    select.onchange = () => { kanbanGoalFilter = select.value; renderKanban(); };

    const columns = { 'todo': [], 'in-progress': [], 'done': [] };
    let tasks = getAllTasks();
    if (kanbanGoalFilter) tasks = tasks.filter(t => t.goalId === kanbanGoalFilter);

    tasks.forEach(t => {
        if (t.status === 'blocked' || t.status === 'review') columns['in-progress'].push(t);
        else if (columns[t.status]) columns[t.status].push(t);
        else columns['todo'].push(t);
    });

    ['todo', 'in-progress', 'done'].forEach(status => {
        const container = document.getElementById(`kanban-${status}`);
        const countEl = document.getElementById(`kanban-count-${status}`);
        if (!container || !countEl) return;
        countEl.textContent = columns[status].length;
        container.innerHTML = columns[status].map(t => {
            // Build mobile move buttons based on current status
            let moveBtns = '';
            if (status === 'todo') {
                moveBtns = `<div class="kanban-move-btns">
                    <button class="kanban-move-btn" onclick="event.stopPropagation(); moveKanbanTask('${t.id}','in-progress')">In Progress →</button>
                    <button class="kanban-move-btn" onclick="event.stopPropagation(); moveKanbanTask('${t.id}','done')">Done →</button>
                </div>`;
            } else if (status === 'in-progress') {
                moveBtns = `<div class="kanban-move-btns">
                    <button class="kanban-move-btn" onclick="event.stopPropagation(); moveKanbanTask('${t.id}','todo')">← To Do</button>
                    <button class="kanban-move-btn" onclick="event.stopPropagation(); moveKanbanTask('${t.id}','done')">Done →</button>
                </div>`;
            } else if (status === 'done') {
                moveBtns = `<div class="kanban-move-btns">
                    <button class="kanban-move-btn" onclick="event.stopPropagation(); moveKanbanTask('${t.id}','todo')">← To Do</button>
                    <button class="kanban-move-btn" onclick="event.stopPropagation(); moveKanbanTask('${t.id}','in-progress')">← In Progress</button>
                </div>`;
            }
            return `
            <div class="kanban-task-card" draggable="true" data-task-id="${t.id}" ondragstart="onDragStart(event)" ondragend="onDragEnd(event)">
                <div class="kanban-task-title">${escHtml(t.title)}</div>
                <div class="kanban-task-meta">
                    <span class="task-importance-dot ${t.importance}" style="width:6px;height:6px;display:inline-block;border-radius:50%;"></span>
                    <span>${ICONS.target} ${escHtml(t.goalTitle)}</span>
                    ${t.dueDate ? `<span>${ICONS.calendar} ${new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>` : ''}
                </div>
                ${moveBtns}
            </div>`;
        }).join('');

        // Drop zone events
        container.ondragover = (e) => { e.preventDefault(); container.classList.add('drag-over'); };
        container.ondragleave = () => { container.classList.remove('drag-over'); };
        container.ondrop = (e) => { e.preventDefault(); container.classList.remove('drag-over'); handleKanbanDrop(e, status); };
    });
}

let draggedTaskId = null;
function onDragStart(e) { draggedTaskId = e.target.dataset.taskId; e.target.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
function onDragEnd(e) { e.target.classList.remove('dragging'); draggedTaskId = null; }

async function handleKanbanDrop(e, newStatus) {
    if (!draggedTaskId) return;
    const snapshot = snapshotGoalsState();
    const task = getAllTasks().find(t => t.id === draggedTaskId);
    if (!task) return;

    if (typeof upsertTaskInState === 'function') {
        upsertTaskInState(buildOptimisticTaskFromInput(task, { status: newStatus }));
    }
    refreshTaskViews();

    try {
        const savedTask = await apiPut(`/api/tasks/${draggedTaskId}`, { status: newStatus });
        if (typeof upsertTaskInState === 'function') upsertTaskInState(savedTask);
        void refreshDashboardData();
    } catch (err) {
        console.error('Failed to move task:', err);
        restoreGoalsState(snapshot);
        refreshTaskViews();
        showToast('Failed to sync — please refresh', 'error');
    }
}

// Mobile touch move for kanban — optimistic UI
async function moveKanbanTask(taskId, newStatus) {
    const snapshot = snapshotGoalsState();
    const task = getAllTasks().find(t => t.id === taskId);
    if (!task) return;

    if (typeof upsertTaskInState === 'function') {
        upsertTaskInState(buildOptimisticTaskFromInput(task, { status: newStatus }));
    }
    refreshTaskViews();
    showToast(`Task moved to ${newStatus === 'in-progress' ? 'In Progress' : newStatus === 'todo' ? 'To Do' : 'Done'}`);

    try {
        const savedTask = await apiPut(`/api/tasks/${taskId}`, { status: newStatus });
        if (typeof upsertTaskInState === 'function') upsertTaskInState(savedTask);
        void refreshDashboardData();
    } catch (err) {
        console.error('Failed to move task:', err);
        restoreGoalsState(snapshot);
        refreshTaskViews();
        showToast('Failed to sync — please refresh', 'error');
    }
}

// ==========================================
// DATA EXPORT
// ==========================================

function initExportModal() {
    const exportButton = document.getElementById('btn-export-data');
    const exportModal = document.getElementById('modal-export');
    const exportCloseButton = document.getElementById('modal-export-close');
    const exportJsonButton = document.getElementById('export-json');
    const exportCsvButton = document.getElementById('export-csv');

    if (!exportModal || !exportCloseButton || !exportJsonButton || !exportCsvButton) {
        return;
    }

    if (exportButton) {
        exportButton.addEventListener('click', () => { exportModal.classList.add('open'); });
    }
    exportCloseButton.addEventListener('click', () => { exportModal.classList.remove('open'); });
    exportModal.addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) exportModal.classList.remove('open'); });
    exportJsonButton.addEventListener('click', () => { downloadFile('/api/export/json', 'tasktracker-export.json'); exportModal.classList.remove('open'); });
    exportCsvButton.addEventListener('click', () => { downloadFile('/api/export/csv', 'tasktracker-export.csv'); exportModal.classList.remove('open'); });
}

function initBackupButton() {
    // --- Create Backup (downloads JSON file) ---
    const btn = document.getElementById('btn-create-backup');
    if (btn) {
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.textContent = 'Creating Backup...';
            try {
                const res = await apiPost('/api/backup', {});
                // Download the data as a JSON file
                const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tasktracker-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast('Backup downloaded');
                logSystemEvent('Backup created');
            } catch (err) {
                console.error('Backup failed:', err);
                showToast('Backup failed', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Create Local Backup';
            }
        });
    }

    // --- Restore from Backup ---
    const restoreBtn = document.getElementById('btn-restore-backup');
    const fileInput = document.getElementById('restore-file-input');
    if (!restoreBtn || !fileInput) return;

    restoreBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const backupData = JSON.parse(String(event.target.result || '{}'));
                await apiPost('/api/restore', backupData);
                showToast('Backup restored');
                logSystemEvent('Restored from backup');
                location.reload();
            } catch (err) {
                console.error('Restore failed:', err);
                showToast('Restore failed', 'error');
            } finally {
                fileInput.value = '';
            }
        };
        reader.onerror = () => {
            console.error('Failed to read backup file');
            showToast('Failed to read backup file', 'error');
            fileInput.value = '';
        };
        reader.readAsText(file);
    });

    // Wire up type filter pills
    const filterPills = document.querySelectorAll('#logs-type-filters .filter-pill');
    filterPills.forEach(pill => {
        if (!pill._logsFilterInitialized) {
            pill._logsFilterInitialized = true;
            pill.addEventListener('click', () => {
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                logsTypeFilter = pill.dataset.logType || 'all';
                renderSystemLogs();
            });
        }
    });

    // Render logs initially
    renderSystemLogs();

    // Add click listener for the nav button to render logs when switching to the view
    const navLogs = document.getElementById('nav-logs');
    if (navLogs && !navLogs._logsNavInitialized) {
        navLogs._logsNavInitialized = true;
        navLogs.addEventListener('click', () => {
            renderSystemLogs();
        });
    }
}

async function downloadFile(url, filename) {
    try {
        const res = await fetch(API + url, { headers: buildAuthHeaders() });
        if (!res.ok) throw new Error('Network response was not ok');
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        showToast(`Exported as ${filename}`);
        logSystemEvent(`Data exported as ${filename}`);
    } catch (err) {
        console.error('Export failed:', err);
        showToast('Export failed', 'error');
    }
}

const LOG_TYPE_COLORS = {
    task: '#8b5cf6',
    goal: '#3b82f6',
    note: '#fbbf24',
    timer: '#10b981',
    backup: '#f59e0b',
    other: '#8b8b9e'
};

const LOG_TYPE_LABELS = {
    task: 'Task',
    goal: 'Goal',
    note: 'Note',
    timer: 'Timer',
    backup: 'Backup',
    other: 'System'
};

function renderSystemLogs() {
    const logsList = document.getElementById('system-logs-list');
    const emptyState = document.getElementById('empty-logs');

    if (!logsList || !emptyState) return;

    let logs = getSystemLogs();

    // Backfill type for old logs without type
    logs = logs.map(log => ({
        ...log,
        type: log.type || getLogEventType(log.message)
    }));

    // Apply type filter
    const filtered = logsTypeFilter === 'all' ? logs : logs.filter(log => log.type === logsTypeFilter);

    if (filtered.length === 0) {
        logsList.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';
    logsList.style.display = 'flex';
    logsList.innerHTML = '';

    filtered.forEach(log => {
        const li = document.createElement('li');
        li.className = 'log-entry';

        const dateObj = new Date(log.timestamp);
        const dateStr = dateObj.toLocaleDateString();
        const timeStr = dateObj.toLocaleTimeString();
        const typeColor = LOG_TYPE_COLORS[log.type] || LOG_TYPE_COLORS.other;
        const typeLabel = LOG_TYPE_LABELS[log.type] || 'System';

        li.innerHTML = `
            <div class="log-message">
                <span class="log-type-badge" style="background:${typeColor}22; color:${typeColor}; border:1px solid ${typeColor}44;">${typeLabel}</span>
                ${escHtml(log.message)}
            </div>
            <div class="log-time">${dateStr} ${timeStr}</div>
        `;
        logsList.appendChild(li);
    });
}
// ==========================================
// 3D CORNER MASCOT — Upgraded Sleek Robot (lazy-loaded)
// ==========================================

function _doInitMascot3D() {
    const container = document.getElementById('mascot-container');
    if (!container || typeof THREE === 'undefined') return;

    const W = 120, H = 140;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0.4, 3.8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting — 3-point studio setup
    const ambient = new THREE.AmbientLight(0x6d28d9, 0.4);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0xa78bfa, 1.4, 12);
    fillLight.position.set(-2, 1, 2);
    scene.add(fillLight);
    const rimLight = new THREE.PointLight(0x38bdf8, 0.8, 10);
    rimLight.position.set(0, -1, -2);
    scene.add(rimLight);

    const robot = new THREE.Group();
    scene.add(robot);

    // Materials
    const chromeMat = (color, emissive = 0x000000) => new THREE.MeshPhongMaterial({
        color, emissive, emissiveIntensity: 0.2, shininess: 160, specular: 0xffffff
    });

    // Body — rounded box with gradient-like shading
    const bodyGeo = new THREE.BoxGeometry(1.0, 1.1, 0.72, 2, 2, 2);
    const body = new THREE.Mesh(bodyGeo, chromeMat(0x7c3aed, 0x3b0764));
    body.position.y = 0.05;
    robot.add(body);

    // Chest panel glow
    const chestGeo = new THREE.BoxGeometry(0.62, 0.38, 0.05);
    const chestMat = new THREE.MeshPhongMaterial({
        color: 0x0f0f1a, emissive: 0x8b5cf6, emissiveIntensity: 0.6, shininess: 200
    });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(0, 0.08, 0.37);
    robot.add(chest);

    // Chest grid lines
    for (let i = 0; i < 3; i++) {
        const lineGeo = new THREE.BoxGeometry(0.58, 0.015, 0.01);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set(0, -0.06 + i * 0.1, 0.4);
        robot.add(line);
    }

    // Head — sleeker, slightly smaller
    const headGeo = new THREE.BoxGeometry(0.88, 0.76, 0.68);
    const head = new THREE.Mesh(headGeo, chromeMat(0x6d28d9, 0x2e1065));
    head.position.y = 0.96;
    robot.add(head);

    // Face screen (dark glossy)
    const screenGeo = new THREE.BoxGeometry(0.7, 0.5, 0.04);
    const screenMat = new THREE.MeshPhongMaterial({
        color: 0x080810, emissive: 0x1e1b4b, emissiveIntensity: 0.5, shininess: 300
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.96, 0.36);
    robot.add(screen);

    // Eyes — larger, glowing
    const eyeGeo = new THREE.SphereGeometry(0.11, 20, 20);
    const leftEyeMat = new THREE.MeshPhongMaterial({
        color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.9, shininess: 200
    });
    const rightEyeMat = leftEyeMat.clone();
    const leftEye = new THREE.Mesh(eyeGeo, leftEyeMat);
    leftEye.position.set(-0.17, 1.02, 0.38);
    robot.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, rightEyeMat);
    rightEye.position.set(0.17, 1.02, 0.38);
    robot.add(rightEye);

    // Eye rings
    [leftEye, rightEye].forEach((eye, i) => {
        const ringGeo = new THREE.TorusGeometry(0.13, 0.02, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(eye.position);
        ring.position.z -= 0.01;
        robot.add(ring);
    });

    // Pupils
    const pupilGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x020408 });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.17, 1.02, 0.48);
    robot.add(leftPupil);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat.clone());
    rightPupil.position.set(0.17, 1.02, 0.48);
    robot.add(rightPupil);

    // Antenna — tapered
    const antennaGeo = new THREE.CylinderGeometry(0.018, 0.03, 0.42, 10);
    const antenna = new THREE.Mesh(antennaGeo, chromeMat(0xa78bfa));
    antenna.position.set(0, 1.58, 0);
    robot.add(antenna);

    // Antenna orb — glowing
    const orbGeo = new THREE.SphereGeometry(0.09, 20, 20);
    const orbMat = new THREE.MeshPhongMaterial({
        color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 1.0, shininess: 200
    });
    const antOrb = new THREE.Mesh(orbGeo, orbMat);
    antOrb.position.set(0, 1.82, 0);
    robot.add(antOrb);

    // Shoulder pads
    const shoulderGeo = new THREE.BoxGeometry(0.22, 0.18, 0.22);
    const shoulderMat = chromeMat(0x5b21b6);
    [-0.62, 0.62].forEach(x => {
        const s = new THREE.Mesh(shoulderGeo, shoulderMat);
        s.position.set(x, 0.48, 0);
        robot.add(s);
    });

    // Arms — tapered, slightly bent look
    const armGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.52, 10);
    const armMat = chromeMat(0x6d28d9);
    const leftArmMesh = new THREE.Mesh(armGeo, armMat);
    leftArmMesh.position.set(-0.65, 0.1, 0);
    robot.add(leftArmMesh);
    const rightArmMesh = new THREE.Mesh(armGeo, armMat.clone());
    rightArmMesh.position.set(0.65, 0.1, 0);
    robot.add(rightArmMesh);

    // Hands — small spheres
    const handGeo = new THREE.SphereGeometry(0.1, 14, 14);
    const handMat = chromeMat(0x4c1d95);
    const leftHand = new THREE.Mesh(handGeo, handMat);
    leftHand.position.set(-0.65, -0.2, 0);
    robot.add(leftHand);
    const rightHand = new THREE.Mesh(handGeo, handMat.clone());
    rightHand.position.set(0.65, -0.2, 0);
    robot.add(rightHand);

    // Legs — smoother
    const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.44, 10);
    const legMat = chromeMat(0x5b21b6);
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.24, -0.78, 0);
    robot.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, legMat.clone());
    rightLeg.position.set(0.24, -0.78, 0);
    robot.add(rightLeg);

    // Feet
    const footGeo = new THREE.BoxGeometry(0.26, 0.1, 0.32);
    const footMat = chromeMat(0x3b0764);
    const leftFoot = new THREE.Mesh(footGeo, footMat);
    leftFoot.position.set(-0.24, -1.04, 0.04);
    robot.add(leftFoot);
    const rightFoot = new THREE.Mesh(footGeo, footMat.clone());
    rightFoot.position.set(0.24, -1.04, 0.04);
    robot.add(rightFoot);

    // State
    let isHovered = false, isSpinning = false, spinProgress = 0;
    let blinkTimer = 0, nextBlink = 2.5 + Math.random() * 2;
    let isBlinking = false, blinkDuration = 0;
    let wavePhase = 0;
    let lookTarget = { x: 0, y: 0 }, lookTimer = 0, nextLook = 1.5;
    let screenPulse = 0;

    container.addEventListener('mouseenter', () => { isHovered = true; });
    container.addEventListener('mouseleave', () => { isHovered = false; });
    container.addEventListener('click', () => { if (!isSpinning) { isSpinning = true; spinProgress = 0; } });

    const clock = new THREE.Clock();

    function animateMascot() {
        requestAnimationFrame(animateMascot);
        const dt = clock.getDelta();
        const t = clock.getElapsedTime();

        // Idle float
        const bounceAmp = isHovered ? 0.12 : 0.055;
        const bounceFreq = isHovered ? 4.5 : 1.8;
        robot.position.y = Math.sin(t * bounceFreq) * bounceAmp - 0.1;

        // Gentle sway
        robot.rotation.z = Math.sin(t * 0.9) * 0.03;

        // Spin on click
        if (isSpinning) {
            spinProgress += dt * 5;
            robot.rotation.y = spinProgress * Math.PI * 2;
            if (spinProgress >= 1) { isSpinning = false; robot.rotation.y = 0; }
        } else {
            robot.rotation.y = Math.sin(t * 0.6) * 0.18;
        }

        // Arm wave
        wavePhase += dt * (isHovered ? 7 : 2);
        leftArmMesh.rotation.z = Math.sin(wavePhase) * (isHovered ? 0.9 : 0.22) + 0.15;
        rightArmMesh.rotation.z = -Math.sin(wavePhase + Math.PI * 0.5) * (isHovered ? 0.9 : 0.22) - 0.15;
        leftHand.position.x = -0.65 + Math.sin(wavePhase) * (isHovered ? 0.12 : 0.03);
        rightHand.position.x = 0.65 - Math.sin(wavePhase + Math.PI * 0.5) * (isHovered ? 0.12 : 0.03);

        // Blink
        blinkTimer += dt;
        if (!isBlinking && blinkTimer > nextBlink) {
            isBlinking = true; blinkDuration = 0;
            blinkTimer = 0; nextBlink = 2 + Math.random() * 3;
        }
        if (isBlinking) {
            blinkDuration += dt;
            const bp = blinkDuration / 0.12;
            const sy = bp < 0.5 ? 1 - bp * 2 : (bp - 0.5) * 2;
            leftEye.scale.y = rightEye.scale.y = Math.max(0.05, sy);
            if (blinkDuration > 0.12) { isBlinking = false; leftEye.scale.y = rightEye.scale.y = 1; }
        }

        // Eye glow on hover
        const eyeGlow = isHovered ? 1.2 : 0.9;
        leftEyeMat.emissiveIntensity = eyeGlow + Math.sin(t * 3) * 0.15;
        rightEyeMat.emissiveIntensity = eyeGlow + Math.sin(t * 3 + 0.3) * 0.15;

        // Pupil wander
        lookTimer += dt;
        if (lookTimer > nextLook) {
            lookTarget.x = (Math.random() - 0.5) * 0.07;
            lookTarget.y = (Math.random() - 0.5) * 0.05;
            lookTimer = 0; nextLook = 1 + Math.random() * 2;
        }
        leftPupil.position.x = -0.17 + lookTarget.x;
        leftPupil.position.y = 1.02 + lookTarget.y;
        rightPupil.position.x = 0.17 + lookTarget.x;
        rightPupil.position.y = 1.02 + lookTarget.y;

        // Antenna orb pulse
        orbMat.emissiveIntensity = 0.6 + Math.sin(t * 4) * 0.4;
        antOrb.scale.setScalar(0.88 + Math.sin(t * 4) * 0.14);

        // Chest screen pulse
        screenPulse += dt * 2;
        chestMat.emissiveIntensity = 0.4 + Math.sin(screenPulse) * 0.3;

        // Fill light color shift
        fillLight.color.setHSL(0.72 + Math.sin(t * 0.4) * 0.05, 0.7, 0.6);

        renderer.render(scene, camera);
    }

    animateMascot();
}

// Lazy-load mascot: wait for idle time + THREE.js availability
(function _waitForThreeAndInit() {
    function tryInit() {
        if (typeof THREE === 'undefined') { setTimeout(tryInit, 500); return; }
        _doInitMascot3D();
    }
    if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => setTimeout(tryInit, 800));
    } else {
        setTimeout(tryInit, 2000);
    }
})();
