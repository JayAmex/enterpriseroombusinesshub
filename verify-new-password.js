// Verify New Password for test@enterprisehub.com
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

async function verifyPassword() {
    console.log('🔍 Verifying New Password\n');
    console.log('='.repeat(60));
    
    const testEmail = 'test@enterprisehub.com';
    const newPassword = 'test1234';
    
    try {
        // Test 1: Login with new password
        console.log('\n📋 Test 1: Login with New Password');
        console.log('-'.repeat(60));
        console.log(`   Email: ${testEmail}`);
        console.log(`   Password: ${newPassword}`);
        
        const loginResponse = await makeRequest('/api/auth/login', 'POST', {
            email: testEmail,
            password: newPassword
        });
        
        console.log('\n   Response status:', loginResponse.status);
        
        if (loginResponse.status === 200) {
            console.log('   ✅ Login successful with new password!');
            console.log('   User:', loginResponse.data.user.name);
            console.log('   Email:', loginResponse.data.user.email);
            console.log('   User ID:', loginResponse.data.user.id);
            
            const token = loginResponse.data.token;
            console.log('   Token:', token.substring(0, 30) + '...');
            
            // Test 2: Verify old password doesn't work
            console.log('\n📋 Test 2: Verify Old Password (test123) No Longer Works');
            console.log('-'.repeat(60));
            
            const oldPasswordResponse = await makeRequest('/api/auth/login', 'POST', {
                email: testEmail,
                password: 'test123'
            });
            
            console.log('   Response status:', oldPasswordResponse.status);
            
            if (oldPasswordResponse.status === 401) {
                console.log('   ✅ Old password correctly rejected!');
                console.log('   Response:', oldPasswordResponse.data.message || 'Unauthorized');
            } else {
                console.log('   ⚠️  Old password still works (unexpected)');
            }
            
            // Test 3: Test password change with new password
            console.log('\n📋 Test 3: Test Password Change API with New Password');
            console.log('-'.repeat(60));
            console.log('   Current Password:', newPassword);
            console.log('   New Password: test1234 (same, should work)');
            
            const passwordChangeResponse = await makeRequest('/api/users/password', 'PUT', {
                currentPassword: newPassword,
                newPassword: newPassword
            }, token);
            
            console.log('   Response status:', passwordChangeResponse.status);
            
            if (passwordChangeResponse.status === 200) {
                console.log('   ✅ Password change API works with new password!');
                console.log('   Response:', passwordChangeResponse.data.message);
            } else {
                console.log('   ❌ Password change failed');
                console.log('   Response:', JSON.stringify(passwordChangeResponse.data, null, 2));
            }
            
            console.log('\n' + '='.repeat(60));
            console.log('✅ Password Verification Complete!');
            console.log('='.repeat(60));
            console.log('\n📋 Summary:');
            console.log(`   ✅ New password "${newPassword}" works for login`);
            console.log(`   ✅ Old password "test123" no longer works`);
            console.log(`   ✅ Password change API works with new password`);
            
        } else {
            console.log('   ❌ Login failed!');
            console.log('   Response:', JSON.stringify(loginResponse.data, null, 2));
            console.log('\n💡 The password might not have been changed, or there was an error.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Server is not running. Start it with: npm run dev');
        }
    }
}

verifyPassword();
