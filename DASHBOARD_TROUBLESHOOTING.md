# Dashboard Troubleshooting Guide

## Current Status

### ✅ API & Database Verification
All tests show that:
- Database has correct data
- API endpoints return correct data
- Data matches between database and API

### ⚠️ Potential Dashboard Display Issues

If the dashboard is showing incorrect numbers (like 0s), check the following:

## Step 1: Check Browser Console

1. Open the admin dashboard
2. Press F12 to open DevTools
3. Go to the "Console" tab
4. Look for:
   - `=== updateOverviewStats called ===`
   - `Fetching stats from API...`
   - `Stats received from API: {...}`
   - Any error messages

## Step 2: Check Network Tab

1. In DevTools, go to "Network" tab
2. Refresh the dashboard
3. Look for request to `/api/admin/dashboard/stats`
4. Check:
   - Status code (should be 200)
   - Request headers (should have `Authorization: Bearer <token>`)
   - Response body (should have the stats)

## Step 3: Manual Test in Console

Run this in the browser console on the admin dashboard:

```javascript
// Test if function exists
console.log('updateOverviewStats:', typeof updateOverviewStats);

// Test if elements exist
console.log('statEvents:', document.getElementById('statEvents'));
console.log('statBlogPosts:', document.getElementById('statBlogPosts'));
console.log('statDirectoryEntries:', document.getElementById('statDirectoryEntries'));
console.log('statRegisteredUsers:', document.getElementById('statRegisteredUsers'));
console.log('statMembers:', document.getElementById('statMembers'));
console.log('statRegisteredBusinesses:', document.getElementById('statRegisteredBusinesses'));

// Manually call the function
updateOverviewStats();

// Check current values
console.log('Current statEvents:', document.getElementById('statEvents')?.textContent);
console.log('Current statBlogPosts:', document.getElementById('statBlogPosts')?.textContent);
```

## Step 4: Verify API Directly

Run this in the browser console:

```javascript
const token = sessionStorage.getItem('adminToken');
fetch('http://localhost:3000/api/admin/dashboard/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
    console.log('API Response:', data);
    console.log('Expected Dashboard Values:');
    console.log('  Events:', data.total_events);
    console.log('  Blog Posts:', data.total_blog_posts);
    console.log('  Directory Entries:', data.total_directory_entries);
    console.log('  Registered Users:', data.total_registered_users);
    console.log('  Members:', data.total_members);
    console.log('  Registered Businesses:', data.total_registered_businesses);
});
```

## Expected Dashboard Values

Based on database verification:
- **Events**: 5
- **Blog Posts**: 4
- **Directory Entries**: 24
- **Registered Users**: 2
- **Members**: 8
- **Registered Businesses**: 1

## Common Issues

### Issue 1: Dashboard shows 0s
**Possible causes:**
- `updateOverviewStats()` not being called
- API call failing silently
- DOM elements not found
- Token expired

**Solution:**
- Check browser console for errors
- Verify token exists: `sessionStorage.getItem('adminToken')`
- Manually call: `updateOverviewStats()`

### Issue 2: Dashboard shows old/cached data
**Possible causes:**
- Browser cache
- localStorage still being used somewhere

**Solution:**
- Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Clear browser cache
- Check if any functions still use localStorage

### Issue 3: API returns 401 Unauthorized
**Possible causes:**
- Token expired
- Token not being sent
- Invalid token

**Solution:**
- Log out and log back in
- Check that token is in sessionStorage
- Verify token is being sent in Authorization header

## Quick Fix Commands

Run these in browser console on admin dashboard:

```javascript
// Force refresh stats
updateOverviewStats();

// Check what's displayed
console.log({
    events: document.getElementById('statEvents')?.textContent,
    blogPosts: document.getElementById('statBlogPosts')?.textContent,
    directoryEntries: document.getElementById('statDirectoryEntries')?.textContent,
    users: document.getElementById('statRegisteredUsers')?.textContent,
    members: document.getElementById('statMembers')?.textContent,
    businesses: document.getElementById('statRegisteredBusinesses')?.textContent
});

// Check token
console.log('Token exists:', !!sessionStorage.getItem('adminToken'));
```




