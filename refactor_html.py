import re

def refactor_html():
    with open("public/index.html", "r", encoding="utf-8") as f:
        html = f.read()

    # 1. Update the header and add the grid wrapper
    html = re.sub(
        r'<header class="view-header">\s*<div>\s*<h1>Dashboard</h1>\s*<p class="view-subtitle">Your productivity at a glance</p>\s*</div>\s*</header>\s*<!-- Bento Grid Stats -->\s*<div class="bento-grid" id="bento-grid">\s*<!-- Row 1: Core stats -->',
        '''<header class="dashboard-header mb-6">
                    <div id="greeting-container">
                        <h1 class="greeting-title" id="greeting-title">Good Morning</h1>
                        <p class="greeting-subtitle text-muted" id="greeting-subtitle">Let\\'s make today count</p>
                        <p class="greeting-date text-muted text-sm mt-1" id="greeting-date"></p>
                    </div>
                </header>

                <div class="dashboard-stats-grid mb-8">''',
        html
    )

    # 2. Add remaining grid closing and opening
    html = re.sub(
        r'<!-- Row 2: Streak \+ Today\'s Focus \+ Avg Completion -->\s*<div class="bento-card bento-sm stat-card-streak">.*?(?=<div class="bento-card bento-wide">\s*<div class="bento-card-header">\s*<h3>Completion Trend</h3>)',
        '''<div class="bento-card bento-sm stat-card-sessions">
                        <div class="bento-card-inner">
                            <div class="stat-icon text-accent">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="10" y1="2" x2="14" y2="2" />
                                    <line x1="12" y1="14" x2="12" y2="8" />
                                    <circle cx="12" cy="14" r="8" />
                                </svg>
                            </div>
                            <div class="stat-value" id="stat-sessions">0</div>
                            <div class="stat-label text-muted">Sessions</div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-main-grid">
                    <div class="dashboard-col-large">
                        <!-- ''',
        html,
        flags=re.DOTALL
    )

    # 3. Organize right column (Priority Breakdown)
    html = re.sub(
        r'</div>\s*<!-- Priority Breakdown -->\s*<div class="bento-card bento-md">\s*<div class="bento-card-header">\s*<h3>Priority Breakdown</h3>',
        '''</div>
                        
                        <!-- Heatmap (wide) -->
                        <div class="bento-card bento-wide mb-6">
                            <div class="bento-card-header flex-between">
                                <h3>Activity Heatmap</h3>
                                <span class="bento-badge">Past year</span>
                            </div>
                            <div class="heatmap-container" id="heatmap-container"></div>
                        </div>
                        
                        <!-- Goals Progress -->
                        <div class="bento-card bento-wide mb-6">
                            <div class="bento-card-header">
                                <h3>Goal Progress</h3>
                            </div>
                            <div id="goals-progress-list" class="goals-progress-list">
                                <div class="empty-state-small text-muted">No goals yet</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dashboard-col-small">
                        <!-- Priority Breakdown -->
                        <div class="bento-card bento-md mb-6">
                            <div class="bento-card-header">
                                <h3>Priority Breakdown</h3>''',
        html
    )

    # 4. Clean up remaining duplicate blocks at the end of the Dashboard view
    html = re.sub(
        r'<!-- Heatmap \(full width\) -->\s*<div class="bento-card bento-full">\s*<div class="bento-card-header">.*?</div>\s*</div>\s*<!-- Goals Progress -->\s*<div class="bento-card bento-wide">\s*<div class="bento-card-header">.*?</div>\s*</div>',
        '',
        html,
        flags=re.DOTALL
    )

    # 5. Fix Settings width issue
    html = re.sub(
        r'<div class="settings-container"\s*style="display: grid; grid-template-columns: repeat\(auto-fit, minmax\(300px, 1fr\)\); gap: 1\.5rem;">',
        '<div class="settings-container max-w-4xl mx-auto" style="display: flex; flex-direction: column; gap: 2rem;">',
        html
    )

    with open("public/index.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("HTML rewrite complete")

if __name__ == "__main__":
    refactor_html()
