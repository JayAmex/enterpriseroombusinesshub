# Database Setup Guide

This guide will help you set up and test the database connection for Enterprise Room Business Hub.

## Prerequisites

1. **Node.js** installed (version 14 or higher)
2. **MySQL client** (optional, for manual connection testing)
3. Database credentials (provided below)

## Database Credentials

**⚠️ IMPORTANT: Database credentials are now stored in environment variables.**

Create a `.env` file in the project root with the following variables:

```
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
JWT_SECRET=your-jwt-secret-key
PORT=3000
```

See `.env.example` for a template.

## Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

   This will install the `mysql2` package needed for database connections.

## Testing the Connection

1. **Test database connection:**
   ```bash
   npm run test-connection
   ```
   
   Or directly:
   ```bash
   node test-db-connection.js
   ```

   This script will:
   - Attempt to connect to the database
   - Test a simple query
   - Display MySQL version
   - Try both internal and proxy connections if the first fails

## Creating the Tables

1. **Create all database tables:**
   ```bash
   npm run create-tables
   ```
   
   Or directly:
   ```bash
   node create-tables.js
   ```

   This script will:
   - Connect to the database
   - Read `database_schema.sql`
   - Create all tables, views, and stored procedures
   - Verify the creation
   - Display a summary of created objects

2. **Run both tests and table creation:**
   ```bash
   npm run setup
   ```

## Troubleshooting

### Connection Issues

**Error: ECONNREFUSED**
- Check if you're using the correct host and port
- Try the proxy connection: `shortline.proxy.rlwy.net:46250`
- Verify the database is running and accessible

**Error: ER_ACCESS_DENIED_ERROR**
- Verify username and password are correct
- Check if the user has proper permissions

**Error: ER_BAD_DB_ERROR**
- The database might not exist
- You may need to create it first:
  ```sql
  CREATE DATABASE IF NOT EXISTS railway;
  ```

### Table Creation Issues

**Error: ER_TABLE_EXISTS_ERROR**
- Some tables already exist
- You can either:
  1. Drop existing tables and recreate
  2. Modify the script to skip existing tables
  3. Use `CREATE TABLE IF NOT EXISTS` in the schema

**Error: ER_DUP_ENTRY**
- Default data already exists
- The script will continue, but you may see warnings

## Manual Connection (Optional)

You can also connect manually using MySQL client:

```bash
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p $DB_NAME
# Enter password: (use your DB_PASSWORD from .env file)
```

Or using the proxy (if applicable):
```bash
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p $DB_NAME
```

## Verifying Tables

After running the setup, you can verify tables were created:

```sql
-- List all tables
SHOW TABLES;

-- Check a specific table structure
DESCRIBE users;

-- Check default admin user
SELECT * FROM admin_users WHERE username = 'admin';

-- Check settings
SELECT * FROM settings;
```

## Next Steps

After successful setup:

1. **Change default admin password** in production
2. **Update database credentials** in your application
3. **Test API endpoints** with the database
4. **Migrate existing localStorage data** to the database (if needed)

## Files

- `test-db-connection.js` - Tests database connection
- `create-tables.js` - Creates all tables from schema
- `database_schema.sql` - Complete database schema
- `package.json` - Node.js dependencies

## Support

If you encounter issues:
1. Check the error messages in the console
2. Verify database credentials
3. Ensure the database is accessible from your network
4. Check Railway dashboard for database status



