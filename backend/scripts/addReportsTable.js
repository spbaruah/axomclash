const mysql = require('mysql2/promise');
require('dotenv').config();

const addReportsTable = async () => {
  let connection;
  
  try {
    // Connect to MySQL server
    connection = await mysql.createConnection({
      host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
      user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
      port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306,
      database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash'
    });

    console.log('🔌 Connected to MySQL database');

    // Create reports table
    const reportsTable = `
      CREATE TABLE IF NOT EXISTS post_reports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        post_id INT NOT NULL,
        reporter_id INT NOT NULL,
        reason ENUM('spam', 'inappropriate', 'harassment', 'violence', 'fake_news', 'other') NOT NULL,
        description TEXT,
        status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
        admin_notes TEXT,
        reviewed_by INT NULL,
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL,
        UNIQUE KEY unique_report (post_id, reporter_id),
        INDEX idx_post (post_id),
        INDEX idx_reporter (reporter_id),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      )
    `;

    await connection.execute(reportsTable);
    console.log('✅ Reports table created successfully');

    // Add report_count field to posts table if it doesn't exist
    try {
      await connection.execute('ALTER TABLE posts ADD COLUMN report_count INT DEFAULT 0');
      console.log('✅ Added report_count field to posts table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ report_count field already exists in posts table');
      } else {
        throw error;
      }
    }

    console.log('🎉 Reports functionality setup completed successfully!');

  } catch (error) {
    console.error('❌ Reports table setup failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  addReportsTable();
}

module.exports = addReportsTable;
