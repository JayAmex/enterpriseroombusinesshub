// Update existing events to ensure proper test data
// Run with: node update-test-events.js

const mysql = require('mysql2/promise');

const dbConfig = require('./db-config');
const pool = mysql.createPool(dbConfig);

async function updateTestEvents() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to database\n');

        const today = new Date();
        const upcoming1 = new Date(today);
        upcoming1.setDate(today.getDate() + 7);
        const upcoming1Str = upcoming1.toISOString().split('T')[0];
        const upcoming1Display = upcoming1.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const upcoming2 = new Date(today);
        upcoming2.setDate(today.getDate() + 14);
        const upcoming2Str = upcoming2.toISOString().split('T')[0];
        const upcoming2Display = upcoming2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        // Update events to ensure we have the right mix
        const updates = [
            {
                title: 'Business Workshop',
                status: 'Upcoming',
                event_date: upcoming1Str,
                date_display: `${upcoming1Display} - 10:00 AM`,
                event_time: '10:00:00'
            },
            {
                title: 'Networking Mixer',
                status: 'Upcoming',
                event_date: upcoming2Str,
                date_display: `${upcoming2Display} - 6:00 PM`,
                event_time: '18:00:00'
            },
            {
                title: 'Startup Showcase',
                status: 'Historical',
                event_date: null,
                date_display: null,
                event_time: null
            },
            {
                title: 'Entrepreneurship Summit',
                status: 'Historical',
                event_date: null,
                date_display: null,
                event_time: null
            }
        ];

        console.log('Updating events...\n');

        for (const update of updates) {
            try {
                const [result] = await connection.execute(
                    `UPDATE events 
                     SET status = ?, 
                         event_date = ?, 
                         date_display = ?, 
                         event_time = ?
                     WHERE LOWER(TRIM(title)) = LOWER(TRIM(?))`,
                    [
                        update.status,
                        update.event_date,
                        update.date_display,
                        update.event_time,
                        update.title
                    ]
                );

                if (result.affectedRows > 0) {
                    console.log(`   ✅ Updated: ${update.title} → Status: ${update.status}`);
                } else {
                    console.log(`   ⚠️  Event "${update.title}" not found`);
                }
            } catch (error) {
                console.error(`   ❌ Error updating "${update.title}":`, error.message);
            }
        }

        console.log('\n✅ Updates completed!\n');
        
        // Show summary of regular events only
        const [allEvents] = await connection.execute(
            `SELECT id, title, status, event_date, date_display, event_type 
             FROM events 
             WHERE event_type = 'regular' 
             ORDER BY 
                 CASE status 
                     WHEN 'Live Now' THEN 1 
                     WHEN 'Upcoming' THEN 2 
                     WHEN 'Featured' THEN 3 
                     WHEN 'Historical' THEN 4 
                     ELSE 5 
                 END,
                 event_date DESC`
        );
        
        console.log('Regular events (for events page):');
        console.log('─'.repeat(80));
        const liveEvents = allEvents.filter(e => e.status === 'Live Now');
        const upcomingEvents = allEvents.filter(e => e.status === 'Upcoming');
        const historicalEvents = allEvents.filter(e => e.status === 'Historical');
        
        console.log(`\n📺 Live Events (${liveEvents.length}):`);
        liveEvents.forEach(event => {
            console.log(`   • ${event.title} | Date: ${event.date_display || event.event_date || 'N/A'}`);
        });
        
        console.log(`\n📅 Upcoming Events (${upcomingEvents.length}):`);
        upcomingEvents.forEach(event => {
            console.log(`   • ${event.title} | Date: ${event.date_display || event.event_date || 'N/A'}`);
        });
        
        console.log(`\n📚 Historical Events (${historicalEvents.length}):`);
        historicalEvents.forEach(event => {
            console.log(`   • ${event.title} | Date: ${event.date_display || event.event_date || 'N/A'}`);
        });
        
        console.log('\n─'.repeat(80));
        console.log(`\nTotal regular events: ${allEvents.length}`);
        console.log(`\n✅ You now have:`);
        console.log(`   • ${liveEvents.length} Live event(s)`);
        console.log(`   • ${upcomingEvents.length} Upcoming event(s)`);
        console.log(`   • ${historicalEvents.length} Historical event(s)`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

updateTestEvents();



