/**
 * Reset an admin user's password.
 * Run: node reset-admin-password.js <username> <new_password>
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const args = process.argv.slice(2);
const username = args[0];
const newPassword = args[1];

if (!username || !newPassword) {
    console.error('Usage: node reset-admin-password.js <username> <new_password>');
    process.exit(1);
}

const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};
if (process.env.DB_SSL === 'true') config.ssl = { rejectUnauthorized: true };

async function run() {
    const conn = await mysql.createConnection(config);
    try {
        const [existing] = await conn.execute('SELECT id FROM admin_users WHERE username = ?', [username]);
        if (existing.length === 0) {
            console.error('No admin user found for username:', username);
            process.exit(1);
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await conn.execute(
            'UPDATE admin_users SET password_hash = ? WHERE username = ?',
            [passwordHash, username]
        );
        console.log('Admin password updated.');
        console.log('  Username:', username);
    } finally {
        await conn.end();
    }
}

run().catch(err => { console.error(err); process.exit(1); });
