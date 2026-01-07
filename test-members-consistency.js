const mysql = require('mysql2/promise');
const http = require('http');

const dbConfig = require('./db-config');

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const json = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testConsistency() {
    let connection;
    try {
        console.log('============================================================');
        console.log('Testing Database vs API Consistency for Members');
        console.log('============================================================\n');

        // 1. Test Database
        console.log('1. Testing Database...');
        connection = await mysql.createConnection(dbConfig);
        const [dbMembers] = await connection.execute('SELECT * FROM directory_members ORDER BY id');
        console.log(`   ✅ Database has ${dbMembers.length} members\n`);

        // 2. Test Public API
        console.log('2. Testing Public API (/api/directories/members)...');
        const publicResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/directories/members',
            method: 'GET'
        });

        if (publicResponse.status === 200) {
            const apiMembers = publicResponse.data.members || [];
            console.log(`   ✅ Public API returned ${apiMembers.length} members`);
            
            // Compare counts
            if (dbMembers.length === apiMembers.length) {
                console.log('   ✅ Count matches between database and public API\n');
            } else {
                console.log(`   ⚠️  Count mismatch: DB has ${dbMembers.length}, API has ${apiMembers.length}\n`);
            }

            // Compare data
            console.log('3. Comparing data consistency...');
            let mismatches = 0;
            dbMembers.forEach((dbMember, idx) => {
                const apiMember = apiMembers.find(m => m.id === dbMember.id);
                if (!apiMember) {
                    console.log(`   ⚠️  Member ID ${dbMember.id} (${dbMember.name}) not found in API response`);
                    mismatches++;
                } else {
                    // Check key fields
                    if (dbMember.name !== apiMember.name) {
                        console.log(`   ⚠️  Name mismatch for ID ${dbMember.id}: DB="${dbMember.name}", API="${apiMember.name}"`);
                        mismatches++;
                    }
                    if (dbMember.title !== apiMember.title) {
                        console.log(`   ⚠️  Title mismatch for ID ${dbMember.id}: DB="${dbMember.title}", API="${apiMember.title}"`);
                        mismatches++;
                    }
                }
            });

            if (mismatches === 0) {
                console.log('   ✅ All data matches between database and public API\n');
            } else {
                console.log(`   ⚠️  Found ${mismatches} mismatches\n`);
            }
        } else {
            console.log(`   ❌ Public API returned status ${publicResponse.status}`);
            console.log(`   Error: ${JSON.stringify(publicResponse.data)}\n`);
        }

        // 3. Test Admin API (if token provided)
        const adminToken = process.env.ADMIN_TOKEN;
        if (adminToken && adminToken !== 'YOUR_ADMIN_TOKEN_HERE') {
            console.log('4. Testing Admin API (/api/admin/directories/members)...');
            const adminResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/admin/directories/members',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (adminResponse.status === 200) {
                const adminMembers = adminResponse.data.entries || [];
                console.log(`   ✅ Admin API returned ${adminMembers.length} members`);
                
                if (dbMembers.length === adminMembers.length) {
                    console.log('   ✅ Count matches between database and admin API\n');
                } else {
                    console.log(`   ⚠️  Count mismatch: DB has ${dbMembers.length}, Admin API has ${adminMembers.length}\n`);
                }
            } else if (adminResponse.status === 401) {
                console.log('   ⚠️  Unauthorized - invalid or expired token\n');
            } else {
                console.log(`   ❌ Admin API returned status ${adminResponse.status}\n`);
            }
        } else {
            console.log('4. Skipping Admin API test (no token provided)');
            console.log('   To test: Set ADMIN_TOKEN environment variable\n');
        }

        // Summary
        console.log('============================================================');
        console.log('Summary:');
        console.log(`   Database Members: ${dbMembers.length}`);
        console.log('============================================================');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

testConsistency();




