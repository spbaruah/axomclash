const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'axomclash',
  port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 3, // Reduced from 10 to stay within Clever Cloud's 5 connection limit
  queueLimit: 0,
  ssl: process.env.MYSQL_ADDON_HOST ? {
    rejectUnauthorized: false
  } : false
});

// Convert pool to use promises
const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was lost.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.');
    }
  }
  if (connection) {
    connection.release();
  }
});

pool.on('connection', (connection) => {
  connection.query('SET SESSION sql_mode = "NO_ENGINE_SUBSTITUTION"');
});

// Export both the regular pool and the promise pool
module.exports = pool;
module.exports.promise = () => promisePool;
