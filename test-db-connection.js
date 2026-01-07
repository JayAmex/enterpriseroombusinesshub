// Database Connection Test Script
// Run with: node test-db-connection.js
// Uses environment variables from .env file

require('dotenv').config();
const mysql = require('mysql2/promise');

// Database configuration from environment variables
const dbConfig = {
    host: process.env.DB_HOST || 'shortline.proxy.rlwy.net',
    port: parseInt(process.env.DB_PORT, 10) || 46250,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || (() => {
        console.error('❌ ERROR: DB_PASSWORD not set in environment variables!');
        console.error('   Please create a .env file with your database credentials.');
        process.exit(1);
    })(),
    database: process.env.DB_NAME || 'railway',
    multipleStatements: true, // Allow multiple SQL statements
    connectTimeout: 10000 // 10 seconds timeout
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
        console.log('🔌 Attempting to connect to database...');
        console.log(`   Host: ${dbConfig.host}`);
        console.log(`   Port: ${dbConfig.port}`);
        console.log(`   Database: ${dbConfig.database}`);
        console.log(`   User: ${dbConfig.user}`);
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connection successful!');
        
        // Test query
        const [rows] = await connection.execute('SELECT 1 as test, NOW() as server_time, DATABASE() as current_database');
        console.log('✅ Test query executed successfully!');
        console.log('   Result:', rows[0]);
        
        // Check MySQL version
        const [version] = await connection.execute('SELECT VERSION() as version');
        console.log(`✅ MySQL Version: ${version[0].version}`);
        
        return true;
    } catch (error) {
        console.error('❌ Database connection failed!');
        console.error('   Error:', error.message);
        console.error('   Code:', error.code);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Tip: Check if the host and port are correct.');
            console.error('   Try using the proxy host: shortline.proxy.rlwy.net:46250');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Tip: Check if the username and password are correct.');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('\n💡 Tip: Database does not exist. You may need to create it first.');
        }
        
        return false;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Connection closed.');
        }
    }
}

// Run the test
testConnection().catch(console.error);

