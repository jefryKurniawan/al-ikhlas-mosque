import type { Transaction, JimpitanReport, ZakatReport, RamadhanReport, QurbanReport } from '../../shared/types.js';

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
      base.splice(4, 0, t.donorName ?? '');
    }
    return base.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// --- Shared HTML helpers ---

function htmlHead(title: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 40px auto; color: #1a1a1a; padding: 0 20px; }
    .kop { text-align: center; border-bottom: 3px solid #1C3B24; padding-bottom: 16px; margin-bottom: 24px; }
    .kop h1 { color: #1C3B24; font-size: 22px; }
    .kop p { color: #666; font-size: 13px; }
    h2 { color: #2E6F40; font-size: 17px; margin: 20px 0 10px; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; }
    .periode { color: #666; margin-bottom: 20px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
    th, td { padding: 8px 10px; border: 1px solid #e0e0e0; text-align: left; }
    th { background: #1C3B24; color: white; font-weight: 600; }
    tr:nth-child(even) { background: #f9f9f9; }
    .amount { text-align: right; }
    .summary-row { font-weight: bold; background: #f0f5f2; }
    .saldo { font-size: 17px; color: #1C3B24; font-weight: bold; margin: 16px 0; padding: 12px; background: #f0f5f2; border-radius: 8px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
    .stat-card { padding: 14px; background: #f7f8f7; border-radius: 8px; border: 1px solid #e8e8e8; }
    .stat-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.04em; }
    .stat-value { font-size: 18px; font-weight: 700; color: #1C3B24; margin-top: 4px; }
    .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 12px; }
  </style>
</head>`;
}

function htmlFooter(): string {
  return `<div class="footer">
    Dicetak pada ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    — Masjid Al Ikhlas Gonggang, Magetan
  </div>
</body>
</html>`;
}

function fmt(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function txTable(transactions: Transaction[], includeDonor: boolean = false): string {
  if (transactions.length === 0) return '<p style="color:#888;font-size:13px;">Tidak ada transaksi pada periode ini.</p>';
  return `<table>
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
      ${includeDonor ? `<td>${t.donorName ?? '-'}</td>` : ''}
      <td>${t.description ?? '-'}</td>
      <td class="amount">${fmt(t.amount)}</td>
    </tr>`).join('')}
  </table>`;
}

/**
 * Generate simple HTML table for PDF/print (general report).
 */
export function generateReportHtml(
  title: string,
  periode: string,
  summary: {
    pemasukan: Record<string, number>;
    pengeluaran: number;
    pengeluaranPerKategori: Record<string, number>;
    saldo: number;
  },
  transactions?: Transaction[],
  includeDonor: boolean = true
): string {
  return `${htmlHead(title)}
<body>
  <div class="kop">
    <h1>Laporan Keuangan</h1>
    <p>Masjid Al Ikhlas Gonggang, Biung, Poncol, Magetan</p>
  </div>
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
    ${Object.entries(summary.pengeluaranPerKategori).map(([k, v]) =>
      `<tr><td>${k.charAt(0).toUpperCase() + k.slice(1)}</td><td class="amount">${fmt(v)}</td></tr>`
    ).join('')}
    <tr class="summary-row"><td>Total Pengeluaran</td><td class="amount">${fmt(summary.pengeluaran)}</td></tr>
  </table>

  <p class="saldo">Saldo: ${fmt(summary.saldo)}</p>

  ${transactions && transactions.length > 0 ? `
  <h2>Detail Transaksi</h2>
  ${txTable(transactions, includeDonor)}` : ''}

  ${htmlFooter()}`;
}

// --- Specialized Report Templates ---

export function generateJimpitanHtml(report: JimpitanReport): string {
  return `${htmlHead('Laporan Jimpitan')}
<body>
  <div class="kop">
    <h1>Laporan Jimpitan</h1>
    <p>Masjid Al Ikhlas Gonggang, Biung, Poncol, Magetan</p>
  </div>
  <p class="periode">Periode: ${report.periode}</p>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-label">Total Terkumpul</div>
      <div class="stat-value">${fmt(report.totalKeseluruhan)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Jumlah RT</div>
      <div class="stat-value">${report.recapPerRT.length} RT</div>
    </div>
  </div>

  <h2>Rekap Per RT</h2>
  <table>
    <tr><th>RT</th><th class="amount">Total</th></tr>
    ${report.recapPerRT.map(r =>
      `<tr><td>${r.rt}</td><td class="amount">${fmt(r.total)}</td></tr>`
    ).join('')}
    <tr class="summary-row"><td>Total</td><td class="amount">${fmt(report.totalKeseluruhan)}</td></tr>
  </table>

  <h2>Detail Transaksi</h2>
  ${txTable(report.transactions)}

  ${htmlFooter()}`;
}

export function generateZakatHtml(report: ZakatReport): string {
  return `${htmlHead('Laporan Zakat & Sedekah')}
<body>
  <div class="kop">
    <h1>Laporan Zakat & Sedekah</h1>
    <p>Masjid Al Ikhlas Gonggang, Biung, Poncol, Magetan</p>
  </div>
  <p class="periode">Periode: ${report.periode}</p>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-label">Total Zakat</div>
      <div class="stat-value">${fmt(report.totalZakat)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Sedekah</div>
      <div class="stat-value">${fmt(report.totalSedekah)}</div>
    </div>
  </div>
  <p class="saldo">Total Keseluruhan: ${fmt(report.totalKeseluruhan)}</p>

  <h2>Detail Transaksi</h2>
  ${txTable(report.transactions, true)}

  ${htmlFooter()}`;
}

export function generateRamadhanHtml(report: RamadhanReport): string {
  return `${htmlHead('Laporan Ramadhan')}
<body>
  <div class="kop">
    <h1>Laporan Keuangan Ramadhan ${report.year}</h1>
    <p>Masjid Al Ikhlas Gonggang, Biung, Poncol, Magetan</p>
  </div>
  <p class="periode">Periode: ${report.periode}</p>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-label">Total Pemasukan</div>
      <div class="stat-value">${fmt(report.totalPemasukan)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Pengeluaran</div>
      <div class="stat-value">${fmt(report.totalPengeluaran)}</div>
    </div>
  </div>
  <p class="saldo">Saldo: ${fmt(report.saldo)}</p>

  <h2>Pemasukan per Jenis</h2>
  <table>
    <tr><th>Jenis</th><th class="amount">Jumlah</th></tr>
    ${report.pemasukanDetail.map(d =>
      `<tr><td>${d.type.charAt(0).toUpperCase() + d.type.slice(1)}</td><td class="amount">${fmt(d.total)}</td></tr>`
    ).join('')}
  </table>

  <h2>Pengeluaran</h2>
  ${txTable(report.pengeluaranDetail)}

  <h2>Semua Transaksi</h2>
  ${txTable(report.transactions)}

  ${htmlFooter()}`;
}

export function generateQurbanHtml(report: QurbanReport): string {
  return `${htmlHead('Laporan Idul Adha & Qurban')}
<body>
  <div class="kop">
    <h1>Laporan Idul Adha & Qurban ${report.year}</h1>
    <p>Masjid Al Ikhlas Gonggang, Biung, Poncol, Magetan</p>
  </div>
  <p class="periode">Periode: ${report.periode}</p>

  <h2>Daftar Donatur Qurban</h2>
  <table>
    <tr><th>Nama</th><th>Jenis Hewan</th><th>Porsi</th><th class="amount">Jumlah</th></tr>
    ${report.donors.map(d =>
      `<tr><td>${d.name}</td><td>${d.animalType}</td><td>${d.portion}</td><td class="amount">${fmt(d.amount)}</td></tr>`
    ).join('')}
  </table>

  ${report.totalOperasional > 0 ? `
  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-label">Dana Operasional Qurban</div>
      <div class="stat-value">${fmt(report.totalOperasional)}</div>
    </div>
  </div>` : ''}

  ${report.transactions.length > 0 ? `
  <h2>Detail Transaksi Operasional</h2>
  ${txTable(report.transactions)}` : ''}

  ${htmlFooter()}`;
}
