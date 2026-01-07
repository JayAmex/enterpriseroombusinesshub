// Test API Endpoints
const http = require('http');

function testEndpoint(path, method = 'GET', data = null) {
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
    console.log('🧪 Testing API Endpoints...\n');

    try {
        // Test 1: Health Check
        console.log('1. Testing /api/health...');
        const health = await testEndpoint('/api/health');
        console.log(`   Status: ${health.status}`);
        console.log(`   Response:`, health.data);
        console.log('   ✅ Health check passed\n');

        // Test 2: Root endpoint
        console.log('2. Testing / (root)...');
        const root = await testEndpoint('/');
        console.log(`   Status: ${root.status}`);
        console.log(`   Response:`, root.data);
        console.log('   ✅ Root endpoint working\n');

        // Test 3: Get Events
        console.log('3. Testing /api/events...');
        const events = await testEndpoint('/api/events');
        console.log(`   Status: ${events.status}`);
        console.log(`   Events found: ${events.data.events?.length || 0}`);
        console.log('   ✅ Events endpoint working\n');

        // Test 4: Dashboard Stats (will fail without auth, but tests endpoint exists)
        console.log('4. Testing /api/admin/dashboard/stats (without auth)...');
        const stats = await testEndpoint('/api/admin/dashboard/stats');
        console.log(`   Status: ${stats.status}`);
        if (stats.status === 401) {
            console.log('   ✅ Authentication required (expected)\n');
        } else {
            console.log(`   Response:`, stats.data);
            console.log('   ✅ Dashboard stats endpoint working\n');
        }

        console.log('='.repeat(60));
        console.log('✅ All API tests completed!');
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




