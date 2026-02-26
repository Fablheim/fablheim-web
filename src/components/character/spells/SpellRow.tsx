import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SpellCard, SCHOOL_COLORS, SCHOOL_BG } from './SpellCard';
import type { PopulatedCharacterSpell, SpellSchool } from '@/types/spell';

interface SpellRowProps {
  characterSpell: PopulatedCharacterSpell;
  onTogglePrepared: (characterSpellId: string, isPrepared: boolean) => void;
  onForget: (characterSpellId: string) => void;
  isCantrip: boolean;
}

export function SpellRow({
  characterSpell,
  onTogglePrepared,
  onForget,
  isCantrip,
}: SpellRowProps) {
  const [expanded, setExpanded] = useState(false);
  const spell = characterSpell.spellId;
  const school = spell.school as SpellSchool;
  const schoolColor = SCHOOL_COLORS[school] || 'text-gray-400';
  const schoolBg = SCHOOL_BG[school] || 'bg-muted/20 border-border';

  const handleTogglePrepared = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTogglePrepared(characterSpell._id, !characterSpell.isPrepared);
    },
    [characterSpell._id, characterSpell.isPrepared, onTogglePrepared],
  );

  const handleForget = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onForget(characterSpell._id);
    },
    [characterSpell._id, onForget],
  );

  return (
    <div className={`rounded-sm border ${schoolBg} transition-colors hover:brightness-110`}>
      {renderSummary(spell, schoolColor, characterSpell, isCantrip, expanded, setExpanded, handleTogglePrepared)}
      {expanded && renderExpanded(spell, handleForget, characterSpell)}
    </div>
  );
}

function renderSummary(
  spell: PopulatedCharacterSpell['spellId'],
  schoolColor: string,
  characterSpell: PopulatedCharacterSpell,
  isCantrip: boolean,
  expanded: boolean,
  setExpanded: (v: boolean) => void,
  handleTogglePrepared: (e: React.MouseEvent) => void,
) {
  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="flex w-full items-center gap-2 px-3 py-2 text-left"
    >
      {renderChevron(expanded)}
      {renderPreparedCheckbox(characterSpell, isCantrip, handleTogglePrepared)}
      {renderNameAndSchool(spell, schoolColor)}
      {renderSpellBadges(spell)}
      {renderMeta(spell)}
    </button>
  );
}

function renderChevron(expanded: boolean) {
  const Icon = expanded ? ChevronDown : ChevronRight;
  return <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

function renderPreparedCheckbox(
  characterSpell: PopulatedCharacterSpell,
  isCantrip: boolean,
  handleTogglePrepared: (e: React.MouseEvent) => void,
) {
  if (isCantrip) {
    return (
      <span className="h-3.5 w-3.5 shrink-0 rounded-sm bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center">
        <span className="text-[8px] text-emerald-400">A</span>
      </span>
    );
  }

  return (
    <span
      role="checkbox"
      aria-checked={characterSpell.isPrepared}
      onClick={handleTogglePrepared}
      className={`h-3.5 w-3.5 shrink-0 cursor-pointer rounded-sm border transition-colors ${
        characterSpell.isPrepared
          ? 'bg-primary/80 border-primary/50'
          : 'bg-muted/30 border-border hover:border-primary/40'
      }`}
    />
  );
}

function renderNameAndSchool(
  spell: PopulatedCharacterSpell['spellId'],
  schoolColor: string,
) {
  return (
    <span className={`flex-1 truncate text-sm font-medium ${schoolColor}`}>
      {spell.name}
    </span>
  );
}

function renderSpellBadges(spell: PopulatedCharacterSpell['spellId']) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {spell.concentration && (
        <span className="rounded-sm bg-amber-900/40 px-1 py-0.5 text-[9px] font-bold uppercase text-amber-400">
          C
        </span>
      )}
      {spell.ritual && (
        <span className="rounded-sm bg-cyan-900/40 px-1 py-0.5 text-[9px] font-bold uppercase text-cyan-400">
          R
        </span>
      )}
    </span>
  );
}

function renderMeta(spell: PopulatedCharacterSpell['spellId']) {
  return (
    <span className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground">
      <span>{spell.castingTime}</span>
      <span>{spell.range}</span>
    </span>
  );
}

function renderExpanded(
  spell: PopulatedCharacterSpell['spellId'],
  handleForget: (e: React.MouseEvent) => void,
  characterSpell: PopulatedCharacterSpell,
) {
  const forgetButton = (
    <button
      type="button"
      onClick={handleForget}
      className="rounded-sm border border-red-800/40 bg-red-950/30 px-2 py-1 text-[10px] uppercase font-bold text-red-400 hover:bg-red-900/40"
    >
      Forget
    </button>
  );

  return (
    <div className="border-t border-border/40 px-3 py-3">
      <SpellCard spell={spell} action={forgetButton} />
      {renderNotes(characterSpell)}
    </div>
  );
}

function renderNotes(characterSpell: PopulatedCharacterSpell) {
  if (!characterSpell.notes) return null;
  return (
    <p className="mt-2 rounded-sm bg-muted/20 p-2 text-xs italic text-muted-foreground/70">
      {characterSpell.notes}
    </p>
  );
}
