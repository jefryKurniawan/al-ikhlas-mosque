import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Wallet, TrendingUp, TrendingDown, Scale, Loader2, AlertCircle } from 'lucide-preact';
import { api } from '../../lib/api';
import type { ReportSummary, Transaction, PaginatedResponse } from '../../../shared/types';
import s from './Dashboard.module.css';

interface Props {
  path?: string;
}

export function Dashboard(_props: Props) {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    Promise.all([
      api.post<ReportSummary>('/api/admin/reports', { type: 'bulanan', year, month }),
      api.get<PaginatedResponse<Transaction>>('/api/admin/transactions?limit=5'),
    ])
      .then(([report, txData]) => {
        setSummary(report);
        setRecentTx(txData.data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div class={s.loader}>
        <Loader2 size={24} class="spin" />
        <span>Memuat dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div class={s.error}>
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  const now = new Date();
  const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div class={s.dashboard}>
      <div class={s.header}>
        <h1>Dashboard</h1>
        <p class={s.period}>Periode: {monthName}</p>
      </div>

      {/* Summary Cards */}
      <div class={s.statsGrid}>
        <div class={s.statCard}>
          <div class={`${s.statIcon} ${s.statIconIn}`}>
            <TrendingUp size={20} />
          </div>
          <div class={s.statInfo}>
            <span class={s.statLabel}>Total Pemasukan</span>
            <span class={s.statValue}>{formatCurrency(totalPemasukan(summary))}</span>
          </div>
        </div>

        <div class={s.statCard}>
          <div class={`${s.statIcon} ${s.statIconOut}`}>
            <TrendingDown size={20} />
          </div>
          <div class={s.statInfo}>
            <span class={s.statLabel}>Total Pengeluaran</span>
            <span class={s.statValue}>{formatCurrency(summary?.pengeluaran ?? 0)}</span>
          </div>
        </div>

        <div class={s.statCard}>
          <div class={`${s.statIcon} ${s.statIconSaldo}`}>
            <Scale size={20} />
          </div>
          <div class={s.statInfo}>
            <span class={s.statLabel}>Saldo</span>
            <span class={s.statValue}>{formatCurrency(summary?.saldo ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      {summary && (
        <div class={s.breakdownGrid}>
          <div class={s.breakdownCard}>
            <h3 class={s.breakdownTitle}>Pemasukan per Jenis</h3>
            <div class={s.breakdownList}>
              {(['jimpitan', 'hibah', 'zakat', 'sedekah'] as const).map(type => (
                <div key={type} class={s.breakdownRow}>
                  <span class={s.breakdownLabel}>{typeLabels[type]}</span>
                  <span class={s.breakdownAmount}>{formatCurrency(summary.pemasukan[type] ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div class={s.breakdownCard}>
            <h3 class={s.breakdownTitle}>Pengeluaran per Kategori</h3>
            <div class={s.breakdownList}>
              {(['operasional', 'perawatan', 'sosial'] as const).map(cat => (
                <div key={cat} class={s.breakdownRow}>
                  <span class={s.breakdownLabel}>{catLabels[cat]}</span>
                  <span class={s.breakdownAmount}>{formatCurrency(summary.pengeluaranPerKategori[cat] ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div class={s.recentSection}>
        <h3 class={s.recentTitle}>Transaksi Terakhir</h3>
        <div class={s.recentTable}>
          <table class={s.table}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Keterangan</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map(tx => (
                <tr key={tx.id}>
                  <td>{formatDate(tx.date)}</td>
                  <td>
                    <span class={`${s.badge} ${s[`badge${capitalize(tx.type)}`]}`}>
                      {typeLabels[tx.type] ?? tx.type}
                    </span>
                  </td>
                  <td class={s.txDesc}>{tx.description}</td>
                  <td class={tx.type === 'pengeluaran' ? s.amountOut : s.amountIn}>
                    {tx.type === 'pengeluaran' ? '-' : '+'}{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
              {recentTx.length === 0 && (
                <tr>
                  <td colSpan={4} class={s.empty}>Belum ada transaksi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const typeLabels: Record<string, string> = {
  jimpitan: 'Jimpitan',
  hibah: 'Hibah',
  zakat: 'Zakat',
  sedekah: 'Sedekah',
  pengeluaran: 'Pengeluaran',
};

const catLabels: Record<string, string> = {
  operasional: 'Operasional',
  perawatan: 'Perawatan',
  sosial: 'Sosial',
};

function totalPemasukan(s: ReportSummary | null): number {
  if (!s) return 0;
  return Object.values(s.pemasukan).reduce((a, b) => a + b, 0);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
