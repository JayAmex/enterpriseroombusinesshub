const mysql = require('mysql2/promise');
const http = require('http');

const dbConfig = require('./db-config');

require('dotenv').config();
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

async function getAdminToken() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/admin/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { username: process.env.TEST_ADMIN_USERNAME || 'admin', password: process.env.TEST_ADMIN_PASSWORD || 'admin123' });

        if (response.status === 200 && response.data.token) {
            return response.data.token;
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function testAllWithAuth() {
    let connection;
    const results = {};

    try {
        console.log('============================================================');
        console.log('COMPREHENSIVE DATA CONSISTENCY TEST (WITH AUTH)');
        console.log('============================================================\n');

        // Get admin token
        console.log('Getting admin token...');
        const token = await getAdminToken();
        if (!token) {
            console.log('❌ Failed to get admin token\n');
            return;
        }
        console.log('✅ Got admin token\n');

        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // ========== 1. USERS ==========
        console.log('1. TESTING USERS');
        console.log('─'.repeat(60));
        const [dbUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const dbUserCount = dbUsers[0].count;
        console.log(`   Database: ${dbUserCount} users`);

        const usersResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/admin/users',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (usersResponse.status === 200) {
            const apiUserCount = usersResponse.data.users?.length || 0;
            console.log(`   Admin API: ${apiUserCount} users`);
            results.users = { db: dbUserCount, api: apiUserCount, match: dbUserCount === apiUserCount };
            console.log(results.users.match ? '   ✅ Count matches\n' : `   ⚠️  Count mismatch\n`);
        } else {
            console.log(`   ❌ API error: ${usersResponse.status}\n`);
            results.users = { db: dbUserCount, api: 0, match: false };
        }

        // ========== 2. BUSINESSES ==========
        console.log('2. TESTING BUSINESSES');
        console.log('─'.repeat(60));
        const [dbBusinesses] = await connection.execute('SELECT COUNT(*) as count FROM businesses');
        const dbBusinessCount = dbBusinesses[0].count;
        console.log(`   Database: ${dbBusinessCount} businesses`);

        const businessesResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/admin/businesses',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (businessesResponse.status === 200) {
            const apiBusinessCount = businessesResponse.data.businesses?.length || 0;
            console.log(`   Admin API: ${apiBusinessCount} businesses`);
            results.businesses = { db: dbBusinessCount, api: apiBusinessCount, match: dbBusinessCount === apiBusinessCount };
            console.log(results.businesses.match ? '   ✅ Count matches\n' : `   ⚠️  Count mismatch\n`);
        } else {
            console.log(`   ❌ API error: ${businessesResponse.status}\n`);
            results.businesses = { db: dbBusinessCount, api: 0, match: false };
        }

        // ========== 3. DIRECTORY BUSINESSES ==========
        console.log('3. TESTING DIRECTORY BUSINESSES');
        console.log('─'.repeat(60));
        const [dbDirBusinesses] = await connection.execute('SELECT COUNT(*) as count FROM directory_businesses');
        const dbDirBusinessCount = dbDirBusinesses[0].count;
        console.log(`   Database: ${dbDirBusinessCount} directory businesses`);

        const dirBusinessResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/directories/business',
            method: 'GET'
        });

        if (dirBusinessResponse.status === 200) {
            const apiDirBusinessCount = dirBusinessResponse.data.businesses?.length || dirBusinessResponse.data.pagination?.total || 0;
            console.log(`   Public API: ${apiDirBusinessCount} directory businesses`);
            results.dirBusinesses = { db: dbDirBusinessCount, api: apiDirBusinessCount, match: dbDirBusinessCount === apiDirBusinessCount };
            console.log(results.dirBusinesses.match ? '   ✅ Count matches\n' : `   ⚠️  Count mismatch\n`);
        } else {
            console.log(`   ❌ API error: ${dirBusinessResponse.status}\n`);
            results.dirBusinesses = { db: dbDirBusinessCount, api: 0, match: false };
        }

        // ========== SUMMARY ==========
        console.log('============================================================');
        console.log('SUMMARY');
        console.log('============================================================\n');

        const allTests = [
            { name: 'Users', result: results.users },
            { name: 'Businesses', result: results.businesses },
            { name: 'Directory Businesses', result: results.dirBusinesses }
        ];

        let passed = 0;
        let failed = 0;

        allTests.forEach(test => {
            if (test.result && test.result.match) {
                console.log(`✅ ${test.name}: ${test.result.db} items - MATCH`);
                passed++;
            } else if (test.result) {
                console.log(`❌ ${test.name}: DB=${test.result.db}, API=${test.result.api} - MISMATCH`);
                failed++;
            }
        });

        console.log(`\n============================================================`);
        console.log(`Results: ${passed} passed, ${failed} failed`);
        console.log(`============================================================`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

testAllWithAuth();




