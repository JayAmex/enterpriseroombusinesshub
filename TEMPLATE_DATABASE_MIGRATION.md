# Template Downloads - Database Migration Guide

## Overview
This document describes the database changes needed to support the Business Document Templates feature with download tracking.

## New Tables Added

### 1. `templates` Table
Stores metadata for all 33 document templates.

**Fields:**
- `id` - Primary key
- `template_id` - Unique identifier (e.g., 'business-plan', 'invoice')
- `name` - Template display name
- `description` - Template description
- `category` - Category (Business Planning, Financial Management, etc.)
- `file_path` - Relative path to template file (e.g., 'templates/invoice.html')
- `is_active` - Whether template is currently available
- `created_at`, `updated_at` - Timestamps

**Indexes:**
- `template_id` (unique)
- `category`
- `is_active`

### 2. `template_downloads` Table
Tracks each individual template download.

**Fields:**
- `id` - Primary key
- `template_id` - Foreign key to templates.template_id
- `user_id` - Foreign key to users.id (NULL for anonymous downloads)
- `downloaded_at` - Timestamp of download
- `ip_address` - User's IP address (for analytics)
- `user_agent` - Browser user agent (for analytics)

**Indexes:**
- `template_id`
- `user_id`
- `downloaded_at`

**Relationships:**
- `template_id` → `templates.template_id` (CASCADE on delete)
- `user_id` → `users.id` (SET NULL on delete - allows anonymous downloads)

## Updated Views

### `vw_dashboard_stats`
Added two new fields:
- `total_template_downloads` - Total count of all template downloads
- `unique_templates_downloaded` - Count of distinct templates that have been downloaded

## New Stored Procedure

### `sp_get_template_download_stats()`
Returns download statistics for all templates:
- Template ID, name, and category
- Total download count per template
- Unique user count per template
- Last download timestamp

## Migration Files

### For New Database Setup
If creating a fresh database, use the updated `database_schema.sql` which includes:
- Both new tables (templates, template_downloads)
- Template metadata inserts (all 33 templates)
- Updated dashboard stats view
- New stored procedure

### For Existing Database
If you already have a database, run `add-template-tables.sql` which contains:
- Only the new tables
- Template metadata inserts
- View updates
- Stored procedure

## Template Metadata

All 33 templates are automatically inserted with:
- Unique template_id
- Name and description
- Category assignment
- File path to template HTML file

**Categories:**
- Business Planning (4 templates)
- Financial Management (7 templates)
- Legal & Compliance (6 templates)
- HR & Employee (5 templates)
- Sales & Customer (4 templates)
- Operations (4 templates)
- Marketing & Branding (3 templates)

## API Endpoints Needed

To fully integrate with the database, you'll need these API endpoints:

### Templates
- `GET /api/templates` - Get all templates
- `GET /api/templates/:id` - Get template details
- `POST /api/templates/:id/download` - Record template download

### Admin
- `GET /api/admin/templates/stats` - Get download statistics (uses stored procedure)
- `GET /api/admin/templates/downloads` - Get detailed download history

## Current Implementation vs Database

**Current (localStorage):**
- Download counts stored in `localStorage.templateDownloadCounts`
- No user tracking
- No analytics data

**With Database:**
- Download counts stored in `template_downloads` table
- User tracking (if logged in)
- IP address and user agent for analytics
- Historical data with timestamps
- Can query by user, template, date range, etc.

## Migration Steps

1. **Run the migration SQL:**
   ```sql
   -- For new database
   source database_schema.sql;
   
   -- OR for existing database
   source add-template-tables.sql;
   ```

2. **Update backend API:**
   - Add endpoints for template downloads
   - Update download tracking to save to database
   - Update admin dashboard to fetch from database

3. **Update frontend:**
   - Modify `downloadTemplate()` function to call API
   - Update admin dashboard to fetch stats from API
   - Keep localStorage as fallback or remove it

## Benefits of Database Approach

1. **Persistent Data** - Downloads tracked across sessions
2. **User Analytics** - Track which users download which templates
3. **Historical Data** - See download trends over time
4. **Better Reporting** - Query by date, user, template, etc.
5. **Scalability** - Can handle large volumes of downloads
6. **Data Integrity** - Foreign keys ensure data consistency

## Notes

- Downloads can be anonymous (user_id = NULL) for non-logged-in users
- IP address and user agent stored for analytics but can be removed for privacy
- Template metadata can be updated via admin dashboard
- Templates can be deactivated (is_active = FALSE) without deleting download history
