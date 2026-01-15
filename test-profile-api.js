// Test Profile API with UUID
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

async function testProfileAPI() {
    console.log('🔍 Testing Profile API with UUID\n');
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
        console.log('   User:', loginResponse.data.user.name, `(${loginResponse.data.user.email})`);
        
        // Step 2: Test profile endpoint
        console.log('\n📋 Step 2: Testing Profile Endpoint');
        console.log('-'.repeat(60));
        
        const profileResponse = await makeRequest('/api/users/profile', 'GET', null, token);
        
        console.log('Profile response status:', profileResponse.status);
        
        if (profileResponse.status === 200) {
            console.log('✅ Profile API working!');
            console.log('   User ID:', profileResponse.data.id);
            console.log('   UUID:', profileResponse.data.uuid || '❌ MISSING!');
            console.log('   Name:', profileResponse.data.name);
            console.log('   Email:', profileResponse.data.email);
            console.log('   Phone:', profileResponse.data.phone || 'Not provided');
            console.log('   Businesses:', profileResponse.data.businesses?.length || 0);
            
            if (!profileResponse.data.uuid) {
                console.log('\n⚠️  WARNING: UUID is missing from API response!');
            } else {
                console.log('\n✅ UUID is present in API response!');
            }
        } else {
            console.log('❌ API error');
            console.log('   Response:', JSON.stringify(profileResponse.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testProfileAPI();
