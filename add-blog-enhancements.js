// Script to add columns and tables for blog enhancements
const mysql = require('mysql2/promise');
const dbConfig = require('./db-config');

async function addBlogEnhancements() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        console.log('Adding blog enhancements...');
        
        // Add view_count column to blog_posts
        try {
            await connection.execute(`
                ALTER TABLE blog_posts 
                ADD COLUMN view_count INT DEFAULT 0,
                ADD COLUMN tags VARCHAR(500) DEFAULT NULL
            `);
            console.log('✓ Added view_count and tags columns to blog_posts');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠ Columns already exist, skipping...');
            } else {
                throw error;
            }
        }
        
        // Create saved_blog_posts table
        try {
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS saved_blog_posts (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    blog_post_id INT NOT NULL,
                    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_user_blog (user_id, blog_post_id),
                    INDEX idx_user_id (user_id),
                    INDEX idx_blog_post_id (blog_post_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('✓ Created saved_blog_posts table');
        } catch (error) {
            if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                console.log('⚠ Table already exists, skipping...');
            } else {
                throw error;
            }
        }
        
        console.log('✅ Blog enhancements added successfully!');
    } catch (error) {
        console.error('❌ Error adding blog enhancements:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

addBlogEnhancements();

