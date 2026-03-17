import { useState, useMemo, useCallback } from 'react';
import { X, Search, Check, Loader2, BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { SpellCard, spellLevelLabel, SCHOOL_COLORS } from './SpellCard';
import {
  useSpells,
  useLearnSpell,
  useCreateCampaignSpell,
  useUpdateCampaignSpell,
  useDeleteCampaignSpell,
} from '@/hooks/useSpells';
import type { Spell, PopulatedCharacterSpell, SpellQuery, CreateSpellPayload } from '@/types/spell';

interface SpellBrowserProps {
  characterId: string;
  campaignId: string;
  knownSpells: PopulatedCharacterSpell[];
  open: boolean;
  onClose: () => void;
}

type ViewMode = 'browse' | 'create' | 'edit';

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

const EMPTY_FORM: CreateSpellPayload = {
  name: '',
  level: 0,
  school: 'evocation',
  castingTime: '1 action',
  range: 'Self',
  duration: 'Instantaneous',
  components: [],
  material: '',
  description: '',
  higherLevels: '',
  classes: [],
  ritual: false,
  concentration: false,
};

export function SpellBrowser({
  characterId,
  campaignId,
  knownSpells,
  open,
  onClose,
}: SpellBrowserProps) {
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | undefined>(undefined);
  const [schoolFilter, setSchoolFilter] = useState<string | undefined>(undefined);
  const [classFilter, setClassFilter] = useState<string | undefined>(undefined);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [editingSpell, setEditingSpell] = useState<Spell | null>(null);
  const [formData, setFormData] = useState<CreateSpellPayload>(EMPTY_FORM);

  const query: SpellQuery = useMemo(() => {
    const q: SpellQuery = {};
    if (searchText) q.search = searchText;
    if (levelFilter !== undefined) q.level = levelFilter;
    if (schoolFilter) q.school = schoolFilter;
    if (classFilter) q.class = classFilter;
    if (campaignId) q.campaignId = campaignId;
    return q;
  }, [searchText, levelFilter, schoolFilter, classFilter, campaignId]);

  const { data: spells, isLoading } = useSpells(query);
  const learnSpell = useLearnSpell();
  const createSpell = useCreateCampaignSpell();
  const updateSpell = useUpdateCampaignSpell();
  const deleteSpell = useDeleteCampaignSpell();

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

  const handleOpenCreate = useCallback(() => {
    setFormData(EMPTY_FORM);
    setEditingSpell(null);
    setViewMode('create');
  }, []);

  const handleOpenEdit = useCallback((spell: Spell) => {
    setFormData({
      name: spell.name,
      level: spell.level,
      school: spell.school,
      castingTime: spell.castingTime,
      range: spell.range,
      duration: spell.duration,
      components: spell.components ?? [],
      material: spell.material ?? '',
      description: spell.description,
      higherLevels: spell.higherLevels ?? '',
      classes: spell.classes ?? [],
      ritual: spell.ritual ?? false,
      concentration: spell.concentration ?? false,
    });
    setEditingSpell(spell);
    setViewMode('edit');
  }, []);

  const handleSaveSpell = useCallback(() => {
    if (viewMode === 'edit' && editingSpell) {
      updateSpell.mutate(
        { spellId: editingSpell._id, payload: formData },
        {
          onSuccess: () => {
            toast.success('Spell updated');
            setViewMode('browse');
            setEditingSpell(null);
          },
          onError: () => toast.error('Failed to update spell'),
        },
      );
    } else {
      createSpell.mutate(
        { campaignId, payload: formData },
        {
          onSuccess: () => {
            toast.success('Custom spell created!');
            setViewMode('browse');
          },
          onError: () => toast.error('Failed to create spell'),
        },
      );
    }
  }, [viewMode, editingSpell, formData, campaignId, createSpell, updateSpell]);

  const handleDeleteSpell = useCallback(
    (spellId: string) => {
      deleteSpell.mutate(spellId, {
        onSuccess: () => {
          toast.success('Spell deleted');
          setSelectedSpell(null);
        },
        onError: () => toast.error('Failed to delete spell'),
      });
    },
    [deleteSpell],
  );

  const handleCancelForm = useCallback(() => {
    setViewMode('browse');
    setEditingSpell(null);
  }, []);

  if (!open) return null;

  const isFormView = viewMode === 'create' || viewMode === 'edit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-sm border border-[hsla(38,50%,30%,0.15)] bg-[hsl(24,18%,9%)] shadow-2xl">
        {renderModalHeader(onClose, handleOpenCreate, isFormView)}
        {isFormView
          ? renderSpellForm(formData, setFormData, handleSaveSpell, handleCancelForm, viewMode, createSpell.isPending || updateSpell.isPending)
          : renderBrowseView(searchText, setSearchText, levelFilter, setLevelFilter, schoolFilter, setSchoolFilter, classFilter, setClassFilter, spells, isLoading, knownSpellIds, selectedSpell, setSelectedSpell, handleLearn, learnSpell.isPending, handleOpenEdit, handleDeleteSpell, deleteSpell.isPending)}
      </div>
    </div>
  );
}

function renderModalHeader(onClose: () => void, onCreateClick: () => void, isFormView: boolean) {
  return (
    <div className="flex items-center justify-between border-b border-[hsla(38,50%,30%,0.15)] px-4 py-3">
      {renderModalHeaderLeft(isFormView)}
      {renderModalHeaderRight(onClose, onCreateClick, isFormView)}
    </div>
  );
}

function renderModalHeaderLeft(isFormView: boolean) {
  return (
    <div className="flex items-center gap-2">
      <BookOpen className="h-4 w-4 text-primary" />
      <h2 className="font-[Cinzel] text-sm font-semibold uppercase tracking-wider text-foreground">
        {isFormView ? 'Custom Spell' : 'Spell Reference'}
      </h2>
    </div>
  );
}

function renderModalHeaderRight(onClose: () => void, onCreateClick: () => void, isFormView: boolean) {
  return (
    <div className="flex items-center gap-2">
      {!isFormView && (
        <Button size="sm" onClick={onCreateClick}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Create Custom Spell
        </Button>
      )}
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

function renderBrowseView(
  searchText: string,
  setSearchText: (v: string) => void,
  levelFilter: number | undefined,
  setLevelFilter: (v: number | undefined) => void,
  schoolFilter: string | undefined,
  setSchoolFilter: (v: string | undefined) => void,
  classFilter: string | undefined,
  setClassFilter: (v: string | undefined) => void,
  spells: Spell[] | undefined,
  isLoading: boolean,
  knownSpellIds: Set<string>,
  selectedSpell: Spell | null,
  setSelectedSpell: (s: Spell | null) => void,
  handleLearn: (spellId: string) => void,
  isLearning: boolean,
  handleOpenEdit: (spell: Spell) => void,
  handleDeleteSpell: (spellId: string) => void,
  isDeleting: boolean,
) {
  return (
    <>
      {renderFilters(searchText, setSearchText, levelFilter, setLevelFilter, schoolFilter, setSchoolFilter, classFilter, setClassFilter)}
      {renderContent(spells, isLoading, knownSpellIds, selectedSpell, setSelectedSpell, handleLearn, isLearning, handleOpenEdit, handleDeleteSpell, isDeleting)}
    </>
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
      {renderLevelSelect(levelFilter, setLevelFilter)}
      {renderSchoolSelect(schoolFilter, setSchoolFilter)}
      {renderClassSelect(classFilter, setClassFilter)}
    </div>
  );
}

function renderLevelSelect(
  levelFilter: number | undefined,
  setLevelFilter: (v: number | undefined) => void,
) {
  return (
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
  );
}

function renderSchoolSelect(
  schoolFilter: string | undefined,
  setSchoolFilter: (v: string | undefined) => void,
) {
  return (
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
  );
}

function renderClassSelect(
  classFilter: string | undefined,
  setClassFilter: (v: string | undefined) => void,
) {
  return (
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
  handleOpenEdit: (spell: Spell) => void,
  handleDeleteSpell: (spellId: string) => void,
  isDeleting: boolean,
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
      {renderSpellDetail(selectedSpell, knownSpellIds, handleLearn, isLearning, handleOpenEdit, handleDeleteSpell, isDeleting)}
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
        {spell.isHomebrew && (
          <span className="ml-1.5 inline-block rounded-sm bg-violet-900/40 px-1 py-0.5 align-middle text-[9px] font-bold uppercase text-violet-400">
            Homebrew
          </span>
        )}
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
  handleOpenEdit: (spell: Spell) => void,
  handleDeleteSpell: (spellId: string) => void,
  isDeleting: boolean,
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

  return (
    <div className="w-80 overflow-y-auto p-4">
      <SpellCard spell={selectedSpell} action={renderDetailActions(selectedSpell, isKnown, handleLearn, isLearning, handleOpenEdit, handleDeleteSpell, isDeleting)} />
    </div>
  );
}

function renderDetailActions(
  spell: Spell,
  isKnown: boolean,
  handleLearn: (spellId: string) => void,
  isLearning: boolean,
  handleOpenEdit: (spell: Spell) => void,
  handleDeleteSpell: (spellId: string) => void,
  isDeleting: boolean,
) {
  return (
    <div className="flex items-center gap-1.5">
      {renderLearnAction(spell, isKnown, handleLearn, isLearning)}
      {spell.isHomebrew && renderHomebrewActions(spell, handleOpenEdit, handleDeleteSpell, isDeleting)}
    </div>
  );
}

function renderLearnAction(
  spell: Spell,
  isKnown: boolean,
  handleLearn: (spellId: string) => void,
  isLearning: boolean,
) {
  if (isKnown) {
    return (
      <span className="flex items-center gap-1 rounded-sm bg-emerald-900/40 px-2 py-1 text-[10px] font-bold uppercase text-emerald-400">
        <Check className="h-3 w-3" />
        Known
      </span>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => handleLearn(spell._id)}
      disabled={isLearning}
    >
      {isLearning ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
      Learn
    </Button>
  );
}

function renderHomebrewActions(
  spell: Spell,
  handleOpenEdit: (spell: Spell) => void,
  handleDeleteSpell: (spellId: string) => void,
  isDeleting: boolean,
) {
  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenEdit(spell)}
        className="rounded-sm border border-primary/30 bg-primary/10 p-1 text-primary hover:bg-primary/20"
        title="Edit spell"
      >
        <Pencil className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => handleDeleteSpell(spell._id)}
        disabled={isDeleting}
        className="rounded-sm border border-red-800/40 bg-red-950/30 p-1 text-red-400 hover:bg-red-900/40 disabled:opacity-50"
        title="Delete spell"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </>
  );
}

// ── Spell Form ─────────────────────────────────────────────────

function renderSpellForm(
  formData: CreateSpellPayload,
  setFormData: (fn: CreateSpellPayload | ((prev: CreateSpellPayload) => CreateSpellPayload)) => void,
  onSave: () => void,
  onCancel: () => void,
  viewMode: ViewMode,
  isSaving: boolean,
) {
  const update = (field: keyof CreateSpellPayload, value: unknown) => {
    setFormData((prev: CreateSpellPayload) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {renderFormTopFields(formData, update)}
      {renderFormMiddleFields(formData, update)}
      {renderFormTextFields(formData, update)}
      {renderFormCheckboxes(formData, update)}
      {renderFormActions(onSave, onCancel, viewMode, isSaving, formData)}
    </div>
  );
}

function renderFormTopFields(
  formData: CreateSpellPayload,
  update: (field: keyof CreateSpellPayload, value: unknown) => void,
) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {renderFormField('Name', (
        <input
          type="text"
          value={formData.name}
          onChange={(e) => update('name', e.target.value)}
          className="w-full rounded-sm border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
          placeholder="Spell name"
        />
      ))}
      {renderFormField('Level', (
        <select
          value={formData.level}
          onChange={(e) => update('level', Number(e.target.value))}
          className="w-full rounded-sm border border-border bg-input px-2 py-1.5 text-sm text-foreground"
        >
          {LEVEL_OPTIONS.slice(1).map((opt) => (
            <option key={opt.label} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
      {renderFormField('School', (
        <select
          value={formData.school}
          onChange={(e) => update('school', e.target.value)}
          className="w-full rounded-sm border border-border bg-input px-2 py-1.5 text-sm text-foreground"
        >
          {SCHOOL_OPTIONS.slice(1).map((opt) => (
            <option key={opt.label} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
      {renderFormField('Casting Time', (
        <input
          type="text"
          value={formData.castingTime}
          onChange={(e) => update('castingTime', e.target.value)}
          className="w-full rounded-sm border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
          placeholder="1 action"
        />
      ))}
    </div>
  );
}

function renderFormMiddleFields(
  formData: CreateSpellPayload,
  update: (field: keyof CreateSpellPayload, value: unknown) => void,
) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {renderFormField('Range', (
        <input
          type="text"
          value={formData.range}
          onChange={(e) => update('range', e.target.value)}
          className="w-full rounded-sm border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
          placeholder="120 feet"
        />
      ))}
      {renderFormField('Duration', (
        <input
          type="text"
          value={formData.duration}
          onChange={(e) => update('duration', e.target.value)}
          className="w-full rounded-sm border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
          placeholder="Instantaneous"
        />
      ))}
      {renderFormField('Components (comma-separated)', (
        <input
          type="text"
          value={(formData.components ?? []).join(', ')}
          onChange={(e) => update('components', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          className="w-full rounded-sm border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
          placeholder="V, S, M"
        />
      ))}
      {renderFormField('Material', (
        <input
          type="text"
          value={formData.material ?? ''}
          onChange={(e) => update('material', e.target.value)}
          className="w-full rounded-sm border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
          placeholder="a tiny strip of white cloth"
        />
      ))}
    </div>
  );
}

function renderFormTextFields(
  formData: CreateSpellPayload,
  update: (field: keyof CreateSpellPayload, value: unknown) => void,
) {
  return (
    <>
      {renderFormField('Description', (
        <textarea
          value={formData.description}
          onChange={(e) => update('description', e.target.value)}
          rows={4}
          className="w-full rounded-sm border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none resize-none"
          placeholder="Describe what this spell does..."
        />
      ))}
      {renderFormField('At Higher Levels (optional)', (
        <textarea
          value={formData.higherLevels ?? ''}
          onChange={(e) => update('higherLevels', e.target.value)}
          rows={2}
          className="w-full rounded-sm border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none resize-none"
          placeholder="When you cast this spell using a spell slot of..."
        />
      ))}
      {renderFormField('Classes (comma-separated)', (
        <input
          type="text"
          value={(formData.classes ?? []).join(', ')}
          onChange={(e) => update('classes', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          className="w-full rounded-sm border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
          placeholder="Wizard, Sorcerer"
        />
      ))}
    </>
  );
}

function renderFormCheckboxes(
  formData: CreateSpellPayload,
  update: (field: keyof CreateSpellPayload, value: unknown) => void,
) {
  return (
    <div className="flex gap-4">
      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={formData.ritual ?? false}
          onChange={(e) => update('ritual', e.target.checked)}
          className="rounded-sm border-border"
        />
        Ritual
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={formData.concentration ?? false}
          onChange={(e) => update('concentration', e.target.checked)}
          className="rounded-sm border-border"
        />
        Concentration
      </label>
    </div>
  );
}

function renderFormActions(
  onSave: () => void,
  onCancel: () => void,
  viewMode: ViewMode,
  isSaving: boolean,
  formData: CreateSpellPayload,
) {
  const isValid = formData.name.trim() && formData.description.trim();

  return (
    <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3">
      <Button size="sm" onClick={onCancel} variant="ghost">
        Cancel
      </Button>
      <Button size="sm" onClick={onSave} disabled={isSaving || !isValid}>
        {isSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
        {viewMode === 'edit' ? 'Update Spell' : 'Create Spell'}
      </Button>
    </div>
  );
}

function renderFormField(label: string, input: React.ReactNode) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {input}
    </div>
  );
}
