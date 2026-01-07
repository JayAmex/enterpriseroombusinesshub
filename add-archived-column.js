const mysql = require('mysql2/promise');
const dbConfig = require('./db-config');

const pool = mysql.createPool(dbConfig);

async function addArchivedColumn() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to database\n');

        console.log('Adding is_archived column to events table...');
        const alterTableQuery = `
            ALTER TABLE events 
            ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
            ADD INDEX IF NOT EXISTS idx_is_archived (is_archived)
        `;
        
        // MySQL doesn't support IF NOT EXISTS for ADD COLUMN, so we'll use a different approach
        try {
            await connection.execute(
                'ALTER TABLE events ADD COLUMN is_archived BOOLEAN DEFAULT FALSE'
            );
            console.log('✅ Added is_archived column\n');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Column is_archived already exists\n');
            } else {
                throw error;
            }
        }

        try {
            await connection.execute(
                'CREATE INDEX idx_is_archived ON events(is_archived)'
            );
            console.log('✅ Added index on is_archived\n');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️  Index idx_is_archived already exists\n');
            } else {
                throw error;
            }
        }

        console.log('✅ Database schema updated successfully!\n');

    } catch (error) {
        console.error('❌ Error updating database schema:', error.message);
        console.error('Error details:', error);
    } finally {
        if (connection) connection.release();
        pool.end();
    }
}

// Run the update
addArchivedColumn();


