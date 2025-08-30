const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadMediaToCloudinary = async () => {
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

    // Check if uploads directory exists
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch (error) {
      console.log('❌ Uploads directory not found. This script needs to run locally where the media files exist.');
      console.log('📁 Expected path:', uploadsDir);
      return;
    }

    console.log('📁 Found uploads directory:', uploadsDir);

    // Get all subdirectories
    const subdirs = ['posts', 'profiles', 'covers', 'banners', 'chat'];
    let totalUploaded = 0;
    let totalSkipped = 0;

    for (const subdir of subdirs) {
      const subdirPath = path.join(uploadsDir, subdir);
      
      try {
        await fs.access(subdirPath);
        console.log(`\n🔄 Processing ${subdir} directory...`);
        
        const files = await fs.readdir(subdirPath);
        console.log(`📁 Found ${files.length} files in ${subdir}`);
        
        for (const file of files) {
          if (file.match(/\.(jpg|jpeg|png|gif|bmp|webp|mp4|mov|avi|mkv)$/i)) {
            const filePath = path.join(subdirPath, file);
            const cloudinaryFolder = `axomclash/${subdir}`;
            
            try {
              console.log(`  📤 Uploading ${file} to ${cloudinaryFolder}...`);
              
              // Upload to Cloudinary
              const result = await cloudinary.uploader.upload(filePath, {
                folder: cloudinaryFolder,
                public_id: path.parse(file).name, // Use filename without extension as public_id
                overwrite: true
              });
              
              console.log(`    ✅ Uploaded: ${result.secure_url}`);
              
              // Update database with the actual Cloudinary URL
              if (subdir === 'posts') {
                // Find posts that reference this file
                const [posts] = await connection.execute(
                  'SELECT id, media_urls FROM posts WHERE media_urls LIKE ?',
                  [`%${file}%`]
                );
                
                for (const post of posts) {
                  let mediaUrls = [];
                  if (post.media_urls) {
                    try {
                      mediaUrls = JSON.parse(post.media_urls);
                    } catch (e) {
                      mediaUrls = [post.media_urls];
                    }
                  }
                  
                  // Replace placeholder URL with actual Cloudinary URL
                  const updatedMediaUrls = mediaUrls.map(url => {
                    if (url.includes(file)) {
                      return result.secure_url;
                    }
                    return url;
                  });
                  
                  await connection.execute(
                    'UPDATE posts SET media_urls = ? WHERE id = ?',
                    [JSON.stringify(updatedMediaUrls), post.id]
                  );
                  
                  console.log(`    🔄 Updated post ${post.id} with actual Cloudinary URL`);
                }
              } else if (subdir === 'profiles') {
                // Update user profile pictures
                const [users] = await connection.execute(
                  'SELECT id FROM users WHERE profile_picture LIKE ?',
                  [`%${file}%`]
                );
                
                for (const user of users) {
                  await connection.execute(
                    'UPDATE users SET profile_picture = ? WHERE id = ?',
                    [result.secure_url, user.id]
                  );
                  
                  console.log(`    🔄 Updated user ${user.id} profile picture`);
                }
              } else if (subdir === 'covers') {
                // Update user cover photos
                const [users] = await connection.execute(
                  'SELECT id FROM users WHERE cover_photo LIKE ?',
                  [`%${file}%`]
                );
                
                for (const user of users) {
                  await connection.execute(
                    'UPDATE users SET cover_photo = ? WHERE id = ?',
                    [result.secure_url, user.id]
                  );
                  
                  console.log(`    🔄 Updated user ${user.id} cover photo`);
                }
              } else if (subdir === 'banners') {
                // Update banner images
                const [banners] = await connection.execute(
                  'SELECT id FROM banners WHERE image_url LIKE ?',
                  [`%${file}%`]
                );
                
                for (const banner of banners) {
                  await connection.execute(
                    'UPDATE banners SET image_url = ? WHERE id = ?',
                    [result.secure_url, banner.id]
                  );
                  
                  console.log(`    🔄 Updated banner ${banner.id}`);
                }
              }
              
              totalUploaded++;
              
            } catch (uploadError) {
              console.error(`    ❌ Failed to upload ${file}:`, uploadError.message);
              totalSkipped++;
            }
          } else {
            console.log(`    ⏭️ Skipping non-media file: ${file}`);
            totalSkipped++;
          }
        }
        
      } catch (error) {
        console.log(`⚠️  Directory ${subdir} not found or empty`);
      }
    }

    console.log('\n🎉 Bulk upload completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Files uploaded: ${totalUploaded}`);
    console.log(`   - Files skipped: ${totalSkipped}`);
    console.log(`\n✅ Your media files are now stored in Cloudinary!`);
    console.log(`🌐 Frontend should now display images correctly.`);

  } catch (error) {
    console.error('❌ Upload failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run the upload
uploadMediaToCloudinary().catch(console.error);
