import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vastraverse',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Create connection pool
export const pool = mysql.createPool(dbConfig);

// Test database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log('🔗 Testing database connection...');
    
    // Test query
    await connection.execute('SELECT 1');
    connection.release();
    
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Execute query helper function
export const executeQuery = async (query: string, params: any[] = []): Promise<any> => {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get single row helper function
export const getOne = async (query: string, params: any[] = []): Promise<any> => {
  try {
    const [rows] = await pool.execute(query, params);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default pool;
