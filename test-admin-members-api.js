// Test script to verify admin members API endpoints
// This requires an admin token - you'll need to log in first and get the token

const http = require('http');

// You need to replace this with your actual admin token from sessionStorage
// To get it: 1. Log in to admin dashboard, 2. Open browser console, 3. Run: sessionStorage.getItem('adminToken')
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'YOUR_ADMIN_TOKEN_HERE';

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
                    resolve({ status: res.statusCode, data: body });
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

async function testAdminMembersAPI() {
    console.log('============================================================');
    console.log('Testing Admin Members API Endpoints');
    console.log('============================================================\n');

    if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
        console.log('⚠️  Please set ADMIN_TOKEN environment variable or update the script');
        console.log('   To get token: Log in to admin dashboard, then run in console:');
        console.log('   sessionStorage.getItem("adminToken")\n');
        return;
    }

    const baseOptions = {
        hostname: 'localhost',
        port: 3000,
        headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    // Test 1: GET /api/admin/directories/members
    console.log('1. Testing GET /api/admin/directories/members...');
    try {
        const response = await makeRequest({
            ...baseOptions,
            path: '/api/admin/directories/members',
            method: 'GET'
        });

        if (response.status === 200) {
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📊 Members returned: ${response.data.entries?.length || 0}`);
            
            if (response.data.entries && response.data.entries.length > 0) {
                console.log('\n   Sample members:');
                response.data.entries.slice(0, 3).forEach((member, idx) => {
                    console.log(`      ${idx + 1}. ID: ${member.id}, Name: ${member.name}, Title: ${member.title || 'N/A'}`);
                });
            } else {
                console.log('   ⚠️  No members found');
            }
        } else if (response.status === 401) {
            console.log(`   ❌ Status: ${response.status} - Unauthorized (invalid token)`);
        } else {
            console.log(`   ❌ Status: ${response.status}`);
            console.log(`   Error: ${JSON.stringify(response.data)}`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n============================================================');
    console.log('✅ API test completed');
    console.log('============================================================');
    console.log('\nNote: To test PUT and DELETE endpoints, you need to:');
    console.log('1. Get a member ID from the GET request above');
    console.log('2. Use that ID in PUT /api/admin/directories/members/:id');
    console.log('3. Use that ID in DELETE /api/admin/directories/members/:id');
}

testAdminMembersAPI();




