import { useState } from 'react';
import { Library, Loader2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { SpawnEnemiesModal } from '@/components/enemies/SpawnEnemiesModal';
import { useSaveAIEncounter, useLoadEncounter } from '@/hooks/useEncounters';
import type { EncounterDifficulty, EncounterNPC } from '@/types/encounter';
import type { SpawnedEnemy } from '@/types/enemy-template';

// ── Types ────────────────────────────────────────────────────

interface CreatureEntry {
  key: string;
  fromLibrary: boolean;
  name: string;
  count: number;
  cr: number;
  hp: number;
  ac: number;
  initiativeBonus: number;
  statBlock: string;
}

interface InlineEncounterBuilderProps {
  campaignId: string;
  compact?: boolean;
  onDone: () => void;
}

const DIFFICULTIES: EncounterDifficulty[] = ['easy', 'medium', 'hard', 'deadly'];

function parseCR(cr: string | undefined): number {
  if (!cr) return 0;
  if (cr.includes('/')) {
    const [num, den] = cr.split('/');
    return (parseInt(num, 10) || 0) / (parseInt(den, 10) || 1);
  }
  return parseFloat(cr) || 0;
}

let nextKey = 1;

// ── Component ────────────────────────────────────────────────

export default function InlineEncounterBuilder({
  campaignId,
  compact,
  onDone,
}: InlineEncounterBuilderProps) {
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<EncounterDifficulty>('medium');
  const [description, setDescription] = useState('');
  const [creatures, setCreatures] = useState<CreatureEntry[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const saveEncounter = useSaveAIEncounter(campaignId);
  const loadEncounter = useLoadEncounter(campaignId);

  function handleSpawn(enemies: SpawnedEnemy[]) {
    if (enemies.length === 0) return;
    const first = enemies[0];
    // Strip numeric/alpha suffix to get the base template name
    const baseName = first.name.replace(/\s+(\d+|[A-Z])$/, '') || first.name;
    setCreatures((prev) => [
      ...prev,
      {
        key: `c-${nextKey++}`,
        fromLibrary: true,
        name: baseName,
        count: enemies.length,
        cr: parseCR(first.cr),
        hp: first.hp,
        ac: first.ac,
        initiativeBonus: first.initiativeBonus ?? 0,
        statBlock: '',
      },
    ]);
    setPickerOpen(false);
  }

  function addCustom() {
    setCreatures((prev) => [
      ...prev,
      {
        key: `c-${nextKey++}`,
        fromLibrary: false,
        name: '',
        count: 1,
        cr: 0,
        hp: 10,
        ac: 12,
        initiativeBonus: 0,
        statBlock: '',
      },
    ]);
  }

  function updateCreature(key: string, patch: Partial<CreatureEntry>) {
    setCreatures((prev) =>
      prev.map((c) => (c.key === key ? { ...c, ...patch } : c)),
    );
  }

  function removeCreature(key: string) {
    setCreatures((prev) => prev.filter((c) => c.key !== key));
  }

  async function handleSave(andLoad: boolean) {
    if (!name.trim()) {
      toast.error('Encounter name is required');
      return;
    }
    if (creatures.length === 0) {
      toast.error('Add at least one creature');
      return;
    }
    if (creatures.some((c) => !c.name.trim())) {
      toast.error('All creatures must have a name');
      return;
    }

    const npcs: EncounterNPC[] = creatures.map((c) => ({
      name: c.name,
      count: c.count,
      cr: c.cr,
      hp: c.hp,
      ac: c.ac,
      initiativeBonus: c.initiativeBonus,
      statBlock: c.statBlock,
    }));

    const totalXP = npcs.reduce((s, n) => s + crToXP(n.cr) * n.count, 0);

    try {
      const saved = await saveEncounter.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        difficulty,
        estimatedXP: totalXP,
        npcs,
      });

      if (andLoad) {
        await loadEncounter.mutateAsync({
          encounterId: saved._id,
          body: { addToInitiative: true, clearExistingMap: false },
        });
        toast.success('Encounter saved & loaded');
      } else {
        toast.success('Encounter saved');
      }
      onDone();
    } catch {
      toast.error('Failed to save encounter');
    }
  }

  const saving = saveEncounter.isPending || loadEncounter.isPending;
  const totalCreatures = creatures.reduce((s, c) => s + c.count, 0);

  if (compact) {
    return (
      <CompactBuilder
        name={name}
        setName={setName}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        creatures={creatures}
        pickerOpen={pickerOpen}
        setPickerOpen={setPickerOpen}
        onSpawnFromLibrary={handleSpawn}
        addCustom={addCustom}
        updateCreature={updateCreature}
        removeCreature={removeCreature}
        onSave={() => handleSave(false)}
        onSaveAndLoad={() => handleSave(true)}
        onCancel={onDone}
        saving={saving}
        totalCreatures={totalCreatures}
      />
    );
  }

  return (
    <div className="space-y-4">
      {renderHeader(onDone, () => handleSave(false), () => handleSave(true), saving)}
      {renderDetailsForm(name, setName, difficulty, setDifficulty, description, setDescription)}
      {renderCreaturesSection(
        creatures,
        setPickerOpen,
        addCustom,
        updateCreature,
        removeCreature,
      )}
      {renderSummary(creatures, totalCreatures, difficulty)}
      <SpawnEnemiesModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSpawn={handleSpawn}
      />
    </div>
  );
}

// ── Full-width render helpers ────────────────────────────────

function renderHeader(
  onCancel: () => void,
  onSave: () => void,
  onSaveAndLoad: () => void,
  saving: boolean,
) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="font-[Cinzel] text-base font-semibold text-foreground uppercase tracking-wider">
        Create Encounter
      </h3>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" variant="outline" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
          Save
        </Button>
        <Button size="sm" variant="primary" onClick={onSaveAndLoad} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
          Save & Load
        </Button>
      </div>
    </div>
  );
}

function renderDetailsForm(
  name: string,
  setName: (v: string) => void,
  difficulty: EncounterDifficulty,
  setDifficulty: (v: EncounterDifficulty) => void,
  description: string,
  setDescription: (v: string) => void,
) {
  return (
    <div className="rounded-md border border-iron/30 bg-card/40 p-4 space-y-3">
      <div>
        <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Goblin Ambush"
          className="w-full rounded-sm border border-border bg-input px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          Difficulty
        </label>
        <div className="flex gap-1.5">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`rounded-sm px-2.5 py-1 font-[Cinzel] text-[10px] uppercase tracking-wider transition-colors ${
                difficulty === d
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="The party is ambushed on the forest road..."
          rows={2}
          className="w-full rounded-sm border border-border bg-input px-3 py-2 text-sm text-foreground font-['IM_Fell_English'] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>
    </div>
  );
}

function renderCreaturesSection(
  creatures: CreatureEntry[],
  setPickerOpen: (v: boolean) => void,
  addCustom: () => void,
  updateCreature: (key: string, patch: Partial<CreatureEntry>) => void,
  removeCreature: (key: string) => void,
) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          Creatures <span className="text-destructive">*</span>
        </span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
            <Library className="mr-1 h-3 w-3" />
            Library
          </Button>
          <Button size="sm" variant="outline" onClick={addCustom}>
            <Plus className="mr-1 h-3 w-3" />
            Custom
          </Button>
        </div>
      </div>

      {creatures.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 py-8 text-center">
          <p className="text-xs text-muted-foreground font-['IM_Fell_English'] italic mb-3">
            No creatures added yet
          </p>
          <div className="flex justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
              <Library className="mr-1 h-3 w-3" />
              Browse Library
            </Button>
            <Button size="sm" variant="outline" onClick={addCustom}>
              <Plus className="mr-1 h-3 w-3" />
              Add Custom
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {creatures.map((c) => (
            <CreatureCard
              key={c.key}
              creature={c}
              onUpdate={(patch) => updateCreature(c.key, patch)}
              onRemove={() => removeCreature(c.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function renderSummary(
  creatures: CreatureEntry[],
  totalCreatures: number,
  difficulty: EncounterDifficulty,
) {
  if (creatures.length === 0) return null;
  const totalXP = creatures.reduce((s, c) => s + crToXP(c.cr) * c.count, 0);
  return (
    <div className="rounded-md border border-gold/20 bg-accent/20 texture-parchment p-3">
      <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">Summary</span>
      <p className="text-sm text-foreground mt-0.5">
        {totalCreatures} creature{totalCreatures !== 1 ? 's' : ''} across{' '}
        {creatures.length} type{creatures.length !== 1 ? 's' : ''} &middot;{' '}
        <span className="capitalize">{difficulty}</span> &middot; ~{totalXP} XP
      </p>
    </div>
  );
}

// ── Creature card ────────────────────────────────────────────

function CreatureCard({
  creature,
  onUpdate,
  onRemove,
}: {
  creature: CreatureEntry;
  onUpdate: (patch: Partial<CreatureEntry>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-md border border-iron/30 bg-card/40 p-3">
      {renderCreatureHeader(creature, onRemove)}
      {renderCreatureFields(creature, onUpdate)}
    </div>
  );
}

function renderCreatureHeader(creature: CreatureEntry, onRemove: () => void) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground truncate max-w-[140px]">
          {creature.name || 'Unnamed'}
        </span>
        {creature.fromLibrary && (
          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-[Cinzel] uppercase tracking-wider text-primary">
            Library
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Remove creature"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function renderCreatureFields(
  creature: CreatureEntry,
  onUpdate: (patch: Partial<CreatureEntry>) => void,
) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="col-span-3">
        <label className="mb-0.5 block text-[10px] text-muted-foreground">Name</label>
        <input
          type="text"
          value={creature.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Goblin Scout"
          className="w-full rounded-sm border border-border bg-input px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <StatInput label="Count" value={creature.count} min={1} max={20} onChange={(v) => onUpdate({ count: v })} />
      <StatInput label="HP" value={creature.hp} min={1} onChange={(v) => onUpdate({ hp: v })} />
      <StatInput label="AC" value={creature.ac} min={1} max={30} onChange={(v) => onUpdate({ ac: v })} />
      <StatInput label="CR" value={creature.cr} min={0} step={0.125} onChange={(v) => onUpdate({ cr: v })} />
      <StatInput label="Init +" value={creature.initiativeBonus} min={-5} max={20} onChange={(v) => onUpdate({ initiativeBonus: v })} />
    </div>
  );
}

function StatInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] text-muted-foreground">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-sm border border-border bg-input px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

// ── Compact builder (for sidebar) ────────────────────────────

interface CompactBuilderProps {
  name: string;
  setName: (v: string) => void;
  difficulty: EncounterDifficulty;
  setDifficulty: (v: EncounterDifficulty) => void;
  creatures: CreatureEntry[];
  pickerOpen: boolean;
  setPickerOpen: (v: boolean) => void;
  onSpawnFromLibrary: (enemies: SpawnedEnemy[]) => void;
  addCustom: () => void;
  updateCreature: (key: string, patch: Partial<CreatureEntry>) => void;
  removeCreature: (key: string) => void;
  onSave: () => void;
  onSaveAndLoad: () => void;
  onCancel: () => void;
  saving: boolean;
  totalCreatures: number;
}

function CompactBuilder({
  name,
  setName,
  difficulty,
  setDifficulty,
  creatures,
  pickerOpen,
  setPickerOpen,
  onSpawnFromLibrary,
  addCustom,
  updateCreature,
  removeCreature,
  onSave,
  onSaveAndLoad,
  onCancel,
  saving,
  totalCreatures,
}: CompactBuilderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-foreground font-semibold">
          New Encounter
        </span>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {renderCompactForm(name, setName, difficulty, setDifficulty)}
      {renderCompactCreatures(creatures, setPickerOpen, addCustom, updateCreature, removeCreature)}
      {renderCompactFooter(totalCreatures, onSave, onSaveAndLoad, saving)}
      <SpawnEnemiesModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSpawn={onSpawnFromLibrary}
      />
    </div>
  );
}

function renderCompactForm(
  name: string,
  setName: (v: string) => void,
  difficulty: EncounterDifficulty,
  setDifficulty: (v: EncounterDifficulty) => void,
) {
  return (
    <>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Encounter name..."
        className="w-full rounded-sm border border-border bg-input px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex gap-1">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDifficulty(d)}
            className={`flex-1 rounded-sm py-1 text-[9px] font-[Cinzel] uppercase tracking-wider transition-colors ${
              difficulty === d
                ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </>
  );
}

function renderCompactCreatures(
  creatures: CreatureEntry[],
  setPickerOpen: (v: boolean) => void,
  addCustom: () => void,
  updateCreature: (key: string, patch: Partial<CreatureEntry>) => void,
  removeCreature: (key: string) => void,
) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex-1 rounded-sm border border-border bg-background/60 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
        >
          <Library className="mr-1 inline h-3 w-3" />
          Library
        </button>
        <button
          type="button"
          onClick={addCustom}
          className="flex-1 rounded-sm border border-border bg-background/60 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
        >
          <Plus className="mr-1 inline h-3 w-3" />
          Custom
        </button>
      </div>

      {creatures.map((c) => (
        <div key={c.key} className="rounded border border-border/60 bg-background/30 p-1.5 space-y-1">
          <div className="flex items-center justify-between gap-1">
            <input
              type="text"
              value={c.name}
              onChange={(e) => updateCreature(c.key, { name: e.target.value })}
              placeholder="Name"
              className="min-w-0 flex-1 rounded-sm border border-border bg-input px-1.5 py-0.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => removeCreature(c.key)}
              className="text-muted-foreground hover:text-destructive shrink-0"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <CompactStatInput label="#" value={c.count} min={1} onChange={(v) => updateCreature(c.key, { count: v })} />
            <CompactStatInput label="HP" value={c.hp} min={1} onChange={(v) => updateCreature(c.key, { hp: v })} />
            <CompactStatInput label="AC" value={c.ac} min={1} onChange={(v) => updateCreature(c.key, { ac: v })} />
            <CompactStatInput label="Init" value={c.initiativeBonus} onChange={(v) => updateCreature(c.key, { initiativeBonus: v })} />
          </div>
        </div>
      ))}

      {creatures.length === 0 && (
        <p className="text-center text-[10px] text-muted-foreground py-2 font-['IM_Fell_English'] italic">
          No creatures added
        </p>
      )}
    </div>
  );
}

function renderCompactFooter(
  totalCreatures: number,
  onSave: () => void,
  onSaveAndLoad: () => void,
  saving: boolean,
) {
  return (
    <div className="space-y-1">
      {totalCreatures > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">
          {totalCreatures} creature{totalCreatures !== 1 ? 's' : ''}
        </p>
      )}
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={onSave} disabled={saving} className="flex-1 text-[10px]">
          Save
        </Button>
        <Button size="sm" variant="primary" onClick={onSaveAndLoad} disabled={saving} className="flex-1 text-[10px]">
          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Save & Load
        </Button>
      </div>
    </div>
  );
}

function CompactStatInput({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-[8px] text-muted-foreground text-center">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="w-full rounded-sm border border-border bg-input px-1 py-0.5 text-center text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

// ── XP lookup (simplified CR → XP table) ─────────────────────

function crToXP(cr: number): number {
  const table: Record<number, number> = {
    0: 10, 0.125: 25, 0.25: 50, 0.5: 100,
    1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
    6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
    11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000,
    16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000,
    21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000,
    26: 90000, 27: 105000, 28: 120000, 29: 135000, 30: 155000,
  };
  return table[cr] ?? 0;
}
