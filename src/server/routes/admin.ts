import { Hono } from 'hono';
import { authGuard } from '../middleware/auth-guard.js';
import { validateBody } from '../middleware/validate.js';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getQurbanTiers,
  createQurbanTier,
  updateQurbanTier,
  deleteQurbanTier,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getReportSummary,
} from '../db/queries.js';

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

adminRoutes.put('/transactions/:id', async (c) => {
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
});

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
  const tiers = await getQurbanTiers(false);
  return c.json({ success: true, data: tiers });
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

adminRoutes.put('/cms/qurban/:id', async (c) => {
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
  const activities = await getActivities(false);
  return c.json({ success: true, data: activities });
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

adminRoutes.put('/cms/activities/:id', async (c) => {
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
});

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

function getDateRange(type: string, year: number, month?: number): { startDate: string; endDate: string } {
  const pad = (n: number) => String(n).padStart(2, '0');

  switch (type) {
    case 'bulanan': {
      const m = month ?? new Date().getMonth() + 1;
      return { startDate: `${year}-${pad(m)}-01`, endDate: `${year}-${pad(m)}-31` };
    }
    case 'tahunan':
      return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
    case 'setelah_idul_adha':
      return { startDate: `${year}-06-17`, endDate: `${year}-07-17` };
    case 'setelah_idul_fitri':
      return { startDate: `${year}-04-10`, endDate: `${year}-05-10` };
    case 'sebelum_ramadhan':
      return { startDate: `${year}-02-01`, endDate: `${year}-02-28` };
    default:
      return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
  }
}

export default adminRoutes;
