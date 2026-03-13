import { useState } from 'react';
import { Skull, Dice5 } from 'lucide-react';
import { toast } from 'sonner';
import { usePf2eRecoveryCheck, usePf2eSetDying } from '@/hooks/useLiveSession';
import { useCampaignModuleEnabled } from '@/hooks/useModuleEnabled';
import type { InitiativeEntry } from '@/types/live-session';

const DEGREE_COLORS: Record<string, string> = {
  'critical-success': 'text-[hsl(45,90%,55%)]',
  'success': 'text-[hsl(150,50%,55%)]',
  'failure': 'text-muted-foreground',
  'critical-failure': 'text-blood',
};

const DEGREE_LABELS: Record<string, string> = {
  'critical-success': 'Critical Success!',
  'success': 'Success',
  'failure': 'Failure',
  'critical-failure': 'Critical Failure!',
};

interface Pf2eDyingPanelProps {
  campaignId: string;
  entry: InitiativeEntry;
  isDM: boolean;
}

export function Pf2eDyingPanel({ campaignId, entry, isDM }: Pf2eDyingPanelProps) {
  const enabled = useCampaignModuleEnabled(campaignId, 'pf2e-dying');
  const recoveryCheck = usePf2eRecoveryCheck(campaignId);
  const setDying = usePf2eSetDying(campaignId);
  const [lastResult, setLastResult] = useState<{ roll: number; dc: number; degree: string } | null>(null);

  if (!enabled) return null;

  const systemData = entry.systemData ?? {};
  const downed = (systemData.downed ?? {}) as Record<string, number>;
  const dyingValue: number = downed.dyingValue ?? 0;
  const woundedValue: number = downed.woundedValue ?? 0;
  const doomedValue: number = downed.doomedValue ?? 0;
  const maxDying = 4 - doomedValue;

  async function handleRecoveryCheck() {
    try {
      const result = await recoveryCheck.mutateAsync(entry.id);
      setLastResult({ roll: result.roll, dc: result.dc, degree: result.degree });
      if (result.dead) {
        toast.error(`${entry.name} has died!`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Recovery check failed');
    }
  }

  // Only show if dying > 0 or wounded > 0 or doomed > 0
  if (dyingValue === 0 && woundedValue === 0 && doomedValue === 0 && !isDM) return null;

  return (
    <div className="space-y-2 rounded-sm border border-border bg-muted/20 px-3 py-2">
      <div className="flex items-center gap-2">
        <Skull className={`h-4 w-4 ${dyingValue > 0 ? 'text-blood' : 'text-muted-foreground/40'}`} />
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          PF2e Death State
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Dying pips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground font-[Cinzel] uppercase">Dying</span>
          <div className="flex gap-0.5">
            {Array.from({ length: maxDying }).map((_, i) => (
              <div
                key={i}
                className={`h-3.5 w-3.5 rounded-full border-2 transition-colors ${
                  i < dyingValue
                    ? 'border-blood bg-blood/60'
                    : 'border-border bg-muted/30'
                }`}
              />
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground">{dyingValue}/{maxDying}</span>
        </div>

        {/* Wounded pips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground font-[Cinzel] uppercase">Wnd</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-sm border transition-colors ${
                  i < woundedValue
                    ? 'border-orange-400 bg-orange-400/50'
                    : 'border-border bg-muted/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Doomed pips */}
        {doomedValue > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground font-[Cinzel] uppercase">Doom</span>
            <span className="text-xs text-blood font-bold">{doomedValue}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {dyingValue > 0 && (
          <button
            type="button"
            onClick={handleRecoveryCheck}
            disabled={recoveryCheck.isPending}
            className="flex items-center gap-1 rounded bg-arcane/20 px-2 py-1 text-[10px] text-arcane hover:bg-arcane/30 disabled:opacity-50"
          >
            <Dice5 className="h-3 w-3" />
            Recovery Check (DC {10 + dyingValue})
          </button>
        )}

        {isDM && (
          <>
            <button
              type="button"
              onClick={() => setDying.mutate({ entryId: entry.id, dyingValue: Math.min(maxDying, dyingValue + 1) })}
              className="rounded bg-blood/20 px-1.5 py-0.5 text-[9px] text-blood hover:bg-blood/30"
            >
              +Dying
            </button>
            {dyingValue > 0 && (
              <button
                type="button"
                onClick={() => {
                  const newDying = dyingValue - 1;
                  const newWounded = newDying === 0 ? woundedValue + 1 : woundedValue;
                  setDying.mutate({ entryId: entry.id, dyingValue: newDying, woundedValue: newWounded });
                }}
                className="rounded bg-green-500/20 px-1.5 py-0.5 text-[9px] text-green-500 hover:bg-green-500/30"
              >
                -Dying
              </button>
            )}
          </>
        )}
      </div>

      {/* Last result */}
      {lastResult && (
        <div className={`text-xs ${DEGREE_COLORS[lastResult.degree] ?? 'text-foreground'}`}>
          Rolled {lastResult.roll} vs DC {lastResult.dc} — {DEGREE_LABELS[lastResult.degree] ?? lastResult.degree}
        </div>
      )}
    </div>
  );
}
