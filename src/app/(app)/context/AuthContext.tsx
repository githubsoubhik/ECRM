'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { Employee, ApiEmployee, mapApiEmployee, upsertEmployee } from '@/app/data/employeeData';
import { fetchWithAuth } from '../../../../lib/fetchWithAuth';

const CACHE_KEY = 'pavion_user'; // display data only, never the token

interface AuthValue {
  user: Employee | null;
  loading: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const applyUser = (raw: ApiEmployee) => {
    const mapped = mapApiEmployee(raw);
    upsertEmployee(mapped);       // so findEmployee / loadProfile can see this user
    setUser(mapped);
  };

  const refresh = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/auth/me');
      if (res.status === 401) {
        sessionStorage.removeItem(CACHE_KEY);
        setUser(null);
        router.replace('/login');          // use your real login route
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      applyUser(json.data as ApiEmployee);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(json.data));
    } catch (e) {
      console.error('Could not load current user', e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    // 1) paint at once from the login response, 2) confirm with the server
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        applyUser(JSON.parse(cached) as ApiEmployee);
        setLoading(false);
      }
    } catch { /* ignore */ }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    await fetchWithAuth('/api/auth/logout', { method: 'POST' }).catch(() => {});
    sessionStorage.removeItem(CACHE_KEY);
    setUser(null);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: user?.role === 'Admin', refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}