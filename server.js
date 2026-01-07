// Enterprise Room Business Hub - Backend API Server
// Run with: node server.js or npm run dev

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// JWT Secret - use environment variable or default (for local development)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set in environment variables!');
    console.warn('⚠️  Using default secret - Set JWT_SECRET in production!');
}

// Database configuration from environment variables
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error('❌ ERROR: Database credentials not set in environment variables!');
    console.error('   Required variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('   Please create a .env file with your database credentials.');
    console.error('   See .env.example for reference.');
    process.exit(1);
}

const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Add SSL only if DB_SSL is explicitly set to 'true'
if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = {
        rejectUnauthorized: false
    };
}

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'blog');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'blog-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(__dirname));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test database connection on startup
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connection pool created successfully!');
        const [rows] = await connection.execute('SELECT 1 as test');
        connection.release();
        console.log('✅ Database connection test passed!');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('   Error Code:', error.code);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Access Denied - Possible causes:');
            console.error('   1. Password in .env does not match Railway dashboard');
            console.error('   2. MySQL user permissions were reset when password was changed');
            console.error('   3. Railway requires password to be reset in their dashboard');
            console.error('\n   Action required:');
            console.error('   - Verify password in Railway dashboard matches .env file exactly');
            console.error('   - Check for extra spaces or quotes in .env password');
            console.error('   - If password was changed, you may need to grant permissions:');
            console.error('     GRANT ALL PRIVILEGES ON *.* TO \'root\'@\'%\' IDENTIFIED BY \'your_password\';');
            console.error('     FLUSH PRIVILEGES;');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
            console.error('\n💡 Connection Timeout - Possible causes:');
            console.error('   1. Wrong host or port in .env');
            console.error('   2. Railway service is down');
            console.error('   3. Firewall blocking connection');
        }
        
        return false;
    }
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: true, message: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: true, message: 'Invalid or expired token', code: 'AUTH_INVALID' });
        }
        req.user = user;
        next();
    });
}

// Admin authentication middleware
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: true, message: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    jwt.verify(token, JWT_SECRET, (err, admin) => {
        if (err) {
            return res.status(403).json({ error: true, message: 'Invalid or expired token', code: 'AUTH_INVALID' });
        }
        if (!admin.isAdmin) {
            return res.status(403).json({ error: true, message: 'Admin access required', code: 'PERMISSION_DENIED' });
        }
        req.admin = admin;
        next();
    });
}

// =====================================================
// HEALTH CHECK & INFO
// =====================================================

app.get('/', (req, res) => {
    res.json({
        message: 'Enterprise Room Business Hub API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            businesses: '/api/businesses',
            events: '/api/events',
            blog: '/api/blog',
            directories: '/api/directories',
            pitch: '/api/pitch',
            admin: '/api/admin',
            tools: '/api/tools'
        }
    });
});

app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT 1 as test');
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
});

// =====================================================
// AUTHENTICATION ENDPOINTS
// =====================================================

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: true,
                message: 'Email and password are required',
                code: 'VALIDATION_ERROR'
            });
        }

        const [users] = await pool.execute(
            'SELECT id, email, password_hash, name, avatar_url, is_active FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials',
                code: 'AUTH_INVALID'
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({
                error: true,
                message: 'Account is inactive',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials',
                code: 'AUTH_INVALID'
            });
        }

        // Update last login
        await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: false },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Get user with UUID
        const [userWithUUID] = await pool.execute(
            'SELECT id, uuid, name, email, avatar_url FROM users WHERE id = ?',
            [user.id]
        );
        const userData = userWithUUID[0];

        res.json({
            token,
            user: {
                id: userData.id,
                uuid: userData.uuid,
                name: userData.name,
                email: userData.email,
                avatar_url: userData.avatar_url
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error during login',
            code: 'SERVER_ERROR'
        });
    }
});

// User Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: true,
                message: 'Name, email, and password are required',
                code: 'VALIDATION_ERROR'
            });
        }

        // Check if user already exists
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({
                error: true,
                message: 'Email already registered',
                code: 'DUPLICATE_ENTRY'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate UUID for new user
        const { randomUUID } = require('crypto');
        const uuid = randomUUID();

        // Create user with UUID
        const [result] = await pool.execute(
            'INSERT INTO users (uuid, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)',
            [uuid, name, email, passwordHash, phone || null]
        );

        // Generate JWT token
        const token = jwt.sign(
            { id: result.insertId, uuid: uuid, email: email, isAdmin: false },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: result.insertId,
                uuid: uuid,
                name,
                email,
                phone
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error during registration',
            code: 'SERVER_ERROR'
        });
    }
});

// Admin Login
app.post('/api/auth/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: true,
                message: 'Username and password are required',
                code: 'VALIDATION_ERROR'
            });
        }

        const [admins] = await pool.execute(
            'SELECT id, username, password_hash, email, full_name, role, is_active FROM admin_users WHERE username = ?',
            [username]
        );

        if (admins.length === 0) {
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials',
                code: 'AUTH_INVALID'
            });
        }

        const admin = admins[0];

        if (!admin.is_active) {
            return res.status(403).json({
                error: true,
                message: 'Account is inactive',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, admin.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials',
                code: 'AUTH_INVALID'
            });
        }

        // Update last login
        await pool.execute('UPDATE admin_users SET last_login = NOW() WHERE id = ?', [admin.id]);

        // Generate JWT token
        const token = jwt.sign(
            { id: admin.id, username: admin.username, isAdmin: true, role: admin.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                full_name: admin.full_name,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error during admin login',
            code: 'SERVER_ERROR'
        });
    }
});

// =====================================================
// USER ENDPOINTS
// =====================================================

// Get User Profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, name, email, phone, avatar_url, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
                code: 'NOT_FOUND'
            });
        }

        // Get user's businesses
        const [businesses] = await pool.execute(
            'SELECT id, business_name, status, registered_date FROM businesses WHERE user_id = ?',
            [req.user.id]
        );

        res.json({
            ...users[0],
            businesses
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Update User Profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const { name, phone, avatar_url } = req.body;
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone);
        }
        if (avatar_url !== undefined) {
            updates.push('avatar_url = ?');
            values.push(avatar_url);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: true,
                message: 'No fields to update',
                code: 'VALIDATION_ERROR'
            });
        }

        values.push(req.user.id);
        await pool.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Get updated user
        const [users] = await pool.execute(
            'SELECT id, name, email, phone, avatar_url FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json({
            message: 'Profile updated',
            user: users[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get User's Businesses
app.get('/api/users/businesses', authenticateToken, async (req, res) => {
    try {
        const [businesses] = await pool.execute(
            'SELECT * FROM businesses WHERE user_id = ? ORDER BY registered_date DESC',
            [req.user.id]
        );

        res.json({ businesses });
    } catch (error) {
        console.error('Get user businesses error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// =====================================================
// BUSINESSES ENDPOINTS
// =====================================================

// Register Business
app.post('/api/businesses', authenticateToken, async (req, res) => {
    try {
        const {
            business_name,
            business_address,
            business_sector,
            year_of_formation,
            number_of_employees,
            cac_registered,
            cac_certificate_url,
            has_business_bank_account,
            bank_name,
            account_number,
            account_name,
            owner_name,
            owner_relationship,
            newsletter_optin
        } = req.body;

        if (!business_name || !business_address || !owner_name || !owner_relationship) {
            return res.status(400).json({
                error: true,
                message: 'Business name, address, owner name, and relationship are required',
                code: 'VALIDATION_ERROR'
            });
        }

        // Check for duplicate: same user cannot register same business name twice
        const [existing] = await pool.execute(
            'SELECT id FROM businesses WHERE user_id = ? AND LOWER(TRIM(business_name)) = LOWER(TRIM(?))',
            [req.user.id, business_name]
        );
        if (existing.length > 0) {
            return res.status(409).json({
                error: true,
                message: 'You have already registered a business with this name',
                code: 'DUPLICATE_ENTRY'
            });
        }

        // Determine status based on CAC certificate
        const status = cac_certificate_url ? 'Verified Business' : 'Pending Review';

        // Insert into businesses table (for user's business records)
        const [result] = await pool.execute(
            `INSERT INTO businesses (
                user_id, business_name, business_address, business_sector, year_of_formation,
                number_of_employees, cac_registered, cac_certificate_url, has_business_bank_account,
                bank_name, account_number, account_name, owner_name, owner_relationship,
                newsletter_optin, status, registered_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
            [
                req.user.id, business_name, business_address, business_sector || null,
                year_of_formation || null, number_of_employees || null, cac_registered,
                cac_certificate_url || null, has_business_bank_account, bank_name || null,
                account_number || null, account_name || null, owner_name, owner_relationship,
                newsletter_optin || false, status
            ]
        );

        // Also insert into directory_businesses so it appears in the Business Directory
        // Get user's email for the directory entry
        const [userData] = await pool.execute('SELECT email FROM users WHERE id = ?', [req.user.id]);
        const userEmail = userData[0]?.email || null;

        // Check for duplicate in directory_businesses
        const [existingDir] = await pool.execute(
            'SELECT id FROM directory_businesses WHERE LOWER(TRIM(business_name)) = LOWER(TRIM(?))',
            [business_name]
        );

        if (existingDir.length === 0) {
            // Insert into directory_businesses
            await pool.execute(
                `INSERT INTO directory_businesses (business_name, address, email, phone, website, added_by)
                 VALUES (?, ?, ?, ?, ?, NULL)`,
                [
                    business_name,
                    business_address,
                    userEmail,
                    null, // Phone not provided in registration form
                    null  // Website not provided in registration form
                ]
            );
        }

        const [business] = await pool.execute('SELECT * FROM businesses WHERE id = ?', [result.insertId]);

        res.status(201).json({
            message: 'Business registered and added to directory',
            business: business[0]
        });
    } catch (error) {
        console.error('Register business error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: true,
                message: 'Duplicate entry detected. This business name is already registered.',
                code: 'DUPLICATE_ENTRY'
            });
        }
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Business Details
app.get('/api/businesses/:id', async (req, res) => {
    try {
        const [businesses] = await pool.execute('SELECT * FROM businesses WHERE id = ?', [req.params.id]);

        if (businesses.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Business not found',
                code: 'NOT_FOUND'
            });
        }

        res.json(businesses[0]);
    } catch (error) {
        console.error('Get business error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Approved Businesses (Directory)
app.get('/api/businesses/approved', async (req, res) => {
    try {
        const { page = 1, limit = 30, search } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 30;
        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT b.*, u.email as owner_email 
            FROM businesses b
            INNER JOIN users u ON b.user_id = u.id
            WHERE b.status IN ('Approved', 'Verified Business')
        `;
        const params = [];

        if (search) {
            query += ' AND (b.business_name LIKE ? OR b.business_sector LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ` ORDER BY b.registered_date DESC LIMIT ${limitNum} OFFSET ${offset}`;

        const [businesses] = await pool.execute(query, params);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM businesses b
            WHERE b.status IN ('Approved', 'Verified Business')
        `;
        const countParams = [];
        if (search) {
            countQuery += ' AND (b.business_name LIKE ? OR b.business_sector LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm);
        }
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            businesses,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                has_next: offset + businesses.length < total,
                has_prev: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Get approved businesses error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// =====================================================
// EVENTS ENDPOINTS
// =====================================================

// Get All Events
app.get('/api/events', async (req, res) => {
    try {
        const { status, type, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const offset = (pageNum - 1) * limitNum;

        let query = 'SELECT * FROM events WHERE 1=1';
        const params = [];
        
        // Only filter by is_archived if the column exists (will be handled by try-catch if needed)
        // For now, we'll get all events and filter archived ones in application logic if needed
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        if (type) {
            query += ' AND event_type = ?';
            params.push(type);
        }
        
        query += ` ORDER BY event_date DESC, id DESC LIMIT ${limitNum} OFFSET ${offset}`;
        
        const [events] = await pool.execute(query, params);
        
        // Filter out archived events in application logic (if column exists)
        const filteredEvents = events.filter(event => event.is_archived !== true);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM events WHERE 1=1';
        const countParams = [];
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        if (type) {
            countQuery += ' AND event_type = ?';
            countParams.push(type);
        }
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0]?.total || 0;

        res.json({
            events: filteredEvents,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                has_next: offset + filteredEvents.length < total,
                has_prev: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Get events error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR',
            details: error.message
        });
    }
});

// Get Pitch Events
app.get('/api/events/pitch', async (req, res) => {
    try {
        console.log('Fetching pitch events from database...');
        // Include all pitch events (upcoming, live, featured, and historical)
        // Use LOWER() to handle any case sensitivity issues
        const [events] = await pool.execute(
            `SELECT * FROM events 
             WHERE LOWER(event_type) = 'pitch' 
             ORDER BY 
                 CASE 
                     WHEN status = 'Live Now' THEN 1
                     WHEN status = 'Featured' THEN 2
                     WHEN status = 'Upcoming' THEN 3
                     ELSE 4
                 END,
                 event_date DESC, id DESC`
        );
        
        // Filter out archived events in application logic (if column exists)
        const filteredEvents = events.filter(event => event.is_archived !== true);

        console.log(`Found ${filteredEvents.length} pitch event(s) in database`);
        if (filteredEvents.length > 0) {
            console.log('Pitch events:', filteredEvents.map(e => ({ id: e.id, title: e.title, status: e.status, event_type: e.event_type })));
        } else {
            console.log('No pitch events found. Checking all events...');
            const [allEvents] = await pool.execute('SELECT id, title, event_type FROM events ORDER BY id DESC LIMIT 5');
            console.log('Recent events:', allEvents.map(e => ({ id: e.id, title: e.title, event_type: e.event_type })));
        }

        res.json({ events: filteredEvents });
    } catch (error) {
        console.error('Get pitch events error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR',
            details: error.message
        });
    }
});

// RSVP to Event
app.post('/api/events/:id/rsvp', authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        // Check if event exists and is not in the past
        const [events] = await pool.execute(
            'SELECT id, event_date, status FROM events WHERE id = ?',
            [eventId]
        );
        if (events.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Event not found',
                code: 'NOT_FOUND'
            });
        }

        const event = events[0];
        // Check if event is in the past or historical
        if (event.event_date) {
            const eventDate = new Date(event.event_date);
            eventDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (eventDate < today) {
                return res.status(400).json({
                    error: true,
                    message: 'Cannot register for past events',
                    code: 'EVENT_PAST'
                });
            }
        }
        if (event.status && event.status.toLowerCase() === 'historical') {
            return res.status(400).json({
                error: true,
                message: 'Cannot register for historical events',
                code: 'EVENT_HISTORICAL'
            });
        }

        // Check if already RSVPed
        const [existing] = await pool.execute(
            'SELECT id FROM event_rsvps WHERE event_id = ? AND user_id = ?',
            [eventId, userId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                error: true,
                message: 'Already RSVPed to this event',
                code: 'DUPLICATE_ENTRY'
            });
        }

        // Create RSVP
        const [result] = await pool.execute(
            'INSERT INTO event_rsvps (event_id, user_id) VALUES (?, ?)',
            [eventId, userId]
        );

        res.status(201).json({
            message: 'RSVP successful',
            rsvp: { id: result.insertId, event_id: eventId, user_id: userId }
        });
    } catch (error) {
        console.error('RSVP error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Cancel RSVP
app.delete('/api/events/:id/rsvp', authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        const [result] = await pool.execute(
            'DELETE FROM event_rsvps WHERE event_id = ? AND user_id = ?',
            [eventId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: true,
                message: 'RSVP not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({ message: 'RSVP cancelled' });
    } catch (error) {
        console.error('Cancel RSVP error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Check RSVP Status
app.get('/api/events/:id/rsvp', authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        const [rsvps] = await pool.execute(
            'SELECT id FROM event_rsvps WHERE event_id = ? AND user_id = ?',
            [eventId, userId]
        );

        res.json({ is_rsvped: rsvps.length > 0 });
    } catch (error) {
        console.error('Check RSVP error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get RSVP Count for Event (Public - no auth required)
app.get('/api/events/:id/rsvp/count', async (req, res) => {
    try {
        const eventId = req.params.id;
        
        const [result] = await pool.execute(
            'SELECT COUNT(*) as count FROM event_rsvps WHERE event_id = ?',
            [eventId]
        );
        
        res.json({ count: result[0].count || 0 });
    } catch (error) {
        console.error('Get RSVP count error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get RSVP Counts for Multiple Events (Public - no auth required)
app.post('/api/events/rsvp/counts', async (req, res) => {
    try {
        const { eventIds } = req.body;
        
        if (!Array.isArray(eventIds) || eventIds.length === 0) {
            return res.json({});
        }
        
        const placeholders = eventIds.map(() => '?').join(',');
        const [results] = await pool.execute(
            `SELECT event_id, COUNT(*) as count 
             FROM event_rsvps 
             WHERE event_id IN (${placeholders})
             GROUP BY event_id`,
            eventIds
        );
        
        const counts = {};
        results.forEach(row => {
            counts[row.event_id] = row.count;
        });
        
        res.json(counts);
    } catch (error) {
        console.error('Get RSVP counts error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// =====================================================
// BLOG ENDPOINTS
// =====================================================

// Get Blog Posts
app.get('/api/blog', async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const offset = (pageNum - 1) * limitNum;

        let query = 'SELECT * FROM blog_posts WHERE is_published = TRUE';
        const params = [];

        if (category) {
            // Handle category mapping and case-insensitive matching
            let categoryValue = category;
            // Map filter values to database categories
            if (category === 'testimonials') {
                // Match both "Testimonials" and "Testimonial" (case-insensitive)
                query += ' AND (LOWER(category) = ? OR LOWER(category) = ?)';
                params.push('testimonials', 'testimonial');
                categoryValue = null; // Already added to query
            } else if (category === 'case-studies') {
                categoryValue = 'Case Studies';
            } else if (category === 'articles') {
                // Match Articles, News, Strategy, etc.
                query += ' AND (LOWER(category) = ? OR LOWER(category) IN (?, ?, ?))';
                params.push('articles', 'news', 'strategy', 'article');
                categoryValue = null; // Already added to query
            } else if (category === 'research') {
                categoryValue = 'Research';
            }
            
            if (categoryValue) {
                query += ' AND LOWER(category) = LOWER(?)';
                params.push(categoryValue);
            }
        }

        // Order by published_date (NULLs will go last), then by id
        // LIMIT and OFFSET must be integers, not parameters
        query += ` ORDER BY published_date DESC, id DESC LIMIT ${limitNum} OFFSET ${offset}`;

        const [posts] = await pool.execute(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM blog_posts WHERE is_published = TRUE';
        const countParams = [];
        if (category) {
            // Handle category mapping and case-insensitive matching (same as main query)
            let categoryValue = category;
            if (category === 'testimonials') {
                // Match both "Testimonials" and "Testimonial" (case-insensitive)
                countQuery += ' AND (LOWER(category) = ? OR LOWER(category) = ?)';
                countParams.push('testimonials', 'testimonial');
                categoryValue = null; // Already added to query
            } else if (category === 'case-studies') {
                categoryValue = 'Case Studies';
            } else if (category === 'articles') {
                countQuery += ' AND (LOWER(category) = ? OR LOWER(category) IN (?, ?, ?))';
                countParams.push('articles', 'news', 'strategy', 'article');
                categoryValue = null;
            } else if (category === 'research') {
                categoryValue = 'Research';
            }
            
            if (categoryValue) {
                countQuery += ' AND LOWER(category) = LOWER(?)';
                countParams.push(categoryValue);
            }
        }
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            posts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                has_next: offset + posts.length < total,
                has_prev: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Get blog posts error:', error.message);
        console.error('SQL Error Code:', error.code);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR',
            details: error.message
        });
    }
});

// Get Single Blog Post
app.get('/api/blog/:id', async (req, res) => {
    try {
        const [posts] = await pool.execute(
            'SELECT * FROM blog_posts WHERE id = ? AND is_published = TRUE',
            [req.params.id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Blog post not found',
                code: 'NOT_FOUND'
            });
        }

        // Increment view count
        await pool.execute(
            'UPDATE blog_posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?',
            [req.params.id]
        );

        res.json(posts[0]);
    } catch (error) {
        console.error('Get blog post error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Search Blog Posts
app.get('/api/blog/search', async (req, res) => {
    try {
        const { q, category, limit = 50 } = req.query;
        const searchTerm = (q || '').trim();
        
        if (!searchTerm) {
            return res.json({ posts: [], total: 0 });
        }

        let query = `
            SELECT * FROM blog_posts 
            WHERE is_published = TRUE 
            AND (
                LOWER(title) LIKE ? 
                OR LOWER(content) LIKE ? 
                OR LOWER(excerpt) LIKE ?
                OR LOWER(author) LIKE ?
                OR LOWER(tags) LIKE ?
            )
        `;
        const params = [];
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);

        if (category) {
            query += ' AND LOWER(category) = LOWER(?)';
            params.push(category);
        }

        query += ' ORDER BY published_date DESC LIMIT ?';
        params.push(parseInt(limit, 10) || 50);

        const [posts] = await pool.execute(query, params);

        res.json({ posts, total: posts.length });
    } catch (error) {
        console.error('Search blog posts error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Popular/Trending Posts
app.get('/api/blog/popular', async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const [posts] = await pool.execute(
            `SELECT * FROM blog_posts 
             WHERE is_published = TRUE 
             ORDER BY COALESCE(view_count, 0) DESC, published_date DESC 
             LIMIT ?`,
            [parseInt(limit, 10) || 5]
        );

        res.json({ posts });
    } catch (error) {
        console.error('Get popular posts error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Related Posts
app.get('/api/blog/:id/related', async (req, res) => {
    try {
        const postId = req.params.id;
        
        // First get the current post to find related posts
        const [currentPost] = await pool.execute(
            'SELECT category, author, tags FROM blog_posts WHERE id = ?',
            [postId]
        );

        if (currentPost.length === 0) {
            return res.json({ posts: [] });
        }

        const post = currentPost[0];
        let query = `
            SELECT * FROM blog_posts 
            WHERE is_published = TRUE 
            AND id != ?
        `;
        const params = [postId];

        // Find posts with same category or author
        if (post.category) {
            query += ' AND (LOWER(category) = LOWER(?)';
            params.push(post.category);
            
            if (post.author) {
                query += ' OR LOWER(author) = LOWER(?)';
                params.push(post.author);
            }
            query += ')';
        } else if (post.author) {
            query += ' AND LOWER(author) = LOWER(?)';
            params.push(post.author);
        }

        query += ' ORDER BY published_date DESC LIMIT 4';
        const [relatedPosts] = await pool.execute(query, params);

        res.json({ posts: relatedPosts });
    } catch (error) {
        console.error('Get related posts error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Posts by Author
app.get('/api/blog/author/:author', async (req, res) => {
    try {
        const author = decodeURIComponent(req.params.author);
        const { limit = 50 } = req.query;
        
        const [posts] = await pool.execute(
            `SELECT * FROM blog_posts 
             WHERE is_published = TRUE 
             AND LOWER(author) = LOWER(?)
             ORDER BY published_date DESC 
             LIMIT ?`,
            [author, parseInt(limit, 10) || 50]
        );

        res.json({ posts, author });
    } catch (error) {
        console.error('Get author posts error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Save/Bookmark Blog Post (Authenticated)
app.post('/api/blog/:id/save', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const blogPostId = req.params.id;

        // Check if post exists
        const [posts] = await pool.execute(
            'SELECT id FROM blog_posts WHERE id = ? AND is_published = TRUE',
            [blogPostId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Blog post not found',
                code: 'NOT_FOUND'
            });
        }

        // Save the post
        await pool.execute(
            'INSERT IGNORE INTO saved_blog_posts (user_id, blog_post_id) VALUES (?, ?)',
            [userId, blogPostId]
        );

        res.json({ success: true, message: 'Post saved' });
    } catch (error) {
        console.error('Save blog post error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Unsave Blog Post (Authenticated)
app.delete('/api/blog/:id/save', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const blogPostId = req.params.id;

        await pool.execute(
            'DELETE FROM saved_blog_posts WHERE user_id = ? AND blog_post_id = ?',
            [userId, blogPostId]
        );

        res.json({ success: true, message: 'Post unsaved' });
    } catch (error) {
        console.error('Unsave blog post error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Check if Post is Saved (Authenticated)
app.get('/api/blog/:id/saved', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const blogPostId = req.params.id;

        const [saved] = await pool.execute(
            'SELECT id FROM saved_blog_posts WHERE user_id = ? AND blog_post_id = ?',
            [userId, blogPostId]
        );

        res.json({ saved: saved.length > 0 });
    } catch (error) {
        console.error('Check saved post error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Saved Posts (Authenticated)
app.get('/api/blog/saved', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [posts] = await pool.execute(
            `SELECT bp.* FROM blog_posts bp
             INNER JOIN saved_blog_posts sbp ON bp.id = sbp.blog_post_id
             WHERE sbp.user_id = ? AND bp.is_published = TRUE
             ORDER BY sbp.saved_at DESC`,
            [userId]
        );

        res.json({ posts });
    } catch (error) {
        console.error('Get saved posts error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// RSS Feed
app.get('/api/blog/rss', async (req, res) => {
    try {
        const [posts] = await pool.execute(
            `SELECT id, title, content, excerpt, author, category, published_date, updated_at
             FROM blog_posts 
             WHERE is_published = TRUE 
             ORDER BY published_date DESC 
             LIMIT 20`
        );

        const baseUrl = req.protocol + '://' + req.get('host');
        const siteUrl = baseUrl;
        const feedUrl = `${baseUrl}/api/blog/rss`;

        let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
        <title>Enterprise Room Business Hub - Blog</title>
        <link>${siteUrl}/blog.html</link>
        <description>Insights, research, and success stories from our ecosystem</description>
        <language>en-us</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <link>${feedUrl}</link>
`;

        posts.forEach(post => {
            const pubDate = post.published_date 
                ? new Date(post.published_date).toUTCString() 
                : new Date(post.updated_at).toUTCString();
            const postUrl = `${baseUrl}/blog-post.html?id=${post.id}`;
            const description = post.excerpt || (post.content ? post.content.substring(0, 200) + '...' : '');
            const cleanDescription = description
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            const cleanTitle = (post.title || 'Untitled')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

            rss += `        <item>
            <title>${cleanTitle}</title>
            <link>${postUrl}</link>
            <guid isPermaLink="true">${postUrl}</guid>
            <description>${cleanDescription}</description>
            <author>${post.author || 'Enterprise Room'}</author>
            <category>${post.category || 'Uncategorized'}</category>
            <pubDate>${pubDate}</pubDate>
        </item>
`;
        });

        rss += `    </channel>
</rss>`;

        res.set('Content-Type', 'application/rss+xml');
        res.send(rss);
    } catch (error) {
        console.error('RSS feed error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Upload Blog Image (Admin)
app.post('/api/admin/blog/upload-image', authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: true,
                message: 'No file uploaded',
                code: 'VALIDATION_ERROR'
            });
        }

        const imageUrl = `/uploads/blog/${req.file.filename}`;
        res.json({
            success: true,
            url: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Upload blog image error:', error);
        res.status(500).json({
            error: true,
            message: error.message || 'Failed to upload image',
            code: 'SERVER_ERROR'
        });
    }
});

// Create Blog Post (Admin)
app.post('/api/admin/blog', authenticateAdmin, async (req, res) => {
    try {
        const {
            title,
            content,
            excerpt,
            author,
            category,
            featured_image_url,
            tags,
            published_date
        } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                error: true,
                message: 'Title and content are required',
                code: 'VALIDATION_ERROR'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO blog_posts (
                title, content, excerpt, author, category, 
                featured_image_url, tags, published_date, is_published, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
            [
                title,
                content,
                excerpt || null,
                author || null,
                category || null,
                featured_image_url || null,
                tags || null,
                published_date || null,
                req.admin.id
            ]
        );

        const [post] = await pool.execute(
            'SELECT * FROM blog_posts WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(post[0]);
    } catch (error) {
        console.error('Create blog post error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Update Blog Post (Admin)
app.put('/api/admin/blog/:id', authenticateAdmin, async (req, res) => {
    try {
        const blogId = req.params.id;
        const {
            title,
            content,
            excerpt,
            author,
            category,
            featured_image_url,
            tags,
            published_date,
            is_published
        } = req.body;

        const updates = [];
        const values = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (content !== undefined) { updates.push('content = ?'); values.push(content); }
        if (excerpt !== undefined) { updates.push('excerpt = ?'); values.push(excerpt); }
        if (author !== undefined) { updates.push('author = ?'); values.push(author); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category); }
        if (featured_image_url !== undefined) { updates.push('featured_image_url = ?'); values.push(featured_image_url); }
        if (tags !== undefined) { updates.push('tags = ?'); values.push(tags); }
        if (published_date !== undefined) { updates.push('published_date = ?'); values.push(published_date); }
        if (is_published !== undefined) { updates.push('is_published = ?'); values.push(is_published ? 1 : 0); }

        if (updates.length === 0) {
            return res.status(400).json({
                error: true,
                message: 'No fields to update',
                code: 'VALIDATION_ERROR'
            });
        }

        values.push(blogId);

        await pool.execute(
            `UPDATE blog_posts SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const [post] = await pool.execute(
            'SELECT * FROM blog_posts WHERE id = ?',
            [blogId]
        );

        if (post.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Blog post not found',
                code: 'NOT_FOUND'
            });
        }

        res.json(post[0]);
    } catch (error) {
        console.error('Update blog post error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get All Blog Posts (Admin - includes unpublished)
app.get('/api/admin/blog', authenticateAdmin, async (req, res) => {
    try {
        const [posts] = await pool.execute(
            'SELECT * FROM blog_posts ORDER BY published_date DESC, id DESC'
        );
        res.json(posts);
    } catch (error) {
        console.error('Get admin blog posts error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Single Blog Post (Admin)
app.get('/api/admin/blog/:id', authenticateAdmin, async (req, res) => {
    try {
        const [posts] = await pool.execute(
            'SELECT * FROM blog_posts WHERE id = ?',
            [req.params.id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Blog post not found',
                code: 'NOT_FOUND'
            });
        }

        res.json(posts[0]);
    } catch (error) {
        console.error('Get admin blog post error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Delete Blog Post (Admin)
app.delete('/api/admin/blog/:id', authenticateAdmin, async (req, res) => {
    try {
        const blogId = req.params.id;

        const [result] = await pool.execute(
            'DELETE FROM blog_posts WHERE id = ?',
            [blogId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: true,
                message: 'Blog post not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
        console.error('Delete blog post error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// =====================================================
// DIRECTORIES ENDPOINTS
// =====================================================

// Get Business Directory
app.get('/api/directories/business', async (req, res) => {
    try {
        const { page = 1, limit = 30, search } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 30;
        const offset = (pageNum - 1) * limitNum;

        // Query from directory_businesses table (public directory)
        let query = `
            SELECT * FROM directory_businesses
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (business_name LIKE ? OR address LIKE ? OR email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY added_date DESC, id DESC LIMIT ${limitNum} OFFSET ${offset}`;

        const [businesses] = await pool.execute(query, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM directory_businesses WHERE 1=1`;
        const countParams = [];
        if (search) {
            countQuery += ' AND (business_name LIKE ? OR address LIKE ? OR email LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            businesses,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                has_next: offset + businesses.length < total,
                has_prev: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Get business directory error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Members Directory
app.get('/api/directories/members', async (req, res) => {
    try {
        const { page = 1, limit = 30 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 30;
        const offset = (pageNum - 1) * limitNum;

        const [members] = await pool.execute(
            `SELECT * FROM directory_members ORDER BY added_date DESC, id DESC LIMIT ${limitNum} OFFSET ${offset}`,
            []
        );

        const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM directory_members');
        const total = countResult[0].total;

        res.json({
            members,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                has_next: offset + members.length < total,
                has_prev: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Get members directory error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Partners Directory
app.get('/api/directories/partners', async (req, res) => {
    try {
        const { page = 1, limit = 30 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 30;
        const offset = (pageNum - 1) * limitNum;

        const [partners] = await pool.execute(
            `SELECT * FROM directory_partners ORDER BY added_date DESC, id DESC LIMIT ${limitNum} OFFSET ${offset}`,
            []
        );

        const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM directory_partners');
        const total = countResult[0].total;

        res.json({
            partners,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                has_next: offset + partners.length < total,
                has_prev: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Get partners directory error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// =====================================================
// TOOLS ENDPOINTS
// =====================================================

// Get Calculator Settings
app.get('/api/tools/settings', async (req, res) => {
    try {
        const [settings] = await pool.execute(
            'SELECT setting_key, setting_value, setting_type FROM settings WHERE setting_key LIKE ? OR setting_key LIKE ?',
            ['exchange_rate_%', 'calculator_default_%']
        );

        const exchangeRates = {};
        const defaults = {};

        settings.forEach(setting => {
            const value = setting.setting_type === 'number' 
                ? parseFloat(setting.setting_value) 
                : setting.setting_value;

            if (setting.setting_key.startsWith('exchange_rate_')) {
                const key = setting.setting_key.replace('exchange_rate_', '');
                exchangeRates[key] = value;
            } else if (setting.setting_key.startsWith('calculator_default_')) {
                const key = setting.setting_key.replace('calculator_default_', '');
                defaults[key] = value;
            }
        });

        res.json({
            exchange_rates: exchangeRates,
            defaults: defaults
        });
    } catch (error) {
        console.error('Get tools settings error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Custom Tools
app.get('/api/tools/custom', async (req, res) => {
    try {
        const [tools] = await pool.execute(
            'SELECT * FROM custom_tools ORDER BY created_at DESC'
        );

        res.json({ tools });
    } catch (error) {
        console.error('Get custom tools error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// =====================================================
// PUBLIC STATISTICS ENDPOINT (for homepage)
// =====================================================

// Public Homepage Statistics (no authentication required)
app.get('/api/stats', async (req, res) => {
    try {
        // Get active users count (users where is_active = TRUE)
        const [activeUsersResult] = await pool.execute(
            'SELECT COUNT(*) as count FROM users WHERE is_active = TRUE'
        );
        const activeMembers = activeUsersResult[0]?.count || 0;
        
        // Get businesses count
        const [businessesResult] = await pool.execute(
            'SELECT COUNT(*) as count FROM businesses'
        );
        const businessesListed = businessesResult[0]?.count || 0;
        
        // Get events count
        const [eventsResult] = await pool.execute(
            'SELECT COUNT(*) as count FROM events'
        );
        const eventsHosted = eventsResult[0]?.count || 0;
        
        // Calculate total funding committed from pitch entries
        const [fundingResult] = await pool.execute(
            'SELECT COALESCE(SUM(funding_amount), 0) as total_funding FROM pitch_entries'
        );
        const totalFunding = fundingResult[0]?.total_funding || 0;
        
        res.json({
            activeMembers: activeMembers,
            businessesListed: businessesListed,
            fundingCommitted: totalFunding,
            eventsHosted: eventsHosted
        });
    } catch (error) {
        console.error('Get public stats error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Featured Content for Homepage
app.get('/api/featured', async (req, res) => {
    try {
        // Get featured/live event (priority: Live Now > Featured > Next Upcoming)
        // Include both regular and pitch events, but prioritize Featured status
        const [events] = await pool.execute(
            `SELECT id, title, description, event_date, event_time, date_display, status, flier_url, event_type
             FROM events 
             WHERE status IN ('Live Now', 'Featured', 'Upcoming')
             ORDER BY 
                 CASE status
                     WHEN 'Live Now' THEN 1
                     WHEN 'Featured' THEN 2
                     WHEN 'Upcoming' THEN 3
                 END,
                 CASE status
                     WHEN 'Featured' THEN 0
                     ELSE 1
                 END,
                 event_date ASC
             LIMIT 1`
        );
        
        const featuredEvent = events[0] || null;
        
        // Get latest published blog post
        const [blogPosts] = await pool.execute(
            `SELECT id, title, excerpt, content, author, category, published_date, featured_image_url
             FROM blog_posts 
             WHERE is_published = TRUE 
             ORDER BY published_date DESC, id DESC 
             LIMIT 1`
        );
        
        // Get a featured/verified business (priority: Verified Business > Approved)
        const [businesses] = await pool.execute(
            `SELECT id, business_name, business_sector, status, registered_date
             FROM businesses 
             WHERE status IN ('Verified Business', 'Approved')
             ORDER BY 
                 CASE status
                     WHEN 'Verified Business' THEN 1
                     WHEN 'Approved' THEN 2
                 END,
                 registered_date DESC
             LIMIT 1`
        );
        
        res.json({
            featuredEvent: featuredEvent,
            featuredBlog: blogPosts[0] || null,
            featuredBusiness: businesses[0] || null
        });
    } catch (error) {
        console.error('Get featured content error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Testimonials for Homepage
app.get('/api/testimonials', async (req, res) => {
    try {
        // Get published blog posts with category "Testimonials" or "Testimonial" (case-insensitive)
        const [testimonials] = await pool.execute(
            `SELECT id, title, content, excerpt, author, published_date
             FROM blog_posts 
             WHERE is_published = TRUE 
             AND (LOWER(category) = 'testimonials' OR LOWER(category) = 'testimonial')
             ORDER BY published_date DESC, id DESC 
             LIMIT 10`
        );
        
        res.json({ testimonials });
    } catch (error) {
        console.error('Get testimonials error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Subscribe to Newsletter
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email || !email.trim()) {
            return res.status(400).json({
                error: true,
                message: 'Email is required',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                error: true,
                message: 'Invalid email format',
                code: 'VALIDATION_ERROR'
            });
        }
        
        const emailLower = email.trim().toLowerCase();
        
        // Check if email already exists
        const [existing] = await pool.execute(
            'SELECT id, is_active FROM newsletter_subscribers WHERE email = ?',
            [emailLower]
        );
        
        if (existing.length > 0) {
            const subscriber = existing[0];
            if (subscriber.is_active) {
                return res.status(409).json({
                    error: true,
                    message: 'Email is already subscribed',
                    code: 'ALREADY_SUBSCRIBED'
                });
            } else {
                // Reactivate subscription
                await pool.execute(
                    'UPDATE newsletter_subscribers SET is_active = TRUE, subscribed_at = CURRENT_TIMESTAMP, unsubscribed_at = NULL WHERE email = ?',
                    [emailLower]
                );
                return res.json({
                    success: true,
                    message: 'Successfully resubscribed to newsletter'
                });
            }
        }
        
        // Insert new subscriber
        await pool.execute(
            'INSERT INTO newsletter_subscribers (email, source) VALUES (?, ?)',
            [emailLower, 'homepage']
        );
        
        res.json({
            success: true,
            message: 'Successfully subscribed to newsletter'
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// =====================================================
// ADMIN ENDPOINTS
// =====================================================

// Unsubscribe Newsletter (Admin)
app.post('/api/admin/newsletter/subscribers/:email/unsubscribe', authenticateAdmin, async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();
        
        await pool.execute(
            'UPDATE newsletter_subscribers SET is_active = FALSE, unsubscribed_at = CURRENT_TIMESTAMP WHERE email = ?',
            [email]
        );
        
        res.json({ success: true, message: 'Subscriber unsubscribed successfully' });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Resubscribe Newsletter (Admin)
app.post('/api/admin/newsletter/subscribers/:email/resubscribe', authenticateAdmin, async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();
        
        await pool.execute(
            'UPDATE newsletter_subscribers SET is_active = TRUE, subscribed_at = CURRENT_TIMESTAMP, unsubscribed_at = NULL WHERE email = ?',
            [email]
        );
        
        res.json({ success: true, message: 'Subscriber resubscribed successfully' });
    } catch (error) {
        console.error('Resubscribe error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Newsletter Subscribers (Admin)
app.get('/api/admin/newsletter/subscribers', authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, status = 'all' } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const offset = (pageNum - 1) * limitNum;
        
        let query = 'SELECT * FROM newsletter_subscribers';
        const params = [];
        
        if (status === 'active') {
            query += ' WHERE is_active = TRUE';
        } else if (status === 'inactive') {
            query += ' WHERE is_active = FALSE';
        }
        
        query += ` ORDER BY subscribed_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
        
        const [subscribers] = await pool.execute(query, params);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM newsletter_subscribers';
        const countParams = [];
        if (status === 'active') {
            countQuery += ' WHERE is_active = TRUE';
        } else if (status === 'inactive') {
            countQuery += ' WHERE is_active = FALSE';
        }
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;
        
        res.json({
            subscribers,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                has_next: offset + subscribers.length < total,
                has_prev: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Get newsletter subscribers error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Dashboard Statistics
app.get('/api/admin/dashboard/stats', authenticateAdmin, async (req, res) => {
    try {
        const [stats] = await pool.execute('SELECT * FROM vw_dashboard_stats');
        
        const result = stats[0] || {};
        res.json({
            total_events: result.events_count || 0,
            total_blog_posts: result.blog_posts_count || 0,
            total_directory_entries: result.directory_entries_count || 0,
            total_registered_users: result.registered_users_count || 0,
            total_members: result.members_count || 0
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get All Events (Admin)
app.get('/api/admin/events', authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 100 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 100;
        const offset = (pageNum - 1) * limitNum;

        const [events] = await pool.execute(
            `SELECT e.*, 
                    COALESCE(rsvp_counts.rsvp_count, 0) as rsvp_count
             FROM events e
             LEFT JOIN (
                 SELECT event_id, COUNT(*) as rsvp_count
                 FROM event_rsvps
                 GROUP BY event_id
             ) rsvp_counts ON e.id = rsvp_counts.event_id
             ORDER BY e.event_date DESC, e.id DESC 
             LIMIT ${limitNum} OFFSET ${offset}`
        );
        
        // Filter out archived events in application logic (if column exists)
        const filteredEvents = events.filter(event => event.is_archived !== true);

        const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM events');
        const total = countResult[0].total;

        res.json({
            events: filteredEvents,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                has_next: offset + filteredEvents.length < total,
                has_prev: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Get admin events error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Create Event (Admin)
app.post('/api/admin/events', authenticateAdmin, async (req, res) => {
    try {
        const {
            title,
            description,
            event_date,
            event_time,
            date_display,
            event_type,
            status,
            flier_url,
            social_links
        } = req.body;

        if (!title) {
            return res.status(400).json({
                error: true,
                message: 'Title is required',
                code: 'VALIDATION_ERROR'
            });
        }

        // Check for duplicate event title (case-insensitive)
        const [existing] = await pool.execute(
            'SELECT id FROM events WHERE LOWER(TRIM(title)) = LOWER(TRIM(?))',
            [title]
        );
        if (existing.length > 0) {
            return res.status(409).json({
                error: true,
                message: 'An event with this title already exists',
                code: 'DUPLICATE_ENTRY'
            });
        }

        // Ensure event_type is lowercase and valid
        const normalizedEventType = (event_type || 'regular').toLowerCase().trim();
        const validEventType = (normalizedEventType === 'pitch') ? 'pitch' : 'regular';
        
        console.log('Creating event with event_type:', validEventType, '(original:', event_type, ')');
        
        const [result] = await pool.execute(
            `INSERT INTO events (
                title, description, event_date, event_time, date_display,
                event_type, status, flier_url, social_links, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title, description || null, event_date || null, event_time || null,
                date_display || null, validEventType, status || 'Upcoming',
                flier_url || null, social_links || null, req.admin.id
            ]
        );

        const [event] = await pool.execute('SELECT * FROM events WHERE id = ?', [result.insertId]);

        res.status(201).json({
            message: 'Event created',
            event: event[0]
        });
    } catch (error) {
        console.error('Create event error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: true,
                message: 'Duplicate entry detected',
                code: 'DUPLICATE_ENTRY'
            });
        }
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Update Event (Admin)
app.put('/api/admin/events/:id', authenticateAdmin, async (req, res) => {
    try {
        const eventId = req.params.id;
        const {
            title,
            description,
            event_date,
            event_time,
            date_display,
            event_type,
            status,
            flier_url,
            social_links
        } = req.body;

        // If title is being updated, check for duplicate
        if (title !== undefined) {
            const [existing] = await pool.execute(
                'SELECT id FROM events WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) AND id != ?',
                [title, eventId]
            );
            if (existing.length > 0) {
                return res.status(409).json({
                    error: true,
                    message: 'An event with this title already exists',
                    code: 'DUPLICATE_ENTRY'
                });
            }
        }

        const updates = [];
        const values = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (event_date !== undefined) { updates.push('event_date = ?'); values.push(event_date); }
        if (event_time !== undefined) { updates.push('event_time = ?'); values.push(event_time); }
        if (date_display !== undefined) { updates.push('date_display = ?'); values.push(date_display); }
        if (event_type !== undefined) { 
            // Normalize event_type to lowercase
            const normalizedEventType = event_type.toLowerCase().trim();
            const validEventType = (normalizedEventType === 'pitch') ? 'pitch' : 'regular';
            console.log('Updating event', eventId, 'event_type to:', validEventType, '(original:', event_type, ')');
            updates.push('event_type = ?'); 
            values.push(validEventType); 
        }
        if (status !== undefined) { updates.push('status = ?'); values.push(status); }
        if (flier_url !== undefined) { updates.push('flier_url = ?'); values.push(flier_url); }
        if (social_links !== undefined) { updates.push('social_links = ?'); values.push(social_links); }

        if (updates.length === 0) {
            return res.status(400).json({
                error: true,
                message: 'No fields to update',
                code: 'VALIDATION_ERROR'
            });
        }

        // Check if event exists
        const [existingEvent] = await pool.execute('SELECT id FROM events WHERE id = ?', [eventId]);
        if (existingEvent.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Event not found',
                code: 'NOT_FOUND'
            });
        }

        values.push(eventId);
        await pool.execute(
            `UPDATE events SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const [event] = await pool.execute('SELECT * FROM events WHERE id = ?', [eventId]);

        res.json({
            message: 'Event updated',
            event: event[0]
        });
    } catch (error) {
        console.error('Update event error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: true,
                message: 'Duplicate entry detected',
                code: 'DUPLICATE_ENTRY'
            });
        }
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Delete Event (Admin)
app.delete('/api/admin/events/:id', authenticateAdmin, async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM events WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: true,
                message: 'Event not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({ message: 'Event deleted' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get All Users (Admin)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const limitNum = parseInt(req.query.limit) || 20;
        const offset = (pageNum - 1) * limitNum;

        // LIMIT and OFFSET must be integers, not parameters
        const [users] = await pool.execute(
            `SELECT id, uuid, name, email, phone, avatar_url, created_at, last_login, is_active FROM users ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`
        );

        const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM users');
        const total = countResult[0].total;

        res.json({
            users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get admin users error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Update User (Admin)
app.put('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone } = req.body;

        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: true,
                message: 'No fields to update',
                code: 'VALIDATION_ERROR'
            });
        }

        values.push(id);
        await pool.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Get updated user
        const [users] = await pool.execute(
            'SELECT id, uuid, name, email, phone, avatar_url, created_at, is_active FROM users WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({
            message: 'User updated successfully',
            user: users[0]
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Delete User (Admin)
app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const [users] = await pool.execute('SELECT id, email FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
                code: 'NOT_FOUND'
            });
        }

        // Delete user (cascade will handle related records if foreign keys are set up)
        await pool.execute('DELETE FROM users WHERE id = ?', [id]);

        res.json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get All Businesses (Admin)
app.get('/api/admin/businesses', authenticateAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT b.*, u.email as owner_email, u.name as owner_name
            FROM businesses b
            INNER JOIN users u ON b.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        query += ` ORDER BY b.registered_date DESC LIMIT ${limitNum} OFFSET ${offset}`;

        const [businesses] = await pool.execute(query, params);

        let countQuery = 'SELECT COUNT(*) as total FROM businesses WHERE 1=1';
        const countParams = [];
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            businesses,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get admin businesses error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Approve Business (Admin)
app.put('/api/admin/businesses/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        await pool.execute('UPDATE businesses SET status = ? WHERE id = ?', ['Approved', req.params.id]);
        res.json({ message: 'Business approved' });
    } catch (error) {
        console.error('Approve business error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Verify Business (Admin)
app.put('/api/admin/businesses/:id/verify', authenticateAdmin, async (req, res) => {
    try {
        await pool.execute('UPDATE businesses SET status = ? WHERE id = ?', ['Verified Business', req.params.id]);
        res.json({ message: 'Business verified' });
    } catch (error) {
        console.error('Verify business error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Settings (Admin)
app.get('/api/admin/settings', authenticateAdmin, async (req, res) => {
    try {
        const [settings] = await pool.execute('SELECT * FROM settings ORDER BY setting_key');
        res.json({ settings });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Update Event Status (Admin)
app.patch('/api/admin/events/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const eventId = req.params.id;
        const { status } = req.body;

        const validStatuses = ['Upcoming', 'Live Now', 'Featured', 'Historical'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid status. Must be one of: Upcoming, Live Now, Featured, Historical',
                code: 'VALIDATION_ERROR'
            });
        }

        const [result] = await pool.execute(
            'UPDATE events SET status = ? WHERE id = ?',
            [status, eventId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: true,
                message: 'Event not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({ message: 'Event status updated successfully', status });
    } catch (error) {
        console.error('Update event status error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Bulk Update Event Statuses Based on Dates (Admin)
app.post('/api/admin/events/update-statuses', authenticateAdmin, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all events with dates
        const [events] = await pool.execute(
            `SELECT id, title, event_date, status 
             FROM events 
             WHERE event_date IS NOT NULL`
        );

        let updatedCount = 0;
        let liveNowCount = 0;
        let historicalCount = 0;
        let upcomingCount = 0;
        const updates = [];

        for (const event of events) {
            const eventDate = new Date(event.event_date);
            eventDate.setHours(0, 0, 0, 0);
            
            const currentStatus = (event.status || '').toLowerCase();
            let newStatus = null;

            // Determine new status based on date
            if (eventDate < today) {
                // Event is in the past
                if (currentStatus !== 'historical') {
                    newStatus = 'Historical';
                }
            } else if (eventDate.getTime() === today.getTime()) {
                // Event is today
                if (currentStatus !== 'live now' && currentStatus !== 'historical') {
                    newStatus = 'Live Now';
                }
            } else {
                // Event is in the future
                if (currentStatus === 'historical') {
                    // Don't change historical events back to upcoming
                    continue;
                }
                if (currentStatus !== 'upcoming' && currentStatus !== 'featured' && currentStatus !== 'live now') {
                    newStatus = 'Upcoming';
                }
            }

            if (newStatus) {
                updates.push({ id: event.id, title: event.title, oldStatus: event.status, newStatus });
                await pool.execute(
                    'UPDATE events SET status = ? WHERE id = ?',
                    [newStatus, event.id]
                );
                updatedCount++;

                if (newStatus === 'Live Now') liveNowCount++;
                else if (newStatus === 'Historical') historicalCount++;
                else if (newStatus === 'Upcoming') upcomingCount++;
            }
        }

        res.json({
            message: 'Event statuses updated successfully',
            summary: {
                totalEvents: events.length,
                updated: updatedCount,
                liveNow: liveNowCount,
                historical: historicalCount,
                upcoming: upcomingCount,
                unchanged: events.length - updatedCount
            },
            updates: updates
        });
    } catch (error) {
        console.error('Bulk update event statuses error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Copy Event (Admin) - Duplicate an event
app.post('/api/admin/events/:id/copy', authenticateAdmin, async (req, res) => {
    try {
        const eventId = req.params.id;

        // Get the original event
        const [events] = await pool.execute('SELECT * FROM events WHERE id = ?', [eventId]);
        if (events.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Event not found',
                code: 'NOT_FOUND'
            });
        }

        const originalEvent = events[0];

        // Create a copy with "Copy of" prefix and set to Upcoming
        const newTitle = `Copy of ${originalEvent.title}`;
        const [result] = await pool.execute(
            `INSERT INTO events (title, description, event_date, event_time, date_display, event_type, status, flier_url, social_links, created_by)
             VALUES (?, ?, ?, ?, ?, ?, 'Upcoming', ?, ?, ?)`,
            [
                newTitle,
                originalEvent.description,
                originalEvent.event_date,
                originalEvent.event_time,
                originalEvent.date_display,
                originalEvent.event_type,
                originalEvent.flier_url,
                originalEvent.social_links,
                req.admin.id
            ]
        );

        const [newEvent] = await pool.execute('SELECT * FROM events WHERE id = ?', [result.insertId]);

        res.status(201).json({
            message: 'Event copied successfully',
            event: newEvent[0]
        });
    } catch (error) {
        console.error('Copy event error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Archive Event (Admin) - Hide event from public display
app.post('/api/admin/events/:id/archive', authenticateAdmin, async (req, res) => {
    try {
        const eventId = req.params.id;

        // Check if event exists
        const [events] = await pool.execute('SELECT id, status FROM events WHERE id = ?', [eventId]);
        if (events.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Event not found',
                code: 'NOT_FOUND'
            });
        }

        // Set is_archived flag to hide from public display
        try {
            await pool.execute(
                'UPDATE events SET is_archived = TRUE WHERE id = ?',
                [eventId]
            );
            res.json({ message: 'Event archived successfully' });
        } catch (error) {
            // If is_archived column doesn't exist, just update status
            // The column will need to be added to the database
            console.error('Archive event error (trying fallback):', error);
            try {
                await pool.execute(
                    'UPDATE events SET status = ? WHERE id = ?',
                    ['Historical', eventId]
                );
                res.json({ message: 'Event archived successfully (marked as Historical). Please run add-archived-column.js to enable full archiving.' });
            } catch (err) {
                console.error('Archive event fallback error:', err);
                res.status(500).json({
                    error: true,
                    message: 'Server error',
                    code: 'SERVER_ERROR'
                });
            }
        }
    } catch (error) {
        console.error('Archive event error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get RSVPs for an Event (Admin)
app.get('/api/admin/events/:id/rsvps', authenticateAdmin, async (req, res) => {
    try {
        const eventId = req.params.id;
        const { page = 1, limit = 50 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const offset = (pageNum - 1) * limitNum;

        // Get RSVPs with user details
        const [rsvps] = await pool.execute(
            `SELECT er.id, er.rsvp_date, er.user_id,
                    u.name, u.email, u.phone, u.avatar_url
             FROM event_rsvps er
             INNER JOIN users u ON er.user_id = u.id
             WHERE er.event_id = ?
             ORDER BY er.rsvp_date DESC
             LIMIT ${limitNum} OFFSET ${offset}`,
            [eventId]
        );

        // Get total count
        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM event_rsvps WHERE event_id = ?',
            [eventId]
        );
        const total = countResult[0].total;

        res.json({
            rsvps,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get event RSVPs error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Update Settings (Admin)
app.put('/api/admin/settings', authenticateAdmin, async (req, res) => {
    try {
        const updates = req.body; // { setting_key: value, ... }

        for (const [key, value] of Object.entries(updates)) {
            await pool.execute(
                'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
                [String(value), req.admin.id, key]
            );
        }

        res.json({ message: 'Settings updated' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Get Directories (Admin)
app.get('/api/admin/directories/:type', authenticateAdmin, async (req, res) => {
    try {
        const { type } = req.params; // members, partners, business
        const { page = 1, limit = 30, search } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 30;
        const offset = (pageNum - 1) * limitNum;

        let tableName;
        if (type === 'members') tableName = 'directory_members';
        else if (type === 'partners') tableName = 'directory_partners';
        else if (type === 'business') tableName = 'directory_businesses';
        else {
            return res.status(400).json({
                error: true,
                message: 'Invalid directory type',
                code: 'VALIDATION_ERROR'
            });
        }

        // Build query with search
        let query = `SELECT * FROM ${tableName} WHERE 1=1`;
        const params = [];
        
        if (search) {
            if (type === 'members') {
                query += ' AND (name LIKE ? OR title LIKE ? OR organization LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            } else if (type === 'partners') {
                query += ' AND (partner_name LIKE ? OR email LIKE ? OR address LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            } else if (type === 'business') {
                query += ' AND (business_name LIKE ? OR email LIKE ? OR address LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
        }
        
        query += ` ORDER BY added_date DESC, id DESC LIMIT ${limitNum} OFFSET ${offset}`;

        // Get paginated entries
        const [entries] = await pool.execute(query, params);
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM ${tableName} WHERE 1=1`;
        const countParams = [];
        if (search) {
            if (type === 'members') {
                countQuery += ' AND (name LIKE ? OR title LIKE ? OR organization LIKE ?)';
                const searchTerm = `%${search}%`;
                countParams.push(searchTerm, searchTerm, searchTerm);
            } else if (type === 'partners') {
                countQuery += ' AND (partner_name LIKE ? OR email LIKE ? OR address LIKE ?)';
                const searchTerm = `%${search}%`;
                countParams.push(searchTerm, searchTerm, searchTerm);
            } else if (type === 'business') {
                countQuery += ' AND (business_name LIKE ? OR email LIKE ? OR address LIKE ?)';
                const searchTerm = `%${search}%`;
                countParams.push(searchTerm, searchTerm, searchTerm);
            }
        }
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            entries,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                has_next: offset + entries.length < total,
                has_prev: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Get directories error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Update Directory Entry (Admin)
app.put('/api/admin/directories/:type/:id', authenticateAdmin, async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = req.body;

        let tableName, updateFields = [], updateValues = [];
        
        if (type === 'members') {
            tableName = 'directory_members';
            if (data.name !== undefined) {
                updateFields.push('name = ?');
                updateValues.push(data.name);
            }
            if (data.title !== undefined) {
                updateFields.push('title = ?');
                updateValues.push(data.title);
            }
            if (data.organization !== undefined) {
                updateFields.push('organization = ?');
                updateValues.push(data.organization);
            }
            if (data.website !== undefined) {
                updateFields.push('website = ?');
                updateValues.push(data.website);
            }
            if (data.linkedin_url !== undefined) {
                updateFields.push('linkedin_url = ?');
                updateValues.push(data.linkedin_url);
            }
            if (data.twitter_url !== undefined) {
                updateFields.push('twitter_url = ?');
                updateValues.push(data.twitter_url);
            }
            if (data.facebook_url !== undefined) {
                updateFields.push('facebook_url = ?');
                updateValues.push(data.facebook_url);
            }
            if (data.instagram_url !== undefined) {
                updateFields.push('instagram_url = ?');
                updateValues.push(data.instagram_url);
            }
            if (data.tiktok_url !== undefined) {
                updateFields.push('tiktok_url = ?');
                updateValues.push(data.tiktok_url);
            }
            if (data.threads_url !== undefined) {
                updateFields.push('threads_url = ?');
                updateValues.push(data.threads_url);
            }
            if (data.youtube_url !== undefined) {
                updateFields.push('youtube_url = ?');
                updateValues.push(data.youtube_url);
            }
            if (data.reddit_url !== undefined) {
                updateFields.push('reddit_url = ?');
                updateValues.push(data.reddit_url);
            }
            if (data.avatar_url !== undefined) {
                updateFields.push('avatar_url = ?');
                updateValues.push(data.avatar_url);
            }
        } else if (type === 'partners') {
            tableName = 'directory_partners';
            if (data.partner_name !== undefined) {
                updateFields.push('partner_name = ?');
                updateValues.push(data.partner_name);
            }
            if (data.address !== undefined) {
                updateFields.push('address = ?');
                updateValues.push(data.address);
            }
            if (data.email !== undefined) {
                updateFields.push('email = ?');
                updateValues.push(data.email);
            }
            if (data.phone !== undefined) {
                updateFields.push('phone = ?');
                updateValues.push(data.phone);
            }
            if (data.website !== undefined) {
                updateFields.push('website = ?');
                updateValues.push(data.website);
            }
        } else if (type === 'business') {
            tableName = 'directory_businesses';
            if (data.business_name !== undefined) {
                updateFields.push('business_name = ?');
                updateValues.push(data.business_name);
            }
            if (data.address !== undefined) {
                updateFields.push('address = ?');
                updateValues.push(data.address);
            }
            if (data.email !== undefined) {
                updateFields.push('email = ?');
                updateValues.push(data.email);
            }
            if (data.phone !== undefined) {
                updateFields.push('phone = ?');
                updateValues.push(data.phone);
            }
            if (data.website !== undefined) {
                updateFields.push('website = ?');
                updateValues.push(data.website);
            }
        } else {
            return res.status(400).json({
                error: true,
                message: 'Invalid directory type',
                code: 'VALIDATION_ERROR'
            });
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                error: true,
                message: 'No fields to update',
                code: 'VALIDATION_ERROR'
            });
        }

        updateValues.push(id);

        await pool.execute(
            `UPDATE ${tableName} SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
            updateValues
        );

        res.json({ success: true, message: 'Entry updated successfully' });
    } catch (error) {
        console.error('Update directory entry error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Delete Directory Entry (Admin)
app.delete('/api/admin/directories/:type/:id', authenticateAdmin, async (req, res) => {
    try {
        const { type, id } = req.params;

        let tableName;
        if (type === 'members') tableName = 'directory_members';
        else if (type === 'partners') tableName = 'directory_partners';
        else if (type === 'business') tableName = 'directory_businesses';
        else {
            return res.status(400).json({
                error: true,
                message: 'Invalid directory type',
                code: 'VALIDATION_ERROR'
            });
        }

        const [result] = await pool.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: true,
                message: 'Entry not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({ success: true, message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Delete directory entry error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Create Directory Entry (Admin)
app.post('/api/admin/directories/:type', authenticateAdmin, async (req, res) => {
    try {
        const { type } = req.params;
        const data = req.body;

        let tableName, fields, values, duplicateCheck;
        
        if (type === 'members') {
            tableName = 'directory_members';
            fields = ['name', 'title', 'organization', 'website', 'linkedin_url', 'twitter_url', 'facebook_url', 'instagram_url', 'tiktok_url', 'threads_url', 'youtube_url', 'reddit_url', 'avatar_url', 'added_by'];
            values = [
                data.name, data.title || null, data.organization || null, data.website || null,
                data.linkedin_url || null, data.twitter_url || null, data.facebook_url || null,
                data.instagram_url || null, data.tiktok_url || null, data.threads_url || null,
                data.youtube_url || null, data.reddit_url || null, data.avatar_url || null, req.admin.id
            ];
            // Check for duplicate: same name + organization
            if (data.name && data.organization) {
                const [existing] = await pool.execute(
                    'SELECT id FROM directory_members WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND LOWER(TRIM(organization)) = LOWER(TRIM(?))',
                    [data.name, data.organization]
                );
                if (existing.length > 0) {
                    return res.status(409).json({
                        error: true,
                        message: 'A member with this name and organization already exists',
                        code: 'DUPLICATE_ENTRY'
                    });
                }
            }
        } else if (type === 'partners') {
            tableName = 'directory_partners';
            fields = ['address', 'email', 'phone', 'website', 'added_by'];
            values = [
                data.address, data.email || null, data.phone || null, data.website || null, req.admin.id
            ];
            // Check for duplicate: same email
            if (data.email) {
                const [existing] = await pool.execute(
                    'SELECT id FROM directory_partners WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))',
                    [data.email]
                );
                if (existing.length > 0) {
                    return res.status(409).json({
                        error: true,
                        message: 'A partner with this email already exists',
                        code: 'DUPLICATE_ENTRY'
                    });
                }
            }
        } else if (type === 'business') {
            tableName = 'directory_businesses';
            fields = ['business_name', 'address', 'email', 'phone', 'website', 'added_by'];
            values = [
                data.business_name, data.address, data.email || null, data.phone || null,
                data.website || null, req.admin.id
            ];
            // Check for duplicate: same business name
            if (data.business_name) {
                const [existing] = await pool.execute(
                    'SELECT id FROM directory_businesses WHERE LOWER(TRIM(business_name)) = LOWER(TRIM(?))',
                    [data.business_name]
                );
                if (existing.length > 0) {
                    return res.status(409).json({
                        error: true,
                        message: 'A business with this name already exists in the directory',
                        code: 'DUPLICATE_ENTRY'
                    });
                }
            }
        } else {
            return res.status(400).json({
                error: true,
                message: 'Invalid directory type',
                code: 'VALIDATION_ERROR'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
            values
        );

        const [entry] = await pool.execute(`SELECT * FROM ${tableName} WHERE id = ?`, [result.insertId]);

        res.status(201).json({
            message: 'Directory entry created',
            entry: entry[0]
        });
    } catch (error) {
        console.error('Create directory entry error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: true,
                message: 'Duplicate entry detected. This entry already exists.',
                code: 'DUPLICATE_ENTRY'
            });
        }
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// =====================================================
// START SERVER
// =====================================================

async function startServer() {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
        console.error('❌ Failed to connect to database. Server will not start.');
        process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log('🚀 Enterprise Room Business Hub API Server (Extended)');
        console.log('='.repeat(60));
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log(`✅ Database: Connected`);
        console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('='.repeat(60));
        console.log('\n📋 Available Endpoints:');
        console.log('\n🔐 Authentication:');
        console.log('  POST /api/auth/login - User login');
        console.log('  POST /api/auth/register - User registration');
        console.log('  POST /api/auth/admin/login - Admin login');
        console.log('\n👤 Users:');
        console.log('  GET  /api/users/profile - Get profile (auth)');
        console.log('  PUT  /api/users/profile - Update profile (auth)');
        console.log('  GET  /api/users/businesses - Get user businesses (auth)');
        console.log('\n🏢 Businesses:');
        console.log('  POST /api/businesses - Register business (auth)');
        console.log('  GET  /api/businesses/:id - Get business details');
        console.log('  GET  /api/businesses/approved - Get approved businesses');
        console.log('\n📅 Events:');
        console.log('  GET  /api/events - Get all events');
        console.log('  GET  /api/events/pitch - Get pitch events');
        console.log('  POST /api/events/:id/rsvp - RSVP to event (auth)');
        console.log('  DELETE /api/events/:id/rsvp - Cancel RSVP (auth)');
        console.log('  GET  /api/events/:id/rsvp - Check RSVP status (auth)');
        console.log('\n📝 Blog:');
        console.log('  GET  /api/blog - Get blog posts');
        console.log('  GET  /api/blog/:id - Get single post');
        console.log('\n📂 Directories:');
        console.log('  GET  /api/directories/business - Business directory');
        console.log('  GET  /api/directories/members - Members directory');
        console.log('  GET  /api/directories/partners - Partners directory');
        console.log('\n🛠️  Tools:');
        console.log('  GET  /api/tools/settings - Get calculator settings');
        console.log('  GET  /api/tools/custom - Get custom tools');
        console.log('\n⚙️  Admin (requires admin auth):');
        console.log('  GET  /api/admin/dashboard/stats - Dashboard statistics');
        console.log('  GET  /api/admin/events - Get all events');
        console.log('  POST /api/admin/events - Create event');
        console.log('  PUT  /api/admin/events/:id - Update event');
        console.log('  DELETE /api/admin/events/:id - Delete event');
        console.log('  GET  /api/admin/users - Get all users');
        console.log('  GET  /api/admin/businesses - Get all businesses');
        console.log('  PUT  /api/admin/businesses/:id/approve - Approve business');
        console.log('  PUT  /api/admin/businesses/:id/verify - Verify business');
        console.log('  GET  /api/admin/settings - Get settings');
        console.log('  PUT  /api/admin/settings - Update settings');
        console.log('  GET  /api/admin/directories/:type - Get directory entries');
        console.log('  POST /api/admin/directories/:type - Create directory entry');
        console.log('  PUT  /api/admin/directories/:type/:id - Update directory entry');
        console.log('  DELETE /api/admin/directories/:type/:id - Delete directory entry');
        console.log('\n' + '='.repeat(60));
    });
}

startServer().catch(console.error);

