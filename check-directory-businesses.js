const mysql = require('mysql2/promise');

const dbConfig = require('./db-config');

async function checkDirectoryBusinesses() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        console.log('============================================================');
        console.log('Checking Directory Businesses');
        console.log('============================================================\n');

        const [dbBusinesses] = await connection.execute('SELECT * FROM directory_businesses ORDER BY id');
        
        console.log(`📊 Total in database: ${dbBusinesses.length}\n`);
        
        if (dbBusinesses.length > 0) {
            console.log('Directory Businesses:');
            dbBusinesses.forEach((biz, idx) => {
                console.log(`\n${idx + 1}. ID: ${biz.id}`);
                console.log(`   Business Name: ${biz.business_name || 'N/A'}`);
                console.log(`   Email: ${biz.email || 'N/A'}`);
                console.log(`   Status: ${biz.status || 'N/A'}`);
                console.log(`   Listed Date: ${biz.listed_date || 'N/A'}`);
            });
        }

        // Check if there are businesses that should be in directory
        const [approvedBusinesses] = await connection.execute(`
            SELECT b.id, b.business_name, b.status 
            FROM businesses b 
            WHERE b.status IN ('Approved', 'Verified Business')
            AND NOT EXISTS (
                SELECT 1 FROM directory_businesses db WHERE db.business_id = b.id
            )
        `);

        if (approvedBusinesses.length > 0) {
            console.log(`\n⚠️  Found ${approvedBusinesses.length} approved businesses NOT in directory:`);
            approvedBusinesses.forEach(biz => {
                console.log(`   - ${biz.business_name} (ID: ${biz.id}, Status: ${biz.status})`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkDirectoryBusinesses();




