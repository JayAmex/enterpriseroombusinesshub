// Test Password Change API Endpoint
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

async function testPasswordChange() {
    console.log('🔍 Testing Password Change API\n');
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
        console.log('   Email:', loginResponse.data.user.email);
        
        // Step 2: Test password change endpoint
        console.log('\n📋 Step 2: Testing Password Change Endpoint');
        console.log('-'.repeat(60));
        console.log('   Endpoint: PUT /api/users/password');
        console.log('   Current Password:', userPassword);
        console.log('   New Password: test123 (same for testing)');
        console.log('\n   ⚠️  Note: Using same password for testing (should work)');
        
        const passwordChangeResponse = await makeRequest('/api/users/password', 'PUT', {
            currentPassword: userPassword,
            newPassword: userPassword  // Using same password for testing
        }, token);
        
        console.log('\n   Response status:', passwordChangeResponse.status);
        
        if (passwordChangeResponse.status === 200) {
            console.log('   ✅ Password change API working!');
            console.log('   Response:', JSON.stringify(passwordChangeResponse.data, null, 2));
        } else if (passwordChangeResponse.status === 401) {
            console.log('   ❌ Unauthorized - current password incorrect');
            console.log('   Response:', JSON.stringify(passwordChangeResponse.data, null, 2));
        } else if (passwordChangeResponse.status === 400) {
            console.log('   ⚠️  Validation error');
            console.log('   Response:', JSON.stringify(passwordChangeResponse.data, null, 2));
        } else {
            console.log('   ❌ Error');
            console.log('   Response:', JSON.stringify(passwordChangeResponse.data, null, 2));
        }
        
        // Step 3: Test with wrong current password
        console.log('\n📋 Step 3: Testing with Wrong Current Password');
        console.log('-'.repeat(60));
        
        const wrongPasswordResponse = await makeRequest('/api/users/password', 'PUT', {
            currentPassword: 'wrongpassword',
            newPassword: 'newpassword123'
        }, token);
        
        console.log('   Response status:', wrongPasswordResponse.status);
        if (wrongPasswordResponse.status === 401) {
            console.log('   ✅ Correctly rejected wrong password');
            console.log('   Response:', JSON.stringify(wrongPasswordResponse.data, null, 2));
        } else {
            console.log('   ⚠️  Unexpected response');
            console.log('   Response:', JSON.stringify(wrongPasswordResponse.data, null, 2));
        }
        
        // Step 4: Test with short password
        console.log('\n📋 Step 4: Testing with Short Password (Validation)');
        console.log('-'.repeat(60));
        
        const shortPasswordResponse = await makeRequest('/api/users/password', 'PUT', {
            currentPassword: userPassword,
            newPassword: '12345'  // Too short
        }, token);
        
        console.log('   Response status:', shortPasswordResponse.status);
        if (shortPasswordResponse.status === 400) {
            console.log('   ✅ Correctly rejected short password');
            console.log('   Response:', JSON.stringify(shortPasswordResponse.data, null, 2));
        } else {
            console.log('   ⚠️  Unexpected response');
            console.log('   Response:', JSON.stringify(shortPasswordResponse.data, null, 2));
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ Testing completed!');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Server is not running. Start it with: npm run dev');
        }
    }
}

testPasswordChange();
