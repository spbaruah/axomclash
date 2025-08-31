const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupRPSDatabase() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'campusclash'
    });

    console.log('🔌 Connected to database successfully');

    // Create RPS games table
    const createRPSGamesTable = `
      CREATE TABLE IF NOT EXISTS rps_games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id VARCHAR(255) NOT NULL,
        players JSON NOT NULL,
        scores JSON NOT NULL,
        history JSON NOT NULL,
        points_at_stake INT DEFAULT 75,
        status ENUM('waiting', 'playing', 'finished') DEFAULT 'waiting',
        winner_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_room_id (room_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createRPSGamesTable);
    console.log('✅ RPS games table created successfully');

    // Create RPS game participants table for detailed tracking
    const createRPSParticipantsTable = `
      CREATE TABLE IF NOT EXISTS rps_game_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        user_id INT NOT NULL,
        college_id INT NOT NULL,
        username VARCHAR(255) NOT NULL,
        final_score INT DEFAULT 0,
        points_earned INT DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES rps_games(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        INDEX idx_game_id (game_id),
        INDEX idx_user_id (user_id),
        INDEX idx_college_id (college_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createRPSParticipantsTable);
    console.log('✅ RPS game participants table created successfully');

    // Create RPS game rounds table for detailed round tracking
    const createRPSRoundsTable = `
      CREATE TABLE IF NOT EXISTS rps_game_rounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        round_number INT NOT NULL,
        player_choices JSON NOT NULL,
        result ENUM('win', 'lose', 'tie') NOT NULL,
        winner_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES rps_games(id) ON DELETE CASCADE,
        INDEX idx_game_id (game_id),
        INDEX idx_round_number (round_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createRPSRoundsTable);
    console.log('✅ RPS game rounds table created successfully');

    // Create RPS leaderboard table for college rankings
    const createRPSLeaderboardTable = `
      CREATE TABLE IF NOT EXISTS rps_leaderboard (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT NOT NULL,
        total_games INT DEFAULT 0,
        games_won INT DEFAULT 0,
        games_lost INT DEFAULT 0,
        total_points_earned INT DEFAULT 0,
        win_rate DECIMAL(5,2) DEFAULT 0.00,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        UNIQUE KEY unique_college (college_id),
        INDEX idx_win_rate (win_rate),
        INDEX idx_total_points (total_points_earned)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createRPSLeaderboardTable);
    console.log('✅ RPS leaderboard table created successfully');

    // Create RPS user statistics table
    const createRPSUserStatsTable = `
      CREATE TABLE IF NOT EXISTS rps_user_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_games INT DEFAULT 0,
        games_won INT DEFAULT 0,
        games_lost INT DEFAULT 0,
        total_points_earned INT DEFAULT 0,
        favorite_choice ENUM('rock', 'paper', 'scissors') DEFAULT NULL,
        win_rate DECIMAL(5,2) DEFAULT 0.00,
        longest_win_streak INT DEFAULT 0,
        current_win_streak INT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user (user_id),
        INDEX idx_win_rate (win_rate),
        INDEX idx_total_points (total_points_earned)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createRPSUserStatsTable);
    console.log('✅ RPS user statistics table created successfully');

    // Insert sample data for testing (optional)
    console.log('📊 Database setup completed successfully!');
    console.log('🎯 Rock Paper Scissors game tables are ready to use');

  } catch (error) {
    console.error('❌ Error setting up RPS database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupRPSDatabase()
    .then(() => {
      console.log('🎉 RPS database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 RPS database setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupRPSDatabase;
