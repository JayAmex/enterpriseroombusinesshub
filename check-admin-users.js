const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = require('./db-config');

async function checkAdminUsers() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        console.log('============================================================');
        console.log('Checking Admin Users in Database');
        console.log('============================================================\n');

        const [admins] = await connection.execute(
            'SELECT id, username, email, full_name, role, is_active, created_at FROM admin_users'
        );

        console.log(`📊 Total admin users: ${admins.length}\n`);

        if (admins.length === 0) {
            console.log('⚠️  No admin users found in database!');
            console.log('   Creating default admin user...\n');
            
            // Create default admin with password from environment variable
            const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
            const adminUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
            const passwordHash = await bcrypt.hash(adminPassword, 10);
            const [result] = await connection.execute(
                'INSERT INTO admin_users (username, password_hash, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
                [adminUsername, passwordHash, 'admin@enterpriseroom.com', 'System Administrator', 'super_admin']
            );
            
            console.log(`✅ Created default admin user (ID: ${result.insertId})`);
            console.log(`   Username: ${adminUsername}`);
            console.log(`   Password: ${adminPassword}\n`);
        } else {
            admins.forEach((admin, idx) => {
                console.log(`${idx + 1}. ID: ${admin.id}`);
                console.log(`   Username: ${admin.username}`);
                console.log(`   Email: ${admin.email || 'N/A'}`);
                console.log(`   Full Name: ${admin.full_name || 'N/A'}`);
                console.log(`   Role: ${admin.role}`);
                console.log(`   Active: ${admin.is_active ? 'Yes' : 'No'}`);
                console.log(`   Created: ${admin.created_at || 'N/A'}\n`);
            });

            // Test password for 'admin' user
            const adminUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
            const adminUser = admins.find(a => a.username === adminUsername);
            if (adminUser) {
                console.log(`Testing password for "${adminUsername}" user...`);
                const [passwordData] = await connection.execute(
                    'SELECT password_hash FROM admin_users WHERE username = ?',
                    [adminUsername]
                );
                
                if (passwordData.length > 0) {
                    const passwordHash = passwordData[0].password_hash;
                    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
                    const match = await bcrypt.compare(testPassword, passwordHash);
                    
                    if (match) {
                        console.log(`   ✅ Password "${testPassword}" matches!\n`);
                    } else {
                        console.log(`   ❌ Password "${testPassword}" does NOT match!`);
                        console.log(`   Updating password to "${testPassword}"...\n`);
                        
                        const newHash = await bcrypt.hash(testPassword, 10);
                        await connection.execute(
                            'UPDATE admin_users SET password_hash = ? WHERE username = ?',
                            [newHash, adminUsername]
                        );
                        console.log(`   ✅ Password updated to "${testPassword}"\n`);
                    }
                }
            }
        }

        console.log('============================================================');
        console.log('✅ Check completed');
        console.log('============================================================');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkAdminUsers();




