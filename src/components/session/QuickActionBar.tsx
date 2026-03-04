import { useMemo, useState, type ReactNode } from 'react';
import { Heart, ShieldPlus, SkipForward, Swords, Wand2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ApplyDamageModal } from '@/components/session/ApplyDamageModal';
import { useCombatRules, useUpdateInitiativeEntry } from '@/hooks/useLiveSession';
import { checkSystemDataSize, toggleConditionValue } from '@/lib/system-data';
import type { InitiativeEntry } from '@/types/live-session';

interface QuickActionBarProps {
  campaignId: string;
  focusedEntry: InitiativeEntry | null;
  onEndTurn: () => void;
  onSpawnToken?: () => void;
  disableEndTurn?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export function QuickActionBar({
  campaignId,
  focusedEntry,
  onEndTurn,
  onSpawnToken,
  disableEndTurn = false,
  layout = 'horizontal',
}: QuickActionBarProps) {
  const { data: rules } = useCombatRules(campaignId);
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const [mode, setMode] = useState<'damage' | 'heal' | 'temp-hp' | null>(null);
  const [showConditions, setShowConditions] = useState(false);
  const conditionDefs = useMemo(() => rules?.conditions ?? [], [rules?.conditions]);

  function handleToggleCondition(conditionKey: string) {
    if (!focusedEntry) return;
    const current = focusedEntry.conditions ?? [];
    const isActive = current.includes(conditionKey);
    const nextConditions = isActive
      ? current.filter((c) => c !== conditionKey)
      : [...current, conditionKey];
    const nextSystemData = toggleConditionValue(focusedEntry.systemData, conditionKey, !isActive);
    const size = checkSystemDataSize(nextSystemData);
    if (!size.ok) {
      toast.error(size.error ?? 'systemData is too large to save');
      return;
    }
    if (size.warning) {
      toast.warning(size.warning);
    }
    updateEntry.mutate({
      entryId: focusedEntry.id,
      body: {
        conditions: nextConditions,
        systemData: nextSystemData,
      },
    });
  }

  return (
    <>
      <div
        className={`relative flex w-full gap-2 rounded-lg border border-border/70 bg-card/95 p-2 backdrop-blur-sm ${
          layout === 'vertical'
            ? 'flex-col shadow-none'
            : 'mx-auto max-w-5xl flex-wrap items-center justify-center shadow-2xl'
        }`}
      >
        <ActionButton
          label="Damage"
          tone="danger"
          onClick={() => setMode('damage')}
          disabled={!focusedEntry}
          icon={<Swords className="h-3.5 w-3.5" />}
        />
        <ActionButton
          label="Heal"
          tone="safe"
          onClick={() => setMode('heal')}
          disabled={!focusedEntry}
          icon={<Heart className="h-3.5 w-3.5" />}
        />
        <ActionButton
          label="Temp HP"
          tone="neutral"
          onClick={() => setMode('temp-hp')}
          disabled={!focusedEntry}
          icon={<ShieldPlus className="h-3.5 w-3.5" />}
        />
        <ActionButton
          label="Conditions"
          tone="neutral"
          onClick={() => setShowConditions((v) => !v)}
          disabled={!focusedEntry}
          icon={<Wand2 className="h-3.5 w-3.5" />}
        />
        <ActionButton
          label="Spawn Token"
          tone="neutral"
          onClick={() => (onSpawnToken ? onSpawnToken() : toast.info('Open map controls to place a token'))}
          icon={<PlusCircle className="h-3.5 w-3.5" />}
        />
        <ActionButton
          label="End Turn"
          tone="neutral"
          onClick={onEndTurn}
          disabled={disableEndTurn}
          icon={<SkipForward className="h-3.5 w-3.5" />}
        />

        {showConditions && focusedEntry && conditionDefs.length > 0 && (
          <div className="absolute bottom-full left-1/2 z-20 mb-2 w-[360px] max-w-[92vw] -translate-x-1/2 rounded-md border border-border bg-card p-2 shadow-warm-lg">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Conditions • {focusedEntry.name}
            </p>
            <div className="max-h-44 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {conditionDefs.map((condition) => {
                  const active = (focusedEntry.conditions ?? []).includes(condition.key);
                  return (
                    <button
                      key={condition.key}
                      type="button"
                      onClick={() => handleToggleCondition(condition.key)}
                      className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                        active
                          ? 'bg-arcane/30 text-arcane ring-1 ring-arcane/50'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      title={condition.description}
                    >
                      {condition.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {focusedEntry && mode && (
        <ApplyDamageModal
          campaignId={campaignId}
          entry={focusedEntry}
          isOpen={mode != null}
          onClose={() => setMode(null)}
          initialMode={mode}
        />
      )}
    </>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  tone,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  tone: 'danger' | 'safe' | 'neutral';
  disabled?: boolean;
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/20'
      : tone === 'safe'
        ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
        : 'border-border/60 bg-accent/40 text-foreground hover:bg-accent';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors disabled:opacity-50 ${toneClass}`}
    >
      {icon}
      {label}
    </button>
  );
}
