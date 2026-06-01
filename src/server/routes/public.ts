import { Hono } from 'hono';
import type { Env } from 'hono';

type AppEnv = Env & { Variables: { body: Record<string, unknown> } };
import {
  getQurbanTiers,
  getActivities,
  getReportSummary,
  getTransactions,
  getJimpitanReport,
  getZakatReport,
  getQurbanReport,
} from '../db/queries.js';
import {
  generateCsv,
  generateReportHtml,
  generateJimpitanHtml,
  generateZakatHtml,
  generateQurbanHtml,
} from '../lib/export.js';
import { getDateRange } from '../../shared/date-range.js';
import { validateBody, reportSchema } from '../middleware/validate.js';

const publicRoutes = new Hono<AppEnv>();

// --- Prayer Times (proxy to MyQuran API, 1-hour cache) ---
// City ID 1613 = KAB. MAGETAN (Kemenag)
const MYQURAN_CITY_ID = '1613';

interface CachedPrayerTimes {
  data: { name: string; time: string }[];
  fetchedAt: number;
}

const prayerCache = new Map<string, CachedPrayerTimes>();
const PRAYER_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Cleanup expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of prayerCache) {
    if (now - entry.fetchedAt > PRAYER_CACHE_TTL) prayerCache.delete(key);
  }
}, 10 * 60 * 1000);

publicRoutes.get('/prayer-times', async (c) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const cacheKey = `${year}-${month}-${day}`;

    // Check cache
    const cached = prayerCache.get(cacheKey);
    if (cached && now.getTime() - cached.fetchedAt < PRAYER_CACHE_TTL) {
      return c.json({ success: true, data: cached.data });
    }

    const url = `https://api.myquran.com/v2/sholat/jadwal/${MYQURAN_CITY_ID}/${year}/${month}/${day}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('Gagal mengambil jadwal sholat');

    const data = await response.json() as Record<string, unknown>;
    const jadwal = (data['data'] as Record<string, unknown>)?.['jadwal'] as Record<string, string>;

    const prayerTimes = [
      { name: 'Subuh', time: jadwal['subuh'] ?? '-' },
      { name: 'Terbit', time: jadwal['terbit'] ?? '-' },
      { name: 'Dzuhur', time: jadwal['dzuhur'] ?? '-' },
      { name: 'Ashar', time: jadwal['ashar'] ?? '-' },
      { name: 'Maghrib', time: jadwal['maghrib'] ?? '-' },
      { name: 'Isya', time: jadwal['isya'] ?? '-' },
    ];

    // Update cache
    prayerCache.set(cacheKey, { data: prayerTimes, fetchedAt: now.getTime() });

    return c.json({ success: true, data: prayerTimes });
  } catch (err) {
    console.error('Prayer times error:', err);
    return c.json(
      { success: false, error: 'Gagal mengambil jadwal sholat' },
      502
    );
  }
});

// --- Qurban Tiers (active only) ---
publicRoutes.get('/qurban-tiers', async (c) => {
  const tiers = await getQurbanTiers(true);
  return c.json({ success: true, data: tiers });
});

// --- Activities (active only) ---
publicRoutes.get('/activities', async (c) => {
  const activitiesList = await getActivities(true);
  return c.json({ success: true, data: activitiesList });
});

// --- Public Report (anonymous, no donor names) ---
publicRoutes.post('/reports', validateBody(reportSchema), async (c) => {
  const body = c.get('body') as { type: string; year: number; month?: number };
  const { startDate, endDate } = getDateRange(body.type, body.year, body.month);
  const summary = await getReportSummary(startDate, endDate);

  return c.json({
    success: true,
    data: {
      ...summary,
      periode: `${startDate} s/d ${endDate}`,
    },
  });
});

// --- Public CSV Export (anonymous) ---
publicRoutes.post('/reports/csv', validateBody(reportSchema), async (c) => {
  const body = c.get('body') as { type: string; year: number; month?: number };
  const { startDate, endDate } = getDateRange(body.type, body.year, body.month);
  const transactions = await getTransactions(1, 10000, undefined, startDate, endDate);
  const csv = generateCsv(transactions.data, false); // false = no donor names

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="laporan-publik-${body.type}-${body.year}.csv"`);
  return c.body(csv);
});

// --- Public HTML/PDF Export (anonymous) ---
publicRoutes.post('/reports/pdf', validateBody(reportSchema), async (c) => {
  const body = c.get('body') as { type: string; year: number; month?: number };
  const { startDate, endDate } = getDateRange(body.type, body.year, body.month);
  const summary = await getReportSummary(startDate, endDate);

  const html = generateReportHtml(
    'Laporan Keuangan Publik — Masjid Al Ikhlas',
    `${startDate} s/d ${endDate}`,
    summary,
    undefined, // no transaction details for public
    false // no donor names
  );

  c.header('Content-Type', 'text/html; charset=utf-8');
  return c.body(html);
});

// ============================================================
// Specialized Report Endpoints (Public)
// ============================================================

// --- Ringkasan (Bulanan) Report ---
publicRoutes.get('/reports/bulanan', async (c) => {
  const year = Number(c.req.query('year') ?? new Date().getFullYear());
  const month = Number(c.req.query('month') ?? new Date().getMonth() + 1);

  const { startDate, endDate } = getDateRange('bulanan', year, month);
  const summary = await getReportSummary(startDate, endDate);

  return c.json({
    success: true,
    data: {
      ...summary,
      periode: `${startDate} s/d ${endDate}`,
    },
  });
});

// --- Jimpitan Report ---
publicRoutes.get('/reports/jimpitan', async (c) => {
  const year = Number(c.req.query('year') ?? new Date().getFullYear());
  const month = c.req.query('month') ? Number(c.req.query('month')) : undefined;

  const { startDate, endDate } = getDateRange('bulanan', year, month);
  const report = await getJimpitanReport(startDate, endDate);
  return c.json({ success: true, data: report });
});

publicRoutes.get('/reports/jimpitan/csv', async (c) => {
  const year = Number(c.req.query('year') ?? new Date().getFullYear());
  const month = c.req.query('month') ? Number(c.req.query('month')) : undefined;

  const { startDate, endDate } = getDateRange('bulanan', year, month);
  const report = await getJimpitanReport(startDate, endDate);

  // Custom CSV for jimpitan recap
  const headers = ['RT', 'Total (Rp)'];
  const rows = report.recapPerRT.map(r => `"${r.rt}","${r.total}"`);
  const csv = [headers.join(','), ...rows, `"TOTAL","${report.totalKeseluruhan}"`].join('\n');

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="laporan-jimpitan-${year}${month ? `-${String(month).padStart(2, '0')}` : ''}.csv"`);
  return c.body(csv);
});

publicRoutes.get('/reports/jimpitan/html', async (c) => {
  const year = Number(c.req.query('year') ?? new Date().getFullYear());
  const month = c.req.query('month') ? Number(c.req.query('month')) : undefined;

  const { startDate, endDate } = getDateRange('bulanan', year, month);
  const report = await getJimpitanReport(startDate, endDate);
  const html = generateJimpitanHtml(report);

  c.header('Content-Type', 'text/html; charset=utf-8');
  return c.body(html);
});

// --- Zakat Report ---
publicRoutes.get('/reports/zakat', async (c) => {
  const year = Number(c.req.query('year') ?? new Date().getFullYear());

  // Zakat period: around Ramadhan (Feb-Apr)
  const { startDate, endDate } = getDateRange('setelah_idul_fitri', year);
  const report = await getZakatReport(startDate, endDate);
  return c.json({ success: true, data: report });
});

publicRoutes.get('/reports/zakat/csv', async (c) => {
  const year = Number(c.req.query('year') ?? new Date().getFullYear());
  const { startDate, endDate } = getDateRange('setelah_idul_fitri', year);
  const report = await getZakatReport(startDate, endDate);
  const csv = generateCsv(report.transactions, true);

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="laporan-zakat-${year}.csv"`);
  return c.body(csv);
});

publicRoutes.get('/reports/zakat/html', async (c) => {
  const year = Number(c.req.query('year') ?? new Date().getFullYear());
  const { startDate, endDate } = getDateRange('setelah_idul_fitri', year);
  const report = await getZakatReport(startDate, endDate);
  const html = generateZakatHtml(report);

  c.header('Content-Type', 'text/html; charset=utf-8');
  return c.body(html);
});

// --- Ramadhan Report ---
// --- Qurban Report ---
publicRoutes.get('/reports/qurban', async (c) => {
  const year = Number(c.req.query('year') ?? new Date().getFullYear());
  const report = await getQurbanReport(year);
  return c.json({ success: true, data: report });
});

publicRoutes.get('/reports/qurban/csv', async (c) => {
  const year = Number(c.req.query('year') ?? new Date().getFullYear());
  const report = await getQurbanReport(year);

  // Custom CSV for qurban donors
  const headers = ['Nama', 'Jenis Hewan', 'Porsi', 'Jumlah (Rp)'];
  const rows = report.donors.map(d => `"${d.name}","${d.animalType}","${d.portion}","${d.amount}"`);
  const csv = [headers.join(','), ...rows].join('\n');

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="laporan-qurban-${year}.csv"`);
  return c.body(csv);
});

publicRoutes.get('/reports/qurban/html', async (c) => {
  const year = Number(c.req.query('year') ?? new Date().getFullYear());
  const report = await getQurbanReport(year);
  const html = generateQurbanHtml(report);

  c.header('Content-Type', 'text/html; charset=utf-8');
  return c.body(html);
});

// --- List available report types ---
publicRoutes.get('/reports', (c) => {
  return c.json({
    success: true,
    data: [
      { type: 'bulanan', label: 'Laporan Bulanan', params: 'year, month' },
      { type: 'tahunan', label: 'Laporan Tahunan', params: 'year' },
      { type: 'jimpitan', label: 'Laporan Jimpitan', params: 'year, month (opsional)' },
      { type: 'zakat', label: 'Laporan Zakat & Sedekah', params: 'year' },
      { type: 'qurban', label: 'Laporan Idul Adha & Qurban', params: 'year' },
    ],
  });
});


export default publicRoutes;
