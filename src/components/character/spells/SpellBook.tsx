import { useState, useMemo, useCallback } from 'react';
import { BookOpen, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { SpellRow } from './SpellRow';
import { SpellBrowser } from './SpellBrowser';
import {
  useCharacterSpells,
  useForgetSpell,
  usePrepareSpell,
} from '@/hooks/useSpells';
import type { Character } from '@/types/campaign';
import type { PopulatedCharacterSpell } from '@/types/spell';

interface SpellBookProps {
  character: Character;
  campaignId: string;
}

interface SpellsByLevel {
  [level: number]: PopulatedCharacterSpell[];
}

const LEVEL_LABELS: Record<number, string> = {
  0: 'Cantrips',
  1: '1st Level',
  2: '2nd Level',
  3: '3rd Level',
  4: '4th Level',
  5: '5th Level',
  6: '6th Level',
  7: '7th Level',
  8: '8th Level',
  9: '9th Level',
};

export function SpellBook({ character }: SpellBookProps) {
  const [browserOpen, setBrowserOpen] = useState(false);
  const [collapsedLevels, setCollapsedLevels] = useState<Set<number>>(
    new Set(),
  );

  const { data: characterSpells, isLoading } = useCharacterSpells(
    character._id,
  );
  const forgetSpell = useForgetSpell(character._id);
  const prepareSpell = usePrepareSpell(character._id);

  const spellsByLevel = useMemo<SpellsByLevel>(() => {
    const grouped: SpellsByLevel = {};
    if (!characterSpells) return grouped;

    for (const cs of characterSpells) {
      const level = cs.spellId.level;
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(cs);
    }

    // Sort each level's spells alphabetically
    for (const level of Object.keys(grouped)) {
      grouped[Number(level)].sort((a, b) =>
        a.spellId.name.localeCompare(b.spellId.name),
      );
    }

    return grouped;
  }, [characterSpells]);

  const sortedLevels = useMemo(
    () =>
      Object.keys(spellsByLevel)
        .map(Number)
        .sort((a, b) => a - b),
    [spellsByLevel],
  );

  const preparedCount = useMemo(() => {
    if (!characterSpells) return 0;
    return characterSpells.filter(
      (cs) => cs.isPrepared && cs.spellId.level > 0,
    ).length;
  }, [characterSpells]);

  const handleTogglePrepared = useCallback(
    (characterSpellId: string, isPrepared: boolean) => {
      prepareSpell.mutate(
        { characterSpellId, isPrepared },
        { onError: () => toast.error('Failed to update prepared state') },
      );
    },
    [prepareSpell],
  );

  const handleForget = useCallback(
    (characterSpellId: string) => {
      forgetSpell.mutate(characterSpellId, {
        onSuccess: () => toast.success('Spell forgotten'),
        onError: () => toast.error('Failed to forget spell'),
      });
    },
    [forgetSpell],
  );

  const toggleCollapse = useCallback((level: number) => {
    setCollapsedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }, []);

  return (
    <div className="flex h-full flex-col bg-[hsl(24,18%,9%)]">
      {renderPanelHeader(setBrowserOpen, preparedCount)}
      {renderBody(
        isLoading,
        sortedLevels,
        spellsByLevel,
        collapsedLevels,
        toggleCollapse,
        handleTogglePrepared,
        handleForget,
        character,
      )}
      <SpellBrowser
        characterId={character._id}
        knownSpells={characterSpells ?? []}
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
      />
    </div>
  );
}

function renderPanelHeader(
  setBrowserOpen: (v: boolean) => void,
  preparedCount: number,
) {
  return (
    <div className="flex items-center justify-between border-b border-[hsla(38,50%,30%,0.15)] px-4 py-3">
      <div className="flex items-center gap-2">
        <h2 className="font-[Cinzel] text-sm font-semibold uppercase tracking-wider text-foreground">
          Spell Book
        </h2>
        <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
          {preparedCount} prepared
        </span>
      </div>
      <Button size="sm" onClick={() => setBrowserOpen(true)}>
        <BookOpen className="mr-1 h-3.5 w-3.5" />
        Browse Spells
      </Button>
    </div>
  );
}

function renderBody(
  isLoading: boolean,
  sortedLevels: number[],
  spellsByLevel: SpellsByLevel,
  collapsedLevels: Set<number>,
  toggleCollapse: (level: number) => void,
  handleTogglePrepared: (id: string, prepared: boolean) => void,
  handleForget: (id: string) => void,
  character: Character,
) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sortedLevels.length === 0) {
    return renderEmptyState();
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {sortedLevels.map((level) =>
        renderLevelSection(
          level,
          spellsByLevel[level],
          collapsedLevels,
          toggleCollapse,
          handleTogglePrepared,
          handleForget,
          character,
        ),
      )}
    </div>
  );
}

function renderEmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="font-[Cinzel] text-sm text-muted-foreground">
          No spells known
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Use Browse Spells to add spells to this character&apos;s spell book.
        </p>
      </div>
    </div>
  );
}

function renderLevelSection(
  level: number,
  spells: PopulatedCharacterSpell[],
  collapsedLevels: Set<number>,
  toggleCollapse: (level: number) => void,
  handleTogglePrepared: (id: string, prepared: boolean) => void,
  handleForget: (id: string) => void,
  character: Character,
) {
  const isCollapsed = collapsedLevels.has(level);
  const isCantrip = level === 0;

  return (
    <div key={level}>
      {renderLevelHeader(level, spells, isCollapsed, toggleCollapse, isCantrip, character)}
      {!isCollapsed && renderLevelSpells(spells, handleTogglePrepared, handleForget, isCantrip)}
    </div>
  );
}

function renderLevelHeader(
  level: number,
  spells: PopulatedCharacterSpell[],
  isCollapsed: boolean,
  toggleCollapse: (level: number) => void,
  isCantrip: boolean,
  character: Character,
) {
  const ChevronIcon = isCollapsed ? ChevronRight : ChevronDown;
  const slotInfo = getSlotInfo(level, character);

  return (
    <button
      type="button"
      onClick={() => toggleCollapse(level)}
      className="flex w-full items-center gap-2 py-2"
    >
      <ChevronIcon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-[Cinzel] text-xs font-semibold uppercase tracking-wider text-foreground/80">
        {LEVEL_LABELS[level] || `Level ${level}`}
      </span>
      <span className="text-[10px] text-muted-foreground">
        ({spells.length} {isCantrip ? 'known' : 'spell' + (spells.length !== 1 ? 's' : '')})
      </span>
      {slotInfo && renderSlotIndicator(slotInfo)}
      <span className="flex-1 border-b border-border/30" />
    </button>
  );
}

function getSlotInfo(
  level: number,
  character: Character,
): { current: number; max: number } | null {
  if (level === 0) return null;
  const key = `level${level}` as keyof typeof character.spellSlots;
  const slot = character.spellSlots?.[key];
  if (!slot) return null;
  return slot;
}

function renderSlotIndicator(slotInfo: { current: number; max: number }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className="font-medium text-foreground/60">
        {slotInfo.current}/{slotInfo.max}
      </span>
      slots
    </span>
  );
}

function renderLevelSpells(
  spells: PopulatedCharacterSpell[],
  handleTogglePrepared: (id: string, prepared: boolean) => void,
  handleForget: (id: string) => void,
  isCantrip: boolean,
) {
  return (
    <div className="space-y-1 pl-5">
      {spells.map((cs) => (
        <SpellRow
          key={cs._id}
          characterSpell={cs}
          onTogglePrepared={handleTogglePrepared}
          onForget={handleForget}
          isCantrip={isCantrip}
        />
      ))}
    </div>
  );
}
