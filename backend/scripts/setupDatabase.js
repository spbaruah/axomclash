const mysql = require('mysql2/promise');
require('dotenv').config();

const setupDatabase = async () => {
  let connection;
  
  try {
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection({
      host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
      user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
      port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306
    });

    console.log('🔌 Connected to MySQL server');

    // Drop database if it exists and recreate
    await connection.execute(`DROP DATABASE IF EXISTS ${process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash'}`);
    console.log(`🗑️ Dropped existing database '${process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash'}'`);
    
    // Create database
    await connection.execute(`CREATE DATABASE ${process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash'}`);
    console.log(`✅ Database '${process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash'}' created`);

    // Use the database
    await connection.query(`USE ${process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash'}`);

    // Create tables
    const tables = [
      // Colleges table
      `CREATE TABLE IF NOT EXISTS colleges (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        country VARCHAR(100) DEFAULT 'India',
        logo_url VARCHAR(500),
        description TEXT,
        total_points INT DEFAULT 0,
        ranking INT DEFAULT 0,
        member_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_city (city),
        INDEX idx_points (total_points),
        INDEX idx_ranking (ranking)
      )`,

      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        profile_picture VARCHAR(500),
        cover_photo VARCHAR(500),
        college_id INT NOT NULL,
        student_status ENUM('Currently Studying', 'Alumni') NOT NULL,
        bio TEXT,
        total_points INT DEFAULT 0,
        reputation_score INT DEFAULT 0,
        daily_streak INT DEFAULT 0,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_online BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        INDEX idx_college (college_id),
        INDEX idx_points (total_points),
        INDEX idx_username (username),
        INDEX idx_student_status (student_status)
      )`,

      // User blocks table
      `CREATE TABLE IF NOT EXISTS user_blocks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        blocker_id INT NOT NULL,
        blocked_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_block (blocker_id, blocked_id),
        INDEX idx_blocker (blocker_id),
        INDEX idx_blocked (blocked_id)
      )`,

      // Admins table
      `CREATE TABLE IF NOT EXISTS admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        username VARCHAR(100) NOT NULL,
        role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
        permissions JSON,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      )`,

      // Posts table
      `CREATE TABLE IF NOT EXISTS posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        college_id INT NOT NULL,
        type ENUM('photo', 'video', 'text', 'poll', 'story', 'live') NOT NULL,
        content TEXT,
        media_urls JSON,
        poll_options JSON,
        poll_votes JSON,
        visibility ENUM('public', 'college_only', 'private') DEFAULT 'public',
        likes_count INT DEFAULT 0,
        love_count INT DEFAULT 0,
        laugh_count INT DEFAULT 0,
        fire_count INT DEFAULT 0,
        clap_count INT DEFAULT 0,
        wow_count INT DEFAULT 0,
        sad_count INT DEFAULT 0,
        angry_count INT DEFAULT 0,
        comments_count INT DEFAULT 0,
        shares_count INT DEFAULT 0,
        points_earned INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_college (college_id),
        INDEX idx_type (type),
        INDEX idx_visibility (visibility),
        INDEX idx_created (created_at)
      )`,

      // Banners table
      `CREATE TABLE IF NOT EXISTS banners (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255),
        description TEXT,
        image_url VARCHAR(500) NOT NULL,
        cta_text VARCHAR(100),
        cta_link VARCHAR(500),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_active (is_active),
        INDEX idx_order (display_order),
        INDEX idx_created (created_at)
      )`,

      // Reactions table
      `CREATE TABLE IF NOT EXISTS reactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        reaction_type ENUM('love', 'laugh', 'fire', 'clap', 'wow', 'sad', 'angry') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_reaction (post_id, user_id),
        INDEX idx_post (post_id),
        INDEX idx_user (user_id)
      )`,

      // Saved posts table
      `CREATE TABLE IF NOT EXISTS saved_posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        UNIQUE KEY unique_saved_post (user_id, post_id),
        INDEX idx_user (user_id),
        INDEX idx_post (post_id),
        INDEX idx_created (created_at)
      )`,

      // Comments table
      `CREATE TABLE IF NOT EXISTS comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        parent_id INT NULL,
        content TEXT NOT NULL,
        likes_count INT DEFAULT 0,
        points_earned INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
        INDEX idx_post (post_id),
        INDEX idx_user (user_id),
        INDEX idx_parent (parent_id)
      )`,

      // Comment likes table
      `CREATE TABLE IF NOT EXISTS comment_likes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        comment_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_comment_like (comment_id, user_id),
        INDEX idx_comment (comment_id),
        INDEX idx_user (user_id)
      )`,

      // Games table
      `CREATE TABLE IF NOT EXISTS games (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        type ENUM('ludo', 'bgmi', 'freefire', 'valorant', 'quiz', 'coding', 'creative') NOT NULL,
        status ENUM('waiting', 'active', 'completed', 'cancelled') DEFAULT 'waiting',
        college1_id INT NOT NULL,
        college2_id INT NOT NULL,
        winner_college_id INT NULL,
        max_players INT DEFAULT 2,
        current_players INT DEFAULT 0,
        game_data JSON,
        points_at_stake INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP NULL,
        ended_at TIMESTAMP NULL,
        FOREIGN KEY (college1_id) REFERENCES colleges(id) ON DELETE CASCADE,
        FOREIGN KEY (college2_id) REFERENCES colleges(id) ON DELETE CASCADE,
        FOREIGN KEY (winner_college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        INDEX idx_college1 (college1_id),
        INDEX idx_college2 (college2_id),
        INDEX idx_status (status)
      )`,

      // Game Participants table
      `CREATE TABLE IF NOT EXISTS game_participants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        game_id INT NOT NULL,
        user_id INT NOT NULL,
        college_id INT NOT NULL,
        team_number INT NOT NULL,
        player_data JSON,
        points_earned INT DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        UNIQUE KEY unique_participant (game_id, user_id),
        INDEX idx_game (game_id),
        INDEX idx_user (user_id),
        INDEX idx_college (college_id)
      )`,

      // Challenges table
      `CREATE TABLE IF NOT EXISTS challenges (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type ENUM('daily', 'weekly', 'monthly', 'special') NOT NULL,
        points_reward INT NOT NULL,
        college_points_reward INT NOT NULL,
        start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        max_participants INT DEFAULT 0,
        current_participants INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_active (is_active),
        INDEX idx_dates (start_date, end_date)
      )`,

      // Challenge Participants table
      `CREATE TABLE IF NOT EXISTS challenge_participants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        challenge_id INT NOT NULL,
        user_id INT NOT NULL,
        college_id INT NOT NULL,
        status ENUM('participating', 'completed', 'failed') DEFAULT 'participating',
        progress JSON,
        points_earned INT DEFAULT 0,
        college_points_earned INT DEFAULT 0,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        UNIQUE KEY unique_participant (challenge_id, user_id),
        INDEX idx_challenge (challenge_id),
        INDEX idx_user (user_id),
        INDEX idx_status (status)
      )`,

      // Chat Messages table
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        college_id INT NOT NULL,
        user_id INT NOT NULL,
        message_type ENUM('text', 'photo', 'gif', 'poll') DEFAULT 'text',
        content TEXT NOT NULL,
        media_url VARCHAR(500) NULL,
        poll_data JSON NULL,
        is_pinned BOOLEAN DEFAULT FALSE,
        reply_to_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id) ON DELETE SET NULL,
        INDEX idx_college (college_id),
        INDEX idx_user (user_id),
        INDEX idx_created (created_at),
        INDEX idx_reply (reply_to_id)
      )`,

      // Chat Reactions table
      `CREATE TABLE IF NOT EXISTS chat_reactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        message_id INT NOT NULL,
        user_id INT NOT NULL,
        reaction_type ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_message_user_reaction (message_id, user_id),
        INDEX idx_message (message_id),
        INDEX idx_user (user_id),
        INDEX idx_reaction (reaction_type)
      )`,

      // Chat Typing Indicators table
      `CREATE TABLE IF NOT EXISTS chat_typing_indicators (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        college_id INT NOT NULL,
        is_typing BOOLEAN DEFAULT FALSE,
        last_typing_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_college_typing (user_id, college_id),
        INDEX idx_user (user_id),
        INDEX idx_college (college_id),
        INDEX idx_typing (is_typing)
      )`,

      // Points History table
      `CREATE TABLE IF NOT EXISTS points_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        college_id INT NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        points_earned INT NOT NULL,
        college_points_earned INT NOT NULL,
        description TEXT,
        reference_id INT NULL,
        reference_type VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_college (college_id),
        INDEX idx_action (action_type),
        INDEX idx_created (created_at)
      )`,

      // Games table
      `CREATE TABLE IF NOT EXISTS games (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        type ENUM('ludo', 'tictactoe', 'quiz', 'chess', 'puzzle') NOT NULL,
        college1_id INT NOT NULL,
        college2_id INT NOT NULL,
        max_players INT DEFAULT 4,
        current_players INT DEFAULT 0,
        points_at_stake INT DEFAULT 100,
        status ENUM('waiting', 'active', 'completed', 'cancelled') DEFAULT 'waiting',
        game_data JSON,
        winner_college_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college1_id) REFERENCES colleges(id) ON DELETE CASCADE,
        FOREIGN KEY (college2_id) REFERENCES colleges(id) ON DELETE CASCADE,
        FOREIGN KEY (winner_college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        INDEX idx_type (type),
        INDEX idx_status (status),
        INDEX idx_colleges (college1_id, college2_id)
      )`,

      // Game Participants table
      `CREATE TABLE IF NOT EXISTS game_participants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        game_id INT NOT NULL,
        user_id INT NOT NULL,
        college_id INT NOT NULL,
        team_number INT NOT NULL,
        player_data JSON,
        score INT DEFAULT 0,
        status ENUM('playing', 'finished', 'disconnected') DEFAULT 'playing',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        UNIQUE KEY unique_participant (game_id, user_id),
        INDEX idx_game (game_id),
        INDEX idx_user (user_id),
        INDEX idx_college (college_id)
      )`,

      // Quiz Questions table
      `CREATE TABLE IF NOT EXISTS quiz_questions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category VARCHAR(100) NOT NULL,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        question TEXT NOT NULL,
        options JSON NOT NULL,
        correct_answer INT NOT NULL,
        explanation TEXT,
        points INT DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_difficulty (difficulty)
      )`,

      // Quiz Attempts table
      `CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        college_id INT NOT NULL,
        question_id INT NOT NULL,
        selected_answer INT NOT NULL,
        is_correct BOOLEAN NOT NULL,
        points_earned INT DEFAULT 0,
        time_spent INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_college (college_id),
        INDEX idx_question (question_id),
        INDEX idx_created (created_at)
      )`,

      // User Sessions table
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        session_token VARCHAR(500) NOT NULL,
        device_info JSON,
        ip_address VARCHAR(45),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_token (session_token),
        INDEX idx_active (is_active)
      )`,

      // Ludo Rooms table
      `CREATE TABLE IF NOT EXISTS ludo_rooms (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        creator_id INT NOT NULL,
        status ENUM('waiting', 'playing', 'completed', 'cancelled') DEFAULT 'waiting',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP NULL,
        ended_at TIMESTAMP NULL,
        winner_id INT NULL,
        game_data JSON,
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_status (status),
        INDEX idx_creator (creator_id),
        INDEX idx_created (created_at)
      )`,

      // Room Players table
      `CREATE TABLE IF NOT EXISTS room_players (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_ready BOOLEAN DEFAULT FALSE,
        player_data JSON,
        FOREIGN KEY (room_id) REFERENCES ludo_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_room_player (room_id, user_id),
        INDEX idx_room (room_id),
        INDEX idx_user (user_id)
      )`
    ];

    console.log('🏗️ Creating tables...');
    
    for (let i = 0; i < tables.length; i++) {
      try {
        await connection.execute(tables[i]);
        console.log(`✅ Table ${i + 1} created successfully`);
      } catch (error) {
        console.error(`❌ Error creating table ${i + 1}:`, error.message);
      }
    }

    // Insert sample colleges
    const sampleColleges = [
      ['Cotton University', 'Guwahati', 'Assam', 'India', 'https://example.com/cotton-logo.png', 'Premier university in Assam', 0, 0, 0],
      ['Gauhati University', 'Guwahati', 'Assam', 'India', 'https://example.com/gu-logo.png', 'Leading university in Northeast India', 0, 0, 0],
      ['Tezpur University', 'Tezpur', 'Assam', 'India', 'https://example.com/tu-logo.png', 'Central University in Assam', 0, 0, 0],
      ['IIT Guwahati', 'Guwahati', 'Assam', 'India', 'https://example.com/iitg-logo.png', 'Premier engineering institute', 0, 0, 0],
      ['NIT Silchar', 'Silchar', 'Assam', 'India', 'https://example.com/nits-logo.png', 'National Institute of Technology', 0, 0, 0]
    ];

    console.log('🏫 Inserting sample colleges...');
    
    for (const college of sampleColleges) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO colleges (name, city, state, country, logo_url, description, total_points, ranking, member_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          college
        );
      } catch (error) {
        console.log(`College ${college[0]} already exists or error:`, error.message);
      }
    }

    // Insert sample challenges
    const sampleChallenges = [
      ['Daily Login', 'Login to the app today and earn points!', 'daily', 10, 10, '2024-01-01 00:00:00', '2024-12-31 23:59:59', 0, 0],
      ['First Post', 'Create your first post and earn bonus points!', 'special', 50, 50, '2024-01-01 00:00:00', '2024-12-31 23:59:59', 0, 0],
      ['Weekly Quiz', 'Participate in this week\'s quiz challenge', 'weekly', 100, 100, '2024-01-01 00:00:00', '2024-12-31 23:59:59', 0, 0]
    ];

    console.log('🎯 Inserting sample challenges...');
    
    for (const challenge of sampleChallenges) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO challenges (title, description, type, points_reward, college_points_reward, start_date, end_date, max_participants, current_participants) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          challenge
        );
      } catch (error) {
        console.log(`Challenge ${challenge[0]} already exists or error:`, error.message);
      }
    }

    // Insert sample quiz questions
    const sampleQuizQuestions = [
      ['General Knowledge', 'easy', 'What is the capital of Assam?', JSON.stringify(['Guwahati', 'Dispur', 'Jorhat', 'Tezpur']), 1, 'Dispur is the capital of Assam', 10],
      ['General Knowledge', 'easy', 'Which river flows through Guwahati?', JSON.stringify(['Ganga', 'Brahmaputra', 'Yamuna', 'Godavari']), 1, 'Brahmaputra flows through Guwahati', 10],
      ['Technology', 'medium', 'What does HTML stand for?', JSON.stringify(['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink and Text Markup Language']), 0, 'HTML stands for Hyper Text Markup Language', 15],
      ['Technology', 'medium', 'Which programming language is known as the "language of the web"?', JSON.stringify(['Java', 'Python', 'JavaScript', 'C++']), 2, 'JavaScript is the language of the web', 15],
      ['Sports', 'easy', 'Which sport is known as the "gentleman\'s game"?', JSON.stringify(['Football', 'Cricket', 'Tennis', 'Golf']), 1, 'Cricket is known as the gentleman\'s game', 10],
      ['Entertainment', 'medium', 'Who directed the movie "Baahubali"?', JSON.stringify(['Rajamouli', 'Shankar', 'Mani Ratnam', 'Gautham Menon']), 0, 'Rajamouli directed Baahubali', 15],
      ['Science', 'medium', 'What is the chemical symbol for gold?', JSON.stringify(['Ag', 'Au', 'Fe', 'Cu']), 1, 'Au is the chemical symbol for gold', 15],
      ['History', 'easy', 'In which year did India gain independence?', JSON.stringify(['1945', '1947', '1950', '1942']), 1, 'India gained independence in 1947', 10]
    ];

    console.log('🧠 Inserting sample quiz questions...');
    
    for (const question of sampleQuizQuestions) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO quiz_questions (category, difficulty, question, options, correct_answer, explanation, points) VALUES (?, ?, ?, ?, ?, ?, ?)',
          question
        );
      } catch (error) {
        console.log(`Quiz question already exists or error:`, error.message);
      }
    }

    // Insert admin user
    console.log('👑 Inserting admin user...');
    
    try {
      const bcrypt = require('bcryptjs');
      const adminPassword = '654321';
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
      
      await connection.execute(
        'INSERT IGNORE INTO admins (email, password_hash, username, role, permissions) VALUES (?, ?, ?, ?, ?)',
        [
          'spbaruah000@gmail.com',
          hashedAdminPassword,
          'Admin',
          'super_admin',
          JSON.stringify(['all'])
        ]
      );
      console.log('✅ Admin user created successfully');
      console.log('📧 Admin Email: spbaruah000@gmail.com');
      console.log('🔑 Admin Password: 654321');
    } catch (error) {
      console.log('Admin user already exists or error:', error.message);
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('📊 Sample data inserted');
    console.log('🚀 Ready to run the application');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
