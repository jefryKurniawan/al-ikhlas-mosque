import { h } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { Plus, Edit, Trash2, Loader2, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-preact';
import { api } from '../../lib/api';
import type { User, PaginatedResponse, CreateUserInput } from '../../../shared/types';
import { useAuth } from '../../hooks/useAuth';
import s from './Crud.module.css';

interface Props { path?: string }

export function Users(_props: Props) {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<PaginatedResponse<User>>(`/api/admin/users?page=${page}&limit=15`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (input: CreateUserInput) => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/admin/users/${editing.id}`, input);
      } else {
        await api.post('/api/admin/users', input);
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
    if (deleteId === currentUser?.userId) {
      alert('Tidak bisa menghapus akun sendiri');
      setDeleteId(null);
      return;
    }
    try {
      await api.delete(`/api/admin/users/${deleteId}`);
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
          <h1>Pengurus</h1>
          <p class={s.pageSubtitle}>Kelola akun pengurus masjid</p>
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
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Login via</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map(user => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.username}</strong>
                      {user.id === currentUser?.userId && <span class={`${s.badge} ${s.badgeActive}`} style="margin-left: 8px">Anda</span>}
                    </td>
                    <td>{user.email || '—'}</td>
                    <td><span class={`${s.badge} ${s.badgeActive}`}>{user.role}</span></td>
                    <td>{user.provider}</td>
                    <td>
                      <div class={s.actions}>
                        <button class={s.actionBtn} onClick={() => { setEditing(user); setModalOpen(true); }}><Edit size={16} /></button>
                        {user.id !== currentUser?.userId && (
                          <button class={`${s.actionBtn} ${s.actionBtnDanger}`} onClick={() => setDeleteId(user.id)}><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={5} class={s.empty}>Tidak ada pengurus</td></tr>
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
        <UserModal
          user={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          saving={saving}
        />
      )}

      {deleteId !== null && (
        <div class={s.overlay} onClick={() => setDeleteId(null)}>
          <div class={s.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3>Hapus Pengurus?</h3>
            <p>Akun ini akan dihapus permanen.</p>
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

function UserModal({
  user, onSave, onClose, saving,
}: {
  user: User | null;
  onSave: (input: CreateUserInput) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!username || !email) return;
    if (!user && !password) return; // password required for new user
    onSave({
      username,
      email,
      password: password || (user ? '' : undefined),
    } as CreateUserInput);
  };

  return (
    <div class={s.overlay} onClick={onClose}>
      <div class={s.modal} onClick={(e) => e.stopPropagation()}>
        <div class={s.modalHeader}>
          <h3>{user ? 'Edit Pengurus' : 'Tambah Pengurus'}</h3>
          <button class={s.modalClose} onClick={onClose}><X size={20} /></button>
        </div>
        <form class={s.modalForm} onSubmit={handleSubmit}>
          <div class={s.formField}>
            <label class={s.formLabel}>Username *</label>
            <input class={s.formInput} type="text" value={username} onInput={(e) => setUsername((e.target as HTMLInputElement).value)} required minLength={3} maxLength={50} placeholder="username" />
          </div>
          <div class={s.formField}>
            <label class={s.formLabel}>Email *</label>
            <input class={s.formInput} type="email" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} required placeholder="email@contoh.com" />
          </div>
          <div class={s.formField}>
            <label class={s.formLabel}>Password {user ? '(kosongkan jika tidak diubah)' : '*'}</label>
            <input class={s.formInput} type="password" value={password} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} minLength={8} placeholder="Minimal 8 karakter" {...(user ? {} : { required: true })} />
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
