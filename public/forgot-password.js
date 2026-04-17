import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const AUTH_EMAIL_STORAGE_KEY = 'task_tracker_current_email';
const AUTH_TOKEN_STORAGE_KEY = 'task_tracker_supabase_access_token';
const REQUEST_LABEL = 'Send reset link';
const REQUEST_BUSY_LABEL = 'Sending...';
const UPDATE_LABEL = 'Update password';
const UPDATE_BUSY_LABEL = 'Updating...';

const elements = {
    requestForm: document.getElementById('reset-request-form'),
    updateForm: document.getElementById('reset-update-form'),
    resetEmail: document.getElementById('reset-email'),
    resetNewPassword: document.getElementById('reset-new-password'),
    resetConfirmPassword: document.getElementById('reset-confirm-password'),
    requestSubmit: document.getElementById('reset-request-submit'),
    updateSubmit: document.getElementById('reset-update-submit'),
    status: document.getElementById('auth-status'),
    toastContainer: document.getElementById('auth-toast-container'),
    kicker: document.getElementById('recovery-kicker'),
    title: document.getElementById('recovery-title'),
    chip: document.getElementById('recovery-chip'),
    intro: document.getElementById('recovery-intro')
};

const motionState = {
    pointerRaf: null,
    cursorX: window.innerWidth * 0.68,
    cursorY: window.innerHeight * 0.24
};

const state = {
    supabase: null,
    mode: getInitialMode(),
    busy: false,
    recoveryReady: false
};

function getInitialMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'update' ? 'update' : 'request';
}

function setCursorLightPosition(x, y) {
    document.documentElement.style.setProperty('--cursor-x', `${Math.round(x)}px`);
    document.documentElement.style.setProperty('--cursor-y', `${Math.round(y)}px`);
}

function initializePointerLight() {
    setCursorLightPosition(motionState.cursorX, motionState.cursorY);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(pointer: fine)').matches) {
        return;
    }

    const handlePointerMove = (event) => {
        motionState.cursorX = event.clientX;
        motionState.cursorY = event.clientY;

        if (motionState.pointerRaf) {
            return;
        }

        motionState.pointerRaf = window.requestAnimationFrame(() => {
            setCursorLightPosition(motionState.cursorX, motionState.cursorY);
            motionState.pointerRaf = null;
        });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', () => {
        motionState.cursorX = window.innerWidth * 0.68;
        motionState.cursorY = window.innerHeight * 0.24;
        setCursorLightPosition(motionState.cursorX, motionState.cursorY);
    }, { passive: true });
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function showAuthToast(message, variant = 'info') {
    const container = elements.toastContainer;
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `auth-toast is-${variant}`;
    toast.innerHTML = `
        <div class="auth-toast-title">${variant === 'error' ? 'Action needed' : variant === 'success' ? 'Done' : 'Notice'}</div>
        <div class="auth-toast-message">${escapeHtml(message)}</div>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    window.setTimeout(() => {
        toast.classList.add('is-exiting');
        window.setTimeout(() => toast.remove(), 220);
    }, 2800);
}

function setStatus(message, variant = 'info') {
    if (!elements.status) return;

    elements.status.textContent = message;
    elements.status.className = `auth-status is-${variant}`;
}

function setMode(mode) {
    state.mode = mode;
    syncFormState();
    updateCopy();
}

function updateCopy() {
    const isUpdateMode = state.mode === 'update';

    if (elements.kicker) {
        elements.kicker.textContent = isUpdateMode && state.recoveryReady ? 'Recovery link confirmed' : 'Password recovery';
    }

    if (elements.title) {
        elements.title.textContent = isUpdateMode ? 'Set a new password' : 'Forgot your password?';
    }

    if (elements.chip) {
        elements.chip.textContent = isUpdateMode
            ? (state.recoveryReady ? 'Recovery session' : 'Awaiting link')
            : 'Supabase recovery';
    }

    if (elements.intro) {
        if (isUpdateMode) {
            elements.intro.textContent = state.recoveryReady
                ? 'Create a new password for your account.'
                : 'Open the recovery link from your email to continue.';
        } else {
            elements.intro.textContent = 'Enter the email on your account and we will send a reset link.';
        }
    }
}

function syncFormState() {
    const requestMode = state.mode === 'request';
    const updateMode = state.mode === 'update';
    const updateReady = updateMode && state.recoveryReady;

    if (elements.requestForm) {
        elements.requestForm.hidden = !requestMode;
    }

    if (elements.updateForm) {
        elements.updateForm.hidden = !updateMode;
    }

    if (elements.resetEmail) {
        elements.resetEmail.disabled = state.busy || !requestMode;
    }

    if (elements.requestSubmit) {
        elements.requestSubmit.disabled = state.busy || !requestMode;
        elements.requestSubmit.textContent = state.busy && requestMode ? REQUEST_BUSY_LABEL : REQUEST_LABEL;
    }

    if (elements.resetNewPassword) {
        elements.resetNewPassword.disabled = state.busy || !updateReady;
    }

    if (elements.resetConfirmPassword) {
        elements.resetConfirmPassword.disabled = state.busy || !updateReady;
    }

    if (elements.updateSubmit) {
        elements.updateSubmit.disabled = state.busy || !updateReady;
        if (state.busy && updateMode) {
            elements.updateSubmit.textContent = UPDATE_BUSY_LABEL;
        } else if (updateMode && !state.recoveryReady) {
            elements.updateSubmit.textContent = 'Awaiting recovery link';
        } else {
            elements.updateSubmit.textContent = UPDATE_LABEL;
        }
    }
}

function setBusy(isBusy) {
    state.busy = isBusy;
    syncFormState();
}

function clearResetAuthStorage() {
    const keysToRemove = [];
    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (
            key &&
            (
                key === AUTH_EMAIL_STORAGE_KEY ||
                key === AUTH_TOKEN_STORAGE_KEY ||
                key.startsWith('sb-') ||
                key.includes('supabase')
            )
        ) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
}

async function loadSupabaseConfig() {
    const fallbackConfig = {
        supabaseUrl: window.SUPABASE_URL || window.__SUPABASE_URL__ || '',
        supabaseAnonKey: window.SUPABASE_ANON_KEY || window.__SUPABASE_ANON_KEY__ || ''
    };

    try {
        const response = await fetch('/api/supabase-config');
        if (!response.ok) {
            return fallbackConfig;
        }

        const config = await response.json();
        return {
            supabaseUrl: config.supabaseUrl || fallbackConfig.supabaseUrl,
            supabaseAnonKey: config.supabaseAnonKey || fallbackConfig.supabaseAnonKey
        };
    } catch (error) {
        return fallbackConfig;
    }
}

function redirectToDashboard() {
    window.location.replace('index.html');
}

async function initializeSupabase() {
    const config = await loadSupabaseConfig();

    if (!config.supabaseUrl || !config.supabaseAnonKey) {
        setStatus('Supabase is not configured for this deployment. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel.', 'error');
        return;
    }

    state.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
            storage: window.localStorage,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            persistSession: true
        }
    });

    state.supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            const email = session?.user?.email || '';
            state.recoveryReady = Boolean(session);
            if (email && elements.resetEmail) {
                elements.resetEmail.value = email;
            }
            updateCopy();
            syncFormState();
            setStatus('Recovery link confirmed. Choose a new password.', 'success');
            return;
        }

        if (session?.user?.email && state.mode === 'update') {
            state.recoveryReady = true;
            if (elements.resetEmail) {
                elements.resetEmail.value = session.user.email;
            }
            updateCopy();
            syncFormState();
        }
    });

    const { data, error } = await state.supabase.auth.getSession();
    if (error) {
        setStatus(error.message || 'Unable to load your Supabase session.', 'error');
        return;
    }

    if (data?.session) {
        if (state.mode === 'update') {
            state.recoveryReady = true;
            if (elements.resetEmail && data.session.user?.email) {
                elements.resetEmail.value = data.session.user.email;
            }
            updateCopy();
            syncFormState();
            setStatus('Recovery link confirmed. Choose a new password.', 'success');
            return;
        }

        redirectToDashboard();
        return;
    }

    if (state.mode === 'update') {
        state.recoveryReady = false;
        updateCopy();
        syncFormState();
        setStatus('Open the recovery link from your email to continue.', 'info');
    } else {
        setStatus('Enter the email linked to your account to receive a reset link.', 'info');
    }
}

async function handleResetRequest(event) {
    event.preventDefault();

    if (!state.supabase) {
        setStatus('Supabase is not configured for this deployment. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel.', 'error');
        return;
    }

    const email = String(elements.resetEmail?.value || '').trim();
    if (!email) {
        setStatus('Enter the email linked to your account.', 'error');
        elements.resetEmail?.focus();
        return;
    }

    setBusy(true);
    setStatus('Sending reset link...', 'info');

    try {
        const redirectTo = `${window.location.origin}/forgot-password.html?mode=update`;
        const { error } = await state.supabase.auth.resetPasswordForEmail(email, {
            redirectTo
        });

        if (error) {
            throw error;
        }

        setStatus('Reset link sent. Check your inbox and spam folder.', 'success');
        showAuthToast('Reset link sent. Check your inbox.', 'success');
    } catch (error) {
        const message = error.message || 'Unable to send the reset link.';
        setStatus(message, 'error');
        showAuthToast(message, 'error');
    } finally {
        setBusy(false);
        elements.resetEmail?.focus();
    }
}

async function handlePasswordUpdate(event) {
    event.preventDefault();

    if (!state.supabase) {
        setStatus('Supabase is not configured for this deployment. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel.', 'error');
        return;
    }

    if (!state.recoveryReady) {
        setStatus('Open the recovery link from your email to continue.', 'error');
        return;
    }

    const newPassword = String(elements.resetNewPassword?.value || '');
    const confirmPassword = String(elements.resetConfirmPassword?.value || '');

    if (!newPassword || !confirmPassword) {
        setStatus('Enter and confirm your new password.', 'error');
        return;
    }

    if (newPassword.length < 8) {
        setStatus('Password must be at least 8 characters long.', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        setStatus('Passwords do not match.', 'error');
        return;
    }

    setBusy(true);
    setStatus('Updating password...', 'info');

    try {
        const { error } = await state.supabase.auth.updateUser({ password: newPassword });
        if (error) {
            throw error;
        }

        clearResetAuthStorage();
        setStatus('Password updated. Redirecting to sign in...', 'success');
        showAuthToast('Password updated successfully.', 'success');
        window.setTimeout(() => {
            window.location.replace('login.html?reset=1');
        }, 700);
    } catch (error) {
        const message = error.message || 'Unable to update the password.';
        setStatus(message, 'error');
        showAuthToast(message, 'error');
    } finally {
        setBusy(false);
    }
}

function bindEvents() {
    if (elements.requestForm) {
        elements.requestForm.addEventListener('submit', handleResetRequest);
    }

    if (elements.updateForm) {
        elements.updateForm.addEventListener('submit', handlePasswordUpdate);
    }
}

async function bootstrap() {
    bindEvents();
    initializePointerLight();
    setMode(state.mode);
    await initializeSupabase();
    if (state.mode === 'request' && elements.resetEmail) {
        elements.resetEmail.focus();
    } else if (state.mode === 'update' && state.recoveryReady && elements.resetNewPassword) {
        elements.resetNewPassword.focus();
    }
}

document.addEventListener('DOMContentLoaded', bootstrap);
