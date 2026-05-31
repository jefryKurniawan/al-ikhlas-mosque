import type { Transaction } from '../../shared/types.js';

/**
 * Generate CSV string from transactions array.
 */
export function generateCsv(transactions: Transaction[], includeDonor: boolean = true): string {
  const headers = includeDonor
    ? ['ID', 'Tanggal', 'Tipe', 'Jumlah (Rp)', 'Donatur', 'Keterangan', 'Kategori']
    : ['ID', 'Tanggal', 'Tipe', 'Jumlah (Rp)', 'Keterangan', 'Kategori'];

  const rows = transactions.map(t => {
    const base = [
      t.id,
      t.date,
      t.type,
      t.amount,
      t.description ?? '',
      t.category ?? '',
    ];
    if (includeDonor) {
      base.splice(4, 0, t.donor_name ?? '');
    }
    return base.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generate simple HTML table for PDF/print.
 */
export function generateReportHtml(
  title: string,
  periode: string,
  summary: {
    pemasukan: Record<string, number>;
    pengeluaran: number;
    pengeluaran_per_kategori: Record<string, number>;
    saldo: number;
  },
  transactions?: Transaction[],
  includeDonor: boolean = true
): string {
  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; color: #1a1a1a; }
    h1 { color: #1C3B24; font-size: 24px; margin-bottom: 4px; }
    h2 { color: #2E6F40; font-size: 18px; margin-top: 24px; }
    .periode { color: #666; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { padding: 8px 12px; border: 1px solid #e0e0e0; text-align: left; }
    th { background: #1C3B24; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    .amount { text-align: right; }
    .summary-row { font-weight: bold; background: #f0f5f2; }
    .saldo { font-size: 18px; color: #1C3B24; font-weight: bold; margin-top: 16px; }
    .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="periode">Periode: ${periode}</p>

  <h2>Pemasukan</h2>
  <table>
    <tr><th>Kategori</th><th class="amount">Jumlah</th></tr>
    ${Object.entries(summary.pemasukan).map(([k, v]) =>
      `<tr><td>${k.charAt(0).toUpperCase() + k.slice(1)}</td><td class="amount">${fmt(v)}</td></tr>`
    ).join('')}
    <tr class="summary-row"><td>Total Pemasukan</td><td class="amount">${fmt(Object.values(summary.pemasukan).reduce((a, b) => a + b, 0))}</td></tr>
  </table>

  <h2>Pengeluaran</h2>
  <table>
    <tr><th>Kategori</th><th class="amount">Jumlah</th></tr>
    ${Object.entries(summary.pengeluaran_per_kategori).map(([k, v]) =>
      `<tr><td>${k.charAt(0).toUpperCase() + k.slice(1)}</td><td class="amount">${fmt(v)}</td></tr>`
    ).join('')}
    <tr class="summary-row"><td>Total Pengeluaran</td><td class="amount">${fmt(summary.pengeluaran)}</td></tr>
  </table>

  <p class="saldo">Saldo: ${fmt(summary.saldo)}</p>

  ${transactions && transactions.length > 0 ? `
  <h2>Detail Transaksi</h2>
  <table>
    <tr>
      <th>Tanggal</th>
      <th>Tipe</th>
      ${includeDonor ? '<th>Donatur</th>' : ''}
      <th>Keterangan</th>
      <th class="amount">Jumlah</th>
    </tr>
    ${transactions.map(t => `
    <tr>
      <td>${t.date}</td>
      <td>${t.type}</td>
      ${includeDonor ? `<td>${t.donor_name ?? '-'}</td>` : ''}
      <td>${t.description ?? '-'}</td>
      <td class="amount">${fmt(t.amount)}</td>
    </tr>`).join('')}
  </table>` : ''}

  <div class="footer">
    Dicetak pada ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    — Masjid Al Ikhlas, Magetan
  </div>
</body>
</html>`;
}
