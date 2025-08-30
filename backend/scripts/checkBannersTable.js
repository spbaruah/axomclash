const db = require('../config/database');

const checkBannersTable = async () => {
  console.log('🔍 Checking banners table in database...\n');
  
  try {
    // Check if table exists
    const [tables] = await db.promise().execute(
      "SHOW TABLES LIKE 'banners'"
    );
    
    if (tables.length === 0) {
      console.log('❌ Banners table does not exist. Creating it now...\n');
      
      // Create banners table
      const createTableSQL = `
        CREATE TABLE banners (
          id INT PRIMARY KEY AUTO_INCREMENT,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          image_url VARCHAR(500),
          cta_text VARCHAR(100),
          cta_link VARCHAR(500),
          display_order INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;
      
      await db.promise().execute(createTableSQL);
      console.log('✅ Banners table created successfully!\n');
      
      // Verify table structure
      const [columns] = await db.promise().execute('DESCRIBE banners');
      console.log('📋 Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
      });
      
    } else {
      console.log('✅ Banners table already exists!\n');
      
      // Check table structure
      const [columns] = await db.promise().execute('DESCRIBE banners');
      console.log('📋 Current table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
      });
      
      // Check if table has data
      const [count] = await db.promise().execute('SELECT COUNT(*) as count FROM banners');
      console.log(`\n📊 Current banner count: ${count[0].count}`);
    }
    
    console.log('\n🎉 Banners table check completed successfully!');
    
  } catch (error) {
    console.error('❌ Error checking/creating banners table:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Database connection failed. Please check:');
      console.log('   - Database credentials in environment variables');
      console.log('   - Database server is running');
      console.log('   - Network connectivity');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Database access denied. Please check:');
      console.log('   - Database username and password');
      console.log('   - Database permissions');
    }
  } finally {
    process.exit(0);
  }
};

// Run the check
checkBannersTable();
