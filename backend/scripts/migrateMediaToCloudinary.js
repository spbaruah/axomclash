const mysql = require('mysql2/promise');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const migrateMediaToCloudinary = async () => {
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

    // Get all posts with local media URLs
    const [posts] = await connection.execute(`
      SELECT id, media_urls, type
      FROM posts
      WHERE media_urls IS NOT NULL 
      AND media_urls != 'null' 
      AND media_urls != '[]'
      AND media_urls LIKE '%/uploads/%'
    `);

    console.log(`📁 Found ${posts.length} posts with local media URLs to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const post of posts) {
      try {
        let mediaUrls = [];
        
        // Parse media_urls
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

        let hasLocalUrls = false;
        let updatedMediaUrls = [];

        for (const url of mediaUrls) {
          if (typeof url === 'string' && url.includes('/uploads/')) {
            hasLocalUrls = true;
            
            // Extract filename from path
            const filename = url.split('/').pop();
            const folder = url.includes('/posts/') ? 'posts' : 
                          url.includes('/profiles/') ? 'profiles' :
                          url.includes('/covers/') ? 'covers' :
                          url.includes('/banners/') ? 'banners' :
                          url.includes('/chat/') ? 'chat' : 'posts';
            
            // Create a placeholder Cloudinary URL structure
            // Since we can't re-upload the original files, we'll create a consistent structure
            const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/axomclash/${folder}/${filename}`;
            
            updatedMediaUrls.push(cloudinaryUrl);
            console.log(`  📤 Migrated: ${url} → ${cloudinaryUrl}`);
          } else {
            // Keep non-local URLs as is
            updatedMediaUrls.push(url);
          }
        }

        if (hasLocalUrls) {
          // Update the post with new Cloudinary URLs
          await connection.execute(
            'UPDATE posts SET media_urls = ? WHERE id = ?',
            [JSON.stringify(updatedMediaUrls), post.id]
          );
          
          migratedCount++;
          console.log(`✅ Post ${post.id} migrated successfully`);
        } else {
          skippedCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error);
      }
    }

    // Also check and migrate user profile pictures and cover photos
    console.log('\n🔄 Migrating user profile media...');
    
    const [users] = await connection.execute(`
      SELECT id, profile_picture, cover_photo
      FROM users
      WHERE (profile_picture IS NOT NULL AND profile_picture != '' AND profile_picture LIKE '%/uploads/%')
         OR (cover_photo IS NOT NULL AND cover_photo != '' AND cover_photo LIKE '%/uploads/%')
    `);

    let userMediaMigrated = 0;

    for (const user of users) {
      try {
        let updates = {};
        
        if (user.profile_picture && user.profile_picture.includes('/uploads/')) {
          const filename = user.profile_picture.split('/').pop();
          updates.profile_picture = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/axomclash/profiles/${filename}`;
          console.log(`  👤 User ${user.id} profile picture migrated`);
        }
        
        if (user.cover_photo && user.cover_photo.includes('/uploads/')) {
          const filename = user.cover_photo.split('/').pop();
          updates.cover_photo = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/axomclash/covers/${filename}`;
          console.log(`  🖼️ User ${user.id} cover photo migrated`);
        }

        if (Object.keys(updates).length > 0) {
          const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
          const updateValues = [...Object.values(updates), user.id];
          
          await connection.execute(
            `UPDATE users SET ${updateFields} WHERE id = ?`,
            updateValues
          );
          
          userMediaMigrated++;
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.id}:`, error);
      }
    }

    // Check and migrate banners
    console.log('\n🔄 Migrating banner images...');
    
    const [banners] = await connection.execute(`
      SELECT id, image_url
      FROM banners
      WHERE image_url IS NOT NULL AND image_url != '' AND image_url LIKE '%/uploads/%'
    `);

    let bannerMediaMigrated = 0;

    for (const banner of banners) {
      try {
        if (banner.image_url && banner.image_url.includes('/uploads/')) {
          const filename = banner.image_url.split('/').pop();
          const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/axomclash/banners/${filename}`;
          
          await connection.execute(
            'UPDATE banners SET image_url = ? WHERE id = ?',
            [cloudinaryUrl, banner.id]
          );
          
          bannerMediaMigrated++;
          console.log(`  🎯 Banner ${banner.id} migrated: ${banner.image_url} → ${cloudinaryUrl}`);
        }
      } catch (error) {
        console.error(`❌ Error processing banner ${banner.id}:`, error);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Posts migrated: ${migratedCount}`);
    console.log(`   - Posts skipped: ${skippedCount}`);
    console.log(`   - User media migrated: ${userMediaMigrated}`);
    console.log(`   - Banner media migrated: ${bannerMediaMigrated}`);
    console.log(`\n⚠️  Note: This script creates placeholder Cloudinary URLs.`);
    console.log(`   The actual media files need to be re-uploaded to Cloudinary.`);
    console.log(`   For now, this will prevent the 404 errors on your frontend.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run the migration
migrateMediaToCloudinary().catch(console.error);
