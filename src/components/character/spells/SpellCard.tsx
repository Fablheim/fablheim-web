import { Clock, Target, Timer, Sparkles } from 'lucide-react';
import type { Spell, SpellSchool } from '@/types/spell';

interface SpellCardProps {
  spell: Spell;
  onClose?: () => void;
  action?: React.ReactNode;
}

const SCHOOL_COLORS: Record<SpellSchool, string> = {
  evocation: 'text-red-400',
  abjuration: 'text-blue-400',
  conjuration: 'text-yellow-400',
  divination: 'text-gray-300',
  enchantment: 'text-pink-400',
  illusion: 'text-purple-400',
  necromancy: 'text-emerald-700',
  transmutation: 'text-orange-400',
};

const SCHOOL_BG: Record<SpellSchool, string> = {
  evocation: 'bg-red-900/20 border-red-800/30',
  abjuration: 'bg-blue-900/20 border-blue-800/30',
  conjuration: 'bg-yellow-900/20 border-yellow-800/30',
  divination: 'bg-gray-800/20 border-gray-700/30',
  enchantment: 'bg-pink-900/20 border-pink-800/30',
  illusion: 'bg-purple-900/20 border-purple-800/30',
  necromancy: 'bg-emerald-950/30 border-emerald-900/30',
  transmutation: 'bg-orange-900/20 border-orange-800/30',
};

function spellLevelLabel(level: number): string {
  if (level === 0) return 'Cantrip';
  const suffix =
    level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th';
  return `${level}${suffix}-level`;
}

export function SpellCard({ spell, onClose, action }: SpellCardProps) {
  const schoolColor = SCHOOL_COLORS[spell.school] || 'text-gray-400';
  const schoolBg = SCHOOL_BG[spell.school] || 'bg-muted/20 border-border';

  return (
    <div className={`rounded-sm border ${schoolBg} p-4 space-y-3`}>
      {renderHeader(spell, schoolColor, onClose, action)}
      {renderMetaRow(spell)}
      {renderComponents(spell)}
      {renderDescription(spell)}
    </div>
  );
}

function renderHeader(
  spell: Spell,
  schoolColor: string,
  onClose: (() => void) | undefined,
  action: React.ReactNode | undefined,
) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <h3 className="font-[Cinzel] text-sm font-semibold text-foreground">
          {spell.name}
        </h3>
        <p className={`text-xs ${schoolColor}`}>
          {spellLevelLabel(spell.level)} {spell.school}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {renderBadges(spell)}
        {action}
        {onClose && renderCloseButton(onClose)}
      </div>
    </div>
  );
}

function renderBadges(spell: Spell) {
  return (
    <span className="flex items-center gap-1">
      {spell.concentration && (
        <span className="rounded-sm bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">
          C
        </span>
      )}
      {spell.ritual && (
        <span className="rounded-sm bg-cyan-900/40 px-1.5 py-0.5 text-[10px] font-bold uppercase text-cyan-400">
          R
        </span>
      )}
    </span>
  );
}

function renderCloseButton(onClose: () => void) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    >
      Close
    </button>
  );
}

function renderMetaRow(spell: Spell) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {spell.castingTime}
      </span>
      <span className="flex items-center gap-1">
        <Target className="h-3 w-3" />
        {spell.range}
      </span>
      <span className="flex items-center gap-1">
        <Timer className="h-3 w-3" />
        {spell.duration}
      </span>
    </div>
  );
}

function renderComponents(spell: Spell) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {spell.components.map((c) => (
        <span
          key={c}
          className="rounded-sm bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground"
        >
          {c}
        </span>
      ))}
      {spell.material && (
        <span className="text-[10px] italic text-muted-foreground/70">
          ({spell.material})
        </span>
      )}
    </div>
  );
}

function renderDescription(spell: Spell) {
  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">
        {spell.description}
      </p>
      {renderHigherLevels(spell)}
      {renderClassList(spell)}
    </div>
  );
}

function renderHigherLevels(spell: Spell) {
  if (!spell.higherLevels) return null;
  return (
    <div className="rounded-sm border border-border/40 bg-muted/20 p-2">
      <p className="text-xs text-muted-foreground">
        <span className="flex items-center gap-1 font-semibold text-foreground/70">
          <Sparkles className="h-3 w-3" />
          At Higher Levels.
        </span>{' '}
        {spell.higherLevels}
      </p>
    </div>
  );
}

function renderClassList(spell: Spell) {
  if (!spell.classes.length) return null;
  return (
    <p className="text-[10px] text-muted-foreground/60">
      {spell.classes.join(', ')} | {spell.source}
    </p>
  );
}

export { SCHOOL_COLORS, SCHOOL_BG, spellLevelLabel };
