// Node.js script to generate all template files
// Run with: node create-all-templates.js

const fs = require('fs');
const path = require('path');

const templateBase = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} | Enterprise Room Business Hub</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background: #f5f5f5;
        }
        .template-container {
            background: white;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #1e40af;
        }
        .header h1 {
            color: #1e40af;
            margin-bottom: 10px;
        }
        .content {
            line-height: 1.8;
            color: #333;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #1e40af;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
        }
        .field {
            margin-bottom: 15px;
        }
        .field label {
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
        }
        .field input, .field textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .enterprise-footer {
            margin-top: 40px;
            padding: 15px;
            background: #e6f2ff;
            border-left: 4px solid #1e40af;
            font-size: 0.85rem;
            color: #666;
        }
        .enterprise-footer strong {
            color: #1e40af;
        }
        @media print {
            body { background: white; padding: 0; }
            .enterprise-footer { display: none; }
        }
    </style>
</head>
<body>
    <div class="template-container">
        <div class="header">
            <h1>{{TITLE}}</h1>
            <p>{{DESCRIPTION}}</p>
        </div>
        <div class="content">
            {{CONTENT}}
        </div>
        <div class="enterprise-footer">
            <strong>Template provided by Enterprise Room Business Hub</strong><br>
            This document template is free to use. You may remove this footer if desired.
        </div>
    </div>
</body>
</html>`;

const templates = [
    { id: 'business-plan', title: 'Business Plan Template', desc: 'Complete business plan document', content: '<div class="section"><h2>Executive Summary</h2><div class="field"><label>Company Name:</label><input type="text" placeholder="Enter company name"></div><div class="field"><label>Business Description:</label><textarea rows="4" placeholder="Describe your business"></textarea></div></div><div class="section"><h2>Market Analysis</h2><div class="field"><label>Target Market:</label><textarea rows="3" placeholder="Describe your target market"></textarea></div><div class="field"><label>Competitive Analysis:</label><textarea rows="3" placeholder="Analyze your competitors"></textarea></div></div><div class="section"><h2>Financial Projections</h2><div class="field"><label>Revenue Projections:</label><input type="text" placeholder="Enter revenue projections"></div><div class="field"><label>Expense Projections:</label><input type="text" placeholder="Enter expense projections"></div></div>' },
    { id: 'swot-analysis', title: 'SWOT Analysis Template', desc: 'Business strengths, weaknesses, opportunities, threats', content: '<div class="section"><h2>Strengths</h2><textarea rows="5" placeholder="List your business strengths"></textarea></div><div class="section"><h2>Weaknesses</h2><textarea rows="5" placeholder="List your business weaknesses"></textarea></div><div class="section"><h2>Opportunities</h2><textarea rows="5" placeholder="List opportunities in the market"></textarea></div><div class="section"><h2>Threats</h2><textarea rows="5" placeholder="List potential threats"></textarea></div>' },
    { id: 'business-model-canvas', title: 'Business Model Canvas', desc: 'One-page business model framework', content: '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;"><div class="section"><h2>Key Partners</h2><textarea rows="4"></textarea></div><div class="section"><h2>Key Activities</h2><textarea rows="4"></textarea></div><div class="section"><h2>Key Resources</h2><textarea rows="4"></textarea></div><div class="section"><h2>Value Propositions</h2><textarea rows="4"></textarea></div><div class="section"><h2>Customer Relationships</h2><textarea rows="4"></textarea></div><div class="section"><h2>Channels</h2><textarea rows="4"></textarea></div><div class="section"><h2>Customer Segments</h2><textarea rows="4"></textarea></div><div class="section"><h2>Cost Structure</h2><textarea rows="4"></textarea></div><div class="section"><h2>Revenue Streams</h2><textarea rows="4"></textarea></div></div>' },
    { id: 'marketing-plan', title: 'Marketing Plan Template', desc: 'Comprehensive marketing strategy', content: '<div class="section"><h2>Marketing Objectives</h2><textarea rows="4" placeholder="Define your marketing objectives"></textarea></div><div class="section"><h2>Target Audience</h2><textarea rows="3" placeholder="Describe your target audience"></textarea></div><div class="section"><h2>Marketing Channels</h2><textarea rows="4" placeholder="List marketing channels"></textarea></div><div class="section"><h2>Budget</h2><div class="field"><label>Marketing Budget (₦):</label><input type="text" placeholder="Enter budget amount"></div></div><div class="section"><h2>Key Performance Indicators</h2><textarea rows="3" placeholder="Define KPIs"></textarea></div>' },
    { id: 'quotation', title: 'Quotation Template', desc: 'Professional price quotation', content: '<div class="section"><h2>Quotation Details</h2><div class="field"><label>Quotation #:</label><input type="text" placeholder="QUO-001"></div><div class="field"><label>Date:</label><input type="date"></div><div class="field"><label>Valid Until:</label><input type="date"></div></div><div class="section"><h2>Client Information</h2><div class="field"><label>Client Name:</label><input type="text"></div><div class="field"><label>Client Address:</label><textarea rows="2"></textarea></div></div><div class="section"><h2>Items/Services</h2><table style="width:100%; border-collapse:collapse;"><thead><tr style="background:#1e40af;color:white;"><th style="padding:10px;text-align:left;">Description</th><th style="padding:10px;">Qty</th><th style="padding:10px;">Unit Price (₦)</th><th style="padding:10px;">Total (₦)</th></tr></thead><tbody><tr><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="number" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td></tr></tbody></table></div><div class="section"><h2>Terms & Conditions</h2><textarea rows="4" placeholder="Payment terms and conditions"></textarea></div>' },
    { id: 'purchase-order', title: 'Purchase Order Template', desc: 'Standardized purchase order form', content: '<div class="section"><h2>Purchase Order Details</h2><div class="field"><label>PO Number:</label><input type="text" placeholder="PO-001"></div><div class="field"><label>Date:</label><input type="date"></div><div class="field"><label>Delivery Date:</label><input type="date"></div></div><div class="section"><h2>Vendor Information</h2><div class="field"><label>Vendor Name:</label><input type="text"></div><div class="field"><label>Vendor Address:</label><textarea rows="2"></textarea></div></div><div class="section"><h2>Items Ordered</h2><table style="width:100%; border-collapse:collapse;"><thead><tr style="background:#1e40af;color:white;"><th style="padding:10px;text-align:left;">Item</th><th style="padding:10px;">Qty</th><th style="padding:10px;">Unit Price (₦)</th><th style="padding:10px;">Total (₦)</th></tr></thead><tbody><tr><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="number" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td></tr></tbody></table></div>' },
    { id: 'expense-report', title: 'Expense Report Template', desc: 'Employee expense tracking form', content: '<div class="section"><h2>Employee Information</h2><div class="field"><label>Employee Name:</label><input type="text"></div><div class="field"><label>Department:</label><input type="text"></div><div class="field"><label>Report Period:</label><input type="text" placeholder="Month/Year"></div></div><div class="section"><h2>Expenses</h2><table style="width:100%; border-collapse:collapse;"><thead><tr style="background:#1e40af;color:white;"><th style="padding:10px;text-align:left;">Date</th><th style="padding:10px;">Description</th><th style="padding:10px;">Category</th><th style="padding:10px;">Amount (₦)</th></tr></thead><tbody><tr><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="date" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td></tr></tbody></table></div><div class="section"><h2>Total Expenses</h2><div class="field"><label>Total Amount (₦):</label><input type="text" placeholder="0.00"></div></div>' },
    { id: 'budget', title: 'Budget Template', desc: 'Monthly and annual budget planning', content: '<div class="section"><h2>Budget Period</h2><div class="field"><label>Period:</label><input type="text" placeholder="Month/Year"></div></div><div class="section"><h2>Income</h2><div class="field"><label>Projected Income (₦):</label><input type="text"></div></div><div class="section"><h2>Expenses</h2><table style="width:100%; border-collapse:collapse;"><thead><tr style="background:#1e40af;color:white;"><th style="padding:10px;text-align:left;">Category</th><th style="padding:10px;">Budgeted (₦)</th><th style="padding:10px;">Actual (₦)</th><th style="padding:10px;">Variance (₦)</th></tr></thead><tbody><tr><td style="padding:10px;border-bottom:1px solid #ddd;">Salaries</td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td></tr><tr><td style="padding:10px;border-bottom:1px solid #ddd;">Marketing</td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td></tr><tr><td style="padding:10px;border-bottom:1px solid #ddd;">Operations</td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td></tr></tbody></table></div>' },
    { id: 'cash-flow-statement', title: 'Cash Flow Statement Template', desc: 'Track monthly cash inflows and outflows', content: '<div class="section"><h2>Cash Flow Statement</h2><div class="field"><label>Period:</label><input type="text" placeholder="Month/Year"></div></div><div class="section"><h2>Cash Inflows</h2><table style="width:100%; border-collapse:collapse;"><thead><tr style="background:#1e40af;color:white;"><th style="padding:10px;text-align:left;">Source</th><th style="padding:10px;">Amount (₦)</th></tr></thead><tbody><tr><td style="padding:10px;border-bottom:1px solid #ddd;">Sales Revenue</td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td></tr><tr><td style="padding:10px;border-bottom:1px solid #ddd;">Other Income</td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td></tr></tbody></table></div><div class="section"><h2>Cash Outflows</h2><table style="width:100%; border-collapse:collapse;"><thead><tr style="background:#1e40af;color:white;"><th style="padding:10px;text-align:left;">Category</th><th style="padding:10px;">Amount (₦)</th></tr></thead><tbody><tr><td style="padding:10px;border-bottom:1px solid #ddd;">Operating Expenses</td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td></tr><tr><td style="padding:10px;border-bottom:1px solid #ddd;">Capital Expenditures</td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td></tr></tbody></table></div><div class="section"><h2>Net Cash Flow</h2><div class="field"><label>Net Cash Flow (₦):</label><input type="text" placeholder="0.00"></div></div>' },
    { id: 'profit-loss-statement', title: 'Profit & Loss Statement Template', desc: 'Monthly and quarterly P&L statement', content: '<div class="section"><h2>Profit & Loss Statement</h2><div class="field"><label>Period:</label><input type="text" placeholder="Month/Quarter/Year"></div></div><div class="section"><h2>Revenue</h2><div class="field"><label>Total Revenue (₦):</label><input type="text"></div></div><div class="section"><h2>Cost of Goods Sold</h2><div class="field"><label>COGS (₦):</label><input type="text"></div><div class="field"><label>Gross Profit (₦):</label><input type="text"></div></div><div class="section"><h2>Operating Expenses</h2><table style="width:100%; border-collapse:collapse;"><thead><tr style="background:#1e40af;color:white;"><th style="padding:10px;text-align:left;">Expense Category</th><th style="padding:10px;">Amount (₦)</th></tr></thead><tbody><tr><td style="padding:10px;border-bottom:1px solid #ddd;">Salaries & Wages</td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td></tr><tr><td style="padding:10px;border-bottom:1px solid #ddd;">Rent</td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td></tr><tr><td style="padding:10px;border-bottom:1px solid #ddd;">Marketing</td><td style="padding:10px;border-bottom:1px solid #ddd;"><input type="text" style="width:100%;border:none;"></td></tr></tbody></table></div><div class="section"><h2>Net Profit/Loss</h2><div class="field"><label>Net Profit/Loss (₦):</label><input type="text" placeholder="0.00"></div></div>' }
];

// Continue with remaining templates...
// Due to length, I'll create them directly in the next step
