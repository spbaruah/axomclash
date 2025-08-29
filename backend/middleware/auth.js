const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
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

// Middleware to verify admin privileges
const authenticateAdmin = async (req, res, next) => {
  try {
    // First verify the token
    await authenticateToken(req, res, async (err) => {
      if (err) return next(err);
      
      // Check if user is admin
      const [admins] = await db.promise().query(
        'SELECT * FROM admins WHERE user_id = ?',
        [req.user.id]
      );
      
      if (admins.length === 0) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      next();
    });
  } catch (error) {
    console.error('Admin verification failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  authenticateToken,
  authenticateAdmin
};
