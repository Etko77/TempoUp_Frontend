import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { tokenStorage, StoredUser } from './secureStore';
import { api } from '@/api/endpoints';
import { setOnAuthFailure } from '@/api/client';
import type { LoginRequest, RegisterRequest } from '@/types/api';

interface AuthContextValue {
  user: StoredUser | null;
  isBootstrapping: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await tokenStorage.getUser();
        const access = await tokenStorage.getAccess();
        if (stored && access) setUser(stored);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  useEffect(() => {
    setOnAuthFailure(() => setUser(null));
  }, []);

  const login = useCallback(async (req: LoginRequest) => {
    const res = await api.auth.login(req);
    await tokenStorage.saveTokens(res.accessToken, res.refreshToken);
    const stored: StoredUser = { userId: res.userId, email: res.email, role: res.role };
    await tokenStorage.saveUser(stored);
    setUser(stored);
  }, []);

  const register = useCallback(async (req: RegisterRequest) => {
    const res = await api.auth.register(req);
    await tokenStorage.saveTokens(res.accessToken, res.refreshToken);
    const stored: StoredUser = { userId: res.userId, email: res.email, role: res.role };
    await tokenStorage.saveUser(stored);
    setUser(stored);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore network failure on logout */
    }
    await tokenStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isBootstrapping, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
