import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Landmark, LogIn, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-preact';
import { useAuth } from '../hooks/useAuth';
import { route } from 'preact-router';
import s from './Login.module.css';

interface Props {
  path?: string;
}

export function Login(_props: Props) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      route('/admin', true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class={s.loginPage}>
      <div class={s.loginLeft}>
        <div class={s.loginBranding}>
          <div class={s.loginLogo}>
            <Landmark size={32} />
          </div>
          <h1 class={s.loginBrandTitle}>Masjid Al Ikhlas</h1>
          <p class={s.loginBrandSub}>Gonggang, Poncol, Magetan</p>
          <p class={s.loginBrandDesc}>
            Panel pengurus untuk mengelola keuangan, kegiatan, dan informasi masjid.
          </p>
        </div>
      </div>

      <div class={s.loginRight}>
        <form class={s.loginForm} onSubmit={handleSubmit}>
          <div class={s.loginFormHeader}>
            <h2>Masuk</h2>
            <p>Silakan masuk dengan akun pengurus</p>
          </div>

          {error && (
            <div class={s.loginError}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div class={s.loginField}>
            <label class={s.loginLabel} for="username">Username</label>
            <input
              id="username"
              type="text"
              class={s.loginInput}
              placeholder="Masukkan username"
              value={username}
              onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
              autocomplete="username"
              disabled={loading}
            />
          </div>

          <div class={s.loginField}>
            <label class={s.loginLabel} for="password">Password</label>
            <div class={s.loginPasswordWrap}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                class={s.loginInput}
                placeholder="Masukkan password"
                value={password}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                autocomplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                class={s.loginPasswordToggle}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            class={`btn btn-primary ${s.loginBtn}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} class="spin" />
                Memproses...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Masuk
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
