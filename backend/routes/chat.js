const express = require('express');
const multer = require('multer');
const db = require('../config/database');
const { getStorage } = require('../config/cloudinary');
const router = express.Router();

// Configure multer for Cloudinary uploads
const storage = getStorage('chat');

const fileFilter = (req, file, cb) => {
  // Allow images and videos only
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Log token for debugging (first few characters only)
    const tokenPreview = token.length > 20 ? token.substring(0, 20) + '...' : token;
    console.log('Token preview:', tokenPreview);

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    console.log('Token decoded successfully:', { 
      hasUserId: !!decoded.userId, 
      hasId: !!decoded.id, 
      hasCollegeId: !!decoded.college_id 
    });
    
    // Handle different token payload structures
    if (decoded.userId) {
      req.user = decoded;
    } else if (decoded.id) {
      req.user = { userId: decoded.id, college_id: decoded.college_id };
    } else {
      throw new Error('Invalid token structure');
    }
    
    console.log('User object set:', { userId: req.user.userId, college_id: req.user.college_id });
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    console.error('Token received:', req.headers.authorization?.split('Bearer ')[1] || 'No token');
    console.error('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

// Update user online status (called when user connects/disconnects)
router.post('/user/online-status', verifyToken, async (req, res) => {
  try {
    const { isOnline } = req.body;
    const userId = req.user.userId;
    
    // Store online status in memory or create a simple online_users table
    // For now, we'll use a simple approach with the existing chat_typing_indicators table
    if (isOnline) {
      // Mark user as online
      await db.promise().execute(
        `INSERT INTO chat_typing_indicators (user_id, college_id, is_typing, last_typing_at) 
         VALUES (?, ?, FALSE, NOW()) 
         ON DUPLICATE KEY UPDATE last_typing_at = NOW()`,
        [userId, req.user.college_id]
      );
    } else {
      // Mark user as offline by removing the typing indicator
      await db.promise().execute(
        'DELETE FROM chat_typing_indicators WHERE user_id = ? AND college_id = ?',
        [userId, req.user.college_id]
      );
    }
    
    res.json({ message: 'Online status updated successfully' });
  } catch (error) {
    console.error('Error updating online status:', error);
    res.status(500).json({ error: 'Failed to update online status' });
  }
});

// Get chat messages for a college with pagination and filtering
router.get('/college/:collegeId', verifyToken, async (req, res) => {
  try {
    const { collegeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const messageType = req.query.messageType; // Filter by message type
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT cm.*, u.username, u.full_name, u.student_status, u.profile_picture, u.college_id,
             r.id as reply_to_id, r.content as reply_content, r.message_type as reply_message_type,
             ru.username as reply_username
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      LEFT JOIN chat_messages r ON cm.reply_to_id = r.id
      LEFT JOIN users ru ON r.user_id = ru.id
      WHERE cm.college_id = ?
    `;
    
    let params = [collegeId];
    
    if (messageType) {
      query += ' AND cm.message_type = ?';
      params.push(messageType);
    }
    
    query += ' ORDER BY cm.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [messages] = await db.promise().execute(query, params);

    // Fetch reactions for all messages
    const messageIds = messages.map(msg => msg.id);
    let reactions = {};
    let userReactions = {};
    
    if (messageIds.length > 0) {
      try {
        const placeholders = messageIds.map(() => '?').join(',');
        
        // Get reaction counts
        const [reactionsResult] = await db.promise().execute(
          `SELECT message_id, reaction_type, COUNT(*) as count
           FROM chat_reactions 
           WHERE message_id IN (${placeholders})
           GROUP BY message_id, reaction_type`,
          messageIds
        );
        
        // Get user's specific reactions
        const [userReactionsResult] = await db.promise().execute(
          `SELECT message_id, reaction_type
           FROM chat_reactions 
           WHERE message_id IN (${placeholders}) AND user_id = ?`,
          [...messageIds, req.user.userId]
        );
        
        console.log('Reactions fetched:', reactionsResult);
        console.log('User reactions fetched:', userReactionsResult);
        
        // Group reactions by message_id
        reactionsResult.forEach(row => {
          if (!reactions[row.message_id]) {
            reactions[row.message_id] = {};
          }
          reactions[row.message_id][row.reaction_type] = parseInt(row.count);
        });
        
        // Group user reactions by message_id
        userReactionsResult.forEach(row => {
          if (!userReactions[row.message_id]) {
            userReactions[row.message_id] = {};
          }
          userReactions[row.message_id][row.reaction_type] = true;
        });
        
      } catch (reactionError) {
        console.error('Error fetching reactions:', reactionError);
        // Continue without reactions if there's an error
      }
    }

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM chat_messages WHERE college_id = ?';
    let countParams = [collegeId];
    
    if (messageType) {
      countQuery += ' AND message_type = ?';
      countParams.push(messageType);
    }
    
    const [countResult] = await db.promise().execute(
      countQuery,
      countParams
    );

    // Attach reactions to messages
    const messagesWithReactions = messages.map(msg => ({
      ...msg,
      reactions: reactions[msg.id] || {},
      userReactions: userReactions[msg.id] || {}
    }));

    res.json({ 
      messages: messagesWithReactions.reverse(),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(countResult[0].total / limit),
        totalMessages: countResult[0].total,
        hasNext: page * limit < countResult[0].total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a text message
router.post('/college/:collegeId/text', verifyToken, async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { content, replyToId } = req.body;
    const userId = req.user.userId;

    // Verify user belongs to this college
    if (req.user.college_id !== parseInt(collegeId)) {
      return res.status(403).json({ error: 'Not authorized to send messages to this college' });
    }

    // If replying to a message, verify it exists and belongs to the same college
    if (replyToId) {
      const [replyMessage] = await db.promise().execute(
        `SELECT id, college_id FROM chat_messages WHERE id = ?`,
        [replyToId]
      );
      
      if (replyMessage.length === 0) {
        return res.status(404).json({ error: 'Reply message not found' });
      }
      
      if (replyMessage[0].college_id !== parseInt(collegeId)) {
        return res.status(403).json({ error: 'Cannot reply to message from different college' });
      }
    }

    const [result] = await db.promise().execute(
      `INSERT INTO chat_messages (college_id, user_id, message_type, content, media_url, reply_to_id) 
       VALUES (?, ?, 'text', ?, NULL, ?)`,
      [collegeId, userId, content, replyToId || null]
    );

    // Get the created message with user info and reply data
    const [messages] = await db.promise().execute(
      `SELECT cm.*, u.username, u.profile_picture,
              r.id as reply_to_id, r.content as reply_content, r.message_type as reply_message_type,
              ru.username as reply_username
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       LEFT JOIN chat_messages r ON cm.reply_to_id = r.id
       LEFT JOIN users ru ON r.user_id = ru.id
       WHERE cm.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ 
      message: 'Message sent successfully', 
      chatMessage: messages[0] 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Upload and send media message (photo, voice, document)
router.post('/college/:collegeId/media', verifyToken, upload.single('media'), async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { messageType, caption, replyToId } = req.body;
    const userId = req.user.userId;

    console.log('Media upload request:', {
      collegeId,
      messageType,
      caption,
      userId,
      file: req.file ? {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : null
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    // Verify user belongs to this college
    if (req.user.college_id !== parseInt(collegeId)) {
      return res.status(403).json({ error: 'Not authorized to send messages to this college' });
    }

    // If replying to a message, verify it exists and belongs to the same college
    if (replyToId) {
      const [replyMessage] = await db.promise().execute(
        `SELECT id, college_id FROM chat_messages WHERE id = ?`,
        [replyToId]
      );
      
      if (replyMessage.length === 0) {
        return res.status(404).json({ error: 'Reply message not found' });
      }
      
      if (replyMessage[0].college_id !== parseInt(collegeId)) {
        return res.status(403).json({ error: 'Cannot reply to message from different college' });
      }
    }

    // Determine message type based on file mimetype
    let finalMessageType = messageType;
    if (!finalMessageType) {
      if (req.file.mimetype.startsWith('image/')) {
        finalMessageType = 'photo';
      } else if (req.file.mimetype.startsWith('video/')) {
        finalMessageType = 'video';
      } else {
        finalMessageType = 'photo'; // Default to photo for unknown types
      }
    }

    const mediaUrl = req.file.path; // Cloudinary returns the URL in file.path
    console.log('Media URL to be stored:', mediaUrl);

    const [result] = await db.promise().execute(
      `INSERT INTO chat_messages (college_id, user_id, message_type, content, media_url, reply_to_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [collegeId, userId, finalMessageType, caption || '', mediaUrl, replyToId || null]
    );

    // Get the created message with user info and reply data
    const [messages] = await db.promise().execute(
      `SELECT cm.*, u.username, u.profile_picture,
              r.id as reply_to_id, r.content as reply_content, r.message_type as reply_message_type,
              ru.username as reply_username
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       LEFT JOIN chat_messages r ON cm.reply_to_id = r.id
       LEFT JOIN users ru ON r.user_id = ru.id
       WHERE cm.id = ?`,
      [result.insertId]
    );

    console.log('Created message:', messages[0]);

    res.status(201).json({ 
      message: 'Media message sent successfully', 
      chatMessage: messages[0] 
    });
  } catch (error) {
    console.error('Error sending media message:', error);
    res.status(500).json({ error: 'Failed to send media message' });
  }
});

// Send a voice message (for when voice is recorded directly in browser)
router.post('/college/:collegeId/voice', verifyToken, async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { audioBlob, duration, caption } = req.body;
    const userId = req.user.userId;

    // Verify user belongs to this college
    if (req.user.college_id !== parseInt(collegeId)) {
      return res.status(403).json({ error: 'Not authorized to send messages to this college' });
    }

    // For now, we'll store the audio data as base64 in the database
    // In production, you might want to save it as a file
    const [result] = await db.promise().execute(
      `INSERT INTO chat_messages (college_id, user_id, message_type, content, media_url) 
       VALUES (?, ?, 'voice', ?, ?)`,
      [collegeId, userId, caption || '', audioBlob]
    );

    // Get the created message with user info
    const [messages] = await db.promise().execute(
      `SELECT cm.*, u.username, u.profile_picture
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ 
      message: 'Voice message sent successfully', 
      chatMessage: messages[0] 
    });
  } catch (error) {
    console.error('Error sending voice message:', error);
    res.status(500).json({ error: 'Failed to send voice message' });
  }
});

// Get online users for a college
router.get('/college/:collegeId/online-users', verifyToken, async (req, res) => {
  try {
    const { collegeId } = req.params;
    
    // Get users who have been active in the last 10 minutes (using typing indicators as a proxy)
    const [activeUsers] = await db.promise().execute(
      `SELECT DISTINCT u.id, u.username, u.profile_picture, u.full_name, 
              ti.last_typing_at as last_seen
       FROM users u
       LEFT JOIN chat_typing_indicators ti ON u.id = ti.user_id AND ti.college_id = u.college_id
       WHERE u.college_id = ?
       AND (ti.last_typing_at IS NULL OR ti.last_typing_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE))
       ORDER BY u.username ASC`,
      [collegeId]
    );

    // Ensure unique users by ID and mark users as online if they've been active recently
    const uniqueUsers = [];
    const seenIds = new Set();
    
    activeUsers.forEach(user => {
      if (!seenIds.has(user.id)) {
        seenIds.add(user.id);
        uniqueUsers.push({
          ...user,
          isOnline: true,
          lastSeen: user.last_seen || new Date().toISOString()
        });
      }
    });

    res.json({ onlineUsers: uniqueUsers });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

// Pin/Unpin a message (admin only)
router.put('/:messageId/pin', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { is_pinned } = req.body;

    // Note: In a real app, you'd check if user has admin privileges
    await db.promise().execute(
      'UPDATE chat_messages SET is_pinned = ? WHERE id = ?',
      [is_pinned, messageId]
    );

    res.json({ message: 'Message pin status updated successfully' });
  } catch (error) {
    console.error('Error updating pin status:', error);
    res.status(500).json({ error: 'Failed to update pin status' });
  }
});

// Get pinned messages for a college
router.get('/college/:collegeId/pinned', verifyToken, async (req, res) => {
  try {
    const { collegeId } = req.params;
    
    const [messages] = await db.promise().execute(
      `SELECT cm.*, u.username, u.profile_picture
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.college_id = ? AND cm.is_pinned = TRUE
       ORDER BY cm.created_at DESC`,
      [collegeId]
    );

    res.json({ pinnedMessages: messages });
  } catch (error) {
    console.error('Error fetching pinned messages:', error);
    res.status(500).json({ error: 'Failed to fetch pinned messages' });
  }
});

// Edit a message (only by sender)
router.put('/:messageId', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    // Check if user owns the message
    const [message] = await db.promise().execute(
      'SELECT * FROM chat_messages WHERE id = ?',
      [messageId]
    );

    if (!message[0]) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    // Update the message
    await db.promise().execute(
      'UPDATE chat_messages SET content = ?, updated_at = NOW() WHERE id = ?',
      [content.trim(), messageId]
    );

    res.json({ message: 'Message updated successfully' });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Edit a message (only by sender) - with /message/ prefix for frontend compatibility
router.put('/message/:messageId', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    console.log('Edit message request:', { messageId, content, userId });

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    // Check if user owns the message
    const [message] = await db.promise().execute(
      'SELECT * FROM chat_messages WHERE id = ?',
      [messageId]
    );

    console.log('Found message:', message[0]);

    if (!message[0]) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    // Check if updated_at column exists, if not just update content
    try {
      await db.promise().execute(
        'UPDATE chat_messages SET content = ?, updated_at = NOW() WHERE id = ?',
        [content.trim(), messageId]
      );
    } catch (updateError) {
      console.log('Updated_at column not found, updating without it:', updateError.message);
      // Try without updated_at column
      await db.promise().execute(
        'UPDATE chat_messages SET content = ? WHERE id = ?',
        [content.trim(), messageId]
      );
    }

    res.json({ message: 'Message updated successfully' });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete a message (only by sender)
router.delete('/:messageId', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    // Check if user owns the message
    const [message] = await db.promise().execute(
      'SELECT * FROM chat_messages WHERE id = ?',
      [messageId]
    );

    if (!message[0]) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    // Delete the message
    await db.promise().execute(
      'DELETE FROM chat_messages WHERE id = ?',
      [messageId]
    );

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Delete a message (only by sender) - with /message/ prefix for frontend compatibility
router.delete('/message/:messageId', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    // Check if user owns the message
    const [message] = await db.promise().execute(
      'SELECT * FROM chat_messages WHERE id = ?',
      [messageId]
    );

    if (!message[0]) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    // Delete the message
    await db.promise().execute(
      'DELETE FROM chat_messages WHERE id = ?',
      [messageId]
    );

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Add reaction to a message
router.post('/message/:messageId/reaction', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user.userId;

    if (!reactionType) {
      return res.status(400).json({ error: 'Reaction type is required' });
    }

    // Check if message exists
    const [message] = await db.promise().execute(
      'SELECT * FROM chat_messages WHERE id = ?',
      [messageId]
    );

    if (!message[0]) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user already has a reaction on this message
    const [existingReaction] = await db.promise().execute(
      'SELECT * FROM chat_reactions WHERE message_id = ? AND user_id = ?',
      [messageId, userId]
    );

    if (existingReaction.length > 0) {
      // Update existing reaction
      await db.promise().execute(
        'UPDATE chat_reactions SET reaction_type = ? WHERE message_id = ? AND user_id = ?',
        [reactionType, messageId, userId]
      );
    } else {
      // Add new reaction
      await db.promise().execute(
        'INSERT INTO chat_reactions (message_id, user_id, reaction_type) VALUES (?, ?, ?)',
        [messageId, userId, reactionType]
      );
    }

    res.json({ message: 'Reaction added successfully' });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Remove reaction from a message
router.delete('/message/:messageId/reaction', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    // Remove the reaction
    await db.promise().execute(
      'DELETE FROM chat_reactions WHERE message_id = ? AND user_id = ?',
      [messageId, userId]
    );

    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// Clear all chat messages for a college (admin only)
router.delete('/college/:collegeId/clear', verifyToken, async (req, res) => {
  try {
    const { collegeId } = req.params;
    const userId = req.user.userId;

    // Check if user is admin or has permission to clear chat
    // For now, we'll allow any user to clear their college's chat
    // In production, you might want to restrict this to admins only
    if (req.user.college_id !== parseInt(collegeId)) {
      return res.status(403).json({ error: 'Not authorized to clear this college chat' });
    }

    // Delete all messages for the college
    const [result] = await db.promise().execute(
      'DELETE FROM chat_messages WHERE college_id = ?',
      [collegeId]
    );

    // Also clear any reactions for messages that were deleted
    // Note: This might not be necessary if you have CASCADE DELETE set up
    await db.promise().execute(
      'DELETE cr FROM chat_reactions cr INNER JOIN chat_messages cm ON cr.message_id = cm.id WHERE cm.college_id = ?',
      [collegeId]
    );

    console.log(`Cleared ${result.affectedRows} messages from college ${collegeId} by user ${userId}`);
    res.json({ 
      message: 'Chat cleared successfully', 
      deletedMessages: result.affectedRows 
    });
  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

module.exports = router;
