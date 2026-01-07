const mysql = require('mysql2/promise');

const dbConfig = require('./db-config');

async function checkSchema() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // Check directory_businesses table structure
        const [columns] = await connection.execute('DESCRIBE directory_businesses');
        console.log('directory_businesses table columns:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });

        // Try a simple query
        console.log('\nTesting simple query...');
        const [test] = await connection.execute('SELECT * FROM directory_businesses LIMIT 1');
        console.log('✅ Query successful');
        if (test.length > 0) {
            console.log('Sample row:', Object.keys(test[0]));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Code:', error.code);
    } finally {
        if (connection) await connection.end();
    }
}

checkSchema();




