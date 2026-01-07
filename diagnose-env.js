// Diagnostic script to check .env file values
require('dotenv').config();

console.log('📋 Environment Variables Check:\n');

const vars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_SSL'];
let issues = [];

vars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
        console.log(`❌ ${varName}: NOT SET`);
        issues.push(`${varName} is missing`);
    } else {
        // Check for whitespace issues
        const trimmed = value.trim();
        if (value !== trimmed) {
            console.log(`⚠️  ${varName}: HAS WHITESPACE (length: ${value.length}, trimmed: ${trimmed.length})`);
            issues.push(`${varName} has leading/trailing whitespace`);
        }
        
        // Show value (mask password)
        if (varName === 'DB_PASSWORD') {
            console.log(`✅ ${varName}: Set (length: ${value.length}, ends with: ...${value.slice(-4)})`);
            // Check for common issues
            if (value.includes('\n') || value.includes('\r')) {
                console.log(`   ⚠️  WARNING: Password contains newline characters!`);
                issues.push('DB_PASSWORD contains newline characters');
            }
            if (value.startsWith('"') || value.startsWith("'")) {
                console.log(`   ⚠️  WARNING: Password starts with quote character!`);
                issues.push('DB_PASSWORD starts with quote');
            }
            if (value.endsWith('"') || value.endsWith("'")) {
                console.log(`   ⚠️  WARNING: Password ends with quote character!`);
                issues.push('DB_PASSWORD ends with quote');
            }
        } else {
            console.log(`✅ ${varName}: ${value}`);
        }
    }
});

console.log('\n📊 Summary:');
if (issues.length === 0) {
    console.log('✅ No obvious issues found in .env file');
    console.log('\n💡 If connection still fails, check:');
    console.log('   1. Password in Railway dashboard matches .env exactly');
    console.log('   2. No extra spaces or quotes around values in .env');
    console.log('   3. MySQL user has permissions from your IP');
} else {
    console.log('⚠️  Issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('\n💡 Fix these issues and try again.');
}

// Show the exact connection string (masked)
console.log('\n🔌 Connection Details:');
console.log(`   Host: ${process.env.DB_HOST || 'NOT SET'}`);
console.log(`   Port: ${process.env.DB_PORT || 'NOT SET'}`);
console.log(`   User: ${process.env.DB_USER || 'NOT SET'}`);
console.log(`   Database: ${process.env.DB_NAME || 'NOT SET'}`);
console.log(`   SSL: ${process.env.DB_SSL || 'NOT SET'}`);

