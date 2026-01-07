const mysql = require('mysql2/promise');
const dbConfig = require('./db-config');
const pool = mysql.createPool(dbConfig);

async function updateEventStatuses() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to database\n');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all events with dates
        const [events] = await connection.execute(
            `SELECT id, title, event_date, status 
             FROM events 
             WHERE event_date IS NOT NULL`
        );

        console.log(`Found ${events.length} events with dates\n`);

        let updatedCount = 0;
        let liveNowCount = 0;
        let historicalCount = 0;
        let upcomingCount = 0;

        for (const event of events) {
            const eventDate = new Date(event.event_date);
            eventDate.setHours(0, 0, 0, 0);
            
            const currentStatus = (event.status || '').toLowerCase();
            let newStatus = null;

            // Determine new status based on date
            if (eventDate < today) {
                // Event is in the past
                if (currentStatus !== 'historical') {
                    newStatus = 'Historical';
                }
            } else if (eventDate.getTime() === today.getTime()) {
                // Event is today
                if (currentStatus !== 'live now' && currentStatus !== 'historical') {
                    newStatus = 'Live Now';
                }
            } else {
                // Event is in the future
                if (currentStatus === 'historical') {
                    // Don't change historical events back to upcoming
                    continue;
                }
                if (currentStatus !== 'upcoming' && currentStatus !== 'featured' && currentStatus !== 'live now') {
                    newStatus = 'Upcoming';
                }
            }

            if (newStatus) {
                await connection.execute(
                    'UPDATE events SET status = ? WHERE id = ?',
                    [newStatus, event.id]
                );
                console.log(`✅ Updated "${event.title}" (ID: ${event.id}): ${event.status || 'NULL'} → ${newStatus}`);
                updatedCount++;

                if (newStatus === 'Live Now') liveNowCount++;
                else if (newStatus === 'Historical') historicalCount++;
                else if (newStatus === 'Upcoming') upcomingCount++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   Total events processed: ${events.length}`);
        console.log(`   Events updated: ${updatedCount}`);
        console.log(`   - Set to "Live Now": ${liveNowCount}`);
        console.log(`   - Set to "Historical": ${historicalCount}`);
        console.log(`   - Set to "Upcoming": ${upcomingCount}`);
        console.log(`   Events unchanged: ${events.length - updatedCount}\n`);

        if (updatedCount === 0) {
            console.log('✅ All event statuses are up to date!\n');
        } else {
            console.log('✅ Event statuses updated successfully!\n');
        }

    } catch (error) {
        console.error('❌ Error updating event statuses:', error.message);
        console.error('Error details:', error);
    } finally {
        if (connection) connection.release();
        pool.end();
    }
}

// Run the update
updateEventStatuses();


