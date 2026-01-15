// Add personal information columns to users table
require('dotenv').config();
const mysql = require('mysql2/promise');
const dbConfig = require('./db-config');

async function addPersonalInfoColumns() {
    let connection;
    
    try {
        console.log('🔧 Adding personal information columns to users table...\n');
        connection = await mysql.createConnection(dbConfig);
        
        // Check which columns exist
        const [columns] = await connection.execute('DESCRIBE users');
        const existingColumns = columns.map(col => col.Field.toLowerCase());
        
        console.log('📋 Current columns:', existingColumns.join(', '));
        console.log('');
        
        // Add columns if they don't exist
        const columnsToAdd = [
            { name: 'title', type: 'VARCHAR(255) DEFAULT NULL', description: 'Title/Designation' },
            { name: 'occupation', type: 'VARCHAR(255) DEFAULT NULL', description: 'Occupation' },
            { name: 'state', type: 'VARCHAR(100) DEFAULT NULL', description: 'State of Residence' },
            { name: 'country', type: 'VARCHAR(100) DEFAULT NULL', description: 'Country of Residence' }
        ];
        
        for (const col of columnsToAdd) {
            if (!existingColumns.includes(col.name.toLowerCase())) {
                try {
                    await connection.execute(
                        `ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`
                    );
                    console.log(`✅ Added column: ${col.name} (${col.description})`);
                } catch (error) {
                    if (error.code === 'ER_DUP_FIELDNAME') {
                        console.log(`⚠️  Column ${col.name} already exists, skipping...`);
                    } else {
                        throw error;
                    }
                }
            } else {
                console.log(`ℹ️  Column ${col.name} already exists, skipping...`);
            }
        }
        
        console.log('\n✅ Personal information columns added successfully!');
        
        // Show updated structure
        const [updatedColumns] = await connection.execute('DESCRIBE users');
        console.log('\n📋 Updated users table structure:');
        updatedColumns.forEach(col => {
            if (['title', 'occupation', 'state', 'country'].includes(col.Field.toLowerCase())) {
                console.log(`   - ${col.Field} (${col.Type})`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.error('\n💡 Some columns may already exist. Check the output above.');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addPersonalInfoColumns();
