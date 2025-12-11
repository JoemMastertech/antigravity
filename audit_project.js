import fs from 'fs';
import path from 'path';
import process from 'process'; // Explicit input for some node versions/envs

// Fix for __dirname in ESM
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
const ROOT_DIR = process.cwd();
const ENV_FILE = path.join(ROOT_DIR, '.env');
const SCAN_DIRS = ['src', 'Shared', 'Infraestructura', 'Interfaces']; // Folders to scan
const IGNORE_DIRS = ['node_modules', '.git', 'dist', '.gemini', '.agent'];
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.json'];

// ANSI COLORS
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}Starting Project Audit...${RESET}\n`);

let errorCount = 0;
let warningCount = 0;

// =============================================================================
// 1. .ENV INSPECTION
// =============================================================================
console.log(`${YELLOW}Step 1: Inspecting .env file...${RESET}`);

if (fs.existsSync(ENV_FILE)) {
    const content = fs.readFileSync(ENV_FILE, 'utf-8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        // Check for trailing whitespace (invisible killer)
        if (line !== trimmed) {
            // Check specifically for trailing
            const rightTrimmed = line.trimEnd();
            if (line.length > rightTrimmed.length) {
                console.log(`${RED}[ERROR] .env Line ${lineNum}: Trailing whitespace detected! This breaks API keys.${RESET}`);
                errorCount++;
            }
        }

        // Check for quotes wrapping values (can be parsed literally by some tools)
        // Format: KEY="VALUE" or KEY='VALUE'
        const assignment = trimmed.split('=');
        if (assignment.length > 1) {
            const val = assignment.slice(1).join('='); // Handle multiple = in value
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                console.log(`${YELLOW}[WARNING] .env Line ${lineNum}: Value wrapped in quotes. Ensure your parser strips them, or remove them.${RESET}`);
                warningCount++;
            }
        }
    });
    console.log("  .env check complete.\n");
} else {
    console.log(`${YELLOW}No .env file found. Skipping step 1.${RESET}\n`);
}

// =============================================================================
// Helper Functions for Scan
// =============================================================================

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            }
        } else {
            if (FILE_EXTENSIONS.includes(path.extname(file))) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

function resolveImportPath(sourceFile, importStr) {
    const dir = path.dirname(sourceFile);
    let target = path.resolve(dir, importStr);

    // Attempt exact match
    if (fs.existsSync(target) && fs.statSync(target).isFile()) return { path: target, exact: true };

    // Attempt extensions
    for (const ext of FILE_EXTENSIONS) {
        if (fs.existsSync(target + ext) && fs.statSync(target + ext).isFile()) {
            return { path: target + ext, exact: false };
        }
    }

    // Attempt index files (e.g. ./components/Header -> ./components/Header/index.js)
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
        for (const ext of FILE_EXTENSIONS) {
            const indexFile = path.join(target, `index${ext}`);
            if (fs.existsSync(indexFile)) return { path: indexFile, exact: false };
        }
    }

    return null;
}

function checkCaseSensitivity(foundPath) {
    const dir = path.dirname(foundPath);
    const filename = path.basename(foundPath);

    const actualFiles = fs.readdirSync(dir);
    if (!actualFiles.includes(filename)) {
        // Find what it actually is (ignoring case)
        const actual = actualFiles.find(f => f.toLowerCase() === filename.toLowerCase());
        return { match: false, actual: actual };
    }
    return { match: true };
}

// =============================================================================
// 2 & 3. GHOST FILES & LINUX CHECK
// =============================================================================
console.log(`${YELLOW}Step 2 & 3: Scanning for Ghost Links and Case Sensitivity...${RESET}`);

let filesToScan = [];
SCAN_DIRS.forEach(d => {
    if (fs.existsSync(path.join(ROOT_DIR, d))) {
        filesToScan = filesToScan.concat(getAllFiles(path.join(ROOT_DIR, d)));
    } else {
        console.log(`${YELLOW}Warning: Directory '${d}' not found in root.${RESET}`);
    }
});

console.log(`Scanning ${filesToScan.length} files for imports...\n`);

filesToScan.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const ext = path.extname(file);
    let imports = [];

    // Regex for JS/TS
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        // Matches import x from './path' or require('./path')
        const regex = /from\s+['"](\..*?)['"]|require\(['"](\..*?)['"]\)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            imports.push(match[1] || match[2]);
        }
    }
    // Regex for SCSS/CSS
    if (['.css', '.scss'].includes(ext)) {
        // Matches @import 'path' or @use 'path'
        const regex = /@(import|use)\s+['"](\..*?)['"]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            imports.push(match[2]);
        }
    }

    imports.forEach(imp => {
        // Skip css/scss imports that might be partials without underscore (too complex for simple script without sass graph)
        // But we can try basic resolution

        const resolved = resolveImportPath(file, imp);

        if (!resolved) {
            // Special handling for SASS partials: import "foo" might mean "_foo.scss"
            let partialFound = false;
            if (ext === '.scss') {
                const dir = path.dirname(file);
                const base = path.basename(imp);
                const parts = imp.split('/');
                parts[parts.length - 1] = `_${base}`;
                const partialPath = parts.join('/');

                // Try adding .scss to partial
                const targetPartial = path.resolve(dir, partialPath + '.scss');
                if (fs.existsSync(targetPartial)) {
                    // Check case for partial
                    const caseCheck = checkCaseSensitivity(targetPartial);
                    if (!caseCheck.match) {
                        console.log(`${RED}[CRITICAL ERROR] LINUX CASE MISMATCH${RESET}`);
                        console.log(`  File: ${path.relative(ROOT_DIR, file)}`);
                        console.log(`  Import: ${imp}`);
                        console.log(`  Actual on Disk: ${caseCheck.actual}\n`);
                        errorCount++;
                    }
                    partialFound = true;
                }
            }

            if (!partialFound) {
                console.log(`${RED}[ERROR] BROKEN IMPORT (GHOST FILE)${RESET}`);
                console.log(`  File: ${path.relative(ROOT_DIR, file)}`);
                console.log(`  Import: ${imp}`);
                console.log(`  Status: File not found on disk.\n`);
                errorCount++;
            }
        } else {
            // File exists, check case
            const caseCheck = checkCaseSensitivity(resolved.path);
            if (!caseCheck.match) {
                console.log(`${RED}[CRITICAL ERROR] LINUX CASE MISMATCH (Will fail on Prod)${RESET}`);
                console.log(`  File: ${path.relative(ROOT_DIR, file)}`);
                console.log(`  Import: ${imp}`);
                console.log(`  Actual on Disk: ${caseCheck.actual}\n`);
                errorCount++;
            }
        }
    });
});

console.log(`${BLUE}Audit Complete.${RESET}`);
console.log(`Errors Found: ${errorCount}`);
console.log(`Warnings Found: ${warningCount}`);

if (errorCount > 0) {
    console.log(`${RED}PROJECT HEALTH: CRITICAL${RESET}`);
    process.exit(1);
} else {
    console.log(`${GREEN}PROJECT HEALTH: EXCELLENT${RESET}`);
    process.exit(0);
}
