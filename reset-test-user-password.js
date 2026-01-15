// Reset Test User Password
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dbConfig = require('./db-config');

async function resetPassword() {
    let connection;
    
    try {
        console.log('🔧 Resetting password for test@enterprisehub.com\n');
        connection = await mysql.createConnection(dbConfig);
        
        const testEmail = 'test@enterprisehub.com';
        const newPassword = process.env.TEST_USER_PASSWORD || 'test123';
        
        // Check if user exists
        const [users] = await connection.execute(
            'SELECT id, email, name FROM users WHERE email = ?',
            [testEmail]
        );
        
        if (users.length === 0) {
            console.log(`❌ User ${testEmail} does not exist!`);
            return;
        }
        
        console.log(`✅ User found: ${users[0].name} (ID: ${users[0].id})`);
        console.log(`📝 Resetting password to: ${newPassword}\n`);
        
        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await connection.execute(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [passwordHash, testEmail]
        );
        
        console.log('✅ Password reset successfully!');
        console.log(`\n📋 Login credentials:`);
        console.log(`   Email: ${testEmail}`);
        console.log(`   Password: ${newPassword}\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

resetPassword();
