// Test API Endpoints with Authentication
// Run with: node test-api-with-auth.js

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

async function runTests() {
    console.log('🧪 Testing API Endpoints with Authentication...\n');
    console.log('='.repeat(60));

    try {
        // Step 1: Login as test user
        console.log('1. Logging in as test user...');
        const loginResponse = await makeRequest('/api/auth/login', 'POST', {
            email: 'test@example.com',
            password: 'test123'
        });

        if (loginResponse.status !== 200) {
            console.log(`   ❌ Login failed: ${loginResponse.status}`);
            console.log(`   Response: ${JSON.stringify(loginResponse.data)}`);
            console.log('\n💡 Make sure test data has been inserted. Run: node insert-test-data.js');
            return;
        }

        const token = loginResponse.data.token;
        const userId = loginResponse.data.user.id;
        console.log(`   ✅ Login successful!`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Token: ${token.substring(0, 20)}...\n`);

        // Step 2: Test Events Endpoint
        console.log('2. Testing /api/events...');
        const events = await makeRequest('/api/events');
        console.log(`   Status: ${events.status} ${events.status === 200 ? '✅' : '❌'}`);
        if (events.status === 200) {
            console.log(`   Events found: ${events.data.events?.length || 0}`);
            if (events.data.events?.length > 0) {
                console.log(`   First event: ${events.data.events[0].title}`);
            }
        } else {
            console.log(`   Error: ${events.data.message || events.data}`);
        }
        console.log('');

        // Step 3: Test Pitch Events
        console.log('3. Testing /api/events/pitch...');
        const pitchEvents = await makeRequest('/api/events/pitch');
        console.log(`   Status: ${pitchEvents.status} ${pitchEvents.status === 200 ? '✅' : '❌'}`);
        if (pitchEvents.status === 200) {
            console.log(`   Pitch events found: ${pitchEvents.data.events?.length || 0}`);
            if (pitchEvents.data.events?.length > 0) {
                console.log(`   First pitch event: ${pitchEvents.data.events[0].title}`);
            }
        }
        console.log('');

        // Step 4: Test RSVP to Event
        if (events.status === 200 && events.data.events?.length > 0) {
            const eventId = events.data.events[0].id;
            console.log(`4. Testing RSVP to event (ID: ${eventId})...`);
            const rsvp = await makeRequest(`/api/events/${eventId}/rsvp`, 'POST', null, token);
            console.log(`   Status: ${rsvp.status} ${rsvp.status === 200 || rsvp.status === 201 ? '✅' : '❌'}`);
            if (rsvp.status === 200 || rsvp.status === 201) {
                console.log(`   ✅ RSVP successful!`);
            } else {
                console.log(`   Response: ${rsvp.data.message || rsvp.data}`);
            }
            console.log('');

            // Check RSVP Status
            console.log(`5. Checking RSVP status...`);
            const rsvpStatus = await makeRequest(`/api/events/${eventId}/rsvp`, 'GET', null, token);
            console.log(`   Status: ${rsvpStatus.status} ${rsvpStatus.status === 200 ? '✅' : '❌'}`);
            if (rsvpStatus.status === 200) {
                console.log(`   RSVP Status: ${rsvpStatus.data.is_rsvped ? 'RSVPed ✅' : 'Not RSVPed'}`);
            }
            console.log('');
        }

        // Step 6: Test Directories
        console.log('6. Testing /api/directories/business...');
        const businessDir = await makeRequest('/api/directories/business');
        console.log(`   Status: ${businessDir.status} ${businessDir.status === 200 ? '✅' : '❌'}`);
        if (businessDir.status === 200) {
            console.log(`   Businesses found: ${businessDir.data.businesses?.length || 0}`);
        }
        console.log('');

        console.log('7. Testing /api/directories/members...');
        const membersDir = await makeRequest('/api/directories/members');
        console.log(`   Status: ${membersDir.status} ${membersDir.status === 200 ? '✅' : '❌'}`);
        if (membersDir.status === 200) {
            console.log(`   Members found: ${membersDir.data.members?.length || 0}`);
        }
        console.log('');

        console.log('8. Testing /api/directories/partners...');
        const partnersDir = await makeRequest('/api/directories/partners');
        console.log(`   Status: ${partnersDir.status} ${partnersDir.status === 200 ? '✅' : '❌'}`);
        if (partnersDir.status === 200) {
            console.log(`   Partners found: ${partnersDir.data.partners?.length || 0}`);
        }
        console.log('');

        // Step 7: Test Blog
        console.log('9. Testing /api/blog...');
        const blog = await makeRequest('/api/blog');
        console.log(`   Status: ${blog.status} ${blog.status === 200 ? '✅' : '❌'}`);
        if (blog.status === 200) {
            console.log(`   Blog posts found: ${blog.data.posts?.length || 0}`);
            if (blog.data.posts?.length > 0) {
                console.log(`   First post: ${blog.data.posts[0].title}`);
            }
        }
        console.log('');

        // Step 8: Test Tools
        console.log('10. Testing /api/tools/settings...');
        const tools = await makeRequest('/api/tools/settings');
        console.log(`   Status: ${tools.status} ${tools.status === 200 ? '✅' : '❌'}`);
        if (tools.status === 200) {
            console.log(`   Exchange rates: USD=${tools.data.exchange_rates?.usd}, GBP=${tools.data.exchange_rates?.gbp}`);
        }
        console.log('');

        console.log('11. Testing /api/tools/custom...');
        const customTools = await makeRequest('/api/tools/custom');
        console.log(`   Status: ${customTools.status} ${customTools.status === 200 ? '✅' : '❌'}`);
        if (customTools.status === 200) {
            console.log(`   Custom tools found: ${customTools.data.tools?.length || 0}`);
        }
        console.log('');

        // Step 9: Test User Profile
        console.log('12. Testing /api/users/profile (authenticated)...');
        const profile = await makeRequest('/api/users/profile', 'GET', null, token);
        console.log(`   Status: ${profile.status} ${profile.status === 200 ? '✅' : '❌'}`);
        if (profile.status === 200) {
            console.log(`   User: ${profile.data.name} (${profile.data.email})`);
            console.log(`   Businesses: ${profile.data.businesses?.length || 0}`);
        }
        console.log('');

        // Step 10: Test User's Businesses
        console.log('13. Testing /api/users/businesses (authenticated)...');
        const userBusinesses = await makeRequest('/api/users/businesses', 'GET', null, token);
        console.log(`   Status: ${userBusinesses.status} ${userBusinesses.status === 200 ? '✅' : '❌'}`);
        if (userBusinesses.status === 200) {
            console.log(`   User businesses: ${userBusinesses.data.businesses?.length || 0}`);
            if (userBusinesses.data.businesses?.length > 0) {
                console.log(`   First business: ${userBusinesses.data.businesses[0].business_name}`);
            }
        }
        console.log('');

        console.log('='.repeat(60));
        console.log('✅ All authenticated API tests completed!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Server is not running. Start it with: npm start');
        }
    }
}

// Wait a bit for server to start, then run tests
setTimeout(runTests, 2000);




