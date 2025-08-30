const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getStorage, deleteFile } = require('../config/cloudinary');
const router = express.Router();

// Middleware to verify JWT token (defined before route usage)
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
// Multer storage for cover photos using Cloudinary
const coverUpload = multer({
  storage: getStorage('covers'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
  }
});

// Multer storage for profile pictures using Cloudinary
const profileUpload = multer({
  storage: getStorage('profiles'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
  }
});

// Upload/Update profile picture
router.put('/profile-picture', verifyToken, profileUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No profile image uploaded' });
    }

    const userId = req.user.userId;

    // Get current picture to delete
    const [rows] = await db.promise().query('SELECT profile_picture FROM users WHERE id = ?', [userId]);
    const oldPath = rows && rows[0] && rows[0].profile_picture;

    const imageUrl = req.file.path; // Cloudinary returns the URL in file.path
    await db.promise().query('UPDATE users SET profile_picture = ? WHERE id = ?', [imageUrl, userId]);

    // Attempt to delete old image from Cloudinary
    if (oldPath) {
      try {
        await deleteFile(oldPath);
      } catch (e) {
        console.warn('Failed to delete old profile image from Cloudinary:', e.message);
      }
    }

    res.json({ message: 'Profile picture updated', profile_picture: relativePath });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Failed to update profile picture' });
  }
});

// Delete profile picture
router.delete('/profile-picture', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [rows] = await db.promise().query('SELECT profile_picture FROM users WHERE id = ?', [userId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentPath = rows[0].profile_picture;
    if (currentPath) {
      const fileOnDisk = path.join(__dirname, '..', currentPath.replace(/^\/?uploads\//, 'uploads/'));
      try {
        if (fs.existsSync(fileOnDisk)) fs.unlinkSync(fileOnDisk);
      } catch (e) {
        console.warn('Failed to delete old profile image:', e.message);
      }
    }

    await db.promise().query('UPDATE users SET profile_picture = NULL WHERE id = ?', [userId]);
    res.json({ message: 'Profile picture deleted', profile_picture: null });
  } catch (error) {
    console.error('Profile picture delete error:', error);
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
});
// Upload/Update cover photo
router.put('/cover', verifyToken, coverUpload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No cover image uploaded' });
    }

    const userId = req.user.userId;
    const imageUrl = req.file.path; // Cloudinary returns the URL in file.path

    await db.promise().query(
      'UPDATE users SET cover_photo = ? WHERE id = ?',[imageUrl, userId]
    );

    res.json({ message: 'Cover photo updated', cover_photo: relativePath });
  } catch (error) {
    console.error('Cover upload error:', error);
    res.status(500).json({ error: 'Failed to update cover photo' });
  }
});

// Delete cover photo
router.delete('/cover', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await db.promise().query('SELECT cover_photo FROM users WHERE id = ?', [userId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentPath = rows[0].cover_photo;

    if (currentPath) {
      // currentPath like "/uploads/covers/cover-....jpg" -> map to filesystem
      const fileOnDisk = path.join(__dirname, '..', currentPath.replace(/^\/?uploads\//, 'uploads/'));
      try {
        if (fs.existsSync(fileOnDisk)) {
          fs.unlinkSync(fileOnDisk);
        }
      } catch (e) {
        // Log and continue; failing to delete the old file should not block DB update
        console.warn('Failed to delete old cover file:', e.message);
      }
    }

    await db.promise().query('UPDATE users SET cover_photo = NULL WHERE id = ?', [userId]);
    res.json({ message: 'Cover photo deleted', cover_photo: null });
  } catch (error) {
    console.error('Cover delete error:', error);
    res.status(500).json({ error: 'Failed to delete cover photo' });
  }
});

// (verifyToken is defined above)

// User registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, college_id, student_status, bio, full_name } = req.body;
    
    console.log('Registration attempt:', { username, email, college_id, student_status, full_name });
    
    // Validate required fields
    if (!username || !email || !password || !college_id || !student_status) {
      return res.status(400).json({ error: 'Username, email, password, college_id, and student_status are required' });
    }
    
    // Set full_name to username if not provided
    const fullNameValue = full_name || username;

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate student status
    if (!['Currently Studying', 'Alumni'].includes(student_status)) {
      return res.status(400).json({ error: 'Invalid student status' });
    }

    // Handle optional fields - convert undefined to null
    const bioValue = bio || null;

    // Check if username already exists
    const [existingUsers] = await db.promise().query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Check if college exists
    const [colleges] = await db.promise().query(
      'SELECT id FROM colleges WHERE id = ?',
      [college_id]
    );

    if (colleges.length === 0) {
      return res.status(400).json({ error: 'Invalid college ID' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [result] = await db.promise().query(
      `INSERT INTO users (username, full_name, email, password_hash, college_id, student_status, bio) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, fullNameValue, email, hashedPassword, college_id, student_status, bioValue]
    );

    const userId = result.insertId;
    console.log('User created with ID:', userId);

    // Update college member count
    await db.promise().query(
      'UPDATE colleges SET member_count = member_count + 1 WHERE id = ?',
      [college_id]
    );

    // Award first post challenge points
    await db.promise().query(
      `INSERT INTO points_history (user_id, college_id, action_type, points_earned, college_points_earned, description) 
       VALUES (?, ?, 'first_post_challenge', 50, 50, 'First post challenge completed')`,
      [userId, college_id]
    );

    // Update user and college points
    await db.promise().query(
      'UPDATE users SET total_points = total_points + 50 WHERE id = ?',
      [userId]
    );

    await db.promise().query(
      'UPDATE colleges SET total_points = total_points + 50 WHERE id = ?',
      [college_id]
    );

    // Get user data
    const [users] = await db.promise().query(
      `SELECT u.*, c.name as college_name, c.logo_url as college_logo 
       FROM users u 
       JOIN colleges c ON u.college_id = c.id 
       WHERE u.id = ?`,
      [userId]
    );

    const user = users[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, college_id: user.college_id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('Registration successful for user:', user.username);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        college_id: user.college_id,
        college_name: user.college_name,
        college_logo: user.college_logo,
        total_points: user.total_points,
        reputation_score: user.reputation_score,
        daily_streak: user.daily_streak
      },
      token
    });

  } catch (error) {
    console.error('Registration error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // First, check if it's an admin login
    try {
      const [admins] = await db.promise().query(
        'SELECT * FROM admins WHERE email = ? AND is_active = TRUE',
        [email]
      );

      if (admins.length > 0) {
        const admin = admins[0];
        const isValidAdminPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (isValidAdminPassword) {
          // Update admin last login
          await db.promise().query(
            'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [admin.id]
          );

          // Generate admin JWT token
          const adminToken = jwt.sign(
            { 
              userId: admin.id, 
              username: admin.username, 
              email: admin.email,
              role: admin.role,
              isAdmin: true
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
          );

          return res.json({
            message: 'Admin login successful',
            user: {
              id: admin.id,
              username: admin.username,
              email: admin.email,
              role: admin.role,
              isAdmin: true
            },
            token: adminToken,
            isAdmin: true
          });
        }
      }
    } catch (adminError) {
      console.log('Admin lookup failed, continuing with user login:', adminError.message);
    }

    // If not admin, proceed with regular user login
    // Get user with college info
    const [users] = await db.promise().query(
      `SELECT u.*, c.name as college_name, c.logo_url as college_logo, c.total_points as college_points
       FROM users u 
       JOIN colleges c ON u.college_id = c.id 
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login and online status
    await db.promise().query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP, is_online = TRUE WHERE id = ?',
      [user.id]
    );



    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, college_id: user.college_id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        student_status: user.student_status,
        email: user.email,
        college_id: user.college_id,
        college_name: user.college_name,
        college_logo: user.college_logo,
        total_points: user.total_points,
        reputation_score: user.reputation_score,
        daily_streak: user.daily_streak,
        college_points: user.college_points
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await db.promise().query(
      `SELECT u.*, c.name as college_name, c.logo_url as college_logo, c.total_points as college_points, c.ranking as college_rank 
       FROM users u 
       JOIN colleges c ON u.college_id = c.id 
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get user stats
    const [stats] = await db.promise().query(
      `SELECT 
         COUNT(DISTINCT p.id) as total_posts,
         COUNT(DISTINCT g.id) as total_games,
         COUNT(DISTINCT cp.id) as challenges_completed
       FROM users u
       LEFT JOIN posts p ON u.id = p.user_id
       LEFT JOIN game_participants gp ON u.id = gp.user_id
       LEFT JOIN games g ON gp.game_id = g.id
       LEFT JOIN challenge_participants cp ON u.id = cp.user_id AND cp.status = 'completed'
       WHERE u.id = ?`,
      [user.id]
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        student_status: user.student_status,
        email: user.email,
        profile_picture: user.profile_picture,
        cover_photo: user.cover_photo,
        college_id: user.college_id,
        college_name: user.college_name,
        college_logo: user.college_logo,
        course: user.course,
        department: user.department,
        year_of_study: user.year_of_study,
        bio: user.bio,
        total_points: user.total_points,
        reputation_score: user.reputation_score,
        daily_streak: user.daily_streak,
        college_points: user.college_points,
        college_rank: user.college_rank,
        is_online: user.is_online,
        created_at: user.created_at
      },
      stats: stats[0]
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, course, department, year_of_study, bio } = req.body;

    // Check if username is already taken by another user
    if (username) {
      const [existingUsers] = await db.promise().query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Update user profile
    const updateFields = [];
    const updateValues = [];

    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (course !== undefined) {
      updateFields.push('course = ?');
      updateValues.push(course);
    }
    if (department !== undefined) {
      updateFields.push('department = ?');
      updateValues.push(department);
    }
    if (year_of_study !== undefined) {
      updateFields.push('year_of_study = ?');
      updateValues.push(year_of_study);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(userId);

    await db.promise().query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// Logout
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Update online status
    await db.promise().query(
      'UPDATE users SET is_online = FALSE WHERE id = ?',
      [userId]
    );

    res.json({ message: 'Logout successful' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
