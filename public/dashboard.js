// Dashboard feature module

let completionTrendChartInstance = null;
let productivityChartInstance = null;
var dashboardSessions = [];

function getHobbiesStorageKey() {
    return typeof getScopedStorageKey === 'function' ? getScopedStorageKey('task_tracker_hobbies_v1') : 'task_tracker_hobbies_v1';
}

function getDashboardTimerTaskStorageKey() {
    return typeof getScopedStorageKey === 'function' ? getScopedStorageKey('task_tracker_timer_selected_task') : 'task_tracker_timer_selected_task';
}

function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
}

const greetingMessages = [
    'Stay focused on what truly moves you forward.',
    'Small steps still build remarkable outcomes.',
    'Clarity creates momentum.',
    'Keep going — progress is happening.',
    'Your potential grows with every action.',
    'Start where you are, and build from there.',
    'Make space for what matters most.'
];

let greetingRefreshTimer = null;

function getGreetingCopy(now = new Date()) {
    const currentHour = now.getHours();
    let title = 'Good morning';

    if (currentHour >= 12 && currentHour < 17) {
        title = 'Good afternoon';
    } else if (currentHour >= 17) {
        title = 'Good evening';
    }

    const weekdayIndex = (now.getDay() + 6) % greetingMessages.length;

    return {
        title,
        subtitle: greetingMessages[weekdayIndex],
        dateText: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    };
}

function updateGreetingBanner(now = new Date()) {
    const greeting = getGreetingCopy(now);

    const titleElement = document.getElementById('greeting-title');
    const subtitleElement = document.getElementById('greeting-subtitle');
    const dateElement = document.getElementById('greeting-date');

    if (titleElement) titleElement.textContent = greeting.title;
    if (subtitleElement) subtitleElement.textContent = greeting.subtitle;
    if (dateElement) dateElement.textContent = greeting.dateText;

    return greeting;
}

function syncGreetingBanner() {
    updateGreetingBanner();

    if (greetingRefreshTimer || typeof window.setInterval !== 'function') {
        return;
    }

    greetingRefreshTimer = window.setInterval(() => updateGreetingBanner(), 60 * 1000);
}

window.getGreetingCopy = getGreetingCopy;
window.updateGreetingBanner = updateGreetingBanner;
window.syncGreetingBanner = syncGreetingBanner;

function readHobbiesState() {
    try {
        const raw = localStorage.getItem(getHobbiesStorageKey());
        const parsed = raw ? JSON.parse(raw) : null;
        const items = Array.isArray(parsed?.items) ? parsed.items : [];
        return {
            date: parsed?.date || getTodayKey(),
            items: items.map(item => ({
                id: item.id || `hobby-${Math.random().toString(36).slice(2, 10)}`,
                title: String(item.title || '').trim(),
                done: Boolean(item.done)
            })).filter(item => item.title)
        };
    } catch (err) {
        console.warn('Failed to read hobbies state:', err);
        return { date: getTodayKey(), items: [] };
    }
}

function writeHobbiesState(state) {
    localStorage.setItem(getHobbiesStorageKey(), JSON.stringify(state));
}

function getDailyHobbiesState() {
    const today = getTodayKey();
    const state = readHobbiesState();
    if (state.date !== today) {
        const resetState = {
            date: today,
            items: state.items.map(item => ({ ...item, done: false }))
        };
        writeHobbiesState(resetState);
        return resetState;
    }
    return state;
}

function getSelectedTimerTaskId() {
    const select = document.getElementById('timer-task-select');
    if (select && select.value) {
        return select.value;
    }
    return localStorage.getItem(getDashboardTimerTaskStorageKey()) || '';
}

function cloneSerializable(value) {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

function setDashboardSessionsCache(sessions) {
    dashboardSessions = Array.isArray(sessions) ? cloneSerializable(sessions) : [];
}

function addDashboardSession(session) {
    if (!session || !session.id) return false;
    dashboardSessions = [...dashboardSessions.filter(entry => entry.id !== session.id), cloneSerializable(session)];
    return true;
}

function removeDashboardSession(sessionId) {
    const nextSessions = dashboardSessions.filter(session => session.id !== sessionId);
    const removed = nextSessions.length !== dashboardSessions.length;
    dashboardSessions = nextSessions;
    return removed;
}

function getDashboardTaskList(goalList = goals) {
    const safeGoals = Array.isArray(goalList) ? goalList : [];
    return safeGoals.flatMap(goal =>
        (Array.isArray(goal.tasks) ? goal.tasks : []).map(task => ({
            ...task,
            goalTitle: goal.title,
            goalId: goal.id
        }))
    );
}

function buildDashboardStatsSnapshot(goalList = goals, sessionList = dashboardSessions) {
    const safeGoals = Array.isArray(goalList) ? goalList : [];
    const safeSessions = Array.isArray(sessionList) ? sessionList : [];
    const allTasks = getDashboardTaskList(safeGoals);
    const doneTasks = allTasks.filter(task => task.status === 'done');

    const completionDates = doneTasks
        .filter(task => task.completedAt)
        .map(task => String(task.completedAt).split('T')[0]);

    const uniqueDays = [...new Set(completionDates)].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date(today);
    for (let i = 0; i < 365; i += 1) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (uniqueDays.includes(dateStr)) {
            streak += 1;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (i === 0) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
        } else {
            break;
        }
    }

    const heatmapData = {};
    const heatStart = new Date();
    heatStart.setDate(heatStart.getDate() - 364);
    for (let i = 0; i < 365; i += 1) {
        const day = new Date(heatStart);
        day.setDate(day.getDate() + i);
        heatmapData[day.toISOString().split('T')[0]] = 0;
    }
    completionDates.forEach((date) => {
        if (heatmapData[date] !== undefined) {
            heatmapData[date] += 1;
        }
    });

    const completionTrend = [];
    for (let i = 29; i >= 0; i -= 1) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        const key = day.toISOString().split('T')[0];
        completionTrend.push({ date: key, count: completionDates.filter(date => date === key).length });
    }

    const completedWithTimes = doneTasks.filter(task => task.completedAt && task.createdAt);
    let avgCompletionMs = 0;
    if (completedWithTimes.length > 0) {
        const totalMs = completedWithTimes.reduce((sum, task) => sum + (new Date(task.completedAt) - new Date(task.createdAt)), 0);
        avgCompletionMs = totalMs / completedWithTimes.length;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = allTasks.filter(task => {
        const isDueToday = task.dueDate && task.dueDate.split('T')[0] === todayStr;
        const isInProgress = task.status === 'in-progress';
        return isDueToday || isInProgress;
    });

    const timeByGoal = safeGoals
        .map(goal => ({
            title: goal.title,
            time: (Array.isArray(goal.tasks) ? goal.tasks : []).reduce((sum, task) => sum + (task.timeSpent || 0), 0)
        }))
        .filter(goal => goal.time > 0);

    return {
        totalGoals: safeGoals.length,
        totalTasks: allTasks.length,
        tasksByStatus: {
            todo: allTasks.filter(task => task.status === 'todo').length,
            'in-progress': allTasks.filter(task => task.status === 'in-progress').length,
            blocked: allTasks.filter(task => task.status === 'blocked').length,
            review: allTasks.filter(task => task.status === 'review').length,
            done: doneTasks.length
        },
        tasksByImportance: {
            low: allTasks.filter(task => task.importance === 'low').length,
            medium: allTasks.filter(task => task.importance === 'medium').length,
            high: allTasks.filter(task => task.importance === 'high').length,
            urgent: allTasks.filter(task => task.importance === 'urgent').length
        },
        totalTimeSpent: allTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0),
        totalTimerSessions: safeSessions.length,
        goalsProgress: safeGoals.map(goal => ({
            id: goal.id,
            title: goal.title,
            total: Array.isArray(goal.tasks) ? goal.tasks.length : 0,
            done: (Array.isArray(goal.tasks) ? goal.tasks : []).filter(task => task.status === 'done').length,
            percent: (Array.isArray(goal.tasks) ? goal.tasks : []).length > 0
                ? Math.round(((Array.isArray(goal.tasks) ? goal.tasks : []).filter(task => task.status === 'done').length / (Array.isArray(goal.tasks) ? goal.tasks : []).length) * 100)
                : 0
        })),
        streak,
        heatmapData,
        completionTrend,
        avgCompletionMs,
        todayFocus: todayTasks.length,
        todayTasks: todayTasks.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            importance: task.importance,
            dueDate: task.dueDate
        })),
        timeByGoal
    };
}

function setStatValue(element, value, instant = false) {
    if (!element) return;

    if (instant || typeof animateValue !== 'function') {
        element.textContent = String(value);
        return;
    }

    animateValue(element, 0, Number(value) || 0, 1200);
}

function renderDashboardStats(stats, sessions, instant = false) {
    const allTasksForGami = getDashboardTaskList();
    syncGreetingBanner();
    initHobbiesControls();
    if (typeof renderUpNext === 'function') renderUpNext(allTasksForGami);
    if (typeof renderDailyPlan === 'function') renderDailyPlan(allTasksForGami);
    if (typeof renderProductivityPulse === 'function') renderProductivityPulse(Array.isArray(sessions) ? sessions : dashboardSessions);

    setStatValue(document.getElementById('stat-goals'), stats.totalGoals, instant);
    setStatValue(document.getElementById('stat-tasks'), stats.totalTasks, instant);
    setStatValue(document.getElementById('stat-done'), stats.tasksByStatus.done, instant);

    const statTime = document.getElementById('stat-time');
    if (statTime) statTime.textContent = formatDuration(stats.totalTimeSpent);

    setStatValue(document.getElementById('stat-streak'), stats.streak, instant);
    const statStreakFront = document.getElementById('stat-streak-front');
    setStatValue(statStreakFront, stats.streak || 0, instant);
    setStatValue(document.getElementById('stat-focus'), stats.todayFocus, instant);
    setStatValue(document.getElementById('stat-sessions'), stats.totalTimerSessions, instant);

    const statAvg = document.getElementById('stat-avg');
    if (statAvg) {
        if (stats.avgCompletionMs > 0) {
            const hours = stats.avgCompletionMs / (1000 * 60 * 60);
            statAvg.textContent = hours < 24 ? `${Math.round(hours)}h` : `${Math.round(hours / 24)}d`;
        } else {
            statAvg.textContent = '—';
        }
    }

    renderCompletionTrend(stats.completionTrend);
    renderPriorityBreakdown(stats.tasksByImportance, stats.totalTasks);
    renderTimeDistribution(stats.timeByGoal);
    renderHeatmap(stats.heatmapData);

    const progressList = document.getElementById('goals-progress-list');
    if (progressList) {
        if (stats.goalsProgress.length === 0) {
            progressList.innerHTML = '<div class="empty-state-small">No goals yet</div>';
        } else {
            progressList.innerHTML = stats.goalsProgress.map(goal => `
              <div class="goal-progress-card">
                <div class="goal-progress-header">
                  <span class="goal-progress-title">${escHtml(goal.title)}</span>
                  <span class="goal-progress-percent">${goal.percent}%</span>
                </div>
                <div class="progress-bar"><div class="progress-bar-fill" style="width:${goal.percent}%"></div></div>
                <div class="goal-progress-meta"><span>${goal.done} of ${goal.total} tasks done</span></div>
              </div>`).join('');
        }
    }

    const total = stats.totalTasks || 1;
    ['todo', 'in-progress', 'blocked', 'review', 'done'].forEach(status => {
        const count = stats.tasksByStatus[status] || 0;
        const bar = document.getElementById(`bar-${status}`);
        const countEl = document.getElementById(`count-${status}`);
        if (bar) bar.style.width = `${(count / total) * 100}%`;
        if (countEl) countEl.textContent = count;
    });

    const recentContainer = document.getElementById('recent-sessions');
    if (recentContainer) {
        if (sessions.length === 0) {
            recentContainer.innerHTML = '<div class="empty-state-small">No sessions yet</div>';
        } else {
            const recent = sessions.slice(-8).reverse();
            recentContainer.innerHTML = recent.map(session => {
                const typeIcon = session.type === 'pomodoro' ? ICONS.timer : session.type === 'countdown' ? ICONS.hourglass : ICONS.clock;
                const taskName = findTaskName(session.taskId) || 'No task linked';
                const date = new Date(session.completedAt).toLocaleDateString();
                return `<div class="session-card"><div class="session-type">${typeIcon}</div><div class="session-info"><div class="session-task-name">${escHtml(taskName)}</div><div class="session-date">${date}</div></div><div class="session-duration">${formatDuration(session.duration)}</div></div>`;
            }).join('');
        }
    }
}

function renderDashboardInstant() {
    renderDashboardStats(buildDashboardStatsSnapshot(), dashboardSessions, true);
}

async function loadDashboard() {
    const [stats, sessions] = await Promise.all([
        apiGet('/api/stats'),
        apiGet('/api/timer-sessions')
    ]);
    setDashboardSessionsCache(sessions);
    renderDashboardStats(stats, dashboardSessions, false);
}

function renderCompletionTrend(trend) {
    const container = document.getElementById('completion-trend-chart');
    if (!container) return;

    if (!trend || trend.length === 0) {
        if (completionTrendChartInstance) {
            completionTrendChartInstance.destroy();
            completionTrendChartInstance = null;
        }
        container.innerHTML = '<div class="empty-state-small">No data yet</div>';
        return;
    }

    let canvas = container.querySelector('canvas#completion-trend-canvas');
    if (!canvas) {
        container.innerHTML = '<canvas id="completion-trend-canvas"></canvas>';
        canvas = container.querySelector('canvas#completion-trend-canvas');
    }

    if (!window.Chart) return;

    const labels = trend.map(t => {
        const d = new Date(t.date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = trend.map(t => t.count);

    Chart.defaults.color = '#8b8b9e';
    Chart.defaults.font.family = 'Inter';

    if (completionTrendChartInstance) {
        completionTrendChartInstance.data.labels = labels;
        completionTrendChartInstance.data.datasets[0].data = data;
        completionTrendChartInstance.update('none');
        return;
    }

    completionTrendChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Tasks Completed',
                data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#10b981',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, precision: 0 },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { maxTicksLimit: 7, maxRotation: 0 }
                }
            }
        }
    });
}


function renderPriorityBreakdown(byImportance, total) {
    const container = document.getElementById('priority-breakdown');
    if (!container) return;
    const t = total || 1;
    const items = [
        { label: 'Urgent', color: '#f43f5e', count: byImportance.urgent || 0 },
        { label: 'High', color: '#fb923c', count: byImportance.high || 0 },
        { label: 'Medium', color: '#8b5cf6', count: byImportance.medium || 0 },
        { label: 'Low', color: '#2dd4bf', count: byImportance.low || 0 },
    ];
    const hasData = items.some(i => i.count > 0);
    if (!hasData) {
        container.innerHTML = '<div class="empty-state-small">No data yet</div>';
        return;
    }
    // Generate SVG for donut chart
    const activeItems = items.filter(i => i.count > 0);
    
    let donutHtml = '';
    
    if (activeItems.length === 1) {
        // Single item without gaps
        donutHtml = `<svg viewBox="0 0 42 42" class="donut-ring" style="width: 140px; height: 140px; transform: rotate(-90deg);">
            <circle cx="21" cy="21" r="15.915494309189533" fill="transparent" stroke="${activeItems[0].color}" stroke-width="6"></circle>
        </svg>`;
    } else {
        const strokeWidth = 6;
        const logicalGap = 8;
        const remaining = 100 - (activeItems.length * logicalGap);
        let currentOffset = 0;
        
        let circles = '';
        activeItems.forEach(item => {
            const length = Math.max((item.count / t) * remaining, 0.1);
            circles += `<circle cx="21" cy="21" r="15.915494309189533" fill="transparent" stroke="${item.color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-dasharray="${length} ${100 - length}" stroke-dashoffset="-${currentOffset}"></circle>`;
            currentOffset += length + logicalGap;
        });
        
        donutHtml = `<svg viewBox="0 0 42 42" class="donut-ring" style="width: 140px; height: 140px; transform: rotate(-90deg);">
            ${circles}
        </svg>`;
    }

    container.innerHTML = `
        ${donutHtml}
        <div class="donut-legend">
            ${items.map(i => `
                <div class="donut-legend-item">
                    <div class="legend-dot-label">
                        <span class="legend-dot" style="background:${i.color}"></span>
                        <span class="legend-label" style="color:${i.color}">${i.label}</span>
                    </div>
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
function renderUpNext(tasks) {
    const container = document.getElementById('up-next-container');
    if (!container) return;

    const selectedTaskId = getSelectedTimerTaskId();
    const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;

    let task = selectedTask;
    if (!task) {
        let validTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'review');
        if (validTasks.length === 0) {
            container.innerHTML = '<div class="empty-state-small text-muted">No pending tasks! Select a task from Timer tab to pin it here.</div>';
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

        task = validTasks[0];
    }

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

    const linkedTimerTaskId = getSelectedTimerTaskId();
    const isLinkedToTimer = linkedTimerTaskId === task.id;

    // Calculate subtask progress for visual bar
    const subtasks = task.subtasks || [];
    const subtaskDone = subtasks.filter(s => s.done).length;
    const progressPct = subtasks.length > 0 ? Math.round((subtaskDone / subtasks.length) * 100) : 0;
    const showProgress = subtasks.length > 0 || isLinkedToTimer;

    const timerModeLabel = {
        pomodoro: 'POMODORO',
        stopwatch: 'STOPWATCH',
        countdown: 'COUNTDOWN'
    }[timerMode] || 'TIMER';

    const liveSeconds = timerMode === 'stopwatch' ? stopwatchSeconds : timerSeconds;
    const liveTotal = timerMode === 'stopwatch'
        ? Math.max(stopwatchSeconds, 1)
        : Math.max(timerTotalSeconds || timerSeconds || 1, 1);
    const liveElapsed = timerMode === 'stopwatch' ? stopwatchSeconds : Math.max(0, liveTotal - timerSeconds);
    const timerProgressPct = Math.max(0, Math.min(100, Math.round((liveElapsed / liveTotal) * 100)));
    const resolvedProgressPct = isLinkedToTimer ? timerProgressPct : (progressPct > 0 ? progressPct : 65);
    const liveTimerText = typeof formatTimeDisplay === 'function' ? formatTimeDisplay(Math.max(0, liveSeconds)) : String(Math.max(0, liveSeconds));

    const liveMetaLeft = isLinkedToTimer
        ? `${timerModeLabel} ${timerRunning ? 'RUNNING' : 'PAUSED'}`
        : (showProgress ? `${subtaskDone}/${subtasks.length} subtasks` : 'Not linked to timer');
    const liveMetaRight = isLinkedToTimer
        ? liveTimerText
        : (showProgress ? `${resolvedProgressPct}%` : '—');

    container.innerHTML = `
        <div class="focus-task-item">
            <div class="focus-task-header-row">
                <span class="focus-task-sparkle">✨</span>
                <span class="focus-task-status-badge">${statusLabel}</span>
            </div>
            <div class="focus-task-title-text">${escHtml(task.title)}</div>
            <div class="focus-task-subtitle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                ${escHtml(goalName)}
            </div>
            ${showProgress || true ? `
            <div class="focus-task-progress-wrap">
                <div class="focus-task-progress-track">
                    <div class="focus-task-progress-fill" style="width: ${resolvedProgressPct}%"></div>
                </div>
                <div class="focus-task-time-row">
                    <span>${liveMetaLeft}</span>
                    <span>${liveMetaRight}</span>
                </div>
            </div>` : ''}
            <div class="focus-task-actions-row">
                <button class="btn btn-options" onclick="event.stopPropagation(); openEditTask('${task.id}')">
                    ...
                </button>
                <button class="btn btn-pause" onclick="quickToggleFocusTimer('${task.id}')">${timerRunning ? 'Pause' : 'Start'}</button>
            </div>
        </div>
    `;
}

async function completeTaskFromDashboard(taskId) {
    const task = getAllTasks().find(t => t.id === taskId);
    if (!task) return;

    const snapshot = typeof snapshotGoalsState === 'function' ? snapshotGoalsState() : null;
    const optimisticTask = buildOptimisticTaskFromInput(task, { status: 'done' });
    if (typeof upsertTaskInState === 'function') {
        upsertTaskInState(optimisticTask);
    }
    if (typeof refreshTaskViews === 'function') {
        refreshTaskViews();
    }

    try {
        const updatedTask = await apiPut(`/api/tasks/${taskId}`, { status: 'done' });
        // Silently merge server data — no re-render needed, optimistic UI was correct
        if (typeof upsertTaskInState === 'function') {
            upsertTaskInState(updatedTask);
        }
        if (typeof refreshDashboardData === 'function') {
            void refreshDashboardData();
        }
        showToast(`Task "${task.title}" marked as done`);
        logSystemEvent('Task completed from dashboard');
    } catch (err) {
        console.error('Failed to complete task from dashboard:', err);
        if (snapshot) {
            restoreGoalsState(snapshot);
            if (typeof refreshTaskViews === 'function') {
                refreshTaskViews();
            }
        }
        showToast('Failed to complete task', 'error');
    }
}

function quickToggleFocusTimer(taskId) {
    currentTaskId = taskId;

    if (typeof populateTimerTaskSelect === 'function') {
        populateTimerTaskSelect();
    }

    const timerSelect = document.getElementById('timer-task-select');
    if (timerSelect) {
        timerSelect.value = taskId;
        localStorage.setItem(getDashboardTimerTaskStorageKey(), taskId);
    }

    if (typeof toggleTimer === 'function') {
        toggleTimer();
    }

    renderUpNext(getAllTasks());
}

function initHobbiesControls() {
    const addBtn = document.getElementById('btn-add-hobby');
    const input = document.getElementById('hobby-input');
    if (!addBtn || !input || addBtn._hobbyBound) return;

    const addHobbyFromInput = () => {
        const trimmed = input.value.trim();
        if (!trimmed) {
            input.focus();
            return;
        }

        const state = getDailyHobbiesState();
        state.items.push({
            id: `hobby-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            title: trimmed,
            done: false
        });
        writeHobbiesState(state);
        input.value = '';
        renderDailyPlan(getAllTasks());
        showToast('Routine added');
    };

    addBtn._hobbyBound = true;
    input._hobbyBound = true;

    addBtn.addEventListener('click', addHobbyFromInput);
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addHobbyFromInput();
        }
    });
}

function toggleHobbyDone(hobbyId) {
    const state = getDailyHobbiesState();
    const hobby = state.items.find(item => item.id === hobbyId);
    if (!hobby) return;

    hobby.done = !hobby.done;
    writeHobbiesState(state);
    renderDailyPlan(getAllTasks());
}

function deleteHobby(hobbyId) {
    const state = getDailyHobbiesState();
    const index = state.items.findIndex(item => item.id === hobbyId);
    if (index === -1) return;

    state.items.splice(index, 1);
    writeHobbiesState(state);
    renderDailyPlan(getAllTasks());

    if (typeof showToast === 'function') {
        showToast('Routine deleted');
    }
}

function renderDailyPlan(tasks) {
    const container = document.getElementById('daily-plan-container');
    if (!container) return;

    const hobbyState = getDailyHobbiesState();
    if (hobbyState.items.length === 0) {
        container.innerHTML = '<div class="empty-state-small text-muted" style="text-align:left;">No daily routines yet. Add one to get started.</div>';
        return;
    }

    container.innerHTML = hobbyState.items.map(hobby => {
        const isDone = hobby.done;
        return `
        <div class="daily-action-item ${isDone ? 'done' : ''}" onclick="toggleHobbyDone('${hobby.id}')" style="cursor:pointer;">
            <div class="daily-action-left">
                <button class="daily-action-delete" type="button" aria-label="Delete routine" title="Delete routine" onclick="event.stopPropagation(); deleteHobby('${hobby.id}')">&times;</button>
                <div class="daily-action-check"></div>
                <div class="daily-action-title">${escHtml(hobby.title)}</div>
            </div>
            <span class="daily-action-done-badge">${isDone ? 'DONE' : ''}</span>
        </div>
    `}).join('');
}

function renderProductivityPulse(sessions) {
    const canvas = document.getElementById('productivity-chart');
    if (!canvas) return;

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

    if (!window.Chart) return;

    Chart.defaults.color = '#8b8b9e';
    Chart.defaults.font.family = 'Inter';

    if (productivityChartInstance) {
        productivityChartInstance.data.labels = last7Days;
        productivityChartInstance.data.datasets[0].data = dataPoints;
        productivityChartInstance.update('none');
        return;
    }

    productivityChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Minutes Focused',
                data: dataPoints,
                borderColor: '#8b5cf6',
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx: c, chartArea } = chart;
                    if (!chartArea) return 'rgba(139, 92, 246, 0.15)';
                    const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
                    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.02)');
                    return gradient;
                },
                borderWidth: 2.5,
                pointRadius: 4,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#1a1a2e',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                tension: 0.45,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.parsed.y} min focused`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { maxTicksLimit: 5 }
                },
                x: { grid: { display: false } }
            }
        }
    });
}


// ==========================================
// DATA EXPORT
