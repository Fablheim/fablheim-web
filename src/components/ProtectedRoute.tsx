import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!user) {
    const redirect = location.pathname + location.search;
    const loginPath = redirect === '/app' ? '/login' : `/login?redirect=${encodeURIComponent(redirect)}`;
    return <Navigate to={loginPath} replace />;
  }

  return children;
}
