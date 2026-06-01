import { h } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { Plus, Edit, Trash2, Loader2, AlertCircle, X, ChevronLeft, ChevronRight, Download } from 'lucide-preact';
import { api } from '../../lib/api';
import type { Transaction, TransactionType, PaginatedResponse, CreateTransactionInput } from '../../../shared/types';
import s from './Crud.module.css';

interface Props { path?: string }

const TYPES: { value: TransactionType | ''; label: string }[] = [
  { value: '', label: 'Semua Jenis' },
  { value: 'jimpitan', label: 'Jimpitan' },
  { value: 'hibah', label: 'Hibah' },
  { value: 'zakat', label: 'Zakat' },
  { value: 'sedekah', label: 'Sedekah' },
  { value: 'pengeluaran', label: 'Pengeluaran' },
];

export function Transactions(_props: Props) {
  const [data, setData] = useState<PaginatedResponse<Transaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (typeFilter) params.set('type', typeFilter);
      const result = await api.get<PaginatedResponse<Transaction>>(`/api/admin/transactions?${params}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (input: CreateTransactionInput & { id?: number }) => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/admin/transactions/${editing.id}`, input);
      } else {
        await api.post('/api/admin/transactions', input);
      }
      setModalOpen(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/admin/transactions/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  const handleExport = async () => {
    try {
      const now = new Date();
      const res = await fetch(`/api/admin/export/csv?type=${typeFilter}&start_date=${now.getFullYear()}-01-01&end_date=${now.getFullYear()}-12-31`, { credentials: 'same-origin' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaksi-${now.toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal export CSV');
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div class={s.page}>
      <div class={s.pageHeader}>
        <div>
          <h1>Transaksi</h1>
          <p class={s.pageSubtitle}>Kelola pemasukan dan pengeluaran masjid</p>
        </div>
        <div class={s.pageActions}>
          <button class="btn btn-ghost" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </button>
          <button class="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {/* Filters */}
      <div class={s.filters}>
        <select
          class={s.filterSelect}
          value={typeFilter}
          onChange={(e) => { setTypeFilter((e.target as HTMLSelectElement).value); setPage(1); }}
        >
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div class={s.loader}><Loader2 size={24} class="spin" /><span>Memuat...</span></div>
      ) : error ? (
        <div class={s.error}><AlertCircle size={18} /><span>{error}</span></div>
      ) : (
        <>
          <div class={s.tableWrap}>
            <table class={s.table}>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jenis</th>
                  <th>Keterangan</th>
                  <th>Donatur</th>
                  <th>Jumlah</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map(tx => (
                  <tr key={tx.id}>
                    <td>{formatDate(tx.date)}</td>
                    <td><span class={`${s.badge} ${s[`badge${capitalize(tx.type)}`]}`}>{typeLabels[tx.type]}</span></td>
                    <td class={s.cellDesc}>{tx.description}</td>
                    <td>{tx.donorName || '—'}</td>
                    <td class={tx.type === 'pengeluaran' ? s.amountOut : s.amountIn}>
                      {tx.type === 'pengeluaran' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </td>
                    <td>
                      <div class={s.actions}>
                        <button class={s.actionBtn} onClick={() => { setEditing(tx); setModalOpen(true); }} aria-label="Edit">
                          <Edit size={16} />
                        </button>
                        <button class={`${s.actionBtn} ${s.actionBtnDanger}`} onClick={() => setDeleteId(tx.id as number)} aria-label="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={6} class={s.empty}>Tidak ada transaksi</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div class={s.pagination}>
              <button class={s.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </button>
              <span class={s.pageInfo}>Halaman {page} dari {totalPages}</span>
              <button class={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <TransactionModal
          transaction={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          saving={saving}
        />
      )}

      {/* Delete Confirmation */}
      {deleteId !== null && (
        <div class={s.overlay} onClick={() => setDeleteId(null)}>
          <div class={s.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3>Hapus Transaksi?</h3>
            <p>Transaksi ini akan dihapus permanen.</p>
            <div class={s.confirmActions}>
              <button class="btn btn-ghost" onClick={() => setDeleteId(null)}>Batal</button>
              <button class={`btn ${s.btnDanger}`} onClick={handleDelete}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Modal Form Component ===== */
function TransactionModal({
  transaction,
  onSave,
  onClose,
  saving,
}: {
  transaction: Transaction | null;
  onSave: (input: CreateTransactionInput) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'jimpitan');
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '');
  const [date, setDate] = useState(transaction?.date ?? new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [donorName, setDonorName] = useState(transaction?.donorName ?? '');
  const [category, setCategory] = useState(transaction?.category ?? '');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!amount || !date) return;
    onSave({
      type,
      amount: Number(amount),
      date,
      description: description || undefined,
      donorName: donorName || undefined,
      category: category || undefined,
    });
  };

  return (
    <div class={s.overlay} onClick={onClose}>
      <div class={s.modal} onClick={(e) => e.stopPropagation()}>
        <div class={s.modalHeader}>
          <h3>{transaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
          <button class={s.modalClose} onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>
        <form class={s.modalForm} onSubmit={handleSubmit}>
          <div class={s.formRow}>
            <div class={s.formField}>
              <label class={s.formLabel}>Jenis *</label>
              <select class={s.formInput} value={type} onChange={(e) => setType((e.target as HTMLSelectElement).value as TransactionType)}>
                {TYPES.filter(t => t.value).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div class={s.formField}>
              <label class={s.formLabel}>Jumlah (Rp) *</label>
              <input class={s.formInput} type="number" min="1" value={amount} onInput={(e) => setAmount((e.target as HTMLInputElement).value)} placeholder="0" required />
            </div>
          </div>
          <div class={s.formRow}>
            <div class={s.formField}>
              <label class={s.formLabel}>Tanggal *</label>
              <input class={s.formInput} type="date" value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} required />
            </div>
            <div class={s.formField}>
              <label class={s.formLabel}>Donatur</label>
              <input class={s.formInput} type="text" value={donorName} onInput={(e) => setDonorName((e.target as HTMLInputElement).value)} placeholder="Opsional" />
            </div>
          </div>
          <div class={s.formField}>
            <label class={s.formLabel}>Keterangan</label>
            <input class={s.formInput} type="text" value={description} onInput={(e) => setDescription((e.target as HTMLInputElement).value)} placeholder="Deskripsi transaksi" />
          </div>
          {type === 'pengeluaran' && (
            <div class={s.formField}>
              <label class={s.formLabel}>Kategori</label>
              <select class={s.formInput} value={category} onChange={(e) => setCategory((e.target as HTMLSelectElement).value)}>
                <option value="">Pilih kategori</option>
                <option value="operasional">Operasional</option>
                <option value="perawatan">Perawatan</option>
                <option value="sosial">Sosial</option>
              </select>
            </div>
          )}
          <div class={s.modalActions}>
            <button type="button" class="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" class="btn btn-primary" disabled={saving}>
              {saving ? <><Loader2 size={16} class="spin" /> Menyimpan...</> : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const typeLabels: Record<string, string> = {
  jimpitan: 'Jimpitan', hibah: 'Hibah', zakat: 'Zakat', sedekah: 'Sedekah', pengeluaran: 'Pengeluaran',
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
