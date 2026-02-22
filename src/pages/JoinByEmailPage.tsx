import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAcceptEmailInvite } from '@/hooks/useInvitations';

export function JoinByEmailPage() {
  const { token } = useParams<{ token: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const acceptInvite = useAcceptEmailInvite();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    if (authLoading || !user || !token || hasAttempted) return;
    setHasAttempted(true);
    acceptInvite.mutate(token, {
      onSuccess: (data) => {
        navigate(`/app/campaigns/${data.campaign._id}`, { replace: true });
      },
    });
  }, [authLoading, user, token, hasAttempted, acceptInvite, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=/invites/${token}`} replace />;
  }

  if (acceptInvite.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-lg border border-destructive/50 bg-card p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">Unable to Accept Invitation</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {(acceptInvite.error as Error)?.message ?? 'This invitation may be invalid or expired.'}
          </p>
          <button
            onClick={() => navigate('/app', { replace: true })}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Accepting invitation...</p>
      </div>
    </div>
  );
}
