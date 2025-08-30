const mysql = require('mysql2/promise');
require('dotenv').config();

const setupChatTables = async () => {
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

    console.log('🔌 Connected to database successfully');

    // Create chat_reactions table if it doesn't exist
    const createChatReactionsTable = `
      CREATE TABLE IF NOT EXISTS chat_reactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT NOT NULL,
        user_id INT NOT NULL,
        reaction_type VARCHAR(50) NOT NULL DEFAULT 'like',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_message_id (message_id),
        INDEX idx_user_id (user_id),
        INDEX idx_reaction_type (reaction_type),
        UNIQUE KEY unique_user_message_reaction (user_id, message_id, reaction_type),
        FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createChatReactionsTable);
    console.log('✅ chat_reactions table created/verified successfully');

    // Create chat_typing_indicators table if it doesn't exist
    const createChatTypingIndicatorsTable = `
      CREATE TABLE IF NOT EXISTS chat_typing_indicators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        college_id INT NOT NULL,
        is_typing BOOLEAN DEFAULT FALSE,
        last_typing_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_college (user_id, college_id),
        INDEX idx_college_id (college_id),
        INDEX idx_last_typing (last_typing_at),
        UNIQUE KEY unique_user_college (user_id, college_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createChatTypingIndicatorsTable);
    console.log('✅ chat_typing_indicators table created/verified successfully');

    // Check if chat_messages table exists and has required columns
    const checkChatMessagesTable = `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'chat_messages'
      ORDER BY ORDINAL_POSITION
    `;

    const [columns] = await connection.execute(checkChatMessagesTable, [
      process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash'
    ]);

    console.log('📋 chat_messages table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
    });

    // Add missing columns if they don't exist
    const requiredColumns = [
      { name: 'is_pinned', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'is_deleted', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    ];

    for (const col of requiredColumns) {
      const columnExists = columns.some(c => c.COLUMN_NAME === col.name);
      if (!columnExists) {
        try {
          await connection.execute(`ALTER TABLE chat_messages ADD COLUMN ${col.name} ${col.type}`);
          console.log(`✅ Added missing column: ${col.name}`);
        } catch (error) {
          console.log(`⚠️ Column ${col.name} might already exist:`, error.message);
        }
      }
    }

    console.log('\n🎉 Chat tables setup completed successfully!');
    console.log('Your chat functionality should now work without 500 errors.');

  } catch (error) {
    console.error('❌ Error setting up chat tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run the setup
if (require.main === module) {
  setupChatTables()
    .then(() => {
      console.log('✅ Chat tables setup completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Chat tables setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupChatTables;
