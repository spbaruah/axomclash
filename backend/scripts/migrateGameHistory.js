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

    // Create tic_tac_toe_games table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tic_tac_toe_games (
        id INT PRIMARY KEY AUTO_INCREMENT,
        player1_id INT NOT NULL,
        player2_id INT NOT NULL,
        winner_id INT NULL,
        game_data JSON,
        status ENUM('playing', 'finished', 'draw') DEFAULT 'playing',
        points_at_stake INT DEFAULT 50,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP NULL,
        FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_player1 (player1_id),
        INDEX idx_player2 (player2_id),
        INDEX idx_winner (winner_id),
        INDEX idx_status (status)
      )
    `);
    console.log('✅ Tic Tac Toe games table created/verified');

    // Create rps_games table (if it doesn't exist)
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
    console.log('📊 Tables created for: Tic Tac Toe and Rock Paper Scissors games');
    
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
