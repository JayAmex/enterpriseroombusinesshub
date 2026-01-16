// Insert Test Data into Database
// ⚠️ WARNING: DEVELOPMENT ONLY - DO NOT RUN IN PRODUCTION
// This script inserts test data including test user credentials
// Run with: node insert-test-data.js
//
// Test Credentials Created:
// - Admin: admin / admin123
// - Test User: test@example.com / test123
//
// These are for development/testing only!

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Database configuration
const dbConfig = require('./db-config');
const pool = mysql.createPool(dbConfig);

async function insertTestData() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to database\n');

        // 1. Create Test User
        console.log('1. Creating test user...');
        const passwordHash = await bcrypt.hash('test123', 10);
        const [userResult] = await connection.execute(
            'INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)',
            ['Test User', 'test@example.com', passwordHash, '1234567890']
        );
        const userId = userResult.insertId;
        console.log(`   ✅ Test user created (ID: ${userId}, Email: test@example.com, Password: test123)\n`);

        // 2. Create Test Business
        console.log('2. Creating test business...');
        const [businessResult] = await connection.execute(
            `INSERT INTO businesses (
                user_id, business_name, business_address, business_sector,
                year_of_formation, number_of_employees, cac_registered,
                owner_name, owner_relationship, status, registered_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
            [
                userId, 'Test Business Inc', '123 Business Street, Lagos', 'Technology',
                2020, 15, true, 'Test User', 'Owner/Founder', 'Verified Business'
            ]
        );
        const businessId = businessResult.insertId;
        console.log(`   ✅ Test business created (ID: ${businessId}, Status: Verified Business)\n`);

        // 3. Create Regular Events
        console.log('3. Creating regular events...');
        const events = [
            {
                title: 'Networking Mixer',
                description: 'Join us for an evening of networking and connections.',
                event_date: '2024-02-15',
                event_time: '18:00:00',
                date_display: 'February 15, 2024',
                event_type: 'regular',
                status: 'Upcoming',
                flier_url: 'https://example.com/flier1.jpg'
            },
            {
                title: 'Business Workshop',
                description: 'Learn essential business skills from industry experts.',
                event_date: '2024-02-20',
                event_time: '10:00:00',
                date_display: 'February 20, 2024',
                event_type: 'regular',
                status: 'Featured',
                flier_url: 'https://example.com/flier2.jpg'
            },
            {
                title: 'Startup Showcase',
                description: 'Showcase your startup to potential investors.',
                event_date: '2024-01-10',
                event_time: '14:00:00',
                date_display: 'January 10, 2024',
                event_type: 'regular',
                status: 'Historical',
                flier_url: 'https://example.com/flier3.jpg'
            }
        ];

        for (const event of events) {
            const [eventResult] = await connection.execute(
                `INSERT INTO events (
                    title, description, event_date, event_time, date_display,
                    event_type, status, flier_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    event.title, event.description, event.event_date, event.event_time,
                    event.date_display, event.event_type, event.status, event.flier_url
                ]
            );
            console.log(`   ✅ Created event: ${event.title} (ID: ${eventResult.insertId})`);
        }
        console.log('');

        // 4. Create Pitch Events
        console.log('4. Creating pitch events...');
        const pitchEvents = [
            {
                title: 'Pitch 2.0',
                description: 'The ultimate pitch competition for startups seeking funding.',
                event_date: '2024-03-01',
                event_time: '09:00:00',
                date_display: 'March 1, 2024',
                event_type: 'pitch',
                status: 'Upcoming',
                flier_url: 'https://example.com/pitch-flier.jpg'
            },
            {
                title: 'Pitch Competition 2024',
                description: 'Annual pitch competition with $50,000 in prizes.',
                event_date: '2024-03-15',
                event_time: '10:00:00',
                date_display: 'March 15, 2024',
                event_type: 'pitch',
                status: 'Live Now',
                flier_url: 'https://example.com/pitch2-flier.jpg'
            }
        ];

        for (const pitchEvent of pitchEvents) {
            const [pitchResult] = await connection.execute(
                `INSERT INTO events (
                    title, description, event_date, event_time, date_display,
                    event_type, status, flier_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    pitchEvent.title, pitchEvent.description, pitchEvent.event_date,
                    pitchEvent.event_time, pitchEvent.date_display, pitchEvent.event_type,
                    pitchEvent.status, pitchEvent.flier_url
                ]
            );
            console.log(`   ✅ Created pitch event: ${pitchEvent.title} (ID: ${pitchResult.insertId})`);
        }
        console.log('');

        // 5. Create Blog Posts
        console.log('5. Creating blog posts...');
        const blogPosts = [
            {
                title: '10 Tips for Startup Success',
                content: 'Starting a business is challenging, but with the right approach, you can succeed. Here are 10 essential tips...',
                excerpt: 'Essential tips for entrepreneurs starting their journey.',
                author: 'Admin',
                category: 'Strategy',
                published_date: '2024-01-15',
                is_published: true
            },
            {
                title: 'How to Pitch Your Business',
                content: 'A compelling pitch can make all the difference when seeking funding. Learn how to craft the perfect pitch...',
                excerpt: 'Master the art of pitching your business to investors.',
                author: 'Admin',
                category: 'News',
                published_date: '2024-01-20',
                is_published: true
            },
            {
                title: 'Case Study: Tech Startup Success',
                content: 'We explore how a local tech startup grew from 2 employees to 50 in just 2 years...',
                excerpt: 'Real-world example of rapid business growth.',
                author: 'Admin',
                category: 'Case Study',
                published_date: '2024-01-25',
                is_published: true
            }
        ];

        for (const post of blogPosts) {
            const [postResult] = await connection.execute(
                `INSERT INTO blog_posts (
                    title, content, excerpt, author, category,
                    published_date, is_published
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    post.title, post.content, post.excerpt, post.author,
                    post.category, post.published_date, post.is_published
                ]
            );
            console.log(`   ✅ Created blog post: ${post.title} (ID: ${postResult.insertId})`);
        }
        console.log('');

        // 6. Create Directory Members
        console.log('6. Creating directory members...');
        const members = [
            {
                name: 'John Doe',
                title: 'CEO',
                organization: 'Tech Corp',
                website: 'https://johndoe.com',
                linkedin_url: 'https://linkedin.com/in/johndoe',
                twitter_url: 'https://twitter.com/johndoe',
                avatar_url: 'https://example.com/avatar1.jpg'
            },
            {
                name: 'Jane Smith',
                title: 'CTO',
                organization: 'Innovate Labs',
                website: 'https://janesmith.com',
                linkedin_url: 'https://linkedin.com/in/janesmith',
                twitter_url: 'https://twitter.com/janesmith',
                avatar_url: 'https://example.com/avatar2.jpg'
            },
            {
                name: 'Mike Johnson',
                title: 'Investor',
                organization: 'Venture Capital Partners',
                website: 'https://mikejohnson.com',
                linkedin_url: 'https://linkedin.com/in/mikejohnson',
                twitter_url: 'https://twitter.com/mikejohnson',
                avatar_url: 'https://example.com/avatar3.jpg'
            }
        ];

        for (const member of members) {
            const [memberResult] = await connection.execute(
                `INSERT INTO directory_members (
                    name, title, organization, website, linkedin_url,
                    twitter_url, avatar_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    member.name, member.title, member.organization, member.website,
                    member.linkedin_url, member.twitter_url, member.avatar_url
                ]
            );
            console.log(`   ✅ Created member: ${member.name} (ID: ${memberResult.insertId})`);
        }
        console.log('');

        // 7. Create Directory Partners
        console.log('7. Creating directory partners...');
        const partners = [
            {
                address: '123 Partnership Avenue, Lagos',
                email: 'partner1@example.com',
                phone: '08012345678',
                website: 'https://partner1.com'
            },
            {
                address: '456 Collaboration Street, Abuja',
                email: 'partner2@example.com',
                phone: '08023456789',
                website: 'https://partner2.com'
            },
            {
                address: '789 Alliance Road, Port Harcourt',
                email: 'partner3@example.com',
                phone: '08034567890',
                website: 'https://partner3.com'
            }
        ];

        for (const partner of partners) {
            const [partnerResult] = await connection.execute(
                `INSERT INTO directory_partners (
                    address, email, phone, website
                ) VALUES (?, ?, ?, ?)`,
                [partner.address, partner.email, partner.phone, partner.website]
            );
            console.log(`   ✅ Created partner: ${partner.email} (ID: ${partnerResult.insertId})`);
        }
        console.log('');

        // 8. Create Directory Businesses (Admin-added)
        console.log('8. Creating directory businesses...');
        const dirBusinesses = [
            {
                business_name: 'Premium Services Ltd',
                address: '100 Business Park, Lagos',
                email: 'info@premiumservices.com',
                phone: '08011111111',
                website: 'https://premiumservices.com'
            },
            {
                business_name: 'Elite Solutions Inc',
                address: '200 Innovation Hub, Abuja',
                email: 'contact@elitesolutions.com',
                phone: '08022222222',
                website: 'https://elitesolutions.com'
            }
        ];

        for (const dirBiz of dirBusinesses) {
            const [dirBizResult] = await connection.execute(
                `INSERT INTO directory_businesses (
                    business_name, address, email, phone, website
                ) VALUES (?, ?, ?, ?, ?)`,
                [dirBiz.business_name, dirBiz.address, dirBiz.email, dirBiz.phone, dirBiz.website]
            );
            console.log(`   ✅ Created directory business: ${dirBiz.business_name} (ID: ${dirBizResult.insertId})`);
        }
        console.log('');

        // 9. Create Custom Tools
        console.log('9. Creating custom tools...');
        const tools = [
            {
                name: 'ROI Calculator',
                description: 'Calculate return on investment for your business projects.',
                inputs: JSON.stringify([
                    { label: 'Initial Investment', id: 'investment', type: 'number', value: '10000' },
                    { label: 'Expected Return', id: 'return', type: 'number', value: '15000' }
                ]),
                function_code: 'function calculate(investment, return) { return ((return - investment) / investment * 100).toFixed(2); }',
                result_label: 'ROI',
                result_id: 'roi-result',
                button_text: 'Calculate ROI',
                button_color: 'primary',
                show_conversion: false
            },
            {
                name: 'Break-Even Calculator',
                description: 'Calculate when your business will break even.',
                inputs: JSON.stringify([
                    { label: 'Fixed Costs', id: 'fixed', type: 'number', value: '5000' },
                    { label: 'Variable Cost per Unit', id: 'variable', type: 'number', value: '10' },
                    { label: 'Price per Unit', id: 'price', type: 'number', value: '25' }
                ]),
                function_code: 'function calculate(fixed, variable, price) { return Math.ceil(fixed / (price - variable)); }',
                result_label: 'Break-Even Units',
                result_id: 'break-even-result',
                button_text: 'Calculate',
                button_color: 'success',
                show_conversion: false
            }
        ];

        for (const tool of tools) {
            const [toolResult] = await connection.execute(
                `INSERT INTO custom_tools (
                    name, description, inputs, function_code, result_label,
                    result_id, button_text, button_color, show_conversion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    tool.name, tool.description, tool.inputs, tool.function_code,
                    tool.result_label, tool.result_id, tool.button_text,
                    tool.button_color, tool.show_conversion
                ]
            );
            console.log(`   ✅ Created tool: ${tool.name} (ID: ${toolResult.insertId})`);
        }
        console.log('');

        console.log('='.repeat(60));
        console.log('✅ All test data inserted successfully!');
        console.log('='.repeat(60));
        console.log('\n📋 Summary:');
        console.log(`   - Test User: test@example.com / test123`);
        console.log(`   - Test Business: 1 (Verified Business)`);
        console.log(`   - Regular Events: ${events.length}`);
        console.log(`   - Pitch Events: ${pitchEvents.length}`);
        console.log(`   - Blog Posts: ${blogPosts.length}`);
        console.log(`   - Directory Members: ${members.length}`);
        console.log(`   - Directory Partners: ${partners.length}`);
        console.log(`   - Directory Businesses: ${dirBusinesses.length}`);
        console.log(`   - Custom Tools: ${tools.length}`);
        console.log('\n💡 You can now test the API endpoints with these credentials!');

    } catch (error) {
        console.error('❌ Error inserting test data:', error.message);
        console.error('   Code:', error.code);
        if (error.code === 'ER_DUP_ENTRY') {
            console.error('   ⚠️  Some data may already exist. This is okay - test data is already in the database.');
        } else {
            throw error;
        }
    } finally {
        if (connection) {
            connection.release();
        }
        await pool.end();
    }
}

insertTestData().catch(console.error);

