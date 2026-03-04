import { RefreshCw, Copy, Loader2, Sparkles } from 'lucide-react';
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
      <div className="app-empty-state m-3 flex h-full items-center justify-center rounded-lg text-muted-foreground">
        <p className="font-['IM_Fell_English']">No session selected</p>
      </div>
    );
  }

  function handleCopy() {
    if (recapData?.recap) {
      navigator.clipboard.writeText(recapData.recap);
      toast.success('Recap copied to clipboard');
    }
  }

  function handleGenerate() {
    regenerate.mutate(
      { campaignId, sessionId: sessionId! },
      {
        onSuccess: () => toast.success('Recap generated'),
        onError: () => toast.error('Failed to generate recap'),
      },
    );
  }

  const hasRecap = !!recapData?.recap;

  return (
    <div className="app-card m-2 flex h-full flex-col rounded-lg texture-parchment">
      <div className="flex items-center justify-between border-b border-[hsla(38,30%,25%,0.2)] px-4 py-2 texture-wood">
        <h3 className="font-['IM_Fell_English'] text-sm font-semibold text-foreground text-carved">
          AI Recap
        </h3>
        {hasRecap && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="app-focus-ring rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              title="Copy recap"
              aria-label="Copy recap"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleGenerate}
              disabled={regenerate.isPending}
              className="app-focus-ring rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              title="Regenerate recap"
              aria-label="Regenerate recap"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${regenerate.isPending ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : regenerate.isPending ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground/70">Generating recap...</p>
          </div>
        ) : hasRecap ? (
          <div className="rounded-lg border border-[hsla(38,30%,35%,0.22)] bg-[hsla(24,16%,10%,0.45)] p-3 prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm text-muted-foreground">
            {recapData.recap}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <p className="text-sm text-muted-foreground/70 text-center">
              No AI recap has been generated for this session.
            </p>
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate Recap
            </button>
            <p className="text-xs text-muted-foreground/50">
              This will use AI credits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
