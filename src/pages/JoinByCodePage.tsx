import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useJoinViaCode } from '@/hooks/useInvitations';

export function JoinByCodePage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const joinViaCode = useJoinViaCode();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    if (authLoading || !user || !inviteCode || hasAttempted) return;
    setHasAttempted(true);
    joinViaCode.mutate(inviteCode, {
      onSuccess: (data) => {
        navigate(`/app/campaigns/${data.campaign._id}`, { replace: true });
      },
    });
  }, [authLoading, user, inviteCode, hasAttempted, joinViaCode, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=/join/${inviteCode}`} replace />;
  }

  if (joinViaCode.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-lg border border-destructive/50 bg-card p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">Unable to Join</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {(joinViaCode.error as Error)?.message ?? 'This invite link may be invalid or expired.'}
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
        <p className="mt-4 text-sm text-muted-foreground">Joining campaign...</p>
      </div>
    </div>
  );
}
