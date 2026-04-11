// Settings feature module

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
            const items = ['goals', 'notes', 'timer-sessions'];
            for (const item of items) {
                const list = await apiGet(`/api/${item}`);
                for (const entry of list) {
                    await apiDelete(`/api/${item === 'goals' ? 'goals' : (item === 'timer-sessions' ? 'timer-sessions' : item)}/${entry.id}`);
                }
            }
            if (typeof clearSystemLogs === 'function') {
                clearSystemLogs();
            } else {
                localStorage.removeItem('task_tracker_system_logs_v1');
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
        console.error('Failed to log time:', err);
        showToast('Failed to log time', 'error');
    }
}