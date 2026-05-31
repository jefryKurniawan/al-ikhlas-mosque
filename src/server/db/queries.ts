import pool from './connection.js';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  QurbanTier,
  CreateQurbanTierInput,
  Activity,
  CreateActivityInput,
  PaginatedResponse,
} from '../../shared/types.js';

// --- Transactions ---

export async function getTransactions(
  page: number = 1,
  limit: number = 20,
  type?: string,
  startDate?: string,
  endDate?: string
): Promise<PaginatedResponse<Transaction>> {
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }
  if (startDate) {
    conditions.push('date >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('date <= ?');
    params.push(endDate);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM transactions ${where}`,
    params
  );
  const total = (countRows as Record<string, unknown>[])[0]?.['total'] as number;

  const [rows] = await pool.execute(
    `SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data: rows as Transaction[],
    total,
    page,
    limit,
  };
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const [result] = await pool.execute(
    `INSERT INTO transactions (type, amount, date, donor_name, description, category)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.type, input.amount, input.date, input.donor_name ?? null, input.description ?? '', input.category ?? null]
  );

  const insertId = (result as Record<string, unknown>)['insertId'] as number;
  const [rows] = await pool.execute('SELECT * FROM transactions WHERE id = ?', [insertId]);
  return (rows as Transaction[])[0]!;
}

export async function updateTransaction(id: number, input: UpdateTransactionInput): Promise<Transaction | null> {
  const fields: string[] = [];
  const params: (string | number)[] = [];

  if (input.type !== undefined) { fields.push('type = ?'); params.push(input.type); }
  if (input.amount !== undefined) { fields.push('amount = ?'); params.push(input.amount); }
  if (input.date !== undefined) { fields.push('date = ?'); params.push(input.date); }
  if (input.donor_name !== undefined) { fields.push('donor_name = ?'); params.push(input.donor_name); }
  if (input.description !== undefined) { fields.push('description = ?'); params.push(input.description); }
  if (input.category !== undefined) { fields.push('category = ?'); params.push(input.category); }

  if (fields.length === 0) {
    const [rows] = await pool.execute('SELECT * FROM transactions WHERE id = ?', [id]);
    return (rows as Transaction[])[0] ?? null;
  }

  params.push(id);
  await pool.execute(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, params);

  const [rows] = await pool.execute('SELECT * FROM transactions WHERE id = ?', [id]);
  return (rows as Transaction[])[0] ?? null;
}

export async function deleteTransaction(id: number): Promise<boolean> {
  const [result] = await pool.execute('DELETE FROM transactions WHERE id = ?', [id]);
  return ((result as Record<string, unknown>)['affectedRows'] as number) > 0;
}

// --- Qurban Tiers ---

export async function getQurbanTiers(activeOnly: boolean = false): Promise<QurbanTier[]> {
  const query = activeOnly
    ? 'SELECT * FROM qurban_tiers WHERE is_active = true ORDER BY sort_order'
    : 'SELECT * FROM qurban_tiers ORDER BY sort_order';
  const [rows] = await pool.execute(query);
  return rows as QurbanTier[];
}

export async function getQurbanTiersPaginated(
  page: number = 1,
  limit: number = 20,
  activeOnly: boolean = false
): Promise<PaginatedResponse<QurbanTier>> {
  const offset = (page - 1) * limit;
  const where = activeOnly ? 'WHERE is_active = true' : '';

  const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM qurban_tiers ${where}`);
  const total = (countRows as Record<string, unknown>[])[0]?.['total'] as number;

  const [rows] = await pool.execute(
    `SELECT * FROM qurban_tiers ${where} ORDER BY sort_order LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return { data: rows as QurbanTier[], total, page, limit };
}

export async function createQurbanTier(input: CreateQurbanTierInput): Promise<QurbanTier> {
  const [result] = await pool.execute(
    `INSERT INTO qurban_tiers (name, amount, description, sort_order) VALUES (?, ?, ?, ?)`,
    [input.name, input.amount, input.description ?? '', input.sort_order ?? 0]
  );
  const insertId = (result as Record<string, unknown>)['insertId'] as number;
  const [rows] = await pool.execute('SELECT * FROM qurban_tiers WHERE id = ?', [insertId]);
  return (rows as QurbanTier[])[0]!;
}

export async function updateQurbanTier(id: number, input: Partial<CreateQurbanTierInput> & { is_active?: boolean }): Promise<QurbanTier | null> {
  const fields: string[] = [];
  const params: (string | number | boolean)[] = [];

  if (input.name !== undefined) { fields.push('name = ?'); params.push(input.name); }
  if (input.amount !== undefined) { fields.push('amount = ?'); params.push(input.amount); }
  if (input.description !== undefined) { fields.push('description = ?'); params.push(input.description); }
  if (input.sort_order !== undefined) { fields.push('sort_order = ?'); params.push(input.sort_order); }
  if (input.is_active !== undefined) { fields.push('is_active = ?'); params.push(input.is_active); }

  if (fields.length === 0) {
    const [rows] = await pool.execute('SELECT * FROM qurban_tiers WHERE id = ?', [id]);
    return (rows as QurbanTier[])[0] ?? null;
  }

  params.push(id);
  await pool.execute(`UPDATE qurban_tiers SET ${fields.join(', ')} WHERE id = ?`, params);

  const [rows] = await pool.execute('SELECT * FROM qurban_tiers WHERE id = ?', [id]);
  return (rows as QurbanTier[])[0] ?? null;
}

export async function deleteQurbanTier(id: number): Promise<boolean> {
  const [result] = await pool.execute('DELETE FROM qurban_tiers WHERE id = ?', [id]);
  return ((result as Record<string, unknown>)['affectedRows'] as number) > 0;
}

// --- Activities ---

export async function getActivities(activeOnly: boolean = false): Promise<Activity[]> {
  const query = activeOnly
    ? 'SELECT * FROM activities WHERE is_active = true ORDER BY event_date DESC'
    : 'SELECT * FROM activities ORDER BY event_date DESC';
  const [rows] = await pool.execute(query);
  return rows as Activity[];
}

export async function getActivitiesPaginated(
  page: number = 1,
  limit: number = 20,
  activeOnly: boolean = false
): Promise<PaginatedResponse<Activity>> {
  const offset = (page - 1) * limit;
  const where = activeOnly ? 'WHERE is_active = true' : '';

  const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM activities ${where}`);
  const total = (countRows as Record<string, unknown>[])[0]?.['total'] as number;

  const [rows] = await pool.execute(
    `SELECT * FROM activities ${where} ORDER BY event_date DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return { data: rows as Activity[], total, page, limit };
}

export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const [result] = await pool.execute(
    `INSERT INTO activities (title, event_date, description) VALUES (?, ?, ?)`,
    [input.title, input.event_date, input.description ?? '']
  );
  const insertId = (result as Record<string, unknown>)['insertId'] as number;
  const [rows] = await pool.execute('SELECT * FROM activities WHERE id = ?', [insertId]);
  return (rows as Activity[])[0]!;
}

export async function updateActivity(id: number, input: Partial<CreateActivityInput> & { is_active?: boolean }): Promise<Activity | null> {
  const fields: string[] = [];
  const params: (string | number | boolean)[] = [];

  if (input.title !== undefined) { fields.push('title = ?'); params.push(input.title); }
  if (input.event_date !== undefined) { fields.push('event_date = ?'); params.push(input.event_date); }
  if (input.description !== undefined) { fields.push('description = ?'); params.push(input.description); }
  if (input.is_active !== undefined) { fields.push('is_active = ?'); params.push(input.is_active); }

  if (fields.length === 0) {
    const [rows] = await pool.execute('SELECT * FROM activities WHERE id = ?', [id]);
    return (rows as Activity[])[0] ?? null;
  }

  params.push(id);
  await pool.execute(`UPDATE activities SET ${fields.join(', ')} WHERE id = ?`, params);

  const [rows] = await pool.execute('SELECT * FROM activities WHERE id = ?', [id]);
  return (rows as Activity[])[0] ?? null;
}

export async function deleteActivity(id: number): Promise<boolean> {
  const [result] = await pool.execute('DELETE FROM activities WHERE id = ?', [id]);
  return ((result as Record<string, unknown>)['affectedRows'] as number) > 0;
}

// --- Reports ---

export async function getReportSummary(
  startDate: string,
  endDate: string
): Promise<{
  pemasukan: Record<string, number>;
  pengeluaran: number;
  pengeluaran_per_kategori: Record<string, number>;
  saldo: number;
}> {
  const [pemasukanRows] = await pool.execute(
    `SELECT type, COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE type != 'pengeluaran' AND date BETWEEN ? AND ?
     GROUP BY type`,
    [startDate, endDate]
  );

  const pemasukan: Record<string, number> = {
    jimpitan: 0,
    hibah: 0,
    zakat: 0,
    sedekah: 0,
  };
  for (const row of pemasukanRows as Record<string, unknown>[]) {
    pemasukan[row['type'] as string] = row['total'] as number;
  }

  // Pengeluaran total + breakdown per kategori
  const [pengeluaranRows] = await pool.execute(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE type = 'pengeluaran' AND date BETWEEN ? AND ?`,
    [startDate, endDate]
  );
  const pengeluaran = (pengeluaranRows as Record<string, unknown>[])[0]?.['total'] as number;

  const [kategoriRows] = await pool.execute(
    `SELECT category, COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE type = 'pengeluaran' AND date BETWEEN ? AND ?
     GROUP BY category`,
    [startDate, endDate]
  );
  const pengeluaran_per_kategori: Record<string, number> = {
    operasional: 0,
    perawatan: 0,
    sosial: 0,
  };
  for (const row of kategoriRows as Record<string, unknown>[]) {
    const cat = (row['category'] as string) ?? 'lainnya';
    pengeluaran_per_kategori[cat] = row['total'] as number;
  }

  const totalPemasukan = Object.values(pemasukan).reduce((a, b) => a + b, 0);

  return {
    pemasukan,
    pengeluaran,
    pengeluaran_per_kategori,
    saldo: totalPemasukan - pengeluaran,
  };
}
