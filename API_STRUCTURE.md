# API Structure Reference

This document outlines the recommended API structure for connecting the frontend to the database backend.

## Base URL
```
Production: https://api.enterpriseroom.com
Development: http://localhost:3000
```

## Authentication

### Headers
All authenticated requests require:
```
Authorization: Bearer <token>
Content-Type: application/json
```

## Endpoints

### Authentication

#### User Login
```
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password123" }
Response: { "token": "jwt_token", "user": { "id": 1, "name": "John Doe", "email": "..." } }
```

#### User Register
```
POST /api/auth/register
Body: { "name": "John Doe", "email": "user@example.com", "password": "password123", "phone": "..." }
Response: { "token": "jwt_token", "user": { ... } }
```

#### Admin Login
```
POST /api/auth/admin/login
Body: { "username": "admin", "password": "admin123" }
Response: { "token": "admin_jwt_token", "admin": { "id": 1, "username": "admin", "role": "super_admin" } }
```

#### Logout
```
POST /api/auth/logout
Headers: { "Authorization": "Bearer <token>" }
Response: { "message": "Logged out successfully" }
```

---

### Users

#### Get User Profile
```
GET /api/users/profile
Response: { "id": 1, "name": "John Doe", "email": "...", "avatar_url": "...", "businesses": [...] }
```

#### Update User Profile
```
PUT /api/users/profile
Headers: { "Authorization": "Bearer <token>" }
Body: { "phone": "1234567890", "avatar_url": "...", "title": "...", "occupation": "...", "state": "...", "country": "..." }
Response: { "message": "Profile updated", "user": { ... } }
Note: name field cannot be updated by user (admin-only)
```

#### Upload User Avatar
```
POST /api/users/avatar
Headers: { "Authorization": "Bearer <token>" }
Body: FormData with "avatar" file field
Response: { "message": "Avatar uploaded successfully", "avatar_url": "/uploads/avatars/avatar-1-1234567890.jpg", "user": { ... } }
```

#### Get User's Businesses
```
GET /api/users/businesses
Response: { "businesses": [{ "id": 1, "business_name": "...", "status": "Approved", ... }] }
```

---

### Businesses

#### Register Business
```
POST /api/businesses
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "business_name": "My Business",
  "business_address": "123 Main St",
  "business_sector": "Technology",
  "year_of_formation": 2020,
  "number_of_employees": 10,
  "cac_registered": "yes",
  "cac_certificate_url": "<url>",
  "owner_name": "John Doe",
  "owner_relationship": "Owner/Founder",
  ...
}
Response: { "message": "Business registered", "business": { "id": 1, ... } }
```

#### Get Business Details
```
GET /api/businesses/:id
Response: { "id": 1, "business_name": "...", "status": "Approved", ... }
```

#### Update User's Business
```
PUT /api/businesses/:id
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "business_name": "Updated Business Name",
  "business_address": "New Address",
  "business_sector": "Technology",
  ...
}
Response: { "message": "Business updated successfully", "business": { ... } }
```

#### Delete User's Business
```
DELETE /api/businesses/:id
Headers: { "Authorization": "Bearer <token>" }
Response: { "message": "Business deleted successfully", "business_id": 1 }
```

#### Get Approved Businesses (Directory)
```
GET /api/businesses/approved?page=1&limit=30
Response: {
  "businesses": [...],
  "pagination": { "page": 1, "limit": 30, "total": 100, "pages": 4 }
}
```

---

### Events

#### Get All Events
```
GET /api/events?status=upcoming&type=regular&page=1&limit=20
Response: {
  "events": [{ "id": 1, "title": "...", "date_display": "...", ... }],
  "pagination": { ... }
}
```

#### Get Pitch Events
```
GET /api/events/pitch
Response: { "events": [{ "id": 1, "title": "Pitch 2.0", ... }] }
```

#### RSVP to Event
```
POST /api/events/:id/rsvp
Response: { "message": "RSVP successful", "rsvp": { "id": 1, ... } }
```

#### Cancel RSVP
```
DELETE /api/events/:id/rsvp
Response: { "message": "RSVP cancelled" }
```

#### Check RSVP Status
```
GET /api/events/:id/rsvp
Response: { "is_rsvped": true }
```

---

### Pitch Competition

#### Register for Pitch Event
```
POST /api/pitch/events/:id/register
Response: { "message": "Registered for pitch event" }
```

#### Submit Pitch Entry
```
POST /api/pitch/entries
Body: {
  "business_id": 1,
  "event_id": 1,
  "pitch_title": "...",
  "pitch_description": "...",
  "funding_amount": 5000000,
  "use_of_funds": "...",
  "business_model": "...",
  "market_opportunity": "...",
  "pitch_deck": "<file>",
  "additional_docs": [<files>]
}
Response: { "message": "Pitch entry submitted", "entry": { "id": 1, ... } }
```

#### Get User's Pitch Entries
```
GET /api/pitch/entries
Response: { "entries": [{ "id": 1, "pitch_title": "...", "status": "Submitted", ... }] }
```

---

### Blog

#### Get Blog Posts
```
GET /api/blog?category=articles&page=1&limit=10
Response: {
  "posts": [{ "id": 1, "title": "...", "excerpt": "...", ... }],
  "pagination": { ... }
}
```

#### Get Single Blog Post
```
GET /api/blog/:id
Response: { "id": 1, "title": "...", "content": "...", ... }
```

---

### Directories

#### Get Business Directory
```
GET /api/directories/business?page=1&limit=30&search=tech
Response: {
  "businesses": [...],
  "pagination": { ... }
}
```

#### Get Members Directory
```
GET /api/directories/members?page=1&limit=30
Response: {
  "members": [{ "id": 1, "name": "...", "title": "...", ... }],
  "pagination": { ... }
}
```

#### Get Partners Directory
```
GET /api/directories/partners?page=1&limit=30
Response: {
  "partners": [{ "id": 1, "address": "...", "email": "...", ... }],
  "pagination": { ... }
}
```

---

### Tools

#### Get Custom Tools
```
GET /api/tools/custom
Response: {
  "tools": [{ "id": 1, "name": "...", "inputs": [...], ... }]
}
```

#### Get Calculator Settings
```
GET /api/tools/settings
Response: {
  "exchange_rates": { "usd": 1450, "gbp": 1850 },
  "defaults": {
    "loan_rate": 22,
    "loan_term": 24,
    "mortgage_rate": 16,
    "mortgage_term": 15,
    "tax_rate": 7.5
  }
}
```

---

### Templates

#### Get All Templates
```
GET /api/templates
Response: {
  "templates": [
    {
      "template_id": "business-plan",
      "name": "Business Plan Template",
      "description": "Complete business plan with executive summary...",
      "category": "Business Planning",
      "file_path": "templates/business-plan.html",
      "is_active": true
    },
    ...
  ]
}
```

#### Get Template Download Statistics
```
GET /api/templates/stats
Response: {
  "stats": [
    {
      "template_id": "business-plan",
      "name": "Business Plan Template",
      "category": "Business Planning",
      "download_count": 45,
      "unique_users": 32,
      "last_downloaded": "2026-01-15T10:30:00Z"
    },
    ...
  ]
}
```

#### Record Template Download
```
POST /api/templates/:id/download
Headers: { "Authorization": "Bearer <token>" } (optional)
Response: {
  "message": "Download recorded",
  "download_count": 46,
  "file_path": "templates/business-plan.html"
}
```

#### Get Template Download Count
```
GET /api/templates/:id/count
Response: { "count": 45 }
```

#### Get Multiple Template Download Counts (Batch)
```
POST /api/templates/counts
Body: { "template_ids": ["business-plan", "invoice", "quotation"] }
Response: {
  "counts": {
    "business-plan": 45,
    "invoice": 120,
    "quotation": 89
  }
}
```

---

### Admin Endpoints

#### Dashboard Statistics
```
GET /api/admin/dashboard/stats
Response: {
  "registered_users": 150,
  "registered_businesses": 45,
  "members": 25,
  "events": 12,
  "blog_posts": 8,
  "directory_entries": 30
}
```

#### Events Management
```
POST /api/admin/events
PUT /api/admin/events/:id
DELETE /api/admin/events/:id
GET /api/admin/events
```

#### Blog Management
```
POST /api/admin/blog
PUT /api/admin/blog/:id
DELETE /api/admin/blog/:id
GET /api/admin/blog
```

#### Directory Management
```
POST /api/admin/directories/members
PUT /api/admin/directories/members/:id
DELETE /api/admin/directories/members/:id

POST /api/admin/directories/partners
PUT /api/admin/directories/partners/:id
DELETE /api/admin/directories/partners/:id

POST /api/admin/directories/business
PUT /api/admin/directories/business/:id
DELETE /api/admin/directories/business/:id
```

#### Business Management
```
GET /api/admin/businesses?status=pending
PUT /api/admin/businesses/:id/approve
PUT /api/admin/businesses/:id/reject
PUT /api/admin/businesses/:id/verify
```

#### User Management
```
GET /api/admin/users?page=1&limit=20
PUT /api/admin/users/:id
DELETE /api/admin/users/:id
```

#### Settings Management
```
GET /api/admin/settings
PUT /api/admin/settings
Body: { "exchange_rate_usd": 1500, "calculator_default_loan_rate": 25, ... }
```

#### Homepage Content
```
Note: Homepage content is managed directly from the admin dashboard
and stored in localStorage or settings table. No separate API endpoint needed.
```

#### Custom Tools Management
```
POST /api/admin/tools
PUT /api/admin/tools/:id
DELETE /api/admin/tools/:id
GET /api/admin/tools
```

#### Template Management
```
GET /api/admin/templates/stats
Response: {
  "stats": [
    {
      "template_id": "business-plan",
      "name": "Business Plan Template",
      "category": "Business Planning",
      "download_count": 45,
      "unique_users": 32,
      "last_downloaded": "2026-01-15T10:30:00Z"
    },
    ...
  ],
  "total_downloads": 1250,
  "total_templates": 33
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Common Error Codes
- `AUTH_REQUIRED`: Authentication required
- `AUTH_INVALID`: Invalid credentials
- `AUTH_EXPIRED`: Token expired
- `PERMISSION_DENIED`: Insufficient permissions
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Duplicate entry (e.g., email already exists)
- `SERVER_ERROR`: Internal server error

### Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

---

## File Uploads

### Upload Avatar
```
POST /api/upload/avatar
Content-Type: multipart/form-data
Body: { "file": <image_file> }
Response: { "url": "https://storage.example.com/avatars/user123.jpg" }
```

### Upload Business Certificate
```
POST /api/upload/certificate
Content-Type: multipart/form-data
Body: { "file": <pdf_or_image_file> }
Response: { "url": "https://storage.example.com/certificates/cert123.pdf" }
```

### Upload Pitch Deck
```
POST /api/upload/pitch-deck
Content-Type: multipart/form-data
Body: { "file": <pdf_or_ppt_file> }
Response: { "url": "https://storage.example.com/pitch-decks/deck123.pdf" }
```

---

## Pagination

All list endpoints support pagination:
```
GET /api/endpoint?page=1&limit=20&sort=created_at&order=desc
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## Search & Filtering

Most list endpoints support search and filtering:
```
GET /api/endpoint?search=keyword&status=active&category=tech&date_from=2024-01-01
```

---

## Rate Limiting

API rate limits:
- Authentication endpoints: 5 requests per minute
- General endpoints: 100 requests per minute
- Admin endpoints: 200 requests per minute

Response headers include rate limit info:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

