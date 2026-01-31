/**
 * Add email verification columns to users table.
 * Run once: node add-email-verification.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    const config = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };
    if (process.env.DB_SSL === 'true') config.ssl = { rejectUnauthorized: true };

    const conn = await mysql.createConnection(config);

    try {
        const addIfMissing = async (colName, sql) => {
            const [cols] = await conn.query("SHOW COLUMNS FROM users LIKE ?", [colName]);
            if (cols.length === 0) await conn.query(sql);
        };
        await addIfMissing('email_verified', 'ALTER TABLE users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0');
        await addIfMissing('verification_token', 'ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) NULL');
        await addIfMissing('verification_token_expires_at', 'ALTER TABLE users ADD COLUMN verification_token_expires_at DATETIME NULL');

        // Mark all existing users as verified so they are not locked out
        await conn.query('UPDATE users SET email_verified = 1');
        console.log('Email verification columns added. Existing users marked as verified.');
    } finally {
        await conn.end();
    }
}

run().catch(err => { console.error(err); process.exit(1); });
