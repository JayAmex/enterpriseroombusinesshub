const http = require('http');

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
                    resolve({ status: res.statusCode, data: body, raw: body });
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

async function testEndpoints() {
    // Get admin token
    console.log('Getting admin token...');
    const loginResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/admin/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { username: process.env.TEST_ADMIN_USERNAME || 'admin', password: process.env.TEST_ADMIN_PASSWORD || 'admin123' });

    if (loginResponse.status !== 200 || !loginResponse.data.token) {
        console.log('❌ Failed to get admin token');
        return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Got admin token\n');

    // Test Users endpoint
    console.log('Testing /api/admin/users...');
    const usersResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/users',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`Status: ${usersResponse.status}`);
    if (usersResponse.status !== 200) {
        console.log('Error:', JSON.stringify(usersResponse.data, null, 2));
    } else {
        console.log(`✅ Users returned: ${usersResponse.data.users?.length || 0}`);
    }

    // Test Directory Businesses endpoint
    console.log('\nTesting /api/directories/business...');
    const dirBizResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/directories/business',
        method: 'GET'
    });
    console.log(`Status: ${dirBizResponse.status}`);
    if (dirBizResponse.status !== 200) {
        console.log('Error:', JSON.stringify(dirBizResponse.data, null, 2));
        if (dirBizResponse.raw) {
            console.log('Raw response:', dirBizResponse.raw.substring(0, 200));
        }
    } else {
        console.log(`✅ Directory businesses returned: ${dirBizResponse.data.businesses?.length || dirBizResponse.data.pagination?.total || 0}`);
    }

    // Test Dashboard Stats
    console.log('\nTesting /api/admin/dashboard/stats...');
    const statsResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/dashboard/stats',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`Status: ${statsResponse.status}`);
    if (statsResponse.status !== 200) {
        console.log('Error:', JSON.stringify(statsResponse.data, null, 2));
    } else {
        console.log('✅ Stats:', JSON.stringify(statsResponse.data, null, 2));
    }
}

testEndpoints();




