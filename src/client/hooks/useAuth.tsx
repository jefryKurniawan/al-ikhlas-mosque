import { h, createContext } from 'preact';
import { useContext, useState, useEffect, useCallback } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { api } from '../lib/api';

interface AuthUser {
  userId: string;
  username: string;
  email?: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ComponentChildren }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.get<AuthUser>('/api/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await api.post<AuthUser>('/api/login', { username, password });
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/logout');
    setUser(null);
  }, []);

  useEffect(() => {
    // Fetch CSRF token first, then check auth
    api.get('/api/csrf-token').then(() => checkAuth());
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
