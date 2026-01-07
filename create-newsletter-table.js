// Create Newsletter Subscribers Table
// Run with: node create-newsletter-table.js

const mysql = require('mysql2/promise');

const dbConfig = require('./db-config');
const pool = mysql.createPool(dbConfig);

async function createNewsletterTable() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to database\n');

        // Create newsletter_subscribers table
        console.log('Creating newsletter_subscribers table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                unsubscribed_at TIMESTAMP NULL,
                source VARCHAR(100) DEFAULT 'homepage',
                INDEX idx_email (email),
                INDEX idx_subscribed_at (subscribed_at),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ Newsletter subscribers table created successfully!\n');
        
        await connection.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error.message);
        if (connection) await connection.release();
        process.exit(1);
    }
}

createNewsletterTable();


