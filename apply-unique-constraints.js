const mysql = require('mysql2/promise');
const dbConfig = require('./db-config');

async function applyUniqueConstraints() {
    let connection;
    console.log('============================================================');
    console.log('APPLYING UNIQUE CONSTRAINTS TO PREVENT DUPLICATES');
    console.log('============================================================\n');

    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        const constraints = [
            {
                name: 'Directory Members: unique name + organization',
                sql: `ALTER TABLE directory_members 
                      ADD UNIQUE KEY unique_member_name_org (name(100), organization(100))`,
                checkDuplicate: `SELECT COUNT(*) as count FROM (
                    SELECT COUNT(*) as cnt 
                    FROM directory_members 
                    GROUP BY LOWER(TRIM(name)), LOWER(TRIM(organization)) 
                    HAVING cnt > 1
                ) as duplicates`
            },
            {
                name: 'Directory Partners: unique email',
                sql: `ALTER TABLE directory_partners 
                      ADD UNIQUE KEY unique_partner_email (email)`,
                checkDuplicate: `SELECT COUNT(*) as count FROM (
                    SELECT COUNT(*) as cnt 
                    FROM directory_partners 
                    WHERE email IS NOT NULL AND email != ''
                    GROUP BY LOWER(TRIM(email)) 
                    HAVING cnt > 1
                ) as duplicates`
            },
            {
                name: 'Directory Businesses: unique business name',
                sql: `ALTER TABLE directory_businesses 
                      ADD UNIQUE KEY unique_directory_business_name (business_name)`,
                checkDuplicate: `SELECT COUNT(*) as count FROM (
                    SELECT COUNT(*) as cnt 
                    FROM directory_businesses 
                    GROUP BY LOWER(TRIM(business_name)) 
                    HAVING cnt > 1
                ) as duplicates`
            },
            {
                name: 'Businesses: unique user_id + business_name',
                sql: `ALTER TABLE businesses 
                      ADD UNIQUE KEY unique_user_business_name (user_id, business_name(100))`,
                checkDuplicate: `SELECT COUNT(*) as count FROM (
                    SELECT COUNT(*) as cnt 
                    FROM businesses 
                    GROUP BY user_id, LOWER(TRIM(business_name)) 
                    HAVING cnt > 1
                ) as duplicates`
            }
        ];

        for (const constraint of constraints) {
            console.log(`\n📋 ${constraint.name}:`);
            console.log('────────────────────────────────────────────────────────────');
            
            try {
                // Check for existing duplicates
                const [duplicates] = await connection.execute(constraint.checkDuplicate);
                if (duplicates[0].count > 0) {
                    console.log(`   ⚠️  WARNING: Found ${duplicates[0].count} duplicate(s) in the table.`);
                    console.log(`   ⚠️  Please clean up duplicates before applying this constraint.`);
                    console.log(`   ⚠️  Skipping constraint for now.`);
                    continue;
                }

                // Try to add the constraint
                await connection.execute(constraint.sql);
                console.log(`   ✅ Constraint applied successfully`);
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    console.log(`   ℹ️  Constraint already exists`);
                } else if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`   ❌ Error: Duplicate entries found. Please clean up duplicates first.`);
                } else {
                    console.log(`   ❌ Error: ${error.message}`);
                }
            }
        }

        console.log('\n============================================================');
        console.log('✅ Unique constraints application completed');
        console.log('============================================================\n');
        console.log('📝 Note: Events and Blog Posts duplicate prevention');
        console.log('   is handled at the API level (case-insensitive comparison).\n');

    } catch (error) {
        console.error('❌ Error applying unique constraints:', error);
    } finally {
        if (connection) await connection.end();
    }
}

applyUniqueConstraints().catch(console.error);

