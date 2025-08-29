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

// Like/Unlike a comment
router.post('/:commentId/like', verifyToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // Check if user already liked the comment
    const [existingLike] = await db.promise().execute(
      'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [commentId, userId]
    );

    if (existingLike.length > 0) {
      // Unlike: remove the like
      await db.promise().execute(
        'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
        [commentId, userId]
      );
    } else {
      // Like: add the like
      await db.promise().execute(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
        [commentId, userId]
      );
    }

    // Update comment likes count
    const [likeCount] = await db.promise().execute(
      'SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?',
      [commentId]
    );

    await db.promise().execute(
      'UPDATE comments SET likes_count = ? WHERE id = ?',
      [likeCount[0].count, commentId]
    );

    res.json({ 
      message: existingLike.length > 0 ? 'Comment unliked' : 'Comment liked',
      likes_count: likeCount[0].count
    });
  } catch (error) {
    console.error('Error updating comment like:', error);
    res.status(500).json({ error: 'Failed to update comment like' });
  }
});

// Delete a comment (only by comment author or post author)
router.delete('/:commentId', verifyToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // Get comment details
    const [comments] = await db.promise().execute(
      'SELECT c.*, p.user_id as post_user_id FROM comments c JOIN posts p ON c.post_id = p.id WHERE c.id = ?',
      [commentId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = comments[0];

    // Check if user is authorized to delete (comment author or post author)
    if (comment.user_id !== userId && comment.post_user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    // Soft delete the comment
    await db.promise().execute(
      'UPDATE comments SET is_active = FALSE WHERE id = ?',
      [commentId]
    );

    // Update post comments count
    await db.promise().execute(
      'UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = ?',
      [comment.post_id]
    );

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Update a comment (only by comment author)
router.put('/:commentId', verifyToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Check if user is the comment author
    const [comments] = await db.promise().execute(
      'SELECT user_id FROM comments WHERE id = ? AND is_active = TRUE',
      [commentId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comments[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }

    // Update the comment
    await db.promise().execute(
      'UPDATE comments SET content = ?, updated_at = NOW() WHERE id = ?',
      [content.trim(), commentId]
    );

    res.json({ message: 'Comment updated successfully' });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

module.exports = router;
