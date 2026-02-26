import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import type { User } from '../types/user';
import * as authApi from '../api/auth';
import { registerSessionExpiredHandler } from '../api/client';
import { identifyUser, resetAnalytics } from '../lib/analytics';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, turnstileToken?: string) => Promise<void>;
  register: (username: string, email: string, password: string, turnstileToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshUser() {
    try {
      const me = await authApi.getMe();
      setUser(me);
      Sentry.setUser({ id: me._id });
      identifyUser(me._id, { subscriptionTier: (me as any).subscriptionTier });
    } catch {
      setUser(null);
      Sentry.setUser(null);
    }
  }

  useEffect(() => {
    registerSessionExpiredHandler(() => setUser(null));
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string, turnstileToken?: string) {
    const { user } = await authApi.login(email, password, turnstileToken);
    setUser(user);
    Sentry.setUser({ id: user._id });
    identifyUser(user._id, { subscriptionTier: (user as any).subscriptionTier });
  }

  async function register(username: string, email: string, password: string, turnstileToken?: string) {
    const { user } = await authApi.register(username, email, password, turnstileToken);
    setUser(user);
    Sentry.setUser({ id: user._id });
    identifyUser(user._id);
  }

  async function logout() {
    await authApi.logout();
    setUser(null);
    Sentry.setUser(null);
    resetAnalytics();
  }

  return (
    <AuthContext value={{ user, isLoading, login, register, logout, refreshUser, clearUser: () => setUser(null) }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
