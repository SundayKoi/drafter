import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, tokenStore } from '../api/client';

export interface StaffUser {
  id: string;
  display_name: string;
  role: 'admin' | 'moderator';
}

interface AuthState {
  staff: StaffUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setStaff(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<StaffUser>('/auth/me');
      setStaff(me);
    } catch {
      tokenStore.clear();
      setStaff(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ access_token: string; staff: StaffUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    tokenStore.set(res.access_token);
    setStaff(res.staff);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* server already rejects — client drops token regardless */
    }
    tokenStore.clear();
    setStaff(null);
  }, []);

  const value = useMemo(
    () => ({ staff, loading, login, logout, refresh }),
    [staff, loading, login, logout, refresh],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
