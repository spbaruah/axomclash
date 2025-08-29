const mysql = require('mysql2/promise');
require('dotenv').config();

const cleanupBlobUrls = async () => {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
      user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash_db',
      port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306
    });

    console.log('Connected to database successfully');

    // Get all posts with media_urls
    const [posts] = await connection.execute(`
      SELECT id, media_urls, type
      FROM posts
      WHERE media_urls IS NOT NULL AND media_urls != 'null' AND media_urls != '[]'
    `);

    console.log(`Found ${posts.length} posts with media`);

    for (const post of posts) {
      try {
        let mediaUrls = [];
        
        if (post.media_urls) {
          mediaUrls = JSON.parse(post.media_urls);
        }

        // Check if any URLs are blob URLs
        const hasBlobUrls = mediaUrls.some(url => 
          typeof url === 'string' && url.startsWith('blob:')
        );

        if (hasBlobUrls) {
          console.log(`Post ${post.id} has blob URLs:`, mediaUrls);
          
          // Remove blob URLs entirely for now
          await connection.execute(
            'UPDATE posts SET media_urls = ? WHERE id = ?',
            [JSON.stringify([]), post.id]
          );
          
          console.log(`Removed blob URLs from post ${post.id}`);
        }
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
      }
    }

    console.log('Blob URL cleanup completed successfully!');

  } catch (error) {
    console.error('Error cleaning up blob URLs:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
};

cleanupBlobUrls();
