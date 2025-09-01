const db = require('../config/database');

async function setupLudoRaceDatabase() {
  try {
    console.log('Setting up Ludo Race database tables...');

    // Create ludo_race_rooms table
    await db.execute(`
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
    console.log('✅ ludo_race_rooms table created/verified');

    // Create room_players table (if it doesn't exist)
    await db.execute(`
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
    console.log('✅ room_players table created/verified');

    // Create ludo_race_games table for game history
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ludo_race_games (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_id INT NOT NULL,
        player_id INT NOT NULL,
        action VARCHAR(50) NOT NULL,
        action_data JSON NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES ludo_race_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ ludo_race_games table created/verified');

    // Create ludo_race_pieces table for tracking piece positions
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ludo_race_pieces (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_id INT NOT NULL,
        player_id INT NOT NULL,
        piece_number INT NOT NULL,
        position ENUM('home', 'path', 'finish', 'finished') DEFAULT 'home',
        path_position INT DEFAULT -1,
        finish_position INT DEFAULT -1,
        is_home BOOLEAN DEFAULT TRUE,
        is_finished BOOLEAN DEFAULT FALSE,
        moves INT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES ludo_race_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_room_player_piece (room_id, player_id, piece_number)
      )
    `);
    console.log('✅ ludo_race_pieces table created/verified');

    console.log('🎉 Ludo Race database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up Ludo Race database:', error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupLudoRaceDatabase()
    .then(() => {
      console.log('Setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupLudoRaceDatabase;
