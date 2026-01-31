/**
 * Clear user data for re-testing: removes all users and email_sent_log.
 * Admin users (admin_users table) are NOT touched.
 * Run: node clear-user-data.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

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
        const [logResult] = await conn.query('DELETE FROM email_sent_log');
        const [userResult] = await conn.query('DELETE FROM users');
        console.log('Cleared email_sent_log:', logResult.affectedRows, 'rows');
        console.log('Cleared users (and cascaded related data):', userResult.affectedRows, 'rows');
        console.log('Done. You can re-register and re-run tests.');
    } finally {
        await conn.end();
    }
}

run().catch(err => { console.error(err); process.exit(1); });
