// This script can be run in the browser console on the admin dashboard
// to check what the dashboard is actually displaying vs what the API returns

async function testDashboardDisplay() {
    console.log('============================================================');
    console.log('TESTING DASHBOARD DISPLAY vs API');
    console.log('============================================================\n');

    // Get admin token
    const adminToken = sessionStorage.getItem('adminToken');
    if (!adminToken) {
        console.log('❌ No admin token found. Please log in first.');
        return;
    }

    console.log('✅ Admin token found\n');

    // Get stats from API
    try {
        const response = await fetch('http://localhost:3000/api/admin/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) {
            console.log(`❌ API error: ${response.status}`);
            return;
        }

        const apiStats = await response.json();
        console.log('1. API STATS:');
        console.log('─'.repeat(60));
        console.log(`   Events: ${apiStats.total_events}`);
        console.log(`   Blog Posts: ${apiStats.total_blog_posts}`);
        console.log(`   Directory Entries: ${apiStats.total_directory_entries}`);
        console.log(`   Registered Users: ${apiStats.total_registered_users}`);
        console.log(`   Members: ${apiStats.total_members}`);
        console.log(`   Registered Businesses: ${apiStats.total_registered_businesses}\n`);

        // Get what's displayed on dashboard
        console.log('2. DASHBOARD DISPLAY:');
        console.log('─'.repeat(60));
        const statEvents = document.getElementById('statEvents')?.textContent || 'N/A';
        const statBlogPosts = document.getElementById('statBlogPosts')?.textContent || 'N/A';
        const statDirectoryEntries = document.getElementById('statDirectoryEntries')?.textContent || 'N/A';
        const statRegisteredUsers = document.getElementById('statRegisteredUsers')?.textContent || 'N/A';
        const statMembers = document.getElementById('statMembers')?.textContent || 'N/A';
        const statRegisteredBusinesses = document.getElementById('statRegisteredBusinesses')?.textContent || 'N/A';

        console.log(`   Events: ${statEvents}`);
        console.log(`   Blog Posts: ${statBlogPosts}`);
        console.log(`   Directory Entries: ${statDirectoryEntries}`);
        console.log(`   Registered Users: ${statRegisteredUsers}`);
        console.log(`   Members: ${statMembers}`);
        console.log(`   Registered Businesses: ${statRegisteredBusinesses}\n`);

        // Compare
        console.log('3. COMPARISON:');
        console.log('─'.repeat(60));
        
        const comparisons = [
            { name: 'Events', api: apiStats.total_events, display: statEvents },
            { name: 'Blog Posts', api: apiStats.total_blog_posts, display: statBlogPosts },
            { name: 'Directory Entries', api: apiStats.total_directory_entries, display: statDirectoryEntries },
            { name: 'Registered Users', api: apiStats.total_registered_users, display: statRegisteredUsers },
            { name: 'Members', api: apiStats.total_members, display: statMembers },
            { name: 'Registered Businesses', api: apiStats.total_registered_businesses, display: statRegisteredBusinesses }
        ];

        let allMatch = true;
        comparisons.forEach(comp => {
            const displayNum = parseInt(comp.display) || 0;
            if (comp.api === displayNum) {
                console.log(`   ✅ ${comp.name}: API=${comp.api}, Display=${comp.display} (MATCH)`);
            } else {
                console.log(`   ❌ ${comp.name}: API=${comp.api}, Display=${comp.display} (MISMATCH!)`);
                allMatch = false;
            }
        });

        console.log('');
        if (allMatch) {
            console.log('✅ Dashboard display matches API!');
        } else {
            console.log('❌ Dashboard display does NOT match API!');
            console.log('\n💡 Try calling: updateOverviewStats()');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Make it available globally
window.testDashboardDisplay = testDashboardDisplay;

console.log('✅ Test function loaded. Run: testDashboardDisplay()');




