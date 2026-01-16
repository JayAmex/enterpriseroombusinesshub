-- =====================================================
-- Template Downloads Feature - Database Migration
-- =====================================================
-- This migration adds tables to track template downloads
-- and template metadata for the Business Document Templates feature
-- =====================================================

-- =====================================================
-- 17. TEMPLATES TABLE
-- =====================================================
-- Stores metadata for all available document templates
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

-- =====================================================
-- 18. TEMPLATE_DOWNLOADS TABLE
-- =====================================================
-- Tracks individual template downloads
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

-- =====================================================
-- INSERT DEFAULT TEMPLATE METADATA
-- =====================================================
-- Insert all 33 templates into the templates table
INSERT INTO templates (template_id, name, description, category, file_path) VALUES
-- Business Planning & Strategy
('business-plan', 'Business Plan Template', 'Complete business plan with executive summary, market analysis, and financial projections.', 'Business Planning', 'templates/business-plan.html'),
('swot-analysis', 'SWOT Analysis Template', 'Analyze your business strengths, weaknesses, opportunities, and threats.', 'Business Planning', 'templates/swot-analysis.html'),
('business-model-canvas', 'Business Model Canvas', 'One-page visual framework to describe your business model.', 'Business Planning', 'templates/business-model-canvas.html'),
('marketing-plan', 'Marketing Plan Template', 'Comprehensive marketing strategy with budget, channels, and KPIs.', 'Business Planning', 'templates/marketing-plan.html'),

-- Financial Management
('invoice', 'Invoice Template', 'Professional invoice template with tax fields for Nigerian businesses.', 'Financial Management', 'templates/invoice.html'),
('quotation', 'Quotation/Quote Template', 'Professional price quotation template for services and products.', 'Financial Management', 'templates/quotation.html'),
('purchase-order', 'Purchase Order Template', 'Standardized purchase order form for vendor transactions.', 'Financial Management', 'templates/purchase-order.html'),
('expense-report', 'Expense Report Template', 'Employee expense tracking and reimbursement form.', 'Financial Management', 'templates/expense-report.html'),
('budget', 'Budget Template', 'Monthly and annual budget planning spreadsheet.', 'Financial Management', 'templates/budget.html'),
('cash-flow-statement', 'Cash Flow Statement Template', 'Track monthly cash inflows and outflows for your business.', 'Financial Management', 'templates/cash-flow-statement.html'),
('profit-loss-statement', 'Profit & Loss Statement Template', 'Monthly and quarterly profit & loss statement template.', 'Financial Management', 'templates/profit-loss-statement.html'),

-- Legal & Compliance
('service-agreement', 'Service Agreement Template', 'Client service contract template for service-based businesses.', 'Legal & Compliance', 'templates/service-agreement.html'),
('nda', 'Non-Disclosure Agreement (NDA)', 'Confidentiality agreement template for protecting business information.', 'Legal & Compliance', 'templates/nda.html'),
('employment-contract', 'Employment Contract Template', 'Standard employment contract with terms and conditions.', 'Legal & Compliance', 'templates/employment-contract.html'),
('partnership-agreement', 'Partnership Agreement Template', 'Business partnership agreement template with terms and responsibilities.', 'Legal & Compliance', 'templates/partnership-agreement.html'),
('terms-of-service', 'Terms of Service Template', 'Website and service terms of service template.', 'Legal & Compliance', 'templates/terms-of-service.html'),
('privacy-policy', 'Privacy Policy Template', 'Data protection and privacy policy template for compliance.', 'Legal & Compliance', 'templates/privacy-policy.html'),

-- HR & Employee Management
('job-description', 'Job Description Template', 'Standardized job description template for hiring.', 'HR & Employee', 'templates/job-description.html'),
('employee-handbook', 'Employee Handbook Template', 'Company policies and procedures handbook template.', 'HR & Employee', 'templates/employee-handbook.html'),
('performance-review', 'Performance Review Template', 'Employee performance evaluation and review form.', 'HR & Employee', 'templates/performance-review.html'),
('leave-request', 'Leave Request Form', 'Employee time-off and leave request tracking form.', 'HR & Employee', 'templates/leave-request.html'),
('timesheet', 'Timesheet Template', 'Hourly employee time tracking and timesheet template.', 'HR & Employee', 'templates/timesheet.html'),

-- Sales & Customer Management
('customer-onboarding', 'Customer Onboarding Checklist', 'New client setup and onboarding process checklist.', 'Sales & Customer', 'templates/customer-onboarding.html'),
('sales-proposal', 'Sales Proposal Template', 'Professional sales proposal template for client pitches.', 'Sales & Customer', 'templates/sales-proposal.html'),
('customer-feedback', 'Customer Feedback Form', 'Customer satisfaction survey and feedback form.', 'Sales & Customer', 'templates/customer-feedback.html'),
('refund-policy', 'Refund/Return Policy Template', 'Clear return and refund policy template for customers.', 'Sales & Customer', 'templates/refund-policy.html'),

-- Operations
('inventory-checklist', 'Inventory Checklist Template', 'Stock management and inventory tracking checklist.', 'Operations', 'templates/inventory-checklist.html'),
('vendor-agreement', 'Vendor/Supplier Agreement Template', 'Supplier contract and vendor agreement template.', 'Operations', 'templates/vendor-agreement.html'),
('meeting-agenda', 'Meeting Agenda Template', 'Structured meeting agenda and notes template.', 'Operations', 'templates/meeting-agenda.html'),
('project-plan', 'Project Plan Template', 'Project management framework and planning template.', 'Operations', 'templates/project-plan.html'),

-- Marketing & Branding
('social-media-calendar', 'Social Media Content Calendar', 'Monthly social media post scheduling and content calendar.', 'Marketing & Branding', 'templates/social-media-calendar.html'),
('press-release', 'Press Release Template', 'Professional press release template for media announcements.', 'Marketing & Branding', 'templates/press-release.html'),
('email-newsletter', 'Email Newsletter Template', 'Customer communication and newsletter email template.', 'Marketing & Branding', 'templates/email-newsletter.html');

-- =====================================================
-- UPDATE VIEW: Dashboard Statistics
-- =====================================================
-- Add template downloads count to dashboard stats view
DROP VIEW IF EXISTS vw_dashboard_stats;

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

-- =====================================================
-- STORED PROCEDURE: Get Template Download Statistics
-- =====================================================
DELIMITER //

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
END //

DELIMITER ;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. The templates table stores metadata for all 33 templates
-- 2. The template_downloads table tracks each download with user info
-- 3. Downloads can be anonymous (user_id = NULL) for non-logged-in users
-- 4. IP address and user agent are stored for analytics
-- 5. The view and stored procedure provide easy access to download statistics
-- 6. Template file paths are relative to the web root
-- =====================================================
