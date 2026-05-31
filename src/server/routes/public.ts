import { Hono } from 'hono';
import { getQurbanTiers, getActivities, getReportSummary } from '../db/queries.js';

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

// --- Helper: date range from report type ---
function getDateRange(
  type: string,
  year: number,
  month?: number
): { startDate: string; endDate: string } {
  const pad = (n: number) => String(n).padStart(2, '0');

  switch (type) {
    case 'bulanan': {
      const m = month ?? new Date().getMonth() + 1;
      return {
        startDate: `${year}-${pad(m)}-01`,
        endDate: `${year}-${pad(m)}-31`,
      };
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

export default publicRoutes;
