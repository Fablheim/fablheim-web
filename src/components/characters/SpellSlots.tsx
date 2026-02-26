import { Sparkles } from 'lucide-react';
import type { SpellSlots as SpellSlotsType, SpellSlotLevel } from '@/types/campaign';

interface SpellSlotsProps {
  spellSlots: SpellSlotsType;
  onConsume: (level: number) => void;
  onRestore: (level: number) => void;
  editable?: boolean;
}

const SLOT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function getSlot(spellSlots: SpellSlotsType, level: number): SpellSlotLevel | undefined {
  return spellSlots[`level${level}` as keyof SpellSlotsType];
}

export function SpellSlots({
  spellSlots,
  onConsume,
  onRestore,
  editable = true,
}: SpellSlotsProps) {
  // Only show levels that have slots configured
  const activeLevels = SLOT_LEVELS.filter((level) => {
    const slot = getSlot(spellSlots, level);
    return slot && slot.max > 0;
  });

  if (activeLevels.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          Spell Slots
        </p>
      </div>
      <div className="space-y-2">
        {activeLevels.map((level) => {
          const slot = getSlot(spellSlots, level)!;
          return (
            <SpellSlotRow
              key={level}
              level={level}
              slot={slot}
              editable={editable}
              onConsume={() => onConsume(level)}
              onRestore={() => onRestore(level)}
            />
          );
        })}
      </div>
    </div>
  );
}

function SpellSlotRow({
  level,
  slot,
  editable,
  onConsume,
  onRestore,
}: {
  level: number;
  slot: SpellSlotLevel;
  editable: boolean;
  onConsume: () => void;
  onRestore: () => void;
}) {
  const ordinal = level === 1 ? '1st' : level === 2 ? '2nd' : level === 3 ? '3rd' : `${level}th`;

  return (
    <div className="flex items-center gap-3 rounded-sm border border-border bg-muted/30 px-3 py-1.5">
      <span className="w-8 font-[Cinzel] text-xs text-muted-foreground">{ordinal}</span>
      <div className="flex flex-1 items-center gap-1">
        {Array.from({ length: slot.max }).map((_, i) => (
          <button
            key={i}
            disabled={!editable}
            onClick={() => (i < slot.current ? onConsume() : onRestore())}
            className={`h-4 w-4 rounded-full border transition-colors ${
              i < slot.current
                ? 'border-violet-500 bg-violet-500 hover:bg-violet-400'
                : 'border-muted-foreground/40 hover:border-violet-500/60'
            } ${editable ? 'cursor-pointer' : ''}`}
            title={i < slot.current ? 'Click to use' : 'Click to restore'}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {slot.current}/{slot.max}
      </span>
    </div>
  );
}
