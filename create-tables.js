// Create Database Tables Script
// Run with: node create-tables.js

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
// Using proxy connection since internal connection is not accessible externally
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

async function createTables() {
    let connection;
    
    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected successfully!\n');
        
        // Read the schema file
        const schemaPath = path.join(__dirname, 'database_schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }
        
        let schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        console.log('📄 Schema file loaded.\n');
        
        // Remove DELIMITER commands and fix procedure endings
        schemaSQL = schemaSQL.replace(/DELIMITER \/\/\s*/g, '');
        schemaSQL = schemaSQL.replace(/DELIMITER ;\s*/g, '');
        // Replace END // with END;
        schemaSQL = schemaSQL.replace(/END\s*\/\//g, 'END;');
        
        // Split the SQL into statements
        const statements = [];
        let currentStatement = '';
        let inProcedure = false;
        let parenCount = 0;
        
        const lines = schemaSQL.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            // Skip comments and empty lines
            if (line.startsWith('--') || line === '') {
                continue;
            }
            
            // Check if we're starting a procedure
            if (line.toUpperCase().includes('CREATE PROCEDURE')) {
                inProcedure = true;
                parenCount = 0;
            }
            
            // Handle procedure statements
            if (inProcedure) {
                // Count parentheses to track nested structures
                parenCount += (line.match(/\(/g) || []).length;
                parenCount -= (line.match(/\)/g) || []).length;
                
                currentStatement += line + '\n';
                
                // Procedure ends with END;
                if (line.toUpperCase().trim() === 'END;' || line.toUpperCase().trim() === 'END') {
                    // Remove trailing semicolon if present and add it properly
                    currentStatement = currentStatement.replace(/;\s*$/, '') + ';';
                    statements.push(currentStatement.trim());
                    currentStatement = '';
                    inProcedure = false;
                    continue;
                }
            } else {
                // Regular SQL statements
                currentStatement += line + ' ';
                
                // If line ends with semicolon, it's a complete statement
                if (line.endsWith(';')) {
                    const stmt = currentStatement.trim();
                    if (stmt && !stmt.startsWith('DELIMITER') && stmt.length > 0) {
                        statements.push(stmt);
                    }
                    currentStatement = '';
                }
            }
        }
        
        // Add any remaining statement
        if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
        }
        
        console.log(`📝 Found ${statements.length} SQL statements to execute.\n`);
        console.log('🔨 Creating tables, views, and procedures...\n');
        
        // Execute statements one by one for better error handling
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            if (!stmt || stmt.trim() === '') continue;
            
            try {
                await connection.query(stmt);
                // Show progress for major operations
                if (stmt.toUpperCase().includes('CREATE TABLE')) {
                    const tableMatch = stmt.match(/CREATE TABLE\s+(\w+)/i);
                    if (tableMatch) {
                        console.log(`   ✅ Created table: ${tableMatch[1]}`);
                    }
                } else if (stmt.toUpperCase().includes('CREATE VIEW')) {
                    const viewMatch = stmt.match(/CREATE VIEW\s+(\w+)/i);
                    if (viewMatch) {
                        console.log(`   ✅ Created view: ${viewMatch[1]}`);
                    }
                } else if (stmt.toUpperCase().includes('CREATE PROCEDURE')) {
                    const procMatch = stmt.match(/CREATE PROCEDURE\s+(\w+)/i);
                    if (procMatch) {
                        console.log(`   ✅ Created procedure: ${procMatch[1]}`);
                    }
                }
            } catch (error) {
                // Skip errors for existing objects (IF NOT EXISTS should handle this, but just in case)
                if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
                    error.code === 'ER_DUP_ENTRY' ||
                    error.code === 'ER_DUP_KEYNAME') {
                    console.log(`   ⚠️  Skipped (already exists): ${error.message.split('\n')[0]}`);
                    continue;
                }
                throw error;
            }
        }
        
        console.log('✅ All tables created successfully!\n');
        
        // Verify tables were created
        console.log('🔍 Verifying tables...\n');
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME, TABLE_ROWS 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? 
            ORDER BY TABLE_NAME
        `, [dbConfig.database]);
        
        console.log(`✅ Found ${tables.length} tables:\n`);
        tables.forEach((table, index) => {
            console.log(`   ${index + 1}. ${table.TABLE_NAME} (${table.TABLE_ROWS || 0} rows)`);
        });
        
        // Check for views
        const [views] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.VIEWS 
            WHERE TABLE_SCHEMA = ?
            ORDER BY TABLE_NAME
        `, [dbConfig.database]);
        
        if (views.length > 0) {
            console.log(`\n✅ Found ${views.length} views:\n`);
            views.forEach((view, index) => {
                console.log(`   ${index + 1}. ${view.TABLE_NAME}`);
            });
        }
        
        // Check for stored procedures
        const [procedures] = await connection.execute(`
            SELECT ROUTINE_NAME 
            FROM information_schema.ROUTINES 
            WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
            ORDER BY ROUTINE_NAME
        `, [dbConfig.database]);
        
        if (procedures.length > 0) {
            console.log(`\n✅ Found ${procedures.length} stored procedures:\n`);
            procedures.forEach((proc, index) => {
                console.log(`   ${index + 1}. ${proc.ROUTINE_NAME}`);
            });
        }
        
        // Test default admin user
        console.log('\n🔍 Checking default admin user...');
        const [adminUsers] = await connection.execute(
            'SELECT id, username, email, role FROM admin_users WHERE username = ?',
            ['admin']
        );
        
        if (adminUsers.length > 0) {
            console.log('✅ Default admin user created:');
            console.log(`   Username: ${adminUsers[0].username}`);
            console.log(`   Email: ${adminUsers[0].email}`);
            console.log(`   Role: ${adminUsers[0].role}`);
            console.log('   ⚠️  Remember to change the default password in production!');
        }
        
        // Test settings
        console.log('\n🔍 Checking default settings...');
        const [settings] = await connection.execute(
            'SELECT setting_key, setting_value FROM settings ORDER BY setting_key'
        );
        
        if (settings.length > 0) {
            console.log(`✅ Found ${settings.length} default settings:`);
            settings.forEach(setting => {
                console.log(`   - ${setting.setting_key}: ${setting.setting_value}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ Database setup completed successfully!');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n❌ Error creating tables:');
        console.error('   Message:', error.message);
        console.error('   Code:', error.code);
        
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.error('\n💡 Tip: Some tables already exist. You may need to drop them first.');
            console.error('   Or modify the script to handle existing tables.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Tip: Check your database credentials.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Tip: Check your database host and port.');
            console.error('   Try using the proxy connection if internal connection fails.');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Connection closed.');
        }
    }
}

// Run the script
createTables().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

