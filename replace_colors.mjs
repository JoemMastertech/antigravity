/**
 * Batch replace colors with variables
 */
import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const replacements = [
    { from: /#000000/gi, to: 'var(--color-black)' },
    { from: /#000\b/gi, to: 'var(--color-black)' }, // word boundary to avoid #000000 matching twice logic issues, though regex order matters
    { from: /#ffffff/gi, to: 'var(--color-white)' },
    { from: /#fff\b/gi, to: 'var(--color-white)' },
    { from: /#ccc\b/gi, to: 'var(--color-gray-400)' },
    { from: /#cccccc/gi, to: 'var(--color-gray-400)' },
    { from: /#e0e0e0/gi, to: 'var(--color-gray-300)' },
    { from: /#ddd\b/gi, to: '#dddddd' }, // Standardize first
    { from: /#dddddd/gi, to: 'var(--color-gray-300)' }, // Map ddd to gray-300 for now
    { from: /#f3f6f6/gi, to: 'var(--color-gray-100)' },
    { from: /#ECE9D8/gi, to: 'var(--color-gray-200)' },
    { from: /#1e293b/gi, to: 'var(--color-gray-800)' },
];

const files = globSync('Shared/styles/**/*.css', { ignore: 'Shared/styles/settings/variables.css' });

let totalChanges = 0;

files.forEach(file => {
    let content = readFileSync(file, 'utf8');
    let original = content;

    replacements.forEach(({ from, to }) => {
        content = content.replace(from, to);
    });

    if (content !== original) {
        writeFileSync(file, content);
        console.log(`✅ Updated ${file}`);
        totalChanges++;
    }
});

console.log(`\n✨ Replaced colors in ${totalChanges} files.`);
