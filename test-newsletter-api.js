// Test Newsletter API Endpoints
// Run with: node test-newsletter-api.js

async function testNewsletterAPI() {
    const baseURL = 'http://localhost:3000';
    
    console.log('🧪 Testing Newsletter API Endpoints\n');
    console.log('='.repeat(60));
    
    // Test 1: Subscribe to newsletter
    console.log('\n1. Testing POST /api/newsletter/subscribe');
    console.log('-'.repeat(60));
    
    try {
        const testEmail = `test${Date.now()}@example.com`;
        console.log(`   Subscribing email: ${testEmail}`);
        
        const subscribeResponse = await fetch(`${baseURL}/api/newsletter/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: testEmail })
        });
        
        const subscribeData = await subscribeResponse.json();
        
        if (subscribeResponse.ok) {
            console.log('   ✅ Subscription successful!');
            console.log(`   Response: ${subscribeData.message}`);
        } else {
            console.log('   ❌ Subscription failed!');
            console.log(`   Error: ${subscribeData.message}`);
        }
        
        // Test 2: Try subscribing same email again (should fail)
        console.log('\n2. Testing duplicate subscription (should fail)');
        console.log('-'.repeat(60));
        
        const duplicateResponse = await fetch(`${baseURL}/api/newsletter/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: testEmail })
        });
        
        const duplicateData = await duplicateResponse.json();
        
        if (duplicateResponse.status === 409) {
            console.log('   ✅ Correctly rejected duplicate subscription');
            console.log(`   Response: ${duplicateData.message}`);
        } else {
            console.log('   ⚠️  Unexpected response for duplicate');
        }
        
        // Test 3: Test invalid email
        console.log('\n3. Testing invalid email format (should fail)');
        console.log('-'.repeat(60));
        
        const invalidResponse = await fetch(`${baseURL}/api/newsletter/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: 'not-an-email' })
        });
        
        const invalidData = await invalidResponse.json();
        
        if (invalidResponse.status === 400) {
            console.log('   ✅ Correctly rejected invalid email');
            console.log(`   Response: ${invalidData.message}`);
        } else {
            console.log('   ⚠️  Unexpected response for invalid email');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ API Tests Complete!');
        console.log('\n📝 Next steps:');
        console.log('   1. Check your database to see the test subscription');
        console.log('   2. Test the admin endpoint (requires admin token)');
        console.log('   3. Test the homepage form in browser');
        
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
        console.log('\n⚠️  Make sure your server is running: npm run dev');
    }
}

testNewsletterAPI();


