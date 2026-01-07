// Insert Test Events for Design Assessment
// Run with: node insert-test-events.js

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = require('./db-config');

const pool = mysql.createPool(dbConfig);

async function insertTestEvents() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to database\n');

        // Get today's date for live event
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const todayDisplay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        // Future dates for upcoming events
        const upcoming1 = new Date(today);
        upcoming1.setDate(today.getDate() + 7);
        const upcoming1Str = upcoming1.toISOString().split('T')[0];
        const upcoming1Display = upcoming1.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const upcoming2 = new Date(today);
        upcoming2.setDate(today.getDate() + 14);
        const upcoming2Str = upcoming2.toISOString().split('T')[0];
        const upcoming2Display = upcoming2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        // Past dates for historical events
        const past1 = new Date(today);
        past1.setDate(today.getDate() - 30);
        const past1Str = past1.toISOString().split('T')[0];
        const past1Display = past1.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const past2 = new Date(today);
        past2.setDate(today.getDate() - 60);
        const past2Str = past2.toISOString().split('T')[0];
        const past2Display = past2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        // Social links JSON for live event
        const liveSocialLinks = JSON.stringify({
            linkedin: 'https://linkedin.com/live/event1',
            instagram: 'https://instagram.com/live/event1',
            twitter: 'https://twitter.com/i/spaces/event1',
            youtube: 'https://youtube.com/live/event1'
        });

        const testEvents = [
            // 1 Live Event
            {
                title: 'Interactive Business Workshop',
                description: 'Streaming live across all our channels. Join the conversation and learn from industry experts.',
                event_date: todayStr,
                event_time: '15:00:00',
                date_display: `${todayDisplay} - 3:00 PM`,
                event_type: 'regular',
                status: 'Live Now',
                flier_url: null,
                social_links: liveSocialLinks
            },
            // 2 Upcoming Events
            {
                title: 'Business Workshop',
                description: 'Learn essential business skills from industry experts. This comprehensive workshop covers key strategies for business growth and development.',
                event_date: upcoming1Str,
                event_time: '10:00:00',
                date_display: `${upcoming1Display} - 10:00 AM`,
                event_type: 'regular',
                status: 'Upcoming',
                flier_url: null,
                social_links: null
            },
            {
                title: 'Networking Mixer',
                description: 'Join us for an evening of networking and connections. Meet fellow entrepreneurs, investors, and business leaders in a relaxed setting.',
                event_date: upcoming2Str,
                event_time: '18:00:00',
                date_display: `${upcoming2Display} - 6:00 PM`,
                event_type: 'regular',
                status: 'Upcoming',
                flier_url: null,
                social_links: null
            },
            // 2 Historical Events
            {
                title: 'Startup Showcase',
                description: 'Showcase your startup to potential investors. This event featured presentations from innovative startups seeking funding opportunities.',
                event_date: past1Str,
                event_time: '14:00:00',
                date_display: `${past1Display} - 2:00 PM`,
                event_type: 'regular',
                status: 'Historical',
                flier_url: null,
                social_links: null
            },
            {
                title: 'Entrepreneurship Summit',
                description: 'Annual entrepreneurship summit featuring keynote speakers, panel discussions, and networking opportunities for business leaders.',
                event_date: past2Str,
                event_time: '09:00:00',
                date_display: `${past2Display} - 9:00 AM`,
                event_type: 'regular',
                status: 'Historical',
                flier_url: null,
                social_links: null
            }
        ];

        console.log('Inserting test events...\n');

        for (const event of testEvents) {
            try {
                // Check if event already exists
                const [existing] = await connection.execute(
                    'SELECT id FROM events WHERE LOWER(TRIM(title)) = LOWER(TRIM(?))',
                    [event.title]
                );

                if (existing.length > 0) {
                    console.log(`   ⚠️  Event "${event.title}" already exists, skipping...`);
                    continue;
                }

                const [result] = await connection.execute(
                    `INSERT INTO events (
                        title, description, event_date, event_time, date_display,
                        event_type, status, flier_url, social_links
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        event.title,
                        event.description,
                        event.event_date,
                        event.event_time,
                        event.date_display,
                        event.event_type,
                        event.status,
                        event.flier_url,
                        event.social_links
                    ]
                );

                console.log(`   ✅ Created event: ${event.title}`);
                console.log(`      Status: ${event.status}`);
                console.log(`      Date: ${event.date_display}`);
                console.log(`      ID: ${result.insertId}\n`);
            } catch (error) {
                console.error(`   ❌ Error creating event "${event.title}":`, error.message);
            }
        }

        console.log('✅ Test events insertion completed!\n');
        
        // Show summary
        const [allEvents] = await connection.execute(
            'SELECT id, title, status, event_date FROM events ORDER BY event_date DESC'
        );
        
        console.log('Current events in database:');
        console.log('─'.repeat(60));
        allEvents.forEach(event => {
            console.log(`ID: ${event.id} | ${event.title} | Status: ${event.status} | Date: ${event.event_date || 'N/A'}`);
        });
        console.log('─'.repeat(60));
        console.log(`\nTotal events: ${allEvents.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

insertTestEvents();



