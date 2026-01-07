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

async function comprehensiveVerification() {
    let connection;
    const issues = [];

    try {
        console.log('============================================================');
        console.log('COMPREHENSIVE DASHBOARD VERIFICATION');
        console.log('Database vs API vs Expected Dashboard Display');
        console.log('============================================================\n');

        connection = await mysql.createConnection(dbConfig);
        const token = await getAdminToken();

        if (!token) {
            console.log('❌ Failed to get admin token');
            return;
        }

        // ========== GET ALL ACTUAL COUNTS FROM DATABASE ==========
        console.log('STEP 1: Getting actual database counts...\n');
        
        const [eventsCount] = await connection.execute('SELECT COUNT(*) as count FROM events');
        const [blogCount] = await connection.execute('SELECT COUNT(*) as count FROM blog_posts WHERE is_published = TRUE');
        const [membersCount] = await connection.execute('SELECT COUNT(*) as count FROM directory_members');
        const [partnersCount] = await connection.execute('SELECT COUNT(*) as count FROM directory_partners');
        const [dirBizCount] = await connection.execute('SELECT COUNT(*) as count FROM directory_businesses');
        const [usersCount] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
        const [businessesCount] = await connection.execute('SELECT COUNT(*) as count FROM businesses');

        const actualCounts = {
            events: eventsCount[0].count,
            blog_posts: blogCount[0].count,
            members: membersCount[0].count,
            partners: partnersCount[0].count,
            directory_businesses: dirBizCount[0].count,
            directory_entries: membersCount[0].count + partnersCount[0].count + dirBizCount[0].count,
            users: usersCount[0].count,
            businesses: businessesCount[0].count
        };

        console.log('ACTUAL DATABASE COUNTS:');
        console.log(`   Events: ${actualCounts.events}`);
        console.log(`   Blog Posts: ${actualCounts.blog_posts}`);
        console.log(`   Members: ${actualCounts.members}`);
        console.log(`   Partners: ${actualCounts.partners}`);
        console.log(`   Directory Businesses: ${actualCounts.directory_businesses}`);
        console.log(`   Directory Entries (total): ${actualCounts.directory_entries}`);
        console.log(`   Registered Users: ${actualCounts.users}`);
        console.log(`   Registered Businesses: ${actualCounts.businesses}\n`);

        // ========== GET DASHBOARD STATS FROM API ==========
        console.log('STEP 2: Getting dashboard stats from API...\n');
        
        const statsResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/admin/dashboard/stats',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (statsResponse.status !== 200) {
            issues.push(`Dashboard Stats API returned ${statsResponse.status}`);
            console.log(`❌ Dashboard Stats API error: ${statsResponse.status}\n`);
        } else {
            const apiStats = statsResponse.data;
            console.log('DASHBOARD STATS API RESPONSE:');
            console.log(`   total_events: ${apiStats.total_events}`);
            console.log(`   total_blog_posts: ${apiStats.total_blog_posts}`);
            console.log(`   total_members: ${apiStats.total_members}`);
            console.log(`   total_directory_entries: ${apiStats.total_directory_entries}`);
            console.log(`   total_registered_users: ${apiStats.total_registered_users}`);
            console.log(`   total_registered_businesses: ${apiStats.total_registered_businesses}\n`);

            // Compare with actual counts
            console.log('STEP 3: Comparing API stats with database...\n');
            
            const comparisons = [
                { 
                    name: 'Events', 
                    db: actualCounts.events, 
                    api: apiStats.total_events,
                    expected: actualCounts.events
                },
                { 
                    name: 'Blog Posts', 
                    db: actualCounts.blog_posts, 
                    api: apiStats.total_blog_posts,
                    expected: actualCounts.blog_posts
                },
                { 
                    name: 'Members', 
                    db: actualCounts.members, 
                    api: apiStats.total_members,
                    expected: actualCounts.members
                },
                { 
                    name: 'Directory Entries', 
                    db: actualCounts.directory_entries, 
                    api: apiStats.total_directory_entries,
                    expected: actualCounts.directory_entries
                },
                { 
                    name: 'Registered Users', 
                    db: actualCounts.users, 
                    api: apiStats.total_registered_users,
                    expected: actualCounts.users
                },
                { 
                    name: 'Registered Businesses', 
                    db: actualCounts.businesses, 
                    api: apiStats.total_registered_businesses,
                    expected: actualCounts.businesses
                }
            ];

            comparisons.forEach(comp => {
                if (comp.db !== comp.api) {
                    issues.push(`${comp.name}: Database has ${comp.db}, but API returns ${comp.api}`);
                    console.log(`❌ ${comp.name}: DB=${comp.db}, API=${comp.api} - MISMATCH!`);
                } else {
                    console.log(`✅ ${comp.name}: ${comp.db} (MATCH)`);
                }
            });
        }

        // ========== TEST INDIVIDUAL API ENDPOINTS ==========
        console.log('\nSTEP 4: Testing individual API endpoints...\n');

        // Test Users API
        const usersResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/admin/users',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (usersResponse.status === 200) {
            const apiUsersCount = usersResponse.data.users?.length || 0;
            if (actualCounts.users !== apiUsersCount) {
                issues.push(`Users API: Database has ${actualCounts.users}, API returns ${apiUsersCount}`);
                console.log(`❌ Users API: DB=${actualCounts.users}, API=${apiUsersCount}`);
            } else {
                console.log(`✅ Users API: ${apiUsersCount} (MATCH)`);
            }
        } else {
            issues.push(`Users API returned ${usersResponse.status}`);
            console.log(`❌ Users API error: ${usersResponse.status}`);
        }

        // Test Businesses API
        const businessesResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/admin/businesses',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (businessesResponse.status === 200) {
            const apiBusinessesCount = businessesResponse.data.businesses?.length || 0;
            if (actualCounts.businesses !== apiBusinessesCount) {
                issues.push(`Businesses API: Database has ${actualCounts.businesses}, API returns ${apiBusinessesCount}`);
                console.log(`❌ Businesses API: DB=${actualCounts.businesses}, API=${apiBusinessesCount}`);
            } else {
                console.log(`✅ Businesses API: ${apiBusinessesCount} (MATCH)`);
            }
        } else {
            issues.push(`Businesses API returned ${businessesResponse.status}`);
            console.log(`❌ Businesses API error: ${businessesResponse.status}`);
        }

        // Test Events API
        const eventsResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/events',
            method: 'GET'
        });
        if (eventsResponse.status === 200) {
            const apiEventsCount = eventsResponse.data.events?.length || 0;
            if (actualCounts.events !== apiEventsCount) {
                issues.push(`Events API: Database has ${actualCounts.events}, API returns ${apiEventsCount}`);
                console.log(`❌ Events API: DB=${actualCounts.events}, API=${apiEventsCount}`);
            } else {
                console.log(`✅ Events API: ${apiEventsCount} (MATCH)`);
            }
        } else {
            issues.push(`Events API returned ${eventsResponse.status}`);
            console.log(`❌ Events API error: ${eventsResponse.status}`);
        }

        // Test Members API
        const membersResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/directories/members',
            method: 'GET'
        });
        if (membersResponse.status === 200) {
            const apiMembersCount = membersResponse.data.members?.length || membersResponse.data.pagination?.total || 0;
            if (actualCounts.members !== apiMembersCount) {
                issues.push(`Members API: Database has ${actualCounts.members}, API returns ${apiMembersCount}`);
                console.log(`❌ Members API: DB=${actualCounts.members}, API=${apiMembersCount}`);
            } else {
                console.log(`✅ Members API: ${apiMembersCount} (MATCH)`);
            }
        } else {
            issues.push(`Members API returned ${membersResponse.status}`);
            console.log(`❌ Members API error: ${membersResponse.status}`);
        }

        // ========== SUMMARY ==========
        console.log('\n============================================================');
        console.log('FINAL SUMMARY');
        console.log('============================================================\n');

        if (issues.length === 0) {
            console.log('✅ ALL DATA MATCHES PERFECTLY!');
            console.log('\nExpected Dashboard Display:');
            console.log(`   Events: ${actualCounts.events}`);
            console.log(`   Blog Posts: ${actualCounts.blog_posts}`);
            console.log(`   Directory Entries: ${actualCounts.directory_entries}`);
            console.log(`   Registered Users: ${actualCounts.users}`);
            console.log(`   Members: ${actualCounts.members}`);
            console.log(`   Registered Businesses: ${actualCounts.businesses}`);
        } else {
            console.log(`❌ FOUND ${issues.length} ISSUE(S):\n`);
            issues.forEach((issue, idx) => {
                console.log(`${idx + 1}. ${issue}`);
            });
            console.log('\n⚠️  These issues need to be fixed!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

async function getAdminToken() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/admin/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { username: process.env.TEST_ADMIN_USERNAME || 'admin', password: process.env.TEST_ADMIN_PASSWORD || 'admin123' });

        if (response.status === 200 && response.data.token) {
            return response.data.token;
        }
        return null;
    } catch (error) {
        return null;
    }
}

comprehensiveVerification();




