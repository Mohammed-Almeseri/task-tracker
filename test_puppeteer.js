const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'ss_dash.png' });
        await page.click('[data-view="goals"]');
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'ss_goals.png' });
        await page.click('[data-view="manage"]');
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'ss_manage.png' });
        await browser.close();
        console.log('Screenshots done');
    } catch (e) { console.log(e); }
})();
