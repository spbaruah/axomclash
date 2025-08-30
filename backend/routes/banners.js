const express = require('express');
const multer = require('multer');
const db = require('../config/database');
const { getStorage } = require('../config/cloudinary');
const router = express.Router();

// Configure multer for Cloudinary uploads
const upload = multer({
  storage: getStorage('banners'),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware to verify admin JWT token
const verifyAdminToken = async (req, res, next) => {
  try {
    console.log('🔐 Verifying admin token...');
    console.log('📋 Headers:', req.headers);
    
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('🔑 Token found:', token.substring(0, 20) + '...');
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    console.log('🔓 Token decoded:', { userId: decoded.userId, isAdmin: decoded.isAdmin });
    
    if (!decoded.isAdmin) {
      console.log('❌ User is not admin');
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.admin = decoded;
    console.log('✅ Admin token verified successfully');
    next();
  } catch (error) {
    console.error('❌ Admin token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Test banner creation endpoint (for debugging)
router.post('/test', verifyAdminToken, async (req, res) => {
  try {
    console.log('🧪 Testing banner creation endpoint...');
    console.log('📋 Request body:', req.body);
    console.log('📋 Request headers:', req.headers);
    
    // Check if banners table exists
    try {
      console.log('🔍 Checking if banners table exists...');
      await db.promise().execute('SELECT 1 FROM banners LIMIT 1');
      console.log('✅ Banners table exists');
      
      // Check table structure
      const [columns] = await db.promise().execute('DESCRIBE banners');
      console.log('📋 Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
      });
      
    } catch (tableError) {
      console.error('❌ Banners table error:', tableError.message);
      return res.status(500).json({ 
        error: 'Banners table issue',
        details: tableError.message
      });
    }
    
    // Test database connection with a simple query
    try {
      const [result] = await db.promise().execute('SELECT COUNT(*) as count FROM banners');
      console.log(`✅ Database connection working. Current banner count: ${result[0].count}`);
    } catch (dbError) {
      console.error('❌ Database query error:', dbError.message);
      return res.status(500).json({ 
        error: 'Database query failed',
        details: dbError.message
      });
    }
    
    res.json({ 
      message: 'Banner creation test completed',
      tableExists: true,
      databaseWorking: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({ 
      error: 'Test failed',
      details: error.message
    });
  }
});

// Health check endpoint for banners
router.get('/health', async (req, res) => {
  try {
    console.log('🏥 Banner health check requested');
    
    // Check database connection
    if (!db) {
      console.error('❌ Database connection not available');
      return res.status(500).json({ 
        status: 'unhealthy',
        database: 'disconnected',
        error: 'Database connection failed'
      });
    }
    
    // Test database query
    const [result] = await db.promise().execute('SELECT 1 as test');
    
    if (result && result.length > 0) {
      console.log('✅ Banner health check passed');
      res.json({ 
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Database query test failed');
      res.status(500).json({ 
        status: 'unhealthy',
        database: 'query_failed',
        error: 'Database query test failed'
      });
    }
  } catch (error) {
    console.error('❌ Banner health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all active banners (public endpoint)
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/banners - Fetching active banners...');
    const [banners] = await db.promise().execute(
      'SELECT * FROM banners WHERE is_active = TRUE ORDER BY display_order ASC, created_at DESC'
    );

    const formattedBanners = banners.map(banner => ({
      id: banner.id,
      title: banner.title,
      description: banner.description,
      image_url: banner.image_url,
      cta_text: banner.cta_text,
      cta_link: banner.cta_link,
      display_order: banner.display_order,
      is_active: banner.is_active
    }));

    console.log(`✅ Found ${formattedBanners.length} active banners`);
    res.json({ banners: formattedBanners });
  } catch (error) {
    console.error('❌ Error fetching banners:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch banners',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all banners (admin endpoint)
router.get('/admin', verifyAdminToken, async (req, res) => {
  try {
    console.log('📋 GET /api/banners/admin - Fetching all banners for admin...');
    const [banners] = await db.promise().execute(
      'SELECT * FROM banners ORDER BY display_order ASC, created_at DESC'
    );

    const formattedBanners = banners.map(banner => ({
      id: banner.id,
      title: banner.title,
      description: banner.description,
      image_url: banner.image_url,
      cta_text: banner.cta_text,
      cta_link: banner.cta_link,
      display_order: banner.display_order,
      is_active: banner.is_active,
      created_at: banner.created_at,
      updated_at: banner.updated_at
    }));

    console.log(`✅ Found ${formattedBanners.length} banners for admin`);
    res.json({ banners: formattedBanners });
  } catch (error) {
    console.error('❌ Error fetching admin banners:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// Create new banner (admin endpoint)
router.post('/', verifyAdminToken, upload.single('image'), async (req, res) => {
  try {
    console.log('📝 Creating new banner...');
    console.log('📋 Request body:', req.body);
    console.log('📁 File:', req.file);
    
    const { title, description, cta_text, cta_link, display_order, is_active } = req.body;
    
    if (!req.file) {
      console.log('❌ No image file provided');
      return res.status(400).json({ error: 'Image file is required' });
    }

    console.log('✅ Image file received:', req.file.originalname);
    
    // Handle both Cloudinary and local file storage
    let image_url;
    if (req.file.path && req.file.path.includes('cloudinary.com')) {
      // Cloudinary upload
      image_url = req.file.path;
      console.log('🌐 Cloudinary URL:', image_url);
    } else {
      // Local file storage fallback
      image_url = `/uploads/banners/${req.file.filename}`;
      console.log('💾 Local file path:', image_url);
    }

    // Check if banners table exists
    try {
      console.log('🔍 Checking if banners table exists...');
      await db.promise().execute('SELECT 1 FROM banners LIMIT 1');
      console.log('✅ Banners table exists');
    } catch (tableError) {
      console.error('❌ Banners table does not exist:', tableError.message);
      return res.status(500).json({ 
        error: 'Banners table not found',
        details: 'Database table "banners" does not exist. Please create it first.'
      });
    }

    console.log('💾 Inserting banner into database...');
    const [result] = await db.promise().execute(
      `INSERT INTO banners (title, description, image_url, cta_text, cta_link, display_order, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, image_url, cta_text, cta_link, display_order || 0, is_active === 'true']
    );

    const bannerId = result.insertId;
    console.log('✅ Banner inserted with ID:', bannerId);

    // Fetch the created banner
    const [banners] = await db.promise().execute(
      'SELECT * FROM banners WHERE id = ?',
      [bannerId]
    );

    console.log('🎉 Banner created successfully:', banners[0]);
    res.status(201).json({ 
      message: 'Banner created successfully',
      banner: banners[0]
    });
  } catch (error) {
    console.error('❌ Error creating banner:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create banner';
    if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Banners table not found in database';
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Invalid field in banner data';
    } else if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Banner with this title already exists';
    } else if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
      errorMessage = 'Invalid data type for one or more fields';
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = 'One or more fields exceed maximum length';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update banner (admin endpoint)
router.put('/:id', verifyAdminToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, cta_text, cta_link, display_order, is_active } = req.body;

    let image_url = null;
    let updateFields = [];
    let updateValues = [];

    // Build dynamic update query
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (cta_text !== undefined) {
      updateFields.push('cta_text = ?');
      updateValues.push(cta_text);
    }
    if (cta_link !== undefined) {
      updateFields.push('cta_link = ?');
      updateValues.push(cta_link);
    }
    if (display_order !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(display_order);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active === 'true');
    }

    // Handle image upload if provided
    if (req.file) {
      image_url = req.file.path; // Cloudinary returns the URL in file.path
      updateFields.push('image_url = ?');
      updateValues.push(image_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const [result] = await db.promise().execute(
      `UPDATE banners SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    // Fetch the updated banner
    const [banners] = await db.promise().execute(
      'SELECT * FROM banners WHERE id = ?',
      [id]
    );

    res.json({ 
      message: 'Banner updated successfully',
      banner: banners[0]
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

// Delete banner (admin endpoint)
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    // First get the banner to delete the image file
    const [banners] = await db.promise().execute(
      'SELECT image_url FROM banners WHERE id = ?',
      [id]
    );

    if (banners.length === 0) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    // Delete the banner from database
    const [result] = await db.promise().execute(
      'DELETE FROM banners WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    // TODO: Delete the image file from uploads/banners/ directory
    // This would require fs module and proper error handling

    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

// Toggle banner status (admin endpoint)
router.patch('/:id/toggle', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.promise().execute(
      'UPDATE banners SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    // Fetch the updated banner
    const [banners] = await db.promise().execute(
      'SELECT * FROM banners WHERE id = ?',
      [id]
    );

    res.json({ 
      message: 'Banner status toggled successfully',
      banner: banners[0]
    });
  } catch (error) {
    console.error('Error toggling banner status:', error);
    res.status(500).json({ error: 'Failed to toggle banner status' });
  }
});

// Reorder banners (admin endpoint)
router.post('/reorder', verifyAdminToken, async (req, res) => {
  try {
    const { bannerOrders } = req.body; // Array of {id, display_order}

    if (!Array.isArray(bannerOrders)) {
      return res.status(400).json({ error: 'bannerOrders must be an array' });
    }

    // Update each banner's display order
    for (const banner of bannerOrders) {
      await db.promise().execute(
        'UPDATE banners SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [banner.display_order, banner.id]
      );
    }

    res.json({ message: 'Banner order updated successfully' });
  } catch (error) {
    console.error('Error reordering banners:', error);
    res.status(500).json({ error: 'Failed to reorder banners' });
  }
});

module.exports = router;
