const mysql = require('mysql2/promise');
const dbConfig = require('./db-config');

async function addSocialMediaFields() {
    let connection;
    console.log('============================================================');
    console.log('ADDING SOCIAL MEDIA PLATFORM FIELDS');
    console.log('============================================================\n');

    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // Check if columns already exist
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'railway' 
            AND TABLE_NAME = 'directory_members' 
            AND COLUMN_NAME IN ('facebook_url', 'instagram_url', 'tiktok_url', 'threads_url', 'youtube_url', 'reddit_url')
        `);

        const existingColumns = columns.map(col => col.COLUMN_NAME);
        const fieldsToAdd = [
            { name: 'facebook_url', after: 'twitter_url' },
            { name: 'instagram_url', after: 'facebook_url' },
            { name: 'tiktok_url', after: 'instagram_url' },
            { name: 'threads_url', after: 'tiktok_url' },
            { name: 'youtube_url', after: 'threads_url' },
            { name: 'reddit_url', after: 'youtube_url' }
        ];

        for (const field of fieldsToAdd) {
            if (existingColumns.includes(field.name)) {
                console.log(`   ℹ️  Column ${field.name} already exists`);
            } else {
                try {
                    await connection.execute(`
                        ALTER TABLE directory_members 
                        ADD COLUMN ${field.name} VARCHAR(500) NULL AFTER ${field.after}
                    `);
                    console.log(`   ✅ Added column: ${field.name}`);
                } catch (error) {
                    if (error.code === 'ER_DUP_FIELDNAME') {
                        console.log(`   ℹ️  Column ${field.name} already exists`);
                    } else {
                        throw error;
                    }
                }
            }
        }

        console.log('\n============================================================');
        console.log('✅ Social media fields added successfully');
        console.log('============================================================\n');
        console.log('📝 Added fields:');
        console.log('   - facebook_url');
        console.log('   - instagram_url');
        console.log('   - tiktok_url');
        console.log('   - threads_url');
        console.log('   - youtube_url');
        console.log('   - reddit_url\n');

    } catch (error) {
        console.error('❌ Error adding social media fields:', error);
    } finally {
        if (connection) await connection.end();
    }
}

addSocialMediaFields().catch(console.error);




