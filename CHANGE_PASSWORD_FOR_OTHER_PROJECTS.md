# Changing Railway MySQL Password for Multiple Projects

## Quick Guide

You can use the same `change-railway-password.js` script for all your Railway MySQL databases.

## Method 1: Copy Script to Each Project

1. Copy the script to each project:
   ```bash
   copy change-railway-password.js "path\to\project1\"
   copy change-railway-password.js "path\to\project2\"
   ```

2. For each project:
   ```bash
   cd "path\to\project"
   node change-railway-password.js [NEW_PASSWORD]
   ```

## Method 2: Use from Current Location

You can run the script from anywhere by providing the full path:

```bash
# From any directory
node "C:\Users\User\Downloads\Enterprise Website Pages\change-railway-password.js" [NEW_PASSWORD]
```

**Important:** Make sure you're in the project directory with the correct `.env` file, or set the working directory.

## Method 3: Use Helper Script

Use the `change-password-helper.js` script:

```bash
# Change password for a specific project
node change-password-helper.js "path\to\project" [NEW_PASSWORD]

# Or let it generate a password automatically
node change-password-helper.js "path\to\project"
```

## Step-by-Step for Each Project

### Project 1:
```bash
cd "path\to\project1"
node change-railway-password.js [NEW_PASSWORD_1]
# Update Railway Variables for project 1
```

### Project 2:
```bash
cd "path\to\project2"
node change-railway-password.js [NEW_PASSWORD_2]
# Update Railway Variables for project 2
```

## Generate Unique Passwords

For each project, generate a unique password:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64').replace(/[+/=]/g, '').substring(0, 32))"
```

## Requirements

Each project needs a `.env` file with:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD` (current password)
- `DB_NAME`

## After Changing Password

For each project:
1. ✅ Password changed in MySQL
2. ⏳ Update Railway Variables tab
3. ✅ `.env` file updated automatically by script
4. ✅ Test connection: `node fix-railway-connection.js`

## Notes

- Each project should have a **unique password**
- The script reads from `.env` in the current directory
- Railway's "regenerate password" doesn't work - use this script instead
- Keep passwords secure and never commit to Git

