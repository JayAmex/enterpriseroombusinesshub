// Check if user exists in database
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function checkUser() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // Check if user exists
        const testEmail = process.env.TEST_USER_EMAIL || 'test@enterprisehub.com';
        const [users] = await connection.execute(
            'SELECT id, email, name, password_hash FROM users WHERE email = ?',
            [testEmail]
        );

        const testEmail = process.env.TEST_USER_EMAIL || 'test@enterprisehub.com';
        const testPassword = process.env.TEST_USER_PASSWORD || 'test123';
        
        if (users.length === 0) {
            console.log(`❌ User ${testEmail} does not exist in database.`);
            console.log(`\n💡 Creating user with password: ${testPassword}...\n`);
            
            const passwordHash = await bcrypt.hash(testPassword, 10);
            const [result] = await connection.execute(
                'INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)',
                ['Test User', testEmail, passwordHash, '1234567890']
            );
            
            console.log(`✅ User created! ID: ${result.insertId}`);
            console.log(`   Email: ${testEmail}`);
            console.log(`   Password: ${testPassword}`);
        } else {
            const user = users[0];
            console.log('✅ User found in database:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Name: ${user.name}`);
            
            // Test password
            const testPassword = process.env.TEST_USER_PASSWORD || 'test123';
            const passwordMatch = await bcrypt.compare(testPassword, user.password_hash);
            if (passwordMatch) {
                console.log(`   ✅ Password "${testPassword}" is correct!`);
            } else {
                console.log(`   ❌ Password "${testPassword}" does not match.`);
                console.log(`\n💡 Resetting password to "${testPassword}"...\n`);
                const newPasswordHash = await bcrypt.hash(testPassword, 10);
                await connection.execute(
                    'UPDATE users SET password_hash = ? WHERE email = ?',
                    [newPasswordHash, 'test@enterprisehub.com']
                );
                console.log(`✅ Password reset to "${testPassword}"`);
            }
        }

        // List all users
        console.log('\n📋 All users in database:');
        const [allUsers] = await connection.execute('SELECT id, email, name FROM users ORDER BY id');
        allUsers.forEach(u => {
            console.log(`   ${u.id}. ${u.email} (${u.name})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkUser();




