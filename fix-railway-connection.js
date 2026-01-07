// Comprehensive Railway Database Connection Fix Script
// This script helps diagnose and fix connection issues after password change

require('dotenv').config();
const mysql = require('mysql2/promise');

console.log('🔧 Railway Database Connection Troubleshooter\n');
console.log('=' .repeat(60));

// Step 1: Check environment variables
console.log('\n📋 Step 1: Checking Environment Variables');
console.log('-'.repeat(60));

const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
let missingVars = [];

requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
        console.log(`❌ ${varName}: NOT SET`);
        missingVars.push(varName);
    } else {
        if (varName === 'DB_PASSWORD') {
            console.log(`✅ ${varName}: Set (length: ${value.length}, ends with: ...${value.slice(-4)})`);
            
            // Check for common issues
            const issues = [];
            if (value.trim() !== value) {
                issues.push('has leading/trailing whitespace');
            }
            if (value.includes('\n') || value.includes('\r')) {
                issues.push('contains newline characters');
            }
            if (value.startsWith('"') || value.startsWith("'")) {
                issues.push('starts with quote character');
            }
            if (value.endsWith('"') || value.endsWith("'")) {
                issues.push('ends with quote character');
            }
            
            if (issues.length > 0) {
                console.log(`   ⚠️  WARNING: Password ${issues.join(', ')}`);
            }
        } else {
            console.log(`✅ ${varName}: ${value}`);
        }
    }
});

if (missingVars.length > 0) {
    console.log('\n❌ Missing required environment variables!');
    console.log('   Please set these in your .env file:');
    missingVars.forEach(v => console.log(`   - ${v}`));
    process.exit(1);
}

// Step 2: Check for Railway connection string
console.log('\n📋 Step 2: Checking for Railway Connection String');
console.log('-'.repeat(60));

const railwayUrl = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL;
if (railwayUrl) {
    console.log('✅ Found Railway connection string!');
    console.log('   Consider using this instead of individual variables.');
    console.log(`   URL: ${railwayUrl.substring(0, 20)}...`);
} else {
    console.log('ℹ️  No Railway connection string found (MYSQL_URL, MYSQL_PUBLIC_URL, or DATABASE_URL)');
    console.log('   Using individual environment variables instead.');
}

// Step 3: Test connection
console.log('\n📋 Step 3: Testing Database Connection');
console.log('-'.repeat(60));

const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 10000
};

if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = {
        rejectUnauthorized: false
    };
}

async function testConnection() {
    let connection;
    
    try {
        console.log('🔌 Attempting connection...');
        console.log(`   Host: ${dbConfig.host}`);
        console.log(`   Port: ${dbConfig.port}`);
        console.log(`   User: ${dbConfig.user}`);
        console.log(`   Database: ${dbConfig.database}`);
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connection successful!');
        
        // Test query
        const [rows] = await connection.execute('SELECT 1 as test, NOW() as server_time, DATABASE() as current_database');
        console.log('✅ Test query executed successfully!');
        console.log(`   Server Time: ${rows[0].server_time}`);
        console.log(`   Current Database: ${rows[0].current_database}`);
        
        // Check MySQL version
        try {
            const [version] = await connection.execute('SELECT VERSION() as version');
            console.log(`   MySQL Version: ${version[0].version}`);
        } catch (versionError) {
            console.log(`   MySQL Version: Could not retrieve (${versionError.message})`);
        }
        
        console.log('\n✅ All checks passed! Your database connection is working.');
        return true;
        
    } catch (error) {
        console.error('\n❌ Connection failed!');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        
        // Provide specific troubleshooting based on error
        console.log('\n📋 Step 4: Troubleshooting Guide');
        console.log('-'.repeat(60));
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n🔴 ACCESS DENIED ERROR - Most Common After Password Change\n');
            console.log('This usually means one of these issues:');
            console.log('\n1. ❌ Password Mismatch');
            console.log('   - The password in your .env file does NOT match Railway');
            console.log('   - Solution:');
            console.log('     a. Go to Railway dashboard → MySQL service');
            console.log('     b. Check the "Variables" or "Connect" tab');
            console.log('     c. Copy the password EXACTLY (no quotes, no spaces)');
            console.log('     d. Update DB_PASSWORD in your .env file');
            console.log('     e. Make sure there are NO quotes around the password');
            
            console.log('\n2. ❌ User Permissions Reset');
            console.log('   - Railway may have reset permissions when you changed the password');
            console.log('   - Solution:');
            console.log('     a. Go to Railway dashboard → MySQL service');
            console.log('     b. Click "Connect" or "Query" to open MySQL console');
            console.log('     c. Run these commands (replace YOUR_PASSWORD with actual password):');
            console.log('        GRANT ALL PRIVILEGES ON *.* TO \'root\'@\'%\' IDENTIFIED BY \'YOUR_PASSWORD\';');
            console.log('        FLUSH PRIVILEGES;');
            
            console.log('\n3. ❌ Password Format Issues');
            console.log('   - Special characters in password might need escaping');
            console.log('   - Solution:');
            console.log('     a. Copy password directly from Railway (don\'t type manually)');
            console.log('     b. If password has quotes, make sure .env file has no quotes around it');
            console.log('     c. Check for hidden characters (run: node diagnose-env.js)');
            
            console.log('\n4. 🔄 Try Resetting Password Again');
            console.log('   - Sometimes Railway needs a fresh password reset');
            console.log('   - Solution:');
            console.log('     a. Railway dashboard → MySQL service → Variables');
            console.log('     b. Generate a new password');
            console.log('     c. Update .env file immediately');
            console.log('     d. Test connection again');
            
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n🔴 CONNECTION REFUSED\n');
            console.log('The database server is not accepting connections.');
            console.log('Check:');
            console.log('   - Is Railway MySQL service running?');
            console.log('   - Is the host and port correct?');
            console.log('   - Railway proxy: shortline.proxy.rlwy.net:46250');
            
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n🔴 DATABASE NOT FOUND\n');
            console.log('The database does not exist.');
            console.log('Solution: Create the database in Railway MySQL console:');
            console.log('   CREATE DATABASE IF NOT EXISTS railway;');
            
        } else {
            console.log('\n🔴 UNKNOWN ERROR\n');
            console.log('Check Railway dashboard for:');
            console.log('   - Service status');
            console.log('   - Connection logs');
            console.log('   - Error messages');
        }
        
        console.log('\n💡 Quick Fix Checklist:');
        console.log('   [ ] Password in .env matches Railway exactly (no quotes, no spaces)');
        console.log('   [ ] Ran: node diagnose-env.js (check for whitespace issues)');
        console.log('   [ ] Checked Railway MySQL service is running');
        console.log('   [ ] Verified user permissions in Railway MySQL console');
        console.log('   [ ] Tried resetting password in Railway and updating .env');
        
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the test
testConnection()
    .then(success => {
        if (success) {
            console.log('\n' + '='.repeat(60));
            console.log('✅ SUCCESS! Your database connection is working correctly.');
            process.exit(0);
        } else {
            console.log('\n' + '='.repeat(60));
            console.log('❌ Connection failed. Follow the troubleshooting steps above.');
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('\n❌ Unexpected error:', err);
        process.exit(1);
    });

