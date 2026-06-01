import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './src/server/db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env['DB_HOST'] ?? 'localhost',
    port: Number(process.env['DB_PORT'] ?? '3306'),
    user: process.env['DB_USER'] ?? 'root',
    password: process.env['DB_PASS'] ?? '',
    database: process.env['DB_NAME'] ?? 'al_ikhlas',
  },
});
