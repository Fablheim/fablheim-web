import { X, RefreshCw, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSessionRecap, useRegenerateRecap } from '@/hooks/useSessions';
import { SessionStatistics } from './SessionStatistics';
import type { SessionStatistics as SessionStats } from '@/types/campaign';

interface SessionRecapModalProps {
  campaignId: string;
  sessionId: string;
  sessionTitle: string;
  durationMinutes?: number;
  statistics?: SessionStats;
  onClose: () => void;
}

export function SessionRecapModal({
  campaignId,
  sessionId,
  sessionTitle,
  durationMinutes,
  statistics,
  onClose,
}: SessionRecapModalProps) {
  const { data: recapData, isLoading } = useSessionRecap(campaignId, sessionId);
  const regenerate = useRegenerateRecap();

  function handleCopy() {
    if (recapData?.recap) {
      navigator.clipboard.writeText(recapData.recap);
      toast.success('Recap copied to clipboard');
    }
  }

  function handleRegenerate() {
    regenerate.mutate(
      { campaignId, sessionId },
      {
        onSuccess: () => toast.success('Recap regenerated'),
        onError: () => toast.error('Failed to regenerate recap'),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="app-card iron-brackets flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl texture-parchment shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsla(38,40%,30%,0.2)] p-5 texture-wood">
          <div>
            <h2 className="font-['IM_Fell_English'] text-2xl text-card-foreground text-carved">
              Recap Chronicle
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {sessionTitle}
              {durationMinutes != null && durationMinutes > 0 && (
                <span className="ml-2">
                  ({Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m)
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recap modal"
            className="app-focus-ring rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="font-['IM_Fell_English'] text-sm">
                Generating recap...
              </p>
            </div>
          )}

          {!isLoading && !recapData?.recap && (
            <div className="app-empty-state rounded-lg py-12 text-center text-muted-foreground">
              <p className="font-['IM_Fell_English'] text-sm">
                No recap available yet. The AI is still writing the tale of your
                adventure...
              </p>
            </div>
          )}

          {!isLoading && recapData?.recap && (
            <div className="space-y-5">
              <div className="rounded-lg border border-[hsla(38,30%,35%,0.22)] bg-[hsla(24,16%,10%,0.55)] p-4 whitespace-pre-wrap font-['IM_Fell_English'] text-sm leading-relaxed text-foreground/90">
                {recapData.recap}
              </div>

              {recapData.generatedAt && (
                <p className="app-chip inline-flex px-2 py-1 text-[10px] text-muted-foreground/80">
                  Generated{' '}
                  {new Date(recapData.generatedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Statistics */}
          {statistics && (
            <>
              <div className="divider-ornate my-5" />
              <SessionStatistics statistics={statistics} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[hsla(38,40%,30%,0.2)] p-4 texture-wood">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerate.isPending || isLoading}
            className="app-focus-ring flex items-center gap-1.5 rounded-md border border-border bg-accent px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/80 disabled:opacity-50 transition-colors font-[Cinzel] uppercase tracking-wider"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${regenerate.isPending ? 'animate-spin' : ''}`}
            />
            Regenerate
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!recapData?.recap}
              className="app-focus-ring flex items-center gap-1.5 rounded-md border border-border bg-accent px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/80 disabled:opacity-50 transition-colors font-[Cinzel] uppercase tracking-wider"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
            <button
              type="button"
              onClick={onClose}
              className="app-focus-ring rounded-md border border-brass/40 bg-brass/10 px-4 py-1.5 text-xs text-brass hover:bg-brass/20 transition-colors font-[Cinzel] uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
