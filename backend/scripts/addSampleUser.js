const mysql = require('mysql2/promise');
require('dotenv').config();

const addSampleUser = async () => {
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

    // Check if college with id = 1 exists
    const [colleges] = await connection.execute('SELECT * FROM colleges WHERE id = 1');
    if (colleges.length === 0) {
      console.log('❌ College with id = 1 does not exist. Please run setupDatabase.js first.');
      return;
    }

    // Check if user already exists
    const [existingUsers] = await connection.execute('SELECT * FROM users WHERE email = ?', ['test@example.com']);
    if (existingUsers.length > 0) {
      console.log('ℹ️ Sample user already exists');
      return;
    }

    // Create sample user
    const bcrypt = require('bcryptjs');
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    await connection.execute(
      `INSERT INTO users (
        username, 
        full_name, 
        email, 
        password_hash, 
        college_id, 
        student_status, 
        profile_picture, 
        is_online, 
        total_points, 
        reputation_score, 
        daily_streak,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        'testuser',
        'Test User',
        'test@example.com',
        hashedPassword,
        1, // college_id = 1
        'student',
        null,
        false,
        0,
        0,
        0
      ]
    );

    console.log('✅ Sample user created successfully');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: 123456');
    console.log('🏫 College ID: 1');

  } catch (error) {
    console.error('❌ Error creating sample user:', error);
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
  addSampleUser()
    .then(() => {
      console.log('Sample user creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Sample user creation failed:', error);
      process.exit(1);
    });
}

module.exports = addSampleUser;
