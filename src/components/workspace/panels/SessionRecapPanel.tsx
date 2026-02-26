import { RefreshCw, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSessionRecap, useRegenerateRecap } from '@/hooks/useSessions';

interface SessionRecapPanelProps {
  campaignId: string;
  sessionId?: string;
}

export function SessionRecapPanel({ campaignId, sessionId }: SessionRecapPanelProps) {
  const { data: recapData, isLoading } = useSessionRecap(
    campaignId,
    sessionId ?? '',
  );
  const regenerate = useRegenerateRecap();

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>No session selected</p>
      </div>
    );
  }

  function handleCopy() {
    if (recapData?.recap) {
      navigator.clipboard.writeText(recapData.recap);
      toast.success('Recap copied to clipboard');
    }
  }

  function handleRegenerate() {
    regenerate.mutate(
      { campaignId, sessionId: sessionId! },
      {
        onSuccess: () => toast.success('Recap regenerated'),
        onError: () => toast.error('Failed to regenerate recap'),
      },
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[hsla(38,30%,25%,0.2)] px-4 py-2">
        <h3 className="font-['IM_Fell_English'] text-sm font-semibold text-foreground">
          AI Recap
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            disabled={!recapData?.recap}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            title="Copy recap"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerate.isPending}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            title="Regenerate recap"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${regenerate.isPending ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : recapData?.recap ? (
          <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm text-muted-foreground">
            {recapData.recap}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground/60">
            No recap available yet. It may still be generating.
          </p>
        )}
      </div>
    </div>
  );
}
