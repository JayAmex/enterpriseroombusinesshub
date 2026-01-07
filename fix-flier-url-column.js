/**
 * Fix flier_url column size in events table
 * Changes TEXT to MEDIUMTEXT to accommodate base64-encoded images
 */

const mysql = require('mysql2/promise');

const dbConfig = require('./db-config');

async function fixFlierUrlColumn() {
    let connection;
    
    try {
        // Create connection
        connection = await mysql.createConnection(dbConfig);

        console.log('Connected to database');
        console.log('Altering flier_url column from TEXT to MEDIUMTEXT...');

        // Alter the column to MEDIUMTEXT (can store up to 16MB)
        await connection.execute(`
            ALTER TABLE events 
            MODIFY COLUMN flier_url MEDIUMTEXT
        `);

        console.log('✅ Successfully updated flier_url column to MEDIUMTEXT');
        console.log('   The column can now store up to 16MB of data (sufficient for base64-encoded images)');

    } catch (error) {
        console.error('❌ Error fixing flier_url column:', error.message);
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('   Column already exists with correct type');
        } else {
            throw error;
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run the migration
fixFlierUrlColumn()
    .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });

