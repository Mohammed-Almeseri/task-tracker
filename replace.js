const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');
// Fix dashboard header + stats wrapper
html = html.replace(
    /\<header class="view-header"\>[\s\S]*?\<div class="bento-grid"\>/m,
    \<header class=\"view-header mb-6"\>
                    <div>
                        <h1 id=\"greeting-title"\>Good morning</h1>
                        <p class=\"view-subtitle text-muted mt-1\" id=\"greeting-subtitle"\>Let's make today count</p>
                    </div>
                    <div id=\"greeting-date" class=\"text-muted text-sm mt-1\"\></div>
                </header>

                <div class=\"dashboard-stats-grid mb-8\">\
);

// End 4 columns and start main grid
html = html.replace(
    /\<!-- Completion Trend \(wide\) --\>[\s\S]*?\<div class="bento-card bento-wide"\>/m,
    \</div>

                <div class=\"dashboard-main-grid\">
                    <div class=\"dashboard-col-large\">
                        <!-- Completion Trend (wide) -->
                        <div class=\"bento-card bento-wide mb-6\">\
);

// Close left col, start right col
html = html.replace(
    /\<!-- Priority Breakdown --\>[\s\S]*?\<div class="bento-card bento-md"\>/m,
    \                    </div>
                    
                    <div class=\"dashboard-col-small\">
                        <!-- Priority Breakdown -->
                        <div class=\"bento-card bento-md mb-6\">\
);

fs.writeFileSync('public/index.html', html);

