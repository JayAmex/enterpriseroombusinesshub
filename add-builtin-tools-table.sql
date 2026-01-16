-- =====================================================
-- Built-in Tools Table - Database Migration
-- =====================================================
-- This migration adds a table to store built-in calculator tools
-- and inserts all 10 built-in tools (4 original + 6 new from today)
-- =====================================================

-- =====================================================
-- 13. BUILTIN_TOOLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS builtin_tools (
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

-- =====================================================
-- INSERT ALL BUILT-IN TOOLS
-- =====================================================
-- Original tools (4)
INSERT INTO builtin_tools (tool_id, name, description, category, is_active, is_visible, display_order) VALUES
('savings', 'Savings Target Calculator', 'Calculate monthly savings needed to reach financial goals', 'Financial', TRUE, TRUE, 1),
('loan', 'Business Loan Calculator', 'Calculate monthly loan repayments', 'Financial', TRUE, TRUE, 2),
('mortgage', 'Mortgage Calculator', 'Calculate mortgage payments for property purchases', 'Financial', TRUE, TRUE, 3),
('pit', 'PIT Calculator (Nigeria)', 'Calculate Personal Income Tax based on Nigeria 2026 tax law', 'Tax', TRUE, TRUE, 4)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    category = VALUES(category),
    updated_at = CURRENT_TIMESTAMP;

-- New tools added today (6)
INSERT INTO builtin_tools (tool_id, name, description, category, is_active, is_visible, display_order) VALUES
('cit', 'CIT Calculator (Nigeria)', 'Calculate Company Income Tax based on Nigeria 2026 tax law', 'Tax', TRUE, TRUE, 5),
('breakeven', 'Break-Even Calculator', 'Calculate break-even point for pricing decisions', 'Business', TRUE, TRUE, 6),
('cashflow', 'Cash Flow Forecast', 'Project monthly cash inflows and outflows', 'Financial', TRUE, TRUE, 7),
('profitmargin', 'Profit Margin Calculator', 'Calculate gross, operating, and net profit margins', 'Business', TRUE, TRUE, 8),
('payroll', 'Payroll Calculator (Nigeria)', 'Calculate employee salaries with Nigerian deductions', 'HR', TRUE, TRUE, 9),
('roi', 'ROI Calculator', 'Calculate Return on Investment for decision making', 'Business', TRUE, TRUE, 10)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    category = VALUES(category),
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- UPDATE vw_dashboard_stats VIEW (if needed)
-- =====================================================
-- Note: If you want to track tool usage in dashboard stats,
-- you can add a count of active built-in tools here
-- Example:
-- (SELECT COUNT(*) FROM builtin_tools WHERE is_active = TRUE) as active_tools_count
