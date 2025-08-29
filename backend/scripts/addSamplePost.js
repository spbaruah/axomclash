const mysql = require('mysql2/promise');
require('dotenv').config();

const addSamplePost = async () => {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
      user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash',
      port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306
    });

    console.log('Connected to database successfully');

    // Check if user with id = 1 exists
    const [users] = await connection.execute('SELECT * FROM users WHERE id = 1');
    if (users.length === 0) {
      console.log('❌ User with id = 1 does not exist. Please run addSampleUser.js first.');
      return;
    }

    // Check if college with id = 1 exists
    const [colleges] = await connection.execute('SELECT * FROM colleges WHERE id = 1');
    if (colleges.length === 0) {
      console.log('❌ College with id = 1 does not exist. Please run setupDatabase.js first.');
      return;
    }

    // Check if post already exists
    const [existingPosts] = await connection.execute('SELECT * FROM posts WHERE user_id = 1 LIMIT 1');
    if (existingPosts.length > 0) {
      console.log('ℹ️ Sample post already exists');
      return;
    }

    // Create sample post
    await connection.execute(
      `INSERT INTO posts (
        user_id,
        college_id,
        type,
        content,
        visibility,
        media_urls,
        poll_options,
        poll_votes,
        is_active,
        points_earned,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        1, // user_id = 1
        1, // college_id = 1
        'text',
        'Hello everyone! This is my first post on AxomClash. Excited to be part of this community! 🎉',
        'college_only',
        JSON.stringify([]), // empty media array
        null, // no poll
        null, // no poll votes
        true, // active
        10 // points earned
      ]
    );

    console.log('✅ Sample post created successfully');
    console.log('📝 Content: Hello everyone! This is my first post on AxomClash...');
    console.log('👤 User ID: 1');
    console.log('🏫 College ID: 1');
    console.log('🔒 Visibility: college_only');

  } catch (error) {
    console.error('❌ Error creating sample post:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
};

// Run the setup if this file is executed directly
if (require.main === module) {
  addSamplePost()
    .then(() => {
      console.log('Sample post creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Sample post creation failed:', error);
      process.exit(1);
    });
}

module.exports = addSamplePost;
