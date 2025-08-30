const mysql = require('mysql2/promise');
require('dotenv').config();

const checkMissingImages = async () => {
  let connection;

  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
      user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash_db',
      port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database successfully');

    // Check posts with missing images
    console.log('\n📁 Checking posts...');
    const [posts] = await connection.execute(`
      SELECT id, media_urls, type
      FROM posts
      WHERE media_urls IS NOT NULL 
      AND media_urls != 'null' 
      AND media_urls != '[]'
    `);

    for (const post of posts) {
      try {
        let mediaUrls = [];
        if (post.media_urls) {
          if (typeof post.media_urls === 'string') {
            if (post.media_urls.startsWith('[')) {
              mediaUrls = JSON.parse(post.media_urls);
            } else {
              mediaUrls = [post.media_urls];
            }
          } else if (Array.isArray(post.media_urls)) {
            mediaUrls = post.media_urls;
          }
        }

        for (const url of mediaUrls) {
          if (typeof url === 'string') {
            if (url.includes('/uploads/')) {
              console.log(`❌ Post ${post.id}: Still has local path: ${url}`);
            } else if (url.includes('cloudinary.com')) {
              console.log(`✅ Post ${post.id}: Has Cloudinary URL: ${url.substring(0, 50)}...`);
            } else {
              console.log(`⚠️  Post ${post.id}: Unknown URL format: ${url}`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error);
      }
    }

    // Check user profiles
    console.log('\n👤 Checking user profiles...');
    const [users] = await connection.execute(`
      SELECT id, username, profile_picture, cover_photo
      FROM users
      WHERE profile_picture IS NOT NULL OR cover_photo IS NOT NULL
    `);

    for (const user of users) {
      if (user.profile_picture) {
        if (user.profile_picture.includes('/uploads/')) {
          console.log(`❌ User ${user.id} (${user.username}): Profile picture still local: ${user.profile_picture}`);
        } else if (user.profile_picture.includes('cloudinary.com')) {
          console.log(`✅ User ${user.id} (${user.username}): Profile picture is Cloudinary`);
        }
      }
      
      if (user.cover_photo) {
        if (user.cover_photo.includes('/uploads/')) {
          console.log(`❌ User ${user.id} (${user.username}): Cover photo still local: ${user.cover_photo}`);
        } else if (user.cover_photo.includes('cloudinary.com')) {
          console.log(`✅ User ${user.id} (${user.username}): Cover photo is Cloudinary`);
        }
      }
    }

    // Check banners
    console.log('\n🎯 Checking banners...');
    const [banners] = await connection.execute(`
      SELECT id, title, image_url
      FROM banners
      WHERE image_url IS NOT NULL
    `);

    for (const banner of banners) {
      if (banner.image_url.includes('/uploads/')) {
        console.log(`❌ Banner ${banner.id} (${banner.title}): Still local: ${banner.image_url}`);
      } else if (banner.image_url.includes('cloudinary.com')) {
        console.log(`✅ Banner ${banner.id} (${banner.title}): Is Cloudinary`);
      }
    }

    console.log('\n🎉 Database check completed!');

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run the check
checkMissingImages().catch(console.error);
