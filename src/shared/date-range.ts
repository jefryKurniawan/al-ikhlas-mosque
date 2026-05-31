/**
 * Get date range from report type.
 */
export function getDateRange(
  type: string,
  year: number,
  month?: number
): { startDate: string; endDate: string } {
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
