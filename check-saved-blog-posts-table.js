// Check and create saved_blog_posts table if needed
require('dotenv').config();
const mysql = require('mysql2/promise');
const dbConfig = require('./db-config');

async function checkAndCreateTable() {
    let connection;
    
    try {
        console.log('🔍 Checking saved_blog_posts table...\n');
        connection = await mysql.createConnection(dbConfig);
        
        // Check if table exists
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'saved_blog_posts'"
        );
        
        if (tables.length === 0) {
            console.log('❌ Table saved_blog_posts does NOT exist!');
            console.log('📝 Creating table...\n');
            
            await connection.execute(`
                CREATE TABLE saved_blog_posts (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    blog_post_id INT NOT NULL,
                    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_user_blog (user_id, blog_post_id),
                    INDEX idx_user_id (user_id),
                    INDEX idx_blog_post_id (blog_post_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            
            console.log('✅ Table saved_blog_posts created successfully!');
        } else {
            console.log('✅ Table saved_blog_posts exists');
            
            // Show table structure
            const [columns] = await connection.execute('DESCRIBE saved_blog_posts');
            console.log('\n📋 Table structure:');
            columns.forEach(col => {
                console.log(`   - ${col.Field} (${col.Type})`);
            });
        }
        
        console.log('\n✅ Check complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ER_NO_REFERENCED_TABLE_2') {
            console.error('\n💡 Note: Make sure users and blog_posts tables exist first!');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkAndCreateTable();
