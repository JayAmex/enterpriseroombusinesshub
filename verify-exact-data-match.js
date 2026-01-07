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
                    resolve({ status: res.statusCode, data: body, raw: body });
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

async function verifyExactMatch() {
    let connection;
    const mismatches = [];

    try {
        console.log('============================================================');
        console.log('EXACT DATA VERIFICATION - Database vs API');
        console.log('============================================================\n');

        connection = await mysql.createConnection(dbConfig);
        const token = await getAdminToken();

        if (!token) {
            console.log('❌ Failed to get admin token');
            return;
        }

        // ========== 1. EVENTS ==========
        console.log('1. VERIFYING EVENTS');
        console.log('─'.repeat(60));
        const [dbEvents] = await connection.execute('SELECT * FROM events ORDER BY id');
        console.log(`   Database: ${dbEvents.length} events`);

        const eventsResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/events',
            method: 'GET'
        });

        if (eventsResponse.status === 200) {
            const apiEvents = eventsResponse.data.events || [];
            console.log(`   API: ${apiEvents.length} events`);

            if (dbEvents.length !== apiEvents.length) {
                mismatches.push(`Events: Count mismatch - DB=${dbEvents.length}, API=${apiEvents.length}`);
                console.log(`   ❌ COUNT MISMATCH!\n`);
            } else {
                // Compare each event
                let eventMismatches = 0;
                dbEvents.forEach(dbEvent => {
                    const apiEvent = apiEvents.find(e => e.id === dbEvent.id);
                    if (!apiEvent) {
                        eventMismatches++;
                        mismatches.push(`Events: Event ID ${dbEvent.id} (${dbEvent.title}) not found in API`);
                    } else {
                        if (dbEvent.title !== apiEvent.title) {
                            eventMismatches++;
                            mismatches.push(`Events: ID ${dbEvent.id} title mismatch - DB="${dbEvent.title}", API="${apiEvent.title}"`);
                        }
                    }
                });
                if (eventMismatches === 0) {
                    console.log(`   ✅ All ${dbEvents.length} events match exactly\n`);
                } else {
                    console.log(`   ❌ ${eventMismatches} event(s) have mismatches\n`);
                }
            }
        } else {
            mismatches.push(`Events: API error ${eventsResponse.status}`);
            console.log(`   ❌ API error: ${eventsResponse.status}\n`);
        }

        // ========== 2. BLOG POSTS ==========
        console.log('2. VERIFYING BLOG POSTS');
        console.log('─'.repeat(60));
        const [dbBlogPosts] = await connection.execute('SELECT * FROM blog_posts WHERE is_published = TRUE ORDER BY id');
        console.log(`   Database (published): ${dbBlogPosts.length} posts`);

        const blogResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/blog',
            method: 'GET'
        });

        if (blogResponse.status === 200) {
            const apiPosts = blogResponse.data.posts || [];
            console.log(`   API: ${apiPosts.length} posts`);

            if (dbBlogPosts.length !== apiPosts.length) {
                mismatches.push(`Blog Posts: Count mismatch - DB=${dbBlogPosts.length}, API=${apiPosts.length}`);
                console.log(`   ❌ COUNT MISMATCH!\n`);
            } else {
                let postMismatches = 0;
                dbBlogPosts.forEach(dbPost => {
                    const apiPost = apiPosts.find(p => p.id === dbPost.id);
                    if (!apiPost) {
                        postMismatches++;
                        mismatches.push(`Blog Posts: Post ID ${dbPost.id} (${dbPost.title}) not found in API`);
                    } else if (dbPost.title !== apiPost.title) {
                        postMismatches++;
                        mismatches.push(`Blog Posts: ID ${dbPost.id} title mismatch - DB="${dbPost.title}", API="${apiPost.title}"`);
                    }
                });
                if (postMismatches === 0) {
                    console.log(`   ✅ All ${dbBlogPosts.length} posts match exactly\n`);
                } else {
                    console.log(`   ❌ ${postMismatches} post(s) have mismatches\n`);
                }
            }
        } else {
            mismatches.push(`Blog Posts: API error ${blogResponse.status}`);
            console.log(`   ❌ API error: ${blogResponse.status}\n`);
        }

        // ========== 3. DIRECTORY MEMBERS ==========
        console.log('3. VERIFYING DIRECTORY MEMBERS');
        console.log('─'.repeat(60));
        const [dbMembers] = await connection.execute('SELECT * FROM directory_members ORDER BY id');
        console.log(`   Database: ${dbMembers.length} members`);

        const membersResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/directories/members',
            method: 'GET'
        });

        if (membersResponse.status === 200) {
            const apiMembers = membersResponse.data.members || [];
            console.log(`   API: ${apiMembers.length} members`);

            if (dbMembers.length !== apiMembers.length) {
                mismatches.push(`Members: Count mismatch - DB=${dbMembers.length}, API=${apiMembers.length}`);
                console.log(`   ❌ COUNT MISMATCH!\n`);
            } else {
                let memberMismatches = 0;
                dbMembers.forEach(dbMember => {
                    const apiMember = apiMembers.find(m => m.id === dbMember.id);
                    if (!apiMember) {
                        memberMismatches++;
                        mismatches.push(`Members: Member ID ${dbMember.id} (${dbMember.name}) not found in API`);
                    } else if (dbMember.name !== apiMember.name) {
                        memberMismatches++;
                        mismatches.push(`Members: ID ${dbMember.id} name mismatch - DB="${dbMember.name}", API="${apiMember.name}"`);
                    }
                });
                if (memberMismatches === 0) {
                    console.log(`   ✅ All ${dbMembers.length} members match exactly\n`);
                } else {
                    console.log(`   ❌ ${memberMismatches} member(s) have mismatches\n`);
                }
            }
        } else {
            mismatches.push(`Members: API error ${membersResponse.status}`);
            console.log(`   ❌ API error: ${membersResponse.status}\n`);
        }

        // ========== 4. DIRECTORY PARTNERS ==========
        console.log('4. VERIFYING DIRECTORY PARTNERS');
        console.log('─'.repeat(60));
        const [dbPartners] = await connection.execute('SELECT * FROM directory_partners ORDER BY id');
        console.log(`   Database: ${dbPartners.length} partners`);

        const partnersResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/directories/partners',
            method: 'GET'
        });

        if (partnersResponse.status === 200) {
            const apiPartners = partnersResponse.data.partners || [];
            console.log(`   API: ${apiPartners.length} partners`);

            if (dbPartners.length !== apiPartners.length) {
                mismatches.push(`Partners: Count mismatch - DB=${dbPartners.length}, API=${apiPartners.length}`);
                console.log(`   ❌ COUNT MISMATCH!\n`);
            } else {
                let partnerMismatches = 0;
                dbPartners.forEach(dbPartner => {
                    const apiPartner = apiPartners.find(p => p.id === dbPartner.id);
                    if (!apiPartner) {
                        partnerMismatches++;
                        mismatches.push(`Partners: Partner ID ${dbPartner.id} (${dbPartner.email || dbPartner.partner_name}) not found in API`);
                    }
                });
                if (partnerMismatches === 0) {
                    console.log(`   ✅ All ${dbPartners.length} partners match exactly\n`);
                } else {
                    console.log(`   ❌ ${partnerMismatches} partner(s) have mismatches\n`);
                }
            }
        } else {
            mismatches.push(`Partners: API error ${partnersResponse.status}`);
            console.log(`   ❌ API error: ${partnersResponse.status}\n`);
        }

        // ========== 5. DIRECTORY BUSINESSES ==========
        console.log('5. VERIFYING DIRECTORY BUSINESSES');
        console.log('─'.repeat(60));
        const [dbDirBusinesses] = await connection.execute('SELECT * FROM directory_businesses ORDER BY id');
        console.log(`   Database: ${dbDirBusinesses.length} directory businesses`);

        const dirBizResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/directories/business',
            method: 'GET'
        });

        if (dirBizResponse.status === 200) {
            const apiDirBusinesses = dirBizResponse.data.businesses || [];
            console.log(`   API: ${apiDirBusinesses.length} directory businesses`);

            if (dbDirBusinesses.length !== apiDirBusinesses.length) {
                mismatches.push(`Directory Businesses: Count mismatch - DB=${dbDirBusinesses.length}, API=${apiDirBusinesses.length}`);
                console.log(`   ❌ COUNT MISMATCH!\n`);
                
                // Show what's missing
                console.log('   Database IDs:', dbDirBusinesses.map(b => b.id).join(', '));
                console.log('   API IDs:', apiDirBusinesses.map(b => b.id).join(', '));
                console.log('');
            } else {
                let bizMismatches = 0;
                dbDirBusinesses.forEach(dbBiz => {
                    const apiBiz = apiDirBusinesses.find(b => b.id === dbBiz.id);
                    if (!apiBiz) {
                        bizMismatches++;
                        mismatches.push(`Directory Businesses: Business ID ${dbBiz.id} (${dbBiz.business_name}) not found in API`);
                    } else if (dbBiz.business_name !== apiBiz.business_name) {
                        bizMismatches++;
                        mismatches.push(`Directory Businesses: ID ${dbBiz.id} name mismatch - DB="${dbBiz.business_name}", API="${apiBiz.business_name}"`);
                    }
                });
                if (bizMismatches === 0) {
                    console.log(`   ✅ All ${dbDirBusinesses.length} directory businesses match exactly\n`);
                } else {
                    console.log(`   ❌ ${bizMismatches} business(es) have mismatches\n`);
                }
            }
        } else {
            mismatches.push(`Directory Businesses: API error ${dirBizResponse.status}`);
            console.log(`   ❌ API error: ${dirBizResponse.status}\n`);
        }

        // ========== SUMMARY ==========
        console.log('============================================================');
        console.log('VERIFICATION SUMMARY');
        console.log('============================================================\n');

        if (mismatches.length === 0) {
            console.log('✅ ALL DATA MATCHES EXACTLY BETWEEN DATABASE AND API!\n');
        } else {
            console.log(`❌ FOUND ${mismatches.length} MISMATCH(ES):\n`);
            mismatches.forEach((mismatch, idx) => {
                console.log(`${idx + 1}. ${mismatch}`);
            });
            console.log('');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

verifyExactMatch();




