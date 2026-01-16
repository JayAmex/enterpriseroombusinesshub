// Insert Test Data into All Directory Tables
// Run with: node insert-directories-test.js

const mysql = require('mysql2/promise');

require('dotenv').config();
const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// ⚠️ WARNING: DEVELOPMENT ONLY - DO NOT RUN IN PRODUCTION
// This script inserts test directory data for development/testing

async function insertDirectories() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');
        console.log('='.repeat(60));
        console.log('⚠️  WARNING: Inserting TEST DATA into directory tables...');
        console.log('   This script is for DEVELOPMENT/TESTING only!');
        console.log('='.repeat(60));
        console.log('');

        // 1. Insert Business Directory Entries
        console.log('1. Inserting Business Directory entries...');
        const businesses = [
            {
                business_name: 'Tech Solutions Ltd',
                address: '123 Innovation Drive, Lagos',
                email: 'info@techsolutions.com',
                phone: '08011111111',
                website: 'https://techsolutions.com'
            },
            {
                business_name: 'Green Energy Corp',
                address: '456 Eco Street, Abuja',
                email: 'contact@greenenergy.com',
                phone: '08022222222',
                website: 'https://greenenergy.com'
            },
            {
                business_name: 'Digital Marketing Agency',
                address: '789 Business Avenue, Port Harcourt',
                email: 'hello@digitalmarketing.com',
                phone: '08033333333',
                website: 'https://digitalmarketing.com'
            }
        ];

        for (const biz of businesses) {
            try {
                const [result] = await connection.execute(
                    `INSERT INTO directory_businesses (
                        business_name, address, email, phone, website
                    ) VALUES (?, ?, ?, ?, ?)`,
                    [biz.business_name, biz.address, biz.email, biz.phone, biz.website]
                );
                console.log(`   ✅ Created: ${biz.business_name} (ID: ${result.insertId})`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`   ⚠️  Skipped: ${biz.business_name} (already exists)`);
                } else {
                    throw error;
                }
            }
        }
        console.log('');

        // 2. Insert Members Directory Entries
        console.log('2. Inserting Members Directory entries...');
        const members = [
            {
                name: 'Dr. Sarah Johnson',
                title: 'CEO & Founder',
                organization: 'Innovation Labs',
                website: 'https://sarahjohnson.com',
                linkedin_url: 'https://linkedin.com/in/sarahjohnson',
                twitter_url: 'https://twitter.com/sarahjohnson',
                avatar_url: 'https://example.com/avatars/sarah.jpg'
            },
            {
                name: 'Michael Chen',
                title: 'Chief Technology Officer',
                organization: 'Tech Ventures Inc',
                website: 'https://michaelchen.com',
                linkedin_url: 'https://linkedin.com/in/michaelchen',
                twitter_url: 'https://twitter.com/michaelchen',
                avatar_url: 'https://example.com/avatars/michael.jpg'
            },
            {
                name: 'Amina Okafor',
                title: 'Investment Director',
                organization: 'Venture Capital Partners',
                website: 'https://aminaokafor.com',
                linkedin_url: 'https://linkedin.com/in/aminaokafor',
                twitter_url: 'https://twitter.com/aminaokafor',
                avatar_url: 'https://example.com/avatars/amina.jpg'
            },
            {
                name: 'David Thompson',
                title: 'Business Strategist',
                organization: 'Strategic Growth Advisors',
                website: 'https://davidthompson.com',
                linkedin_url: 'https://linkedin.com/in/davidthompson',
                twitter_url: 'https://twitter.com/davidthompson',
                avatar_url: 'https://example.com/avatars/david.jpg'
            }
        ];

        for (const member of members) {
            try {
                const [result] = await connection.execute(
                    `INSERT INTO directory_members (
                        name, title, organization, website, linkedin_url,
                        twitter_url, avatar_url
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        member.name, member.title, member.organization, member.website,
                        member.linkedin_url, member.twitter_url, member.avatar_url
                    ]
                );
                console.log(`   ✅ Created: ${member.name} (ID: ${result.insertId})`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`   ⚠️  Skipped: ${member.name} (already exists)`);
                } else {
                    throw error;
                }
            }
        }
        console.log('');

        // 3. Insert Partners Directory Entries
        console.log('3. Inserting Partners Directory entries...');
        const partners = [
            {
                address: '100 Partnership Plaza, Lagos',
                email: 'partners@enterpriseroom.com',
                phone: '08044444444',
                website: 'https://partner1.com'
            },
            {
                address: '200 Collaboration Center, Abuja',
                email: 'contact@strategicpartners.com',
                phone: '08055555555',
                website: 'https://strategicpartners.com'
            },
            {
                address: '300 Alliance Building, Port Harcourt',
                email: 'info@businessalliance.com',
                phone: '08066666666',
                website: 'https://businessalliance.com'
            },
            {
                address: '400 Network Hub, Ibadan',
                email: 'hello@networkhub.com',
                phone: '08077777777',
                website: 'https://networkhub.com'
            },
            {
                address: '500 Synergy Tower, Kano',
                email: 'support@synergytower.com',
                phone: '08088888888',
                website: 'https://synergytower.com'
            }
        ];

        for (const partner of partners) {
            try {
                const [result] = await connection.execute(
                    `INSERT INTO directory_partners (
                        address, email, phone, website
                    ) VALUES (?, ?, ?, ?)`,
                    [partner.address, partner.email, partner.phone, partner.website]
                );
                console.log(`   ✅ Created: ${partner.email} (ID: ${result.insertId})`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`   ⚠️  Skipped: ${partner.email} (already exists)`);
                } else {
                    throw error;
                }
            }
        }
        console.log('');

        // 4. Verify all inserts
        console.log('4. Verifying inserted data...\n');
        
        const [businessCount] = await connection.execute('SELECT COUNT(*) as total FROM directory_businesses');
        const [memberCount] = await connection.execute('SELECT COUNT(*) as total FROM directory_members');
        const [partnerCount] = await connection.execute('SELECT COUNT(*) as total FROM directory_partners');

        console.log('📊 Directory Statistics:');
        console.log(`   Business Directory: ${businessCount[0].total} entries`);
        console.log(`   Members Directory: ${memberCount[0].total} entries`);
        console.log(`   Partners Directory: ${partnerCount[0].total} entries`);
        console.log('');

        // Show sample entries
        console.log('📋 Sample Entries:');
        
        const [sampleBusinesses] = await connection.execute('SELECT * FROM directory_businesses ORDER BY id DESC LIMIT 2');
        console.log('\n   Business Directory (latest 2):');
        sampleBusinesses.forEach(b => {
            console.log(`     - ${b.business_name} (${b.email})`);
        });

        const [sampleMembers] = await connection.execute('SELECT * FROM directory_members ORDER BY id DESC LIMIT 2');
        console.log('\n   Members Directory (latest 2):');
        sampleMembers.forEach(m => {
            console.log(`     - ${m.name} - ${m.title} at ${m.organization}`);
        });

        const [samplePartners] = await connection.execute('SELECT * FROM directory_partners ORDER BY id DESC LIMIT 2');
        console.log('\n   Partners Directory (latest 2):');
        samplePartners.forEach(p => {
            console.log(`     - ${p.email} (${p.address})`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('✅ All directory inserts completed successfully!');
        console.log('='.repeat(60));
        console.log('\n💡 You can now test the API endpoints:');
        console.log('   - GET http://localhost:3000/api/directories/business');
        console.log('   - GET http://localhost:3000/api/directories/members');
        console.log('   - GET http://localhost:3000/api/directories/partners');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('   Code:', error.code);
        if (error.code === 'ER_DUP_ENTRY') {
            console.error('   ⚠️  Some entries may already exist. This is okay.');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

insertDirectories();




