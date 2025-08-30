const db = require('../config/database');

const setupBannersTable = async () => {
  console.log('🔧 Setting up banners table...\n');
  
  try {
    // Check if database connection is available
    if (!db) {
      console.error('❌ Database connection not available');
      return;
    }

    console.log('📋 Creating banners table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS banners (
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
      )
    `;

    await db.promise().execute(createTableSQL);
    console.log('✅ Banners table created successfully');

    // Check if table exists and show structure
    console.log('\n📋 Checking table structure...');
    const [columns] = await db.promise().execute('DESCRIBE banners');
    console.log('Table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check if table has any data
    const [countResult] = await db.promise().execute('SELECT COUNT(*) as count FROM banners');
    console.log(`\n📊 Current banner count: ${countResult[0].count}`);

    console.log('\n🎉 Banners table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up banners table:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Database access denied. Please check:');
      console.log('   - Database credentials in environment variables');
      console.log('   - Database user permissions');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Database connection refused. Please check:');
      console.log('   - Database server is running');
      console.log('   - Database host and port are correct');
      console.log('   - Network connectivity');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database does not exist. Please check:');
      console.log('   - Database name in environment variables');
      console.log('   - Database has been created');
    }
    
    process.exit(1);
  }
};

// Run the setup
setupBannersTable();
