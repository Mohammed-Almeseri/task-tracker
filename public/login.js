import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const AUTH_EMAIL_STORAGE_KEY = 'task_tracker_current_email';
const AUTH_TOKEN_STORAGE_KEY = 'task_tracker_supabase_access_token';
const DEFAULT_SUPABASE_URL = 'https://wqnrdahctafgdvsprkju.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbnJkYWhjdGFmZ2R2c3Bya2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjczNTUsImV4cCI6MjA5MTc0MzM1NX0.cRoE9OOw7xYsQ1BSsAFz1rRhfNQqF98qa8_R7E6bl7g';

const elements = {
    tabs: Array.from(document.querySelectorAll('.auth-tab[data-mode]')),
    signInForm: document.getElementById('signin-form'),
    signUpForm: document.getElementById('signup-form'),
    signInEmail: document.getElementById('signin-email'),
    signInPassword: document.getElementById('signin-password'),
    signInSubmit: document.getElementById('signin-submit'),
    signUpEmail: document.getElementById('signup-email'),
    signUpPassword: document.getElementById('signup-password'),
    signUpConfirm: document.getElementById('signup-confirm'),
    signUpSubmit: document.getElementById('signup-submit'),
    status: document.getElementById('auth-status'),
    toastContainer: document.getElementById('auth-toast-container')
};

const state = {
    supabase: null,
    mode: 'signin'
};

const motionState = {
    pointerRaf: null,
    cursorX: window.innerWidth * 0.68,
    cursorY: window.innerHeight * 0.24
};

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

async function syncServerSession(session) {
    const accessToken = session?.access_token || '';
    if (!accessToken) {
        throw new Error('Unable to create a secure server session.');
    }

    const response = await fetch('/api/auth/session', {
        method: 'POST',
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accessToken })
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to create a secure server session.');
    }
}

function setStatus(message, variant = 'info') {
    if (!elements.status) return;

    elements.status.textContent = message;
    elements.status.className = `auth-status is-${variant}`;
}

function setCurrentUserEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    if (normalized) {
        localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, normalized);
    }
}

function setCurrentAccessToken(accessToken) {
    const normalized = String(accessToken || '').trim();
    if (normalized) {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, normalized);
    }
}

function clearCurrentUserEmail() {
    localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
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

function notifyStatus(message, variant = 'info') {
    setStatus(message, variant);
    showAuthToast(message, variant);
}

function getInitialMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'signup' ? 'signup' : 'signin';
}

function setMode(mode) {
    state.mode = mode;
    const isSignIn = mode === 'signin';

    elements.tabs.forEach((tab) => {
        const active = tab.dataset.mode === mode;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
    });

    if (elements.signInForm) {
        elements.signInForm.hidden = !isSignIn;
    }

    if (elements.signUpForm) {
        elements.signUpForm.hidden = isSignIn;
    }
}

function setBusy(isBusy) {
    const submitButtons = [elements.signInSubmit, elements.signUpSubmit].filter(Boolean);
    const formControls = [
        ...elements.tabs,
        elements.signInEmail,
        elements.signInPassword,
        elements.signUpEmail,
        elements.signUpPassword,
        elements.signUpConfirm,
        elements.signInSubmit,
        elements.signUpSubmit
    ].filter(Boolean);

    submitButtons.forEach((button) => {
        button.disabled = isBusy;
        button.classList.toggle('is-busy', isBusy);
        button.setAttribute('aria-busy', String(isBusy));
    });

    formControls.forEach((control) => {
        control.disabled = isBusy;
    });

    [elements.signInForm, elements.signUpForm].filter(Boolean).forEach((form) => {
        form.setAttribute('aria-busy', String(isBusy));
    });
}

function redirectToDashboard() {
    window.location.replace('index.html');
}

async function loadSupabaseConfig() {
    const fallbackConfig = {
        supabaseUrl: window.SUPABASE_URL || window.__SUPABASE_URL__ || DEFAULT_SUPABASE_URL,
        supabaseAnonKey: window.SUPABASE_ANON_KEY || window.__SUPABASE_ANON_KEY__ || DEFAULT_SUPABASE_ANON_KEY
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

async function initializeSupabase() {
    const config = await loadSupabaseConfig();

    if (!config.supabaseUrl || !config.supabaseAnonKey) {
        setStatus('Supabase is not configured yet. Check the URL and anon key.', 'error');
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
        if (session?.user?.email) {
            setCurrentUserEmail(session.user.email);
            setCurrentAccessToken(session.access_token || '');
        } else if (event === 'SIGNED_OUT') {
            clearCurrentUserEmail();
        }

        if (event === 'TOKEN_REFRESHED' && session) {
            setStatus('Session refreshed for this browser.', 'info');
        }
    });

    const { data, error } = await state.supabase.auth.getSession();
    if (error) {
        notifyStatus(error.message || 'Unable to load your Supabase session.', 'error');
        return;
    }

    if (data?.session) {
        try {
            await syncServerSession(data.session);
        } catch (error) {
            clearCurrentUserEmail();
            notifyStatus(error.message || 'Unable to create a secure server session.', 'error');
            return;
        }

        if (data.session.user?.email) {
            setCurrentUserEmail(data.session.user.email);
        }
        setCurrentAccessToken(data.session.access_token || '');

        notifyStatus('Session found. Redirecting to your dashboard...', 'success');
        redirectToDashboard();
        return;
    }

    clearCurrentUserEmail();

    setStatus('Sign in to continue.', 'info');
}

async function handleSignIn(event) {
    event.preventDefault();

    if (!state.supabase) {
        setStatus('Supabase is not configured yet. Check the URL and anon key.', 'error');
        return;
    }

    const email = elements.signInEmail?.value.trim() || '';
    const password = elements.signInPassword?.value || '';

    if (!email || !password) {
        notifyStatus('Enter your email and password.', 'error');
        return;
    }

    setBusy(true);
    setStatus('Signing you in...', 'info');
    try {
        const { data, error } = await state.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        await syncServerSession(data.session);
        setCurrentUserEmail(data?.session?.user?.email || email);
        setCurrentAccessToken(data?.session?.access_token || '');
        notifyStatus('Signed in. Redirecting...', 'success');
        redirectToDashboard();
    } catch (error) {
        notifyStatus(error.message || 'Unable to sign in.', 'error');
    } finally {
        setBusy(false);
    }
}

async function handleSignUp(event) {
    event.preventDefault();

    if (!state.supabase) {
        setStatus('Supabase is not configured yet. Check the URL and anon key.', 'error');
        return;
    }

    const email = elements.signUpEmail?.value.trim() || '';
    const password = elements.signUpPassword?.value || '';
    const confirmPassword = elements.signUpConfirm?.value || '';

    if (!email || !password || !confirmPassword) {
        notifyStatus('Fill out all account fields.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        notifyStatus('Passwords do not match.', 'error');
        return;
    }

    if (password.length < 8) {
        notifyStatus('Password must be at least 8 characters long.', 'error');
        return;
    }

    setBusy(true);
    setStatus('Creating your account...', 'info');
    try {
        const redirectUrl = new URL('login.html?mode=signin', window.location.href).href;
        const { data, error } = await state.supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectUrl
            }
        });

        if (error) throw error;

        if (data?.session) {
            await syncServerSession(data.session);
            setCurrentUserEmail(data.session.user?.email || email);
            setCurrentAccessToken(data.session.access_token || '');
            notifyStatus('Account created. Redirecting...', 'success');
            redirectToDashboard();
            return;
        }

        setMode('signin');
        if (elements.signInEmail) {
            elements.signInEmail.value = email;
        }
        if (elements.signInPassword) {
            elements.signInPassword.value = '';
        }
        if (elements.signUpPassword) {
            elements.signUpPassword.value = '';
        }
        if (elements.signUpConfirm) {
            elements.signUpConfirm.value = '';
        }

        notifyStatus('Check your email to confirm the account, then sign in.', 'success');
    } catch (error) {
        notifyStatus(error.message || 'Unable to create the account.', 'error');
    } finally {
        setBusy(false);
    }
}

function bindEvents() {
    elements.tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            setMode(tab.dataset.mode === 'signup' ? 'signup' : 'signin');
        });
    });

    if (elements.signInForm) {
        elements.signInForm.addEventListener('submit', handleSignIn);
    }

    if (elements.signUpForm) {
        elements.signUpForm.addEventListener('submit', handleSignUp);
    }
}

async function bootstrap() {
    bindEvents();
    initializePointerLight();
    setMode(getInitialMode());
    await initializeSupabase();
}

document.addEventListener('DOMContentLoaded', bootstrap);