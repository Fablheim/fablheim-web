import { Sparkles } from 'lucide-react';

interface Pf2eSpellSlot {
  max: number;
  current: number;
  spellId?: string;
}

interface SpellSlotsPf2eProps {
  slots: Record<string, Pf2eSpellSlot[]>; // e.g. { level1: [...], level2: [...] }
  onCast: (level: number, slotIndex: number) => void;
  onReset: () => void;
  editable?: boolean;
  isPrepared?: boolean; // If true, shows spellId labels
}

const SLOT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function getOrdinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

export function SpellSlotsPf2e({
  slots,
  onCast,
  onReset,
  editable = true,
  isPrepared = false,
}: SpellSlotsPf2eProps) {
  const activeLevels = SLOT_LEVELS.filter((level) => {
    const levelSlots = slots[`level${level}`];
    return levelSlots && levelSlots.length > 0;
  });

  if (activeLevels.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          Spell Slots (PF2e)
        </p>
      </div>
      <div className="space-y-2">
        {activeLevels.map((level) => {
          const levelSlots = slots[`level${level}`];
          return (
            <Pf2eSlotRow
              key={level}
              level={level}
              slots={levelSlots}
              editable={editable}
              isPrepared={isPrepared}
              onCast={(slotIndex) => onCast(level, slotIndex)}
            />
          );
        })}
      </div>
      {editable && (
        <button
          onClick={onReset}
          className="mt-3 w-full rounded-sm border border-border bg-muted/30 px-3 py-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/50"
        >
          Reset All
        </button>
      )}
    </div>
  );
}

function Pf2eSlotRow({
  level,
  slots,
  editable,
  isPrepared,
  onCast,
}: {
  level: number;
  slots: Pf2eSpellSlot[];
  editable: boolean;
  isPrepared: boolean;
  onCast: (slotIndex: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-border bg-muted/30 px-3 py-1.5">
      <span className="w-8 font-[Cinzel] text-xs text-muted-foreground">
        {getOrdinal(level)}
      </span>
      <div className="flex flex-1 items-center gap-2">
        {slots.map((slot, i) => {
          const available = slot.current > 0;
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <button
                disabled={!editable || !available}
                onClick={() => onCast(i)}
                className={`h-4 w-4 rounded-full border transition-colors ${
                  available
                    ? 'border-violet-500 bg-violet-500 hover:bg-violet-400'
                    : 'border-muted-foreground/40'
                } ${editable && available ? 'cursor-pointer' : ''}`}
                title={available ? 'Click to cast' : 'Slot used'}
              />
              {isPrepared && slot.spellId && (
                <span className="max-w-[3rem] truncate text-[8px] leading-tight text-muted-foreground">
                  {slot.spellId}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground">
        {slots.filter((s) => s.current > 0).length}/{slots.length}
      </span>
    </div>
  );
}
