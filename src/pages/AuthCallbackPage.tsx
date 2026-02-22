import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AuthCallbackPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser().then(() => navigate('/app', { replace: true }));
  }, [refreshUser, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
