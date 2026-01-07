// Test API with logged-in user credentials
const http = require('http');

require('dotenv').config();
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
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
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

async function testWithUser() {
    console.log('🧪 Testing API with test@enterprisehub.com...\n');
    console.log('='.repeat(60));

    try {
        // Step 1: Login
        console.log('1. Logging in as test@enterprisehub.com...');
        console.log('   (You need to provide the password)');
        console.log('   Attempting login...\n');
        
        // Login with provided credentials
        const loginResponse = await makeRequest('/api/auth/login', 'POST', {
            email: process.env.TEST_USER_EMAIL || 'test@enterprisehub.com',
            password: process.env.TEST_USER_PASSWORD || 'test123'
        });

        if (loginResponse.status !== 200) {
            console.log(`   ❌ Login failed: ${loginResponse.status}`);
            console.log(`   Error: ${loginResponse.data.message || JSON.stringify(loginResponse.data)}`);
            return;
        }

        const token = loginResponse.data.token;
        const userId = loginResponse.data.user.id;
        console.log(`   ✅ Login successful!`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Email: ${loginResponse.data.user.email}`);
        console.log(`   Token: ${token.substring(0, 30)}...\n`);

        // Step 2: Test Events
        console.log('2. Testing /api/events...');
        const events = await makeRequest('/api/events');
        console.log(`   Status: ${events.status} ${events.status === 200 ? '✅' : '❌'}`);
        if (events.status === 200) {
            console.log(`   Events found: ${events.data.events?.length || 0}`);
            if (events.data.events?.length > 0) {
                console.log(`   First event: ${events.data.events[0].title}`);
            }
        } else {
            console.log(`   Error: ${events.data.message || JSON.stringify(events.data)}`);
        }
        console.log('');

        // Step 3: Test Pitch Events
        console.log('3. Testing /api/events/pitch...');
        const pitchEvents = await makeRequest('/api/events/pitch');
        console.log(`   Status: ${pitchEvents.status} ${pitchEvents.status === 200 ? '✅' : '❌'}`);
        if (pitchEvents.status === 200) {
            console.log(`   Pitch events: ${pitchEvents.data.events?.length || 0}`);
        }
        console.log('');

        // Step 4: Test Directories
        console.log('4. Testing /api/directories/business...');
        const businessDir = await makeRequest('/api/directories/business');
        console.log(`   Status: ${businessDir.status} ${businessDir.status === 200 ? '✅' : '❌'}`);
        if (businessDir.status === 200) {
            console.log(`   Businesses: ${businessDir.data.businesses?.length || 0}`);
        }
        console.log('');

        console.log('5. Testing /api/directories/members...');
        const membersDir = await makeRequest('/api/directories/members');
        console.log(`   Status: ${membersDir.status} ${membersDir.status === 200 ? '✅' : '❌'}`);
        if (membersDir.status === 200) {
            console.log(`   Members: ${membersDir.data.members?.length || 0}`);
        }
        console.log('');

        console.log('6. Testing /api/directories/partners...');
        const partnersDir = await makeRequest('/api/directories/partners');
        console.log(`   Status: ${partnersDir.status} ${partnersDir.status === 200 ? '✅' : '❌'}`);
        if (partnersDir.status === 200) {
            console.log(`   Partners: ${partnersDir.data.partners?.length || 0}`);
        }
        console.log('');

        // Step 5: Test Blog
        console.log('7. Testing /api/blog...');
        const blog = await makeRequest('/api/blog');
        console.log(`   Status: ${blog.status} ${blog.status === 200 ? '✅' : '❌'}`);
        if (blog.status === 200) {
            console.log(`   Blog posts: ${blog.data.posts?.length || 0}`);
        }
        console.log('');

        // Step 6: Test User Profile (authenticated)
        console.log('8. Testing /api/users/profile (authenticated)...');
        const profile = await makeRequest('/api/users/profile', 'GET', null, token);
        console.log(`   Status: ${profile.status} ${profile.status === 200 ? '✅' : '❌'}`);
        if (profile.status === 200) {
            console.log(`   User: ${profile.data.name} (${profile.data.email})`);
            console.log(`   Businesses: ${profile.data.businesses?.length || 0}`);
        }
        console.log('');

        console.log('='.repeat(60));
        console.log('✅ Testing completed!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Server is not running. Start it with: npm start');
        }
    }
}

setTimeout(testWithUser, 2000);

