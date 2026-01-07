// Helper script to change Railway MySQL password for any project
// Usage: node change-password-helper.js [PROJECT_PATH] [NEW_PASSWORD]
//   PROJECT_PATH: Path to project directory (defaults to current directory)
//   NEW_PASSWORD: New password (if not provided, will generate one)

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const projectPath = process.argv[2] || process.cwd();
const newPassword = process.argv[3];

// Check if .env exists
const envPath = path.join(projectPath, '.env');
if (!fs.existsSync(envPath)) {
    console.error(`❌ Error: .env file not found in ${projectPath}`);
    console.error('   Make sure you\'re in the correct project directory or provide the path.');
    process.exit(1);
}

// Check if change-railway-password.js exists
const scriptPath = path.join(__dirname, 'change-railway-password.js');
if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Error: change-railway-password.js not found in ${__dirname}`);
    process.exit(1);
}

console.log('🔒 Railway MySQL Password Change Helper\n');
console.log('='.repeat(60));
console.log(`📁 Project: ${projectPath}`);
console.log(`📄 Script: ${scriptPath}\n`);

// Generate password if not provided
let passwordToUse = newPassword;
if (!passwordToUse) {
    console.log('🔑 Generating new secure password...');
    passwordToUse = require('crypto').randomBytes(32).toString('base64').replace(/[+/=]/g, '').substring(0, 32);
    console.log(`   Generated: ${passwordToUse}\n`);
}

// Change to project directory and run the script
console.log('🚀 Running password change script...\n');
process.chdir(projectPath);

try {
    // Load .env to show current config
    require('dotenv').config();
    console.log('📋 Current Database Config:');
    console.log(`   Host: ${process.env.DB_HOST || 'NOT SET'}`);
    console.log(`   Port: ${process.env.DB_PORT || 'NOT SET'}`);
    console.log(`   User: ${process.env.DB_USER || 'NOT SET'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'NOT SET'}\n`);
    
    // Run the password change script
    const scriptFullPath = path.resolve(scriptPath);
    execSync(`node "${scriptFullPath}" "${passwordToUse}"`, { 
        stdio: 'inherit',
        cwd: projectPath 
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Password change completed!');
    console.log(`\n📝 New password: ${passwordToUse}`);
    console.log('\n💡 Remember to:');
    console.log('   1. Update Railway Variables tab with this password');
    console.log('   2. Keep this password secure!');
    
} catch (error) {
    console.error('\n❌ Failed to change password');
    process.exit(1);
}

