const cloudinary = require('cloudinary').v2;
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const testBannerCreation = async () => {
  let connection;

  try {
    // Test Cloudinary connection
    console.log('🧪 Testing Cloudinary connection...');
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result);

    // Test database connection
    console.log('\n🧪 Testing database connection...');
    connection = await mysql.createConnection({
      host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
      user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash_db',
      port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306
    });
    console.log('✅ Database connection successful');

    // Check banners table structure
    console.log('\n🧪 Checking banners table structure...');
    const [columns] = await connection.execute('DESCRIBE banners');
    console.log('📋 Banners table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Check existing banners
    console.log('\n🧪 Checking existing banners...');
    const [banners] = await connection.execute('SELECT * FROM banners LIMIT 5');
    console.log(`📊 Found ${banners.length} banners:`);
    banners.forEach(banner => {
      console.log(`  - ID: ${banner.id}, Title: ${banner.title}, Image: ${banner.image_url?.substring(0, 50)}...`);
    });

    // Test Cloudinary upload with a simple image URL
    console.log('\n🧪 Testing Cloudinary upload...');
    try {
      // Create a test banner entry
      const testImageUrl = 'https://res.cloudinary.com/ddjsd5hqu/image/upload/v1/axomclash/banners/test-banner.jpg';
      
      const [result] = await connection.execute(
        `INSERT INTO banners (title, description, image_url, cta_text, cta_link, display_order, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Test Banner', 'Test Description', testImageUrl, 'Test CTA', '#', 0, true]
      );
      
      console.log('✅ Test banner created successfully with ID:', result.insertId);
      
      // Clean up test banner
      await connection.execute('DELETE FROM banners WHERE id = ?', [result.insertId]);
      console.log('🧹 Test banner cleaned up');
      
    } catch (uploadError) {
      console.error('❌ Test banner creation failed:', uploadError);
    }

    console.log('\n🎉 Banner creation test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run the test
testBannerCreation().catch(console.error);
