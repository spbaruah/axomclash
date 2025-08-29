const express = require('express');
const db = require('../config/database');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all users from a college
router.get('/college/:collegeId', async (req, res) => {
  try {
    const { collegeId } = req.params;
    
    const [users] = await db.promise().execute(
      `SELECT u.id, u.username, u.full_name, u.student_status, u.profile_picture, u.cover_photo, u.total_points, u.reputation_score, 
              u.daily_streak, u.is_online, u.created_at,
              c.name as college_name, c.logo_url as college_logo
       FROM users u 
       JOIN colleges c ON u.college_id = c.id 
       WHERE u.college_id = ?
       ORDER BY u.total_points DESC`,
      [collegeId]
    );

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [users] = await db.promise().execute(
      `SELECT u.id, u.username, u.full_name, u.student_status, u.profile_picture, u.cover_photo, u.bio, u.total_points, 
              u.reputation_score, u.daily_streak, u.is_online, u.created_at, u.college_id,
              c.name as college_name, c.logo_url as college_logo
       FROM users u 
       JOIN colleges c ON u.college_id = c.id 
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    
    // Remove sensitive information
    delete user.password_hash;

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get leaderboard
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const [users] = await db.promise().execute(
      `SELECT u.id, u.username, u.full_name, u.student_status, u.profile_picture, u.cover_photo, u.total_points, u.reputation_score,
              c.name as college_name, c.logo_url as college_logo
       FROM users u 
       JOIN colleges c ON u.college_id = c.id 
       ORDER BY u.total_points DESC
       LIMIT ?`,
      [limit]
    );

    res.json({ leaderboard: users });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Block a user
router.post('/block/:userId', verifyToken, async (req, res) => {
  try {
    const blockerId = req.user.userId;
    const blockedId = parseInt(req.params.userId);

    // Check if user is trying to block themselves
    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'You cannot block yourself' });
    }

    // Check if the user to be blocked exists
    const [users] = await db.promise().execute(
      'SELECT id FROM users WHERE id = ?',
      [blockedId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already blocked
    const [existingBlocks] = await db.promise().execute(
      'SELECT id FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, blockedId]
    );

    if (existingBlocks.length > 0) {
      return res.status(400).json({ error: 'User is already blocked' });
    }

    // Create the block
    await db.promise().execute(
      'INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)',
      [blockerId, blockedId]
    );

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// Unblock a user
router.delete('/block/:userId', verifyToken, async (req, res) => {
  try {
    const blockerId = req.user.userId;
    const blockedId = parseInt(req.params.userId);

    // Remove the block
    const [result] = await db.promise().execute(
      'DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, blockedId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User is not blocked' });
    }

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// Get blocked users list
router.get('/blocked/list', verifyToken, async (req, res) => {
  try {
    const blockerId = req.user.userId;

    const [blockedUsers] = await db.promise().execute(
      `SELECT u.id, u.username, u.full_name, u.profile_picture, u.cover_photo, u.student_status,
              c.name as college_name, ub.created_at as blocked_at
       FROM user_blocks ub
       JOIN users u ON ub.blocked_id = u.id
       JOIN colleges c ON u.college_id = c.id
       WHERE ub.blocker_id = ?
       ORDER BY ub.created_at DESC`,
      [blockerId]
    );

    res.json({ blockedUsers });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
});

// Check if a user is blocked by current user
router.get('/blocked/check/:userId', verifyToken, async (req, res) => {
  try {
    const blockerId = req.user.userId;
    const blockedId = parseInt(req.params.userId);

    const [blocks] = await db.promise().execute(
      'SELECT id FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, blockedId]
    );

    res.json({ isBlocked: blocks.length > 0 });
  } catch (error) {
    console.error('Error checking block status:', error);
    res.status(500).json({ error: 'Failed to check block status' });
  }
});

// Check if current user is blocked by another user
router.get('/blocked/by/:userId', verifyToken, async (req, res) => {
  try {
    const blockerId = parseInt(req.params.userId);
    const blockedId = req.user.userId;

    const [blocks] = await db.promise().execute(
      'SELECT id FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, blockedId]
    );

    res.json({ isBlockedBy: blocks.length > 0 });
  } catch (error) {
    console.error('Error checking if blocked by user:', error);
    res.status(500).json({ error: 'Failed to check if blocked by user' });
  }
});

module.exports = router;
