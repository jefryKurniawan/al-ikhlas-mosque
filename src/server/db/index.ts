import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

const pool = mysql.createPool({
  host: process.env['DB_HOST'] ?? 'localhost',
  user: process.env['DB_USER'] ?? 'root',
  password: process.env['DB_PASS'] ?? '',
  database: process.env['DB_NAME'] ?? 'al_ikhlas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = drizzle(pool, { schema, mode: 'default' });

export { pool };
export default db;
