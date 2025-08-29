const express = require('express');
const db = require('../config/database');
const router = express.Router();

// Get all colleges
router.get('/', async (req, res) => {
  try {
    const [colleges] = await db.promise().query(
      `SELECT id, name, city, state, country, logo_url, description, 
              total_points, ranking, member_count, created_at
       FROM colleges 
       ORDER BY total_points DESC`
    );

    res.json({ colleges });
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

// Get college rankings (ordered by total_points with calculated ranks)
router.get('/rankings', async (req, res) => {
  try {
    const [colleges] = await db.promise().query(
      `SELECT id, name, city, state, country, logo_url, description, 
              total_points, member_count, created_at,
              ROW_NUMBER() OVER (ORDER BY total_points DESC) as ranking
       FROM colleges 
       ORDER BY total_points DESC`
    );

    res.json({ colleges });
  } catch (error) {
    console.error('Error fetching college rankings:', error);
    res.status(500).json({ error: 'Failed to fetch college rankings' });
  }
});

// Get college by ID
router.get('/:collegeId', async (req, res) => {
  try {
    const { collegeId } = req.params;
    
    const [colleges] = await db.promise().query(
      `SELECT * FROM colleges WHERE id = ?`,
      [collegeId]
    );

    if (colleges.length === 0) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json({ college: colleges[0] });
  } catch (error) {
    console.error('Error fetching college:', error);
    res.status(500).json({ error: 'Failed to fetch college' });
  }
});

// Get college leaderboard
router.get('/:collegeId/leaderboard', async (req, res) => {
  try {
    const { collegeId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const [users] = await db.promise().query(
      `SELECT id, username, profile_picture, total_points, reputation_score, daily_streak
       FROM users 
       WHERE college_id = ?
       ORDER BY total_points DESC
       LIMIT ?`,
      [collegeId, limit]
    );

    res.json({ leaderboard: users });
  } catch (error) {
    console.error('Error fetching college leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch college leaderboard' });
  }
});

// Search colleges
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const [colleges] = await db.promise().query(
      `SELECT id, name, city, state, logo_url, total_points, member_count
       FROM colleges 
       WHERE name LIKE ? OR city LIKE ? OR state LIKE ?
       ORDER BY total_points DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );

    res.json({ colleges });
  } catch (error) {
    console.error('Error searching colleges:', error);
    res.status(500).json({ error: 'Failed to search colleges' });
  }
});

module.exports = router;
