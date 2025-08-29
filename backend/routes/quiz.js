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

// Get quiz questions with filters
router.get('/questions', async (req, res) => {
  try {
    const { category, difficulty, limit = 10 } = req.query;
    
    let query = 'SELECT * FROM quiz_questions WHERE 1=1';
    const params = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }
    
    query += ' ORDER BY RAND() LIMIT ?';
    params.push(parseInt(limit));
    
    const [questions] = await db.promise().execute(query, params);
    
    res.json({ questions });
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

// Get quiz categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.promise().execute(
      'SELECT DISTINCT category FROM quiz_questions ORDER BY category'
    );
    
    res.json({ categories: categories.map(c => c.category) });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Submit quiz answer and get result
router.post('/submit-answer', verifyToken, async (req, res) => {
  try {
    const { questionId, selectedAnswer, timeSpent } = req.body;
    const userId = req.user.userId;
    const collegeId = req.user.college_id;
    
    // Get question details
    const [questions] = await db.promise().execute(
      'SELECT * FROM quiz_questions WHERE id = ?',
      [questionId]
    );
    
    if (questions.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    const question = questions[0];
    const isCorrect = selectedAnswer === question.correct_answer;
    const pointsEarned = isCorrect ? question.points : 0;
    
    // Record quiz attempt
    await db.promise().execute(
      `INSERT INTO quiz_attempts (user_id, college_id, question_id, selected_answer, is_correct, points_earned, time_spent) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, collegeId, questionId, selectedAnswer, isCorrect, pointsEarned, timeSpent]
    );
    
    // Update user and college points if correct
    if (isCorrect) {
      await db.promise().execute(
        'UPDATE users SET total_points = total_points + ? WHERE id = ?',
        [pointsEarned, userId]
      );
      
      await db.promise().execute(
        'UPDATE colleges SET total_points = total_points + ? WHERE id = ?',
        [pointsEarned, collegeId]
      );
      
      // Record points history
      await db.promise().execute(
        `INSERT INTO points_history (user_id, college_id, action_type, points_earned, college_points_earned, description, reference_id, reference_type) 
         VALUES (?, ?, 'quiz_answer', ?, ?, 'Correct quiz answer', ?, 'quiz')`,
        [userId, collegeId, pointsEarned, pointsEarned, questionId]
      );
    }
    
    res.json({
      isCorrect,
      pointsEarned,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      totalUserPoints: 0, // Will be updated in the response
      totalCollegePoints: 0 // Will be updated in the response
    });
  } catch (error) {
    console.error('Error submitting quiz answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Get user quiz statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [stats] = await db.promise().execute(
      `SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
        SUM(points_earned) as total_points,
        AVG(time_spent) as avg_time
       FROM quiz_attempts 
       WHERE user_id = ?`,
      [userId]
    );
    
    const accuracy = stats[0].total_attempts > 0 
      ? (stats[0].correct_answers / stats[0].total_attempts * 100).toFixed(1)
      : 0;
    
    res.json({
      totalAttempts: stats[0].total_attempts,
      correctAnswers: stats[0].correct_answers,
      totalPoints: stats[0].total_points || 0,
      accuracy: parseFloat(accuracy),
      averageTime: stats[0].avg_time || 0
    });
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    res.status(500).json({ error: 'Failed to fetch quiz statistics' });
  }
});

// Get leaderboard for quiz games
router.get('/leaderboard', async (req, res) => {
  try {
    const { timeFrame = 'all' } = req.query;
    
    let timeFilter = '';
    if (timeFrame === 'week') {
      timeFilter = 'AND qa.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
    } else if (timeFrame === 'month') {
      timeFilter = 'AND qa.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    }
    
    const [leaderboard] = await db.promise().execute(
      `SELECT 
        u.username,
        u.profile_picture,
        c.name as college_name,
        c.logo_url as college_logo,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct_answers,
        SUM(qa.points_earned) as total_points,
        ROUND(SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) as accuracy
       FROM quiz_attempts qa
       JOIN users u ON qa.user_id = u.id
       JOIN colleges c ON qa.college_id = c.id
       WHERE 1=1 ${timeFilter}
       GROUP BY u.id, u.username, u.profile_picture, c.name, c.logo_url
       HAVING total_attempts >= 5
       ORDER BY total_points DESC, accuracy DESC
       LIMIT 50`,
      []
    );
    
    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching quiz leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
