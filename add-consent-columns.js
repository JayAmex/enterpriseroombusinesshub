/**
 * Add consent recording columns to users table.
 * Records when the user agreed to Terms and Privacy Policy at registration.
 * Run once: node add-consent-columns.js
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
            const [cols] = await conn.query('SHOW COLUMNS FROM users LIKE ?', [colName]);
            if (cols.length === 0) await conn.query(sql);
        };
        await addIfMissing('terms_accepted_at', 'ALTER TABLE users ADD COLUMN terms_accepted_at DATETIME NULL');
        await addIfMissing('privacy_accepted_at', 'ALTER TABLE users ADD COLUMN privacy_accepted_at DATETIME NULL');
        console.log('Consent columns added to users table.');
    } finally {
        await conn.end();
    }
}

run().catch(err => { console.error(err); process.exit(1); });
