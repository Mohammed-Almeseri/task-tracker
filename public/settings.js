// Settings feature module

const SETTINGS_AUTH_EMAIL_STORAGE_KEY = 'task_tracker_current_email';
const SETTINGS_AUTH_TOKEN_STORAGE_KEY = 'task_tracker_supabase_access_token';

function getSettingsStorageKey(baseKey) {
    return typeof getScopedStorageKey === 'function' ? getScopedStorageKey(baseKey) : baseKey;
}

function clearSupabaseAuthStorage() {
    const keysToRemove = [];
    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
}

function clearCurrentAccountScopedStorage() {
    const currentUserKey = typeof getCurrentUserKey === 'function'
        ? getCurrentUserKey()
        : String(localStorage.getItem(SETTINGS_AUTH_EMAIL_STORAGE_KEY) || '').trim().toLowerCase();

    const keysToRemove = [];
    const legacyKeys = [
        'task_tracker_settings',
        'task_tracker_hobbies_v1',
        'task_tracker_timer_selected_task',
        'task_tracker_runtime_state_v1',
        'task_tracker_system_logs_v1'
    ];

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key) {
            continue;
        }

        if (legacyKeys.includes(key)) {
            keysToRemove.push(key);
            continue;
        }

        if (currentUserKey && key.endsWith(`:${currentUserKey}`)) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
}

async function clearAuthSession() {
    const accessToken = String(localStorage.getItem(SETTINGS_AUTH_TOKEN_STORAGE_KEY) || '').trim();
    localStorage.removeItem(SETTINGS_AUTH_EMAIL_STORAGE_KEY);
    localStorage.removeItem(SETTINGS_AUTH_TOKEN_STORAGE_KEY);
    clearSupabaseAuthStorage();

    try {
        await fetch('/api/auth/session', {
            method: 'DELETE',
            cache: 'no-store',
            ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {})
        });
    } catch (error) {
        // Ignore network failures during sign-out.
    }
}

window.clearAuthSession = clearAuthSession;

async function deleteAccount() {
    const accessToken = String(localStorage.getItem(SETTINGS_AUTH_TOKEN_STORAGE_KEY) || '').trim();
    const deleteButton = document.getElementById('btn-delete-account');

    if (!accessToken) {
        showToast('Your session has expired. Please sign in again.', 'error');
        window.location.replace('login.html');
        return;
    }

    if (deleteButton) {
        deleteButton.disabled = true;
    }

    try {
        const response = await fetch('/api/account', {
            method: 'DELETE',
            cache: 'no-store',
            headers: buildAuthHeaders()
        });

        if (response.status === 401) {
            await clearAuthSession();
            window.location.replace('login.html');
            return;
        }

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || 'Failed to delete account');
        }

        clearCurrentAccountScopedStorage();
        await clearAuthSession();
        window.location.replace('login.html?deleted=1');
    } catch (error) {
        console.error('Delete account failed:', error);
        showToast(error.message || 'Failed to delete account', 'error');
    } finally {
        if (deleteButton) {
            deleteButton.disabled = false;
        }
    }
}

window.deleteAccount = deleteAccount;

function loadSettings() {
    const saved = localStorage.getItem(getSettingsStorageKey('task_tracker_settings'));
    if (saved) {
        try {
            settings = { ...defaultSettings, ...JSON.parse(saved) };
        } catch (error) {
            console.error('Failed to parse settings', error);
        }
    }
    applyThemeSettings();
}

function saveSettings() {
    localStorage.setItem(getSettingsStorageKey('task_tracker_settings'), JSON.stringify(settings));
    applyThemeSettings();
}

function applyThemeSettings() {
    const root = document.documentElement;
    const color = settings.accents[settings.accentColor] || settings.accents.purple;
    root.style.setProperty('--accent', color);
    const theme = settings.theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    if (document.body) {
        document.body.classList.toggle('sidebar-collapsed', Boolean(settings.sidebarCollapsed));
    }

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
        themeMeta.setAttribute('content', theme === 'light' ? '#f4f7fb' : '#09090b');
    }

    const nameInput = document.getElementById('user-name-input');
    if (nameInput) {
        nameInput.value = settings.profileName;
    }

    const themeSelect = document.getElementById('theme-mode-select');
    if (themeSelect) {
        themeSelect.value = theme;
    }

    const sidebarToggle = document.getElementById('btn-sidebar-toggle');
    if (sidebarToggle) {
        const isCollapsed = Boolean(settings.sidebarCollapsed);
        sidebarToggle.setAttribute('aria-pressed', String(isCollapsed));
        sidebarToggle.setAttribute('aria-label', isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
        sidebarToggle.title = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
    }

    const noteEditorContainer = document.getElementById('note-editor-container');
    if (noteEditorContainer) {
        noteEditorContainer.classList.toggle('toastui-editor-dark', theme !== 'light');
    }

    const greeting = document.getElementById('dashboard-greeting');
    if (greeting) {
        const hour = new Date().getHours();
        let intro = 'Good morning';
        if (hour >= 12 && hour < 17) intro = 'Good afternoon';
        if (hour >= 17) intro = 'Good evening';
        greeting.textContent = `${intro}, ${settings.profileName}`;
    }

    document.querySelectorAll('.btn-color-preset').forEach((button) => {
        button.classList.toggle('active', button.title.toLowerCase() === settings.accentColor);
    });
}

window.setAccentColor = (colorName) => {
    settings.accentColor = colorName;
    saveSettings();
    showToast(`Accent color updated to ${colorName}`);
};

window.setThemeMode = (themeName) => {
    settings.theme = themeName === 'light' ? 'light' : 'dark';
    saveSettings();
    if (typeof syncNoteEditorTheme === 'function') {
        syncNoteEditorTheme();
    }
    showToast(`Theme updated to ${settings.theme}`);
};

window.toggleSidebarCollapsed = () => {
    settings.sidebarCollapsed = !settings.sidebarCollapsed;
    saveSettings();
};

function initSettingsView() {
    const btnLog = document.getElementById('btn-log-manual-time');
    if (btnLog) btnLog.addEventListener('click', saveManualTime);

    const btnSaveProfile = document.getElementById('btn-save-profile');
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', () => {
            const nameInput = document.getElementById('user-name-input');
            const name = nameInput ? nameInput.value.trim() : '';
            if (name) {
                settings.profileName = name;
                saveSettings();
                showToast('Profile updated');
            }
        });
    }

    const themeModeSelect = document.getElementById('theme-mode-select');
    if (themeModeSelect) {
        themeModeSelect.addEventListener('change', () => setThemeMode(themeModeSelect.value));
    }

    const btnReset = document.getElementById('btn-reset-data');
    if (btnReset) {
        btnReset.addEventListener('click', resetAppData);
    }

    const btnDeleteAccount = document.getElementById('btn-delete-account');
    if (btnDeleteAccount) {
        btnDeleteAccount.addEventListener('click', () => {
            showConfirmModal('Delete your account, login, and all saved data? This cannot be undone.', deleteAccount);
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            if (!window.confirm('Sign out of this browser?')) {
                return;
            }

            btnLogout.disabled = true;

            try {
                if (typeof clearAuthSession === 'function') {
                    await clearAuthSession();
                } else {
                    localStorage.removeItem(SETTINGS_AUTH_EMAIL_STORAGE_KEY);
                    localStorage.removeItem(SETTINGS_AUTH_TOKEN_STORAGE_KEY);
                }
            } finally {
                window.location.replace('login.html');
            }
        });
    }
}

async function resetAppData() {
    showConfirmModal('Permanently delete ALL data? This cannot be undone.', async () => {
        try {
            const items = ['goals', 'notes', 'timer-sessions'];
            for (const item of items) {
                const list = await apiGet(`/api/${item}`);
                for (const entry of list) {
                    await apiDelete(`/api/${item === 'goals' ? 'goals' : (item === 'timer-sessions' ? 'timer-sessions' : item)}/${entry.id}`);
                }
            }

            const scopedKeys = [
                'task_tracker_settings',
                'task_tracker_hobbies_v1',
                'task_tracker_timer_selected_task',
                'task_tracker_runtime_state_v1'
            ];

            scopedKeys.forEach((baseKey) => {
                localStorage.removeItem(getSettingsStorageKey(baseKey));
            });

            if (typeof clearSystemLogs === 'function') {
                clearSystemLogs();
            } else {
                localStorage.removeItem(getSettingsStorageKey('task_tracker_system_logs_v1'));
            }

            showToast('All data has been reset');
            logSystemEvent('All app data reset');
            location.reload();
        } catch (error) {
            console.error('Reset failed:', error);
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
                const option = document.createElement('option');
                option.value = task.id;
                option.textContent = `${goal.title} → ${task.title}`;
                select.appendChild(option);
            }
        }
    }
}

async function saveManualTime() {
    const taskSelect = document.getElementById('manual-task-select');
    const durationInput = document.getElementById('manual-duration-input');
    const taskId = taskSelect ? taskSelect.value : '';
    const durationMins = durationInput ? parseInt(durationInput.value, 10) : Number.NaN;

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
        if (durationInput) {
            durationInput.value = '';
        }
        await loadGoals();
    } catch (error) {
        console.error('Failed to log time:', error);
        showToast('Failed to log time', 'error');
    }
}
