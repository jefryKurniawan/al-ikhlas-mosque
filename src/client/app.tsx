import { h } from 'preact';
import Router from 'preact-router';
import { AuthProvider } from './hooks/useAuth';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { AdminLayout } from './pages/admin/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { Transactions } from './pages/admin/Transactions';
import { QurbanTiers } from './pages/admin/QurbanTiers';
import { Activities } from './pages/admin/Activities';
import { Users } from './pages/admin/Users';
import { Laporan } from './pages/admin/Laporan';
import { ZakatRecipients } from './pages/admin/ZakatRecipients';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';

function AdminRoute({ component: Component, url, ...props }: { component: typeof Dashboard; url?: string; [key: string]: unknown }) {
  return (
    <AdminLayout url={url}>
      <Component {...props} />
    </AdminLayout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <div class="app">
        <Router>
          {/* Public routes — with nav/footer */}
          <LandingWrapper path="/" />
          <Login path="/login" />

          {/* Admin routes — wrapped in AdminLayout (has own sidebar/topbar) */}
          <AdminRoute path="/admin" component={Dashboard} />
          <AdminRoute path="/admin/transaksi" component={Transactions} />
          <AdminRoute path="/admin/qurban" component={QurbanTiers} />
          <AdminRoute path="/admin/kegiatan" component={Activities} />
          <AdminRoute path="/admin/pengurus" component={Users} />
          <AdminRoute path="/admin/laporan" component={Laporan} />
          <AdminRoute path="/admin/penerima-zakat" component={ZakatRecipients} />

          {/* 404 */}
          <NotFound default />
        </Router>
      </div>
    </AuthProvider>
  );
}

function LandingWrapper(props: { path?: string }) {
  return (
    <div>
      <Navigation />
      <main>
        <Landing {...props} />
      </main>
      <Footer />
    </div>
  );
}
