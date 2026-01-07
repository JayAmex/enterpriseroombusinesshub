# Database Schema Documentation

## Overview
This document describes the database schema for the Enterprise Room Business Hub platform. The schema supports user management, business registration, events, blog posts, directories, pitch competitions, and admin functionality.

## Table Relationships

```
users
  ├── businesses (1:N)
  ├── pitch_entries (1:N)
  ├── event_rsvps (1:N)
  └── pitch_event_registrations (1:N)

businesses
  └── pitch_entries (1:N)

events
  ├── event_rsvps (1:N)
  ├── pitch_event_registrations (1:N)
  └── pitch_entries (1:N)

admin_users
  ├── events (1:N)
  ├── blog_posts (1:N)
  ├── directory_members (1:N)
  ├── directory_partners (1:N)
  ├── directory_businesses (1:N)
  ├── custom_tools (1:N)
  └── settings (1:N)
```

## Table Descriptions

### 1. users
Stores registered user accounts.

**Key Fields:**
- `email`: Unique user email (used for login)
- `password_hash`: Hashed password
- `name`: User's full name
- `avatar_url`: Profile picture URL
- `is_active`: Account status

**Relationships:**
- One user can have many businesses
- One user can have many pitch entries
- One user can RSVP to many events

### 2. admin_users
Stores admin accounts for dashboard access.

**Key Fields:**
- `username`: Admin username
- `role`: super_admin, admin, or moderator
- `is_active`: Account status

**Default Admin:**
- Username: `admin`
- Password: `admin123` (CHANGE IN PRODUCTION!)

### 3. businesses
Stores user-registered businesses.

**Key Fields:**
- `user_id`: Foreign key to users
- `business_name`: Name of the business
- `status`: Pending Review, Approved, Rejected, Verified Business
- `cac_certificate_url`: URL to uploaded CAC certificate
- `newsletter_optin`: Whether business opted into newsletter

**Status Flow:**
- New businesses start as "Pending Review"
- Admin can approve → "Approved"
- If CAC certificate uploaded → "Verified Business"

### 4. events
Stores all events (regular and pitch events).

**Key Fields:**
- `event_type`: 'regular' or 'pitch'
- `status`: Upcoming, Live Now, Featured, Historical
- `flier_url`: Event flier image URL
- `date_display`: Formatted date string for display

**Filtering:**
- Pitch events: `event_type = 'pitch'`
- Public events: `event_type = 'regular'` AND `status IN ('Upcoming', 'Live Now', 'Featured')`

### 5. event_rsvps
Tracks user RSVPs for events.

**Key Fields:**
- `event_id`: Foreign key to events
- `user_id`: Foreign key to users
- Unique constraint on (event_id, user_id) prevents duplicate RSVPs

### 6. pitch_event_registrations
Tracks user registrations for pitch events.

**Key Fields:**
- `event_id`: Foreign key to events (must be pitch event)
- `user_id`: Foreign key to users
- Unique constraint prevents duplicate registrations

### 7. pitch_entries
Stores pitch competition submissions.

**Key Fields:**
- `business_id`: Foreign key to businesses
- `user_id`: Foreign key to users
- `event_id`: Foreign key to events (optional)
- `funding_amount`: Amount requested in Naira
- `pitch_deck_url`: URL to uploaded pitch deck
- `additional_docs`: JSON array of additional document URLs
- `status`: Submitted, Under Review, Approved, Rejected, Winner

### 8. blog_posts
Stores blog articles and publications.

**Key Fields:**
- `category`: Articles, Case Studies, Research, Testimonials
- `is_published`: Whether post is visible to public
- `published_date`: Date when post was published
- `featured_image_url`: Main image URL

### 9. directory_members
Stores member directory entries (admin-added).

**Key Fields:**
- `name`: Member name
- `title`: Current job title
- `organization`: Current organization
- `linkedin_url`, `twitter_url`: Social media links
- `avatar_url`: Profile picture URL

### 10. directory_partners
Stores partner directory entries (admin-added).

**Key Fields:**
- `address`: Partner address
- `email`: Contact email
- `phone`: Contact phone
- `website`: Partner website

**Note:** Partners do NOT have a name field (as per requirements).

### 11. directory_businesses
Stores business directory entries (admin-added, separate from user-registered businesses).

**Key Fields:**
- `business_name`: Business name
- `address`: Business address
- `email`, `phone`, `website`: Contact information

**Note:** This is separate from the `businesses` table. The `businesses` table contains user-registered businesses, while this table contains admin-added directory entries.

### 12. custom_tools
Stores custom calculator tools created by admin.

**Key Fields:**
- `inputs`: JSON array of input field definitions
- `function_code`: JavaScript code for calculation
- `result_label`: Label for result display
- `result_id`: HTML ID for result element
- `show_conversion`: Whether to show USD/GBP conversion

**Example inputs JSON:**
```json
[
  {"id": "input1", "label": "Amount", "type": "amount", "value": "1000000"},
  {"id": "input2", "label": "Rate", "type": "number", "value": "5"}
]
```

### 13. settings
Stores system settings (exchange rates, calculator defaults, etc.).

**Key Fields:**
- `setting_key`: Unique setting identifier
- `setting_value`: Setting value (stored as TEXT)
- `setting_type`: string, number, json, boolean

**Default Settings:**
- `exchange_rate_usd`: NGN to USD rate (default: 1450)
- `exchange_rate_gbp`: NGN to GBP rate (default: 1850)
- `calculator_default_loan_rate`: Default loan rate % (default: 22)
- `calculator_default_loan_term`: Default loan term months (default: 24)
- `calculator_default_mortgage_rate`: Default mortgage rate % (default: 16)
- `calculator_default_mortgage_term`: Default mortgage term years (default: 15)
- `calculator_default_tax_rate`: Default tax rate % (default: 7.5)

### 14. user_sessions (Optional)
Stores user session tokens for authentication.

**Key Fields:**
- `session_token`: Unique session token
- `expires_at`: Session expiration timestamp
- `ip_address`, `user_agent`: Security tracking

### 15. admin_sessions (Optional)
Stores admin session tokens for authentication.

## Views

### vw_approved_businesses
Shows all approved/verified businesses with owner email.

### vw_active_events
Shows all active events (Upcoming, Live Now, Featured) sorted by priority.

### vw_published_blog_posts
Shows all published blog posts sorted by date.

### vw_dashboard_stats
Aggregates dashboard statistics:
- Registered users count
- Registered businesses count
- Members count
- Events count
- Blog posts count
- Directory entries count

## Stored Procedures

### sp_get_user_dashboard(user_id)
Returns user dashboard data including business count, pitch entries count, and RSVP count.

### sp_get_event_with_rsvp_count(event_id)
Returns event details with RSVP count.

## Data Migration from localStorage

When migrating from localStorage to database:

1. **users** ← `localStorage.registeredUsers`
2. **businesses** ← `localStorage.registeredBusinesses`
3. **events** ← `localStorage.events`
4. **blog_posts** ← `localStorage.blogPosts`
5. **directory_members** ← `localStorage.directories.members`
6. **directory_partners** ← `localStorage.directories.partners`
7. **directory_businesses** ← `localStorage.directories.business`
8. **custom_tools** ← `localStorage.customTools`
9. **settings** ← `localStorage.exchangeRates`, `localStorage.calculatorDefaults`
10. **event_rsvps** ← `localStorage.eventRSVPs`
11. **pitch_entries** ← `localStorage.pitchEntries`
12. **pitch_event_registrations** ← `localStorage.pitchEventRegistrations`

## Security Considerations

1. **Password Hashing**: Use bcrypt or Argon2 with proper salt rounds
2. **SQL Injection**: Use parameterized queries/prepared statements
3. **File Uploads**: Store files in cloud storage, validate file types and sizes
4. **Session Management**: Use secure, HTTP-only cookies for sessions
5. **Rate Limiting**: Implement rate limiting on authentication endpoints
6. **Input Validation**: Validate all user inputs on both client and server
7. **CORS**: Configure CORS properly for API endpoints
8. **HTTPS**: Use HTTPS in production

## Performance Optimization

1. **Indexes**: All foreign keys and frequently queried columns are indexed
2. **Composite Indexes**: Added for common query patterns
3. **Views**: Use views for complex queries
4. **Caching**: Consider Redis for frequently accessed data
5. **Pagination**: Always paginate large result sets
6. **Connection Pooling**: Use connection pooling for database connections

## Backup Strategy

1. **Daily Backups**: Full database backup daily
2. **Incremental Backups**: Hourly incremental backups
3. **Retention**: Keep backups for 30 days minimum
4. **Testing**: Regularly test backup restoration
5. **Offsite Storage**: Store backups in separate location

## Migration Scripts

Create migration scripts for:
1. Initial schema creation
2. Adding new columns/tables
3. Data migrations
4. Index creation
5. View updates

## API Endpoints Needed

Based on this schema, you'll need API endpoints for:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/businesses` - Get user's businesses

### Businesses
- `POST /api/businesses` - Register new business
- `GET /api/businesses/:id` - Get business details
- `PUT /api/businesses/:id` - Update business
- `GET /api/businesses/approved` - Get approved businesses (directory)

### Events
- `GET /api/events` - Get all events
- `GET /api/events/pitch` - Get pitch events
- `POST /api/events/:id/rsvp` - RSVP to event
- `DELETE /api/events/:id/rsvp` - Cancel RSVP

### Pitch
- `POST /api/pitch/register` - Register for pitch event
- `POST /api/pitch/entries` - Submit pitch entry
- `GET /api/pitch/entries` - Get user's pitch entries

### Admin
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `POST /api/admin/events` - Create event
- `PUT /api/admin/events/:id` - Update event
- `POST /api/admin/blog` - Create blog post
- `POST /api/admin/directories/members` - Add member
- `POST /api/admin/directories/partners` - Add partner
- `PUT /api/admin/settings` - Update settings
- `PUT /api/admin/homepage` - Update homepage content

## Next Steps

1. Set up database server (MySQL/MariaDB recommended)
2. Run `database_schema.sql` to create schema
3. Create API backend (Node.js/Express, PHP, Python/Django, etc.)
4. Implement authentication middleware
5. Create API endpoints matching the schema
6. Update frontend to use API instead of localStorage
7. Implement file upload handling
8. Set up session management
9. Add logging and monitoring
10. Deploy to production with proper security

