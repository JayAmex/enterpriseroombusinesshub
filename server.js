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
const crypto = require('crypto');

// PDF generation (optional - only load if puppeteer is available)
let puppeteer = null;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    console.warn('⚠️  Puppeteer not installed. PDF generation will be disabled. Install with: npm install puppeteer');
}

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

// Create uploads directories if they don't exist
const blogUploadsDir = path.join(__dirname, 'uploads', 'blog');
const avatarUploadsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(blogUploadsDir)) {
    fs.mkdirSync(blogUploadsDir, { recursive: true });
}
if (!fs.existsSync(avatarUploadsDir)) {
    fs.mkdirSync(avatarUploadsDir, { recursive: true });
}

// Configure multer for blog image uploads
const blogStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, blogUploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'blog-' + uniqueSuffix + ext);
    }
});

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, avatarUploadsDir);
    },
    filename: function (req, file, cb) {
        // Use user ID from token to create unique filename
        const userId = req.user ? req.user.id : 'temp';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: blogStorage,
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

const avatarUpload = multer({
    storage: avatarStorage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit for avatars
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
// Serve template files
app.use('/templates', express.static(path.join(__dirname, 'templates')));

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

// Forgot Password - Request Reset Token
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: true,
                message: 'Email is required',
                code: 'VALIDATION_ERROR'
            });
        }

        // Check if user exists
        const [users] = await pool.execute(
            'SELECT id, email, name FROM users WHERE email = ? AND is_active = TRUE',
            [email]
        );

        // Always return success message (security best practice - don't reveal if email exists)
        if (users.length === 0) {
            return res.json({
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }

        const user = users[0];

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

        // Delete any existing unused tokens for this user
        await pool.execute(
            'DELETE FROM password_reset_tokens WHERE user_id = ? AND used = FALSE',
            [user.id]
        );

        // Store reset token in database
        await pool.execute(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.id, resetToken, expiresAt]
        );

        // In production, you would send an email here with the reset link
        // For now, we'll return the token in the response (for development/testing)
        // In production, remove the token from the response and send it via email
        const resetLink = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;

        console.log(`Password reset requested for: ${email}`);
        console.log(`Reset token: ${resetToken}`);
        console.log(`Reset link: ${resetLink}`);

        res.json({
            message: 'If an account with that email exists, a password reset link has been sent.',
            // Remove this in production - only for development
            resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Reset Password - Use Token to Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                error: true,
                message: 'Token and new password are required',
                code: 'VALIDATION_ERROR'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: true,
                message: 'Password must be at least 6 characters long',
                code: 'VALIDATION_ERROR'
            });
        }

        // Find valid reset token
        const [tokens] = await pool.execute(
            `SELECT prt.id, prt.user_id, prt.expires_at, prt.used, u.email 
             FROM password_reset_tokens prt
             INNER JOIN users u ON prt.user_id = u.id
             WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW()`,
            [token]
        );

        if (tokens.length === 0) {
            return res.status(400).json({
                error: true,
                message: 'Invalid or expired reset token',
                code: 'INVALID_TOKEN'
            });
        }

        const resetToken = tokens[0];

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update user password
        await pool.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [passwordHash, resetToken.user_id]
        );

        // Mark token as used
        await pool.execute(
            'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
            [resetToken.id]
        );

        res.json({
            message: 'Password reset successfully. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
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
            'SELECT id, uuid, name, email, phone, avatar_url, title, occupation, state, country, created_at FROM users WHERE id = ?',
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

// Get User Statistics
app.get('/api/users/statistics', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get registered events count
        const [eventsCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM event_rsvps WHERE user_id = ?',
            [userId]
        );
        const registeredEvents = eventsCount[0]?.count || 0;

        // Get businesses count
        const [businessesCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM businesses WHERE user_id = ?',
            [userId]
        );
        const businessesRegistered = businessesCount[0]?.count || 0;

        // Get saved blog posts count
        const [blogPostsCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM saved_blog_posts WHERE user_id = ?',
            [userId]
        );
        const savedBlogPosts = blogPostsCount[0]?.count || 0;

        // Get user creation date to calculate days as member
        const [userData] = await pool.execute(
            'SELECT created_at FROM users WHERE id = ?',
            [userId]
        );
        const createdAt = userData[0]?.created_at;
        const daysAsMember = createdAt 
            ? Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24))
            : 0;

        // Calculate profile completeness
        const [profileData] = await pool.execute(
            'SELECT name, email, phone, avatar_url, title, occupation, state, country FROM users WHERE id = ?',
            [userId]
        );
        const profile = profileData[0] || {};
        let completedFields = 0;
        const totalFields = 8; // name, email, phone, avatar_url, title, occupation, state, country
        
        if (profile.name) completedFields++;
        if (profile.email) completedFields++;
        if (profile.phone) completedFields++;
        if (profile.avatar_url) completedFields++;
        if (profile.title) completedFields++;
        if (profile.occupation) completedFields++;
        if (profile.state) completedFields++;
        if (profile.country) completedFields++;
        
        const profileCompleteness = Math.round((completedFields / totalFields) * 100);

        res.json({
            registeredEvents,
            businessesRegistered,
            savedBlogPosts,
            daysAsMember,
            profileCompleteness
        });
    } catch (error) {
        console.error('Get user statistics error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Upload User Avatar
app.post('/api/users/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: true,
                message: 'No file uploaded',
                code: 'VALIDATION_ERROR'
            });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        // Update user's avatar_url in database
        await pool.execute(
            'UPDATE users SET avatar_url = ? WHERE id = ?',
            [avatarUrl, req.user.id]
        );

        // Get updated user
        const [users] = await pool.execute(
            'SELECT id, uuid, name, email, avatar_url FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json({
            message: 'Avatar uploaded successfully',
            avatar_url: avatarUrl,
            user: users[0]
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            error: true,
            message: error.message || 'Failed to upload avatar',
            code: 'SERVER_ERROR'
        });
    }
});

// Update User Profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        // Note: name is NOT allowed to be updated by user (admin-only)
        const { phone, avatar_url, title, occupation, state, country } = req.body;
        const updates = [];
        const values = [];

        // Phone
        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone);
        }
        // Avatar URL
        if (avatar_url !== undefined) {
            updates.push('avatar_url = ?');
            values.push(avatar_url);
        }
        // Personal Information (editable by user)
        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (occupation !== undefined) {
            updates.push('occupation = ?');
            values.push(occupation);
        }
        if (state !== undefined) {
            updates.push('state = ?');
            values.push(state);
        }
        if (country !== undefined) {
            updates.push('country = ?');
            values.push(country);
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
            'SELECT id, uuid, name, email, phone, avatar_url, title, occupation, state, country FROM users WHERE id = ?',
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

// Change User Password
app.put('/api/users/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: true,
                message: 'Current password and new password are required',
                code: 'VALIDATION_ERROR'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: true,
                message: 'New password must be at least 6 characters long',
                code: 'VALIDATION_ERROR'
            });
        }

        // Get current user with password hash
        const [users] = await pool.execute(
            'SELECT id, password_hash FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
                code: 'NOT_FOUND'
            });
        }

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                error: true,
                message: 'Current password is incorrect',
                code: 'INVALID_PASSWORD'
            });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await pool.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, req.user.id]
        );

        res.json({
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Delete User Account (Self-Service)
app.delete('/api/users/account', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user info before deletion
        const [users] = await pool.execute(
            'SELECT id, email, name FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
                code: 'NOT_FOUND'
            });
        }

        // Delete user (CASCADE will handle related records automatically)
        // Related tables with ON DELETE CASCADE:
        // - businesses
        // - event_rsvps
        // - pitch_event_registrations
        // - pitch_entries
        // - saved_blog_posts
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

        res.json({
            message: 'Account and all associated data deleted successfully'
        });
    } catch (error) {
        console.error('Delete user account error:', error);
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

// Update User's Business
app.put('/api/businesses/:id', authenticateToken, async (req, res) => {
    try {
        const businessId = req.params.id;
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

        // Verify business exists and belongs to user
        const [existing] = await pool.execute(
            'SELECT id, user_id, status FROM businesses WHERE id = ?',
            [businessId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Business not found',
                code: 'NOT_FOUND'
            });
        }

        if (existing[0].user_id !== req.user.id) {
            return res.status(403).json({
                error: true,
                message: 'You can only update your own businesses',
                code: 'FORBIDDEN'
            });
        }

        // Build update query dynamically based on provided fields
        const updates = [];
        const values = [];

        if (business_name !== undefined) {
            // Check for duplicate name (excluding current business)
            const [duplicate] = await pool.execute(
                'SELECT id FROM businesses WHERE user_id = ? AND LOWER(TRIM(business_name)) = LOWER(TRIM(?)) AND id != ?',
                [req.user.id, business_name, businessId]
            );
            if (duplicate.length > 0) {
                return res.status(409).json({
                    error: true,
                    message: 'You already have a business with this name',
                    code: 'DUPLICATE_ENTRY'
                });
            }
            updates.push('business_name = ?');
            values.push(business_name);
        }

        if (business_address !== undefined) {
            updates.push('business_address = ?');
            values.push(business_address);
        }
        if (business_sector !== undefined) {
            updates.push('business_sector = ?');
            values.push(business_sector);
        }
        if (year_of_formation !== undefined) {
            updates.push('year_of_formation = ?');
            values.push(year_of_formation);
        }
        if (number_of_employees !== undefined) {
            updates.push('number_of_employees = ?');
            values.push(number_of_employees);
        }
        if (cac_registered !== undefined) {
            updates.push('cac_registered = ?');
            values.push(cac_registered);
        }
        if (cac_certificate_url !== undefined) {
            updates.push('cac_certificate_url = ?');
            values.push(cac_certificate_url);
            // Update status if CAC certificate is provided
            if (cac_certificate_url) {
                updates.push('status = ?');
                values.push('Verified Business');
            }
        }
        if (has_business_bank_account !== undefined) {
            updates.push('has_business_bank_account = ?');
            values.push(has_business_bank_account);
        }
        if (bank_name !== undefined) {
            updates.push('bank_name = ?');
            values.push(bank_name);
        }
        if (account_number !== undefined) {
            updates.push('account_number = ?');
            values.push(account_number);
        }
        if (account_name !== undefined) {
            updates.push('account_name = ?');
            values.push(account_name);
        }
        if (owner_name !== undefined) {
            updates.push('owner_name = ?');
            values.push(owner_name);
        }
        if (owner_relationship !== undefined) {
            updates.push('owner_relationship = ?');
            values.push(owner_relationship);
        }
        if (newsletter_optin !== undefined) {
            updates.push('newsletter_optin = ?');
            values.push(newsletter_optin);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: true,
                message: 'No fields to update',
                code: 'VALIDATION_ERROR'
            });
        }

        // Add business ID to values for WHERE clause
        values.push(businessId);

        // Update business
        await pool.execute(
            `UPDATE businesses SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Also update directory_businesses if business_name or address changed
        if (business_name !== undefined || business_address !== undefined) {
            const [userData] = await pool.execute('SELECT email FROM users WHERE id = ?', [req.user.id]);
            const userEmail = userData[0]?.email || null;
            const finalBusinessName = business_name || existing[0].business_name;
            const finalAddress = business_address || existing[0].business_address;

            await pool.execute(
                `UPDATE directory_businesses 
                 SET business_name = ?, address = ?, email = ?
                 WHERE LOWER(TRIM(business_name)) = LOWER(TRIM(?))`,
                [finalBusinessName, finalAddress, userEmail, existing[0].business_name]
            );
        }

        // Get updated business
        const [updated] = await pool.execute('SELECT * FROM businesses WHERE id = ?', [businessId]);

        res.json({
            message: 'Business updated successfully',
            business: updated[0]
        });
    } catch (error) {
        console.error('Update business error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Delete User's Business
app.delete('/api/businesses/:id', authenticateToken, async (req, res) => {
    try {
        const businessId = req.params.id;

        // Verify business exists and belongs to user
        const [existing] = await pool.execute(
            'SELECT id, user_id, business_name FROM businesses WHERE id = ?',
            [businessId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Business not found',
                code: 'NOT_FOUND'
            });
        }

        if (existing[0].user_id !== req.user.id) {
            return res.status(403).json({
                error: true,
                message: 'You can only delete your own businesses',
                code: 'FORBIDDEN'
            });
        }

        const businessName = existing[0].business_name;

        // Delete from businesses table
        await pool.execute('DELETE FROM businesses WHERE id = ?', [businessId]);

        // Also remove from directory_businesses if it exists
        await pool.execute(
            'DELETE FROM directory_businesses WHERE LOWER(TRIM(business_name)) = LOWER(TRIM(?))',
            [businessName]
        );

        res.json({
            message: 'Business deleted successfully',
            business_id: businessId
        });
    } catch (error) {
        console.error('Delete business error:', error);
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
            // Handle both exact match and case-insensitive matching
            // Also handle NULL/empty event_type as 'regular' for backward compatibility
            if (type.toLowerCase() === 'regular') {
                query += ' AND (event_type IS NULL OR event_type = ? OR event_type = ? OR LOWER(COALESCE(event_type, "")) = ?)';
                params.push('', 'regular', 'regular');
            } else {
                query += ' AND (event_type = ? OR LOWER(COALESCE(event_type, "")) = ?)';
                params.push(type, type.toLowerCase());
            }
        }
        // If no type specified, we'll get all events and filter pitch events in application logic
        
        query += ` ORDER BY event_date DESC, id DESC LIMIT ${limitNum} OFFSET ${offset}`;
        
        const [events] = await pool.execute(query, params);
        
        // Filter out archived events in application logic (if column exists)
        const filteredEvents = events.filter(event => {
            // Exclude archived events
            if (event.is_archived === true) return false;
            // Also filter out pitch events if type is not specified or is 'regular'
            if (!type || type.toLowerCase() === 'regular') {
                const eventType = (event.event_type || '').toLowerCase();
                if (eventType === 'pitch') return false;
            }
            return true;
        });
        
        // Get total count (matching the same filters)
        let countQuery = 'SELECT COUNT(*) as total FROM events WHERE 1=1';
        const countParams = [];
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        if (type) {
            if (type.toLowerCase() === 'regular') {
                countQuery += ' AND (event_type IS NULL OR event_type = ? OR event_type = ? OR LOWER(COALESCE(event_type, "")) = ?)';
                countParams.push('', 'regular', 'regular');
            } else {
                countQuery += ' AND (event_type = ? OR LOWER(COALESCE(event_type, "")) = ?)';
                countParams.push(type, type.toLowerCase());
            }
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

// Get User's Registered Events
app.get('/api/users/events', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all events the user has RSVP'd to
        const [events] = await pool.execute(
            `SELECT e.*, er.rsvp_date
             FROM events e
             INNER JOIN event_rsvps er ON e.id = er.event_id
             WHERE er.user_id = ?
             ORDER BY e.event_date ASC, e.event_time ASC`,
            [userId]
        );

        res.json({ events });
    } catch (error) {
        console.error('Get user events error:', error);
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

// Get Saved Posts (Authenticated) - MUST come before /api/blog/:id
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

// Check if Post is Saved (Authenticated) - MUST come after /api/blog/saved
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

// Get Built-in Tools
app.get('/api/tools/builtin', async (req, res) => {
    try {
        const [tools] = await pool.execute(
            'SELECT tool_id, name, description, category, is_active, is_visible, display_order FROM builtin_tools WHERE is_active = TRUE ORDER BY display_order ASC'
        );
        res.json({ tools });
    } catch (error) {
        console.error('Get built-in tools error:', error);
        // If table doesn't exist, return empty array
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.json({ tools: [] });
        } else {
            res.status(500).json({
                error: true,
                message: 'Server error',
                code: 'SERVER_ERROR'
            });
        }
    }
});

// Get Tool Visibility Settings
app.get('/api/tools/visibility', async (req, res) => {
    try {
        // Get visibility from builtin_tools table
        const [builtinTools] = await pool.execute(
            'SELECT tool_id, is_visible FROM builtin_tools WHERE is_active = TRUE'
        );
        
        // Convert to object format { tool_id: is_visible }
        const visibility = {};
        builtinTools.forEach(tool => {
            visibility[tool.tool_id] = tool.is_visible === 1 || tool.is_visible === true;
        });
        
        res.json({ visibility });
    } catch (error) {
        console.error('Get tool visibility error:', error);
        // If table doesn't exist, return empty object
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.json({ visibility: {} });
        } else {
            res.status(500).json({
                error: true,
                message: 'Server error',
                code: 'SERVER_ERROR'
            });
        }
    }
});

// Update Tool Visibility (Admin)
app.put('/api/admin/tools/:id/visibility', authenticateAdmin, async (req, res) => {
    try {
        const toolId = req.params.id;
        const { is_visible } = req.body;
        
        if (typeof is_visible !== 'boolean') {
            return res.status(400).json({
                error: true,
                message: 'is_visible must be a boolean',
                code: 'VALIDATION_ERROR'
            });
        }
        
        await pool.execute(
            'UPDATE builtin_tools SET is_visible = ? WHERE tool_id = ?',
            [is_visible, toolId]
        );
        
        res.json({
            message: 'Tool visibility updated',
            tool_id: toolId,
            is_visible: is_visible
        });
    } catch (error) {
        console.error('Update tool visibility error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Admin: Create Custom Tool
app.post('/api/admin/tools', authenticateAdmin, async (req, res) => {
    try {
        const { name, description, inputs, function_code, result_label, result_id, button_text, button_color, result_color, show_conversion } = req.body;
        
        if (!name || !inputs || !function_code || !result_label || !result_id) {
            return res.status(400).json({
                error: true,
                message: 'Missing required fields: name, inputs, function_code, result_label, result_id',
                code: 'VALIDATION_ERROR'
            });
        }
        
        const [result] = await pool.execute(
            `INSERT INTO custom_tools (name, description, inputs, function_code, result_label, result_id, button_text, button_color, result_color, show_conversion, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                JSON.stringify(inputs),
                function_code,
                result_label,
                result_id,
                button_text || 'Calculate',
                button_color || '#1a365d',
                result_color || 'default',
                show_conversion || false,
                req.admin.id
            ]
        );
        
        const [tool] = await pool.execute('SELECT * FROM custom_tools WHERE id = ?', [result.insertId]);
        
        res.status(201).json({
            message: 'Tool created successfully',
            tool: tool[0]
        });
    } catch (error) {
        console.error('Create custom tool error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Admin: Update Custom Tool
app.put('/api/admin/tools/:id', authenticateAdmin, async (req, res) => {
    try {
        const toolId = req.params.id;
        const { name, description, inputs, function_code, result_label, result_id, button_text, button_color, result_color, show_conversion } = req.body;
        
        const updateFields = [];
        const updateValues = [];
        
        if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
        if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
        if (inputs !== undefined) { updateFields.push('inputs = ?'); updateValues.push(JSON.stringify(inputs)); }
        if (function_code !== undefined) { updateFields.push('function_code = ?'); updateValues.push(function_code); }
        if (result_label !== undefined) { updateFields.push('result_label = ?'); updateValues.push(result_label); }
        if (result_id !== undefined) { updateFields.push('result_id = ?'); updateValues.push(result_id); }
        if (button_text !== undefined) { updateFields.push('button_text = ?'); updateValues.push(button_text); }
        if (button_color !== undefined) { updateFields.push('button_color = ?'); updateValues.push(button_color); }
        if (result_color !== undefined) { updateFields.push('result_color = ?'); updateValues.push(result_color); }
        if (show_conversion !== undefined) { updateFields.push('show_conversion = ?'); updateValues.push(show_conversion); }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                error: true,
                message: 'No fields to update',
                code: 'VALIDATION_ERROR'
            });
        }
        
        updateValues.push(toolId);
        
        await pool.execute(
            `UPDATE custom_tools SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
            updateValues
        );
        
        const [tool] = await pool.execute('SELECT * FROM custom_tools WHERE id = ?', [toolId]);
        
        res.json({
            message: 'Tool updated successfully',
            tool: tool[0]
        });
    } catch (error) {
        console.error('Update custom tool error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Admin: Delete Custom Tool
app.delete('/api/admin/tools/:id', authenticateAdmin, async (req, res) => {
    try {
        const toolId = req.params.id;
        
        await pool.execute('DELETE FROM custom_tools WHERE id = ?', [toolId]);
        
        res.json({
            message: 'Tool deleted successfully'
        });
    } catch (error) {
        console.error('Delete custom tool error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Admin: Get Custom Tool by ID
app.get('/api/admin/tools/:id', authenticateAdmin, async (req, res) => {
    try {
        const toolId = req.params.id;
        const [tools] = await pool.execute('SELECT * FROM custom_tools WHERE id = ?', [toolId]);
        
        if (tools.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Tool not found',
                code: 'NOT_FOUND'
            });
        }
        
        res.json({ tool: tools[0] });
    } catch (error) {
        console.error('Get custom tool error:', error);
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
        // Try to use the view first
        let result = {};
        try {
            const [stats] = await pool.execute('SELECT * FROM vw_dashboard_stats');
            result = stats[0] || {};
        } catch (viewError) {
            // If view doesn't exist, calculate stats directly
            console.warn('vw_dashboard_stats view not found, calculating stats directly:', viewError.message);
            
            const [usersCount] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
            const [businessesCount] = await pool.execute('SELECT COUNT(*) as count FROM businesses');
            const [membersCount] = await pool.execute('SELECT COUNT(*) as count FROM directory_members');
            const [eventsCount] = await pool.execute('SELECT COUNT(*) as count FROM events');
            const [blogCount] = await pool.execute('SELECT COUNT(*) as count FROM blog_posts WHERE is_published = TRUE');
            const [dirMembersCount] = await pool.execute('SELECT COUNT(*) as count FROM directory_members');
            const [dirPartnersCount] = await pool.execute('SELECT COUNT(*) as count FROM directory_partners');
            const [dirBusinessesCount] = await pool.execute('SELECT COUNT(*) as count FROM directory_businesses');
            
            result = {
                registered_users_count: usersCount[0]?.count || 0,
                registered_businesses_count: businessesCount[0]?.count || 0,
                members_count: membersCount[0]?.count || 0,
                events_count: eventsCount[0]?.count || 0,
                blog_posts_count: blogCount[0]?.count || 0,
                directory_entries_count: (dirMembersCount[0]?.count || 0) + (dirPartnersCount[0]?.count || 0) + (dirBusinessesCount[0]?.count || 0)
            };
        }
        
        res.json({
            total_events: result.events_count || 0,
            total_blog_posts: result.blog_posts_count || 0,
            total_directory_entries: result.directory_entries_count || 0,
            total_registered_users: result.registered_users_count || 0,
            total_members: result.members_count || 0
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        console.error('Error details:', error.message, error.code, error.stack);
        res.status(500).json({
            error: true,
            message: error.message || 'Server error',
            code: error.code || 'SERVER_ERROR',
            details: error.stack
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
// TEMPLATES API ENDPOINTS
// =====================================================

// Get all templates
app.get('/api/templates', async (req, res) => {
    try {
        const { category } = req.query;
        
        let query = 'SELECT template_id, name, description, category, file_path, is_active FROM templates WHERE is_active = 1';
        let params = [];
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        query += ' ORDER BY category, name';
        
        const [templates] = await pool.execute(query, params);
        
        // Verify file existence for each template
        const templatesWithFileCheck = templates.map(template => {
            const filePath = path.join(__dirname, template.file_path);
            return {
                ...template,
                file_exists: fs.existsSync(filePath),
                download_url: `/${template.file_path}`
            };
        });
        
        res.json({ templates: templatesWithFileCheck });
    } catch (error) {
        console.error('Get templates error:', error);
        // If table doesn't exist, return empty array
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.json({ templates: [] });
        } else {
            res.status(500).json({
                error: true,
                message: 'Server error',
                code: 'SERVER_ERROR'
            });
        }
    }
});

// Get template download statistics
app.get('/api/templates/stats', async (req, res) => {
    try {
        // Use stored procedure if available, otherwise use direct query
        try {
            const [stats] = await pool.execute('CALL sp_get_template_download_stats()');
            // Stored procedure returns results in nested array
            const results = stats[0] || [];
            res.json({ stats: results });
        } catch (procError) {
            // Fallback to direct query if stored procedure doesn't exist
            try {
                const [stats] = await pool.execute(`
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
                    ORDER BY download_count DESC, t.category, t.name
                `);
                res.json({ stats });
            } catch (queryError) {
                // If tables don't exist, return empty stats
                if (queryError.code === 'ER_NO_SUCH_TABLE') {
                    res.json({ stats: [] });
                } else {
                    throw queryError;
                }
            }
        }
    } catch (error) {
        console.error('Get template stats error:', error);
        // If tables don't exist, return empty stats
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.json({ stats: [] });
        } else {
            res.status(500).json({
                error: true,
                message: 'Server error',
                code: 'SERVER_ERROR'
            });
        }
    }
});

// Record template download
app.post('/api/templates/:id/download', async (req, res) => {
    try {
        const templateId = req.params.id;
        
        // Get user ID from token if available (optional authentication)
        let userId = null;
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (token) {
                try {
                    const decoded = jwt.verify(token, JWT_SECRET);
                    userId = decoded.id || null;
                } catch (jwtError) {
                    // Token invalid or expired, continue as anonymous
                    console.log('Invalid token for template download, proceeding as anonymous');
                }
            }
        } catch (authError) {
            // Continue as anonymous user
        }
        
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || null;
        const userAgent = req.get('user-agent') || null;

        // Verify template exists and is active
        let templates;
        try {
            [templates] = await pool.execute(
                'SELECT template_id, file_path FROM templates WHERE template_id = ? AND is_active = TRUE',
                [templateId]
            );
        } catch (dbError) {
            // Check if tables don't exist
            if (dbError.code === 'ER_NO_SUCH_TABLE') {
                console.error('Templates table does not exist. Please run the database migration.');
                return res.status(500).json({
                    error: true,
                    message: 'Database tables not found. Please run the migration script: add-template-tables.sql',
                    code: 'DATABASE_NOT_READY',
                    details: 'The templates and template_downloads tables need to be created first.'
                });
            }
            throw dbError;
        }

        if (templates.length === 0) {
            // Template not in database, but try to serve the file anyway
            console.warn(`Template ${templateId} not found in database, but attempting to serve file`);
            const filePath = path.join(__dirname, `templates/${templateId}.html`);
            
            if (fs.existsSync(filePath)) {
                // Try to serve as PDF if puppeteer is available
                if (puppeteer) {
                    try {
                        const htmlContent = fs.readFileSync(filePath, 'utf8');
                        const browser = await puppeteer.launch({
                            headless: true,
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                        });
                        const page = await browser.newPage();
                        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
                        const pdfBuffer = await page.pdf({
                            format: 'A4',
                            printBackground: true,
                            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
                        });
                        await browser.close();
                        res.setHeader('Content-Type', 'application/pdf');
                        res.setHeader('Content-Disposition', `attachment; filename="${templateId}.pdf"; filename*=UTF-8''${encodeURIComponent(templateId + '.pdf')}`);
                        res.setHeader('Content-Length', pdfBuffer.length);
                        res.setHeader('Cache-Control', 'no-cache');
                        return res.end(pdfBuffer, 'binary');
                    } catch (pdfError) {
                        console.error('PDF generation failed, serving HTML:', pdfError);
                    }
                }
                // Fallback to HTML
                res.setHeader('Content-Type', 'text/html');
                res.setHeader('Content-Disposition', `attachment; filename="${templateId}.html"`);
                return res.sendFile(filePath);
            } else {
                return res.status(404).json({
                    error: true,
                    message: 'Template not found',
                    code: 'NOT_FOUND',
                    template_id: templateId
                });
            }
        }

        const template = templates[0];

        // Record download (if table exists)
        try {
            await pool.execute(
                'INSERT INTO template_downloads (template_id, user_id, ip_address, user_agent) VALUES (?, ?, ?, ?)',
                [templateId, userId, ipAddress, userAgent]
            );

            // Get updated download count
            const [countResult] = await pool.execute(
                'SELECT COUNT(*) as count FROM template_downloads WHERE template_id = ?',
                [templateId]
            );

            // Serve the file as PDF
            const filePath = path.join(__dirname, template.file_path);
            
            // Check if file exists
            if (fs.existsSync(filePath)) {
                // Check if puppeteer is available for PDF conversion
                if (puppeteer) {
                    try {
                        // Read HTML file
                        const htmlContent = fs.readFileSync(filePath, 'utf8');
                        
                        // Convert HTML to PDF using Puppeteer
                        const browser = await puppeteer.launch({
                            headless: true,
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                        });
                        const page = await browser.newPage();
                        
                        // Set content and wait for it to load
                        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
                        
                        // Generate PDF
                        const pdfBuffer = await page.pdf({
                            format: 'A4',
                            printBackground: true,
                            margin: {
                                top: '20mm',
                                right: '15mm',
                                bottom: '20mm',
                                left: '15mm'
                            }
                        });
                        
                        await browser.close();
                        
                        // Set headers for PDF download
                        const pdfFileName = path.basename(template.file_path, '.html') + '.pdf';
                        res.setHeader('Content-Type', 'application/pdf');
                        res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"; filename*=UTF-8''${encodeURIComponent(pdfFileName)}`);
                        res.setHeader('Content-Length', pdfBuffer.length);
                        res.setHeader('Cache-Control', 'no-cache');
                        
                        // Send PDF buffer
                        return res.end(pdfBuffer, 'binary');
                    } catch (pdfError) {
                        console.error('Error generating PDF:', pdfError);
                        console.error('PDF Error details:', pdfError.message, pdfError.stack);
                        // Fallback to HTML if PDF generation fails
                        res.setHeader('Content-Type', 'text/html');
                        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(template.file_path)}"`);
                        return res.sendFile(filePath);
                    }
                } else {
                    // Puppeteer not available, serve as HTML
                    res.setHeader('Content-Type', 'text/html');
                    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(template.file_path)}"`);
                    return res.sendFile(filePath);
                }
            } else {
                // File doesn't exist, return JSON with download URL
                res.json({
                    message: 'Download recorded',
                    download_count: countResult[0].count,
                    file_path: template.file_path,
                    download_url: `/${template.file_path}`,
                    warning: 'Template file not found on server'
                });
            }
        } catch (downloadError) {
            // If template_downloads table doesn't exist, still serve the file
            if (downloadError.code === 'ER_NO_SUCH_TABLE') {
                console.warn('template_downloads table does not exist, serving file without tracking');
                
                // Try to serve the file anyway (as PDF if possible)
                const filePath = path.join(__dirname, template.file_path);
                if (fs.existsSync(filePath)) {
                    if (puppeteer) {
                        try {
                            const htmlContent = fs.readFileSync(filePath, 'utf8');
                            const browser = await puppeteer.launch({
                                headless: true,
                                args: ['--no-sandbox', '--disable-setuid-sandbox']
                            });
                            const page = await browser.newPage();
                            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
                            const pdfBuffer = await page.pdf({
                                format: 'A4',
                                printBackground: true,
                                margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
                            });
                        await browser.close();
                        const pdfFileName = path.basename(template.file_path, '.html') + '.pdf';
                        res.setHeader('Content-Type', 'application/pdf');
                        res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"; filename*=UTF-8''${encodeURIComponent(pdfFileName)}`);
                        res.setHeader('Content-Length', pdfBuffer.length);
                        res.setHeader('Cache-Control', 'no-cache');
                        return res.end(pdfBuffer, 'binary');
                        } catch (pdfError) {
                            console.error('PDF generation failed, serving HTML:', pdfError);
                        }
                    }
                    // Fallback to HTML
                    res.setHeader('Content-Type', 'text/html');
                    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(template.file_path)}"`);
                    return res.sendFile(filePath);
                } else {
                    res.json({
                        message: 'Download served (tracking unavailable)',
                        download_count: 0,
                        file_path: template.file_path,
                        download_url: `/${template.file_path}`,
                        warning: 'Download tracking table not found. Please run the migration script.'
                    });
                }
            } else {
                throw downloadError;
            }
        }
    } catch (error) {
        console.error('Record template download error:', error);
        console.error('Error details:', error.message, error.code);
        res.status(500).json({
            error: true,
            message: error.message || 'Server error',
            code: error.code || 'SERVER_ERROR',
            details: error.code === 'ER_NO_SUCH_TABLE' 
                ? 'Database tables not found. Please run add-template-tables.sql migration script.'
                : undefined
        });
    }
});

// Get template download counts (for frontend display)
app.get('/api/templates/:id/count', async (req, res) => {
    try {
        const templateId = req.params.id;
        
        // Check if template exists
        const [templateCheck] = await pool.execute(
            'SELECT template_id FROM templates WHERE template_id = ? AND is_active = TRUE',
            [templateId]
        );
        
        if (templateCheck.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Template not found',
                code: 'NOT_FOUND',
                count: 0
            });
        }
        
        const [result] = await pool.execute(
            'SELECT COUNT(*) as count FROM template_downloads WHERE template_id = ?',
            [templateId]
        );
        res.json({ count: result[0].count || 0 });
    } catch (error) {
        console.error('Get template count error:', error);
        // If table doesn't exist, return 0
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.json({ count: 0 });
        } else {
            res.status(500).json({
                error: true,
                message: 'Server error',
                code: 'SERVER_ERROR'
            });
        }
    }
});

// Get all template download counts (batch)
app.post('/api/templates/counts', async (req, res) => {
    try {
        const { template_ids } = req.body;
        if (!Array.isArray(template_ids) || template_ids.length === 0) {
            return res.status(400).json({
                error: true,
                message: 'template_ids array is required',
                code: 'VALIDATION_ERROR'
            });
        }

        try {
            const placeholders = template_ids.map(() => '?').join(',');
            const [results] = await pool.execute(
                `SELECT template_id, COUNT(*) as count 
                 FROM template_downloads 
                 WHERE template_id IN (${placeholders})
                 GROUP BY template_id`,
                template_ids
            );

            // Convert to object for easy lookup
            const counts = {};
            results.forEach(row => {
                counts[row.template_id] = row.count;
            });
            
            // Ensure all requested template_ids have a count (default to 0)
            template_ids.forEach(id => {
                if (!(id in counts)) {
                    counts[id] = 0;
                }
            });

            // Include all requested IDs (with 0 if no downloads)
            const response = {};
            template_ids.forEach(id => {
                response[id] = counts[id] || 0;
            });

            res.json({ counts: response });
        } catch (dbError) {
            // If table doesn't exist, return all zeros
            if (dbError.code === 'ER_NO_SUCH_TABLE') {
                const counts = {};
                template_ids.forEach(id => {
                    counts[id] = 0;
                });
                res.json({ counts });
            } else {
                throw dbError;
            }
        }
    } catch (error) {
        console.error('Get template counts error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Admin: Delete all template downloads (reset all counts)
app.delete('/api/admin/templates/downloads', authenticateAdmin, async (req, res) => {
    try {
        await pool.execute('DELETE FROM template_downloads');
        
        res.json({
            message: 'All template download counts have been reset',
            deleted_count: 'all'
        });
    } catch (error) {
        console.error('Delete all template downloads error:', error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(404).json({
                error: true,
                message: 'Template downloads table does not exist',
                code: 'TABLE_NOT_FOUND'
            });
        } else {
            res.status(500).json({
                error: true,
                message: 'Server error',
                code: 'SERVER_ERROR'
            });
        }
    }
});

// Admin: Delete downloads for a specific template (reset count)
app.delete('/api/admin/templates/:id/downloads', authenticateAdmin, async (req, res) => {
    try {
        const templateId = req.params.id;
        
        // Verify template exists
        const [templates] = await pool.execute(
            'SELECT template_id FROM templates WHERE template_id = ? AND is_active = TRUE',
            [templateId]
        );
        
        if (templates.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Template not found',
                code: 'NOT_FOUND'
            });
        }
        
        // Delete all downloads for this template
        const [result] = await pool.execute(
            'DELETE FROM template_downloads WHERE template_id = ?',
            [templateId]
        );
        
        res.json({
            message: 'Template download count has been reset',
            template_id: templateId,
            deleted_count: result.affectedRows
        });
    } catch (error) {
        console.error('Delete template downloads error:', error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(404).json({
                error: true,
                message: 'Template downloads table does not exist',
                code: 'TABLE_NOT_FOUND'
            });
        } else {
            res.status(500).json({
                error: true,
                message: 'Server error',
                code: 'SERVER_ERROR'
            });
        }
    }
});


// Admin: Toggle template visibility (hide/show)
app.put('/api/admin/templates/:id/visibility', authenticateAdmin, async (req, res) => {
    try {
        const templateId = req.params.id;
        const { is_active } = req.body;
        
        if (typeof is_active !== 'boolean') {
            return res.status(400).json({
                error: true,
                message: 'is_active must be a boolean',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // Convert boolean to 1/0 for MySQL compatibility
        const isActiveValue = is_active ? 1 : 0;
        await pool.execute(
            'UPDATE templates SET is_active = ? WHERE template_id = ?',
            [isActiveValue, templateId]
        );
        
        res.json({
            message: `Template ${is_active ? 'shown' : 'hidden'} successfully`,
            template_id: templateId,
            is_active: is_active
        });
    } catch (error) {
        console.error('Toggle template visibility error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Admin: Delete template
app.delete('/api/admin/templates/:id', authenticateAdmin, async (req, res) => {
    try {
        const templateId = req.params.id;
        
        // Verify template exists
        const [templates] = await pool.execute(
            'SELECT template_id FROM templates WHERE template_id = ?',
            [templateId]
        );
        
        if (templates.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Template not found',
                code: 'NOT_FOUND'
            });
        }
        
        // Delete template (cascade will delete downloads)
        await pool.execute(
            'DELETE FROM templates WHERE template_id = ?',
            [templateId]
        );
        
        res.json({
            message: 'Template deleted successfully',
            template_id: templateId
        });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({
            error: true,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Admin: Get template download statistics
app.get('/api/admin/templates/stats', authenticateAdmin, async (req, res) => {
    try {
        // Use stored procedure if available
        try {
            const [stats] = await pool.execute('CALL sp_get_template_download_stats()');
            const results = stats[0] || [];
            
            // Get is_active status for each template (if not already included)
            if (!results[0] || results[0].is_active === undefined) {
                const templateIds = results.map(s => s.template_id);
                if (templateIds.length > 0) {
                    const placeholders = templateIds.map(() => '?').join(',');
                    const [activeStatus] = await pool.execute(
                        `SELECT template_id, is_active FROM templates WHERE template_id IN (${placeholders})`,
                        templateIds
                    );
                    const activeMap = {};
                    activeStatus.forEach(t => {
                        // MySQL returns 0/1, so check for both
                        activeMap[t.template_id] = t.is_active === 1 || t.is_active === true;
                    });
                    results.forEach(stat => {
                        stat.is_active = activeMap[stat.template_id] !== undefined ? activeMap[stat.template_id] : true;
                    });
                }
            }
            
            // Calculate total downloads
            const totalDownloads = results.reduce((sum, stat) => sum + (parseInt(stat.download_count) || 0), 0);
            
            res.json({
                stats: results,
                total_downloads: totalDownloads,
                total_templates: results.length
            });
        } catch (procError) {
            // Fallback to direct query
            const [stats] = await pool.execute(`
                SELECT 
                    t.template_id,
                    t.name,
                    t.category,
                    t.is_active,
                    COUNT(td.id) as download_count,
                    COUNT(DISTINCT td.user_id) as unique_users,
                    MAX(td.downloaded_at) as last_downloaded
                FROM templates t
                LEFT JOIN template_downloads td ON t.template_id = td.template_id
                GROUP BY t.template_id, t.name, t.category, t.is_active
                ORDER BY t.category, t.name
            `);
            
            const totalDownloads = stats.reduce((sum, stat) => sum + (parseInt(stat.download_count) || 0), 0);
            
            res.json({
                stats,
                total_downloads: totalDownloads,
                total_templates: stats.length
            });
        }
    } catch (error) {
        console.error('Get admin template stats error:', error);
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
        console.log('  POST /api/users/avatar - Upload user avatar (auth)');
        console.log('  GET  /api/users/businesses - Get user businesses (auth)');
        console.log('\n🏢 Businesses:');
        console.log('  POST /api/businesses - Register business (auth)');
        console.log('  GET  /api/businesses/:id - Get business details');
        console.log('  PUT  /api/businesses/:id - Update user business (auth)');
        console.log('  DELETE /api/businesses/:id - Delete user business (auth)');
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
        console.log('  GET  /api/tools/builtin - Get built-in tools');
        console.log('  GET  /api/tools/visibility - Get tool visibility settings');
        console.log('\n📄 Templates:');
        console.log('  GET  /api/templates - Get all templates');
        console.log('  GET  /api/templates/stats - Get download statistics');
        console.log('  POST /api/templates/:id/download - Download template (records download)');
        console.log('  GET  /api/templates/:id/count - Get download count for template');
        console.log('  POST /api/templates/counts - Get download counts (batch)');
        console.log('\n⚙️  Admin (requires admin auth):');
        console.log('  GET  /api/admin/dashboard/stats - Dashboard statistics');
        console.log('  GET  /api/admin/templates/stats - Template download statistics (admin)');
        console.log('  PUT  /api/admin/templates/:id/visibility - Toggle template visibility (hide/show)');
        console.log('  DELETE /api/admin/templates/:id - Delete template');
        console.log('  DELETE /api/admin/templates/:id/downloads - Reset template download count');
        console.log('  DELETE /api/admin/templates/downloads - Reset all template download counts');
        console.log('  GET  /api/admin/tools/:id - Get custom tool by ID');
        console.log('  POST /api/admin/tools - Create custom tool');
        console.log('  PUT  /api/admin/tools/:id - Update custom tool');
        console.log('  DELETE /api/admin/tools/:id - Delete custom tool');
        console.log('  PUT  /api/admin/tools/:id/visibility - Update tool visibility');
        console.log('  GET  /api/admin/events - Get all events');
        console.log('  POST /api/admin/events - Create event');
        console.log('  PUT  /api/admin/events/:id - Update event');
        console.log('  DELETE /api/admin/events/:id - Delete event');
        console.log('  GET  /api/admin/users - Get all users');
        console.log('  GET  /api/admin/businesses - Get all businesses');
        console.log('  PUT  /api/admin/businesses/:id/approve - Approve business');
        console.log('  PUT  /api/admin/businesses/:id/reject - Reject business');
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

