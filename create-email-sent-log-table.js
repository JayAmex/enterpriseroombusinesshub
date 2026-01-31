/**
 * Create email_sent_log table for app-level record of sent emails.
 * Run once: node create-email-sent-log-table.js
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
        await conn.query(`
            CREATE TABLE IF NOT EXISTS email_sent_log (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email_type VARCHAR(50) NOT NULL,
                to_email VARCHAR(255) NOT NULL,
                user_id INT NULL,
                from_address VARCHAR(255) NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email_type (email_type),
                INDEX idx_to_email (to_email),
                INDEX idx_sent_at (sent_at),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('email_sent_log table created or already exists.');
    } finally {
        await conn.end();
    }
}

run().catch(err => { console.error(err); process.exit(1); });
