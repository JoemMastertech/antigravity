/**
 * CSS Specificity Analyzer
 * Analyzes legacy.css to find high-specificity rules that block migration
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const legacyPath = join(__dirname, 'Shared/styles/_legacy.css');
const reportPath = join(__dirname, 'specificity_report.json');

// Calculate specificity of a selector
// Returns [inline, IDs, classes, elements]
function calculateSpecificity(selector) {
    let ids = 0;
    let classes = 0;
    let elements = 0;

    // Count ID selectors (#)
    ids = (selector.match(/#[a-zA-Z][\w-]*/g) || []).length;

    // Count class selectors, attribute selectors, pseudo-classes
    classes = (selector.match(/\.[a-zA-Z][\w-]*/g) || []).length;
    classes += (selector.match(/\[[^\]]+\]/g) || []).length;
    classes += (selector.match(/:(not|first-child|last-child|nth-child|hover|focus|active|visited)/g) || []).length;

    // Count element selectors and pseudo-elements
    // This is simplified - real calculation is more complex
    elements = (selector.match(/^[a-zA-Z]+|[\s>+~][a-zA-Z]+/g) || []).length;
    elements += (selector.match(/::(before|after|first-line|first-letter)/g) || []).length;

    return { ids, classes, elements, score: ids * 100 + classes * 10 + elements };
}

// Parse CSS and extract selectors
function parseCSSSelectors(css) {
    const results = [];

    // Remove comments
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // Find all rule blocks
    const ruleRegex = /([^{]+)\{([^}]*)\}/g;
    let match;
    let lineNumber = 1;

    while ((match = ruleRegex.exec(css)) !== null) {
        const selectorGroup = match[1].trim();
        const declarations = match[2].trim();

        // Count line number
        const beforeMatch = css.substring(0, match.index);
        lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

        // Check for !important
        const hasImportant = declarations.includes('!important');
        const importantCount = (declarations.match(/!important/g) || []).length;

        // Split multiple selectors
        const selectors = selectorGroup.split(',').map(s => s.trim());

        for (const selector of selectors) {
            if (selector && !selector.startsWith('@')) {
                const specificity = calculateSpecificity(selector);

                results.push({
                    selector,
                    line: lineNumber,
                    specificity,
                    hasImportant,
                    importantCount,
                    riskLevel: calculateRiskLevel(specificity, hasImportant)
                });
            }
        }
    }

    return results;
}

function calculateRiskLevel(specificity, hasImportant) {
    if (hasImportant) return 'CRITICAL';
    if (specificity.ids > 0) return 'HIGH';
    if (specificity.score > 30) return 'MEDIUM';
    return 'LOW';
}

// Main analysis
try {
    console.log('🔍 Analyzing CSS specificity...\n');

    const css = readFileSync(legacyPath, 'utf8');
    const results = parseCSSSelectors(css);

    // Group by risk level
    const critical = results.filter(r => r.riskLevel === 'CRITICAL');
    const high = results.filter(r => r.riskLevel === 'HIGH');
    const medium = results.filter(r => r.riskLevel === 'MEDIUM');

    console.log('📊 SPECIFICITY REPORT');
    console.log('='.repeat(50));
    console.log(`Total selectors analyzed: ${results.length}`);
    console.log(`\n🔴 CRITICAL (!important): ${critical.length}`);
    console.log(`🟠 HIGH (uses ID selectors): ${high.length}`);
    console.log(`🟡 MEDIUM (complex selectors): ${medium.length}`);
    console.log(`🟢 LOW (safe): ${results.length - critical.length - high.length - medium.length}`);

    // Show critical issues
    if (critical.length > 0) {
        console.log('\n🔴 CRITICAL - Rules with !important:');
        console.log('-'.repeat(50));
        critical.slice(0, 20).forEach(r => {
            console.log(`  Line ${r.line}: ${r.selector.substring(0, 50)}... (${r.importantCount} !important)`);
        });
        if (critical.length > 20) {
            console.log(`  ... and ${critical.length - 20} more`);
        }
    }

    // Show high risk issues
    if (high.length > 0) {
        console.log('\n🟠 HIGH - Rules using ID selectors:');
        console.log('-'.repeat(50));
        high.slice(0, 15).forEach(r => {
            console.log(`  Line ${r.line}: ${r.selector.substring(0, 60)}`);
        });
        if (high.length > 15) {
            console.log(`  ... and ${high.length - 15} more`);
        }
    }

    // Look for screen-hidden specifically
    const screenHiddenRules = results.filter(r => r.selector.includes('screen-hidden'));
    console.log('\n🎯 SCREEN-HIDDEN related rules:');
    console.log('-'.repeat(50));
    screenHiddenRules.forEach(r => {
        console.log(`  Line ${r.line}: ${r.selector}`);
        console.log(`    Specificity: IDs=${r.specificity.ids}, Classes=${r.specificity.classes}, Elements=${r.specificity.elements}`);
        console.log(`    Risk: ${r.riskLevel}, Has !important: ${r.hasImportant}`);
    });

    // Save full report
    writeFileSync(reportPath, JSON.stringify({
        summary: {
            total: results.length,
            critical: critical.length,
            high: high.length,
            medium: medium.length,
            low: results.length - critical.length - high.length - medium.length
        },
        critical: critical,
        high: high.slice(0, 50),
        screenHidden: screenHiddenRules
    }, null, 2));

    console.log(`\n✅ Full report saved to: specificity_report.json`);

} catch (err) {
    console.error('Error:', err.message);
}
