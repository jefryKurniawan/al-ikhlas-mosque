import { h } from 'preact';
import { Home, ArrowLeft } from 'lucide-preact';

interface Props {
  path?: string;
  default?: boolean;
}

export function NotFound(_props: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '48px 24px',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(4rem, 10vw, 8rem)',
        color: 'var(--color-primary)',
        lineHeight: 1,
        marginBottom: '16px',
      }}>
        404
      </h1>
      <p style={{
        fontSize: '1.1rem',
        color: 'var(--color-text-secondary)',
        marginBottom: '32px',
      }}>
        Halaman yang Anda cari tidak ditemukan.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <a href="/" class="btn btn-primary">
          <Home size={16} />
          Kembali ke Beranda
        </a>
        <button class="btn btn-ghost" onClick={() => history.back()}>
          <ArrowLeft size={16} />
          Kembali
        </button>
      </div>
    </div>
  );
}
