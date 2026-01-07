// Insert dummy blog post into database
const mysql = require('mysql2/promise');

require('dotenv').config();
const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function insertBlogPost() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        const blogPost = {
            title: 'Welcome to Enterprise Room Business Hub',
            content: 'This is a sample blog post to test the blog functionality. Enterprise Room Business Hub is your one-stop destination for business growth, networking, and funding opportunities. We provide resources, tools, and connections to help entrepreneurs succeed.',
            excerpt: 'Learn about Enterprise Room Business Hub and how we support entrepreneurs.',
            author: 'Admin',
            category: 'News',
            published_date: '2024-01-15',
            is_published: true,
            featured_image_url: 'https://example.com/blog-image.jpg'
        };

        console.log('Inserting blog post...');
        const [result] = await connection.execute(
            `INSERT INTO blog_posts (
                title, content, excerpt, author, category,
                published_date, is_published, featured_image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                blogPost.title,
                blogPost.content,
                blogPost.excerpt,
                blogPost.author,
                blogPost.category,
                blogPost.published_date,
                blogPost.is_published,
                blogPost.featured_image_url
            ]
        );

        console.log(`✅ Blog post created! ID: ${result.insertId}`);
        console.log(`   Title: ${blogPost.title}`);
        console.log(`   Category: ${blogPost.category}`);
        console.log(`   Published: ${blogPost.is_published}`);
        console.log(`   Published Date: ${blogPost.published_date}\n`);

        // Verify it was inserted
        const [posts] = await connection.execute(
            'SELECT id, title, category, published_date, is_published FROM blog_posts WHERE id = ?',
            [result.insertId]
        );

        if (posts.length > 0) {
            console.log('✅ Verification - Blog post found in database:');
            console.log(`   ${JSON.stringify(posts[0], null, 2)}\n`);
        }

        // Count total published posts
        const [count] = await connection.execute(
            'SELECT COUNT(*) as total FROM blog_posts WHERE is_published = TRUE'
        );
        console.log(`📊 Total published blog posts: ${count[0].total}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('   Code:', error.code);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

insertBlogPost();




