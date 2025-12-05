import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('🔍 Starting Style Verification Notary...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport to Desktop
    await page.setViewport({ width: 1280, height: 800 });

    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    try {
        console.log('🌐 Navigating to http://localhost:8081/ ...');
        await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for critical elements
        console.log('⏳ Waiting for .page-title...');
        await page.waitForSelector('.page-title', { timeout: 30000 });

        console.log('📸 Extracting Computed Styles...');

        const styles = await page.evaluate(() => {
            const getStyle = (selector, prop) => {
                const el = document.querySelector(selector);
                return el ? window.getComputedStyle(el).getPropertyValue(prop) : 'ELEMENT_NOT_FOUND';
            };

            return {
                timestamp: new Date().toISOString(),
                typography: {
                    body_font: getStyle('body', 'font-family'),
                    page_title_font: getStyle('.page-title', 'font-family'),
                    page_title_color: getStyle('.page-title', 'color'),
                    page_title_weight: getStyle('.page-title', 'font-weight'),
                    product_name_font: getStyle('.product-name', 'font-family'),
                    product_name_weight: getStyle('.product-name', 'font-weight'),
                    table_header_font: getStyle('.product-table th', 'font-family'),
                    table_header_weight: getStyle('.product-table th', 'font-weight'),
                },
                layout: {
                    grid_columns: getStyle('.product-grid', 'grid-template-columns'),
                    grid_gap: getStyle('.product-grid', 'gap'),
                    app_max_width: getStyle('#app', 'max-width'),
                }
            };
        });

        console.log('✅ Styles Extracted:', JSON.stringify(styles, null, 2));

        fs.writeFileSync('style_baseline.json', JSON.stringify(styles, null, 2));
        console.log('💾 Baseline saved to style_baseline.json');

    } catch (error) {
        console.error('❌ Error during verification:', error);
        await page.screenshot({ path: 'verify_error.png' });
        console.log('📸 Error screenshot saved to verify_error.png');
    } finally {
        await browser.close();
    }
})();
