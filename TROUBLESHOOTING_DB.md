# Database Connection Troubleshooting Guide

## Current Error
```
Access denied for user 'root'@'100.64.0.5' (using password: YES)
```

**Note:** The IP address (100.64.0.5) is Railway's internal proxy IP and changes on each connection. This is normal.

## Step-by-Step Fix

### 1. Verify Password in Railway Dashboard
1. Go to your Railway dashboard
2. Navigate to your MySQL service
3. Check the **Variables** or **Connect** tab
4. Copy the password **exactly** as shown (no extra spaces, quotes, or characters)

### 2. Update .env File
Open your `.env` file and ensure it matches Railway exactly:

```env
DB_HOST=shortline.proxy.rlwy.net
DB_PORT=46250
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD_HERE
DB_NAME=railway
DB_SSL=false
```

**Important:**
- No quotes around the password
- No spaces before or after the password
- Copy the password exactly from Railway

### 3. Check MySQL User Permissions
The error shows connection from IP `100.64.0.x`. Railway might need to grant permissions.

**Option A: Use Railway CLI (Recommended)**
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Connect: `railway connect mysql`
4. Run SQL commands:
```sql
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'YOUR_PASSWORD';
FLUSH PRIVILEGES;
```

**Option B: Use External MySQL Client**
1. Install MySQL client
2. Connect: `mysql -h shortline.proxy.rlwy.net -P 46250 -u root -p`
3. Enter password and run GRANT commands

**Option C: Use Railway Database View**
1. Railway dashboard → MySQL service → Database View tab
2. Run SQL queries through the web interface

**Option D: Check if password was reset**
- If you changed the password in Railway, the user permissions might have been reset
- You may need to recreate the user or grant permissions again

### 4. Test Connection
Run the test script:
```bash
node test-env-connection.js
```

### 5. Common Issues

#### Issue: Password has special characters
- If your password contains special characters, they might need to be URL-encoded
- Try copying the password directly from Railway (don't type it manually)

#### Issue: Password was changed but .env not updated
- Double-check that the password in `.env` matches Railway exactly

#### Issue: Railway requires SSL
- Try setting `DB_SSL=true` in `.env` (though Railway proxy usually doesn't need SSL)

#### Issue: Wrong port
- Railway proxy port is usually `46250`
- Internal MySQL port is `3306` (but you're using proxy, so `46250` is correct)

### 6. Still Not Working?
1. **Reset password in Railway:**
   - Go to Railway MySQL service
   - Generate a new password
   - Update `.env` with the new password
   - Test again

2. **Check Railway logs:**
   - Look at Railway MySQL service logs for connection attempts
   - See if there are any error messages

3. **Verify connection string:**
   - Railway dashboard should show a connection string
   - Compare it with your `.env` values

## Quick Test Commands

```bash
# Check .env values
node diagnose-env.js

# Test connection
node test-env-connection.js

# Start server
node server.js
```

