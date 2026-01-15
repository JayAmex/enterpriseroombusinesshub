// Create Password Reset Tokens Table
require('dotenv').config();
const mysql = require('mysql2/promise');
const dbConfig = require('./db-config');

async function createPasswordResetTable() {
    let connection;
    
    try {
        console.log('🔧 Creating password_reset_tokens table...\n');
        connection = await mysql.createConnection(dbConfig);
        
        // Create password_reset_tokens table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_token (token),
                INDEX idx_user_id (user_id),
                INDEX idx_expires_at (expires_at),
                INDEX idx_used (used)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ Password reset tokens table created successfully!\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('ℹ️  Table already exists. Skipping...\n');
        } else {
            throw error;
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createPasswordResetTable();
