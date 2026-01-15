// Test Admin API with Authentication
require('dotenv').config();
const http = require('http');

function makeRequest(path, method = 'GET', data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
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

async function testAdminAPI() {
    console.log('🔍 Testing Admin API Authentication\n');
    console.log('='.repeat(60));
    
    // Step 1: Login as admin
    console.log('\n📋 Step 1: Logging in as admin');
    console.log('-'.repeat(60));
    
    const adminUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    
    try {
        const loginResponse = await makeRequest('/api/auth/admin/login', 'POST', {
            username: adminUsername,
            password: adminPassword
        });
        
        console.log('Login response status:', loginResponse.status);
        
        if (loginResponse.status !== 200) {
            console.log('❌ Login failed!');
            console.log('   Response:', JSON.stringify(loginResponse.data, null, 2));
            console.log('\n💡 Check:');
            console.log('   1. Admin user exists in database');
            console.log('   2. Password is correct');
            console.log('   3. Run: node check-admin-users.js');
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful!');
        console.log('   Token:', token.substring(0, 30) + '...');
        
        // Step 2: Test dashboard stats endpoint
        console.log('\n📋 Step 2: Testing Dashboard Stats Endpoint');
        console.log('-'.repeat(60));
        
        const statsResponse = await makeRequest('/api/admin/dashboard/stats', 'GET', null, token);
        
        console.log('Stats response status:', statsResponse.status);
        
        if (statsResponse.status === 200) {
            console.log('✅ Dashboard stats API working!');
            console.log('   Response:', JSON.stringify(statsResponse.data, null, 2));
        } else if (statsResponse.status === 401) {
            console.log('❌ Unauthorized - token might be invalid');
            console.log('   Response:', JSON.stringify(statsResponse.data, null, 2));
        } else {
            console.log('❌ API error');
            console.log('   Response:', JSON.stringify(statsResponse.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAdminAPI();
