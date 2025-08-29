const db = require('../config/database');

async function migrateUserTable() {
  try {
    console.log('Starting user table migration...');
    
    // Check if the new column already exists
    const [columns] = await db.promise().execute(
      "SHOW COLUMNS FROM users LIKE 'student_status'"
    );
    
    if (columns.length === 0) {
      console.log('Adding student_status column...');
      
      // Add the new student_status column
      await db.promise().execute(
        "ALTER TABLE users ADD COLUMN student_status ENUM('Currently Studying', 'Alumni') NOT NULL DEFAULT 'Currently Studying' AFTER college_id"
      );
      
      console.log('student_status column added successfully');
    } else {
      console.log('student_status column already exists');
    }
    
    // Check if old columns exist and remove them
    const [oldColumns] = await db.promise().execute(
      "SHOW COLUMNS FROM users LIKE 'course'"
    );
    
    if (oldColumns.length > 0) {
      console.log('Removing old academic columns...');
      
      // Remove old columns
      await db.promise().execute("ALTER TABLE users DROP COLUMN course");
      await db.promise().execute("ALTER TABLE users DROP COLUMN department");
      await db.promise().execute("ALTER TABLE users DROP COLUMN year_of_study");
      
      console.log('Old academic columns removed successfully');
    } else {
      console.log('Old academic columns already removed');
    }
    
    // Add index for student_status if it doesn't exist
    const [indexes] = await db.promise().execute(
      "SHOW INDEX FROM users WHERE Key_name = 'idx_student_status'"
    );
    
    if (indexes.length === 0) {
      console.log('Adding student_status index...');
      await db.promise().execute(
        "ALTER TABLE users ADD INDEX idx_student_status (student_status)"
      );
      console.log('student_status index added successfully');
    } else {
      console.log('student_status index already exists');
    }
    
    console.log('User table migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUserTable()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateUserTable;
