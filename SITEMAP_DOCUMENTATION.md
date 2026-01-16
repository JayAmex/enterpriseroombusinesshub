# Application Sitemap
**Date:** 2026-01-15  
**Version:** 1.0

---

## 📍 Site Structure Overview

The Enterprise Room Business Hub application consists of **public pages**, **protected pages** (login required), **admin pages**, and **template pages**.

**Total Pages:** 57+ HTML files  
**Public Pages:** 9  
**Protected Pages:** 5  
**Admin Pages:** 2  
**Template Pages:** 33+  
**Utility Pages:** 8

---

## 🌐 Public Pages (No Authentication Required)

### 1. Homepage
- **URL:** `/index.html`
- **Purpose:** Landing page with hero section, statistics, featured content
- **Features:**
  - Hero section with CTA
  - Statistics dashboard (members, businesses, funding)
  - Featured events
  - Featured blog posts
  - Newsletter signup
  - Testimonials
- **Navigation:** Accessible from all pages

---

### 2. Events Page
- **URL:** `/eventspage.html`
- **Purpose:** Display all events (regular and pitch events)
- **Features:**
  - Event listings with filters
  - RSVP functionality (requires login)
  - Calendar view
  - Event fliers
  - Event details
- **Navigation:** Main navigation menu

---

### 3. Blog Page
- **URL:** `/blog.html`
- **Purpose:** Blog articles and publications
- **Features:**
  - Blog post listings
  - Category filters
  - Author information
  - Featured posts
  - Pagination
- **Navigation:** Main navigation menu

---

### 4. Blog Post Detail
- **URL:** `/blog-post.html`
- **Purpose:** Individual blog post view
- **Features:**
  - Full blog content
  - Author information
  - Related posts
  - Social sharing
- **Navigation:** From blog.html

---

### 5. Author Page
- **URL:** `/author.html`
- **Purpose:** Author profile and articles
- **Features:**
  - Author information
  - Author's blog posts
  - Social links
- **Navigation:** From blog posts

---

### 6. Login Page
- **URL:** `/login.html`
- **Purpose:** User authentication
- **Features:**
  - Email/password login
  - "Forgot Password" link
  - "Register" link
  - Redirects to protected pages if not logged in
- **Navigation:** From protected pages or main menu

---

### 7. Registration Page
- **URL:** `/register.html`
- **Purpose:** New user registration
- **Features:**
  - User registration form
  - Email validation
  - Password requirements
  - Auto-login after registration
- **Navigation:** From login.html or main menu

---

### 8. Forgot Password
- **URL:** `/forgot-password.html`
- **Purpose:** Password reset request
- **Features:**
  - Email input for password reset
  - Reset token generation
  - Email notification
- **Navigation:** From login.html

---

### 9. Reset Password
- **URL:** `/reset-password.html`
- **Purpose:** Password reset with token
- **Features:**
  - Token validation
  - New password input
  - Password confirmation
- **Navigation:** From email link

---

### 10. About Us
- **URL:** `/about.html`
- **Purpose:** Company information
- **Features:**
  - Mission statement
  - Vision
  - Team information
  - Company history
- **Navigation:** Footer or main menu

---

### 11. Contact Us
- **URL:** `/contact.html`
- **Purpose:** Contact form and information
- **Features:**
  - Contact form
  - Company address
  - Phone/email
  - Social media links
- **Navigation:** Footer or main menu

---

### 12. FAQ
- **URL:** `/faq.html`
- **Purpose:** Frequently asked questions
- **Features:**
  - Common questions
  - Answers
  - Search functionality
- **Navigation:** Footer or main menu

---

### 13. Sitemap
- **URL:** `/sitemap.html`
- **Purpose:** Site structure overview
- **Features:**
  - All pages listed
  - Organized by category
- **Navigation:** Footer or direct access

---

## 🔒 Protected Pages (Login Required)

### 1. Financial Tools
- **URL:** `/tools.html`
- **Purpose:** Financial calculators and tools
- **Authentication:** Required
- **Features:**
  - 10 built-in calculators:
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
  - Custom tools (admin-created)
  - Currency conversion (NGN/USD/GBP)
  - Save calculations
  - Sidebar navigation
- **Navigation:** Main menu (redirects to login if not authenticated)

---

### 2. Templates
- **URL:** `/templates.html`
- **Purpose:** Document templates library
- **Authentication:** Required
- **Features:**
  - 33 downloadable templates
  - Categories:
    - Business Planning (4)
    - Financial Management (7)
    - Legal & Compliance (6)
    - HR & Employee (5)
    - Sales & Customer (4)
    - Operations (4)
    - Marketing & Branding (3)
  - Download tracking
  - Category filtering
  - Search functionality
- **Navigation:** Main menu or profile page

---

### 3. Directories
- **URL:** `/directories.html`
- **Purpose:** Business, Members, and Partners directories
- **Authentication:** Required
- **Features:**
  - Business Directory
  - Members Directory
  - Partners Directory
  - Search functionality
  - Pagination
  - Filter options
- **Navigation:** Main menu (redirects to login if not authenticated)

---

### 4. Pitch Competition
- **URL:** `/pitch.html`
- **Purpose:** Business pitch submission portal
- **Authentication:** Required
- **Features:**
  - Multi-step pitch form
  - Business selection
  - Funding amount input
  - Pitch deck upload
  - Additional documents
  - Pitch submission tracking
- **Navigation:** Main menu (redirects to login if not authenticated)

---

### 5. User Profile
- **URL:** `/profile.html`
- **Purpose:** User account management
- **Authentication:** Required
- **Features:**
  - Profile information
  - Avatar upload
  - Contact information
  - Business management:
    - View businesses
    - Edit businesses
    - Delete businesses
    - Register new business
  - Saved calculations
  - Saved events
  - Activity dashboard
- **Navigation:** Main menu (shows "My Profile" or "Login/Register")

---

### 6. Register Business
- **URL:** `/register-business.html`
- **Purpose:** Business registration form
- **Authentication:** Required
- **Features:**
  - Multi-step business registration
  - Owner information
  - Business details
  - CAC certificate upload
  - Bank account information
  - Newsletter opt-in
- **Navigation:** From profile.html or direct access

---

### 7. My Events
- **URL:** `/my-events.html`
- **Purpose:** User's RSVP'd events
- **Authentication:** Required
- **Features:**
  - List of RSVP'd events
  - Event details
  - Cancel RSVP
  - Calendar integration
- **Navigation:** From eventspage.html or profile

---

## 👨‍💼 Admin Pages

### 1. Admin Login
- **URL:** `/admin-login.html`
- **Purpose:** Admin authentication
- **Features:**
  - Username/password login
  - Admin token generation
  - Redirects to admin dashboard
- **Navigation:** Direct access or from main menu

---

### 2. Admin Dashboard
- **URL:** `/admin.html`
- **Purpose:** Content management system
- **Authentication:** Admin only
- **Features:**
  - **Overview Dashboard:**
    - Statistics (users, businesses, events, blog posts)
    - Quick actions
    - Recent activity
  - **User Management:**
    - View all users
    - User details
    - Activate/deactivate users
  - **Business Management:**
    - View all businesses
    - Approve/reject businesses
    - Verify CAC certificates
    - Business details
  - **Event Management:**
    - Create events
    - Edit events
    - Delete events
    - Event status management
  - **Blog Management:**
    - Create blog posts
    - Edit blog posts
    - Publish/unpublish
    - Image upload
  - **Directory Management:**
    - Add/edit/delete members
    - Add/edit/delete partners
    - Add/edit/delete businesses
  - **Template Management:**
    - View template download stats
    - Hide/show templates
    - Delete templates
    - Reset download counts
  - **Tool Management:**
    - Create custom tools
    - Edit custom tools
    - Delete custom tools
    - Tool visibility management
  - **Settings:**
    - Exchange rates
    - Calculator defaults
    - Homepage content
- **Navigation:** From admin-login.html

---

## 📄 Template Pages (33 Templates)

All templates are located in `/templates/` directory and are accessible from `/templates.html`.

### Business Planning (4 templates)
1. `business-plan.html` - Business Plan Template
2. `swot-analysis.html` - SWOT Analysis Template
3. `business-model-canvas.html` - Business Model Canvas
4. `marketing-plan.html` - Marketing Plan Template

### Financial Management (7 templates)
5. `invoice.html` - Invoice Template
6. `quotation.html` - Quotation/Quote Template
7. `purchase-order.html` - Purchase Order Template
8. `expense-report.html` - Expense Report Template
9. `budget.html` - Budget Template
10. `cash-flow-statement.html` - Cash Flow Statement Template
11. `profit-loss-statement.html` - Profit & Loss Statement Template

### Legal & Compliance (6 templates)
12. `service-agreement.html` - Service Agreement Template
13. `nda.html` - Non-Disclosure Agreement (NDA)
14. `employment-contract.html` - Employment Contract Template
15. `partnership-agreement.html` - Partnership Agreement Template
16. `terms-of-service.html` - Terms of Service Template
17. `privacy-policy.html` - Privacy Policy Template

### HR & Employee (5 templates)
18. `job-description.html` - Job Description Template
19. `employee-handbook.html` - Employee Handbook Template
20. `performance-review.html` - Performance Review Template
21. `leave-request.html` - Leave Request Form
22. `timesheet.html` - Timesheet Template

### Sales & Customer (4 templates)
23. `customer-onboarding.html` - Customer Onboarding Checklist
24. `sales-proposal.html` - Sales Proposal Template
25. `customer-feedback.html` - Customer Feedback Form
26. `refund-policy.html` - Refund/Return Policy Template

### Operations (4 templates)
27. `inventory-checklist.html` - Inventory Checklist Template
28. `vendor-agreement.html` - Vendor/Supplier Agreement Template
29. `meeting-agenda.html` - Meeting Agenda Template
30. `project-plan.html` - Project Plan Template

### Marketing & Branding (3 templates)
31. `social-media-calendar.html` - Social Media Content Calendar
32. `press-release.html` - Press Release Template
33. `email-newsletter.html` - Email Newsletter Template

---

## 🔗 Navigation Structure

### Main Navigation (All Pages)
```
Home | Events | Blog | Tools | Templates | Pitch Competition | Directories | My Profile/Login
```

### Footer Navigation (All Pages)
```
Quick Links:
- Home
- Events
- Blog
- Directories

Resources:
- Financial Tools
- Pitch Competition
- My Profile
- About Us

Contact:
- Contact Us
- FAQ
```

### Admin Navigation (Admin Dashboard)
```
Overview | Users | Businesses | Events | Blog | Directories | Templates | Tools | Settings
```

---

## 🔄 User Flow Diagrams

### New User Journey
```
Homepage → Click Protected Page → Login/Register → Profile → Use Features
```

### Returning User Journey
```
Homepage → Login → Profile → Use Features
```

### Admin Journey
```
Admin Login → Admin Dashboard → Manage Content
```

---

## 📱 Mobile Navigation

- Hamburger menu on mobile devices
- Collapsible navigation
- Touch-friendly buttons
- Responsive design

---

## 🔍 Search Functionality

- **Global Search:** Available in main navigation
- **Search Scope:**
  - Pages
  - Blog posts
  - Events
  - Directories
- **Search Results:** Displayed in dropdown

---

## 🎯 Key Features by Page Type

### Public Pages
- No authentication required
- Accessible to all visitors
- SEO optimized
- Social sharing enabled

### Protected Pages
- Authentication required
- User-specific content
- Personalization
- Activity tracking

### Admin Pages
- Admin authentication required
- Full content management
- Analytics and statistics
- System configuration

---

## 📊 Page Statistics

- **Total HTML Files:** 57+
- **Public Pages:** 13
- **Protected Pages:** 7
- **Admin Pages:** 2
- **Template Pages:** 33+
- **Utility Pages:** 2 (check-auth.html, sitemap.html)

---

## 🔐 Authentication Requirements

### Public Access
- Homepage
- Events (viewing)
- Blog (viewing)
- About, Contact, FAQ
- Login/Register

### User Authentication Required
- Tools
- Templates
- Directories
- Pitch Competition
- Profile
- Register Business
- My Events
- RSVP to events

### Admin Authentication Required
- Admin Dashboard
- Admin Login

---

## 📝 Notes

1. **Templates:** All template files are in `/templates/` directory
2. **Assets:** Images, logos in `/assets/` directory
3. **CSS:** Shared stylesheet in `/css/styles.css`
4. **JavaScript:** Shared functions in `/js/common.js`
5. **API:** All API endpoints use relative paths (`/api/...`)

---

**Last Updated:** 2026-01-15  
**Version:** 1.0  
**Status:** ✅ Production Ready
