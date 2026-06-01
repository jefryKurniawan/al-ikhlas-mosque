import { h } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { Plus, Edit, Trash2, Loader2, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-preact';
import { api } from '../../lib/api';
import type { ZakatRecipient, ZakatRecipientCategory, PaginatedResponse, CreateZakatRecipientInput } from '../../../shared/types';
import s from './Crud.module.css';

interface Props { path?: string }

const CATEGORIES: { value: ZakatRecipientCategory | ''; label: string }[] = [
  { value: '', label: 'Semua Kategori' },
  { value: 'fakir', label: 'Fakir' },
  { value: 'miskin', label: 'Miskin' },
  { value: 'mualaf', label: 'Mualaf' },
  { value: 'gharim', label: 'Gharim' },
  { value: 'fisabilillah', label: 'Fisabilillah' },
  { value: 'ibnu_sabil', label: 'Ibnu Sabil' },
  { value: 'amil', label: 'Amil' },
];

const categoryBadgeClass: Record<string, string> = {
  fakir: 'badgeJimpitan',
  miskin: 'badgeHibah',
  mualaf: 'badgeZakat',
  gharim: 'badgeSedekah',
  fisabilillah: 'badgePengeluaran',
  ibnu_sabil: 'badgeJimpitan',
  amil: 'badgeHibah',
};

export function ZakatRecipients(_props: Props) {
  const [data, setData] = useState<PaginatedResponse<ZakatRecipient> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [catFilter, setCatFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ZakatRecipient | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (catFilter) params.set('category', catFilter);
      const result = await api.get<PaginatedResponse<ZakatRecipient>>(`/api/admin/zakat-recipients?${params}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [page, catFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (input: CreateZakatRecipientInput & { id?: number }) => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/admin/zakat-recipients/${editing.id}`, input);
      } else {
        await api.post('/api/admin/zakat-recipients', input);
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
      await api.delete(`/api/admin/zakat-recipients/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  const totalPages = data ? Math.ceil(data.total / 15) : 0;

  return (
    <div class={s.page}>
      <div class={s.pageHeader}>
        <div>
          <h1>Penerima Zakat</h1>
          <p class={s.pageSubtitle}>Kelola data penerima zakat masjid (internal)</p>
        </div>
        <div class={s.pageActions}>
          <button class="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={16} /> Tambah Penerima
          </button>
        </div>
      </div>

      {/* Filter */}
      <div class={s.filters}>
        <select
          class={s.filterSelect}
          value={catFilter}
          onChange={e => { setCatFilter((e.target as HTMLSelectElement).value); setPage(1); }}
        >
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div class={s.loader}><Loader2 size={24} class="spin" /><span>Memuat data...</span></div>
      )}

      {/* Error */}
      {error && (
        <div class={s.error}><AlertCircle size={18} /><span>{error}</span></div>
      )}

      {/* Table */}
      {!loading && data && (
        <>
          {data.data.length === 0 ? (
            <div class={s.empty}><p>Belum ada data penerima zakat</p></div>
          ) : (
            <div class={s.tableWrap}>
              <table class={s.table}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Nama</th>
                    <th>Alamat</th>
                    <th>Kategori</th>
                    <th>Jumlah</th>
                    <th>Keterangan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(r => (
                    <tr key={r.id}>
                      <td>{formatDate(r.date)}</td>
                      <td><strong>{r.name}</strong></td>
                      <td class={s.cellDesc}>{r.address || '-'}</td>
                      <td>
                        <span class={`${s.badge} ${s[categoryBadgeClass[r.category] ?? 'badgeJimpitan']}`}>
                          {CATEGORIES.find(c => c.value === r.category)?.label ?? r.category}
                        </span>
                      </td>
                      <td class={s.amountIn}>{formatCurrency(r.amount)}</td>
                      <td class={s.cellDesc}>{r.description || '-'}</td>
                      <td>
                        <div class={s.actions}>
                          <button class={s.iconBtn} onClick={() => { setEditing(r); setModalOpen(true); }} title="Edit">
                            <Edit size={15} />
                          </button>
                          <button class={`${s.iconBtn} ${s.iconBtnDanger}`} onClick={() => setDeleteId(r.id)} title="Hapus">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
        <RecipientModal
          recipient={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          saving={saving}
        />
      )}

      {/* Delete Confirmation */}
      {deleteId !== null && (
        <div class={s.overlay} onClick={() => setDeleteId(null)}>
          <div class={s.confirm} onClick={e => e.stopPropagation()}>
            <p>Hapus penerima zakat ini?</p>
            <div class={s.confirmActions}>
              <button class="btn btn-ghost" onClick={() => setDeleteId(null)}>Batal</button>
              <button class={s.btnDanger} onClick={handleDelete}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Modal Component ===== */

function RecipientModal({ recipient, onSave, onClose, saving }: {
  recipient: ZakatRecipient | null;
  onSave: (input: CreateZakatRecipientInput) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(recipient?.name ?? '');
  const [address, setAddress] = useState(recipient?.address ?? '');
  const [category, setCategory] = useState<ZakatRecipientCategory>(recipient?.category ?? 'fakir');
  const [amount, setAmount] = useState(String(recipient?.amount ?? ''));
  const [date, setDate] = useState(recipient?.date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(recipient?.description ?? '');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    onSave({
      name,
      address: address || undefined,
      category,
      amount: Number(amount),
      date,
      description: description || undefined,
    });
  };

  return (
    <div class={s.overlay} onClick={onClose}>
      <div class={s.modal} onClick={e => e.stopPropagation()}>
        <div class={s.modalHeader}>
          <h2>{recipient ? 'Edit Penerima' : 'Tambah Penerima'}</h2>
          <button class={s.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div class={s.formBody}>
            <div class={s.formField}>
              <label class={s.formLabel}>Nama *</label>
              <input class={s.formInput} value={name} onInput={e => setName((e.target as HTMLInputElement).value)} required />
            </div>
            <div class={s.formField}>
              <label class={s.formLabel}>Alamat</label>
              <input class={s.formInput} value={address} onInput={e => setAddress((e.target as HTMLInputElement).value)} />
            </div>
            <div class={s.formRow}>
              <div class={s.formField}>
                <label class={s.formLabel}>Kategori *</label>
                <select class={s.formInput} value={category} onChange={e => setCategory((e.target as HTMLSelectElement).value as ZakatRecipientCategory)}>
                  {CATEGORIES.filter(c => c.value).map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div class={s.formField}>
                <label class={s.formLabel}>Jumlah (Rp) *</label>
                <input class={s.formInput} type="number" min="0" value={amount} onInput={e => setAmount((e.target as HTMLInputElement).value)} required />
              </div>
            </div>
            <div class={s.formField}>
              <label class={s.formLabel}>Tanggal *</label>
              <input class={s.formInput} type="date" value={date} onInput={e => setDate((e.target as HTMLInputElement).value)} required />
            </div>
            <div class={s.formField}>
              <label class={s.formLabel}>Keterangan</label>
              <textarea class={s.formTextarea} value={description} onInput={e => setDescription((e.target as HTMLTextAreaElement).value)} rows={3} />
            </div>
          </div>
          <div class={s.modalFooter}>
            <button type="button" class="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" class="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} class="spin" /> : null}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===== Helpers ===== */

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}
