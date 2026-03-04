import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTakeDamage, useHeal, useAddTempHP } from '@/hooks/useCharacterCombat';
import { useUpdateInitiativeEntry, useCombatRules } from '@/hooks/useLiveSession';
import {
  computeDamagePreview,
  computeHealPreview,
  computeTempHpPreview,
} from '@/lib/dnd5e-rules';
import type { InitiativeEntry } from '@/types/live-session';

interface ApplyDamageModalProps {
  campaignId: string;
  entry: InitiativeEntry;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: EffectMode;
}

type EffectMode = 'damage' | 'heal' | 'temp-hp';

export function ApplyDamageModal({
  campaignId,
  entry,
  isOpen,
  onClose,
  initialMode = 'damage',
}: ApplyDamageModalProps) {
  const [mode, setMode] = useState<EffectMode>(initialMode);
  const [amount, setAmount] = useState(0);
  const [damageType, setDamageType] = useState<string>('');
  const takeDamage = useTakeDamage();
  const heal = useHeal();
  const addTempHp = useAddTempHP();
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const { data: rules } = useCombatRules(campaignId);
  const damageCategories = rules?.damageModel.type !== 'abstract'
    ? rules?.damageModel.config.categories ?? []
    : [];

  const preview = useMemo(
    () =>
      computeDamagePreview({
        amount,
        damageType: damageType || undefined,
        currentHp: entry.currentHp ?? 0,
        maxHp: entry.maxHp ?? 0,
        tempHp: entry.tempHp ?? 0,
        resistances: entry.resistances ?? [],
        vulnerabilities: entry.vulnerabilities ?? [],
        immunities: entry.immunities ?? [],
        isConcentrating: !!entry.isConcentrating,
      }),
    [amount, damageType, entry],
  );
  const healPreview = useMemo(
    () =>
      computeHealPreview({
        amount,
        currentHp: entry.currentHp ?? 0,
        maxHp: entry.maxHp ?? 0,
      }),
    [amount, entry.currentHp, entry.maxHp],
  );
  const tempHpPreview = useMemo(
    () =>
      computeTempHpPreview({
        amount,
        existingTempHp: entry.tempHp ?? 0,
      }),
    [amount, entry.tempHp],
  );

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  async function handleSubmit() {
    if (amount <= 0) return;

    if (mode === 'damage') {
      if (entry.characterId) {
        await takeDamage.mutateAsync({
          id: entry.characterId,
          amount,
          type: damageType || undefined,
        });
      } else {
        await updateEntry.mutateAsync({
          entryId: entry.id,
          body: {
            currentHp: preview.resultingHp,
            tempHp: preview.remainingTempHp,
          },
        });
      }

      if (entry.isConcentrating && preview.concentrationCheckDC) {
        toast.message(`DC ${preview.concentrationCheckDC} CON save to maintain concentration`);
      }
      if (preview.triggersDeathState) {
        toast.message(`${entry.name} dropped to 0 HP`);
      }
    } else if (mode === 'heal') {
      if (entry.characterId) {
        await heal.mutateAsync({
          id: entry.characterId,
          amount: healPreview.healAmount,
        });
      } else {
        await updateEntry.mutateAsync({
          entryId: entry.id,
          body: {
            currentHp: healPreview.resultingHp,
          },
        });
      }
      toast.success('Healing applied');
    } else {
      if (entry.characterId) {
        await addTempHp.mutateAsync({
          id: entry.characterId,
          amount: tempHpPreview.inputTempHp,
        });
      } else {
        await updateEntry.mutateAsync({
          entryId: entry.id,
          body: {
            tempHp: tempHpPreview.newTempHp,
          },
        });
      }
      toast.success('Temp HP updated');
    }

    onClose();
  }

  const pending =
    takeDamage.isPending ||
    heal.isPending ||
    addTempHp.isPending ||
    updateEntry.isPending;

  function switchMode(next: EffectMode) {
    setMode(next);
    setAmount(0);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border/70 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <h3 className="font-[Cinzel] text-sm uppercase tracking-wide text-foreground">
            Apply Damage: {entry.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close apply damage modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-3">
          <div className="flex gap-1">
            <ModeTab label="Damage" active={mode === 'damage'} onClick={() => switchMode('damage')} />
            <ModeTab label="Heal" active={mode === 'heal'} onClick={() => switchMode('heal')} />
            <ModeTab label="Temp HP" active={mode === 'temp-hp'} onClick={() => switchMode('temp-hp')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Amount
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                className="mt-1 w-full rounded border border-input bg-input px-2 py-1.5 text-xs text-foreground"
              />
            </label>
            {mode === 'damage' ? (
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Damage Type
                <select
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value)}
                  className="mt-1 w-full rounded border border-input bg-input px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="">None</option>
                  {damageCategories.map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div />
            )}
          </div>

          <div className="rounded border border-border/60 bg-background/30 p-2 text-xs">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Preview</p>
            {mode === 'damage' && (
              <>
                <p className="mt-1 text-muted-foreground">
                  {preview.inputDamage}
                  {damageType ? ` ${damageType}` : ''} damage
                  {preview.wasImmune
                    ? ' -> Immune (0)'
                    : preview.wasVulnerable
                      ? ` -> Vulnerable (${preview.adjustedDamage})`
                      : preview.wasResisted
                        ? ` -> Resisted (${preview.adjustedDamage})`
                        : ''}
                </p>
                <p className="text-muted-foreground">
                  Temp absorbs {preview.tempHpAbsorbed}; HP {entry.currentHp ?? 0} {'->'} {preview.resultingHp}
                </p>
                {preview.concentrationCheckDC && (
                  <p className="text-amber-400">Concentration check: DC {preview.concentrationCheckDC}</p>
                )}
              </>
            )}
            {mode === 'heal' && (
              <>
                <p className="mt-1 text-muted-foreground">
                  Heal {healPreview.healAmount}; HP {entry.currentHp ?? 0} {'->'} {healPreview.resultingHp}
                </p>
                {healPreview.overheal > 0 && (
                  <p className="text-muted-foreground">Overheal ignored: {healPreview.overheal}</p>
                )}
              </>
            )}
            {mode === 'temp-hp' && (
              <>
                <p className="mt-1 text-muted-foreground">
                  Temp HP {tempHpPreview.existingTempHp} {'->'} {tempHpPreview.newTempHp}
                </p>
                <p className="text-muted-foreground">
                  {tempHpPreview.replaced ? 'Higher temp HP replaces current value' : 'Existing temp HP remains higher'}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={pending || amount <= 0}
            className="inline-flex items-center gap-1 rounded border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs text-destructive hover:bg-destructive/20 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {mode === 'damage' ? 'Apply Damage' : mode === 'heal' ? 'Apply Heal' : 'Set Temp HP'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
        active
          ? 'border-primary/45 bg-primary/15 text-primary'
          : 'border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
