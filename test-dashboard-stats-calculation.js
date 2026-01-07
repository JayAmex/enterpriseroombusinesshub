const mysql = require('mysql2/promise');
const http = require('http');

const dbConfig = require('./db-config');

require('dotenv').config();
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

async function testDashboardStats() {
    let connection;
    try {
        console.log('============================================================');
        console.log('DASHBOARD STATS VERIFICATION');
        console.log('============================================================\n');

        connection = await mysql.createConnection(dbConfig);

        // Get admin token
        const loginResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/admin/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { username: process.env.TEST_ADMIN_USERNAME || 'admin', password: process.env.TEST_ADMIN_PASSWORD || 'admin123' });

        if (loginResponse.status !== 200 || !loginResponse.data.token) {
            console.log('❌ Failed to get admin token');
            return;
        }

        const token = loginResponse.data.token;

        // Get actual counts from database
        console.log('1. ACTUAL DATABASE COUNTS:');
        console.log('─'.repeat(60));
        
        const [eventsCount] = await connection.execute('SELECT COUNT(*) as count FROM events');
        const [blogCount] = await connection.execute('SELECT COUNT(*) as count FROM blog_posts WHERE is_published = TRUE');
        const [membersCount] = await connection.execute('SELECT COUNT(*) as count FROM directory_members');
        const [partnersCount] = await connection.execute('SELECT COUNT(*) as count FROM directory_partners');
        const [dirBizCount] = await connection.execute('SELECT COUNT(*) as count FROM directory_businesses');
        const [usersCount] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
        const [businessesCount] = await connection.execute('SELECT COUNT(*) as count FROM businesses');

        const dbStats = {
            events: eventsCount[0].count,
            blog_posts: blogCount[0].count,
            members: membersCount[0].count,
            partners: partnersCount[0].count,
            directory_businesses: dirBizCount[0].count,
            users: usersCount[0].count,
            businesses: businessesCount[0].count,
            directory_entries: membersCount[0].count + partnersCount[0].count + dirBizCount[0].count
        };

        console.log(`   Events: ${dbStats.events}`);
        console.log(`   Blog Posts: ${dbStats.blog_posts}`);
        console.log(`   Members: ${dbStats.members}`);
        console.log(`   Partners: ${dbStats.partners}`);
        console.log(`   Directory Businesses: ${dbStats.directory_businesses}`);
        console.log(`   Directory Entries (total): ${dbStats.directory_entries}`);
        console.log(`   Registered Users: ${dbStats.users}`);
        console.log(`   Registered Businesses: ${dbStats.businesses}\n`);

        // Get stats from API
        console.log('2. DASHBOARD STATS API:');
        console.log('─'.repeat(60));
        
        const statsResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/admin/dashboard/stats',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (statsResponse.status === 200) {
            const apiStats = statsResponse.data;
            console.log(`   Total Events: ${apiStats.total_events}`);
            console.log(`   Total Blog Posts: ${apiStats.total_blog_posts}`);
            console.log(`   Total Members: ${apiStats.total_members}`);
            console.log(`   Total Directory Entries: ${apiStats.total_directory_entries}`);
            console.log(`   Total Registered Users: ${apiStats.total_registered_users}`);
            console.log(`   Total Registered Businesses: ${apiStats.total_registered_businesses}\n`);

            // Compare
            console.log('3. COMPARISON:');
            console.log('─'.repeat(60));
            
            const comparisons = [
                { name: 'Events', db: dbStats.events, api: apiStats.total_events },
                { name: 'Blog Posts', db: dbStats.blog_posts, api: apiStats.total_blog_posts },
                { name: 'Members', db: dbStats.members, api: apiStats.total_members },
                { name: 'Directory Entries', db: dbStats.directory_entries, api: apiStats.total_directory_entries },
                { name: 'Registered Users', db: dbStats.users, api: apiStats.total_registered_users },
                { name: 'Registered Businesses', db: dbStats.businesses, api: apiStats.total_registered_businesses }
            ];

            let allMatch = true;
            comparisons.forEach(comp => {
                if (comp.db === comp.api) {
                    console.log(`   ✅ ${comp.name}: ${comp.db} (MATCH)`);
                } else {
                    console.log(`   ❌ ${comp.name}: DB=${comp.db}, API=${comp.api} (MISMATCH!)`);
                    allMatch = false;
                }
            });

            console.log('');
            if (allMatch) {
                console.log('✅ All dashboard stats match!');
            } else {
                console.log('❌ Dashboard stats have mismatches!');
            }

        } else {
            console.log(`❌ API error: ${statsResponse.status}`);
            console.log(JSON.stringify(statsResponse.data, null, 2));
        }

        // Check the database view directly
        console.log('\n4. DATABASE VIEW (vw_dashboard_stats):');
        console.log('─'.repeat(60));
        try {
            const [viewStats] = await connection.execute('SELECT * FROM vw_dashboard_stats');
            if (viewStats.length > 0) {
                const view = viewStats[0];
                console.log(`   registered_users_count: ${view.registered_users_count}`);
                console.log(`   registered_businesses_count: ${view.registered_businesses_count}`);
                console.log(`   members_count: ${view.members_count}`);
                console.log(`   events_count: ${view.events_count}`);
                console.log(`   blog_posts_count: ${view.blog_posts_count}`);
                console.log(`   directory_entries_count: ${view.directory_entries_count}`);
            }
        } catch (error) {
            console.log(`   ❌ Error querying view: ${error.message}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

testDashboardStats();




