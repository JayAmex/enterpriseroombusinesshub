const mysql = require('mysql2/promise');

const dbConfig = require('./db-config');

async function removeDuplicates() {
    let connection;
    console.log('============================================================');
    console.log('REMOVING DUPLICATE ENTRIES FROM DATABASE');
    console.log('============================================================\n');

    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // 1. Remove duplicates from directory_members (name + organization)
        console.log('📋 Removing duplicates from directory_members (name + organization)...');
        console.log('────────────────────────────────────────────────────────────');
        try {
            // Find duplicates and keep the one with the lowest ID
            const [duplicates] = await connection.execute(`
                SELECT LOWER(TRIM(name)) as name_lower, LOWER(TRIM(organization)) as org_lower, 
                       GROUP_CONCAT(id ORDER BY id) as ids, COUNT(*) as cnt
                FROM directory_members 
                GROUP BY LOWER(TRIM(name)), LOWER(TRIM(organization)) 
                HAVING cnt > 1
            `);

            if (duplicates.length > 0) {
                console.log(`   Found ${duplicates.length} duplicate group(s)`);
                let totalDeleted = 0;
                
                for (const dup of duplicates) {
                    const ids = dup.ids.split(',').map(id => parseInt(id.trim()));
                    const keepId = ids[0]; // Keep the oldest (lowest ID)
                    const deleteIds = ids.slice(1); // Delete the rest
                    
                    if (deleteIds.length > 0) {
                        const placeholders = deleteIds.map(() => '?').join(',');
                        const [result] = await connection.execute(
                            `DELETE FROM directory_members WHERE id IN (${placeholders})`,
                            deleteIds
                        );
                        totalDeleted += result.affectedRows;
                        console.log(`   ✓ Kept ID ${keepId}, deleted ${result.affectedRows} duplicate(s)`);
                    }
                }
                console.log(`   ✅ Removed ${totalDeleted} duplicate member(s)\n`);
            } else {
                console.log('   ℹ️  No duplicates found\n');
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
        }

        // 2. Remove duplicates from directory_partners (email)
        console.log('📋 Removing duplicates from directory_partners (email)...');
        console.log('────────────────────────────────────────────────────────────');
        try {
            const [duplicates] = await connection.execute(`
                SELECT LOWER(TRIM(email)) as email_lower, 
                       GROUP_CONCAT(id ORDER BY id) as ids, COUNT(*) as cnt
                FROM directory_partners 
                WHERE email IS NOT NULL AND email != ''
                GROUP BY LOWER(TRIM(email)) 
                HAVING cnt > 1
            `);

            if (duplicates.length > 0) {
                console.log(`   Found ${duplicates.length} duplicate group(s)`);
                let totalDeleted = 0;
                
                for (const dup of duplicates) {
                    const ids = dup.ids.split(',').map(id => parseInt(id.trim()));
                    const keepId = ids[0]; // Keep the oldest (lowest ID)
                    const deleteIds = ids.slice(1); // Delete the rest
                    
                    if (deleteIds.length > 0) {
                        const placeholders = deleteIds.map(() => '?').join(',');
                        const [result] = await connection.execute(
                            `DELETE FROM directory_partners WHERE id IN (${placeholders})`,
                            deleteIds
                        );
                        totalDeleted += result.affectedRows;
                        console.log(`   ✓ Kept ID ${keepId}, deleted ${result.affectedRows} duplicate(s)`);
                    }
                }
                console.log(`   ✅ Removed ${totalDeleted} duplicate partner(s)\n`);
            } else {
                console.log('   ℹ️  No duplicates found\n');
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
        }

        // 3. Remove duplicates from directory_businesses (business_name)
        console.log('📋 Removing duplicates from directory_businesses (business_name)...');
        console.log('────────────────────────────────────────────────────────────');
        try {
            const [duplicates] = await connection.execute(`
                SELECT LOWER(TRIM(business_name)) as name_lower, 
                       GROUP_CONCAT(id ORDER BY id) as ids, COUNT(*) as cnt
                FROM directory_businesses 
                GROUP BY LOWER(TRIM(business_name)) 
                HAVING cnt > 1
            `);

            if (duplicates.length > 0) {
                console.log(`   Found ${duplicates.length} duplicate group(s)`);
                let totalDeleted = 0;
                
                for (const dup of duplicates) {
                    const ids = dup.ids.split(',').map(id => parseInt(id.trim()));
                    const keepId = ids[0]; // Keep the oldest (lowest ID)
                    const deleteIds = ids.slice(1); // Delete the rest
                    
                    if (deleteIds.length > 0) {
                        const placeholders = deleteIds.map(() => '?').join(',');
                        const [result] = await connection.execute(
                            `DELETE FROM directory_businesses WHERE id IN (${placeholders})`,
                            deleteIds
                        );
                        totalDeleted += result.affectedRows;
                        console.log(`   ✓ Kept ID ${keepId}, deleted ${result.affectedRows} duplicate(s)`);
                    }
                }
                console.log(`   ✅ Removed ${totalDeleted} duplicate directory business(es)\n`);
            } else {
                console.log('   ℹ️  No duplicates found\n');
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
        }

        // 4. Check for duplicates in businesses (user_id + business_name)
        console.log('📋 Checking businesses table (user_id + business_name)...');
        console.log('────────────────────────────────────────────────────────────');
        try {
            const [duplicates] = await connection.execute(`
                SELECT user_id, LOWER(TRIM(business_name)) as name_lower, 
                       GROUP_CONCAT(id ORDER BY id) as ids, COUNT(*) as cnt
                FROM businesses 
                GROUP BY user_id, LOWER(TRIM(business_name)) 
                HAVING cnt > 1
            `);

            if (duplicates.length > 0) {
                console.log(`   Found ${duplicates.length} duplicate group(s)`);
                let totalDeleted = 0;
                
                for (const dup of duplicates) {
                    const ids = dup.ids.split(',').map(id => parseInt(id.trim()));
                    const keepId = ids[0]; // Keep the oldest (lowest ID)
                    const deleteIds = ids.slice(1); // Delete the rest
                    
                    if (deleteIds.length > 0) {
                        const placeholders = deleteIds.map(() => '?').join(',');
                        const [result] = await connection.execute(
                            `DELETE FROM businesses WHERE id IN (${placeholders})`,
                            deleteIds
                        );
                        totalDeleted += result.affectedRows;
                        console.log(`   ✓ Kept ID ${keepId}, deleted ${result.affectedRows} duplicate(s)`);
                    }
                }
                console.log(`   ✅ Removed ${totalDeleted} duplicate business(es)\n`);
            } else {
                console.log('   ℹ️  No duplicates found\n');
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
        }

        console.log('============================================================');
        console.log('✅ Duplicate removal completed');
        console.log('============================================================\n');
        console.log('📝 Next step: Run "npm run apply-constraints" to apply unique constraints.\n');

    } catch (error) {
        console.error('❌ Error removing duplicates:', error);
    } finally {
        if (connection) await connection.end();
    }
}

removeDuplicates().catch(console.error);




