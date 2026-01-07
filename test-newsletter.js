// Test Newsletter Subscription System
// Run with: node test-newsletter.js

const mysql = require('mysql2/promise');

const dbConfig = require('./db-config');

const pool = mysql.createPool(dbConfig);

async function testNewsletter() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to database\n');

        // 1. Check if table exists
        console.log('1. Checking if newsletter_subscribers table exists...');
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'newsletter_subscribers'"
        );
        
        if (tables.length === 0) {
            console.log('❌ Table does not exist!');
            return;
        }
        console.log('✅ Table exists!\n');

        // 2. Check table structure
        console.log('2. Checking table structure...');
        const [columns] = await connection.execute(
            'DESCRIBE newsletter_subscribers'
        );
        console.log('✅ Table columns:');
        columns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type})`);
        });
        console.log('');

        // 3. Check current subscribers count
        console.log('3. Checking current subscribers...');
        const [count] = await connection.execute(
            'SELECT COUNT(*) as total, SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active FROM newsletter_subscribers'
        );
        console.log(`   Total subscribers: ${count[0].total}`);
        console.log(`   Active subscribers: ${count[0].active}`);
        console.log(`   Inactive subscribers: ${count[0].total - count[0].active}\n`);

        // 4. Show sample subscribers (if any)
        if (count[0].total > 0) {
            console.log('4. Sample subscribers:');
            const [subscribers] = await connection.execute(
                'SELECT email, subscribed_at, is_active, source FROM newsletter_subscribers ORDER BY subscribed_at DESC LIMIT 5'
            );
            subscribers.forEach((sub, index) => {
                console.log(`   ${index + 1}. ${sub.email} - ${sub.is_active ? 'Active' : 'Inactive'} - ${sub.subscribed_at}`);
            });
        } else {
            console.log('4. No subscribers yet. You can test by subscribing on the homepage.\n');
        }

        console.log('✅ Newsletter system is ready!');
        console.log('\n📝 To test:');
        console.log('   1. Start your server: npm run dev');
        console.log('   2. Go to http://localhost:3000/index.html');
        console.log('   3. Scroll to newsletter section and enter an email');
        console.log('   4. Check admin dashboard -> Newsletter Subscribers section');

        await connection.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (connection) await connection.release();
        process.exit(1);
    }
}

testNewsletter();


