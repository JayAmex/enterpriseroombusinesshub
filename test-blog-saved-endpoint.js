// Test /api/blog/saved endpoint
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

async function testEndpoint() {
    console.log('🔍 Testing /api/blog/saved endpoint\n');
    console.log('='.repeat(60));
    
    // Step 1: Login as user
    console.log('\n📋 Step 1: Logging in as user');
    console.log('-'.repeat(60));
    
    const userEmail = process.env.TEST_USER_EMAIL || 'test@enterprisehub.com';
    const userPassword = process.env.TEST_USER_PASSWORD || 'test123';
    
    try {
        const loginResponse = await makeRequest('/api/auth/login', 'POST', {
            email: userEmail,
            password: userPassword
        });
        
        console.log('Login response status:', loginResponse.status);
        
        if (loginResponse.status !== 200) {
            console.log('❌ Login failed!');
            console.log('   Response:', JSON.stringify(loginResponse.data, null, 2));
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful!');
        console.log('   User:', loginResponse.data.user.name);
        
        // Step 2: Test /api/blog/saved endpoint
        console.log('\n📋 Step 2: Testing /api/blog/saved endpoint');
        console.log('-'.repeat(60));
        
        const savedResponse = await makeRequest('/api/blog/saved', 'GET', null, token);
        
        console.log('Response status:', savedResponse.status);
        
        if (savedResponse.status === 200) {
            console.log('✅ Endpoint working!');
            console.log('   Posts found:', savedResponse.data.posts?.length || 0);
            if (savedResponse.data.posts && savedResponse.data.posts.length > 0) {
                console.log('   First post:', savedResponse.data.posts[0].title);
            }
        } else if (savedResponse.status === 404) {
            console.log('❌ 404 Not Found - Route not matching!');
            console.log('   Response:', JSON.stringify(savedResponse.data, null, 2));
            console.log('\n💡 This means the route ordering fix didn\'t work or server wasn\'t restarted');
        } else {
            console.log('❌ Error');
            console.log('   Response:', JSON.stringify(savedResponse.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Server is not running. Start it with: node server.js');
        }
    }
}

testEndpoint();
