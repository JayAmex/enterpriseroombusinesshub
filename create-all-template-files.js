// Create All Template Files
// This script creates all 33 template HTML files based on the database entries

const fs = require('fs');
const path = require('path');

// Template structure based on invoice.html
const templateHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - Enterprise Room Business Hub</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .template-container {
            background: white;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        h1 {
            color: #1a365d;
            border-bottom: 3px solid #3182ce;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        h2 {
            color: #2d3748;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        .section {
            margin-bottom: 25px;
        }
        .field {
            margin-bottom: 15px;
        }
        .field label {
            font-weight: 600;
            display: block;
            margin-bottom: 5px;
            color: #4a5568;
        }
        .field input, .field textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #cbd5e0;
            border-radius: 4px;
            font-size: 14px;
        }
        .field textarea {
            min-height: 100px;
            resize: vertical;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #718096;
            font-size: 12px;
        }
        .footer .brand {
            color: #3182ce;
            font-weight: 600;
        }
        @media print {
            .footer {
                display: none;
            }
            body {
                background: white;
            }
            .template-container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="template-container">
        <h1>{{TITLE}}</h1>
        
        <div class="section">
            <h2>Document Information</h2>
            <div class="field">
                <label>Date:</label>
                <input type="date" id="document-date" value="">
            </div>
            <div class="field">
                <label>Document Number:</label>
                <input type="text" id="document-number" placeholder="Enter document number">
            </div>
        </div>

        <div class="section">
            <h2>Details</h2>
            <div class="field">
                <label>Description:</label>
                <textarea id="description" placeholder="Enter description or details here..."></textarea>
            </div>
        </div>

        <div class="section">
            <h2>Additional Information</h2>
            <div class="field">
                <label>Notes:</label>
                <textarea id="notes" placeholder="Enter any additional notes or information..."></textarea>
            </div>
        </div>

        <div class="footer">
            <p>Template provided by <span class="brand">Enterprise Room Business Hub</span></p>
            <p>This footer can be removed after download if desired.</p>
        </div>
    </div>

    <script>
        // Set today's date as default
        document.getElementById('document-date').valueAsDate = new Date();
        
        // Print functionality
        function printDocument() {
            window.print();
        }
        
        // Add print button (optional)
        // You can add a print button in the template if needed
    </script>
</body>
</html>`;

// All 33 templates with their specific titles
const templates = [
    { id: 'business-plan', title: 'Business Plan Template' },
    { id: 'swot-analysis', title: 'SWOT Analysis Template' },
    { id: 'business-model-canvas', title: 'Business Model Canvas' },
    { id: 'marketing-plan', title: 'Marketing Plan Template' },
    { id: 'invoice', title: 'Invoice Template' }, // Already exists, will be skipped
    { id: 'quotation', title: 'Quotation/Quote Template' },
    { id: 'purchase-order', title: 'Purchase Order Template' },
    { id: 'expense-report', title: 'Expense Report Template' },
    { id: 'budget', title: 'Budget Template' },
    { id: 'cash-flow-statement', title: 'Cash Flow Statement Template' },
    { id: 'profit-loss-statement', title: 'Profit & Loss Statement Template' },
    { id: 'service-agreement', title: 'Service Agreement Template' },
    { id: 'nda', title: 'Non-Disclosure Agreement (NDA)' },
    { id: 'employment-contract', title: 'Employment Contract Template' },
    { id: 'partnership-agreement', title: 'Partnership Agreement Template' },
    { id: 'terms-of-service', title: 'Terms of Service Template' },
    { id: 'privacy-policy', title: 'Privacy Policy Template' },
    { id: 'job-description', title: 'Job Description Template' },
    { id: 'employee-handbook', title: 'Employee Handbook Template' },
    { id: 'performance-review', title: 'Performance Review Template' },
    { id: 'leave-request', title: 'Leave Request Form' },
    { id: 'timesheet', title: 'Timesheet Template' },
    { id: 'customer-onboarding', title: 'Customer Onboarding Checklist' },
    { id: 'sales-proposal', title: 'Sales Proposal Template' },
    { id: 'customer-feedback', title: 'Customer Feedback Form' },
    { id: 'refund-policy', title: 'Refund/Return Policy Template' },
    { id: 'inventory-checklist', title: 'Inventory Checklist Template' },
    { id: 'vendor-agreement', title: 'Vendor/Supplier Agreement Template' },
    { id: 'meeting-agenda', title: 'Meeting Agenda Template' },
    { id: 'project-plan', title: 'Project Plan Template' },
    { id: 'social-media-calendar', title: 'Social Media Content Calendar' },
    { id: 'press-release', title: 'Press Release Template' },
    { id: 'email-newsletter', title: 'Email Newsletter Template' }
];

// Create templates directory if it doesn't exist
const templatesDir = path.join(__dirname, 'templates');
if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
    console.log('✅ Created templates directory');
}

// Create each template file
let created = 0;
let skipped = 0;

templates.forEach(template => {
    const filePath = path.join(templatesDir, `${template.id}.html`);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
        console.log(`⏭️  Skipped ${template.id}.html (already exists)`);
        skipped++;
        return;
    }
    
    // Replace title placeholder
    const content = templateHTML.replace(/{{TITLE}}/g, template.title);
    
    // Write file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Created ${template.id}.html`);
    created++;
});

console.log(`\n📊 Summary:`);
console.log(`   Created: ${created} files`);
console.log(`   Skipped: ${skipped} files`);
console.log(`   Total: ${templates.length} templates`);
console.log(`\n✅ All template files ready!`);
