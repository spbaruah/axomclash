const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/posts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

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

// Get all posts (for community feed)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    console.log('Posts route - page:', page, 'limit:', limit, 'offset:', offset);
    
    // Check if user is authenticated
    let userId = null;
    try {
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        userId = decoded.userId;
      }
    } catch (error) {
      // Token is invalid or missing, continue without user context
    }
    
    let postsQuery;
    let queryParams;
    
    if (userId) {
      // Include user's like status and respect visibility, exclude blocked users
      postsQuery = `
        SELECT p.*, u.username, u.profile_picture,
               c.name as college_name, c.logo_url as college_logo,
               r.reaction_type as user_reaction
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN colleges c ON p.college_id = c.id
        LEFT JOIN reactions r ON p.id = r.post_id AND r.user_id = ?
        WHERE p.is_active = TRUE 
        AND (p.visibility = 'public' OR p.visibility = 'college_only' OR p.user_id = ?)
        AND p.user_id NOT IN (
          SELECT blocked_id FROM user_blocks WHERE blocker_id = ?
        )
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [userId, userId, userId, limit, offset];
      console.log('Posts query with user - queryParams:', queryParams);
    } else {
      // No user context - only show public posts
      postsQuery = `
        SELECT p.*, u.username, u.profile_picture,
               c.name as college_name, c.logo_url as college_logo
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN colleges c ON p.college_id = c.id
        WHERE p.is_active = TRUE AND p.visibility = 'public'
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [limit, offset];
      console.log('Posts query without user - queryParams:', queryParams);
    }
    
    console.log('Executing posts query with params:', queryParams);
    const [posts] = await db.promise().query(postsQuery, queryParams);

    // Parse JSON fields
    const processedPosts = posts.map(post => {
      try {
        let mediaUrls = [];
        let pollOptions = null;
        let pollVotes = null;
        
        // Handle media_urls - could be JSON array, string, or null
        if (post.media_urls) {
          if (typeof post.media_urls === 'string') {
            if (post.media_urls.trim() === '') {
              mediaUrls = [];
            } else if (post.media_urls.startsWith('[')) {
              // It's already JSON
              mediaUrls = JSON.parse(post.media_urls);
            } else {
              // It's a single file path, convert to array
              mediaUrls = [post.media_urls];
            }
          } else if (Array.isArray(post.media_urls)) {
            mediaUrls = post.media_urls;
          }
        }
        
        // Handle poll_options
        if (post.poll_options && post.poll_options !== 'null') {
          try {
            pollOptions = JSON.parse(post.poll_options);
          } catch (e) {
            pollOptions = null;
          }
        }
        
        // Handle poll_votes
        if (post.poll_votes && post.poll_votes !== 'null') {
          try {
            pollVotes = JSON.parse(post.poll_votes);
          } catch (e) {
            pollVotes = null;
          }
        }
        
        return {
          ...post,
          media_urls: mediaUrls,
          poll_options: pollOptions,
          poll_votes: pollVotes
        };
      } catch (error) {
        console.error('Error parsing JSON for post:', post.id, error);
        return {
          ...post,
          media_urls: [],
          poll_options: null,
          poll_votes: null
        };
      }
    });

    res.json({ posts: processedPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get posts for a specific user ("My Posts")
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Determine viewer (optional auth)
    let viewerId = null;
    try {
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        viewerId = decoded.userId;
      }
    } catch (error) {
      // Ignore invalid/missing token; treat as public viewer
    }

    let postsQuery;
    let queryParams;

    if (viewerId && String(viewerId) === String(userId)) {
      // Owner viewing their own posts → include private
      postsQuery = `
        SELECT p.*, u.username, u.profile_picture,
               c.name as college_name, c.logo_url as college_logo
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN colleges c ON p.college_id = c.id
        WHERE p.user_id = ? AND p.is_active = TRUE
        ORDER BY p.created_at DESC
      `;
      queryParams = [userId];
    } else {
      // Public viewer → only show public and college_only, but check if viewer is blocked
      if (viewerId) {
        // Check if the viewer is blocked by the post owner
        const [blockCheck] = await db.promise().query(
          'SELECT id FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?',
          [userId, viewerId]
        );
        
        if (blockCheck.length > 0) {
          // Viewer is blocked by the post owner, return empty posts
          return res.json({ posts: [] });
        }
      }
      
      postsQuery = `
        SELECT p.*, u.username, u.profile_picture,
               c.name as college_name, c.logo_url as college_logo
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN colleges c ON p.college_id = c.id
        WHERE p.user_id = ? AND p.is_active = TRUE AND (p.visibility = 'public' OR p.visibility = 'college_only')
        ORDER BY p.created_at DESC
      `;
      queryParams = [userId];
    }

    const [posts] = await db.promise().query(postsQuery, queryParams);

    // Parse JSON fields similar to other list endpoints
    const processedPosts = posts.map(post => {
      try {
        let mediaUrls = [];
        let pollOptions = null;
        let pollVotes = null;

        if (post.media_urls) {
          if (typeof post.media_urls === 'string') {
            if (post.media_urls.trim() === '') {
              mediaUrls = [];
            } else if (post.media_urls.startsWith('[')) {
              mediaUrls = JSON.parse(post.media_urls);
            } else {
              mediaUrls = [post.media_urls];
            }
          } else if (Array.isArray(post.media_urls)) {
            mediaUrls = post.media_urls;
          }
        }

        if (post.poll_options && post.poll_options !== 'null') {
          try { pollOptions = JSON.parse(post.poll_options); } catch (e) { pollOptions = null; }
        }
        if (post.poll_votes && post.poll_votes !== 'null') {
          try { pollVotes = JSON.parse(post.poll_votes); } catch (e) { pollVotes = null; }
        }

        return { ...post, media_urls: mediaUrls, poll_options: pollOptions, poll_votes: pollVotes };
      } catch (e) {
        return { ...post, media_urls: [], poll_options: null, poll_votes: null };
      }
    });

    res.json({ posts: processedPosts });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// Get posts for a college
router.get('/college/:collegeId', async (req, res) => {
  try {
    const { collegeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Check if user is authenticated
    let userId = null;
    try {
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        userId = decoded.userId;
      }
    } catch (error) {
      // Token is invalid or missing, continue without user context
    }
    
    let postsQuery;
    let queryParams;
    
    if (userId) {
      // Include user's like status and respect visibility, exclude blocked users
      postsQuery = `
        SELECT p.*, u.username, u.profile_picture,
               c.name as college_name, c.logo_url as college_logo,
               r.reaction_type as user_reaction
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN colleges c ON p.college_id = c.id
        LEFT JOIN reactions r ON p.id = r.post_id AND r.user_id = ?
        WHERE p.college_id = ? AND p.is_active = TRUE
        AND (p.visibility = 'public' OR p.visibility = 'college_only' OR p.user_id = ?)
        AND p.user_id NOT IN (
          SELECT blocked_id FROM user_blocks WHERE blocker_id = ?
        )
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [userId, collegeId, userId, userId, limit, offset];
    } else {
      // No user context - only show public posts
      postsQuery = `
        SELECT p.*, u.username, u.profile_picture,
               c.name as college_name, c.logo_url as college_logo
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN colleges c ON p.college_id = c.id
        WHERE p.college_id = ? AND p.is_active = TRUE AND p.visibility = 'public'
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [collegeId, limit, offset];
    }
    
    const [posts] = await db.promise().query(postsQuery, queryParams);

    // Parse JSON fields
    const processedPosts = posts.map(post => {
      try {
        let mediaUrls = [];
        let pollOptions = null;
        let pollVotes = null;
        
        // Handle media_urls - could be JSON array, string, or null
        if (post.media_urls) {
          if (typeof post.media_urls === 'string') {
            if (post.media_urls.trim() === '') {
              mediaUrls = [];
            } else if (post.media_urls.startsWith('[')) {
              // It's already JSON
              mediaUrls = JSON.parse(post.media_urls);
            } else {
              // It's a single file path, convert to array
              mediaUrls = [post.media_urls];
            }
          } else if (Array.isArray(post.media_urls)) {
            mediaUrls = post.media_urls;
          }
        }
        
        // Handle poll_options
        if (post.poll_options && post.poll_options !== 'null') {
          try {
            pollOptions = JSON.parse(post.poll_options);
          } catch (e) {
            pollOptions = null;
          }
        }
        
        // Handle poll_votes
        if (post.poll_votes && post.poll_votes !== 'null') {
          try {
            pollVotes = JSON.parse(post.poll_votes);
          } catch (e) {
            pollVotes = null;
          }
        }
        
        return {
          ...post,
          media_urls: mediaUrls,
          poll_options: pollOptions,
          poll_votes: pollVotes
        };
      } catch (error) {
        console.error('Error parsing JSON for post:', post.id, error);
        return {
          ...post,
          media_urls: [],
          poll_options: null,
          poll_votes: null
        };
      }
    });

    res.json({ posts: processedPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Upload media files for posts
router.post('/upload', verifyToken, upload.array('media', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => `/uploads/posts/${file.filename}`);
    
    res.json({ 
      success: true, 
      files: uploadedFiles,
      message: `${req.files.length} file(s) uploaded successfully` 
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Create a new post
router.post('/', verifyToken, upload.array('media', 5), async (req, res) => {
  try {
    const { type, content, poll_options, visibility = 'public' } = req.body;
    const userId = req.user.userId;
    const collegeId = req.user.college_id;

    // Validate required fields
    if (!type || !content) {
      return res.status(400).json({ error: 'Type and content are required' });
    }

    // Validate visibility
    const validVisibility = ['public', 'college_only', 'private'];
    if (!validVisibility.includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility setting' });
    }

    // Process uploaded files
    let mediaUrls = [];
    if (req.files && req.files.length > 0) {
      mediaUrls = req.files.map(file => `uploads/posts/${file.filename}`);
    }

    console.log('Creating post with media_urls:', mediaUrls);
    const [result] = await db.promise().query(
      `INSERT INTO posts (user_id, college_id, type, content, media_urls, poll_options, visibility) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, collegeId, type, content, JSON.stringify(mediaUrls), JSON.stringify(poll_options), visibility]
    );



    // Get the complete post data to return
    const [newPost] = await db.promise().query(
      `SELECT p.*, u.username, u.profile_picture, c.name as college_name, c.logo_url as college_logo
       FROM posts p
       JOIN users u ON p.user_id = u.id
       JOIN colleges c ON p.college_id = c.id
       WHERE p.id = ?`,
      [result.insertId]
    );

    // Parse JSON fields for the new post
    let processedPost = newPost[0];
    console.log('Raw post data from database:', processedPost);
    console.log('Raw media_urls from database:', processedPost.media_urls);
    
    try {
      let mediaUrls = [];
      let pollOptions = null;
      let pollVotes = null;
      
      // Handle media_urls - could be JSON array, string, or null
      if (processedPost.media_urls) {
        if (typeof processedPost.media_urls === 'string') {
          if (processedPost.media_urls.trim() === '') {
            mediaUrls = [];
          } else if (processedPost.media_urls.startsWith('[')) {
            // It's already JSON
            mediaUrls = JSON.parse(processedPost.media_urls);
          } else {
            // It's a single file path, convert to array
            mediaUrls = [processedPost.media_urls];
          }
        } else if (Array.isArray(processedPost.media_urls)) {
          mediaUrls = processedPost.media_urls;
        }
      }
      
      console.log('Processed media_urls:', mediaUrls);
      
      // Handle poll_options
      if (processedPost.poll_options && processedPost.poll_options !== 'null') {
        try {
          pollOptions = JSON.parse(processedPost.poll_options);
        } catch (e) {
          pollOptions = null;
        }
      }
      
      // Handle poll_votes
      if (processedPost.poll_votes && processedPost.poll_votes !== 'null') {
        try {
          pollVotes = JSON.parse(processedPost.poll_votes);
        } catch (e) {
          pollVotes = null;
        }
      }
      
      processedPost = {
        ...processedPost,
        media_urls: mediaUrls,
        poll_options: pollOptions,
        poll_votes: pollVotes
      };
    } catch (error) {
      console.error('Error parsing JSON for new post:', error);
      processedPost = {
        ...processedPost,
        media_urls: [],
        poll_options: null,
        poll_votes: null
      };
    }

    console.log('Final processed post being sent:', processedPost);
    res.status(201).json({ 
      message: 'Post created successfully', 
      post: processedPost,
      postId: result.insertId
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get user's saved posts
router.get('/saved', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [savedPosts] = await db.promise().query(
      `SELECT p.*, u.username, u.profile_picture,
              c.name as college_name, c.logo_url as college_logo,
              sp.created_at as saved_at,
              r.reaction_type as user_reaction
       FROM saved_posts sp
       JOIN posts p ON sp.post_id = p.id
       JOIN users u ON p.user_id = u.id
       JOIN colleges c ON p.college_id = c.id
       LEFT JOIN reactions r ON p.id = r.post_id AND r.user_id = ?
       WHERE sp.user_id = ? AND p.is_active = TRUE
       ORDER BY sp.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, limit, offset]
    );

    // Parse JSON fields
    const processedPosts = savedPosts.map(post => {
      try {
        let mediaUrls = [];
        let pollOptions = null;
        let pollVotes = null;

        if (post.media_urls) {
          // Clean up the media_urls string by removing newlines and extra spaces
          const cleanedMediaUrls = post.media_urls.replace(/\n/g, '').replace(/\r/g, '').trim();
          mediaUrls = JSON.parse(cleanedMediaUrls);
        }
        if (post.poll_options) {
          pollOptions = JSON.parse(post.poll_options);
        }
        if (post.poll_votes) {
          pollVotes = JSON.parse(post.poll_votes);
        }

        return {
          ...post,
          media_urls: mediaUrls,
          poll_options: pollOptions,
          poll_votes: pollVotes
        };
      } catch (error) {
        console.error('Error parsing JSON fields for post:', post.id, error);
        return {
          ...post,
          media_urls: [],
          poll_options: null,
          poll_votes: null
        };
      }
    });

    console.log('Sending saved posts response:', {
      count: processedPosts.length,
      posts: processedPosts.map(p => ({ id: p.id, content: p.content, media_urls: p.media_urls }))
    });
    
    res.json({ 
      savedPosts: processedPosts,
      page,
      limit,
      hasMore: savedPosts.length === limit
    });
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    res.status(500).json({ error: 'Failed to fetch saved posts' });
  }
});

// Get single post
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Check if user is authenticated
    let userId = null;
    try {
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        userId = decoded.userId;
      }
    } catch (error) {
      // Token is invalid or missing, continue without user context
    }
    
    let postsQuery;
    let queryParams;
    
    if (userId) {
      // Include user context and respect visibility, exclude blocked users
      postsQuery = `
        SELECT p.*, u.username, u.profile_picture,
               c.name as college_name, c.logo_url as college_logo
       FROM posts p
       JOIN users u ON p.user_id = u.id
       JOIN colleges c ON p.college_id = c.id
       WHERE p.id = ? AND p.is_active = TRUE
       AND (p.visibility = 'public' OR p.visibility = 'college_only' OR p.user_id = ?)
       AND p.user_id NOT IN (
         SELECT blocked_id FROM user_blocks WHERE blocker_id = ?
       )`,
        queryParams = [postId, userId, userId];
    } else {
      // No user context - only show public posts
      postsQuery = `
        SELECT p.*, u.username, u.profile_picture,
               c.name as college_name, c.logo_url as college_logo
       FROM posts p
       JOIN users u ON p.user_id = u.id
       JOIN colleges c ON p.college_id = c.id
       WHERE p.id = ? AND p.is_active = TRUE AND p.visibility = 'public'`,
        queryParams = [postId];
    }
    
    const [posts] = await db.promise().query(postsQuery, queryParams);

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Parse JSON fields
    const post = posts[0];
    let processedPost;
    try {
      let mediaUrls = [];
      let pollOptions = null;
      let pollVotes = null;
      
      // Handle media_urls - could be JSON array, string, or null
      if (post.media_urls) {
        if (typeof post.media_urls === 'string') {
          if (post.media_urls.trim() === '') {
            mediaUrls = [];
          } else if (post.media_urls.startsWith('[')) {
            // It's already JSON
            mediaUrls = JSON.parse(post.media_urls);
          } else {
            // It's a single file path, convert to array
            mediaUrls = [post.media_urls];
          }
        } else if (Array.isArray(post.media_urls)) {
          mediaUrls = post.media_urls;
        }
      }
      
      // Handle poll_options
      if (post.poll_options && post.poll_options !== 'null') {
        try {
          pollOptions = JSON.parse(post.poll_options);
        } catch (e) {
          pollOptions = null;
        }
      }
      
      // Handle poll_votes
      if (post.poll_votes && post.poll_votes !== 'null') {
        try {
          pollVotes = JSON.parse(post.poll_votes);
        } catch (e) {
          pollVotes = null;
        }
      }
      
      processedPost = {
        ...post,
        media_urls: mediaUrls,
        poll_options: pollOptions,
        poll_votes: pollVotes
      };
    } catch (error) {
      console.error('Error parsing JSON for post:', post.id, error);
      processedPost = {
        ...post,
        media_urls: [],
        poll_options: null,
        poll_votes: null
      };
    }

    res.json({ post: processedPost });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Like/Unlike a post
router.post('/:postId/react', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { reaction_type } = req.body;
    const userId = req.user.userId;

    // Validate reaction type
    const validReactions = ['love', 'laugh', 'fire', 'clap', 'wow', 'sad', 'angry'];
    if (!validReactions.includes(reaction_type)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    // Check if user already reacted
    const [existingReaction] = await db.promise().query(
      'SELECT id, reaction_type FROM reactions WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );

    if (existingReaction.length > 0) {
      const oldReactionType = existingReaction[0].reaction_type;
      
      if (oldReactionType === reaction_type) {
        // Remove reaction if clicking the same type
        await db.promise().query(
          'DELETE FROM reactions WHERE post_id = ? AND user_id = ?',
          [postId, userId]
        );
        
        // Decrease the old reaction count
        await db.promise().query(
          `UPDATE posts SET ${oldReactionType}_count = GREATEST(${oldReactionType}_count - 1, 0) WHERE id = ?`,
          [postId]
        );
        
        // Update total likes count
        await db.promise().query(
          'UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?',
          [postId]
        );
        
        res.json({ message: 'Reaction removed successfully', action: 'removed' });
      } else {
        // Update existing reaction to new type
        await db.promise().query(
          'UPDATE reactions SET reaction_type = ? WHERE post_id = ? AND user_id = ?',
          [reaction_type, postId, userId]
        );
        
        // Decrease the old reaction count
        await db.promise().query(
          `UPDATE posts SET ${oldReactionType}_count = GREATEST(${oldReactionType}_count - 1, 0) WHERE id = ?`,
          [postId]
        );
        
        // Increase the new reaction count
        await db.promise().query(
          `UPDATE posts SET ${reaction_type}_count = ${reaction_type}_count + 1 WHERE id = ?`,
          [postId]
        );
        
        res.json({ message: 'Reaction updated successfully', action: 'updated' });
      }
    } else {
      // Create new reaction
      await db.promise().query(
        'INSERT INTO reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)',
        [postId, userId, reaction_type]
      );
      
      // Increase the reaction count
      await db.promise().query(
        `UPDATE posts SET ${reaction_type}_count = ${reaction_type}_count + 1 WHERE id = ?`,
        [postId]
      );
      
      // Update total likes count
      await db.promise().query(
        'UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?',
        [postId]
      );
      

      
      res.json({ message: 'Reaction added successfully', action: 'added' });
    }
  } catch (error) {
    console.error('Error updating reaction:', error);
    res.status(500).json({ error: 'Failed to update reaction' });
  }
});

// Get comments for a post
router.get('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Check if user is authenticated
    let userId = null;
    try {
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        userId = decoded.userId;
      }
    } catch (error) {
      // Token is invalid or missing, continue without user context
    }
    
    let commentsQuery;
    let queryParams;
    
    if (userId) {
      // Include user's like status
      commentsQuery = `
        SELECT c.*, u.username, u.profile_picture,
               CASE WHEN cl.id IS NOT NULL THEN TRUE ELSE FALSE END as is_liked
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_id = ?
        WHERE c.post_id = ? AND c.is_active = TRUE
        ORDER BY c.created_at DESC
      `;
      queryParams = [userId, postId];
    } else {
      // No user context
      commentsQuery = `
        SELECT c.*, u.username, u.profile_picture
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ? AND c.is_active = TRUE
        ORDER BY c.created_at DESC
      `;
      queryParams = [postId];
    }
    
    const [comments] = await db.promise().query(commentsQuery, queryParams);

    res.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a comment to a post
router.post('/:postId/comments', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parent_id } = req.body;
    const userId = req.user.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Insert comment
    const [result] = await db.promise().query(
      'INSERT INTO comments (post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [postId, userId, content.trim(), parent_id || null]
    );

    // Get the created comment with user info
    const [comments] = await db.promise().query(
      `SELECT c.*, u.username, u.profile_picture
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    if (comments.length === 0) {
      return res.status(500).json({ error: 'Failed to create comment' });
    }

    const comment = comments[0];

    // Update post comments count
    await db.promise().query(
      'UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?',
      [postId]
    );



    res.json({ 
      message: 'Comment added successfully',
      comment: {
        ...comment,
        likes_count: 0,
        is_liked: false
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Save a post
router.post('/:postId/save', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // Check if post exists
    const [posts] = await db.promise().query(
      'SELECT id FROM posts WHERE id = ? AND is_active = TRUE',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already saved
    const [existing] = await db.promise().query(
      'SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Post already saved' });
    }

    // Save the post
    await db.promise().query(
      'INSERT INTO saved_posts (user_id, post_id) VALUES (?, ?)',
      [userId, postId]
    );

    res.json({ message: 'Post saved successfully' });
  } catch (error) {
    console.error('Error saving post:', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

// Unsave a post
router.delete('/:postId/save', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // Remove saved post
    const [result] = await db.promise().query(
      'DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Saved post not found' });
    }

    res.json({ message: 'Post unsaved successfully' });
  } catch (error) {
    console.error('Error unsaving post:', error);
    res.status(500).json({ error: 'Failed to unsave post' });
  }
});



// Check if a post is saved by the user
router.get('/:postId/saved', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const [saved] = await db.promise().query(
      'SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    res.json({ isSaved: saved.length > 0 });
  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({ error: 'Failed to check saved status' });
  }
});

// Report a post
router.post('/:postId/report', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user.userId;

    // Validate reason
    const validReasons = ['spam', 'inappropriate', 'harassment', 'violence', 'fake_news', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason for report' });
    }

    // Check if post exists and is active
    const [posts] = await db.promise().query(
      'SELECT id, user_id FROM posts WHERE id = ? AND is_active = TRUE',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is reporting their own post
    if (posts[0].user_id === userId) {
      return res.status(400).json({ error: 'Cannot report your own post' });
    }

    // Check if user has already reported this post
    const [existingReport] = await db.promise().query(
      'SELECT id FROM post_reports WHERE post_id = ? AND reporter_id = ?',
      [postId, userId]
    );

    if (existingReport.length > 0) {
      return res.status(400).json({ error: 'You have already reported this post' });
    }

    // Create the report
    await db.promise().query(
      'INSERT INTO post_reports (post_id, reporter_id, reason, description) VALUES (?, ?, ?, ?)',
      [postId, userId, reason, description || null]
    );

    // Update post report count
    await db.promise().query(
      'UPDATE posts SET report_count = report_count + 1 WHERE id = ?',
      [postId]
    );

    res.json({ message: 'Post reported successfully' });
  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({ error: 'Failed to report post' });
  }
});

module.exports = router;
