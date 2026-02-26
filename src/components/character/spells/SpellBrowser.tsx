import { useState, useMemo, useCallback } from 'react';
import { X, Search, Check, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { SpellCard, spellLevelLabel, SCHOOL_COLORS } from './SpellCard';
import { useSpells, useLearnSpell } from '@/hooks/useSpells';
import type { Spell, PopulatedCharacterSpell, SpellQuery } from '@/types/spell';

interface SpellBrowserProps {
  characterId: string;
  knownSpells: PopulatedCharacterSpell[];
  open: boolean;
  onClose: () => void;
}

const LEVEL_OPTIONS = [
  { value: undefined, label: 'All Levels' },
  { value: 0, label: 'Cantrip' },
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: 5, label: '5th' },
  { value: 6, label: '6th' },
  { value: 7, label: '7th' },
  { value: 8, label: '8th' },
  { value: 9, label: '9th' },
];

const SCHOOL_OPTIONS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: 'All Schools' },
  { value: 'abjuration', label: 'Abjuration' },
  { value: 'conjuration', label: 'Conjuration' },
  { value: 'divination', label: 'Divination' },
  { value: 'enchantment', label: 'Enchantment' },
  { value: 'evocation', label: 'Evocation' },
  { value: 'illusion', label: 'Illusion' },
  { value: 'necromancy', label: 'Necromancy' },
  { value: 'transmutation', label: 'Transmutation' },
];

const CLASS_OPTIONS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: 'All Classes' },
  { value: 'Bard', label: 'Bard' },
  { value: 'Cleric', label: 'Cleric' },
  { value: 'Druid', label: 'Druid' },
  { value: 'Paladin', label: 'Paladin' },
  { value: 'Ranger', label: 'Ranger' },
  { value: 'Sorcerer', label: 'Sorcerer' },
  { value: 'Warlock', label: 'Warlock' },
  { value: 'Wizard', label: 'Wizard' },
];

export function SpellBrowser({
  characterId,
  knownSpells,
  open,
  onClose,
}: SpellBrowserProps) {
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | undefined>(undefined);
  const [schoolFilter, setSchoolFilter] = useState<string | undefined>(undefined);
  const [classFilter, setClassFilter] = useState<string | undefined>(undefined);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  const query: SpellQuery = useMemo(() => {
    const q: SpellQuery = {};
    if (searchText) q.search = searchText;
    if (levelFilter !== undefined) q.level = levelFilter;
    if (schoolFilter) q.school = schoolFilter;
    if (classFilter) q.class = classFilter;
    return q;
  }, [searchText, levelFilter, schoolFilter, classFilter]);

  const { data: spells, isLoading } = useSpells(query);
  const learnSpell = useLearnSpell();

  const knownSpellIds = useMemo(() => {
    const set = new Set<string>();
    for (const cs of knownSpells) {
      set.add(cs.spellId._id);
    }
    return set;
  }, [knownSpells]);

  const handleLearn = useCallback(
    (spellId: string) => {
      learnSpell.mutate(
        { characterId, spellId },
        {
          onSuccess: () => toast.success('Spell learned!'),
          onError: () => toast.error('Failed to learn spell'),
        },
      );
    },
    [characterId, learnSpell],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-sm border border-[hsla(38,50%,30%,0.15)] bg-[hsl(24,18%,9%)] shadow-2xl">
        {renderModalHeader(onClose)}
        {renderFilters(searchText, setSearchText, levelFilter, setLevelFilter, schoolFilter, setSchoolFilter, classFilter, setClassFilter)}
        {renderContent(spells, isLoading, knownSpellIds, selectedSpell, setSelectedSpell, handleLearn, learnSpell.isPending)}
      </div>
    </div>
  );
}

function renderModalHeader(onClose: () => void) {
  return (
    <div className="flex items-center justify-between border-b border-[hsla(38,50%,30%,0.15)] px-4 py-3">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <h2 className="font-[Cinzel] text-sm font-semibold uppercase tracking-wider text-foreground">
          Spell Reference
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function renderFilters(
  searchText: string,
  setSearchText: (v: string) => void,
  levelFilter: number | undefined,
  setLevelFilter: (v: number | undefined) => void,
  schoolFilter: string | undefined,
  setSchoolFilter: (v: string | undefined) => void,
  classFilter: string | undefined,
  setClassFilter: (v: string | undefined) => void,
) {
  return (
    <div className="border-b border-border/40 px-4 py-3 space-y-2">
      {renderSearchInput(searchText, setSearchText)}
      {renderFilterSelects(levelFilter, setLevelFilter, schoolFilter, setSchoolFilter, classFilter, setClassFilter)}
    </div>
  );
}

function renderSearchInput(
  searchText: string,
  setSearchText: (v: string) => void,
) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search spells..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full rounded-sm border border-border bg-input py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
      />
    </div>
  );
}

function renderFilterSelects(
  levelFilter: number | undefined,
  setLevelFilter: (v: number | undefined) => void,
  schoolFilter: string | undefined,
  setSchoolFilter: (v: string | undefined) => void,
  classFilter: string | undefined,
  setClassFilter: (v: string | undefined) => void,
) {
  return (
    <div className="flex gap-2">
      <select
        className="flex-1 rounded-sm border border-border bg-input px-2 py-1.5 text-xs text-foreground"
        value={levelFilter ?? ''}
        onChange={(e) =>
          setLevelFilter(e.target.value === '' ? undefined : Number(e.target.value))
        }
      >
        {LEVEL_OPTIONS.map((opt) => (
          <option key={opt.label} value={opt.value ?? ''}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        className="flex-1 rounded-sm border border-border bg-input px-2 py-1.5 text-xs text-foreground"
        value={schoolFilter ?? ''}
        onChange={(e) =>
          setSchoolFilter(e.target.value || undefined)
        }
      >
        {SCHOOL_OPTIONS.map((opt) => (
          <option key={opt.label} value={opt.value ?? ''}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        className="flex-1 rounded-sm border border-border bg-input px-2 py-1.5 text-xs text-foreground"
        value={classFilter ?? ''}
        onChange={(e) =>
          setClassFilter(e.target.value || undefined)
        }
      >
        {CLASS_OPTIONS.map((opt) => (
          <option key={opt.label} value={opt.value ?? ''}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function renderContent(
  spells: Spell[] | undefined,
  isLoading: boolean,
  knownSpellIds: Set<string>,
  selectedSpell: Spell | null,
  setSelectedSpell: (s: Spell | null) => void,
  handleLearn: (spellId: string) => void,
  isLearning: boolean,
) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {renderSpellList(spells ?? [], knownSpellIds, selectedSpell, setSelectedSpell)}
      {renderSpellDetail(selectedSpell, knownSpellIds, handleLearn, isLearning)}
    </div>
  );
}

function renderSpellList(
  spells: Spell[],
  knownSpellIds: Set<string>,
  selectedSpell: Spell | null,
  setSelectedSpell: (s: Spell | null) => void,
) {
  if (spells.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">No spells found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto border-r border-border/40">
      <div className="space-y-0.5 p-2">
        {spells.map((spell) => renderSpellListItem(spell, knownSpellIds, selectedSpell, setSelectedSpell))}
      </div>
    </div>
  );
}

function renderSpellListItem(
  spell: Spell,
  knownSpellIds: Set<string>,
  selectedSpell: Spell | null,
  setSelectedSpell: (s: Spell | null) => void,
) {
  const isKnown = knownSpellIds.has(spell._id);
  const isSelected = selectedSpell?._id === spell._id;
  const schoolColor = SCHOOL_COLORS[spell.school] || 'text-gray-400';

  return (
    <button
      key={spell._id}
      type="button"
      onClick={() => setSelectedSpell(spell)}
      className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left transition-colors ${
        isSelected
          ? 'bg-primary/20 border border-primary/30'
          : 'hover:bg-muted/40 border border-transparent'
      }`}
    >
      {renderSpellListItemContent(spell, schoolColor, isKnown)}
    </button>
  );
}

function renderSpellListItemContent(
  spell: Spell,
  schoolColor: string,
  isKnown: boolean,
) {
  return (
    <>
      <span className={`flex-1 truncate text-sm ${schoolColor}`}>
        {spell.name}
      </span>
      {renderSpellListBadges(spell, isKnown)}
    </>
  );
}

function renderSpellListBadges(spell: Spell, isKnown: boolean) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
      <span>{spellLevelLabel(spell.level)}</span>
      {isKnown && (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      )}
    </span>
  );
}

function renderSpellDetail(
  selectedSpell: Spell | null,
  knownSpellIds: Set<string>,
  handleLearn: (spellId: string) => void,
  isLearning: boolean,
) {
  if (!selectedSpell) {
    return (
      <div className="flex w-80 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground text-center">
          Select a spell to see its details
        </p>
      </div>
    );
  }

  const isKnown = knownSpellIds.has(selectedSpell._id);

  const learnAction = isKnown ? (
    <span className="flex items-center gap-1 rounded-sm bg-emerald-900/40 px-2 py-1 text-[10px] font-bold uppercase text-emerald-400">
      <Check className="h-3 w-3" />
      Known
    </span>
  ) : (
    <Button
      size="sm"
      onClick={() => handleLearn(selectedSpell._id)}
      disabled={isLearning}
    >
      {isLearning ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
      Learn
    </Button>
  );

  return (
    <div className="w-80 overflow-y-auto p-4">
      <SpellCard spell={selectedSpell} action={learnAction} />
    </div>
  );
}
