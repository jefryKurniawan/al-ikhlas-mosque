import { mysqlTable, varchar, int, text, date, datetime, boolean, mysqlEnum } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// ============================================================
// Users — Lucia Auth
// ============================================================

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  username: varchar('username', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  provider: varchar('provider', { length: 20 }).notNull().default('credentials'),
  providerId: varchar('provider_id', { length: 255 }),
  role: varchar('role', { length: 20 }).notNull().default('admin'),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// Sessions — Lucia Auth
// ============================================================

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: datetime('expires_at').notNull(),
});

// ============================================================
// Transactions — Keuangan masjid
// ============================================================

export const transactions = mysqlTable('transactions', {
  id: int('id').autoincrement().primaryKey(),
  type: varchar('type', { length: 20 }).notNull(), // jimpitan, hibah, zakat, sedekah, pengeluaran
  amount: int('amount').notNull(),
  date: date('date').notNull(),
  donorName: varchar('donor_name', { length: 255 }),
  description: text('description'),
  category: varchar('category', { length: 50 }), // operasional, perawatan, sosial
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// Qurban Tiers — Paket qurban & sedekah
// ============================================================

export const qurbanTiers = mysqlTable('qurban_tiers', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  amount: int('amount').notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  sortOrder: int('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
});

// ============================================================
// Qurban Donors — Donatur qurban
// ============================================================

export const qurbanDonors = mysqlTable('qurban_donors', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  animalType: varchar('animal_type', { length: 50 }).notNull(), // 'sapi', 'kambing', 'domba'
  portion: varchar('portion', { length: 20 }).notNull(), // '1/7', '1/1', '1'
  amount: int('amount').notNull(),
  year: int('year').notNull(),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type QurbanDonor = typeof qurbanDonors.$inferSelect;
export type NewQurbanDonor = typeof qurbanDonors.$inferInsert;

// ============================================================
// Activities — Kegiatan masjid
// ============================================================

export const activities = mysqlTable('activities', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  eventDate: date('event_date').notNull(),
  eventTime: varchar('event_time', { length: 10 }),
  category: varchar('category', { length: 20 }).notNull().default('besar'),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  isActive: boolean('is_active').notNull().default(true),
});

// ============================================================
// Zakat Recipients — Penerima zakat (internal only)
// ============================================================

export const zakatRecipients = mysqlTable('zakat_recipients', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  category: varchar('category', { length: 50 }).notNull(),
  amount: int('amount').notNull(),
  date: date('date').notNull(),
  description: text('description'),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// Type exports for use in application code
// ============================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type QurbanTier = typeof qurbanTiers.$inferSelect;
export type NewQurbanTier = typeof qurbanTiers.$inferInsert;

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

export type ZakatRecipient = typeof zakatRecipients.$inferSelect;
export type NewZakatRecipient = typeof zakatRecipients.$inferInsert;
