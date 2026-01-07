const mysql = require('mysql2/promise');
const http = require('http');

const dbConfig = require('./db-config');

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

async function testAllData() {
    let connection;
    const results = {
        users: { db: 0, api: 0, match: false, issues: [] },
        businesses: { db: 0, api: 0, match: false, issues: [] },
        events: { db: 0, api: 0, match: false, issues: [] },
        blogPosts: { db: 0, api: 0, match: false, issues: [] },
        directoryMembers: { db: 0, api: 0, match: false, issues: [] },
        directoryPartners: { db: 0, api: 0, match: false, issues: [] },
        directoryBusinesses: { db: 0, api: 0, match: false, issues: [] }
    };

    try {
        console.log('============================================================');
        console.log('COMPREHENSIVE DATA CONSISTENCY TEST');
        console.log('Database vs API vs Dashboard');
        console.log('============================================================\n');

        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // ========== 1. USERS ==========
        console.log('1. TESTING USERS');
        console.log('─'.repeat(60));
        const [dbUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
        results.users.db = dbUsers[0].count;
        console.log(`   Database: ${results.users.db} users`);

        try {
            const apiResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/admin/users',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + (process.env.ADMIN_TOKEN || 'test')
                }
            });

            if (apiResponse.status === 200) {
                results.users.api = apiResponse.data.users?.length || 0;
                console.log(`   Admin API: ${results.users.api} users`);
                
                if (results.users.db === results.users.api) {
                    results.users.match = true;
                    console.log('   ✅ Count matches\n');
                } else {
                    results.users.issues.push(`Count mismatch: DB=${results.users.db}, API=${results.users.api}`);
                    console.log(`   ⚠️  Count mismatch\n`);
                }
            } else if (apiResponse.status === 401) {
                console.log('   ⚠️  Admin API requires authentication (skipping)\n');
            } else {
                results.users.issues.push(`API error: ${apiResponse.status}`);
                console.log(`   ❌ API error: ${apiResponse.status}\n`);
            }
        } catch (error) {
            results.users.issues.push(`API request failed: ${error.message}`);
            console.log(`   ❌ API request failed: ${error.message}\n`);
        }

        // ========== 2. BUSINESSES ==========
        console.log('2. TESTING BUSINESSES');
        console.log('─'.repeat(60));
        const [dbBusinesses] = await connection.execute('SELECT COUNT(*) as count FROM businesses');
        results.businesses.db = dbBusinesses[0].count;
        console.log(`   Database: ${results.businesses.db} businesses`);

        try {
            const apiResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/admin/businesses',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + (process.env.ADMIN_TOKEN || 'test')
                }
            });

            if (apiResponse.status === 200) {
                results.businesses.api = apiResponse.data.businesses?.length || 0;
                console.log(`   Admin API: ${results.businesses.api} businesses`);
                
                if (results.businesses.db === results.businesses.api) {
                    results.businesses.match = true;
                    console.log('   ✅ Count matches\n');
                } else {
                    results.businesses.issues.push(`Count mismatch: DB=${results.businesses.db}, API=${results.businesses.api}`);
                    console.log(`   ⚠️  Count mismatch\n`);
                }
            } else if (apiResponse.status === 401) {
                console.log('   ⚠️  Admin API requires authentication (skipping)\n');
            } else {
                results.businesses.issues.push(`API error: ${apiResponse.status}`);
                console.log(`   ❌ API error: ${apiResponse.status}\n`);
            }
        } catch (error) {
            results.businesses.issues.push(`API request failed: ${error.message}`);
            console.log(`   ❌ API request failed: ${error.message}\n`);
        }

        // ========== 3. EVENTS ==========
        console.log('3. TESTING EVENTS');
        console.log('─'.repeat(60));
        const [dbEvents] = await connection.execute('SELECT COUNT(*) as count FROM events');
        results.events.db = dbEvents[0].count;
        console.log(`   Database: ${results.events.db} events`);

        try {
            const apiResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/events',
                method: 'GET'
            });

            if (apiResponse.status === 200) {
                results.events.api = apiResponse.data.events?.length || 0;
                console.log(`   Public API: ${results.events.api} events`);
                
                if (results.events.db === results.events.api) {
                    results.events.match = true;
                    console.log('   ✅ Count matches\n');
                } else {
                    results.events.issues.push(`Count mismatch: DB=${results.events.db}, API=${results.events.api}`);
                    console.log(`   ⚠️  Count mismatch\n`);
                }
            } else {
                results.events.issues.push(`API error: ${apiResponse.status}`);
                console.log(`   ❌ API error: ${apiResponse.status}\n`);
            }
        } catch (error) {
            results.events.issues.push(`API request failed: ${error.message}`);
            console.log(`   ❌ API request failed: ${error.message}\n`);
        }

        // ========== 4. BLOG POSTS ==========
        console.log('4. TESTING BLOG POSTS');
        console.log('─'.repeat(60));
        const [dbBlogPosts] = await connection.execute('SELECT COUNT(*) as count FROM blog_posts WHERE is_published = TRUE');
        results.blogPosts.db = dbBlogPosts[0].count;
        console.log(`   Database (published): ${results.blogPosts.db} posts`);

        try {
            const apiResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/blog',
                method: 'GET'
            });

            if (apiResponse.status === 200) {
                results.blogPosts.api = apiResponse.data.posts?.length || 0;
                console.log(`   Public API: ${results.blogPosts.api} posts`);
                
                if (results.blogPosts.db === results.blogPosts.api) {
                    results.blogPosts.match = true;
                    console.log('   ✅ Count matches\n');
                } else {
                    results.blogPosts.issues.push(`Count mismatch: DB=${results.blogPosts.db}, API=${results.blogPosts.api}`);
                    console.log(`   ⚠️  Count mismatch\n`);
                }
            } else {
                results.blogPosts.issues.push(`API error: ${apiResponse.status}`);
                console.log(`   ❌ API error: ${apiResponse.status}\n`);
            }
        } catch (error) {
            results.blogPosts.issues.push(`API request failed: ${error.message}`);
            console.log(`   ❌ API request failed: ${error.message}\n`);
        }

        // ========== 5. DIRECTORY MEMBERS ==========
        console.log('5. TESTING DIRECTORY MEMBERS');
        console.log('─'.repeat(60));
        const [dbMembers] = await connection.execute('SELECT COUNT(*) as count FROM directory_members');
        results.directoryMembers.db = dbMembers[0].count;
        console.log(`   Database: ${results.directoryMembers.db} members`);

        try {
            const apiResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/directories/members',
                method: 'GET'
            });

            if (apiResponse.status === 200) {
                results.directoryMembers.api = apiResponse.data.members?.length || apiResponse.data.pagination?.total || 0;
                console.log(`   Public API: ${results.directoryMembers.api} members`);
                
                if (results.directoryMembers.db === results.directoryMembers.api) {
                    results.directoryMembers.match = true;
                    console.log('   ✅ Count matches\n');
                } else {
                    results.directoryMembers.issues.push(`Count mismatch: DB=${results.directoryMembers.db}, API=${results.directoryMembers.api}`);
                    console.log(`   ⚠️  Count mismatch\n`);
                }
            } else {
                results.directoryMembers.issues.push(`API error: ${apiResponse.status}`);
                console.log(`   ❌ API error: ${apiResponse.status}\n`);
            }
        } catch (error) {
            results.directoryMembers.issues.push(`API request failed: ${error.message}`);
            console.log(`   ❌ API request failed: ${error.message}\n`);
        }

        // ========== 6. DIRECTORY PARTNERS ==========
        console.log('6. TESTING DIRECTORY PARTNERS');
        console.log('─'.repeat(60));
        const [dbPartners] = await connection.execute('SELECT COUNT(*) as count FROM directory_partners');
        results.directoryPartners.db = dbPartners[0].count;
        console.log(`   Database: ${results.directoryPartners.db} partners`);

        try {
            const apiResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/directories/partners',
                method: 'GET'
            });

            if (apiResponse.status === 200) {
                results.directoryPartners.api = apiResponse.data.partners?.length || apiResponse.data.pagination?.total || 0;
                console.log(`   Public API: ${results.directoryPartners.api} partners`);
                
                if (results.directoryPartners.db === results.directoryPartners.api) {
                    results.directoryPartners.match = true;
                    console.log('   ✅ Count matches\n');
                } else {
                    results.directoryPartners.issues.push(`Count mismatch: DB=${results.directoryPartners.db}, API=${results.directoryPartners.api}`);
                    console.log(`   ⚠️  Count mismatch\n`);
                }
            } else {
                results.directoryPartners.issues.push(`API error: ${apiResponse.status}`);
                console.log(`   ❌ API error: ${apiResponse.status}\n`);
            }
        } catch (error) {
            results.directoryPartners.issues.push(`API request failed: ${error.message}`);
            console.log(`   ❌ API request failed: ${error.message}\n`);
        }

        // ========== 7. DIRECTORY BUSINESSES ==========
        console.log('7. TESTING DIRECTORY BUSINESSES');
        console.log('─'.repeat(60));
        const [dbDirBusinesses] = await connection.execute('SELECT COUNT(*) as count FROM directory_businesses');
        results.directoryBusinesses.db = dbDirBusinesses[0].count;
        console.log(`   Database: ${results.directoryBusinesses.db} directory businesses`);

        try {
            const apiResponse = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/directories/business',
                method: 'GET'
            });

            if (apiResponse.status === 200) {
                results.directoryBusinesses.api = apiResponse.data.businesses?.length || apiResponse.data.pagination?.total || 0;
                console.log(`   Public API: ${results.directoryBusinesses.api} directory businesses`);
                
                if (results.directoryBusinesses.db === results.directoryBusinesses.api) {
                    results.directoryBusinesses.match = true;
                    console.log('   ✅ Count matches\n');
                } else {
                    results.directoryBusinesses.issues.push(`Count mismatch: DB=${results.directoryBusinesses.db}, API=${results.directoryBusinesses.api}`);
                    console.log(`   ⚠️  Count mismatch\n`);
                }
            } else {
                results.directoryBusinesses.issues.push(`API error: ${apiResponse.status}`);
                console.log(`   ❌ API error: ${apiResponse.status}\n`);
            }
        } catch (error) {
            results.directoryBusinesses.issues.push(`API request failed: ${error.message}`);
            console.log(`   ❌ API request failed: ${error.message}\n`);
        }

        // ========== SUMMARY ==========
        console.log('============================================================');
        console.log('SUMMARY');
        console.log('============================================================\n');

        const allTests = [
            { name: 'Users', result: results.users },
            { name: 'Businesses', result: results.businesses },
            { name: 'Events', result: results.events },
            { name: 'Blog Posts', result: results.blogPosts },
            { name: 'Directory Members', result: results.directoryMembers },
            { name: 'Directory Partners', result: results.directoryPartners },
            { name: 'Directory Businesses', result: results.directoryBusinesses }
        ];

        let passed = 0;
        let failed = 0;

        allTests.forEach(test => {
            if (test.result.match) {
                console.log(`✅ ${test.name}: ${test.result.db} items - MATCH`);
                passed++;
            } else {
                console.log(`❌ ${test.name}: DB=${test.result.db}, API=${test.result.api} - MISMATCH`);
                if (test.result.issues.length > 0) {
                    test.result.issues.forEach(issue => {
                        console.log(`   ⚠️  ${issue}`);
                    });
                }
                failed++;
            }
        });

        console.log(`\n============================================================`);
        console.log(`Results: ${passed} passed, ${failed} failed`);
        console.log(`============================================================`);

        if (failed > 0) {
            console.log('\n⚠️  Inconsistencies found! Please review the issues above.');
        } else {
            console.log('\n✅ All data is consistent between database and API!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

testAllData();




