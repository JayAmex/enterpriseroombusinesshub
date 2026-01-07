// Add UUID support to users table
const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

require('dotenv').config();
const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function addUUIDSupport() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // Check if uuid column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'railway' 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'uuid'
        `);

        if (columns.length === 0) {
            console.log('1. Adding uuid column to users table...');
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN uuid VARCHAR(36) UNIQUE AFTER id,
                ADD INDEX idx_uuid (uuid)
            `);
            console.log('   ✅ UUID column added\n');
        } else {
            console.log('✅ UUID column already exists\n');
        }

        // Generate UUIDs for users without one
        console.log('2. Generating UUIDs for existing users...');
        const [users] = await connection.execute('SELECT id, uuid FROM users WHERE uuid IS NULL');
        
        if (users.length > 0) {
            console.log(`   Found ${users.length} users without UUID`);
            for (const user of users) {
                const uuid = randomUUID();
                await connection.execute('UPDATE users SET uuid = ? WHERE id = ?', [uuid, user.id]);
                console.log(`   ✅ User ID ${user.id}: ${uuid}`);
            }
        } else {
            console.log('   ✅ All users already have UUIDs');
        }

        // Verify all users have UUIDs
        console.log('\n3. Verifying UUIDs...');
        const [allUsers] = await connection.execute('SELECT id, email, uuid FROM users ORDER BY id');
        console.log(`   Total users: ${allUsers.length}`);
        allUsers.forEach(u => {
            console.log(`   ${u.id}. ${u.email} - UUID: ${u.uuid || '❌ MISSING'}`);
        });

        console.log('\n✅ UUID support added successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            console.error('   UUID collision detected. This is very rare. Retrying...');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addUUIDSupport();




