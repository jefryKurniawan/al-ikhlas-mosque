import { eq, and, desc, sql, type SQL } from 'drizzle-orm';
import type { ResultSetHeader } from 'mysql2/promise';
import db from './index.js';
import { transactions, qurbanTiers, qurbanDonors, activities, users, zakatRecipients } from './schema.js';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  QurbanTier,
  QurbanDonor,
  CreateQurbanTierInput,
  Activity,
  CreateActivityInput,
  User,
  CreateUserInput,
  UpdateUserInput,
  ZakatRecipient,
  CreateZakatRecipientInput,
  UpdateZakatRecipientInput,
  PaginatedResponse,
} from '../../shared/types.js';
import { toTransactionId, toQurbanTierId, toActivityId, toUserId } from '../../shared/types.js';
import { generateId } from '../lib/auth.js';
import { hashPassword } from '../lib/password.js';

// --- Helpers ---

function dateStr(d: Date | string): string {
  if (typeof d === 'string') return d;
  return d.toISOString().split('T')[0]!;
}

function asTransaction(row: typeof transactions.$inferSelect): Transaction {
  return {
    id: toTransactionId(row.id),
    type: row.type as Transaction['type'],
    amount: row.amount,
    date: dateStr(row.date),
    donorName: row.donorName,
    description: row.description ?? '',
    category: row.category,
    createdAt: dateStr(row.createdAt),
  };
}

function asQurbanTier(row: typeof qurbanTiers.$inferSelect): QurbanTier {
  return {
    id: toQurbanTierId(row.id),
    name: row.name,
    amount: row.amount,
    description: row.description ?? '',
    imageUrl: row.imageUrl ?? null,
    sortOrder: row.sortOrder,
    isActive: Boolean(row.isActive),
  };
}

function asActivity(row: typeof activities.$inferSelect): Activity {
  return {
    id: toActivityId(row.id),
    title: row.title,
    eventDate: dateStr(row.eventDate),
    eventTime: row.eventTime ?? null,
    category: (row.category as Activity['category']) ?? 'besar',
    description: row.description ?? '',
    imageUrl: row.imageUrl ?? null,
    isActive: Boolean(row.isActive),
  };
}

// --- Transactions ---

export async function getTransactions(
  page: number = 1,
  limit: number = 20,
  type?: string,
  startDate?: string,
  endDate?: string
): Promise<PaginatedResponse<Transaction>> {
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [];

  if (type) conditions.push(eq(transactions.type, type));
  if (startDate && endDate) {
    conditions.push(sql`${transactions.date} BETWEEN ${startDate} AND ${endDate}`);
  } else if (startDate) {
    conditions.push(sql`${transactions.date} >= ${startDate}`);
  } else if (endDate) {
    conditions.push(sql`${transactions.date} <= ${endDate}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ total: sql<number>`count(*)` })
    .from(transactions)
    .where(where);

  const rows = await db
    .select()
    .from(transactions)
    .where(where)
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    data: rows.map(asTransaction),
    total: countResult?.total ?? 0,
    page,
    limit,
  };
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const [inserted] = await db
    .insert(transactions)
    .values({
      type: input.type,
      amount: input.amount,
      date: sql`${input.date}`,
      donorName: input.donorName ?? null,
      description: input.description ?? '',
      category: input.category ?? null,
    })
    .$returningId();

  const [row] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, inserted!.id));

  return asTransaction(row!);
}

export async function updateTransaction(id: number, input: UpdateTransactionInput): Promise<Transaction | null> {
  const values: Record<string, unknown> = {};
  if (input.type !== undefined) values.type = input.type;
  if (input.amount !== undefined) values.amount = input.amount;
  if (input.date !== undefined) values.date = input.date;
  if (input.donorName !== undefined) values.donorName = input.donorName;
  if (input.description !== undefined) values.description = input.description;
  if (input.category !== undefined) values.category = input.category;

  if (Object.keys(values).length === 0) {
    const [row] = await db.select().from(transactions).where(eq(transactions.id, id));
    return row ? asTransaction(row) : null;
  }

  await db.update(transactions).set(values).where(eq(transactions.id, id));
  const [row] = await db.select().from(transactions).where(eq(transactions.id, id));
  return row ? asTransaction(row) : null;
}

export async function deleteTransaction(id: number): Promise<boolean> {
  const result = await db.delete(transactions).where(eq(transactions.id, id));
  const header = result[0] as ResultSetHeader;
  return header.affectedRows > 0;
}

// --- Qurban Tiers ---

export async function getQurbanTiers(activeOnly: boolean = false): Promise<QurbanTier[]> {
  const rows = activeOnly
    ? await db.select().from(qurbanTiers).where(eq(qurbanTiers.isActive, true)).orderBy(qurbanTiers.sortOrder)
    : await db.select().from(qurbanTiers).orderBy(qurbanTiers.sortOrder);

  return rows.map(asQurbanTier);
}

export async function getQurbanTiersPaginated(
  page: number = 1,
  limit: number = 20,
  activeOnly: boolean = false
): Promise<PaginatedResponse<QurbanTier>> {
  const offset = (page - 1) * limit;
  const where = activeOnly ? eq(qurbanTiers.isActive, true) : undefined;

  const [countResult] = await db
    .select({ total: sql<number>`count(*)` })
    .from(qurbanTiers)
    .where(where);

  const rows = await db
    .select()
    .from(qurbanTiers)
    .where(where)
    .orderBy(qurbanTiers.sortOrder)
    .limit(limit)
    .offset(offset);

  return { data: rows.map(asQurbanTier), total: countResult?.total ?? 0, page, limit };
}

export async function createQurbanTier(input: CreateQurbanTierInput): Promise<QurbanTier> {
  const [inserted] = await db
    .insert(qurbanTiers)
    .values({
      name: input.name,
      amount: input.amount,
      description: input.description ?? '',
      imageUrl: input.imageUrl ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .$returningId();

  const [row] = await db.select().from(qurbanTiers).where(eq(qurbanTiers.id, inserted!.id));
  return asQurbanTier(row!);
}

export async function updateQurbanTier(id: number, input: Partial<CreateQurbanTierInput> & { isActive?: boolean }): Promise<QurbanTier | null> {
  const values: Record<string, unknown> = {};
  if (input.name !== undefined) values.name = input.name;
  if (input.amount !== undefined) values.amount = input.amount;
  if (input.description !== undefined) values.description = input.description;
  if (input.imageUrl !== undefined) values.imageUrl = input.imageUrl;
  if (input.sortOrder !== undefined) values.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) values.isActive = input.isActive;

  if (Object.keys(values).length === 0) {
    const [row] = await db.select().from(qurbanTiers).where(eq(qurbanTiers.id, id));
    return row ? asQurbanTier(row) : null;
  }

  await db.update(qurbanTiers).set(values).where(eq(qurbanTiers.id, id));
  const [row] = await db.select().from(qurbanTiers).where(eq(qurbanTiers.id, id));
  return row ? asQurbanTier(row) : null;
}

export async function deleteQurbanTier(id: number): Promise<boolean> {
  const result = await db.delete(qurbanTiers).where(eq(qurbanTiers.id, id));
  const header = result[0] as ResultSetHeader;
  return header.affectedRows > 0;
}

// --- Activities ---

export async function getActivities(activeOnly: boolean = false): Promise<Activity[]> {
  const rows = activeOnly
    ? await db.select().from(activities).where(eq(activities.isActive, true)).orderBy(desc(activities.eventDate))
    : await db.select().from(activities).orderBy(desc(activities.eventDate));

  return rows.map(asActivity);
}

export async function getActivitiesPaginated(
  page: number = 1,
  limit: number = 20,
  activeOnly: boolean = false
): Promise<PaginatedResponse<Activity>> {
  const offset = (page - 1) * limit;
  const where = activeOnly ? eq(activities.isActive, true) : undefined;

  const [countResult] = await db
    .select({ total: sql<number>`count(*)` })
    .from(activities)
    .where(where);

  const rows = await db
    .select()
    .from(activities)
    .where(where)
    .orderBy(desc(activities.eventDate))
    .limit(limit)
    .offset(offset);

  return { data: rows.map(asActivity), total: countResult?.total ?? 0, page, limit };
}

export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const [inserted] = await db
    .insert(activities)
    .values({
      title: input.title,
      eventDate: sql`${input.eventDate}`,
      eventTime: input.eventTime ?? null,
      category: input.category ?? 'besar',
      description: input.description ?? '',
      imageUrl: input.imageUrl ?? null,
    })
    .$returningId();

  const [row] = await db.select().from(activities).where(eq(activities.id, inserted!.id));
  return asActivity(row!);
}

export async function updateActivity(id: number, input: Partial<CreateActivityInput> & { isActive?: boolean }): Promise<Activity | null> {
  const values: Record<string, unknown> = {};
  if (input.title !== undefined) values.title = input.title;
  if (input.eventDate !== undefined) values.eventDate = input.eventDate;
  if (input.eventTime !== undefined) values.eventTime = input.eventTime;
  if (input.category !== undefined) values.category = input.category;
  if (input.description !== undefined) values.description = input.description;
  if (input.imageUrl !== undefined) values.imageUrl = input.imageUrl;
  if (input.isActive !== undefined) values.isActive = input.isActive;

  if (Object.keys(values).length === 0) {
    const [row] = await db.select().from(activities).where(eq(activities.id, id));
    return row ? asActivity(row) : null;
  }

  await db.update(activities).set(values).where(eq(activities.id, id));
  const [row] = await db.select().from(activities).where(eq(activities.id, id));
  return row ? asActivity(row) : null;
}

export async function deleteActivity(id: number): Promise<boolean> {
  const result = await db.delete(activities).where(eq(activities.id, id));
  const header = result[0] as ResultSetHeader;
  return header.affectedRows > 0;
}

// --- Reports ---

export async function getReportSummary(
  startDate: string,
  endDate: string
): Promise<{
  pemasukan: Record<string, number>;
  pengeluaran: number;
  pengeluaranPerKategori: Record<string, number>;
  saldo: number;
}> {
  const pemasukanRows = await db
    .select({
      type: transactions.type,
      total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        sql`${transactions.type} != 'pengeluaran'`,
        sql`${transactions.date} BETWEEN ${startDate} AND ${endDate}`
      )
    )
    .groupBy(transactions.type);

  const pemasukan: Record<string, number> = {
    jimpitan: 0,
    hibah: 0,
    zakat: 0,
    sedekah: 0,
  };
  for (const row of pemasukanRows) {
    pemasukan[row.type] = row.total;
  }

  const [pengeluaranResult] = await db
    .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, 'pengeluaran'),
        sql`${transactions.date} BETWEEN ${startDate} AND ${endDate}`
      )
    );

  const kategoriRows = await db
    .select({
      category: transactions.category,
      total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, 'pengeluaran'),
        sql`${transactions.date} BETWEEN ${startDate} AND ${endDate}`
      )
    )
    .groupBy(transactions.category);

  const pengeluaranPerKategori: Record<string, number> = {
    operasional: 0,
    perawatan: 0,
    sosial: 0,
  };
  for (const row of kategoriRows) {
    const cat = row.category ?? 'lainnya';
    pengeluaranPerKategori[cat] = row.total;
  }

  const totalPemasukan = Object.values(pemasukan).reduce((a, b) => a + b, 0);

  return {
    pemasukan,
    pengeluaran: pengeluaranResult?.total ?? 0,
    pengeluaranPerKategori,
    saldo: totalPemasukan - (pengeluaranResult?.total ?? 0),
  };
}

// --- Specialized Reports ---

export async function getJimpitanReport(
  startDate: string,
  endDate: string
): Promise<{
  periode: string;
  totalKeseluruhan: number;
  recapPerRT: { rt: string; total: number; bulan: string }[];
  transactions: Transaction[];
}> {
  // Get all jimpitan transactions in period
  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.type, 'jimpitan'),
        sql`${transactions.date} BETWEEN ${startDate} AND ${endDate}`
      )
    )
    .orderBy(transactions.date);

  const txList = rows.map(asTransaction);

  // Extract RT from description (e.g., "Jimpitan RT 01 Januari")
  const recapMap = new Map<string, number>();
  for (const tx of txList) {
    const match = tx.description.match(/RT\s*(\d+)/i);
    const rt = match ? `RT ${match[1]}` : 'Lainnya';
    recapMap.set(rt, (recapMap.get(rt) ?? 0) + tx.amount);
  }

  const totalKeseluruhan = txList.reduce((sum, tx) => sum + tx.amount, 0);

  return {
    periode: `${startDate} s/d ${endDate}`,
    totalKeseluruhan,
    recapPerRT: Array.from(recapMap.entries()).map(([rt, total]) => ({
      rt,
      total,
      bulan: startDate.slice(0, 7), // YYYY-MM
    })),
    transactions: txList,
  };
}

export async function getZakatReport(
  startDate: string,
  endDate: string
): Promise<{
  periode: string;
  totalZakat: number;
  totalSedekah: number;
  totalKeseluruhan: number;
  transactions: Transaction[];
}> {
  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        sql`${transactions.type} IN ('zakat', 'sedekah')`,
        sql`${transactions.date} BETWEEN ${startDate} AND ${endDate}`
      )
    )
    .orderBy(transactions.date);

  const txList = rows.map(asTransaction);
  const totalZakat = txList.filter(t => t.type === 'zakat').reduce((s, t) => s + t.amount, 0);
  const totalSedekah = txList.filter(t => t.type === 'sedekah').reduce((s, t) => s + t.amount, 0);

  return {
    periode: `${startDate} s/d ${endDate}`,
    totalZakat,
    totalSedekah,
    totalKeseluruhan: totalZakat + totalSedekah,
    transactions: txList,
  };
}

export async function getRamadhanReport(year: number): Promise<{
  year: number;
  periode: string;
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
  pemasukanDetail: { type: string; total: number }[];
  pengeluaranDetail: Transaction[];
  transactions: Transaction[];
}> {
  // Ramadhan period: Feb 1 - Apr 10 (approximate for 2026)
  const startDate = `${year}-02-01`;
  const endDate = `${year}-04-10`;

  const rows = await db
    .select()
    .from(transactions)
    .where(sql`${transactions.date} BETWEEN ${startDate} AND ${endDate}`)
    .orderBy(transactions.date);

  const txList = rows.map(asTransaction);

  const pemasukanMap = new Map<string, number>();
  const pengeluaranList: Transaction[] = [];
  let totalPemasukan = 0;
  let totalPengeluaran = 0;

  for (const tx of txList) {
    if (tx.type === 'pengeluaran') {
      totalPengeluaran += tx.amount;
      pengeluaranList.push(tx);
    } else {
      totalPemasukan += tx.amount;
      pemasukanMap.set(tx.type, (pemasukanMap.get(tx.type) ?? 0) + tx.amount);
    }
  }

  return {
    year,
    periode: `${startDate} s/d ${endDate}`,
    totalPemasukan,
    totalPengeluaran,
    saldo: totalPemasukan - totalPengeluaran,
    pemasukanDetail: Array.from(pemasukanMap.entries()).map(([type, total]) => ({ type, total })),
    pengeluaranDetail: pengeluaranList,
    transactions: txList,
  };
}

export async function getQurbanReport(year: number): Promise<{
  year: number;
  periode: string;
  donors: QurbanDonor[];
  totalOperasional: number;
  transactions: Transaction[];
}> {
  // Qurban period: Jun 1 - Jun 20 (around Idul Adha)
  const startDate = `${year}-06-01`;
  const endDate = `${year}-06-20`;

  const donorRows = await db
    .select()
    .from(qurbanDonors)
    .where(eq(qurbanDonors.year, year))
    .orderBy(qurbanDonors.animalType, qurbanDonors.id);

  const txRows = await db
    .select()
    .from(transactions)
    .where(
      and(
        sql`${transactions.date} BETWEEN ${startDate} AND ${endDate}`,
        sql`${transactions.type} = 'sedekah'`
      )
    )
    .orderBy(transactions.date);

  const txList = txRows.map(asTransaction);
  const totalOperasional = txList.reduce((s, t) => s + t.amount, 0);

  return {
    year,
    periode: `${startDate} s/d ${endDate}`,
    donors: donorRows.map(row => ({
      id: row.id,
      name: row.name,
      animalType: row.animalType,
      portion: row.portion,
      amount: row.amount,
      year: row.year,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    })),
    totalOperasional,
    transactions: txList,
  };
}

// --- Users ---

function asUser(row: typeof users.$inferSelect): User {
  return {
    id: toUserId(row.id),
    username: row.username,
    email: row.email,
    passwordHash: row.passwordHash,
    provider: row.provider as User['provider'],
    providerId: row.providerId,
    role: row.role as User['role'],
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : row.createdAt.toISOString(),
  };
}

export async function getUsers(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<User>> {
  const offset = (page - 1) * limit;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  const rows = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    data: rows.map(asUser),
    total: countResult?.count ?? 0,
    page,
    limit,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id));
  return row ? asUser(row) : null;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const id = generateId();
  const passwordHash = await hashPassword(input.password);

  await db.insert(users).values({
    id,
    username: input.username,
    email: input.email,
    passwordHash,
    provider: 'credentials',
    role: input.role ?? 'admin',
  });

  const created = await getUserById(id);
  return created!;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
  const values: Record<string, unknown> = {};

  if (input.username !== undefined) values.username = input.username;
  if (input.email !== undefined) values.email = input.email;
  if (input.role !== undefined) values.role = input.role;
  if (input.password !== undefined) values.passwordHash = await hashPassword(input.password);

  if (Object.keys(values).length === 0) {
    return getUserById(id);
  }

  await db.update(users).set(values).where(eq(users.id, id));
  return getUserById(id);
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await db.delete(users).where(eq(users.id, id));
  const header = result[0] as ResultSetHeader;
  return header.affectedRows > 0;
}

// ============================================================
// Zakat Recipients — Penerima zakat (internal only)
// ============================================================

function asZakatRecipient(row: typeof zakatRecipients.$inferSelect): ZakatRecipient {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    category: row.category as ZakatRecipient['category'],
    amount: row.amount,
    date: dateStr(row.date),
    description: row.description,
    createdAt: dateStr(row.createdAt),
  };
}

export async function getZakatRecipients(
  page = 1,
  limit = 15,
  category?: string,
): Promise<PaginatedResponse<ZakatRecipient>> {
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];
  if (category) {
    conditions.push(eq(zakatRecipients.category, category));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(zakatRecipients)
    .where(where);
  const total = countResult?.count ?? 0;

  const rows = await db
    .select()
    .from(zakatRecipients)
    .where(where)
    .orderBy(desc(zakatRecipients.date))
    .limit(limit)
    .offset(offset);

  return {
    data: rows.map(asZakatRecipient),
    total,
    page,
    limit,
  };
}

export async function getZakatRecipientById(id: number): Promise<ZakatRecipient | null> {
  const rows = await db.select().from(zakatRecipients).where(eq(zakatRecipients.id, id)).limit(1);
  return rows[0] ? asZakatRecipient(rows[0]) : null;
}

export async function createZakatRecipient(input: CreateZakatRecipientInput): Promise<ZakatRecipient> {
  const result = await db.insert(zakatRecipients).values({
    name: input.name,
    address: input.address ?? null,
    category: input.category,
    amount: input.amount,
    date: new Date(input.date),
    description: input.description ?? null,
  });
  const header = result[0] as ResultSetHeader;
  const created = await getZakatRecipientById(header.insertId);
  return created!;
}

export async function updateZakatRecipient(id: number, input: UpdateZakatRecipientInput): Promise<ZakatRecipient | null> {
  const values: Record<string, unknown> = {};
  if (input.name !== undefined) values.name = input.name;
  if (input.address !== undefined) values.address = input.address;
  if (input.category !== undefined) values.category = input.category;
  if (input.amount !== undefined) values.amount = input.amount;
  if (input.date !== undefined) values.date = input.date;
  if (input.description !== undefined) values.description = input.description;

  if (Object.keys(values).length === 0) {
    return getZakatRecipientById(id);
  }

  await db.update(zakatRecipients).set(values).where(eq(zakatRecipients.id, id));
  return getZakatRecipientById(id);
}

export async function deleteZakatRecipient(id: number): Promise<boolean> {
  const result = await db.delete(zakatRecipients).where(eq(zakatRecipients.id, id));
  const header = result[0] as ResultSetHeader;
  return header.affectedRows > 0;
}
