/**
 * CSS Health Audit - Extract key metrics from cssstats
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const files = [
    'Shared/styles/_legacy.css',
    'Shared/styles/legacy-responsive/media-queries.css'
];

console.log('\n🏥 CSS HEALTH AUDIT\n');
console.log('='.repeat(60));

for (const file of files) {
    try {
        const result = execSync(`npx cssstats "${file}" --json`, { encoding: 'utf8' });
        const stats = JSON.parse(result);

        console.log(`\n📁 ${file}\n`);

        // Colors
        console.log('🎨 COLORS:');
        const colors = stats.declarations?.properties?.color || [];
        const bgColors = stats.declarations?.properties?.['background-color'] || [];
        const allColors = [...new Set([...colors, ...bgColors])];
        console.log(`   Total unique: ${allColors.length}`);
        if (allColors.length > 0) {
            console.log('   Sample:', allColors.slice(0, 5).join(', '));
        }

        // Font sizes
        console.log('\n📏 FONT SIZES:');
        const fontSizes = stats.declarations?.properties?.['font-size'] || [];
        const uniqueFontSizes = [...new Set(fontSizes)];
        console.log(`   Total unique: ${uniqueFontSizes.length}`);
        if (uniqueFontSizes.length > 0) {
            console.log('   Values:', uniqueFontSizes.join(', '));
        }

        // Font families
        console.log('\n🔤 FONT FAMILIES:');
        const fontFamilies = stats.declarations?.properties?.['font-family'] || [];
        const uniqueFonts = [...new Set(fontFamilies)];
        console.log(`   Total unique: ${uniqueFonts.length}`);
        uniqueFonts.forEach(f => console.log(`   - ${f}`));

        // Spacing (padding, margin)
        console.log('\n📐 SPACING:');
        const paddings = stats.declarations?.properties?.padding || [];
        const margins = stats.declarations?.properties?.margin || [];
        console.log(`   Padding values: ${[...new Set(paddings)].length}`);
        console.log(`   Margin values: ${[...new Set(margins)].length}`);

        // !important
        const important = stats.declarations?.important?.total || 0;
        console.log(`\n⚠️  !important: ${important}`);

        console.log('\n' + '-'.repeat(60));

    } catch (e) {
        console.log(`Error with ${file}: ${e.message}`);
    }
}

console.log('\n✅ AUDIT COMPLETE\n');
