import { Hono } from 'hono';
import type { Env } from 'hono';

type AppEnv = Env & { Variables: { body: Record<string, unknown> } };
import { getQurbanTiers, getActivities, getReportSummary, getTransactions } from '../db/queries.js';
import { generateCsv, generateReportHtml } from '../lib/export.js';
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
  const activities = await getActivities(true);
  return c.json({ success: true, data: activities });
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


export default publicRoutes;
