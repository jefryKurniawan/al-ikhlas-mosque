import { Hono } from 'hono';
import { authGuard } from '../middleware/auth-guard.js';
import { validateBody } from '../middleware/validate.js';
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
} from '../db/queries.js';
import { generateCsv, generateReportHtml } from '../lib/export.js';
import { getDateRange } from '../../shared/date-range.js';

const adminRoutes = new Hono();

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
    const body = await c.req.json();
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

    const body = await c.req.json();
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
    const body = await c.req.json();
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
    sort_order: { type: 'number', required: false },
  }),
  async (c) => {
    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID tidak valid' }, 400);
    }

    const body = await c.req.json();
    const tier = await updateQurbanTier(id, body);

  if (!tier) {
    return c.json({ success: false, error: 'Tier tidak ditemukan' }, 404);
  }

  return c.json({ success: true, data: tier });
});

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
    event_date: { type: 'string', required: true },
  }),
  async (c) => {
    const body = await c.req.json();
    const activity = await createActivity(body);
    return c.json({ success: true, data: activity }, 201);
  }
);

adminRoutes.put(
  '/cms/activities/:id',
  validateBody({
    title: { type: 'string', required: false },
    event_date: { type: 'string', required: false },
    description: { type: 'string', required: false },
  }),
  async (c) => {
    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID tidak valid' }, 400);
    }

    const body = await c.req.json();
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

adminRoutes.post('/reports', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.type || !body?.year) {
    return c.json({ success: false, error: 'type dan year wajib diisi' }, 400);
  }

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
adminRoutes.post('/reports/csv', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.type || !body?.year) {
    return c.json({ success: false, error: 'type dan year wajib diisi' }, 400);
  }

  const { startDate, endDate } = getDateRange(body.type, body.year, body.month);
  const transactions = await getTransactions(1, 10000, undefined, startDate, endDate);
  const csv = generateCsv(transactions.data, true);

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="laporan-internal-${body.type}-${body.year}.csv"`);
  return c.body(csv);
});

// --- Export HTML/PDF (internal, with donor names) ---
adminRoutes.post('/reports/pdf', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.type || !body?.year) {
    return c.json({ success: false, error: 'type dan year wajib diisi' }, 400);
  }

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

export default adminRoutes;
