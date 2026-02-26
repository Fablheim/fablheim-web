import { Swords, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEncounters, useLoadEncounter } from '@/hooks/useEncounters';
import type { EncounterDifficulty } from '@/types/encounter';

interface EncountersTabProps {
  campaignId: string;
  isDM: boolean;
}

const DIFFICULTY_STYLES: Record<EncounterDifficulty, string> = {
  easy: 'bg-forest/20 text-[hsl(150,50%,55%)]',
  medium: 'bg-brass/20 text-brass',
  hard: 'bg-primary/20 text-primary',
  deadly: 'bg-blood/20 text-blood',
};

export function EncountersTab({ campaignId, isDM }: EncountersTabProps) {
  const { data: encounters, isLoading } = useEncounters(campaignId);
  const loadEncounter = useLoadEncounter(campaignId);

  function handleLoad(encounterId: string) {
    if (!confirm('Load this encounter? Tokens will be copied to the battle map and NPCs added to initiative.')) return;
    loadEncounter.mutate(
      { encounterId, body: { addToInitiative: true, clearExistingMap: true } },
      {
        onSuccess: () => toast.success('Encounter loaded'),
        onError: () => toast.error('Failed to load encounter'),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!encounters || encounters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Swords className="h-8 w-8 text-primary/60" />
        </div>
        <h3 className="font-[Cinzel] text-sm font-semibold text-foreground mb-1">
          No Encounters
        </h3>
        <p className="text-xs text-muted-foreground font-['IM_Fell_English'] italic text-center max-w-xs">
          Create encounters in the Encounter Prep page, then load them here during your session.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        {encounters.length} encounter{encounters.length !== 1 ? 's' : ''} available
      </p>
      {encounters.map((enc) => (
        <div
          key={enc._id}
          className="flex items-center justify-between rounded-md border border-iron/30 bg-card/40 px-3 py-2 texture-leather"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-['IM_Fell_English'] text-sm text-foreground truncate">{enc.name}</span>
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${DIFFICULTY_STYLES[enc.difficulty]}`}>
                {enc.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
              {enc.npcs.length > 0 && (
                <span>{enc.npcs.reduce((s, n) => s + n.count, 0)} creatures</span>
              )}
              {enc.tokens.length > 0 && (
                <span>{enc.tokens.length} tokens</span>
              )}
              {enc.estimatedXP > 0 && <span>{enc.estimatedXP} XP</span>}
            </div>
          </div>
          {isDM && (
            <button
              type="button"
              onClick={() => handleLoad(enc._id)}
              disabled={loadEncounter.isPending}
              className="shrink-0 flex items-center gap-1 rounded-md border border-brass/40 bg-brass/10 px-2 py-1 text-[10px] text-brass hover:bg-brass/20 transition-colors font-[Cinzel] uppercase tracking-wider disabled:opacity-50 ml-2"
            >
              {loadEncounter.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              Load
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
