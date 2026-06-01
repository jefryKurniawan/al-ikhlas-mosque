import { h } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { Plus, Edit, Trash2, Loader2, AlertCircle, X, ChevronLeft, ChevronRight, Clock } from 'lucide-preact';
import { api } from '../../lib/api';
import type { Activity, PaginatedResponse, CreateActivityInput, ActivityCategory } from '../../../shared/types';
import s from './Crud.module.css';

interface Props { path?: string }

export function Activities(_props: Props) {
  const [data, setData] = useState<PaginatedResponse<Activity> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<PaginatedResponse<Activity>>(`/api/admin/cms/activities?page=${page}&limit=15`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (input: CreateActivityInput) => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/admin/cms/activities/${editing.id}`, input);
      } else {
        await api.post('/api/admin/cms/activities', input);
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
      await api.delete(`/api/admin/cms/activities/${deleteId}`);
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
          <h1>Kegiatan</h1>
          <p class={s.pageSubtitle}>Kelola kegiatan dan agenda masjid</p>
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
                  <th>Judul</th>
                  <th>Tanggal</th>
                  <th>Jam</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map(act => (
                  <tr key={act.id}>
                    <td><strong>{act.title}</strong></td>
                    <td>{formatDate(act.eventDate)}</td>
                    <td>{act.eventTime ? <span><Clock size={12} /> {act.eventTime}</span> : '—'}</td>
                    <td>
                      <span class={`${s.badge} ${act.category === 'rutin' ? s.badgeActive : ''}`}>
                        {act.category === 'rutin' ? 'Rutin' : 'Besar'}
                      </span>
                    </td>
                    <td>
                      <span class={`${s.badge} ${act.isActive ? s.badgeActive : s.badgeInactive}`}>
                        {act.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div class={s.actions}>
                        <button class={s.actionBtn} onClick={() => { setEditing(act); setModalOpen(true); }}><Edit size={16} /></button>
                        <button class={`${s.actionBtn} ${s.actionBtnDanger}`} onClick={() => setDeleteId(act.id as number)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={4} class={s.empty}>Tidak ada kegiatan</td></tr>
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
        <ActivityModal
          activity={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          saving={saving}
        />
      )}

      {deleteId !== null && (
        <div class={s.overlay} onClick={() => setDeleteId(null)}>
          <div class={s.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3>Hapus Kegiatan?</h3>
            <p>Kegiatan ini akan dihapus permanen.</p>
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

function ActivityModal({
  activity, onSave, onClose, saving,
}: {
  activity: Activity | null;
  onSave: (input: CreateActivityInput) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(activity?.title ?? '');
  const [eventDate, setEventDate] = useState(activity?.eventDate ?? new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState(activity?.eventTime ?? '');
  const [category, setCategory] = useState<ActivityCategory>(activity?.category ?? 'besar');
  const [description, setDescription] = useState(activity?.description ?? '');
  const [imageUrl, setImageUrl] = useState(activity?.imageUrl ?? '');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!title || !eventDate) return;
    onSave({
      title,
      eventDate,
      eventTime: eventTime || undefined,
      category,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
    });
  };

  return (
    <div class={s.overlay} onClick={onClose}>
      <div class={s.modal} onClick={(e) => e.stopPropagation()}>
        <div class={s.modalHeader}>
          <h3>{activity ? 'Edit Kegiatan' : 'Tambah Kegiatan'}</h3>
          <button class={s.modalClose} onClick={onClose}><X size={20} /></button>
        </div>
        <form class={s.modalForm} onSubmit={handleSubmit}>
          <div class={s.formField}>
            <label class={s.formLabel}>Judul *</label>
            <input class={s.formInput} type="text" value={title} onInput={(e) => setTitle((e.target as HTMLInputElement).value)} required placeholder="Nama kegiatan" />
          </div>
          <div class={s.formField}>
            <label class={s.formLabel}>Tanggal *</label>
            <input class={s.formInput} type="date" value={eventDate} onInput={(e) => setEventDate((e.target as HTMLInputElement).value)} required />
          </div>
          <div class={s.formField}>
            <label class={s.formLabel}>Jam</label>
            <input class={s.formInput} type="time" value={eventTime} onInput={(e) => setEventTime((e.target as HTMLInputElement).value)} />
          </div>
          <div class={s.formField}>
            <label class={s.formLabel}>Kategori *</label>
            <select class={s.formInput} value={category} onChange={(e) => setCategory((e.target as HTMLSelectElement).value as ActivityCategory)}>
              <option value="besar">Besar (kurban, megengan, santunan)</option>
              <option value="rutin">Rutin (TPQ, pengajian, Jumatan)</option>
            </select>
          </div>
          <div class={s.formField}>
            <label class={s.formLabel}>Deskripsi</label>
            <textarea class={s.formTextarea} value={description} onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)} rows={3} placeholder="Deskripsi kegiatan" />
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

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}
