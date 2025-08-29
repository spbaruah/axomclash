const mysql = require('mysql2/promise');
require('dotenv').config();

const checkPostsVisibility = async () => {
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

    // Check all posts and their visibility
    const [posts] = await connection.execute(`
      SELECT p.id, p.user_id, p.college_id, p.type, p.content, p.visibility, p.created_at,
             u.username, c.name as college_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN colleges c ON p.college_id = c.id
      ORDER BY p.created_at DESC
    `);

    console.log('\n=== ALL POSTS ===');
    posts.forEach(post => {
      console.log(`ID: ${post.id} | User: ${post.username} | College: ${post.college_name} | Type: ${post.type} | Visibility: ${post.visibility} | Created: ${post.created_at}`);
    });

    // Check visibility distribution
    const [visibilityCounts] = await connection.execute(`
      SELECT visibility, COUNT(*) as count
      FROM posts
      GROUP BY visibility
    `);

    console.log('\n=== VISIBILITY COUNTS ===');
    visibilityCounts.forEach(count => {
      console.log(`${count.visibility}: ${count.count} posts`);
    });

    // Check if there are any posts with NULL visibility
    const [nullVisibility] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM posts
      WHERE visibility IS NULL
    `);

    console.log(`\nPosts with NULL visibility: ${nullVisibility[0].count}`);

  } catch (error) {
    console.error('Error checking posts visibility:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
};

checkPostsVisibility();
