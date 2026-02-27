import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
