// Database configuration utility
// Loads credentials from environment variables
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || (() => {
        console.error('❌ ERROR: DB_HOST not set in environment variables!');
        console.error('   Please create a .env file with your database credentials.');
        console.error('   See .env.example for reference.');
        process.exit(1);
    })(),
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || (() => {
        console.error('❌ ERROR: DB_USER not set in environment variables!');
        process.exit(1);
    })(),
    password: process.env.DB_PASSWORD || (() => {
        console.error('❌ ERROR: DB_PASSWORD not set in environment variables!');
        process.exit(1);
    })(),
    database: process.env.DB_NAME || (() => {
        console.error('❌ ERROR: DB_NAME not set in environment variables!');
        process.exit(1);
    })(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Add SSL only if DB_SSL is explicitly set to 'true'
if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = {
        rejectUnauthorized: false
    };
}

module.exports = dbConfig;

