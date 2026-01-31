// Run connection test then create tables (one node command, no &&)
const { execSync } = require('child_process');
execSync('node test-db-connection.js', { stdio: 'inherit' });
execSync('node create-tables.js', { stdio: 'inherit' });
