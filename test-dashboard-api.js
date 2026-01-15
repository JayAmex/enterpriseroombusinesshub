// Test Dashboard API Endpoint
require('dotenv').config();
const mysql = require('mysql2/promise');
const http = require('http');

const dbConfig = require('./db-config');

async function testDashboardAPI() {
    let connection;
    
    try {
        console.log('🔍 Testing Dashboard API Issues\n');
        console.log('='.repeat(60));
        
        // Step 1: Test database connection
        console.log('\n📋 Step 1: Testing Database Connection');
        console.log('-'.repeat(60));
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connection successful');
        
        // Step 2: Check if view exists
        console.log('\n📋 Step 2: Checking if vw_dashboard_stats view exists');
        console.log('-'.repeat(60));
        try {
            const [viewCheck] = await connection.execute(
                "SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'vw_dashboard_stats'",
                [process.env.DB_NAME]
            );
            
            if (viewCheck.length === 0) {
                console.log('❌ View vw_dashboard_stats does NOT exist!');
                console.log('   Need to create the view from database_schema.sql');
                return;
            } else {
                console.log('✅ View vw_dashboard_stats exists');
            }
        } catch (viewError) {
            console.log('⚠️  Could not check view (might not exist):', viewError.message);
        }
        
        // Step 3: Query the view directly
        console.log('\n📋 Step 3: Querying vw_dashboard_stats view');
        console.log('-'.repeat(60));
        try {
            const [stats] = await connection.execute('SELECT * FROM vw_dashboard_stats');
            if (stats.length > 0) {
                console.log('✅ View query successful');
                console.log('   Data:', JSON.stringify(stats[0], null, 2));
            } else {
                console.log('⚠️  View returned no rows');
            }
        } catch (viewQueryError) {
            console.log('❌ Error querying view:', viewQueryError.message);
            console.log('   Code:', viewQueryError.code);
            return;
        }
        
        // Step 4: Test API endpoint (need admin token)
        console.log('\n📋 Step 4: Testing API Endpoint');
        console.log('-'.repeat(60));
        console.log('   Endpoint: http://localhost:3000/api/admin/dashboard/stats');
        console.log('   Note: This requires admin authentication token');
        console.log('   To test: Login to admin dashboard and check browser console');
        
        // Step 5: Check server status
        console.log('\n📋 Step 5: Checking Server Status');
        console.log('-'.repeat(60));
        try {
            const response = await new Promise((resolve, reject) => {
                const req = http.get('http://localhost:3000/api/health', (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve({ status: res.statusCode, data }));
                });
                req.on('error', reject);
                req.setTimeout(2000, () => reject(new Error('Timeout')));
            });
            console.log('✅ Server is running');
            console.log('   Status:', response.status);
        } catch (serverError) {
            console.log('❌ Server might not be running or health endpoint missing');
            console.log('   Error:', serverError.message);
            console.log('   Check: Is server.js running?');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 Summary:');
        console.log('   Database: ✅ Connected');
        console.log('   View exists: Check above');
        console.log('   View data: Check above');
        console.log('   Server: Check above');
        console.log('\n💡 Next steps:');
        console.log('   1. Check browser console for API errors');
        console.log('   2. Verify admin token is valid');
        console.log('   3. Check server logs for errors');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('   Code:', error.code);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testDashboardAPI();
