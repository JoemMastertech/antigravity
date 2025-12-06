/**
 * Refactor Selectors
 * Replaces high-specificity ID selectors with class selectors
 */
import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const replacements = [
    // #order-sidebar -> .order-sidebar
    { from: /#order-sidebar(?![-\w])/g, to: '.order-sidebar' },
];

const files = [
    'Shared/styles/_legacy.css',
    'Shared/styles/legacy-responsive/media-queries.css'
];

let totalChanges = 0;

files.forEach(file => {
    try {
        let content = readFileSync(file, 'utf8');
        let original = content;

        replacements.forEach(({ from, to }) => {
            content = content.replace(from, to);
        });

        if (content !== original) {
            writeFileSync(file, content);
            console.log(`✅ Updated ${file}`);
            totalChanges++;
        } else {
            console.log(`ℹ️  No changes in ${file}`);
        }
    } catch (e) {
        console.error(`Error processing ${file}: ${e.message}`);
    }
});

console.log(`\n✨ Refactored selectors in ${totalChanges} files.`);
