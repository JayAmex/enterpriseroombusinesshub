# Test Scripts Documentation

This document describes the test and utility scripts in this project.

## ⚠️ IMPORTANT: Development Only

**All test scripts in this directory are for development and testing purposes only.**
**DO NOT run these scripts in production environments.**

---

## Test Scripts

### API Testing Scripts

These scripts test various API endpoints:

- `test-api.js` - Basic API endpoint tests
- `test-api-extended.js` - Extended API tests with more scenarios
- `test-api-with-auth.js` - API tests requiring authentication
- `test-api-members.js` - Tests for members directory API
- `test-all-with-auth.js` - Comprehensive authenticated API tests
- `test-all-data-consistency.js` - Data consistency verification tests
- `test-specific-endpoints.js` - Tests for specific API endpoints

### Dashboard Testing Scripts

- `test-dashboard-api.js` - Dashboard API endpoint tests
- `test-dashboard-display.js` - Dashboard display functionality tests
- `test-dashboard-stats-calculation.js` - Dashboard statistics calculation tests

### Authentication & User Testing

- `test-admin-login.js` - Admin login functionality tests
- `test-admin-api-auth.js` - Admin API authentication tests
- `test-admin-members-api.js` - Admin members API tests
- `test-with-auth-token.js` - Tests using authentication tokens
- `test-with-user.js` - User-specific API tests
- `test-password-change.js` - Password change functionality tests
- `test-profile-api.js` - User profile API tests
- `test-personal-info-update.js` - Personal information update tests

### Database Testing

- `test-db-connection.js` - Database connection tests
- `test-database-members.js` - Database members table tests
- `test-members-consistency.js` - Members data consistency tests

### Blog Testing

- `test-blog-query.js` - Blog query functionality tests
- `test-blog-saved-endpoint.js` - Saved blog posts endpoint tests

### Newsletter Testing

- `test-newsletter.js` - Newsletter functionality tests
- `test-newsletter-api.js` - Newsletter API endpoint tests

### Environment Testing

- `test-env-connection.js` - Environment and connection configuration tests

---

## Data Insertion Scripts

### ⚠️ WARNING: Contains Test Data

These scripts insert test data into the database. **Use only in development.**

- `insert-test-data.js` - Inserts comprehensive test data (users, businesses, events, blog posts, tools)
- `insert-test-events.js` - Inserts test events
- `insert-directories-test.js` - Inserts test directory entries
- `insert-blog-post.js` - Inserts test blog posts

### Test Credentials

**DO NOT use these in production:**

- Admin: `admin` / `admin123`
- Test User: `test@example.com` / `test123`
- Demo User: `demo@enterprisehub.com` / `demo123`

These credentials are for development/testing only. In production, use strong, unique credentials stored in `.env` file.

---

## Utility Scripts

- `check-user.js` - Check user data in database
- `check-admin-users.js` - Check admin users
- `diagnose-env.js` - Diagnose environment configuration
- `verify-exact-data-match.js` - Verify data matches between sources

---

## Usage

### Running Test Scripts

```bash
# Run a specific test
node test-api.js

# Run with environment variables
DB_HOST=localhost DB_USER=root node test-api.js
```

### Running Data Insertion Scripts

```bash
# Insert test data (DEVELOPMENT ONLY)
node insert-test-data.js

# Insert test events
node insert-test-events.js
```

**⚠️ Always ensure you're in a development environment before running insertion scripts.**

---

## Maintenance

### When to Update

- Update test scripts when API endpoints change
- Update insertion scripts when database schema changes
- Remove obsolete test scripts if they're no longer relevant

### Best Practices

1. **Never commit test credentials to production**
2. **Use environment variables for sensitive data**
3. **Document any new test scripts you create**
4. **Keep test data realistic but clearly identifiable as test data**
5. **Clean up test data after testing**

---

## Notes

- All test scripts should handle errors gracefully
- Test scripts should not modify production data
- Test scripts should be idempotent when possible (can be run multiple times safely)
- Some scripts may require database access - ensure proper permissions

---

**Last Updated:** 2026-01-15  
**Maintained By:** Development Team
