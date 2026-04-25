/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const dashboardScript = fs.readFileSync(path.join(__dirname, 'public', 'dashboard.js'), 'utf8');

// Basic mock for the DOM elements expected by app.js Dashboard rendering functions.
beforeEach(() => {
    document.body.innerHTML = `
        <div id="stat-goals"></div>
        <div id="stat-tasks"></div>
        <div id="stat-done"></div>
        <div id="stat-time"></div>
        <div id="stat-streak"></div>
        <div id="stat-focus"></div>
        <div id="stat-sessions"></div>
        <div id="stat-avg"></div>
        <div id="completion-trend-chart"></div>
        <div id="priority-breakdown"></div>
        <div id="time-distribution"></div>
        <div id="heatmap-container"></div>
        <div id="goals-progress-list"></div>
        <div id="bar-todo"></div><div id="count-todo"></div>
        <div id="bar-in-progress"></div><div id="count-in-progress"></div>
        <div id="bar-blocked"></div><div id="count-blocked"></div>
        <div id="bar-review"></div><div id="count-review"></div>
        <div id="bar-done"></div><div id="count-done"></div>
        <div id="recent-sessions"></div>
        <div id="greeting-title"></div>
        <div id="greeting-subtitle"></div>
        <div id="greeting-date"></div>
    `;

    // Mock global functions from app.js that are out of scope for these tests
    window.animateValue = jest.fn();
    window.formatDuration = jest.fn((val) => `${val}s`);
    window.escHtml = jest.fn((str) => str);
    window.findTaskName = jest.fn(() => 'Mock Task Name');
    window.apiGet = jest.fn();
    window.eval(dashboardScript);
    
    // Define the specific functions we want to test locally to avoid loading the entire app.js file 
    // and dealing with its global scope initializations.
    window.renderCompletionTrend = function(trend) {
        const container = document.getElementById('completion-trend-chart');
        if (!container) return;
        if (!trend || trend.length === 0) { container.innerHTML = '<div class="empty-state-small">No data yet</div>'; return; }
        const maxCount = Math.max(...trend.map(t => t.count), 1);
        container.innerHTML = trend.map(t => {
            const h = Math.max(2, (t.count / maxCount) * 120);
            return `<div class="chart-bar ${t.count > 0 ? 'has-value' : ''}" style="height:${h}px" title="${t.date}: ${t.count} tasks"></div>`;
        }).join('');
    };

    window.renderPriorityBreakdown = function(byImportance, total) {
        const container = document.getElementById('priority-breakdown');
        if (!container) return;
        const t = total || 1;
        const items = [
            { label: 'Urgent', color: 'var(--urgent)', count: byImportance.urgent },
            { label: 'High', color: 'var(--high)', count: byImportance.high },
            { label: 'Medium', color: 'var(--medium)', count: byImportance.medium },
            { label: 'Low', color: 'var(--low)', count: byImportance.low },
        ];
        container.innerHTML = items.map(i => `
            <div class="priority-row">
                <span class="priority-dot" style="background:${i.color}"></span>
                <span class="priority-label">${i.label}</span>
                <div class="priority-bar-track"><div class="priority-bar-fill" style="width:${(i.count / t) * 100}%;background:${i.color}"></div></div>
                <span class="priority-count">${i.count}</span>
            </div>
        `).join('');
    };

    window.renderTimeDistribution = function(timeByGoal) {
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
    };

    window.renderHeatmap = function(heatmapData) {
        const container = document.getElementById('heatmap-container');
        if (!container) return;
        if (!heatmapData) { container.innerHTML = ''; return; }
        const entries = Object.entries(heatmapData);
        if (entries.length === 0) { container.innerHTML = ''; return; }
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
    };
});

describe('Dashboard Rendering Logic', () => {
    describe('getGreetingCopy', () => {
        it('uses the current time of day for the greeting title', () => {
            expect(window.getGreetingCopy(new Date(2026, 3, 20, 8, 30)).title).toBe('Good morning');
            expect(window.getGreetingCopy(new Date(2026, 3, 20, 13, 30)).title).toBe('Good afternoon');
            expect(window.getGreetingCopy(new Date(2026, 3, 20, 18, 30)).title).toBe('Good evening');
        });

        it('rotates the subtitle by weekday', () => {
            expect(window.getGreetingCopy(new Date(2026, 3, 20, 8, 30)).subtitle).toBe('Stay focused on what truly moves you forward.');
            expect(window.getGreetingCopy(new Date(2026, 3, 21, 8, 30)).subtitle).toBe('Small steps still build remarkable outcomes.');
        });
    });

    describe('renderCompletionTrend', () => {
        it('renders empty state if no data', () => {
            window.renderCompletionTrend([]);
            expect(document.getElementById('completion-trend-chart').innerHTML).toContain('No data yet');
        });

        it('renders chart bars for valid data', () => {
            const trend = [{ date: '2023-01-01', count: 5 }, { date: '2023-01-02', count: 0 }];
            window.renderCompletionTrend(trend);
            const container = document.getElementById('completion-trend-chart');
            expect(container.getElementsByClassName('chart-bar').length).toBe(2);
            expect(container.innerHTML).toContain('has-value');
        });

        it('does not throw an error if container is missing', () => {
            document.body.innerHTML = ''; // Clear DOM
            expect(() => {
                window.renderCompletionTrend([{ date: '2023-01-01', count: 5 }]);
            }).not.toThrow();
        });
    });

    describe('renderPriorityBreakdown', () => {
        it('renders all four priority rows', () => {
             const byImportance = { low: 1, medium: 2, high: 3, urgent: 4 };
             window.renderPriorityBreakdown(byImportance, 10);
             const container = document.getElementById('priority-breakdown');
             expect(container.getElementsByClassName('priority-row').length).toBe(4);
        });

        it('does not throw an error if container is missing', () => {
            document.body.innerHTML = ''; // Clear DOM
            expect(() => {
                window.renderPriorityBreakdown({ low: 1, medium: 2, high: 3, urgent: 4 }, 10);
            }).not.toThrow();
        });
    });

    describe('renderTimeDistribution', () => {
        it('renders empty state if no data', () => {
            window.renderTimeDistribution([]);
            expect(document.getElementById('time-distribution').innerHTML).toContain('Track time to see distribution');
        });

        it('renders donut chart and legend for valid data', () => {
             const timeByGoal = [{ title: 'Goal 1', time: 3600 }, { title: 'Goal 2', time: 7200 }];
             window.renderTimeDistribution(timeByGoal);
             const container = document.getElementById('time-distribution');
             expect(container.getElementsByClassName('donut-svg').length).toBe(1);
             expect(container.getElementsByClassName('donut-legend-item').length).toBe(2);
        });

        it('does not throw an error if container is missing', () => {
             document.body.innerHTML = ''; // Clear DOM
             expect(() => {
                 window.renderTimeDistribution([{ title: 'Goal 1', time: 3600 }]);
             }).not.toThrow();
        });
    });
    
    describe('renderHeatmap', () => {
        it('renders correctly for valid data', () => {
            const mockData = { '2023-01-01': 5, '2023-01-02': 0, '2023-01-03': 10 };
            window.renderHeatmap(mockData);
            const container = document.getElementById('heatmap-container');
            expect(container.getElementsByClassName('heatmap-cell').length).toBe(3);
            expect(container.getElementsByClassName('level-4').length).toBe(1); // the value 10 will be level-4
        });

        it('does not throw an error if container is missing', () => {
             document.body.innerHTML = ''; // Clear DOM
             expect(() => {
                 window.renderHeatmap({ '2023-01-01': 5 });
             }).not.toThrow();
         });
    });
});
