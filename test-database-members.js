const mysql = require('mysql2/promise');

const dbConfig = require('./db-config');

async function testDatabaseMembers() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        console.log('============================================================');
        console.log('Testing directory_members table...');
        console.log('============================================================\n');

        // Get all members
        const [members] = await connection.execute('SELECT * FROM directory_members ORDER BY id');
        
        console.log(`📊 Total members in database: ${members.length}\n`);
        
        if (members.length > 0) {
            console.log('Member Details:');
            console.log('─'.repeat(80));
            members.forEach((member, index) => {
                console.log(`\n${index + 1}. ID: ${member.id}`);
                console.log(`   Name: ${member.name || 'N/A'}`);
                console.log(`   Title: ${member.title || 'N/A'}`);
                console.log(`   Organization: ${member.organization || 'N/A'}`);
                console.log(`   Website: ${member.website || 'N/A'}`);
                console.log(`   LinkedIn: ${member.linkedin_url || 'N/A'}`);
                console.log(`   Twitter: ${member.twitter_url || 'N/A'}`);
                console.log(`   Added Date: ${member.added_date || 'N/A'}`);
            });
        } else {
            console.log('⚠️  No members found in database!');
        }

        // Check for duplicates
        const [duplicates] = await connection.execute(`
            SELECT name, title, organization, COUNT(*) as count 
            FROM directory_members 
            GROUP BY name, title, organization 
            HAVING count > 1
        `);
        
        if (duplicates.length > 0) {
            console.log('\n⚠️  Duplicate entries found:');
            duplicates.forEach(dup => {
                console.log(`   - ${dup.name} (${dup.count} entries)`);
            });
        }

        console.log('\n============================================================');
        console.log('✅ Database test completed');
        console.log('============================================================');

    } catch (error) {
        console.error('❌ Error testing database:', error);
    } finally {
        if (connection) await connection.end();
    }
}

testDatabaseMembers();




