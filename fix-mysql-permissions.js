// Fix MySQL Permissions for Railway Database
// This script connects to Railway MySQL and fixes user permissions
// Run: node fix-mysql-permissions.js

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 10000,
    multipleStatements: true // Allow multiple SQL statements
};

if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = {
        rejectUnauthorized: false
    };
}

async function fixPermissions() {
    let connection;
    
    try {
        console.log('🔧 Fixing MySQL Permissions for Railway Database\n');
        console.log('='.repeat(60));
        
        console.log('\n📋 Connection Details:');
        console.log(`   Host: ${dbConfig.host}`);
        console.log(`   Port: ${dbConfig.port}`);
        console.log(`   User: ${dbConfig.user}`);
        console.log(`   Database: ${dbConfig.database}`);
        
        console.log('\n🔌 Attempting to connect...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected successfully!\n');
        
        // Check current user permissions
        console.log('📋 Checking current user permissions...');
        const [users] = await connection.execute(
            "SELECT User, Host FROM mysql.user WHERE User = ?",
            [dbConfig.user]
        );
        
        if (users.length === 0) {
            console.log('⚠️  User not found in mysql.user table');
        } else {
            console.log('   Current user permissions:');
            users.forEach(u => {
                console.log(`   - User: ${u.User}, Host: ${u.Host}`);
            });
        }
        
        // Grant permissions
        console.log('\n🔧 Granting permissions...');
        const password = dbConfig.password;
        
        // Try to grant privileges - this will work if we can connect
        // Note: IDENTIFIED BY in GRANT is deprecated in MySQL 8.0+, but we'll try it first
        try {
            await connection.execute(
                `GRANT ALL PRIVILEGES ON *.* TO ?@'%' IDENTIFIED BY ?`,
                [dbConfig.user, password]
            );
            console.log('✅ Granted privileges using IDENTIFIED BY (MySQL 5.7 style)');
        } catch (grantError) {
            // If that fails, try MySQL 8.0+ syntax
            if (grantError.code === 'ER_PARSE_ERROR' || grantError.message.includes('IDENTIFIED')) {
                console.log('   Trying MySQL 8.0+ syntax...');
                try {
                    // First, update the user password
                    await connection.execute(
                        `ALTER USER ?@'%' IDENTIFIED BY ?`,
                        [dbConfig.user, password]
                    );
                    // Then grant privileges
                    await connection.execute(
                        `GRANT ALL PRIVILEGES ON *.* TO ?@'%'`,
                        [dbConfig.user]
                    );
                    console.log('✅ Granted privileges using MySQL 8.0+ syntax');
                } catch (alterError) {
                    console.log('⚠️  Could not alter user, trying alternative approach...');
                    // Try creating/updating user with CREATE USER IF NOT EXISTS
                    try {
                        await connection.execute(
                            `CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?`,
                            [dbConfig.user, password]
                        );
                        await connection.execute(
                            `GRANT ALL PRIVILEGES ON *.* TO ?@'%'`,
                            [dbConfig.user]
                        );
                        console.log('✅ Created/updated user and granted privileges');
                    } catch (createError) {
                        throw createError;
                    }
                }
            } else {
                throw grantError;
            }
        }
        
        // Flush privileges
        console.log('🔄 Flushing privileges...');
        await connection.execute('FLUSH PRIVILEGES');
        console.log('✅ Privileges flushed\n');
        
        // Verify the fix
        console.log('✅ Permissions fixed successfully!');
        console.log('\n💡 You can now test the connection with:');
        console.log('   node fix-railway-connection.js');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Failed to fix permissions!');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n🔴 Cannot fix permissions - access denied!');
            console.error('\nThis means:');
            console.error('   1. The password in .env might be incorrect');
            console.error('   2. The user doesn\'t have permission to grant privileges');
            console.error('   3. Railway may need you to use a different connection method');
            
            console.error('\n💡 Alternative Solutions:');
            console.error('   1. Verify password in Railway dashboard matches .env exactly');
            console.error('   2. Try connecting with Railway CLI:');
            console.error('      railway connect mysql');
            console.error('   3. Use an external MySQL client:');
            console.error(`      mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p`);
            console.error('   4. Check Railway documentation for Database View feature');
        }
        
        return false;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Connection closed.');
        }
    }
}

// Run the fix
fixPermissions()
    .then(success => {
        if (success) {
            console.log('\n' + '='.repeat(60));
            console.log('✅ SUCCESS! Permissions have been fixed.');
            console.log('   Test your connection now with: node fix-railway-connection.js');
            process.exit(0);
        } else {
            console.log('\n' + '='.repeat(60));
            console.log('❌ Could not fix permissions automatically.');
            console.log('   See error messages above for alternative solutions.');
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('\n❌ Unexpected error:', err);
        process.exit(1);
    });

