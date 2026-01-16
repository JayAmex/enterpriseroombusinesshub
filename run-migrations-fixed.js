// Run Database Migrations (Fixed)
// This script runs the migration SQL files to add new tables

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    connectTimeout: 10000,
};

async function runMigrations() {
    let connection;
    
    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected successfully!\n');
        
        // ============================================
        // 1. Create Templates Table
        // ============================================
        console.log('📄 Creating templates table...');
        try {
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS templates (
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
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('   ✅ Templates table created/verified');
        } catch (error) {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
                throw error;
            }
            console.log('   ⚠️  Templates table already exists');
        }
        
        // ============================================
        // 2. Create Template Downloads Table
        // ============================================
        console.log('📄 Creating template_downloads table...');
        try {
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS template_downloads (
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
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('   ✅ Template downloads table created/verified');
        } catch (error) {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR' && error.code !== 'ER_CANNOT_ADD_FOREIGN') {
                throw error;
            }
            console.log('   ⚠️  Template downloads table already exists or foreign key issue');
        }
        
        // ============================================
        // 3. Insert Template Data
        // ============================================
        console.log('📄 Inserting template data...');
        const templates = [
            ['business-plan', 'Business Plan Template', 'Complete business plan with executive summary, market analysis, and financial projections.', 'Business Planning', 'templates/business-plan.html'],
            ['swot-analysis', 'SWOT Analysis Template', 'Analyze your business strengths, weaknesses, opportunities, and threats.', 'Business Planning', 'templates/swot-analysis.html'],
            ['business-model-canvas', 'Business Model Canvas', 'One-page visual framework to describe your business model.', 'Business Planning', 'templates/business-model-canvas.html'],
            ['marketing-plan', 'Marketing Plan Template', 'Comprehensive marketing strategy with budget, channels, and KPIs.', 'Business Planning', 'templates/marketing-plan.html'],
            ['invoice', 'Invoice Template', 'Professional invoice template with tax fields for Nigerian businesses.', 'Financial Management', 'templates/invoice.html'],
            ['quotation', 'Quotation/Quote Template', 'Professional price quotation template for services and products.', 'Financial Management', 'templates/quotation.html'],
            ['purchase-order', 'Purchase Order Template', 'Standardized purchase order form for vendor transactions.', 'Financial Management', 'templates/purchase-order.html'],
            ['expense-report', 'Expense Report Template', 'Employee expense tracking and reimbursement form.', 'Financial Management', 'templates/expense-report.html'],
            ['budget', 'Budget Template', 'Monthly and annual budget planning spreadsheet.', 'Financial Management', 'templates/budget.html'],
            ['cash-flow-statement', 'Cash Flow Statement Template', 'Track monthly cash inflows and outflows for your business.', 'Financial Management', 'templates/cash-flow-statement.html'],
            ['profit-loss-statement', 'Profit & Loss Statement Template', 'Monthly and quarterly profit & loss statement template.', 'Financial Management', 'templates/profit-loss-statement.html'],
            ['service-agreement', 'Service Agreement Template', 'Client service contract template for service-based businesses.', 'Legal & Compliance', 'templates/service-agreement.html'],
            ['nda', 'Non-Disclosure Agreement (NDA)', 'Confidentiality agreement template for protecting business information.', 'Legal & Compliance', 'templates/nda.html'],
            ['employment-contract', 'Employment Contract Template', 'Standard employment contract with terms and conditions.', 'Legal & Compliance', 'templates/employment-contract.html'],
            ['partnership-agreement', 'Partnership Agreement Template', 'Business partnership agreement template with terms and responsibilities.', 'Legal & Compliance', 'templates/partnership-agreement.html'],
            ['terms-of-service', 'Terms of Service Template', 'Website and service terms of service template.', 'Legal & Compliance', 'templates/terms-of-service.html'],
            ['privacy-policy', 'Privacy Policy Template', 'Data protection and privacy policy template for compliance.', 'Legal & Compliance', 'templates/privacy-policy.html'],
            ['job-description', 'Job Description Template', 'Standardized job description template for hiring.', 'HR & Employee', 'templates/job-description.html'],
            ['employee-handbook', 'Employee Handbook Template', 'Company policies and procedures handbook template.', 'HR & Employee', 'templates/employee-handbook.html'],
            ['performance-review', 'Performance Review Template', 'Employee performance evaluation and review form.', 'HR & Employee', 'templates/performance-review.html'],
            ['leave-request', 'Leave Request Form', 'Employee time-off and leave request tracking form.', 'HR & Employee', 'templates/leave-request.html'],
            ['timesheet', 'Timesheet Template', 'Hourly employee time tracking and timesheet template.', 'HR & Employee', 'templates/timesheet.html'],
            ['customer-onboarding', 'Customer Onboarding Checklist', 'New client setup and onboarding process checklist.', 'Sales & Customer', 'templates/customer-onboarding.html'],
            ['sales-proposal', 'Sales Proposal Template', 'Professional sales proposal template for client pitches.', 'Sales & Customer', 'templates/sales-proposal.html'],
            ['customer-feedback', 'Customer Feedback Form', 'Customer satisfaction survey and feedback form.', 'Sales & Customer', 'templates/customer-feedback.html'],
            ['refund-policy', 'Refund/Return Policy Template', 'Clear return and refund policy template for customers.', 'Sales & Customer', 'templates/refund-policy.html'],
            ['inventory-checklist', 'Inventory Checklist Template', 'Stock management and inventory tracking checklist.', 'Operations', 'templates/inventory-checklist.html'],
            ['vendor-agreement', 'Vendor/Supplier Agreement Template', 'Supplier contract and vendor agreement template.', 'Operations', 'templates/vendor-agreement.html'],
            ['meeting-agenda', 'Meeting Agenda Template', 'Structured meeting agenda and notes template.', 'Operations', 'templates/meeting-agenda.html'],
            ['project-plan', 'Project Plan Template', 'Project management framework and planning template.', 'Operations', 'templates/project-plan.html'],
            ['social-media-calendar', 'Social Media Content Calendar', 'Monthly social media post scheduling and content calendar.', 'Marketing & Branding', 'templates/social-media-calendar.html'],
            ['press-release', 'Press Release Template', 'Professional press release template for media announcements.', 'Marketing & Branding', 'templates/press-release.html'],
            ['email-newsletter', 'Email Newsletter Template', 'Customer communication and newsletter email template.', 'Marketing & Branding', 'templates/email-newsletter.html']
        ];
        
        let insertedCount = 0;
        for (const [template_id, name, description, category, file_path] of templates) {
            try {
                await connection.execute(
                    'INSERT INTO templates (template_id, name, description, category, file_path) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), category = VALUES(category)',
                    [template_id, name, description, category, file_path]
                );
                insertedCount++;
            } catch (error) {
                if (error.code !== 'ER_DUP_ENTRY') {
                    console.log(`   ⚠️  Error inserting ${template_id}: ${error.message}`);
                }
            }
        }
        console.log(`   ✅ Inserted/updated ${insertedCount} templates`);
        
        // ============================================
        // 4. Create Built-in Tools Table
        // ============================================
        console.log('📄 Creating builtin_tools table...');
        try {
            await connection.execute(`
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
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('   ✅ Built-in tools table created/verified');
        } catch (error) {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
                throw error;
            }
            console.log('   ⚠️  Built-in tools table already exists');
        }
        
        // ============================================
        // 5. Insert Built-in Tools
        // ============================================
        console.log('📄 Inserting built-in tools...');
        const builtinTools = [
            ['savings', 'Savings Target Calculator', 'Calculate monthly savings needed to reach financial goals', 'Financial', 1],
            ['loan', 'Business Loan Calculator', 'Calculate monthly loan repayments', 'Financial', 2],
            ['mortgage', 'Mortgage Calculator', 'Calculate mortgage payments for property purchases', 'Financial', 3],
            ['pit', 'PIT Calculator (Nigeria)', 'Calculate Personal Income Tax based on Nigeria 2026 tax law', 'Tax', 4],
            ['cit', 'CIT Calculator (Nigeria)', 'Calculate Company Income Tax based on Nigeria 2026 tax law', 'Tax', 5],
            ['breakeven', 'Break-Even Calculator', 'Calculate break-even point for pricing decisions', 'Business', 6],
            ['cashflow', 'Cash Flow Forecast', 'Project monthly cash inflows and outflows', 'Financial', 7],
            ['profitmargin', 'Profit Margin Calculator', 'Calculate gross, operating, and net profit margins', 'Business', 8],
            ['payroll', 'Payroll Calculator (Nigeria)', 'Calculate employee salaries with Nigerian deductions', 'HR', 9],
            ['roi', 'ROI Calculator', 'Calculate Return on Investment for decision making', 'Business', 10]
        ];
        
        let toolsInserted = 0;
        for (const [tool_id, name, description, category, display_order] of builtinTools) {
            try {
                await connection.execute(
                    'INSERT INTO builtin_tools (tool_id, name, description, category, is_active, is_visible, display_order) VALUES (?, ?, ?, ?, TRUE, TRUE, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), category = VALUES(category)',
                    [tool_id, name, description, category, display_order]
                );
                toolsInserted++;
            } catch (error) {
                if (error.code !== 'ER_DUP_ENTRY') {
                    console.log(`   ⚠️  Error inserting ${tool_id}: ${error.message}`);
                }
            }
        }
        console.log(`   ✅ Inserted/updated ${toolsInserted} built-in tools`);
        
        // ============================================
        // 6. Update Dashboard Stats View
        // ============================================
        console.log('📄 Updating dashboard stats view...');
        try {
            await connection.execute('DROP VIEW IF EXISTS vw_dashboard_stats');
            await connection.execute(`
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
                    (SELECT COUNT(DISTINCT template_id) FROM template_downloads) as unique_templates_downloaded
            `);
            console.log('   ✅ Dashboard stats view updated');
        } catch (error) {
            console.log(`   ⚠️  Could not update view: ${error.message}`);
        }
        
        // ============================================
        // 7. Verify Tables
        // ============================================
        console.log('\n🔍 Verifying tables...');
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME IN ('templates', 'template_downloads', 'builtin_tools')
            ORDER BY TABLE_NAME
        `, [process.env.DB_NAME]);
        
        console.log('\n📊 Created/Verified Tables:');
        tables.forEach(table => {
            console.log(`   ✅ ${table.TABLE_NAME}`);
        });
        
        // Check counts
        try {
            const [templateCount] = await connection.execute('SELECT COUNT(*) as count FROM templates');
            console.log(`\n📄 Templates in database: ${templateCount[0].count}`);
        } catch (e) {
            console.log('\n⚠️  Could not count templates');
        }
        
        try {
            const [toolsCount] = await connection.execute('SELECT COUNT(*) as count FROM builtin_tools');
            console.log(`🔧 Built-in tools in database: ${toolsCount[0].count}`);
        } catch (e) {
            console.log('⚠️  Could not count built-in tools');
        }
        
        console.log('\n✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

// Run migrations
runMigrations();
