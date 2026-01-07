-- =====================================================
-- Enterprise Room Business Hub - Database Schema
-- =====================================================
-- This schema defines all tables needed for the dashboard
-- and website functionality.
-- =====================================================

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. ADMIN USERS TABLE
-- =====================================================
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

-- =====================================================
-- 3. BUSINESSES TABLE (User-Registered Businesses)
-- =====================================================
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

-- =====================================================
-- 4. EVENTS TABLE
-- =====================================================
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

-- =====================================================
-- 5. EVENT RSVPS TABLE
-- =====================================================
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

-- =====================================================
-- 6. PITCH EVENT REGISTRATIONS TABLE
-- =====================================================
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

-- =====================================================
-- 7. PITCH ENTRIES TABLE
-- =====================================================
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

-- =====================================================
-- 8. BLOG POSTS TABLE
-- =====================================================
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

-- =====================================================
-- 9. DIRECTORY MEMBERS TABLE
-- =====================================================
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

-- =====================================================
-- 10. DIRECTORY PARTNERS TABLE
-- =====================================================
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

-- =====================================================
-- 11. DIRECTORY BUSINESSES TABLE (Admin-Added Business Directory)
-- =====================================================
-- Note: This is separate from the user-registered businesses table
-- This is for businesses added directly by admin to the directory
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

-- =====================================================
-- 12. CUSTOM TOOLS TABLE
-- =====================================================
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

-- =====================================================
-- 13. SETTINGS TABLE (Exchange Rates, Calculator Defaults, etc.)
-- =====================================================
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

-- =====================================================
-- 14. USER SESSIONS TABLE (Optional - for session management)
-- =====================================================
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

-- =====================================================
-- 15. ADMIN SESSIONS TABLE (Optional - for admin session management)
-- =====================================================
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

-- =====================================================
-- INITIAL DATA / DEFAULTS
-- =====================================================

-- Insert default admin user (password should be hashed in production)
-- Default password: admin123 (CHANGE THIS IN PRODUCTION!)
INSERT INTO admin_users (username, password_hash, email, full_name, role) 
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@enterpriseroom.com', 'System Administrator', 'super_admin');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('exchange_rate_usd', '1450', 'number', 'NGN to USD exchange rate'),
('exchange_rate_gbp', '1850', 'number', 'NGN to GBP exchange rate'),
('calculator_default_loan_rate', '22', 'number', 'Default loan interest rate (%)'),
('calculator_default_loan_term', '24', 'number', 'Default loan term (months)'),
('calculator_default_mortgage_rate', '16', 'number', 'Default mortgage interest rate (%)'),
('calculator_default_mortgage_term', '15', 'number', 'Default mortgage term (years)'),
('calculator_default_tax_rate', '7.5', 'number', 'Default tax rate (%)');

-- Note: Homepage content is managed directly from the admin dashboard
-- and can be stored in localStorage or in the settings table if needed
-- Example settings keys: 'homepage_hero_title', 'homepage_hero_subtitle', etc.

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Approved Businesses for Directory
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

-- View: Active Events
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

-- View: Published Blog Posts
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

-- View: Dashboard Statistics
CREATE VIEW vw_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as registered_users_count,
    (SELECT COUNT(*) FROM businesses) as registered_businesses_count,
    (SELECT COUNT(*) FROM directory_members) as members_count,
    (SELECT COUNT(*) FROM events) as events_count,
    (SELECT COUNT(*) FROM blog_posts WHERE is_published = TRUE) as blog_posts_count,
    (SELECT COUNT(*) FROM directory_members) + 
    (SELECT COUNT(*) FROM directory_partners) + 
    (SELECT COUNT(*) FROM directory_businesses) as directory_entries_count;

-- =====================================================
-- STORED PROCEDURES (Optional - for complex operations)
-- =====================================================

DELIMITER //

-- Procedure: Get user dashboard data
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
END //

-- Procedure: Get event with RSVP count
CREATE PROCEDURE sp_get_event_with_rsvp_count(IN p_event_id INT)
BEGIN
    SELECT 
        e.*,
        COUNT(er.id) as rsvp_count
    FROM events e
    LEFT JOIN event_rsvps er ON e.id = er.event_id
    WHERE e.id = p_event_id
    GROUP BY e.id;
END //

DELIMITER ;

-- =====================================================
-- INDEXES FOR PERFORMANCE (Additional)
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_business_user_status ON businesses(user_id, status);
CREATE INDEX idx_event_type_status ON events(event_type, status);
CREATE INDEX idx_pitch_business_user ON pitch_entries(business_id, user_id);
CREATE INDEX idx_blog_category_published ON blog_posts(category, is_published);

-- =====================================================
-- NOTES
-- =====================================================
-- 1. All password fields should use proper hashing (bcrypt, argon2, etc.)
-- 2. File uploads (avatars, certificates, pitch decks) should be stored
--    in cloud storage (S3, Azure Blob, etc.) and URLs stored in database
-- 3. JSON fields (additional_docs, inputs) store structured data
-- 4. Consider adding soft delete columns (deleted_at) for audit trails
-- 5. Add proper backup and migration strategies
-- 6. Consider adding audit log table for tracking changes
-- 7. For production, add proper constraints and validation
-- 8. Consider partitioning large tables (events, blog_posts) by date
-- =====================================================

