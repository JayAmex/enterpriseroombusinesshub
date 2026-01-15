// Test Personal Information Update API
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

async function testPersonalInfoUpdate() {
    console.log('🔍 Testing Personal Information Update API\n');
    console.log('='.repeat(60));
    
    // Step 1: Login
    console.log('\n📋 Step 1: Logging in');
    console.log('-'.repeat(60));
    
    const userEmail = process.env.TEST_USER_EMAIL || 'test@enterprisehub.com';
    const userPassword = process.env.TEST_USER_PASSWORD || 'test1234'; // Updated password
    
    try {
        const loginResponse = await makeRequest('/api/auth/login', 'POST', {
            email: userEmail,
            password: userPassword
        });
        
        if (loginResponse.status !== 200) {
            console.log('❌ Login failed!');
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful!');
        
        // Step 2: Get current profile
        console.log('\n📋 Step 2: Getting Current Profile');
        console.log('-'.repeat(60));
        
        const profileResponse = await makeRequest('/api/users/profile', 'GET', null, token);
        if (profileResponse.status === 200) {
            console.log('Current profile:');
            console.log('   Name:', profileResponse.data.name);
            console.log('   Title:', profileResponse.data.title || 'Not set');
            console.log('   Occupation:', profileResponse.data.occupation || 'Not set');
            console.log('   State:', profileResponse.data.state || 'Not set');
            console.log('   Country:', profileResponse.data.country || 'Not set');
        }
        
        // Step 3: Update personal info (without name)
        console.log('\n📋 Step 3: Updating Personal Information');
        console.log('-'.repeat(60));
        console.log('   Note: Name is NOT included in update (admin-only)');
        
        const updateResponse = await makeRequest('/api/users/profile', 'PUT', {
            title: 'CEO',
            occupation: 'Business Owner',
            state: 'Lagos',
            country: 'Nigeria'
        }, token);
        
        console.log('   Response status:', updateResponse.status);
        
        if (updateResponse.status === 200) {
            console.log('   ✅ Update successful!');
            console.log('   Updated user:', JSON.stringify(updateResponse.data.user, null, 2));
        } else {
            console.log('   ❌ Update failed');
            console.log('   Response:', JSON.stringify(updateResponse.data, null, 2));
        }
        
        // Step 4: Verify update
        console.log('\n📋 Step 4: Verifying Update');
        console.log('-'.repeat(60));
        
        const verifyResponse = await makeRequest('/api/users/profile', 'GET', null, token);
        if (verifyResponse.status === 200) {
            console.log('Updated profile:');
            console.log('   Name:', verifyResponse.data.name, '(should be unchanged)');
            console.log('   Title:', verifyResponse.data.title);
            console.log('   Occupation:', verifyResponse.data.occupation);
            console.log('   State:', verifyResponse.data.state);
            console.log('   Country:', verifyResponse.data.country);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testPersonalInfoUpdate();
