/**
 * Add an admin user so you can log in to the admin dashboard.
 * Run: node add-admin-user.js <username> <password> [email] [full_name]
 * Example: node add-admin-user.js teapot MySecurePass123 amoojacobs@gmail.com "Teapot Himself"
 * (email and full_name are optional)
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const args = process.argv.slice(2);
const username = args[0];
const password = args[1];
const email = args[2] || (username + '@enterpriserm.com');
const fullName = args[3] || username;

if (!username || !password) {
    console.error('Usage: node add-admin-user.js <username> <password> [email] [full_name]');
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
        if (existing.length > 0) {
            console.error('Username already exists. Choose another or reset that admin\'s password.');
            process.exit(1);
        }
        const passwordHash = await bcrypt.hash(password, 10);
        await conn.execute(
            'INSERT INTO admin_users (username, password_hash, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
            [username, passwordHash, email, fullName, 'super_admin']
        );
        console.log('Admin user added.');
        console.log('  Username:', username);
        console.log('  Email:', email);
        console.log('  Full name:', fullName);
        console.log('  Role: super_admin');
        console.log('');
        console.log('Log in at: https://www.enterpriserm.com/admin-login (or your site URL + /admin-login)');
    } finally {
        await conn.end();
    }
}

run().catch(err => { console.error(err); process.exit(1); });
