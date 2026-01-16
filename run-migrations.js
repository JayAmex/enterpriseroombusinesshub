// Run Database Migrations
// This script runs the migration SQL files to add new tables

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    connectTimeout: 10000,
};

async function runMigrations() {
    let connection;
    
    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected successfully!\n');
        
        // Migration files to run (in order)
        const migrationFiles = [
            'add-template-tables.sql',
            'add-builtin-tools-table.sql'
        ];
        
        for (const migrationFile of migrationFiles) {
            const migrationPath = path.join(__dirname, migrationFile);
            
            if (!fs.existsSync(migrationPath)) {
                console.warn(`⚠️  Migration file not found: ${migrationFile}, skipping...`);
                continue;
            }
            
            console.log(`📄 Running migration: ${migrationFile}...`);
            
            let migrationSQL = fs.readFileSync(migrationPath, 'utf8');
            
            // Remove DELIMITER commands and fix procedure endings
            migrationSQL = migrationSQL.replace(/DELIMITER \/\/\s*/g, '');
            migrationSQL = migrationSQL.replace(/DELIMITER ;\s*/g, '');
            migrationSQL = migrationSQL.replace(/END\s*\/\//g, 'END;');
            
            // Split by semicolons but handle procedures and multi-line statements
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));
            
            let successCount = 0;
            let errorCount = 0;
            
            for (const statement of statements) {
                if (statement.trim().length === 0 || statement.startsWith('--')) {
                    continue;
                }
                
                try {
                    await connection.execute(statement);
                    successCount++;
                } catch (error) {
                    // Ignore "table already exists" and "duplicate entry" errors
                    if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
                        error.code === 'ER_DUP_ENTRY' ||
                        error.code === 'ER_DUP_KEYNAME' ||
                        error.message.includes('already exists')) {
                        console.log(`   ⚠️  ${error.code}: ${error.message.split('\n')[0]}`);
                        successCount++;
                    } else {
                        console.error(`   ❌ Error: ${error.code}`);
                        console.error(`   ${error.message.split('\n')[0]}`);
                        errorCount++;
                    }
                }
            }
            
            console.log(`   ✅ Completed: ${successCount} statements, ${errorCount} errors\n`);
        }
        
        // Verify tables were created
        console.log('🔍 Verifying tables...');
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME IN ('templates', 'template_downloads', 'builtin_tools')
            ORDER BY TABLE_NAME
        `, [process.env.DB_NAME]);
        
        console.log('\n📊 Created/Verified Tables:');
        tables.forEach(table => {
            console.log(`   ✅ ${table.TABLE_NAME}`);
        });
        
        if (tables.length < 3) {
            console.log('\n⚠️  Some tables may not have been created. Check errors above.');
        }
        
        // Check template count
        try {
            const [templateCount] = await connection.execute('SELECT COUNT(*) as count FROM templates');
            console.log(`\n📄 Templates in database: ${templateCount[0].count}`);
        } catch (e) {
            console.log('\n⚠️  Could not count templates (table may not exist yet)');
        }
        
        // Check builtin tools count
        try {
            const [toolsCount] = await connection.execute('SELECT COUNT(*) as count FROM builtin_tools');
            console.log(`🔧 Built-in tools in database: ${toolsCount[0].count}`);
        } catch (e) {
            console.log('⚠️  Could not count built-in tools (table may not exist yet)');
        }
        
        console.log('\n✅ Migration completed!');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('Error code:', error.code);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

// Run migrations
runMigrations();
