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

// Get all active banners (public endpoint)
router.get('/', async (req, res) => {
  try {
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

    res.json({ banners: formattedBanners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// Get all banners (admin endpoint)
router.get('/admin', verifyAdminToken, async (req, res) => {
  try {
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

    res.json({ banners: formattedBanners });
  } catch (error) {
    console.error('Error fetching admin banners:', error);
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
    const image_url = req.file.path; // Cloudinary returns the URL in file.path
    console.log('🌐 Cloudinary URL:', image_url);

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
    res.status(500).json({ error: 'Failed to create banner' });
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
