import { Hono } from 'hono';
import { getQurbanTiers, getActivities, getReportSummary, getTransactions } from '../db/queries.js';
import { generateCsv, generateReportHtml } from '../lib/export.js';
import { getDateRange } from '../../shared/date-range.js';

const publicRoutes = new Hono();

// --- Prayer Times (proxy to Aladhan API) ---
publicRoutes.get('/prayer-times', async (c) => {
  try {
    const city = c.req.query('city') ?? 'Magetan';
    const response = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Indonesia&method=2`
    );

    if (!response.ok) throw new Error('Gagal mengambil jadwal sholat');

    const data = await response.json() as Record<string, unknown>;
    const timings = (data['data'] as Record<string, unknown>)?.['timings'] as Record<string, string>;

    const prayerTimes = [
      { name: 'Subuh', time: timings['Fajr'] ?? '-' },
      { name: 'Terbit', time: timings['Sunrise'] ?? '-' },
      { name: 'Dzuhur', time: timings['Dhuhr'] ?? '-' },
      { name: 'Ashar', time: timings['Asr'] ?? '-' },
      { name: 'Maghrib', time: timings['Maghrib'] ?? '-' },
      { name: 'Isya', time: timings['Isha'] ?? '-' },
    ];

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
  const activities = await getActivities(true);
  return c.json({ success: true, data: activities });
});

// --- Public Report (anonymous, no donor names) ---
publicRoutes.post('/reports', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.type || !body?.year) {
    return c.json({ success: false, error: 'type dan year wajib diisi' }, 400);
  }

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
publicRoutes.post('/reports/csv', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.type || !body?.year) {
    return c.json({ success: false, error: 'type dan year wajib diisi' }, 400);
  }

  const { startDate, endDate } = getDateRange(body.type, body.year, body.month);
  const transactions = await getTransactions(1, 10000, undefined, startDate, endDate);
  const csv = generateCsv(transactions.data, false); // false = no donor names

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="laporan-publik-${body.type}-${body.year}.csv"`);
  return c.body(csv);
});

// --- Public HTML/PDF Export (anonymous) ---
publicRoutes.post('/reports/pdf', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.type || !body?.year) {
    return c.json({ success: false, error: 'type dan year wajib diisi' }, 400);
  }

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


export default publicRoutes;
