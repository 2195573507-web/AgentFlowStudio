import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthSessionState, LoginRequest, SessionUser } from '../../shared/authTypes';
import { api } from './api';
import { clearStoredSession, getStoredSession, isAuthError, storeSession } from './session';

interface AuthContextValue {
  loading: boolean;
  user: SessionUser | null;
  error: string;
  login(request: LoginRequest): Promise<boolean>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  setUser(user: SessionUser): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    const stored = getStoredSession();
    if (!stored) {
      setUser(null);
      setLoading(false);
      return;
    }
    const result = await api.auth.session(stored.sessionId, stored.sessionToken);
    if (isAuthError(result) || !result.authenticated || !result.user) {
      clearStoredSession();
      setUser(null);
      setError(isAuthError(result) ? result.error : '');
    } else {
      setUser(result.user);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void api.auth.bootstrap().finally(refresh);
  }, [refresh]);

  const login = useCallback(async (request: LoginRequest) => {
    setLoading(true);
    setError('');
    const result = await api.auth.login(request);
    setLoading(false);
    if (isAuthError(result)) {
      setError(result.error);
      return false;
    }
    if (!result.ok || !result.session?.user) {
      setError(result.error || 'Login failed.');
      return false;
    }
    storeSession(result.session as AuthSessionState);
    setUser(result.session.user);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    clearStoredSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ loading, user, error, login, logout, refresh, setUser }),
    [loading, user, error, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}

