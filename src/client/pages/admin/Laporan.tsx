import { h } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Loader2,
  AlertCircle,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Wallet,
  Clock,
} from 'lucide-preact';
import { api } from '../../lib/api';
import type {
  Transaction,
  PaginatedResponse,
} from '../../../shared/types';
import s from './Laporan.module.css';

interface Props {
  path?: string;
}

type Period = 'hari' | 'minggu' | 'bulan' | 'custom';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

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

function getDateRange(period: Period, customYear?: number, customMonth?: number): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  if (period === 'hari') {
    return {
      startDate: fmt(now),
      endDate: fmt(now),
      label: now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    };
  }

  if (period === 'minggu') {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      startDate: fmt(monday),
      endDate: fmt(sunday),
      label: `${monday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    };
  }

  if (period === 'custom' && customYear && customMonth) {
    const firstDay = new Date(customYear, customMonth - 1, 1);
    const lastDay = new Date(customYear, customMonth, 0);
    return {
      startDate: fmt(firstDay),
      endDate: fmt(lastDay),
      label: `${months.find(m => m.value === customMonth)?.label} ${customYear}`,
    };
  }

  // default: bulan ini
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: fmt(firstDay),
    endDate: fmt(lastDay),
    label: now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
  };
}

export function Laporan(_props: Props) {
  const [period, setPeriod] = useState<Period>('bulan');
  const [customYear, setCustomYear] = useState(currentYear);
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const txLimit = 20;

  const { startDate, endDate, label } = getDateRange(period, customYear, customMonth);

  // Summary computed from all fetched transactions
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(txPage),
        limit: String(txLimit),
        start_date: startDate,
        end_date: endDate,
      });
      const data = await api.get<PaginatedResponse<Transaction>>(`/api/admin/transactions?${params}`);
      setTransactions(data.data);
      setTxTotal(data.total);

      // For summary: fetch all transactions in range (up to 1000)
      if (txPage === 1) {
        const allParams = new URLSearchParams({
          page: '1',
          limit: '1000',
          start_date: startDate,
          end_date: endDate,
        });
        const allData = await api.get<PaginatedResponse<Transaction>>(`/api/admin/transactions?${allParams}`);
        setAllTransactions(allData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [txPage, startDate, endDate]);

  useEffect(() => {
    setTxPage(1);
  }, [period, customYear, customMonth]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Compute summary from all transactions
  const pemasukan: Record<string, number> = { jimpitan: 0, hibah: 0, zakat: 0, sedekah: 0 };
  let pengeluaran = 0;
  const pengeluaranPerKategori: Record<string, number> = { operasional: 0, perawatan: 0, sosial: 0 };

  for (const tx of allTransactions) {
    if (tx.type === 'pengeluaran') {
      pengeluaran += tx.amount;
      const cat = tx.category ?? 'lainnya';
      pengeluaranPerKategori[cat] = (pengeluaranPerKategori[cat] ?? 0) + tx.amount;
    } else {
      pemasukan[tx.type] = (pemasukan[tx.type] ?? 0) + tx.amount;
    }
  }

  const totalPemasukan = Object.values(pemasukan).reduce((a, b) => a + b, 0);
  const saldo = totalPemasukan - pengeluaran;

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const res = await fetch(`/api/admin/reports/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bulanan', year: customYear, month: customMonth }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-${startDate}.${format === 'csv' ? 'csv' : 'html'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Gagal mengunduh laporan');
    }
  };

  const totalPages = Math.ceil(txTotal / txLimit);

  return (
    <div class={s.page}>
      {/* Header */}
      <div class={s.header}>
        <div>
          <h1>Laporan Keuangan</h1>
          <p class={s.headerSub}>{label}</p>
        </div>
        <div class={s.exportActions}>
          <button class="btn btn-ghost" onClick={() => handleExport('csv')}>
            <Download size={16} /> CSV
          </button>
          <button class="btn btn-ghost" onClick={() => handleExport('pdf')}>
            <Printer size={16} /> Cetak
          </button>
        </div>
      </div>

      {/* Period Presets */}
      <div class={s.presets}>
        <button class={`${s.preset}${period === 'hari' ? ` ${s.presetActive}` : ''}`} onClick={() => setPeriod('hari')}>
          <Clock size={14} /> Hari Ini
        </button>
        <button class={`${s.preset}${period === 'minggu' ? ` ${s.presetActive}` : ''}`} onClick={() => setPeriod('minggu')}>
          <Calendar size={14} /> Minggu Ini
        </button>
        <button class={`${s.preset}${period === 'bulan' ? ` ${s.presetActive}` : ''}`} onClick={() => setPeriod('bulan')}>
          <Calendar size={14} /> Bulan Ini
        </button>
        <button class={`${s.preset}${period === 'custom' ? ` ${s.presetActive}` : ''}`} onClick={() => setPeriod('custom')}>
          <Calendar size={14} /> Pilih Bulan
        </button>
      </div>

      {/* Custom month/year picker */}
      {period === 'custom' && (
        <div class={s.filters}>
          <select
            class={s.filterSelect}
            value={customMonth}
            onChange={e => setCustomMonth(Number((e.target as HTMLSelectElement).value))}
          >
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            class={s.filterSelect}
            value={customYear}
            onChange={e => setCustomYear(Number((e.target as HTMLSelectElement).value))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div class={s.loader}>
          <Loader2 size={24} class="spin" />
          <span>Memuat laporan...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div class={s.error}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && !error && allTransactions.length > 0 && (
        <div class={s.content}>
          <div class={s.statGrid}>
            <div class={s.statCard}>
              <div class={`${s.statIcon} ${s.statIconIn}`}>
                <TrendingUp size={20} />
              </div>
              <div class={s.statInfo}>
                <span class={s.statLabel}>Total Pemasukan</span>
                <span class={s.statValue}>{formatCurrency(totalPemasukan)}</span>
              </div>
            </div>

            <div class={s.statCard}>
              <div class={`${s.statIcon} ${s.statIconOut}`}>
                <TrendingDown size={20} />
              </div>
              <div class={s.statInfo}>
                <span class={s.statLabel}>Total Pengeluaran</span>
                <span class={s.statValue}>{formatCurrency(pengeluaran)}</span>
              </div>
            </div>

            <div class={s.statCard}>
              <div class={`${s.statIcon} ${s.statIconSaldo}`}>
                <Scale size={20} />
              </div>
              <div class={s.statInfo}>
                <span class={s.statLabel}>Saldo</span>
                <span class={s.statValue}>{formatCurrency(saldo)}</span>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div class={s.breakdownGrid}>
            <div class={s.breakdownCard}>
              <h3 class={s.breakdownTitle}>Pemasukan per Jenis</h3>
              <div class={s.breakdownList}>
                {(['jimpitan', 'hibah', 'zakat', 'sedekah'] as const).map(type => (
                  <div key={type} class={s.breakdownRow}>
                    <span class={s.breakdownLabel}>{typeLabels[type]}</span>
                    <span class={s.breakdownAmount}>{formatCurrency(pemasukan[type] ?? 0)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div class={s.breakdownCard}>
              <h3 class={s.breakdownTitle}>Pengeluaran per Kategori</h3>
              <div class={s.breakdownList}>
                {['operasional', 'perawatan', 'sosial'].map(cat => (
                  <div key={cat} class={s.breakdownRow}>
                    <span class={s.breakdownLabel}>{catLabels[cat] ?? cat}</span>
                    <span class={s.breakdownAmount}>{formatCurrency(pengeluaranPerKategori[cat] ?? 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && allTransactions.length === 0 && (
        <div class={s.empty}>Tidak ada transaksi pada periode ini</div>
      )}

      {/* Transaction Detail Table */}
      {!loading && !error && transactions.length > 0 && (
        <div class={s.txSection}>
          <h3 class={s.txTitle}>
            <Wallet size={16} /> Detail Transaksi ({txTotal})
          </h3>

          <div class={s.tableWrap}>
            <table class={s.table}>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jenis</th>
                  <th>Donatur</th>
                  <th>Keterangan</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{formatDate(tx.date)}</td>
                    <td>
                      <span class={`${s.badge} ${s[`badge${capitalize(tx.type)}`]}`}>
                        {typeLabels[tx.type] ?? tx.type}
                      </span>
                    </td>
                    <td>{tx.donorName ?? '-'}</td>
                    <td class={s.cellDesc}>{tx.description}</td>
                    <td class={tx.type === 'pengeluaran' ? s.amountOut : s.amountIn}>
                      {tx.type === 'pengeluaran' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div class={s.pagination}>
              <button class={s.pageBtn} disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </button>
              <span class={s.pageInfo}>Halaman {txPage} dari {totalPages}</span>
              <button class={s.pageBtn} disabled={txPage >= totalPages} onClick={() => setTxPage(p => p + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ===== Helpers ===== */

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

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
