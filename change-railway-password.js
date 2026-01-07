// Script to help change Railway MySQL password
// This connects with the current password and helps you change it
// Usage: node change-railway-password.js [NEW_PASSWORD]
//   If NEW_PASSWORD is provided, it will be used directly
//   Otherwise, it will prompt for the password

require('dotenv').config();
const mysql = require('mysql2/promise');
const readline = require('readline');

const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 10000,
    multipleStatements: true
};

if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = {
        rejectUnauthorized: false
    };
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function changePassword() {
    let connection;
    
    try {
        console.log('🔒 Railway MySQL Password Change Tool\n');
        console.log('='.repeat(60));
        console.log('\n⚠️  IMPORTANT: This will change the MySQL root password.');
        console.log('   Make sure to update Railway Variables and .env file after!\n');
        
        // Connect with current password
        console.log('🔌 Connecting to database with current password...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected successfully!\n');
        
        // Get new password from command line or prompt
        let newPassword;
        if (process.argv[2]) {
            newPassword = process.argv[2];
            console.log('📝 Using password from command line argument.\n');
        } else {
            console.log('📝 Enter your new strong password:');
            newPassword = await question('   New password: ');
            
            if (!newPassword || newPassword.length < 16) {
                console.log('\n⚠️  Warning: Password should be at least 16 characters long.');
                const confirm = await question('   Continue anyway? (y/N): ');
                if (confirm.toLowerCase() !== 'y') {
                    console.log('❌ Password change cancelled.');
                    return;
                }
            }
            
            // Confirm password
            const confirmPassword = await question('   Confirm password: ');
            if (newPassword !== confirmPassword) {
                console.log('\n❌ Passwords do not match! Password change cancelled.');
                return;
            }
        }
        
        if (!newPassword || newPassword.trim() === '') {
            console.log('❌ Password cannot be empty!');
            return;
        }
        
        newPassword = newPassword.trim();
        
        console.log('\n🔧 Changing password in MySQL...');
        
        // Escape the password for SQL (basic escaping)
        const escapedPassword = newPassword.replace(/'/g, "''");
        const escapedUser = dbConfig.user.replace(/'/g, "''");
        
        // Try MySQL 8.0+ syntax first
        try {
            await connection.query(
                `ALTER USER '${escapedUser}'@'%' IDENTIFIED BY '${escapedPassword}'`
            );
            console.log('✅ Password changed using ALTER USER (MySQL 8.0+)');
        } catch (alterError) {
            // Try MySQL 5.7 syntax
            try {
                await connection.query(
                    `SET PASSWORD FOR '${escapedUser}'@'%' = PASSWORD('${escapedPassword}')`
                );
                console.log('✅ Password changed using SET PASSWORD (MySQL 5.7)');
            } catch (setPasswordError) {
                // Try GRANT with IDENTIFIED BY
                try {
                    await connection.query(
                        `GRANT ALL PRIVILEGES ON *.* TO '${escapedUser}'@'%' IDENTIFIED BY '${escapedPassword}'`
                    );
                    console.log('✅ Password changed using GRANT (MySQL 5.7)');
                } catch (grantError) {
                    throw new Error(`Failed to change password. Error: ${grantError.message}`);
                }
            }
        }
        
        // Flush privileges
        await connection.execute('FLUSH PRIVILEGES');
        console.log('✅ Privileges flushed\n');
        
        // Test new password
        console.log('🧪 Testing new password...');
        await connection.end();
        
        // Try connecting with new password
        const newDbConfig = { ...dbConfig, password: newPassword };
        connection = await mysql.createConnection(newDbConfig);
        console.log('✅ Connection test with new password successful!\n');
        await connection.end();
        
        console.log('='.repeat(60));
        console.log('✅ SUCCESS! Password has been changed in MySQL.\n');
        console.log('📋 Next Steps:\n');
        console.log('1. Update Railway Variables:');
        console.log('   - Go to Railway dashboard → MySQL service → Variables');
        console.log('   - Update MYSQLPASSWORD or MYSQL_ROOT_PASSWORD');
        console.log(`   - Set it to: ${newPassword}\n`);
        console.log('2. Update your .env file:');
        console.log('   Run this command (PowerShell):');
        console.log(`   (Get-Content .env) -replace '^DB_PASSWORD=.*', 'DB_PASSWORD=${newPassword}' | Set-Content .env\n`);
        console.log('3. Test the connection:');
        console.log('   node fix-railway-connection.js\n');
        console.log('⚠️  IMPORTANT: Keep this password secure and never commit it to Git!\n');
        
    } catch (error) {
        console.error('\n❌ Failed to change password!');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n🔴 Cannot connect with current password!');
            console.error('   The password in .env might be incorrect.');
            console.error('   Verify the password in Railway Variables tab.');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
        rl.close();
    }
}

// Run the password change
changePassword().catch(err => {
    console.error('Unexpected error:', err);
    rl.close();
    process.exit(1);
});

