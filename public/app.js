// ==========================================
// TASK TRACKER — Full Feature Application
// ==========================================

const API = window.location.origin;

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

// ---- State ----
let goals = [];
let notes = [];
let timerSessions = [];
let workspaces = [];

let currentGoalId = null;
let currentTaskId = null;
let currentNoteId = null;
let currentWorkspaceId = null;

let editingGoal = false;
let editingTask = false;
let editingNote = false;
let pendingDeleteFn = null;
let openedFromManage = false;
let modalSubtasks = [];

// ---- Filter state ----
let filterStatus = 'all';
let filterImportance = 'all';
let searchQuery = '';
let kanbanGoalFilter = '';

// ---- Timer state ----
let timerMode = 'pomodoro';
let timerInterval = null;
let timerRunning = false;

// Unified state for persistent timers
let timerStates = {
    'pomodoro': {
        seconds: 25 * 60,
        total: 25 * 60,
        session: 1,
        isBreak: false,
        label: 'FOCUS'
    },
    'stopwatch': {
        seconds: 0,
        total: 1,
        laps: []
    },
    'countdown': {
        seconds: 30 * 60,
        total: 30 * 60,
        label: 'COUNTDOWN'
    }
};

let timerSeconds = 25 * 60;
let timerTotalSeconds = 25 * 60;
let pomodoroSession = 1;
let pomodoroIsBreak = false;
let stopwatchSeconds = 0;
let laps = [];

// ---- Drawflow state ----
let editor = null;
let isEditorUpdating = false;

// Settings state
const defaultSettings = {
    profileName: 'Guest',
    accentColor: 'purple',
    accents: {
        purple: '#8b5cf6',
        blue: '#3b82f6',
        green: '#10b981',
        orange: '#f59e0b',
        rose: '#f43f5e'
    }
};
let settings = { ...defaultSettings };

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initGoalModal();
    initTaskModal();
    initTimer();
    initConfirmModal();
    initManageView();
    initNoteModal();
    initWorkspaceModal();
    loadSettings();
    initSettingsView();
    initExportModal();
    initBackupButton();
    initLogsView();
    loadGoals();
    loadDashboard();
    updateGreeting();
});

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconMap = { success: ICONS.checkCircle, error: ICONS.alertCircle, info: ICONS.info };
    toast.innerHTML = `<span class="toast-icon">${iconMap[type] || iconMap.success}</span><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-exit');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

// ==========================================
// GREETING
// ==========================================

function updateGreeting() {
    const hour = new Date().getHours();
    const titleEl = document.getElementById('greeting-title');
    const subtitleEl = document.getElementById('greeting-subtitle');
    const dateEl = document.getElementById('greeting-date');

    let greeting, subtitle;
    if (hour < 12) {
        greeting = 'Good morning';
        subtitle = 'Rise and grind — let\'s make today count';
    } else if (hour < 17) {
        greeting = 'Good afternoon';
        subtitle = 'Stay sharp — you\'re doing great today';
    } else if (hour < 21) {
        greeting = 'Good evening';
        subtitle = 'Wind down strong — finish what matters';
    } else {
        greeting = 'Good night';
        subtitle = 'Reflect on today — plan for tomorrow';
    }

    if (titleEl) titleEl.textContent = greeting;
    if (subtitleEl) subtitleEl.textContent = subtitle;
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// ==========================================
// NAVIGATION
// ==========================================

function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => showView(btn.dataset.view));
    });
}

function showView(name) {
    // Skip loading animation on first load
    if (!window._firstViewLoaded) {
        window._firstViewLoaded = true;
        performViewSwitch(name);
        return;
    }
    // Show loading overlay
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('active');
    startLoadingAnimation();

    setTimeout(() => {
        performViewSwitch(name);
        overlay.classList.remove('active');
    }, 1500);
}

function performViewSwitch(name) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-view="${name}"]`).classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${name}`).classList.add('active');
    if (name === 'dashboard') loadDashboard();
    if (name === 'timer') populateTimerTaskSelect();
    if (name === 'manage') renderManageTasks();
    if (name === 'kanban') renderKanban();
    if (name === 'notes') loadNotes();
    if (name === 'logs') initLogsView();
    if (name === 'settings') populateSettingsTaskSelect();
    if (name === 'workspaces') {
        if (!workspaces || workspaces.length === 0) {
            loadWorkspaces();
        } else if (currentWorkspaceId) {
            switchWorkspace(currentWorkspaceId);
        }
    }
}

// ==========================================
// API HELPERS
// ==========================================

async function apiGet(url) {
    const res = await fetch(API + url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) { console.error('API GET error:', res.status, url); return []; }
    return res.json();
}
async function apiPost(url, body) {
    const res = await fetch(API + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { const err = await res.json().catch(() => ({})); console.error('API POST error:', res.status, url, err); throw new Error(err.error || 'API error'); }
    return res.json();
}
async function apiPut(url, body) {
    const res = await fetch(API + url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { const err = await res.json().catch(() => ({})); console.error('API PUT error:', res.status, url, err); throw new Error(err.error || 'API error'); }
    return res.json();
}
async function apiDelete(url) { await fetch(API + url, { method: 'DELETE' }); }

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
}

function renderGoals() {
    const container = document.getElementById('goals-container');
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
    try {
        if (editingGoal && currentGoalId) { await apiPut(`/api/goals/${currentGoalId}`, { title, description }); showToast('Goal updated successfully'); logSystemEvent('Goal updated'); }
        else { await apiPost('/api/goals', { title, description }); showToast('Goal created successfully'); logSystemEvent('Goal created'); }
        closeGoalModal();
        await loadGoals();
    } catch (err) {
        console.error('Failed to save goal:', err);
        showToast('Failed to save goal', 'error');
    }
}

function deleteGoal(goalId) {
    showConfirmModal('Delete this goal and all its tasks?', async () => { await apiDelete(`/api/goals/${goalId}`); await loadGoals(); showToast('Goal deleted'); logSystemEvent('Goal deleted'); });
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
    select.innerHTML = '<option value="">— Select a goal —</option>';
    for (const goal of goals) {
        const opt = document.createElement('option');
        opt.value = goal.id; opt.textContent = goal.title;
        select.appendChild(opt);
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
    try {
        if (editingTask && currentTaskId) {
            await apiPut(`/api/tasks/${currentTaskId}`, { title, description, importance, status, tags, dueDate, subtasks });
            showToast('Task updated successfully');
            logSystemEvent('Task updated');
        } else {
            let goalId = currentGoalId;
            if (openedFromManage) {
                goalId = document.getElementById('task-goal-select').value;
                if (!goalId) { document.getElementById('task-goal-select').focus(); return; }
            }
            await apiPost(`/api/goals/${goalId}/tasks`, { title, description, importance, status, tags, dueDate, subtasks });
            showToast('Task created successfully');
            logSystemEvent('Task created');
        }
        closeTaskModal();
        await loadGoals();
    } catch (err) {
        console.error('Failed to save task:', err);
        showToast('Failed to save task', 'error');
    }
}

function deleteTask(taskId) {
    showConfirmModal('Delete this task?', async () => { await apiDelete(`/api/tasks/${taskId}`); await loadGoals(); showToast('Task deleted'); logSystemEvent('Task deleted'); });
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
        countEl.textContent = columns[status].length;
        container.innerHTML = columns[status].map(t => `
            <div class="kanban-task-card" draggable="true" data-task-id="${t.id}" ondragstart="onDragStart(event)" ondragend="onDragEnd(event)">
                <div class="kanban-task-title">${escHtml(t.title)}</div>
                <div class="kanban-task-meta">
                    <span class="task-importance-dot ${t.importance}" style="width:6px;height:6px;display:inline-block;border-radius:50%;"></span>
                    <span>${ICONS.target} ${escHtml(t.goalTitle)}</span>
                    ${t.dueDate ? `<span>${ICONS.calendar} ${new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>` : ''}
                </div>
            </div>
        `).join('');

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
    await apiPut(`/api/tasks/${draggedTaskId}`, { status: newStatus });
    await loadGoals();
}

// ==========================================
// TIMER
// ==========================================

function initTimer() {
    document.querySelectorAll('.timer-tab').forEach(tab => { tab.addEventListener('click', () => switchTimerMode(tab.dataset.mode)); });
    document.getElementById('timer-start').addEventListener('click', toggleTimer);
    document.getElementById('timer-reset').addEventListener('click', resetTimer);
    document.getElementById('timer-lap').addEventListener('click', addLap);
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
}

function saveTimerState(mode) {
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
    if (timerMode === 'pomodoro') timerInterval = setInterval(tickPomodoro, 1000);
    else if (timerMode === 'stopwatch') timerInterval = setInterval(tickStopwatch, 1000);
    else if (timerMode === 'countdown') {
        if (timerSeconds <= 0) { const mins = parseInt(document.getElementById('countdown-minutes').value) || 30; timerSeconds = mins * 60; timerTotalSeconds = timerSeconds; }
        timerInterval = setInterval(tickCountdown, 1000);
    }
}

function stopTimer() {
    timerRunning = false; clearInterval(timerInterval); timerInterval = null;
    const btn = document.getElementById('timer-start');
    btn.textContent = 'Resume'; btn.classList.remove('btn-danger'); btn.classList.add('btn-primary');
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
}

function tickPomodoro() {
    timerSeconds--; updateTimerDisplay(); updateTimerRing(timerSeconds / timerTotalSeconds);
    if (timerSeconds <= 0) {
        stopTimer(); logTimerSession('pomodoro', timerTotalSeconds);
        if (pomodoroIsBreak) { pomodoroIsBreak = false; pomodoroSession++; if (pomodoroSession > 4) pomodoroSession = 1; timerSeconds = 25 * 60; timerTotalSeconds = 25 * 60; document.getElementById('timer-label').textContent = 'FOCUS'; }
        else { pomodoroIsBreak = true; const bt = pomodoroSession === 4 ? 15 : 5; timerSeconds = bt * 60; timerTotalSeconds = timerSeconds; document.getElementById('timer-label').textContent = 'BREAK'; }
        updatePomodoroInfo(); updateTimerDisplay(); updateTimerRing(1);
    }
}

function tickStopwatch() { stopwatchSeconds++; updateTimerDisplay(); updateTimerRing((stopwatchSeconds % 3600) / 3600); }

function tickCountdown() {
    timerSeconds--; updateTimerDisplay(); updateTimerRing(timerSeconds / timerTotalSeconds);
    if (timerSeconds <= 0) { stopTimer(); logTimerSession('countdown', timerTotalSeconds); document.getElementById('timer-start').textContent = 'Start'; updateTimerRing(0); }
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
    select.innerHTML = '<option value="">— No task —</option>';
    for (const goal of goals) { for (const task of goal.tasks) { if (task.status !== 'done') { const opt = document.createElement('option'); opt.value = task.id; opt.textContent = `${goal.title} → ${task.title}`; select.appendChild(opt); } } }
}
async function logTimerSession(type, duration) {
    const taskId = document.getElementById('timer-task-select').value || null;
    await apiPost('/api/timer-sessions', { taskId, type, duration });
    if (taskId) await loadGoals();
}

// ==========================================
// NOTES
// ==========================================

let noteEditor;

async function loadNotes() {
    notes = await apiGet('/api/notes');
    renderNotes();
}

function parseRichText(text, noteId = null) {
    if (!text) return '';
    let parsed = escHtml(text);
    
    // Remove ToastUI's backslash escapes for literal markdown characters
    parsed = parsed.replace(/\\([*~\[\]\-_`])/g, '$1');

    parsed = parsed.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/~~([\s\S]*?)~~/g, '<del>$1</del>');
    
    let chkIdx = 0;
    parsed = parsed.replace(/^[-*] \[( |x|X)\] (.*)$/gm, (match, p1, p2) => {
        const isChecked = p1.toLowerCase() === 'x';
        const idx = chkIdx++;
        if (noteId) {
            return `<div style="display:flex;align-items:center;gap:8px;margin:2px 0;" onclick="event.stopPropagation()">
                <input type="checkbox" class="interactive-checkbox" ${isChecked ? 'checked' : ''} onchange="toggleNoteCheckbox('${noteId}', ${idx}, this.checked)">
                <span style="${isChecked ? 'text-decoration:line-through;color:var(--text-secondary);' : ''}word-break:break-word;">${p2}</span>
            </div>`;
        } else {
            return `<div style="display:flex;align-items:center;gap:8px;margin:2px 0;">
                <input type="checkbox" ${isChecked ? 'checked' : ''} disabled>
                <span style="${isChecked ? 'text-decoration:line-through;color:var(--text-secondary);' : ''}word-break:break-word;">${p2}</span>
            </div>`;
        }
    });
    return parsed;
}

window.toggleNoteCheckbox = async function(noteId, index, isChecked) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    let currIdx = 0;
    const newContent = note.content.replace(/^[-*] \[( |x|X)\] (.*)$/gm, (match, p1, p2) => {
        if (currIdx === index) {
            currIdx++;
            const marker = match.charAt(0);
            return isChecked ? `${marker} [x] ${p2}` : `${marker} [ ] ${p2}`;
        }
        currIdx++;
        return match;
    });
    
    if (newContent !== note.content) {
        note.content = newContent;
        renderNotes(); // Update UI immediately
        try {
            await apiPut(`/api/notes/${noteId}`, { title: note.title, content: newContent });
        } catch(err) {
            console.error('Failed to update checkbox', err);
        }
    }
};

function renderNotes() {
    const container = document.getElementById('notes-container');
    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state" id="empty-notes">
                <div class="empty-icon">${ICONS.noteLg}</div>
                <h3>No notes yet</h3>
                <p>Start journaling or jot down quick thoughts</p>
                <button class="btn btn-primary btn-glow btn-small" onclick="openAddNote()" style="margin-top:12px;">+ Write a Note</button>
            </div>`;
        return;
    }
    container.innerHTML = notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(note => `
        <div class="note-card" onclick="openEditNote('${note.id}')">
            <div class="note-card-header">
                <div class="note-card-title">${escHtml(note.title)}</div>
                <div class="note-card-actions">
                    <button class="btn-icon" title="Delete" aria-label="Delete note" onclick="event.stopPropagation(); deleteNote('${note.id}')">${ICONS.trash}</button>
                </div>
            </div>
            <div class="note-card-content">${parseRichText(note.content || '', note.id)}</div>
            <div class="note-card-date">${new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
    `).join('');
}

function initNoteModal() {
    noteEditor = new toastui.Editor({
        el: document.querySelector('#note-editor-container'),
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        height: '400px',
        theme: 'dark',
        hideModeSwitch: true,
        toolbarItems: [
            ['heading', 'bold', 'italic', 'strike'],
            ['hr', 'quote'],
            ['ul', 'ol', 'task']
        ]
    });

    document.getElementById('btn-add-note').addEventListener('click', openAddNote);
    document.getElementById('modal-note-close').addEventListener('click', closeNoteModal);
    document.getElementById('modal-note-cancel').addEventListener('click', closeNoteModal);
    document.getElementById('modal-note-save').addEventListener('click', saveNote);
    document.getElementById('modal-note').addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) closeNoteModal(); });
}

function openAddNote() {
    editingNote = false; currentNoteId = null;
    document.getElementById('modal-note-title').textContent = 'New Note';
    document.getElementById('note-title-input').value = '';
    noteEditor.setMarkdown('');
    document.getElementById('modal-note').classList.add('open');
    document.getElementById('note-title-input').focus();
}

function openEditNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    editingNote = true; currentNoteId = noteId;
    document.getElementById('modal-note-title').textContent = 'Edit Note';
    document.getElementById('note-title-input').value = note.title;
    noteEditor.setMarkdown(note.content || '');
    document.getElementById('modal-note').classList.add('open');
    document.getElementById('note-title-input').focus();
}

function closeNoteModal() { document.getElementById('modal-note').classList.remove('open'); }

async function saveNote() {
    const title = document.getElementById('note-title-input').value.trim();
    const content = noteEditor.getMarkdown();
    if (!title) { document.getElementById('note-title-input').focus(); return; }
    try {
        if (editingNote && currentNoteId) { await apiPut(`/api/notes/${currentNoteId}`, { title, content }); showToast('Note updated'); logSystemEvent('Note updated'); }
        else { await apiPost('/api/notes', { title, content }); showToast('Note created'); logSystemEvent('Note created'); }
        closeNoteModal();
        await loadNotes();
    } catch (err) {
        console.error('Failed to save note:', err);
        showToast('Failed to save note', 'error');
    }
}

function deleteNote(noteId) {
    showConfirmModal('Delete this note?', async () => { await apiDelete(`/api/notes/${noteId}`); await loadNotes(); showToast('Note deleted'); logSystemEvent('Note deleted'); });
}

// ==========================================
// WORKSPACES & DRAWFLOW
// ==========================================

function initWorkspaceModal() {
    document.getElementById('btn-add-workspace').addEventListener('click', () => {
        document.getElementById('workspace-title-input').value = '';
        document.getElementById('modal-workspace').classList.add('open');
    });
    document.getElementById('modal-workspace-close').addEventListener('click', closeWorkspaceModal);
    document.getElementById('modal-workspace-cancel').addEventListener('click', closeWorkspaceModal);
    document.getElementById('modal-workspace-save').addEventListener('click', async () => {
        const title = document.getElementById('workspace-title-input').value.trim();
        if (!title) return alert('Please enter a workspace name');

        try {
            const newWb = await apiPost('/api/workspaces', { title, data: {} });
            workspaces.push(newWb);
            closeWorkspaceModal();
            renderWorkspaceTabs();
            switchWorkspace(newWb.id);
            showToast('Workspace created');
            logSystemEvent('Workspace created');
        } catch (err) {
            console.error('Failed to create workspace:', err);
            showToast('Failed to create workspace', 'error');
        }
    });
    document.getElementById('btn-workspace-clear').addEventListener('click', () => {
        if (!editor || !currentWorkspaceId) return;
        showConfirmModal('Clear entire board?', () => {
            editor.clearModuleSelected();
            saveCurrentWorkspace();
        });
    });
}

function closeWorkspaceModal() {
    document.getElementById('modal-workspace').classList.remove('open');
}

async function loadWorkspaces() {
    try {
        workspaces = await apiGet('/api/workspaces');
        renderWorkspaceTabs();
        if (workspaces.length > 0) {
            switchWorkspace(workspaces[0].id);
        }
    } catch (e) {
        console.error("Failed to load workspaces", e);
    }
}

function renderWorkspaceTabs() {
    const container = document.getElementById('workspace-tabs-container');
    const content = document.getElementById('workspace-content');
    const emptyState = document.getElementById('empty-workspaces');

    if (workspaces.length === 0) {
        container.innerHTML = '';
        content.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    content.style.display = 'flex';
    emptyState.style.display = 'none';

    container.innerHTML = workspaces.map(w => `
        <div class="workspace-tab ${w.id === currentWorkspaceId ? 'active' : ''}" onclick="switchWorkspace('${w.id}')">
            ${escHtml(w.title)}
            <button class="workspace-tab-delete" onclick="event.stopPropagation(); deleteWorkspace('${w.id}')">×</button>
        </div>
    `).join('');
}

function switchWorkspace(id) {
    currentWorkspaceId = id;
    renderWorkspaceTabs();
    const workspace = workspaces.find(w => w.id === id);
    if (!workspace) return;

    if (!editor) {
        const idDraw = document.getElementById("drawflow");
        editor = new Drawflow(idDraw);
        editor.reroute = true;
        editor.reroute_fix_curvature = true;
        editor.curvature = 0.5; // Smoother curves
        editor.line_path = 1.2; // Slightly thicker lines for visibility
        editor.start();

        // Bind events to save
        editor.on('nodeCreated', saveCurrentWorkspace);
        editor.on('nodeRemoved', saveCurrentWorkspace);
        editor.on('nodeMoved', saveCurrentWorkspace);
        editor.on('connectionCreated', saveCurrentWorkspace);
        editor.on('connectionRemoved', saveCurrentWorkspace);
        editor.on('nodeDataChanged', saveCurrentWorkspace);

        // Inject SVG Marker for arrowheads if not already present
        const svg = idDraw.querySelector('svg');
        if (svg && !svg.querySelector('#arrowhead')) {
            const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            defs.innerHTML = `
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
                </marker>
            `;
            svg.prepend(defs);
        }
    }

    // Force marker-end on all connection paths (Drawflow doesn't always handle this natively via marker-end property)
    // We add a recurring check or CSS-based injection. CSS is cleaner.
    // I'll add the CSS part to style.css next.

    // Board export / download listener
    const downloadBtn = document.getElementById('btn-workspace-download');
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const data = editor.export();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `workspace-${id}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };
    }

    isEditorUpdating = true;
    editor.clearModuleSelected();
    if (workspace.data && Object.keys(workspace.data).length > 0) {
        try {
            editor.import(workspace.data);
            bindNodeInputs();
        } catch (e) {
            console.error("Error importing drawflow data", e);
        }
    }
    isEditorUpdating = false;
}

function deleteWorkspace(id) {
    showConfirmModal('Delete this workspace?', async () => {
        try {
            await apiDelete(`/api/workspaces/${id}`);
            workspaces = workspaces.filter(w => w.id !== id);
            if (currentWorkspaceId === id) {
                currentWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null;
                if (currentWorkspaceId) switchWorkspace(currentWorkspaceId);
                else if (editor) { editor.clearModuleSelected(); }
            }
            renderWorkspaceTabs();
            showToast('Workspace deleted');
            logSystemEvent('Workspace deleted');
        } catch (err) {
            console.error('Failed to delete workspace:', err);
            showToast('Failed to delete workspace', 'error');
        }
    });
}

// ==========================================
// SETTINGS
// ==========================================

function loadSettings() {
    const saved = localStorage.getItem('task_tracker_settings');
    if (saved) {
        try {
            settings = { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) { console.error('Failed to parse settings', e); }
    }
    applyThemeSettings();
}

function saveSettings() {
    localStorage.setItem('task_tracker_settings', JSON.stringify(settings));
    applyThemeSettings();
}

function applyThemeSettings() {
    const root = document.documentElement;
    const color = settings.accents[settings.accentColor] || settings.accents.purple;
    root.style.setProperty('--accent', color);

    // Update UI elements
    const nameInput = document.getElementById('user-name-input');
    if (nameInput) nameInput.value = settings.profileName;

    // Update dashboard greeting
    const greeting = document.getElementById('dashboard-greeting');
    if (greeting) {
        const hour = new Date().getHours();
        let intro = 'Good morning';
        if (hour >= 12 && hour < 17) intro = 'Good afternoon';
        if (hour >= 17) intro = 'Good evening';
        greeting.textContent = `${intro}, ${settings.profileName}`;
    }

    // Mark active color preset
    document.querySelectorAll('.btn-color-preset').forEach(btn => {
        const bg = btn.style.background;
        // Basic match based on hex or name
        btn.classList.toggle('active', btn.title.toLowerCase() === settings.accentColor);
    });
}

window.setAccentColor = (colorName) => {
    settings.accentColor = colorName;
    saveSettings();
    showToast(`Accent color updated to ${colorName}`);
};

function initSettingsView() {
    const btnLog = document.getElementById('btn-log-manual-time');
    if (btnLog) btnLog.addEventListener('click', saveManualTime);

    const btnSaveProfile = document.getElementById('btn-save-profile');
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', () => {
            const name = document.getElementById('user-name-input').value.trim();
            if (name) {
                settings.profileName = name;
                saveSettings();
                showToast('Profile updated');
            }
        });
    }

    const btnReset = document.getElementById('btn-reset-data');
    if (btnReset) {
        btnReset.addEventListener('click', resetAppData);
    }
}

async function resetAppData() {
    showConfirmModal('Permanently delete ALL data? This cannot be undone.', async () => {
        try {
            // Sequential deletes for all data types
            const items = ['goals', 'notes', 'workspaces', 'timer-sessions', 'logs'];
            for (const item of items) {
                const list = await apiGet(`/api/${item}`);
                for (const entry of list) {
                    await apiDelete(`/api/${item === 'goals' ? 'goals' : (item === 'timer-sessions' ? 'timer-sessions' : item)}/${entry.id}`);
                }
            }
            showToast('All data has been reset');
            logSystemEvent('All app data reset');
            location.reload();
        } catch (err) {
            console.error('Reset failed:', err);
            showToast('Reset failed', 'error');
        }
    });
}

function populateSettingsTaskSelect() {
    const select = document.getElementById('manual-task-select');
    if (!select) return;

    select.innerHTML = '<option value="">— Select a task —</option>';
    for (const goal of goals) {
        for (const task of goal.tasks) {
            if (task.status !== 'done') {
                const opt = document.createElement('option');
                opt.value = task.id;
                opt.textContent = `${goal.title} → ${task.title}`;
                select.appendChild(opt);
            }
        }
    }
}

async function saveManualTime() {
    const taskId = document.getElementById('manual-task-select').value;
    const durationMins = parseInt(document.getElementById('manual-duration-input').value);

    if (!taskId) {
        showToast('Please select a task', 'error');
        return;
    }
    if (isNaN(durationMins) || durationMins <= 0) {
        showToast('Please enter a valid duration in minutes', 'error');
        return;
    }

    try {
        const durationSecs = durationMins * 60;
        await apiPost('/api/timer-sessions', {
            taskId,
            type: 'manual',
            duration: durationSecs
        });

        showToast(`Logged ${durationMins}m to task`);
        logSystemEvent('Manual time logged');
        document.getElementById('manual-duration-input').value = '';
        await loadGoals(); // Refresh stats/etc
    } catch (err) {
        console.error('Failed to log manual time:', err);
        showToast('Failed to log time', 'error');
    }
}

async function saveCurrentWorkspace() {
    if (isEditorUpdating || !currentWorkspaceId || !editor) return;
    const exportData = editor.export();
    const workspace = workspaces.find(w => w.id === currentWorkspaceId);
    if (workspace) {
        workspace.data = exportData;
        await apiPut(`/api/workspaces/${currentWorkspaceId}`, { data: exportData });
    }
}

function dragNode(ev) {
    if (ev.type === "touchstart") {
        mobile_item_selec = ev.target.closest(".drag-drawflow").getAttribute('data-node');
    } else {
        ev.dataTransfer.setData("node", ev.target.getAttribute('data-node'));
    }
}

document.getElementById('drawflow').addEventListener('drop', (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("node");
    addNodeToDrawFlow(data, e.clientX, e.clientY);
});

document.getElementById('drawflow').addEventListener('dragover', (e) => {
    e.preventDefault();
});

function addNodeToDrawFlow(name, pos_x, pos_y) {
    if (editor.editor_mode === 'fixed') { return false; }

    // Canvas transform fix
    pos_x = pos_x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) - (editor.precanvas.getBoundingClientRect().x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)));
    pos_y = pos_y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) - (editor.precanvas.getBoundingClientRect().y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)));

    const templateMapping = {
        'start': {
            html: `
            <div class="title-box">◎ Start</div>
            <div class="box">
                <input type="text" class="df-text-input" placeholder="Origin..." df-origin>
            </div>
        `, inputs: 0, outputs: 1
        },

        'end': {
            html: `
            <div class="title-box">▥ End</div>
            <div class="box">
                <p style="font-size: 11px; opacity: 0.6; text-align: center;">Flow Termination</p>
            </div>
        `, inputs: 1, outputs: 0
        },

        'delay': {
            html: `
            <div class="title-box">⌛ Delay</div>
            <div class="box">
                <input type="number" class="df-text-input" placeholder="Sec..." df-delay>
            </div>
        `, inputs: 1, outputs: 1
        },

        'task': {
            html: `
            <div class="title-box">■ Task</div>
            <div class="box">
                <textarea class="df-text-input" placeholder="Task details..." df-details></textarea>
            </div>
        `, inputs: 1, outputs: 1
        },

        'decision': {
            html: `
            <div class="title-box">◆ Decision</div>
            <div class="box">
                <input type="text" class="df-text-input" placeholder="Condition?" df-condition>
            </div>
        `, inputs: 1, outputs: 2
        },

        'command': {
            html: `
            <div class="title-box">▶ Command</div>
            <div class="box">
                <input type="text" class="df-text-input" placeholder="Action..." df-action>
            </div>
        `, inputs: 1, outputs: 1
        },

        'note': {
            html: `
            <div class="title-box">📄 Note</div>
            <div class="box">
                <textarea class="df-text-input" placeholder="Just an idea..." df-note></textarea>
            </div>
        `, inputs: 0, outputs: 0
        },
        'loop': {
            html: `
            <div class="title-box" style="background: var(--status-in-progress);">🔁 Loop</div>
            <div class="box">
                <input type="number" class="df-text-input" placeholder="Iterate..." df-iters>
            </div>
        `, inputs: 1, outputs: 1
        },
        'notification': {
            html: `
            <div class="title-box" style="background: var(--status-review);">🔔 Notify</div>
            <div class="box">
                <input type="text" class="df-text-input" placeholder="Message..." df-message>
            </div>
        `, inputs: 1, outputs: 1
        }
    };

    const nodeCfg = templateMapping[name];
    if (nodeCfg) {
        editor.addNode(name, nodeCfg.inputs, nodeCfg.outputs, pos_x, pos_y, name, {}, nodeCfg.html);
        bindNodeInputs();
    }
}

// Binds native inputs within nodes to update data
function bindNodeInputs() {
    const inputs = document.querySelectorAll('.drawflow-node .df-text-input');
    inputs.forEach(input => {
        // Prevent event duplication
        if (input.dataset.bound) return;
        input.dataset.bound = "true";
        input.addEventListener('input', () => {
            const nodeId = input.closest('.drawflow-node').id.slice(5);
            const dataKey = Array.from(input.attributes).find(a => a.name.startsWith('df-'))?.name.slice(3);
            if (dataKey) {
                editor.updateNodeDataFromId(nodeId, { [dataKey]: input.value });
                saveCurrentWorkspace();
            }
        });
    });
}

// ==========================================
// DASHBOARD
// ==========================================
function animateValue(el, start, end, duration) {
    if (!el || end === 0) {
        if (el) el.textContent = end;
        return;
    }
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeOut * (end - start) + start);
        el.textContent = current;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            el.textContent = end;
        }
    };
    window.requestAnimationFrame(step);
}

async function loadDashboard() {
    const stats = await apiGet('/api/stats');
    const sessions = await apiGet('/api/timer-sessions');

    // Core stats
    const statGoals = document.getElementById('stat-goals');
    if (statGoals) animateValue(statGoals, 0, stats.totalGoals, 1200);

    const statTasks = document.getElementById('stat-tasks');
    if (statTasks) animateValue(statTasks, 0, stats.totalTasks, 1200);

    const statDone = document.getElementById('stat-done');
    if (statDone) animateValue(statDone, 0, stats.tasksByStatus.done, 1200);

    const statTime = document.getElementById('stat-time');
    if (statTime) statTime.textContent = formatDuration(stats.totalTimeSpent);

    const statStreak = document.getElementById('stat-streak');
    if (statStreak) animateValue(statStreak, 0, stats.streak, 1200);

    // Gamification UI
    const statStreakFront = document.getElementById('stat-streak-front');
    if (statStreakFront) animateValue(statStreakFront, 0, stats.streak || 0, 1200);

    // Call gamification functions
    const allTasksForGami = getAllTasks();
    if (typeof renderUpNext === 'function') renderUpNext(allTasksForGami);
    if (typeof renderDailyPlan === 'function') renderDailyPlan(allTasksForGami);
    if (typeof renderProductivityPulse === 'function') renderProductivityPulse(sessions);

    const statFocus = document.getElementById('stat-focus');
    if (statFocus) animateValue(statFocus, 0, stats.todayFocus, 1200);

    const statSessions = document.getElementById('stat-sessions');
    if (statSessions) animateValue(statSessions, 0, stats.totalTimerSessions, 1200);

    // Avg completion time
    const statAvg = document.getElementById('stat-avg');
    if (statAvg) {
        if (stats.avgCompletionMs > 0) {
            const hours = stats.avgCompletionMs / (1000 * 60 * 60);
            statAvg.textContent = hours < 24 ? `${Math.round(hours)}h` : `${Math.round(hours / 24)}d`;
        } else {
            statAvg.textContent = '—';
        }
    }

    // Completion trend chart
    renderCompletionTrend(stats.completionTrend);

    // Priority breakdown
    renderPriorityBreakdown(stats.tasksByImportance, stats.totalTasks);

    // Time distribution
    renderTimeDistribution(stats.timeByGoal);

    // Heatmap
    renderHeatmap(stats.heatmapData);

    // Goals progress
    const progressList = document.getElementById('goals-progress-list');
    if (stats.goalsProgress.length === 0) { progressList.innerHTML = '<div class="empty-state-small">No goals yet</div>'; }
    else {
        progressList.innerHTML = stats.goalsProgress.map(g => `
          <div class="goal-progress-card">
            <div class="goal-progress-header">
              <span class="goal-progress-title">${escHtml(g.title)}</span>
              <span class="goal-progress-percent">${g.percent}%</span>
            </div>
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${g.percent}%"></div></div>
            <div class="goal-progress-meta"><span>${g.done} of ${g.total} tasks done</span></div>
          </div>`).join('');
    }

    // Status bars
    const total = stats.totalTasks || 1;
    ['todo', 'in-progress', 'blocked', 'review', 'done'].forEach(s => {
        const count = stats.tasksByStatus[s] || 0;
        const bar = document.getElementById(`bar-${s}`);
        const countEl = document.getElementById(`count-${s}`);
        if (bar) bar.style.width = `${(count / total) * 100}%`;
        if (countEl) countEl.textContent = count;
    });

    // Recent sessions
    const recentContainer = document.getElementById('recent-sessions');
    if (sessions.length === 0) { recentContainer.innerHTML = '<div class="empty-state-small">No sessions yet</div>'; }
    else {
        const recent = sessions.slice(-8).reverse();
        recentContainer.innerHTML = recent.map(s => {
            const typeIcon = s.type === 'pomodoro' ? ICONS.timer : s.type === 'countdown' ? ICONS.hourglass : ICONS.clock;
            const taskName = findTaskName(s.taskId) || 'No task linked';
            const date = new Date(s.completedAt).toLocaleDateString();
            return `<div class="session-card"><div class="session-type">${typeIcon}</div><div class="session-info"><div class="session-task-name">${escHtml(taskName)}</div><div class="session-date">${date}</div></div><div class="session-duration">${formatDuration(s.duration)}</div></div>`;
        }).join('');
    }
}

function renderCompletionTrend(trend) {
    const container = document.getElementById('completion-trend-chart');
    if (!container) return;
    if (!trend || trend.length === 0) { container.innerHTML = '<div class="empty-state-small">No data yet</div>'; return; }
    const maxCount = Math.max(...trend.map(t => t.count), 1);
    container.innerHTML = trend.map(t => {
        const h = Math.max(2, (t.count / maxCount) * 120);
        return `<div class="chart-bar ${t.count > 0 ? 'has-value' : ''}" style="height:${h}px" title="${t.date}: ${t.count} tasks"></div>`;
    }).join('');
}


function renderPriorityBreakdown(byImportance, total) {
    const container = document.getElementById('priority-breakdown');
    if (!container) return;
    const t = total || 1;
    const items = [
        { label: 'Urgent', color: '#f43f5e', count: byImportance.urgent || 0 },
        { label: 'High', color: '#fb923c', count: byImportance.high || 0 },
        { label: 'Medium', color: '#fbbf24', count: byImportance.medium || 0 },
        { label: 'Low', color: '#34d399', count: byImportance.low || 0 },
    ];
    const hasData = items.some(i => i.count > 0);
    if (!hasData) {
        container.innerHTML = '<div class="empty-state-small">No data yet</div>';
        return;
    }
    // Build conic-gradient for donut
    let cumPercent = 0;
    const segments = items.map(i => {
        const pct = (i.count / t) * 100;
        const start = cumPercent;
        cumPercent += pct;
        return { ...i, pct, start };
    });
    const gradientParts = segments.map(s => `${s.color} ${s.start}% ${s.start + s.pct}%`).join(', ');
    container.innerHTML = `
        <div class="donut-ring" style="background: conic-gradient(${gradientParts});">
            <div class="donut-ring-inner"></div>
        </div>
        <div class="donut-legend">
            ${items.map(i => `
                <div class="donut-legend-item">
                    <span class="legend-dot" style="background:${i.color}"></span>
                    <span class="legend-label">${i.label}</span>
                    <span class="legend-count">${i.count}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderTimeDistribution(timeByGoal) {
    const container = document.getElementById('time-distribution');
    if (!container) return;
    if (!timeByGoal || timeByGoal.length === 0) { container.innerHTML = '<div class="empty-state-small">Track time to see distribution</div>'; return; }
    const total = timeByGoal.reduce((s, g) => s + g.time, 0);
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899'];
    let cumPercent = 0;
    const segments = timeByGoal.map((g, i) => {
        const pct = (g.time / total) * 100;
        const start = cumPercent;
        cumPercent += pct;
        return { ...g, pct, start, color: colors[i % colors.length] };
    });
    const gradientParts = segments.map(s => `${s.color} ${s.start}% ${s.start + s.pct}%`).join(', ');
    container.innerHTML = `
        <div class="donut-svg" style="border-radius:50%;background:conic-gradient(${gradientParts});width:100px;height:100px;position:relative;">
            <div style="position:absolute;inset:25px;border-radius:50%;background:var(--bg-card)"></div>
        </div>
        <div class="donut-legend">
            ${segments.map(s => `
                <div class="donut-legend-item">
                    <span class="legend-dot" style="background:${s.color}"></span>
                    <span>${escHtml(s.title)}</span>
                    <span class="legend-time">${formatDuration(s.time)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderHeatmap(heatmapData) {
    const container = document.getElementById('heatmap-container');
    if (!container) return;
    if (!heatmapData) { container.innerHTML = ''; return; }
    const entries = Object.entries(heatmapData);
    const maxVal = Math.max(...entries.map(e => e[1]), 1);
    container.innerHTML = entries.map(([date, count]) => {
        let level = '';
        if (count > 0) {
            const ratio = count / maxVal;
            if (ratio <= 0.25) level = 'level-1';
            else if (ratio <= 0.5) level = 'level-2';
            else if (ratio <= 0.75) level = 'level-3';
            else level = 'level-4';
        }
        return `<div class="heatmap-cell ${level}" title="${date}: ${count} completed"></div>`;
    }).join('');
}

function findTaskName(taskId) {
    if (!taskId) return null;
    for (const goal of goals) { const task = goal.tasks.find(t => t.id === taskId); if (task) return task.title; }
    return null;
}

// ==== Gamification ====
let productivityChartInstance = null;

function renderUpNext(tasks) {
    const container = document.getElementById('up-next-container');
    if (!container) return;

    let validTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'review');
    if (validTasks.length === 0) {
        container.innerHTML = '<div class="empty-state-small text-muted">No pending tasks!</div>';
        return;
    }

    const importanceOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
    validTasks.sort((a, b) => {
        if (importanceOrder[a.importance] !== importanceOrder[b.importance]) {
            return importanceOrder[a.importance] - importanceOrder[b.importance];
        }
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
    });

    const task = validTasks[0];
    const statusLabels = { 'todo': 'TO DO', 'in-progress': 'IN PROGRESS', 'blocked': 'BLOCKED', 'review': 'REVIEW' };
    const statusLabel = statusLabels[task.status] || task.status.toUpperCase();
    
    // Find the goal name for context
    let goalName = 'No Goal';
    for (const g of goals) {
        if (g.tasks.some(t => t.id === task.id)) {
            goalName = g.title;
            break;
        }
    }

    container.innerHTML = `
        <div class="focus-task-item">
            <span class="focus-task-status-badge">${statusLabel}</span>
            <div class="focus-task-title-text">${escHtml(task.title)}</div>
            <div class="focus-task-subtitle">${escHtml(goalName)}</div>
            <div class="focus-task-actions-row">
                <button class="btn btn-primary" onclick="quickStartTimer('${task.id}')">
                    ${ICONS.timer} Start
                </button>
                <button class="btn btn-secondary" onclick="completeTaskFromDashboard('${task.id}')">
                    ${ICONS.checkCircle} Done
                </button>
            </div>
        </div>
    `;
}

function completeTaskFromDashboard(taskId) {
    // Basic implementation that finds the task and marks it as done
    for (const goal of goals) {
        const task = goal.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = 'done';
            appLog('Task Completed', `Task "${task.title}" marked as done from dashboard.`);
            saveData();
            loadDashboard();
            break;
        }
    }
}

function quickStartTimer(taskId) {
    currentTaskId = taskId;
    performViewSwitch('timer');
    // Start timer automatically could be a nice touch
}

function renderDailyPlan(tasks) {
    const container = document.getElementById('daily-plan-container');
    if (!container) return;

    let validTasks = tasks.filter(t => t.status !== 'done');
    const importanceOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
    validTasks.sort((a, b) => {
        if (importanceOrder[a.importance] !== importanceOrder[b.importance]) return importanceOrder[a.importance] - importanceOrder[b.importance];
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        if (a.dueDate) return -1;
        return 1;
    });

    const topTasks = validTasks.slice(0, 4);

    if (topTasks.length === 0) {
        container.innerHTML = '<div class="empty-state-small text-muted" style="text-align:left;">All clear for today!</div>';
        return;
    }

    container.innerHTML = topTasks.map(t => `
        <div class="daily-action-item" onclick="showView('manage'); openEditTask('${t.id}')" style="cursor:pointer;">
            <div class="daily-action-check"></div>
            <div class="daily-action-title">${escHtml(t.title)}</div>
            <span class="task-importance-dot ${t.importance}"></span>
        </div>
    `).join('');
}

function renderProductivityPulse(sessions) {
    const canvas = document.getElementById('productivity-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const last7Days = [];
    const dataPoints = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));

        const dateStr = d.toDateString();
        const sum = sessions.filter(s => new Date(s.completedAt).toDateString() === dateStr)
            .reduce((acc, curr) => acc + (curr.duration || 0), 0);
        dataPoints.push(Math.round(sum / 60)); // minutes
    }

    if (productivityChartInstance) {
        productivityChartInstance.destroy();
    }

    if (window.Chart) {
        Chart.defaults.color = '#8b8b9e';
        Chart.defaults.font.family = 'Inter';
        productivityChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Minutes Focused',
                    data: dataPoints,
                    backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    borderColor: '#8b5cf6',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}


// ==========================================
// DATA EXPORT
// ==========================================

// ==========================================
// DATA EXPORT
// ==========================================

function initExportModal() {
    document.getElementById('btn-export-data').addEventListener('click', () => { document.getElementById('modal-export').classList.add('open'); });
    document.getElementById('modal-export-close').addEventListener('click', () => { document.getElementById('modal-export').classList.remove('open'); });
    document.getElementById('modal-export').addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) document.getElementById('modal-export').classList.remove('open'); });
    document.getElementById('export-json').addEventListener('click', () => { downloadFile('/api/export/json', 'tasktracker-export.json'); document.getElementById('modal-export').classList.remove('open'); });
    document.getElementById('export-csv').addEventListener('click', () => { downloadFile('/api/export/csv', 'tasktracker-export.csv'); document.getElementById('modal-export').classList.remove('open'); });
}

function initBackupButton() {
    // --- Create Backup ---
    const btn = document.getElementById('btn-create-backup');
    if (btn) {
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.textContent = 'Creating Backup...';
            try {
                const res = await apiPost('/api/backup', {});
                showToast(`Backup created: ${res.file}`);
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
        reader.onload = (evt) => {
            let parsed;
            try {
                parsed = JSON.parse(evt.target.result);
            } catch (err) {
                showToast('Invalid JSON file — could not parse', 'error');
                fileInput.value = '';
                return;
            }

            showConfirmModal(
                `Restore data from "${file.name}"? A safety backup will be created first. This will replace all current data.`,
                async () => {
                    restoreBtn.disabled = true;
                    restoreBtn.textContent = 'Restoring...';
                    try {
                        const res = await apiPost('/api/restore', parsed);
                        showToast(`Data restored! Safety backup: ${res.safetyBackup}`);
                        logSystemEvent('Data restored from backup');
                        // Reload all data
                        await loadGoals();
                        loadDashboard();
                    } catch (err) {
                        console.error('Restore failed:', err);
                        showToast('Restore failed: ' + (err.message || 'Unknown error'), 'error');
                    } finally {
                        restoreBtn.disabled = false;
                        restoreBtn.textContent = 'Restore from Backup';
                        fileInput.value = '';
                    }
                }
            );
        };
        reader.readAsText(file);
    });
}

async function downloadFile(url, filename) {
    try {
        const res = await fetch(url);
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
        showToast('Export failed', 'error');
    }
}

// ==========================================
// HELPERS
// ==========================================

function formatTimeDisplay(totalSec) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function pad(n) { return String(n).padStart(2, '0'); }

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

function closeConfirmModal() {
    pendingDeleteFn = null;
    document.getElementById('modal-confirm').classList.remove('open');
}

// ==========================================
// 3D CORNER MASCOT — Funny Bouncing Robot
// ==========================================

(function initMascot3D() {
    const container = document.getElementById('mascot-container');
    if (!container || typeof THREE === 'undefined') return;

    const W = 120, H = 140;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0.5, 4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0x8b5cf6, 0.5);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 3, 4);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(0xa78bfa, 0.6, 10);
    pointLight.position.set(-1, 2, 2);
    scene.add(pointLight);

    // Robot group
    const robot = new THREE.Group();
    scene.add(robot);

    // Body
    const bodyGeo = new THREE.BoxGeometry(1, 1.2, 0.8);
    bodyGeo.translate(0, 0, 0);
    const bodyMat = new THREE.MeshPhongMaterial({
        color: 0x8b5cf6,
        emissive: 0x4c1d95,
        emissiveIntensity: 0.15,
        shininess: 80
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0;
    robot.add(body);

    // Face plate
    const faceGeo = new THREE.PlaneGeometry(0.8, 0.6);
    const faceMat = new THREE.MeshPhongMaterial({
        color: 0x1a1a2e,
        emissive: 0x0f0f1a,
        emissiveIntensity: 0.3,
        shininess: 120
    });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0, 0.15, 0.41);
    robot.add(face);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMat = new THREE.MeshPhongMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.6,
        shininess: 100
    });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.18, 0.22, 0.42);
    robot.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
    rightEye.position.set(0.18, 0.22, 0.42);
    robot.add(rightEye);

    // Pupils
    const pupilGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.18, 0.22, 0.52);
    robot.add(leftPupil);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat.clone());
    rightPupil.position.set(0.18, 0.22, 0.52);
    robot.add(rightPupil);

    // Mouth (happy smile arc)
    const smileShape = new THREE.Shape();
    smileShape.moveTo(-0.15, 0);
    smileShape.quadraticCurveTo(0, -0.12, 0.15, 0);
    const smileGeo = new THREE.ShapeGeometry(smileShape);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.position.set(0, -0.02, 0.42);
    robot.add(smile);

    // Antenna
    const antennaGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
    const antennaMat = new THREE.MeshPhongMaterial({ color: 0xa78bfa });
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(0, 0.8, 0);
    robot.add(antenna);

    // Antenna ball (glow)
    const antBallGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const antBallMat = new THREE.MeshPhongMaterial({
        color: 0xfbbf24,
        emissive: 0xfbbf24,
        emissiveIntensity: 0.8,
        shininess: 100
    });
    const antBall = new THREE.Mesh(antBallGeo, antBallMat);
    antBall.position.set(0, 1.02, 0);
    robot.add(antBall);

    // Left arm
    const armGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
    const armMat = new THREE.MeshPhongMaterial({ color: 0x7c3aed });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.7, -0.05, 0);
    robot.add(leftArm);

    // Right arm
    const rightArm = new THREE.Mesh(armGeo, armMat.clone());
    rightArm.position.set(0.7, -0.05, 0);
    robot.add(rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.4, 0.2);
    const legMat = new THREE.MeshPhongMaterial({ color: 0x6d28d9 });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.25, -0.8, 0);
    robot.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, legMat.clone());
    rightLeg.position.set(0.25, -0.8, 0);
    robot.add(rightLeg);

    // Feet
    const footGeo = new THREE.BoxGeometry(0.28, 0.1, 0.35);
    const footMat = new THREE.MeshPhongMaterial({ color: 0x4c1d95 });
    const leftFoot = new THREE.Mesh(footGeo, footMat);
    leftFoot.position.set(-0.25, -1.02, 0.05);
    robot.add(leftFoot);
    const rightFoot = new THREE.Mesh(footGeo, footMat.clone());
    rightFoot.position.set(0.25, -1.02, 0.05);
    robot.add(rightFoot);

    // State
    let isHovered = false;
    let isSpinning = false;
    let spinProgress = 0;
    let blinkTimer = 0;
    let nextBlink = Math.random() * 3 + 2;
    let isBlinking = false;
    let blinkDuration = 0;
    let wavePhase = 0;
    let lookTarget = { x: 0, y: 0 };
    let lookTimer = 0;
    let nextLookChange = Math.random() * 2 + 1;

    // Mouse events
    container.addEventListener('mouseenter', () => { isHovered = true; });
    container.addEventListener('mouseleave', () => { isHovered = false; });
    container.addEventListener('click', () => {
        if (!isSpinning) { isSpinning = true; spinProgress = 0; }
    });

    // Animation clock
    const clock = new THREE.Clock();

    function animateMascot() {
        requestAnimationFrame(animateMascot);
        const dt = clock.getDelta();
        const t = clock.getElapsedTime();

        // Idle bounce
        const bounceSpeed = isHovered ? 4 : 2;
        const bounceHeight = isHovered ? 0.15 : 0.06;
        robot.position.y = Math.sin(t * bounceSpeed) * bounceHeight;

        // Gentle sway
        robot.rotation.z = Math.sin(t * 1.2) * 0.04;

        // Spin on click
        if (isSpinning) {
            spinProgress += dt * 4;
            robot.rotation.y = spinProgress * Math.PI * 2;
            if (spinProgress >= 1) {
                isSpinning = false;
                robot.rotation.y = 0;
            }
        } else {
            robot.rotation.y = Math.sin(t * 0.5) * 0.15;
        }

        // Arm wave
        wavePhase += dt * (isHovered ? 6 : 2.5);
        leftArm.rotation.z = Math.sin(wavePhase) * (isHovered ? 0.8 : 0.2) + 0.1;
        rightArm.rotation.z = Math.sin(wavePhase + Math.PI) * (isHovered ? 0.8 : 0.2) - 0.1;

        // Eye blinks
        blinkTimer += dt;
        if (!isBlinking && blinkTimer > nextBlink) {
            isBlinking = true;
            blinkDuration = 0;
            blinkTimer = 0;
            nextBlink = Math.random() * 3 + 2;
        }
        if (isBlinking) {
            blinkDuration += dt;
            const blinkPhase = blinkDuration / 0.15;
            const scaleY = blinkPhase < 0.5
                ? 1 - blinkPhase * 2
                : (blinkPhase - 0.5) * 2;
            leftEye.scale.y = Math.max(0.05, scaleY);
            rightEye.scale.y = Math.max(0.05, scaleY);
            if (blinkDuration > 0.15) { isBlinking = false; leftEye.scale.y = 1; rightEye.scale.y = 1; }
        }

        // Eye look around
        lookTimer += dt;
        if (lookTimer > nextLookChange) {
            lookTarget.x = (Math.random() - 0.5) * 0.06;
            lookTarget.y = (Math.random() - 0.5) * 0.04;
            lookTimer = 0;
            nextLookChange = Math.random() * 2 + 1;
        }
        leftPupil.position.x = -0.18 + lookTarget.x;
        leftPupil.position.y = 0.22 + lookTarget.y;
        rightPupil.position.x = 0.18 + lookTarget.x;
        rightPupil.position.y = 0.22 + lookTarget.y;

        // Antenna glow pulse
        const glowPulse = 0.5 + Math.sin(t * 3) * 0.4;
        antBallMat.emissiveIntensity = glowPulse;
        antBall.scale.setScalar(0.9 + Math.sin(t * 3) * 0.15);

        // Hover excitement — body jiggles faster
        if (isHovered) {
            body.scale.x = 1 + Math.sin(t * 10) * 0.03;
            body.scale.y = 1 + Math.sin(t * 12) * 0.02;
        } else {
            body.scale.x = 1;
            body.scale.y = 1;
        }

        renderer.render(scene, camera);
    }

    animateMascot();
})();


// ==========================================
// 3D LOADING OVERLAY — Cube Grid Wave
// ==========================================

let loadingScene, loadingCamera, loadingRenderer, loadingCubes;
let loadingAnimationId = null;
let loadingInitialized = false;

function initLoadingScene() {
    if (loadingInitialized) return;
    loadingInitialized = true;

    const container = document.getElementById('loading-canvas-container');
    if (!container || typeof THREE === 'undefined') return;

    const W = 200, H = 200;
    loadingScene = new THREE.Scene();
    loadingCamera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    loadingCamera.position.set(0, 2, 6);
    loadingCamera.lookAt(0, 0, 0);

    loadingRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    loadingRenderer.setSize(W, H);
    loadingRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    loadingRenderer.setClearColor(0x000000, 0);
    container.appendChild(loadingRenderer.domElement);

    // Lighting
    const amb = new THREE.AmbientLight(0x8b5cf6, 0.4);
    loadingScene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(3, 5, 4);
    loadingScene.add(dir);
    const pt = new THREE.PointLight(0xa78bfa, 1.2, 15);
    pt.position.set(0, 2, 3);
    loadingScene.add(pt);

    // 3x3 Cube grid
    loadingCubes = [];
    const cubeGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const mat = new THREE.MeshPhongMaterial({
                color: 0x8b5cf6,
                emissive: 0x4c1d95,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.85,
                shininess: 100
            });
            const cube = new THREE.Mesh(cubeGeo, mat);
            cube.position.set(
                (col - 1) * 1.0,
                0,
                (row - 1) * 1.0
            );
            cube.userData.baseX = cube.position.x;
            cube.userData.baseZ = cube.position.z;
            cube.userData.delay = (row + col) * 0.15;
            loadingScene.add(cube);
            loadingCubes.push(cube);
        }
    }
}

function startLoadingAnimation() {
    initLoadingScene();
    if (!loadingRenderer) return;

    const startTime = performance.now();

    function animateLoading() {
        loadingAnimationId = requestAnimationFrame(animateLoading);
        const elapsed = (performance.now() - startTime) / 1000;

        loadingCubes.forEach(cube => {
            const d = cube.userData.delay;
            const t = Math.max(0, elapsed - d);

            // Bounce up and down in a wave
            cube.position.y = Math.sin(t * 4) * 0.8;

            // Rotate each cube
            cube.rotation.x = t * 2;
            cube.rotation.y = t * 1.5;

            // Scale pulse
            const s = 0.8 + Math.sin(t * 3 + d * 2) * 0.2;
            cube.scale.setScalar(s);

            // Color shift
            const hue = (0.72 + Math.sin(t * 2 + d) * 0.08);
            cube.material.color.setHSL(hue, 0.7, 0.55);
            cube.material.emissive.setHSL(hue, 0.8, 0.2);
            cube.material.emissiveIntensity = 0.3 + Math.sin(t * 4) * 0.2;
        });

        // Slowly rotate the whole view
        loadingCamera.position.x = Math.sin(elapsed * 0.8) * 1.5;
        loadingCamera.position.z = 6 + Math.cos(elapsed * 0.8) * 0.5;
        loadingCamera.lookAt(0, 0, 0);

        loadingRenderer.render(loadingScene, loadingCamera);
    }

    animateLoading();

    // Auto-stop after 2 seconds
    setTimeout(() => {
        if (loadingAnimationId) {
            cancelAnimationFrame(loadingAnimationId);
            loadingAnimationId = null;
        }
    }, 2000);
}

// ==========================================
// SYSTEM LOGS
// ==========================================

function getSystemLogs() {
    return JSON.parse(localStorage.getItem('systemLogs')) || [];
}

function saveSystemLogs(logs) {
    localStorage.setItem('systemLogs', JSON.stringify(logs));
}

function logSystemEvent(message) {
    const logs = getSystemLogs();
    const entry = {
        message,
        timestamp: new Date().toISOString()
    };
    logs.unshift(entry);
    
    // Keep max 100 logs
    if (logs.length > 100) {
        logs.pop();
    }
    
    saveSystemLogs(logs);
    
    // If we're currently looking at the logs view, update it
    const logsView = document.getElementById('view-logs');
    if (logsView && logsView.classList.contains('active')) {
        renderSystemLogs();
    }
}

function initLogsView() {
    const btnClearLogs = document.getElementById('btn-clear-logs');
    if (btnClearLogs) {
        btnClearLogs.addEventListener('click', () => {
            showConfirmModal('Are you sure you want to permanently delete all system logs?', () => {
                localStorage.removeItem('systemLogs');
                renderSystemLogs();
                showToast('System logs cleared');
                logSystemEvent('Cleared system logs');
            });
        });
    }

    // Render logs initially if we're on the logs view
    renderSystemLogs();

    // Add click listener for the nav button to render logs when switching to the view
    const navLogs = document.getElementById('nav-logs');
    if (navLogs) {
        navLogs.addEventListener('click', () => {
            renderSystemLogs();
        });
    }
}

function renderSystemLogs() {
    const logsList = document.getElementById('system-logs-list');
    const emptyState = document.getElementById('empty-logs');
    
    if (!logsList || !emptyState) return;
    
    const logs = getSystemLogs();
    
    if (logs.length === 0) {
        logsList.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    logsList.style.display = 'flex';
    logsList.innerHTML = '';
    
    logs.forEach(log => {
        const li = document.createElement('li');
        li.className = 'log-entry';
        
        const dateObj = new Date(log.timestamp);
        const dateStr = dateObj.toLocaleDateString();
        const timeStr = dateObj.toLocaleTimeString();
        
        li.innerHTML = `
            <div class="log-message">${escHtml(log.message)}</div>
            <div class="log-time">${dateStr} ${timeStr}</div>
        `;
        logsList.appendChild(li);
    });
}

