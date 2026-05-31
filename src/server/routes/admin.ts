import { Hono } from 'hono';
import type { Env } from 'hono';
import { authGuard } from '../middleware/auth-guard.js';
import { validateBody, reportSchema } from '../middleware/validate.js';

type AppEnv = Env & { Variables: { body: Record<string, unknown> } };
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getQurbanTiersPaginated,
  createQurbanTier,
  updateQurbanTier,
  deleteQurbanTier,
  getActivitiesPaginated,
  createActivity,
  updateActivity,
  deleteActivity,
  getReportSummary,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../db/queries.js';
import { generateCsv, generateReportHtml } from '../lib/export.js';
import { getDateRange } from '../../shared/date-range.js';

const adminRoutes = new Hono<AppEnv>();

// All admin routes require auth
adminRoutes.use('*', authGuard);

// --- Transactions CRUD ---

adminRoutes.get('/transactions', async (c) => {
  const page = Number(c.req.query('page') ?? '1');
  const limit = Number(c.req.query('limit') ?? '20');
  const type = c.req.query('type');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');

  const result = await getTransactions(page, limit, type ?? undefined, startDate ?? undefined, endDate ?? undefined);
  return c.json({ success: true, data: result });
});

adminRoutes.post(
  '/transactions',
  validateBody({
    type: { type: 'string', required: true, enum: ['jimpitan', 'hibah', 'zakat', 'sedekah', 'pengeluaran'] },
    amount: { type: 'number', required: true, min: 1 },
    date: { type: 'string', required: true },
  }),
  async (c) => {
    const body = c.get('body') as unknown as Parameters<typeof createTransaction>[0];
    const transaction = await createTransaction(body);
    return c.json({ success: true, data: transaction }, 201);
  }
);

adminRoutes.put(
  '/transactions/:id',
  validateBody({
    type: { type: 'string', required: false, enum: ['jimpitan', 'hibah', 'zakat', 'sedekah', 'pengeluaran'] },
    amount: { type: 'number', required: false, min: 1 },
    date: { type: 'string', required: false },
  }),
  async (c) => {
    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID tidak valid' }, 400);
    }

    const body = c.get('body') as Parameters<typeof updateTransaction>[1];
    const transaction = await updateTransaction(id, body);

    if (!transaction) {
      return c.json({ success: false, error: 'Transaksi tidak ditemukan' }, 404);
    }

    return c.json({ success: true, data: transaction });
  }
);

adminRoutes.delete('/transactions/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (isNaN(id)) {
    return c.json({ success: false, error: 'ID tidak valid' }, 400);
  }

  const deleted = await deleteTransaction(id);
  if (!deleted) {
    return c.json({ success: false, error: 'Transaksi tidak ditemukan' }, 404);
  }

  return c.json({ success: true, data: { message: 'Transaksi dihapus' } });
});

// --- Qurban Tiers CRUD ---

adminRoutes.get('/cms/qurban', async (c) => {
  const page = Number(c.req.query('page') ?? '1');
  const limit = Number(c.req.query('limit') ?? '20');
  const result = await getQurbanTiersPaginated(page, limit, false);
  return c.json({ success: true, data: result });
});

adminRoutes.post(
  '/cms/qurban',
  validateBody({
    name: { type: 'string', required: true, min: 1 },
    amount: { type: 'number', required: true, min: 1 },
  }),
  async (c) => {
    const body = c.get('body') as unknown as Parameters<typeof createQurbanTier>[0];
    const tier = await createQurbanTier(body);
    return c.json({ success: true, data: tier }, 201);
  }
);

adminRoutes.put(
  '/cms/qurban/:id',
  validateBody({
    name: { type: 'string', required: false },
    amount: { type: 'number', required: false, min: 1 },
    description: { type: 'string', required: false },
    sortOrder: { type: 'number', required: false },
  }),
  async (c) => {
    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID tidak valid' }, 400);
    }

    const body = c.get('body') as Parameters<typeof updateQurbanTier>[1];
    const tier = await updateQurbanTier(id, body);

    if (!tier) {
      return c.json({ success: false, error: 'Tier tidak ditemukan' }, 404);
    }

    return c.json({ success: true, data: tier });
  }
);

adminRoutes.delete('/cms/qurban/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (isNaN(id)) {
    return c.json({ success: false, error: 'ID tidak valid' }, 400);
  }

  const deleted = await deleteQurbanTier(id);
  if (!deleted) {
    return c.json({ success: false, error: 'Tier tidak ditemukan' }, 404);
  }

  return c.json({ success: true, data: { message: 'Tier dihapus' } });
});

// --- Activities CRUD ---

adminRoutes.get('/cms/activities', async (c) => {
  const page = Number(c.req.query('page') ?? '1');
  const limit = Number(c.req.query('limit') ?? '20');
  const result = await getActivitiesPaginated(page, limit, false);
  return c.json({ success: true, data: result });
});

adminRoutes.post(
  '/cms/activities',
  validateBody({
    title: { type: 'string', required: true, min: 1 },
    eventDate: { type: 'string', required: true },
  }),
  async (c) => {
    const body = c.get('body') as unknown as Parameters<typeof createActivity>[0];
    const activity = await createActivity(body);
    return c.json({ success: true, data: activity }, 201);
  }
);

adminRoutes.put(
  '/cms/activities/:id',
  validateBody({
    title: { type: 'string', required: false },
    eventDate: { type: 'string', required: false },
    description: { type: 'string', required: false },
  }),
  async (c) => {
    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID tidak valid' }, 400);
    }

    const body = c.get('body') as Parameters<typeof updateActivity>[1];
    const activity = await updateActivity(id, body);

    if (!activity) {
      return c.json({ success: false, error: 'Kegiatan tidak ditemukan' }, 404);
    }

    return c.json({ success: true, data: activity });
  }
);

adminRoutes.delete('/cms/activities/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (isNaN(id)) {
    return c.json({ success: false, error: 'ID tidak valid' }, 400);
  }

  const deleted = await deleteActivity(id);
  if (!deleted) {
    return c.json({ success: false, error: 'Kegiatan tidak ditemukan' }, 404);
  }

  return c.json({ success: true, data: { message: 'Kegiatan dihapus' } });
});

// --- Reports (internal, with donor names) ---

adminRoutes.post('/reports', validateBody(reportSchema), async (c) => {
  const body = c.get('body') as { type: string; year: number; month?: number };
  const { startDate, endDate } = getDateRange(body.type, body.year, body.month);
  const summary = await getReportSummary(startDate, endDate);

  // Internal reports include transaction details
  const transactions = await getTransactions(1, 1000, undefined, startDate, endDate);

  return c.json({
    success: true,
    data: {
      ...summary,
      periode: `${startDate} s/d ${endDate}`,
      transactions: transactions.data,
    },
  });
});

// --- Export CSV (internal, with donor names) ---
adminRoutes.post('/reports/csv', validateBody(reportSchema), async (c) => {
  const body = c.get('body') as { type: string; year: number; month?: number };
  const { startDate, endDate } = getDateRange(body.type, body.year, body.month);
  const transactions = await getTransactions(1, 10000, undefined, startDate, endDate);
  const csv = generateCsv(transactions.data, true);

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="laporan-internal-${body.type}-${body.year}.csv"`);
  return c.body(csv);
});

// --- Export HTML/PDF (internal, with donor names) ---
adminRoutes.post('/reports/pdf', validateBody(reportSchema), async (c) => {
  const body = c.get('body') as { type: string; year: number; month?: number };
  const { startDate, endDate } = getDateRange(body.type, body.year, body.month);
  const summary = await getReportSummary(startDate, endDate);
  const transactions = await getTransactions(1, 1000, undefined, startDate, endDate);

  const html = generateReportHtml(
    'Laporan Keuangan Internal — Masjid Al Ikhlas',
    `${startDate} s/d ${endDate}`,
    summary,
    transactions.data,
    true
  );

  c.header('Content-Type', 'text/html; charset=utf-8');
  return c.body(html);
});

// --- Export CSV raw data ---
adminRoutes.get('/export/csv', async (c) => {
  const type = c.req.query('type');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');

  const transactions = await getTransactions(1, 10000, type ?? undefined, startDate ?? undefined, endDate ?? undefined);
  const csv = generateCsv(transactions.data, true);

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="data-transaksi-${new Date().toISOString().split('T')[0]}.csv"`);
  return c.body(csv);
});

// --- Users Management ---

adminRoutes.get('/users', async (c) => {
  const page = Number(c.req.query('page') ?? '1');
  const limit = Number(c.req.query('limit') ?? '20');
  const result = await getUsers(page, limit);
  return c.json({ success: true, data: result });
});

adminRoutes.post(
  '/users',
  validateBody({
    username: { type: 'string', required: true, min: 3, max: 50 },
    email: { type: 'string', required: true },
    password: { type: 'string', required: true, min: 8 },
  }),
  async (c) => {
    const body = c.get('body') as { username: string; email: string; password: string };
    const user = await createUser(body);
    return c.json({ success: true, data: user }, 201);
  }
);

adminRoutes.put(
  '/users/:id',
  validateBody({
    username: { type: 'string', required: false, min: 3, max: 50 },
    email: { type: 'string', required: false },
    password: { type: 'string', required: false, min: 8 },
    role: { type: 'string', required: false, enum: ['admin'] },
  }),
  async (c) => {
    const id = c.req.param('id') as string;
    const body = c.get('body') as unknown as { username?: string; email?: string; password?: string; role?: 'admin' };
    const user = await updateUser(id, body);
    if (!user) return c.json({ success: false, error: 'User tidak ditemukan' }, 404);
    return c.json({ success: true, data: user });
  }
);

adminRoutes.delete('/users/:id', async (c) => {
  const id = c.req.param('id') as string;
  const deleted = await deleteUser(id);
  if (!deleted) return c.json({ success: false, error: 'User tidak ditemukan' }, 404);
  return c.json({ success: true, data: { message: 'User berhasil dihapus' } });
});

export default adminRoutes;
