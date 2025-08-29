const express = require('express');
const db = require('../config/database');
const router = express.Router();

// Middleware to verify admin JWT token
const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get dashboard statistics
router.get('/stats', verifyAdminToken, async (req, res) => {
  try {
    // Get total users
    const [usersResult] = await db.promise().execute('SELECT COUNT(*) as total FROM users');
    const totalUsers = usersResult[0].total;

    // Get total colleges
    const [collegesResult] = await db.promise().execute('SELECT COUNT(*) as total FROM colleges');
    const totalColleges = collegesResult[0].total;

    // Get total posts
    const [postsResult] = await db.promise().execute('SELECT COUNT(*) as total FROM posts');
    const totalPosts = postsResult[0].total;

    // Get total games
    const [gamesResult] = await db.promise().execute('SELECT COUNT(*) as total FROM games');
    const totalGames = gamesResult[0].total;



    // Get active users (online in last 24 hours)
    const [activeUsersResult] = await db.promise().execute(
      'SELECT COUNT(*) as total FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
    );
    const activeUsers = activeUsersResult[0].total;

    // Get total points across all users
    const [pointsResult] = await db.promise().execute('SELECT SUM(total_points) as total FROM users');
    const totalPoints = pointsResult[0].total || 0;

    res.json({
      totalUsers,
      totalColleges,
      totalPosts,
      totalGames,

      activeUsers,
      totalPoints
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get recent activity
router.get('/recent-activity', verifyAdminToken, async (req, res) => {
  try {
    // Get recent user registrations
    const [recentUsers] = await db.promise().execute(
      'SELECT username, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );

    // Get recent posts
    const [recentPosts] = await db.promise().execute(
      'SELECT p.content, u.username, p.created_at FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 5'
    );

    // Get recent games
    const [recentGames] = await db.promise().execute(
      'SELECT g.name, g.status, g.created_at FROM games g ORDER BY g.created_at DESC LIMIT 5'
    );

    const activities = [];

    // Add user registrations
    recentUsers.forEach(user => {
      activities.push({
        id: `user_${user.username}`,
        type: 'user_registration',
        message: `New user registered: ${user.username}`,
        time: formatTimeAgo(user.created_at)
      });
    });

    // Add recent posts
    recentPosts.forEach(post => {
      activities.push({
        id: `post_${post.username}`,
        type: 'post_created',
        message: `New post created by user: ${post.username}`,
        time: formatTimeAgo(post.created_at)
      });
    });

    // Add recent games
    recentGames.forEach(game => {
      activities.push({
        id: `game_${game.name}`,
        type: 'game_completed',
        message: `Game ${game.name} status: ${game.status}`,
        time: formatTimeAgo(game.created_at)
      });
    });

    // Sort by time (most recent first)
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json(activities.slice(0, 10)); // Return top 10 activities
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Get all users
router.get('/users', verifyAdminToken, async (req, res) => {
  try {
    const [users] = await db.promise().execute(
      `SELECT u.*, c.name as college_name 
       FROM users u 
       JOIN colleges c ON u.college_id = c.id 
       ORDER BY u.created_at DESC`
    );

    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      college_name: user.college_name,
      total_points: user.total_points,
      reputation_score: user.reputation_score,
      is_online: user.is_online,
      created_at: user.created_at,
      status: user.is_online ? 'active' : 'inactive'
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all colleges
router.get('/colleges', verifyAdminToken, async (req, res) => {
  try {
    const [colleges] = await db.promise().execute(
      'SELECT * FROM colleges ORDER BY total_points DESC'
    );

    const formattedColleges = colleges.map((college, index) => ({
      ...college,
      rank: index + 1
    }));

    res.json(formattedColleges);
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

// Get all posts
router.get('/posts', verifyAdminToken, async (req, res) => {
  try {
    const [posts] = await db.promise().execute(
      `SELECT p.*, u.username, c.name as college_name 
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       JOIN colleges c ON p.college_id = c.id 
       ORDER BY p.created_at DESC`
    );

    const formattedPosts = posts.map(post => ({
      id: post.id,
      user: post.username,
      college: post.college_name,
      type: post.type,
      content: post.content,
      likes: post.likes_count,
      comments: post.comments_count,
      created_at: post.created_at
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get all challenges
router.get('/challenges', verifyAdminToken, async (req, res) => {
  try {
    const [challenges] = await db.promise().execute(
      'SELECT * FROM challenges ORDER BY created_at DESC'
    );

    const formattedChallenges = challenges.map(challenge => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      points_reward: challenge.points_reward,
      college_points_reward: challenge.college_points_reward,
      start_date: challenge.start_date,
      end_date: challenge.end_date,
      max_participants: challenge.max_participants,
      current_participants: challenge.current_participants,
      participants: challenge.current_participants,
      status: challenge.is_active ? 'active' : 'inactive',
      created_at: challenge.created_at
    }));

    res.json(formattedChallenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// Create new challenge
router.post('/challenges', verifyAdminToken, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      points_reward,
      college_points_reward,
      start_date,
      end_date,
      max_participants
    } = req.body;

    // Validate required fields
    if (!title || !type || !points_reward || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const now = new Date();

    if (startDate >= endDate) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    // Insert new challenge
    const [result] = await db.promise().execute(
      `INSERT INTO challenges (
        title, description, type, points_reward, college_points_reward, 
        start_date, end_date, max_participants, current_participants, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        title,
        description || '',
        type,
        points_reward,
        college_points_reward || points_reward,
        start_date,
        end_date,
        max_participants || 0,
        startDate > now // Set active based on start date
      ]
    );

    // Get the created challenge
    const [challenges] = await db.promise().execute(
      'SELECT * FROM challenges WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Challenge created successfully',
      challenge: challenges[0]
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

// Update challenge
router.put('/challenges/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      points_reward,
      college_points_reward,
      start_date,
      end_date,
      max_participants,
      is_active
    } = req.body;

    // Check if challenge exists
    const [existing] = await db.promise().execute(
      'SELECT * FROM challenges WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Validate dates if provided
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (startDate >= endDate) {
        return res.status(400).json({ error: 'Start date must be before end date' });
      }
    }

    // Update challenge
    await db.promise().execute(
      `UPDATE challenges SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        type = COALESCE(?, type),
        points_reward = COALESCE(?, points_reward),
        college_points_reward = COALESCE(?, college_points_reward),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        max_participants = COALESCE(?, max_participants),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        title,
        description,
        type,
        points_reward,
        college_points_reward,
        start_date,
        end_date,
        max_participants,
        is_active,
        id
      ]
    );

    // Get updated challenge
    const [updated] = await db.promise().execute(
      'SELECT * FROM challenges WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Challenge updated successfully',
      challenge: updated[0]
    });
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(500).json({ error: 'Failed to update challenge' });
  }
});

// Delete challenge
router.delete('/challenges/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if challenge exists
    const [existing] = await db.promise().execute(
      'SELECT * FROM challenges WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check if challenge has participants
    const [participants] = await db.promise().execute(
      'SELECT COUNT(*) as count FROM challenge_participants WHERE challenge_id = ?',
      [id]
    );

    if (participants[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete challenge with active participants. Consider deactivating instead.' 
      });
    }

    // Delete challenge
    await db.promise().execute(
      'DELETE FROM challenges WHERE id = ?',
      [id]
    );

    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
});

// Get challenge details with participants
router.get('/challenges/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get challenge details
    const [challenges] = await db.promise().execute(
      'SELECT * FROM challenges WHERE id = ?',
      [id]
    );

    if (challenges.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Get participants
    const [participants] = await db.promise().execute(
      `SELECT cp.*, u.username, u.email, c.name as college_name
       FROM challenge_participants cp
       JOIN users u ON cp.user_id = u.id
       JOIN colleges c ON cp.college_id = c.id
       WHERE cp.challenge_id = ?
       ORDER BY cp.created_at DESC`,
      [id]
    );

    // Get college participation stats
    const [collegeStats] = await db.promise().execute(
      `SELECT c.name as college_name, COUNT(cp.id) as participant_count,
              SUM(CASE WHEN cp.status = 'completed' THEN 1 ELSE 0 END) as completed_count
       FROM challenge_participants cp
       JOIN colleges c ON cp.college_id = c.id
       WHERE cp.challenge_id = ?
       GROUP BY cp.college_id, c.name
       ORDER BY participant_count DESC`,
      [id]
    );

    res.json({
      challenge: challenges[0],
      participants,
      collegeStats
    });
  } catch (error) {
    console.error('Error fetching challenge details:', error);
    res.status(500).json({ error: 'Failed to fetch challenge details' });
  }
});

// Schedule future challenge (for challenges coming in 2-3 hours)
router.post('/challenges/schedule', verifyAdminToken, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      points_reward,
      college_points_reward,
      hours_from_now,
      duration_hours,
      max_participants
    } = req.body;

    // Validate required fields
    if (!title || !type || !points_reward || !hours_from_now || !duration_hours) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate start and end dates
    const now = new Date();
    const startDate = new Date(now.getTime() + (hours_from_now * 60 * 60 * 1000));
    const endDate = new Date(startDate.getTime() + (duration_hours * 60 * 60 * 1000));

    // Insert scheduled challenge
    const [result] = await db.promise().execute(
      `INSERT INTO challenges (
        title, description, type, points_reward, college_points_reward, 
        start_date, end_date, max_participants, current_participants, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, FALSE)`,
      [
        title,
        description || '',
        type,
        points_reward,
        college_points_reward || points_reward,
        startDate.toISOString().slice(0, 19).replace('T', ' '),
        endDate.toISOString().slice(0, 19).replace('T', ' '),
        max_participants || 0
      ]
    );

    // Get the created challenge
    const [challenges] = await db.promise().execute(
      'SELECT * FROM challenges WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Challenge scheduled successfully',
      challenge: challenges[0],
      scheduledFor: startDate,
      duration: duration_hours
    });
  } catch (error) {
    console.error('Error scheduling challenge:', error);
    res.status(500).json({ error: 'Failed to schedule challenge' });
  }
});

// Get all games
router.get('/games', verifyAdminToken, async (req, res) => {
  try {
    const [games] = await db.promise().execute(
      `SELECT g.*, c1.name as college1_name, c2.name as college2_name 
       FROM games g 
       JOIN colleges c1 ON g.college1_id = c1.id 
       JOIN colleges c2 ON g.college2_id = c2.id 
       ORDER BY g.created_at DESC`
    );

    const formattedGames = games.map(game => ({
      id: game.id,
      name: game.name,
      type: game.type,
      status: game.status,
      participants: game.current_players,
      college1: game.college1_name,
      college2: game.college2_name
    }));

    res.json(formattedGames);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Helper function to format time ago
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

// Get all reported posts
router.get('/reports', verifyAdminToken, async (req, res) => {
  try {
    const [reports] = await db.promise().execute(
      `SELECT 
        pr.id,
        pr.post_id,
        pr.reason,
        pr.description,
        pr.status,
        pr.created_at,
        pr.admin_notes,
        pr.reviewed_at,
        p.content,
        p.type,
        p.media_urls,
        p.report_count,
        p.is_active,
        u.username as reporter_username,
        u.full_name as reporter_full_name,
        pu.username as post_author_username,
        pu.full_name as post_author_full_name,
        c.name as college_name
       FROM post_reports pr
       JOIN posts p ON pr.post_id = p.id
       JOIN users u ON pr.reporter_id = u.id
       JOIN users pu ON p.user_id = pu.id
       JOIN colleges c ON p.college_id = c.id
       ORDER BY pr.created_at DESC`
    );

    const formattedReports = reports.map(report => ({
      id: report.id,
      postId: report.post_id,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.created_at,
      adminNotes: report.admin_notes,
      reviewedAt: report.reviewed_at,
      post: {
        content: report.content,
        type: report.type,
        mediaUrls: report.media_urls ? JSON.parse(report.media_urls) : [],
        reportCount: report.report_count,
        isActive: report.is_active
      },
      reporter: {
        username: report.reporter_username,
        fullName: report.reporter_full_name
      },
      postAuthor: {
        username: report.post_author_username,
        fullName: report.post_author_full_name
      },
      college: report.college_name
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Update report status
router.put('/reports/:reportId', verifyAdminToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes, action } = req.body;
    const adminId = req.admin.userId;

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get the report and post details
    const [reports] = await db.promise().execute(
      'SELECT post_id FROM post_reports WHERE id = ?',
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const postId = reports[0].post_id;

    // Update report status
    await db.promise().execute(
      `UPDATE post_reports 
       SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW() 
       WHERE id = ?`,
      [status, adminNotes || null, adminId, reportId]
    );

    // Handle post action if specified
    if (action === 'remove' && status === 'resolved') {
      await db.promise().execute(
        'UPDATE posts SET is_active = FALSE WHERE id = ?',
        [postId]
      );
    }

    res.json({ message: 'Report status updated successfully' });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// Remove a reported post
router.delete('/posts/:postId', verifyAdminToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const adminId = req.admin.userId;

    // Check if post exists
    const [posts] = await db.promise().execute(
      'SELECT id FROM posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Deactivate the post
    await db.promise().execute(
      'UPDATE posts SET is_active = FALSE WHERE id = ?',
      [postId]
    );

    // Update all reports for this post to resolved
    await db.promise().execute(
      `UPDATE post_reports 
       SET status = 'resolved', admin_notes = 'Post removed by admin', 
           reviewed_by = ?, reviewed_at = NOW() 
       WHERE post_id = ? AND status = 'pending'`,
      [adminId, postId]
    );

    res.json({ message: 'Post removed successfully' });
  } catch (error) {
    console.error('Error removing post:', error);
    res.status(500).json({ error: 'Failed to remove post' });
  }
});

module.exports = router;
