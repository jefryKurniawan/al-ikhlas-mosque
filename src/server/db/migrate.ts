import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('Running migrations...');

  const conn = await pool.getConnection();
  const migrationsDir = join(__dirname, 'migrations');

  try {
    // Read all .sql files and sort by filename (001_, 002_, etc.)
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf-8');

      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`  ${file}: ${statements.length} statements`);

      for (const statement of statements) {
        await conn.execute(statement);
      }
    }

    console.log(`\n${files.length} migration(s) executed successfully.`);
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
