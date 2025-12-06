/**
 * Controlled migration - migrate ONLY safe decorative rules
 * With strict protection of critical selectors
 */

import postcss from 'postcss';
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stylesDir = join(__dirname, 'Shared/styles');
const legacyPath = join(stylesDir, '_legacy.css');

const css = readFileSync(legacyPath, 'utf8');
const root = postcss.parse(css);

// ABSOLUTELY CRITICAL - these patterns MUST stay in legacy
const CRITICAL_PATTERNS = [
    /screen-hidden/,
    /screen-visible/,
    /screen-flex/,
    /screen-block/,
    /hamburger/,
    /sidebar-hidden/,
    /sidebar-visible/,
    /sidebar-mobile/,
    /sidebar--open/,
    /drawer.*open/,
    /\.orders-screen\b/,
    /body.*order-mode/,
    /top-nav-visible/,
    /main-content-screen/,
    /back-btn-hidden/,
    /drawer-menu\.open/,
];

// DANGEROUS properties - don't migrate rules with these
const DANGEROUS_PROPS = [
    'display', 'visibility', 'opacity',
    'position', 'z-index',
    'transform', 'transition',
];

function isCriticalSelector(selector) {
    return CRITICAL_PATTERNS.some(p => p.test(selector));
}

function hasDangerousProps(rule) {
    let dangerous = false;
    rule.walkDecls(decl => {
        if (DANGEROUS_PROPS.some(p => decl.prop.startsWith(p))) {
            dangerous = true;
        }
    });
    return dangerous;
}

function isSafeToMigrate(rule) {
    // Never migrate critical selectors
    if (isCriticalSelector(rule.selector)) return false;

    // Don't migrate rules with dangerous properties
    if (hasDangerousProps(rule)) return false;

    return true;
}

function categorize(selector) {
    if (/\.(btn|button|history-btn|back-button|clear-history|delete-order|nav.*button)/.test(selector)) return 'buttons';
    if (/#(create-order|orders-btn)/.test(selector)) return 'buttons';
    if (/\.(product-table|liquor-table)/.test(selector)) return 'tables';
    if (/\.(drawer-menu|sidebar)(?!.*open)/.test(selector)) return 'sidebar';
    if (/\.(modal|popup)/.test(selector)) return 'modals';
    if (/\.(settings|language-|theme-|password|input|form)/.test(selector)) return 'forms';
    if (/\.(order-|saved-order|history-|jarras|vasos|tarros|copas|price-selection|jager)/.test(selector)) return 'containers';
    if (/\.(video|image|thumb)/.test(selector)) return 'cards';
    if (/\.(nav-|container\b|welcome-)/.test(selector)) return 'containers';
    return null;
}

// Collect rules
const categories = {
    buttons: [],
    tables: [],
    sidebar: [],
    modals: [],
    forms: [],
    containers: [],
    cards: []
};
const kept = [];
let migratedCount = 0;

// Limit to 10 rules per run for safety
const LIMIT = 10;

root.nodes.forEach(node => {
    if (node.type !== 'rule') {
        kept.push(node.clone());
        return;
    }

    if (!isSafeToMigrate(node) || migratedCount >= LIMIT) {
        kept.push(node.clone());
        return;
    }

    const cat = categorize(node.selector);
    if (cat) {
        categories[cat].push(node.clone());
        migratedCount++;
    } else {
        kept.push(node.clone());
    }
});

console.log('\n📦 CONTROLLED MIGRATION (max 10 rules):\n');
for (const [cat, rules] of Object.entries(categories)) {
    if (rules.length > 0) {
        console.log(`${cat.padEnd(12)}: ${rules.length} rules`);
    }
}
console.log(`\nTotal migrated: ${migratedCount}`);
console.log(`Kept in legacy: ${kept.length}`);

if (migratedCount === 0) {
    console.log('\n⚠️ No safe rules to migrate!');
    process.exit(0);
}

function appendToFile(filename, rules) {
    if (rules.length === 0) return;
    const fullPath = join(stylesDir, filename);
    const content = `\n\n/* ===== MIGRATED FROM LEGACY ===== */\n` +
        rules.map(r => r.toString()).join('\n\n');
    appendFileSync(fullPath, content, 'utf8');
    console.log(`✅ Appended to ${filename}: ${rules.length} rules`);
}

function createIfNotExists(filename, rules) {
    if (rules.length === 0) return;
    const fullPath = join(stylesDir, filename);
    if (!existsSync(fullPath)) {
        const content = `/* ===== ${filename.toUpperCase()} ===== */\n\n` +
            rules.map(r => r.toString()).join('\n\n');
        writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Created ${filename}: ${rules.length} rules`);
    } else {
        appendToFile(filename, rules);
    }
}

console.log('\n🚀 EXECUTING...\n');

appendToFile('components/buttons.css', categories.buttons);
appendToFile('components/tables.css', categories.tables);
createIfNotExists('layout/sidebar.css', categories.sidebar);
appendToFile('components/modals.css', categories.modals);
appendToFile('components/forms.css', categories.forms);
appendToFile('layout/containers.css', categories.containers);
appendToFile('components/cards.css', categories.cards);

// Write reduced legacy
const newLegacy = postcss.root();
kept.forEach(r => newLegacy.append(r));
writeFileSync(legacyPath, newLegacy.toString(), 'utf8');

const newLines = newLegacy.toString().split('\n').length;
console.log(`\n✅ Legacy: ${newLines} lines`);
console.log('\n✅ Migration batch complete!');
