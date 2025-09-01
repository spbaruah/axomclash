const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Starting Ludo Race database migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/001_create_ludo_race_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements and filter out comments
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      try {
        console.log('📝 Executing:', statement.substring(0, 50) + '...');
        await db.execute(statement);
        console.log('✅ Success');
      } catch (error) {
        // If it's a "table already exists" error, that's fine
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('ℹ️ Table already exists, skipping...');
        } else {
          throw error;
        }
      }
    }

    console.log('🎉 Migration completed successfully!');
    
    // Test the tables by running a simple query
    try {
      const [result] = await db.execute('SHOW TABLES LIKE "ludo_race_%"');
      console.log(`📊 Created ${result.length} Ludo Race tables`);
    } catch (error) {
      console.warn('Could not verify table creation:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = runMigration;
