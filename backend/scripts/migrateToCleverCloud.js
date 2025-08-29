const mysql = require('mysql2/promise');
require('dotenv').config();

const migrateToCleverCloud = async () => {
  let localConnection, cleverConnection;
  
  try {
    console.log('🚀 Starting migration from localhost to Clever Cloud...');
    
    // Connect to local database
    localConnection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'axomclash'
    });
    console.log('✅ Connected to local database');
    
    // Connect to Clever Cloud database
    cleverConnection = await mysql.createConnection({
      host: process.env.MYSQL_ADDON_HOST || 'begr5npk9smo955afrh3-mysql.services.clever-cloud.com',
      user: process.env.MYSQL_ADDON_USER || 'u4ipbi08elhoxmsz',
      password: process.env.MYSQL_ADDON_PASSWORD || 'zC08nyi3MEVOfI3EisgE',
      database: process.env.MYSQL_ADDON_DB || 'begr5npk9smo955afrh3',
      port: process.env.MYSQL_ADDON_PORT || 3306,
      ssl: {
        rejectUnauthorized: false
      }
    });
    console.log('✅ Connected to Clever Cloud database');
    
    // Get all tables from local database
    const [localTables] = await localConnection.execute('SHOW TABLES');
    console.log('📋 Tables found in local database:', localTables.map(table => Object.values(table)[0]));
    
    // For each table, migrate data
    for (const tableRow of localTables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`\n🔄 Migrating table: ${tableName}`);
      
      try {
        // Get table structure
        const [columns] = await localConnection.execute(`DESCRIBE ${tableName}`);
        console.log(`   Columns: ${columns.map(col => col.Field).join(', ')}`);
        
        // Get data from local table
        const [rows] = await localConnection.execute(`SELECT * FROM ${tableName}`);
        console.log(`   Found ${rows.length} rows to migrate`);
        
        if (rows.length > 0) {
          // Create table in Clever Cloud if it doesn't exist
          const [createTable] = await localConnection.execute(`SHOW CREATE TABLE ${tableName}`);
          const createStatement = createTable[0]['Create Table'];
          
          // Replace table name in case it's different
          const cleverCreateStatement = createStatement.replace(/`axomclash`\./g, '');
          
          try {
            await cleverConnection.execute(`DROP TABLE IF EXISTS ${tableName}`);
            await cleverConnection.execute(cleverCreateStatement);
            console.log(`   ✅ Table structure created in Clever Cloud`);
          } catch (error) {
            console.log(`   ⚠️ Table structure creation failed: ${error.message}`);
            continue;
          }
          
          // Insert data
          if (rows.length > 0) {
            const columns = Object.keys(rows[0]);
            const placeholders = columns.map(() => '?').join(', ');
            const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
            
            for (const row of rows) {
              const values = columns.map(col => row[col]);
              await cleverConnection.execute(insertQuery, values);
            }
            console.log(`   ✅ Migrated ${rows.length} rows`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error migrating table ${tableName}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    if (localConnection) {
      await localConnection.end();
      console.log('🔌 Local connection closed');
    }
    if (cleverConnection) {
      await cleverConnection.end();
      console.log('🔌 Clever Cloud connection closed');
    }
  }
};

// Run migration
migrateToCleverCloud();
