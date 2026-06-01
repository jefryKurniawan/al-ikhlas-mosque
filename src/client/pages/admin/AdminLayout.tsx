import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import {
  LayoutDashboard,
  Wallet,
  Beef,
  CalendarDays,
  Users,
  FileText,
  Heart,
  LogOut,
  Menu,
  X,
  Landmark,
  Loader2,
} from 'lucide-preact';
import { useAuth } from '../../hooks/useAuth';
import s from './AdminLayout.module.css';

interface AdminPage {
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
}

const pages: AdminPage[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { key: 'transactions', label: 'Transaksi', icon: Wallet, path: '/admin/transaksi' },
  { key: 'qurban', label: 'Qurban & Sedekah', icon: Beef, path: '/admin/qurban' },
  { key: 'activities', label: 'Kegiatan', icon: CalendarDays, path: '/admin/kegiatan' },
  { key: 'users', label: 'Pengurus', icon: Users, path: '/admin/pengurus' },
  { key: 'laporan', label: 'Laporan', icon: FileText, path: '/admin/laporan' },
  { key: 'zakat-recipients', label: 'Penerima Zakat', icon: Heart, path: '/admin/penerima-zakat' },
];

interface Props {
  children: preact.ComponentChildren;
  url?: string;
}

export function AdminLayout({ children, url = '/admin' }: Props) {
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      route('/login', true);
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div class={s.adminLoading}>
        <Loader2 size={32} class="spin" />
        <span>Memuat...</span>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    route('/login', true);
  };

  // Determine active page from URL
  const activePath = url?.split('?')[0] ?? '/admin';

  return (
    <div class={s.adminLayout}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div class={s.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside class={`${s.sidebar}${sidebarOpen ? ` ${s.sidebarOpen}` : ''}`}>
        <div class={s.sidebarHeader}>
          <div class={s.sidebarBrand}>
            <Landmark size={20} />
            <span>Al Ikhlas</span>
          </div>
          <button class={s.sidebarClose} onClick={() => setSidebarOpen(false)} aria-label="Tutup menu">
            <X size={20} />
          </button>
        </div>

        <nav class={s.sidebarNav}>
          {pages.map((p) => {
            const Icon = p.icon;
            const isActive = activePath === p.path || (p.path !== '/admin' && (activePath ?? '').startsWith(p.path));
            return (
              <a
                key={p.key}
                href={p.path}
                class={`${s.sidebarLink}${isActive ? ` ${s.sidebarLinkActive}` : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{p.label}</span>
              </a>
            );
          })}
        </nav>

        <div class={s.sidebarFooter}>
          <div class={s.sidebarUser}>
            <div class={s.sidebarAvatar}>
              {(user.username ?? 'A')[0]?.toUpperCase() ?? 'A'}
            </div>
            <div class={s.sidebarUserInfo}>
              <span class={s.sidebarUsername}>{user.username}</span>
              <span class={s.sidebarUserRole}>{user.role}</span>
            </div>
          </div>
          <button class={s.sidebarLogout} onClick={handleLogout} aria-label="Keluar">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div class={s.adminMain}>
        <header class={s.adminTopbar}>
          <button class={s.menuToggle} onClick={() => setSidebarOpen(true)} aria-label="Buka menu">
            <Menu size={22} />
          </button>
          <div class={s.topbarRight}>
            <a href="/" class={s.topbarLink} target="_blank" rel="noopener noreferrer">
              Lihat Website
            </a>
          </div>
        </header>

        <main class={s.adminContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
