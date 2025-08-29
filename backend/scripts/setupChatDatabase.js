const mysql = require('mysql2/promise');
require('dotenv').config();

const setupChatDatabase = async () => {
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

    // Create chat_messages table if it doesn't exist
    const createChatMessagesTable = `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT NOT NULL,
        user_id INT NOT NULL,
        message_type ENUM('text', 'photo', 'voice', 'document', 'poll') DEFAULT 'text',
        content TEXT,
        media_url VARCHAR(500),
        poll_data JSON,
        reply_to_id INT NULL,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_college_id (college_id),
        INDEX idx_user_id (user_id),
        INDEX idx_message_type (message_type),
        INDEX idx_created_at (created_at),
        INDEX idx_reply_to (reply_to_id),
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createChatMessagesTable);
    console.log('✅ chat_messages table created/verified successfully');

    // Create chat_rooms table for future group chat functionality
    const createChatRoomsTable = `
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        college_id INT NOT NULL,
        room_type ENUM('college', 'group', 'private') DEFAULT 'college',
        created_by INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_college_id (college_id),
        INDEX idx_room_type (room_type),
        INDEX idx_created_by (created_by),
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createChatRoomsTable);
    console.log('✅ chat_rooms table created/verified successfully');

    // Create chat_room_members table for room membership
    const createChatRoomMembersTable = `
      CREATE TABLE IF NOT EXISTS chat_room_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('member', 'admin', 'moderator') DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE KEY unique_room_user (room_id, user_id),
        INDEX idx_room_id (room_id),
        INDEX idx_user_id (user_id),
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createChatRoomMembersTable);
    console.log('✅ chat_room_members table created/verified successfully');

    // Create chat_reactions table for message reactions
    const createChatReactionsTable = `
      CREATE TABLE IF NOT EXISTS chat_reactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT NOT NULL,
        user_id INT NOT NULL,
        reaction_type ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry') DEFAULT 'like',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_message_user_reaction (message_id, user_id, reaction_type),
        INDEX idx_message_id (message_id),
        INDEX idx_user_id (user_id),
        INDEX idx_reaction_type (reaction_type),
        FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createChatReactionsTable);
    console.log('✅ chat_reactions table created/verified successfully');

    // Create chat_typing_indicators table for real-time typing status
    const createChatTypingTable = `
      CREATE TABLE IF NOT EXISTS chat_typing_indicators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        college_id INT NOT NULL,
        room_id INT NULL,
        is_typing BOOLEAN DEFAULT FALSE,
        last_typing_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_college_id (college_id),
        INDEX idx_room_id (room_id),
        INDEX idx_is_typing (is_typing),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createChatTypingTable);
    console.log('✅ chat_typing_indicators table created/verified successfully');

    // Add missing columns to existing chat_messages table if they don't exist
    const addMissingColumns = async () => {
      const columns = [
        { name: 'message_type', type: "ENUM('text', 'photo', 'voice', 'document', 'poll') DEFAULT 'text'" },
        { name: 'media_url', type: 'VARCHAR(500)' },
        { name: 'poll_data', type: 'JSON' },
        { name: 'reply_to_id', type: 'INT NULL' },
        { name: 'is_pinned', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'is_deleted', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'updated_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
      ];

      for (const column of columns) {
        try {
          await connection.execute(`ALTER TABLE chat_messages ADD COLUMN ${column.name} ${column.type}`);
          console.log(`✅ Added column: ${column.name}`);
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`ℹ️ Column ${column.name} already exists`);
          } else {
            console.log(`⚠️ Error adding column ${column.name}:`, error.message);
          }
        }
      }
    };

    await addMissingColumns();

    // Insert default college chat room if it doesn't exist
    const insertDefaultRoom = `
      INSERT IGNORE INTO chat_rooms (id, name, description, college_id, room_type, created_by)
      SELECT 
        1, 
        'College Chat Room', 
        'Default chat room for all college students',
        c.id,
        'college',
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
      FROM colleges c
      WHERE c.id = 1
    `;

    try {
      await connection.execute(insertDefaultRoom);
      console.log('✅ Default college chat room created/verified');
    } catch (error) {
      console.log('⚠️ Could not create default room:', error.message);
    }

    console.log('\n🎉 Chat database setup completed successfully!');
    console.log('\n📋 Tables created/verified:');
    console.log('   • chat_messages - Stores all chat messages');
    console.log('   • chat_rooms - Chat room management');
    console.log('   • chat_room_members - Room membership');
    console.log('   • chat_reactions - Message reactions');
    console.log('   • chat_typing_indicators - Real-time typing status');

  } catch (error) {
    console.error('❌ Error setting up chat database:', error);
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
  setupChatDatabase()
    .then(() => {
      console.log('Chat database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Chat database setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupChatDatabase;
