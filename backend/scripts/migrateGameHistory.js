const mysql = require('mysql2/promise');
require('dotenv').config();

const migrateGameHistory = async () => {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
      user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash',
      port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306
    });

    console.log('🔌 Connected to database successfully');

    // Create games table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS games (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_college1 (college1_id),
        INDEX idx_college2 (college2_id),
        INDEX idx_status (status)
      )
    `);
    console.log('✅ Games table created/verified');

    // Create game_participants table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS game_participants (
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
      )
    `);
    console.log('✅ Game participants table created/verified');

    // Create ludo_race_rooms table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ludo_race_rooms (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        creator_id INT NOT NULL,
        max_players INT DEFAULT 4,
        points_at_stake INT DEFAULT 150,
        status ENUM('waiting', 'playing', 'finished') DEFAULT 'waiting',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP NULL,
        ended_at TIMESTAMP NULL,
        winner_id INT NULL,
        game_data JSON NULL,
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Ludo race rooms table created/verified');

    // Create room_players table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS room_players (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_ready BOOLEAN DEFAULT FALSE,
        player_order INT DEFAULT 0,
        FOREIGN KEY (room_id) REFERENCES ludo_race_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_room_user (room_id, user_id)
      )
    `);
    console.log('✅ Room players table created/verified');

    // Create rps_games table if it doesn't exist
    await connection.execute(`
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
      )
    `);
    console.log('✅ RPS games table created/verified');

    console.log('🎉 Game History database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateGameHistory()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateGameHistory;
