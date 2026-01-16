# Database Schema Snapshot
**Date:** 2026-01-15  
**Version:** 1.0  
**Status:** Production Ready

---

## 📊 Overview

This document provides a complete snapshot of the Enterprise Room Business Hub database schema as it currently stands. This schema supports user management, business registration, events, blog posts, directories, pitch competitions, templates, and comprehensive admin functionality.

**Database Engine:** MySQL/MariaDB (InnoDB)  
**Character Set:** utf8mb4  
**Collation:** utf8mb4_unicode_ci

---

## 📋 Table Summary

| # | Table Name | Purpose | Records | Status |
|---|------------|---------|---------|--------|
| 1 | `users` | User accounts | Dynamic | ✅ Active |
| 2 | `admin_users` | Admin accounts | ~1-10 | ✅ Active |
| 3 | `businesses` | User-registered businesses | Dynamic | ✅ Active |
| 4 | `events` | Events (regular & pitch) | Dynamic | ✅ Active |
| 5 | `event_rsvps` | Event RSVPs | Dynamic | ✅ Active |
| 6 | `pitch_event_registrations` | Pitch event registrations | Dynamic | ✅ Active |
| 7 | `pitch_entries` | Pitch competition submissions | Dynamic | ✅ Active |
| 8 | `blog_posts` | Blog articles | Dynamic | ✅ Active |
| 9 | `directory_members` | Member directory | Dynamic | ✅ Active |
| 10 | `directory_partners` | Partner directory | Dynamic | ✅ Active |
| 11 | `directory_businesses` | Business directory (admin-added) | Dynamic | ✅ Active |
| 12 | `custom_tools` | Custom calculator tools | Dynamic | ✅ Active |
| 13 | `builtin_tools` | Built-in tool metadata | 10 | ✅ Active |
| 14 | `settings` | System settings | ~7 | ✅ Active |
| 15 | `user_sessions` | User session tokens (optional) | Dynamic | ✅ Active |
| 16 | `admin_sessions` | Admin session tokens (optional) | Dynamic | ✅ Active |
| 17 | `password_reset_tokens` | Password reset tokens | Dynamic | ✅ Active |
| 18 | `templates` | Document template metadata | 33 | ✅ Active |
| 19 | `template_downloads` | Template download tracking | Dynamic | ✅ Active |

**Total Tables:** 19  
**Total Views:** 4  
**Total Stored Procedures:** 3

---

## 📐 Detailed Table Schemas

### 1. users
**Purpose:** Registered user accounts

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    title VARCHAR(255),
    occupation VARCHAR(255),
    state VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Fields:**
- `uuid`: Unique identifier for membership number
- `email`: Login credential (unique)
- `password_hash`: Bcrypt hashed password
- `avatar_url`: Profile picture URL (stored in `/uploads/avatars/`)
- `is_active`: Account status (for soft deletes)

**Relationships:**
- One-to-Many: `businesses`, `pitch_entries`, `event_rsvps`, `pitch_event_registrations`

---

### 2. admin_users
**Purpose:** Admin dashboard accounts

```sql
CREATE TABLE admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Roles:**
- `super_admin`: Full access
- `admin`: Standard admin access
- `moderator`: Limited access

**Default Admin:**
- Username: `admin`
- Password: `admin123` (⚠️ CHANGE IN PRODUCTION!)

---

### 3. businesses
**Purpose:** User-registered businesses

```sql
CREATE TABLE businesses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_address TEXT NOT NULL,
    business_sector VARCHAR(100),
    year_of_formation YEAR,
    number_of_employees INT,
    cac_registered ENUM('yes', 'no') NOT NULL,
    cac_certificate_url TEXT,
    has_business_bank_account ENUM('yes', 'no') NOT NULL,
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    account_name VARCHAR(255),
    owner_name VARCHAR(255) NOT NULL,
    owner_relationship VARCHAR(100) NOT NULL,
    newsletter_optin BOOLEAN DEFAULT FALSE,
    status ENUM('Pending Review', 'Approved', 'Rejected', 'Verified Business') DEFAULT 'Pending Review',
    registered_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_business_name (business_name),
    INDEX idx_sector (business_sector)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Status Flow:**
1. `Pending Review` → New registration
2. `Approved` → Admin approved
3. `Rejected` → Admin rejected
4. `Verified Business` → CAC certificate verified

**Relationships:**
- Many-to-One: `users` (via `user_id`)
- One-to-Many: `pitch_entries`

---

### 4. events
**Purpose:** Events (regular and pitch competitions)

```sql
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE,
    event_time TIME,
    date_display VARCHAR(100),
    event_type ENUM('regular', 'pitch') DEFAULT 'regular',
    status ENUM('Upcoming', 'Live Now', 'Featured', 'Historical') DEFAULT 'Upcoming',
    flier_url MEDIUMTEXT,
    social_links TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_event_type (event_type),
    INDEX idx_status (status),
    INDEX idx_event_date (event_date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Event Types:**
- `regular`: Standard events (workshops, seminars, networking)
- `pitch`: Pitch competition events

**Status Values:**
- `Upcoming`: Future events
- `Live Now`: Currently happening
- `Featured`: Highlighted events
- `Historical`: Past events

---

### 5. event_rsvps
**Purpose:** User RSVPs for regular events

```sql
CREATE TABLE event_rsvps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    rsvp_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_event_user (event_id, user_id),
    INDEX idx_event_id (event_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Constraints:**
- Unique constraint prevents duplicate RSVPs per user per event

---

### 6. pitch_event_registrations
**Purpose:** User registrations for pitch events

```sql
CREATE TABLE pitch_event_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    registered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_pitch_event_user (event_id, user_id),
    INDEX idx_event_id (event_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 7. pitch_entries
**Purpose:** Pitch competition submissions

```sql
CREATE TABLE pitch_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_id INT NOT NULL,
    user_id INT NOT NULL,
    event_id INT,
    pitch_title VARCHAR(255) NOT NULL,
    pitch_description TEXT NOT NULL,
    funding_amount DECIMAL(15, 2) NOT NULL,
    use_of_funds TEXT NOT NULL,
    business_model TEXT NOT NULL,
    market_opportunity TEXT NOT NULL,
    pitch_deck_url TEXT,
    additional_docs JSON,
    status ENUM('Submitted', 'Under Review', 'Approved', 'Rejected', 'Winner') DEFAULT 'Submitted',
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_date TIMESTAMP NULL,
    reviewed_by INT,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_business_id (business_id),
    INDEX idx_user_id (user_id),
    INDEX idx_event_id (event_id),
    INDEX idx_status (status),
    INDEX idx_submitted_date (submitted_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Status Flow:**
1. `Submitted` → Initial submission
2. `Under Review` → Admin reviewing
3. `Approved` → Accepted for competition
4. `Rejected` → Not accepted
5. `Winner` → Competition winner

---

### 8. blog_posts
**Purpose:** Blog articles and publications

```sql
CREATE TABLE blog_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author VARCHAR(255),
    category VARCHAR(100),
    featured_image_url TEXT,
    published_date DATE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_published_date (published_date),
    INDEX idx_is_published (is_published),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Categories:**
- Articles
- Case Studies
- Research
- Testimonials

---

### 9. directory_members
**Purpose:** Member directory (admin-added)

```sql
CREATE TABLE directory_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    organization VARCHAR(255),
    website VARCHAR(500),
    linkedin_url VARCHAR(500),
    twitter_url VARCHAR(500),
    avatar_url TEXT,
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    added_by INT,
    FOREIGN KEY (added_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_organization (organization),
    INDEX idx_added_date (added_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 10. directory_partners
**Purpose:** Partner directory (admin-added)

```sql
CREATE TABLE directory_partners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    address TEXT NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(500),
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    added_by INT,
    FOREIGN KEY (added_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_added_date (added_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Note:** Partners do NOT have a name field (as per requirements).

---

### 11. directory_businesses
**Purpose:** Business directory (admin-added, separate from user-registered businesses)

```sql
CREATE TABLE directory_businesses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(500),
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    added_by INT,
    FOREIGN KEY (added_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_business_name (business_name),
    INDEX idx_email (email),
    INDEX idx_added_date (added_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Note:** This is separate from the `businesses` table. The `businesses` table contains user-registered businesses, while this table contains admin-added directory entries.

---

### 12. custom_tools
**Purpose:** Custom calculator tools created by admin

```sql
CREATE TABLE custom_tools (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    inputs JSON NOT NULL,
    function_code TEXT NOT NULL,
    result_label VARCHAR(255) NOT NULL,
    result_id VARCHAR(100) NOT NULL,
    button_text VARCHAR(100) DEFAULT 'Calculate',
    button_color VARCHAR(50) DEFAULT '#1a365d',
    result_color ENUM('default', 'success') DEFAULT 'default',
    show_conversion BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Example inputs JSON:**
```json
[
  {"id": "input1", "label": "Amount", "type": "amount", "value": "1000000"},
  {"id": "input2", "label": "Rate", "type": "number", "value": "5"}
]
```

---

### 13. builtin_tools
**Purpose:** Built-in calculator tool metadata

```sql
CREATE TABLE builtin_tools (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tool_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Financial',
    is_active BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tool_id (tool_id),
    INDEX idx_is_active (is_active),
    INDEX idx_is_visible (is_visible),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Built-in Tools (10 total):**
1. Savings Target Calculator
2. Business Loan Calculator
3. Mortgage Calculator
4. PIT Calculator (Nigeria)
5. CIT Calculator (Nigeria)
6. Break-Even Calculator
7. Cash Flow Forecast
8. Profit Margin Calculator
9. Payroll Calculator (Nigeria)
10. ROI Calculator

---

### 14. settings
**Purpose:** System settings (exchange rates, calculator defaults, etc.)

```sql
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'json', 'boolean') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Default Settings:**
- `exchange_rate_usd`: 1450 (NGN to USD)
- `exchange_rate_gbp`: 1850 (NGN to GBP)
- `calculator_default_loan_rate`: 22 (%)
- `calculator_default_loan_term`: 24 (months)
- `calculator_default_mortgage_rate`: 16 (%)
- `calculator_default_mortgage_term`: 15 (years)
- `calculator_default_tax_rate`: 7.5 (%)

---

### 15. user_sessions (Optional)
**Purpose:** User session tokens for authentication

```sql
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Note:** Currently using JWT tokens stored in sessionStorage. This table is optional for future session management.

---

### 16. admin_sessions (Optional)
**Purpose:** Admin session tokens for authentication

```sql
CREATE TABLE admin_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_admin_id (admin_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 17. password_reset_tokens
**Purpose:** Password reset token management

```sql
CREATE TABLE password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Token Expiry:** Typically 1 hour from creation

---

### 18. templates
**Purpose:** Document template metadata

```sql
CREATE TABLE templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_id (template_id),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Total Templates:** 33

**Categories:**
- Business Planning (4 templates)
- Financial Management (7 templates)
- Legal & Compliance (6 templates)
- HR & Employee (5 templates)
- Sales & Customer (4 templates)
- Operations (4 templates)
- Marketing & Branding (3 templates)

---

### 19. template_downloads
**Purpose:** Template download tracking

```sql
CREATE TABLE template_downloads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id VARCHAR(100) NOT NULL,
    user_id INT,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (template_id) REFERENCES templates(template_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_template_id (template_id),
    INDEX idx_user_id (user_id),
    INDEX idx_downloaded_at (downloaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Tracking:**
- Downloads can be anonymous (user_id = NULL)
- Tracks IP address and user agent for analytics

---

## 🔍 Database Views

### 1. vw_approved_businesses
Shows all approved/verified businesses with owner email.

```sql
CREATE VIEW vw_approved_businesses AS
SELECT 
    b.id,
    b.business_name,
    b.business_address,
    u.email as owner_email,
    b.business_sector,
    b.status,
    b.registered_date
FROM businesses b
INNER JOIN users u ON b.user_id = u.id
WHERE b.status IN ('Approved', 'Verified Business')
ORDER BY b.registered_date DESC;
```

---

### 2. vw_active_events
Shows all active events sorted by priority.

```sql
CREATE VIEW vw_active_events AS
SELECT 
    id,
    title,
    description,
    event_date,
    event_time,
    date_display,
    event_type,
    status,
    flier_url
FROM events
WHERE status IN ('Upcoming', 'Live Now', 'Featured')
ORDER BY 
    CASE status
        WHEN 'Live Now' THEN 1
        WHEN 'Featured' THEN 2
        WHEN 'Upcoming' THEN 3
        ELSE 4
    END,
    event_date ASC;
```

---

### 3. vw_published_blog_posts
Shows all published blog posts sorted by date.

```sql
CREATE VIEW vw_published_blog_posts AS
SELECT 
    id,
    title,
    excerpt,
    content,
    author,
    category,
    featured_image_url,
    published_date
FROM blog_posts
WHERE is_published = TRUE
ORDER BY published_date DESC;
```

---

### 4. vw_dashboard_stats
Aggregates dashboard statistics.

```sql
CREATE VIEW vw_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as registered_users_count,
    (SELECT COUNT(*) FROM businesses) as registered_businesses_count,
    (SELECT COUNT(*) FROM directory_members) as members_count,
    (SELECT COUNT(*) FROM events) as events_count,
    (SELECT COUNT(*) FROM blog_posts WHERE is_published = TRUE) as blog_posts_count,
    (SELECT COUNT(*) FROM directory_members) + 
    (SELECT COUNT(*) FROM directory_partners) + 
    (SELECT COUNT(*) FROM directory_businesses) as directory_entries_count,
    (SELECT COUNT(*) FROM template_downloads) as total_template_downloads,
    (SELECT COUNT(DISTINCT template_id) FROM template_downloads) as unique_templates_downloaded;
```

---

## 🔧 Stored Procedures

### 1. sp_get_user_dashboard(user_id)
Returns user dashboard data.

```sql
CREATE PROCEDURE sp_get_user_dashboard(IN p_user_id INT)
BEGIN
    SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        (SELECT COUNT(*) FROM businesses WHERE user_id = p_user_id) as business_count,
        (SELECT COUNT(*) FROM pitch_entries WHERE user_id = p_user_id) as pitch_entries_count,
        (SELECT COUNT(*) FROM event_rsvps WHERE user_id = p_user_id) as rsvp_count
    FROM users u
    WHERE u.id = p_user_id;
END
```

---

### 2. sp_get_event_with_rsvp_count(event_id)
Returns event details with RSVP count.

```sql
CREATE PROCEDURE sp_get_event_with_rsvp_count(IN p_event_id INT)
BEGIN
    SELECT 
        e.*,
        COUNT(er.id) as rsvp_count
    FROM events e
    LEFT JOIN event_rsvps er ON e.id = er.event_id
    WHERE e.id = p_event_id
    GROUP BY e.id;
END
```

---

### 3. sp_get_template_download_stats()
Returns template download statistics.

```sql
CREATE PROCEDURE sp_get_template_download_stats()
BEGIN
    SELECT 
        t.template_id,
        t.name,
        t.category,
        COUNT(td.id) as download_count,
        COUNT(DISTINCT td.user_id) as unique_users,
        MAX(td.downloaded_at) as last_downloaded
    FROM templates t
    LEFT JOIN template_downloads td ON t.template_id = td.template_id
    WHERE t.is_active = TRUE
    GROUP BY t.template_id, t.name, t.category
    ORDER BY download_count DESC, t.name ASC;
END
```

---

## 🔗 Relationships Diagram

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

templates
  └── template_downloads (1:N)
```

---

## 📊 Indexes

### Primary Indexes
- All tables have `PRIMARY KEY` on `id`
- All foreign keys are indexed

### Composite Indexes
- `idx_business_user_status` on `businesses(user_id, status)`
- `idx_event_type_status` on `events(event_type, status)`
- `idx_pitch_business_user` on `pitch_entries(business_id, user_id)`
- `idx_blog_category_published` on `blog_posts(category, is_published)`

### Unique Constraints
- `users.email` - Unique
- `users.uuid` - Unique
- `admin_users.username` - Unique
- `admin_users.email` - Unique
- `builtin_tools.tool_id` - Unique
- `templates.template_id` - Unique
- `event_rsvps(event_id, user_id)` - Unique
- `pitch_event_registrations(event_id, user_id)` - Unique

---

## 🔒 Security Considerations

1. **Password Hashing:** All passwords use bcrypt with proper salt rounds
2. **SQL Injection:** All queries use parameterized statements
3. **File Uploads:** Files stored in `/uploads/` directory, URLs stored in database
4. **Session Management:** JWT tokens with expiration
5. **Input Validation:** Server-side validation on all inputs
6. **CORS:** Configured for API endpoints
7. **HTTPS:** Required in production

---

## 📈 Performance Optimization

1. **Indexes:** All foreign keys and frequently queried columns indexed
2. **Composite Indexes:** Added for common query patterns
3. **Views:** Used for complex queries
4. **Connection Pooling:** Implemented in server.js
5. **Pagination:** All list endpoints support pagination

---

## 🔄 Migration Notes

**From localStorage to Database:**
- All critical data migrated to database
- Client-side preferences remain in localStorage (acceptable)
- Avatar storage migrated to server-side

**Schema Changes:**
- All changes tracked in migration scripts
- Backward compatible where possible

---

## 📝 Maintenance

**Backup Strategy:**
- Daily full backups
- Hourly incremental backups
- 30-day retention minimum
- Offsite storage

**Monitoring:**
- Database connection pool monitoring
- Query performance monitoring
- Index usage analysis

---

**Last Updated:** 2026-01-15  
**Schema Version:** 1.0  
**Status:** ✅ Production Ready
