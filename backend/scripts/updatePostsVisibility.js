const mysql = require('mysql2/promise');
require('dotenv').config();

const updatePostsVisibility = async () => {
  let connection;

  try {
    // Create database connection
    connection = mysql.createConnection({
      host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
      user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash_db',
      port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306
    });

    console.log('Connected to database successfully');

    // Check if visibility column already exists
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM posts LIKE 'visibility'"
    );

    if (columns.length === 0) {
      console.log('Adding visibility column to posts table...');
      
      // Add visibility column
      await connection.execute(
        `ALTER TABLE posts 
         ADD COLUMN visibility ENUM('public', 'college_only', 'private') DEFAULT 'public' 
         AFTER poll_votes`
      );

      // Add index for visibility
      await connection.execute(
        `CREATE INDEX idx_visibility ON posts(visibility)`
      );

      console.log('Visibility column added successfully');
    } else {
      console.log('Visibility column already exists');
    }

    // Update all existing posts to have 'public' visibility
    const [result] = await connection.execute(
      `UPDATE posts SET visibility = 'public' WHERE visibility IS NULL`
    );

    console.log(`Updated ${result.affectedRows} posts to have public visibility`);

    console.log('Posts visibility update completed successfully!');

  } catch (error) {
    console.error('Error updating posts visibility:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
};

// Run the migration
updatePostsVisibility();
