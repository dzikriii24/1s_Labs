const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || process.env.ip || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || process.env.users || 'u1zh8984_oneslabs',
  password: process.env.DB_PASS || process.env.pw || '',
  database: process.env.DB_NAME || process.env.db || 'u1zh8984_oneslabs',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true
};

const pool = mysql.createPool(dbConfig);

// Helper to execute query with parameters
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// Transaction helper ensuring atomic operations
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Health check function
async function testConnection() {
  try {
    const [result] = await pool.query('SELECT 1 as connected');
    return result && result[0] && result[0].connected === 1;
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    return false;
  }
}

// Execute query strictly within a target database context
async function executeInDatabase(targetDb, sql) {
  const conn = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: targetDb,
    multipleStatements: true,
    dateStrings: true
  });
  try {
    const [results] = await conn.query(sql);
    return results;
  } finally {
    await conn.end();
  }
}

module.exports = {
  pool,
  query,
  withTransaction,
  testConnection,
  executeInDatabase
};

