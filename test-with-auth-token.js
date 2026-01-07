// First, we need to get an admin token
const http = require('http');

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

async function getAdminToken() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/admin/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            username: 'admin',
            password: 'admin123'
        });

        if (response.status === 200 && response.data.token) {
            return response.data.token;
        }
        return null;
    } catch (error) {
        console.error('Error getting admin token:', error.message);
        return null;
    }
}

async function testWithAuth() {
    console.log('Getting admin token...');
    const token = await getAdminToken();
    
    if (!token) {
        console.log('❌ Failed to get admin token');
        return;
    }
    
    console.log('✅ Got admin token\n');
    console.log('Testing Users API...');
    
    const usersResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/users',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    console.log(`Status: ${usersResponse.status}`);
    if (usersResponse.status === 200) {
        console.log(`Users returned: ${usersResponse.data.users?.length || 0}`);
    } else {
        console.log(`Error: ${JSON.stringify(usersResponse.data)}`);
    }
    
    console.log('\nTesting Businesses API...');
    
    const businessesResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/businesses',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    console.log(`Status: ${businessesResponse.status}`);
    if (businessesResponse.status === 200) {
        console.log(`Businesses returned: ${businessesResponse.data.businesses?.length || 0}`);
    } else {
        console.log(`Error: ${JSON.stringify(businessesResponse.data)}`);
    }
}

testWithAuth();




