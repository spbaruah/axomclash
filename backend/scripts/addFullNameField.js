const db = require('../config/database');

const addFullNameField = async () => {
  let connection;
  try {
    connection = await db.promise();
    
    console.log('Adding full_name field to users table...');
    
    // Check if full_name column already exists
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'full_name'"
    );
    
    if (columns.length === 0) {
      // Add full_name column
      await connection.execute(
        'ALTER TABLE users ADD COLUMN full_name VARCHAR(255) AFTER username'
      );
      console.log('✅ full_name column added successfully');
      
      // Update existing users to set full_name = username if full_name is NULL
      await connection.execute(
        'UPDATE users SET full_name = username WHERE full_name IS NULL'
      );
      console.log('✅ Updated existing users with full_name = username');
    } else {
      console.log('ℹ️ full_name column already exists');
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
  addFullNameField()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addFullNameField;
