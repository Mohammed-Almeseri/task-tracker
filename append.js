const fs = require('fs');
let css = fs.readFileSync('public/style.css', 'utf8');

const newCSS = \
/* ==========================================
   DASHBOARD NEW GRID
   ========================================== */

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.greeting-title {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.6px;
    color: var(--text-primary);
}

.dashboard-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

.dashboard-main-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
}

.dashboard-col-large {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.dashboard-col-small {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

@media (max-width: 1024px) {
    .dashboard-stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .dashboard-main-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 480px) {
    .dashboard-stats-grid {
        grid-template-columns: 1fr;
    }
}

/* ==========================================
   UI/UX POLISH FORMS / UTILS
   ========================================== */

.max-w-4xl {
    max-width: 56rem;
}

.mx-auto {
    margin-left: auto;
    margin-right: auto;
}

.mb-6 { margin-bottom: 1.5rem; }
.mb-8 { margin-bottom: 2rem; }
.mt-1 { margin-top: 0.25rem; }

.form-control:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

.settings-card {
    transition: transform 0.2s ease-in-out;
}

.settings-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}
\;

fs.appendFileSync('public/style.css', newCSS);

