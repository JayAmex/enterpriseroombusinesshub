const http = require('http');

async function testAPIMembers() {
    console.log('============================================================');
    console.log('Testing API endpoints for members...');
    console.log('============================================================\n');

    // Test 1: Public API endpoint
    console.log('1. Testing GET /api/directories/members (Public)...');
    try {
        const publicResponse = await fetch('http://localhost:3000/api/directories/members');
        const publicData = await publicResponse.json();
        
        if (publicResponse.ok) {
            console.log(`   ✅ Status: ${publicResponse.status}`);
            console.log(`   📊 Members returned: ${publicData.members?.length || 0}`);
            console.log(`   📄 Total in database: ${publicData.pagination?.total || 0}`);
            
            if (publicData.members && publicData.members.length > 0) {
                console.log('\n   Sample members:');
                publicData.members.slice(0, 3).forEach((member, idx) => {
                    console.log(`      ${idx + 1}. ${member.name} - ${member.title || 'N/A'}`);
                });
            }
        } else {
            console.log(`   ❌ Status: ${publicResponse.status}`);
            console.log(`   Error: ${JSON.stringify(publicData)}`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n2. Testing GET /api/admin/directories/members (Admin - requires auth)...');
    console.log('   ⚠️  This requires admin authentication token');
    console.log('   To test this, you need to:');
    console.log('   1. Log in to admin dashboard');
    console.log('   2. Get the adminToken from sessionStorage');
    console.log('   3. Use it in Authorization header: Bearer <token>');

    console.log('\n============================================================');
    console.log('✅ API test completed');
    console.log('============================================================');
}

// Use fetch if available (Node 18+), otherwise use http
if (typeof fetch !== 'undefined') {
    testAPIMembers();
} else {
    // Fallback for older Node versions
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/directories/members',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log('✅ Public API Response:');
                console.log(`   Status: ${res.statusCode}`);
                console.log(`   Members: ${jsonData.members?.length || 0}`);
                console.log(`   Total: ${jsonData.pagination?.total || 0}`);
            } catch (e) {
                console.log('Response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Error:', error.message);
    });

    req.end();
}




