// Script to find and list all files with hardcoded passwords
// This helps identify files that need to be updated

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const oldPassword = 'EyJGzEPcYZECQLKdVfcGUFOlMpIVHEKv';
const filesToCheck = [];

// Find all .js files
function findJSFiles(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        // Skip node_modules and .git
        if (file === 'node_modules' || file === '.git' || file === 'uploads') {
            continue;
        }
        
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            findJSFiles(filePath);
        } else if (file.endsWith('.js')) {
            // Skip the cleanup script itself
            if (file === 'cleanup-hardcoded-passwords.js') {
                continue;
            }
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes(oldPassword)) {
                    filesToCheck.push(filePath);
                }
            } catch (err) {
                // Skip files that can't be read
            }
        }
    }
}

console.log('🔍 Scanning for files with hardcoded passwords...\n');
findJSFiles('.');

if (filesToCheck.length === 0) {
    console.log('✅ No files found with hardcoded password!\n');
} else {
    console.log(`⚠️  Found ${filesToCheck.length} file(s) with hardcoded password:\n`);
    filesToCheck.forEach(file => {
        console.log(`   - ${file}`);
    });
    
    console.log('\n📋 These files should be updated to use:');
    console.log('   1. db-config.js (for database connections)');
    console.log('   2. Environment variables (process.env.DB_PASSWORD)');
    console.log('   3. Remove hardcoded credentials\n');
    
    console.log('💡 To fix automatically, these files need to:');
    console.log('   - Import db-config.js instead of hardcoding');
    console.log('   - Or use require(\'dotenv\').config() and process.env.DB_PASSWORD\n');
}

// Also check Git history
console.log('🔍 Checking Git history for exposed password...\n');
try {
    const gitLog = execSync(
        `git log --all --full-history --source -S "${oldPassword}" --oneline`,
        { encoding: 'utf8', stdio: 'pipe' }
    );
    
    if (gitLog.trim()) {
        const commits = gitLog.trim().split('\n').length;
        console.log(`⚠️  Password found in ${commits} commit(s) in Git history!`);
        console.log('   See REMOVE_SECRETS_FROM_GIT.md for instructions to clean history.\n');
    } else {
        console.log('✅ Password not found in Git history (or Git not initialized)\n');
    }
} catch (err) {
    console.log('ℹ️  Could not check Git history (Git may not be initialized)\n');
}

console.log('='.repeat(60));
console.log('📝 Summary:');
console.log(`   Files with hardcoded password: ${filesToCheck.length}`);
console.log('   Action required: Update files to use environment variables');
console.log('   See REMOVE_SECRETS_FROM_GIT.md for cleaning Git history');

