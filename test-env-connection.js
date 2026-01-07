// Test database connection using .env file
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 10000
};

// Add SSL only if DB_SSL is explicitly set to 'true'
if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = {
        rejectUnauthorized: false
    };
}

async function testConnection() {
    let connection;
    
    try {
        console.log('🔌 Testing database connection with .env credentials...');
        console.log(`   Host: ${dbConfig.host}`);
        console.log(`   Port: ${dbConfig.port}`);
        console.log(`   Database: ${dbConfig.database}`);
        console.log(`   User: ${dbConfig.user}`);
        console.log(`   Password: ${dbConfig.password ? '***' + dbConfig.password.slice(-4) : 'NOT SET'}`);
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connection successful!');
        
        const [rows] = await connection.execute('SELECT 1 as test, NOW() as server_time, DATABASE() as current_database');
        console.log('✅ Test query executed successfully!');
        console.log('   Result:', rows[0]);
        
        return true;
    } catch (error) {
        console.error('❌ Database connection failed!');
        console.error('   Error:', error.message);
        console.error('   Code:', error.code);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Possible issues:');
            console.error('   1. Password might be incorrect');
            console.error('   2. User might not have permission from your IP');
            console.error('   3. Railway might need the password to be reset in their dashboard');
            console.error('\n   Please verify:');
            console.error('   - The password in Railway dashboard matches your .env file');
            console.error('   - Railway allows connections from your IP');
        }
        
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testConnection().catch(console.error);

