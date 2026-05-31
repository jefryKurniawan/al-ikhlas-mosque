import 'dotenv/config';
import pool from './connection.js';
import { generateId } from '../lib/auth.js';
import { hashPassword } from '../lib/password.js';

async function seed() {
  console.log('Seeding database...');

  const conn = await pool.getConnection();

  try {
    // Seed admin user
    const adminId = generateId();
    const passwordHash = await hashPassword('admin123');

    await conn.execute(
      `INSERT IGNORE INTO users (id, username, password_hash, provider, role)
       VALUES (?, ?, ?, 'credentials', 'admin')`,
      [adminId, 'admin', passwordHash]
    );
    console.log('Admin user created (username: admin, password: admin123)');

    // Seed sample qurban tiers
    const tiers = [
      ['Sapi 1/7', 2500000, 'Paket 1/7 bagian sapi qurban', 1],
      ['Kambing 1 Ekor', 2200000, 'Paket kambing qurban utuh', 2],
      ['Sedekah Yatim', 100000, 'Paket sedekah untuk anak yatim', 3],
    ] as const;

    for (const [name, amount, description, sort_order] of tiers) {
      await conn.execute(
        `INSERT IGNORE INTO qurban_tiers (name, amount, description, sort_order)
         VALUES (?, ?, ?, ?)`,
        [name, amount, description, sort_order]
      );
    }
    console.log('Sample qurban tiers created');

    // Seed sample activities
    const activities = [
      ['Sholat Jumat Berjamaah', '2026-06-05', 'Sholat Jumat dengan khotib undangan'],
      ['Pengajian Rutin', '2026-06-07', 'Pengajian Sabtu malam minggu pertama'],
    ] as const;

    for (const [title, event_date, description] of activities) {
      await conn.execute(
        `INSERT IGNORE INTO activities (title, event_date, description)
         VALUES (?, ?, ?)`,
        [title, event_date, description]
      );
    }
    console.log('Sample activities created');

    console.log('Seed completed!');
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
