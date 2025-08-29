const db = require('../config/database');

const addBlockingTable = async () => {
  let connection;
  try {
    connection = await db.promise();
    
    console.log('Adding user_blocks table...');
    
    // Check if user_blocks table already exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'user_blocks'"
    );
    
    if (tables.length === 0) {
      // Create user_blocks table
      await connection.execute(`
        CREATE TABLE user_blocks (
          id INT PRIMARY KEY AUTO_INCREMENT,
          blocker_id INT NOT NULL,
          blocked_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_block (blocker_id, blocked_id),
          INDEX idx_blocker (blocker_id),
          INDEX idx_blocked (blocked_id),
          INDEX idx_created (created_at)
        )
      `);
      console.log('✅ user_blocks table created successfully');
    } else {
      console.log('ℹ️ user_blocks table already exists');
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run migration if called directly
if (require.main === module) {
  addBlockingTable()
    .then(() => {
      console.log('✅ Blocking table migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addBlockingTable;
