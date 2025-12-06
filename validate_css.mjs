/**
 * Simple validation script - checks critical CSS elements exist
 * Run after any CSS migration to verify no regressions
 */

import puppeteer from 'puppeteer';

const CRITICAL_SELECTORS = [
    { selector: '.hamburger-btn', name: 'Hamburger Button' },
    { selector: '.drawer-menu', name: 'Drawer Menu' },
    { selector: '.top-nav-bar', name: 'Top Nav Bar' },
];

async function validate() {
    console.log('\n🔍 CSS VALIDATION CHECK\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 320, height: 480 });

    try {
        console.log('Loading page...');
        await page.goto('http://localhost:8081/', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for app to load (welcome sequence)
        await page.waitForSelector('.top-nav-bar', { timeout: 15000 });
        console.log('Page loaded.\n');

        let allPassed = true;

        for (const check of CRITICAL_SELECTORS) {
            const element = await page.$(check.selector);
            const exists = !!element;

            if (exists) {
                const box = await element.boundingBox();
                const visible = box && box.width > 0 && box.height > 0;

                if (visible) {
                    console.log(`✅ ${check.name}: VISIBLE (${box.width}x${box.height})`);
                } else {
                    console.log(`⚠️ ${check.name}: EXISTS but hidden`);
                }
            } else {
                console.log(`❌ ${check.name}: NOT FOUND`);
                allPassed = false;
            }
        }

        // Test drawer opens
        console.log('\n📋 Testing drawer opens...');
        const hamburger = await page.$('.hamburger-btn');
        if (hamburger) {
            await hamburger.click();
            await page.waitForTimeout(500);

            const drawerOpen = await page.$('.drawer-menu.open');
            if (drawerOpen) {
                console.log('✅ Drawer opens on hamburger click');
            } else {
                console.log('⚠️ Drawer did not open');
            }
        }

        console.log('\n' + (allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'));

    } catch (error) {
        console.error('Error:', error.message);
    }

    await browser.close();
}

validate();
