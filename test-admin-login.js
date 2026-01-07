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
                    resolve({ status: res.statusCode, data: json, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body, headers: res.headers });
                }
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testAdminLogin() {
    console.log('============================================================');
    console.log('Testing Admin Login Endpoint');
    console.log('============================================================\n');

    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    try {
        const healthResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/health',
            method: 'GET'
        });
        
        if (healthResponse.status === 200) {
            console.log('   ✅ Server is running\n');
        } else {
            console.log(`   ⚠️  Server returned status ${healthResponse.status}\n`);
        }
    } catch (error) {
        console.log(`   ❌ Server is not running or not accessible: ${error.message}\n`);
        console.log('   Please start the server with: node server-extended.js\n');
        return;
    }

    // Test 2: Test admin login
    console.log('2. Testing admin login endpoint...');
    try {
        const loginResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/admin/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            username: process.env.TEST_ADMIN_USERNAME || 'admin',
            password: process.env.TEST_ADMIN_PASSWORD || 'admin123'
        });

        if (loginResponse.status === 200 && loginResponse.data.token) {
            console.log('   ✅ Login successful!');
            console.log(`   Token received: ${loginResponse.data.token.substring(0, 20)}...`);
            console.log(`   Admin ID: ${loginResponse.data.admin?.id}`);
            console.log(`   Admin Username: ${loginResponse.data.admin?.username}\n`);
        } else {
            console.log(`   ❌ Login failed - Status: ${loginResponse.status}`);
            console.log(`   Error: ${JSON.stringify(loginResponse.data)}\n`);
        }
    } catch (error) {
        console.log(`   ❌ Error testing login: ${error.message}\n`);
    }

    console.log('============================================================');
    console.log('✅ Test completed');
    console.log('============================================================');
}

testAdminLogin();




