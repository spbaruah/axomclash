const mysql = require('mysql2/promise');
require('dotenv').config();

const testCleverCloudConnection = async () => {
  let connection;
  
  try {
    console.log('🔌 Testing connection to Clever Cloud MySQL...');
    console.log('Host:', process.env.MYSQL_ADDON_HOST || 'Not set');
    console.log('Database:', process.env.MYSQL_ADDON_DB || 'Not set');
    console.log('User:', process.env.MYSQL_ADDON_USER || 'Not set');
    console.log('Port:', process.env.MYSQL_ADDON_PORT || 'Not set');
    
    // Test connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_ADDON_HOST || 'begr5npk9smo955afrh3-mysql.services.clever-cloud.com',
      user: process.env.MYSQL_ADDON_USER || 'u4ipbi08elhoxmsz',
      password: process.env.MYSQL_ADDON_PASSWORD || 'zC08nyi3MEVOfI3EisgE',
      database: process.env.MYSQL_ADDON_DB || 'begr5npk9smo955afrh3',
      port: process.env.MYSQL_ADDON_PORT || 3306,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Successfully connected to Clever Cloud MySQL!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Test query successful:', rows);
    
    // Check if database exists and show tables
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('📚 Available databases:', databases.map(db => db.Database));
    
    // Use the database
    await connection.execute(`USE ${process.env.MYSQL_ADDON_DB || 'begr5npk9smo955afrh3'}`);
    
    // Show tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tables in database:', tables.map(table => Object.values(table)[0]));
    
    console.log('\n🎉 Clever Cloud MySQL connection test successful!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connection closed');
    }
  }
};

// Run the test
testCleverCloudConnection();
