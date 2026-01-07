// Test blog query directly
const mysql = require('mysql2/promise');

require('dotenv').config();
const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function testBlogQuery() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // Test the exact query from the API
        const pageNum = 1;
        const limitNum = 10;
        const offset = (pageNum - 1) * limitNum;

        let query = 'SELECT * FROM blog_posts WHERE is_published = TRUE';
        const params = [];

        // LIMIT and OFFSET must be integers, not parameters
        query += ` ORDER BY published_date DESC, id DESC LIMIT ${limitNum} OFFSET ${offset}`;

        console.log('Testing query:', query);
        console.log('Parameters:', params);
        console.log('');

        const [posts] = await connection.execute(query, params);
        console.log(`✅ Query successful! Found ${posts.length} posts\n`);

        if (posts.length > 0) {
            console.log('First post:');
            console.log(JSON.stringify(posts[0], null, 2));
        }

        // Test count query
        const countQuery = 'SELECT COUNT(*) as total FROM blog_posts WHERE is_published = TRUE';
        const [countResult] = await connection.execute(countQuery);
        console.log(`\nTotal published posts: ${countResult[0].total}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('   Code:', error.code);
        console.error('   SQL State:', error.sqlState);
        console.error('   SQL:', error.sql);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testBlogQuery();

