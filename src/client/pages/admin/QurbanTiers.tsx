import { h } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { Plus, Edit, Trash2, Loader2, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-preact';
import { api } from '../../lib/api';
import type { QurbanTier, PaginatedResponse, CreateQurbanTierInput } from '../../../shared/types';
import s from './Crud.module.css';

interface Props { path?: string }

export function QurbanTiers(_props: Props) {
  const [data, setData] = useState<PaginatedResponse<QurbanTier> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QurbanTier | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<PaginatedResponse<QurbanTier>>(`/api/admin/cms/qurban?page=${page}&limit=15`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (input: CreateQurbanTierInput) => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/admin/cms/qurban/${editing.id}`, input);
      } else {
        await api.post('/api/admin/cms/qurban', input);
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
      await api.delete(`/api/admin/cms/qurban/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div class={s.page}>
      <div class={s.pageHeader}>
        <div>
          <h1>Qurban & Sedekah</h1>
          <p class={s.pageSubtitle}>Kelola paket qurban dan sedekah</p>
        </div>
        <button class="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={16} /> Tambah
        </button>
      </div>

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
                  <th>Nama</th>
                  <th>Harga</th>
                  <th>Urutan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map(tier => (
                  <tr key={tier.id}>
                    <td><strong>{tier.name}</strong></td>
                    <td>{formatCurrency(tier.amount)}</td>
                    <td>{tier.sortOrder}</td>
                    <td>
                      <span class={`${s.badge} ${tier.isActive ? s.badgeActive : s.badgeInactive}`}>
                        {tier.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div class={s.actions}>
                        <button class={s.actionBtn} onClick={() => { setEditing(tier); setModalOpen(true); }}><Edit size={16} /></button>
                        <button class={`${s.actionBtn} ${s.actionBtnDanger}`} onClick={() => setDeleteId(tier.id as number)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={5} class={s.empty}>Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div class={s.pagination}>
              <button class={s.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
              <span class={s.pageInfo}>Halaman {page} dari {totalPages}</span>
              <button class={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <QurbanModal
          tier={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          saving={saving}
        />
      )}

      {deleteId !== null && (
        <div class={s.overlay} onClick={() => setDeleteId(null)}>
          <div class={s.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3>Hapus Paket?</h3>
            <p>Paket qurban/sedekah ini akan dihapus permanen.</p>
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

function QurbanModal({
  tier, onSave, onClose, saving,
}: {
  tier: QurbanTier | null;
  onSave: (input: CreateQurbanTierInput) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(tier?.name ?? '');
  const [amount, setAmount] = useState(tier?.amount?.toString() ?? '');
  const [description, setDescription] = useState(tier?.description ?? '');
  const [imageUrl, setImageUrl] = useState(tier?.imageUrl ?? '');
  const [sortOrder, setSortOrder] = useState(tier?.sortOrder?.toString() ?? '0');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!name || !amount) return;
    onSave({
      name,
      amount: Number(amount),
      description: description || undefined,
      imageUrl: imageUrl || undefined,
      sortOrder: Number(sortOrder),
    });
  };

  return (
    <div class={s.overlay} onClick={onClose}>
      <div class={s.modal} onClick={(e) => e.stopPropagation()}>
        <div class={s.modalHeader}>
          <h3>{tier ? 'Edit Paket' : 'Tambah Paket'}</h3>
          <button class={s.modalClose} onClick={onClose}><X size={20} /></button>
        </div>
        <form class={s.modalForm} onSubmit={handleSubmit}>
          <div class={s.formField}>
            <label class={s.formLabel}>Nama Paket *</label>
            <input class={s.formInput} type="text" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} required placeholder="Contoh: Sapi 1/7" />
          </div>
          <div class={s.formRow}>
            <div class={s.formField}>
              <label class={s.formLabel}>Harga (Rp) *</label>
              <input class={s.formInput} type="number" min="1" value={amount} onInput={(e) => setAmount((e.target as HTMLInputElement).value)} required placeholder="0" />
            </div>
            <div class={s.formField}>
              <label class={s.formLabel}>Urutan</label>
              <input class={s.formInput} type="number" min="0" value={sortOrder} onInput={(e) => setSortOrder((e.target as HTMLInputElement).value)} />
            </div>
          </div>
          <div class={s.formField}>
            <label class={s.formLabel}>Deskripsi</label>
            <textarea class={s.formTextarea} value={description} onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)} rows={3} placeholder="Deskripsi paket" />
          </div>
          <div class={s.formField}>
            <label class={s.formLabel}>URL Gambar</label>
            <input class={s.formInput} type="url" value={imageUrl} onInput={(e) => setImageUrl((e.target as HTMLInputElement).value)} placeholder="https://..." />
          </div>
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

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}
