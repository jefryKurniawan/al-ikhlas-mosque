/**
 * Get the last day of a given month (1-indexed).
 * new Date(year, month, 0) returns the last day of the previous month,
 * so passing `month` directly gives the last day of `month`.
 */
function lastDay(year: number, month: number): string {
  return String(new Date(year, month, 0).getDate()).padStart(2, '0');
}

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
      return { startDate: `${year}-${pad(m)}-01`, endDate: `${year}-${pad(m)}-${lastDay(year, m)}` };
    }
    case 'tahunan':
      return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
    case 'setelah_idul_adha':
      return { startDate: `${year}-06-17`, endDate: `${year}-07-17` };
    case 'setelah_idul_fitri':
      return { startDate: `${year}-04-10`, endDate: `${year}-05-10` };
    case 'sebelum_ramadhan':
      return { startDate: `${year}-02-01`, endDate: `${year}-02-${lastDay(year, 2)}` };
    default:
      return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
  }
}
