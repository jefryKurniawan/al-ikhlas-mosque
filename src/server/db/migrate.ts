import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('Running migrations...');

  const conn = await pool.getConnection();

  try {
    const migrationPath = join(__dirname, 'migrations', '001_create_tables.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await conn.execute(statement);
    }

    console.log(`Migration executed: ${statements.length} statements`);
    console.log('Migration completed!');
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
