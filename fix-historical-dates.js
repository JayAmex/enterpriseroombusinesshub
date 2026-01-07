// Fix historical event dates
const mysql = require('mysql2/promise');

require('dotenv').config();
const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function fixDates() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        const today = new Date();
        const past1 = new Date(today);
        past1.setDate(today.getDate() - 30);
        const past1Str = past1.toISOString().split('T')[0];
        const past1Display = past1.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const past2 = new Date(today);
        past2.setDate(today.getDate() - 60);
        const past2Str = past2.toISOString().split('T')[0];
        const past2Display = past2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const updates = [
            {
                title: 'Startup Showcase',
                event_date: past1Str,
                date_display: `${past1Display} - 2:00 PM`,
                event_time: '14:00:00'
            },
            {
                title: 'Entrepreneurship Summit',
                event_date: past2Str,
                date_display: `${past2Display} - 9:00 AM`,
                event_time: '09:00:00'
            }
        ];

        for (const update of updates) {
            const [result] = await connection.execute(
                `UPDATE events 
                 SET event_date = ?, date_display = ?, event_time = ?
                 WHERE LOWER(TRIM(title)) = LOWER(TRIM(?))`,
                [update.event_date, update.date_display, update.event_time, update.title]
            );
            console.log(`✅ Updated ${update.title} with date: ${update.date_display}`);
        }

        console.log('\n✅ All historical events now have dates!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) connection.end();
    }
}

fixDates();



