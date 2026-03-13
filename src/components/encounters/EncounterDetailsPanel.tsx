import { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Loader2, MapPin, X, Calculator, Swords, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateEncounter } from '@/hooks/useEncounters';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { LOCATION_TYPE_LABELS } from '@/components/world/world-constants';
import type { Encounter, EncounterDifficulty, EncounterStatus } from '@/types/encounter';
import type { LocationType } from '@/types/campaign';

interface EncounterDetailsPanelProps {
  campaignId: string;
  encounter: Encounter;
}

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

const DIFFICULTIES: EncounterDifficulty[] = ['easy', 'medium', 'hard', 'deadly'];
const STATUSES: EncounterStatus[] = ['draft', 'ready', 'used'];

// D&D 5e CR → XP lookup
const CR_XP: Record<number, number> = {
  0: 10, 0.125: 25, 0.25: 50, 0.5: 100,
  1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
  6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
  11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000,
  16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000,
  21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000,
  26: 90000, 27: 105000, 28: 120000, 29: 135000, 30: 155000,
};

// XP thresholds based on total XP (rough guide without party level)
function classifyDifficulty(totalXP: number): EncounterDifficulty {
  if (totalXP >= 11000) return 'deadly';
  if (totalXP >= 5000) return 'hard';
  if (totalXP >= 2000) return 'medium';
  return 'easy';
}

export function EncounterDetailsPanel({ campaignId, encounter }: EncounterDetailsPanelProps) {
  const updateEncounter = useUpdateEncounter(campaignId, encounter._id);
  const { data: worldEntities } = useWorldEntities(campaignId);

  const locationEntities = useMemo(() => {
    if (!worldEntities) return [];
    return worldEntities
      .filter((e) => e.type === 'location' || e.type === 'location_detail')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [worldEntities]);

  const [name, setName] = useState(encounter.name);
  const [description, setDescription] = useState(encounter.description);
  const [difficulty, setDifficulty] = useState(encounter.difficulty);
  const [estimatedXP, setEstimatedXP] = useState(encounter.estimatedXP.toString());
  const [notes, setNotes] = useState(encounter.notes);
  const [tags, setTags] = useState(encounter.tags.join(', '));
  const [status, setStatus] = useState(encounter.status);
  const [tactics, setTactics] = useState(encounter.tactics ?? '');
  const [terrain, setTerrain] = useState(encounter.terrain ?? '');
  const [treasure, setTreasure] = useState(encounter.treasure ?? '');
  const [hooks, setHooks] = useState((encounter.hooks ?? []).join('\n'));
  const [locationEntityId, setLocationEntityId] = useState(encounter.locationEntityId ?? '');
  const [dirty, setDirty] = useState(false);

  // Warn before navigating away with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Sync when encounter changes externally
  useEffect(() => {
    setName(encounter.name);
    setDescription(encounter.description);
    setDifficulty(encounter.difficulty);
    setEstimatedXP(encounter.estimatedXP.toString());
    setNotes(encounter.notes);
    setTags(encounter.tags.join(', '));
    setStatus(encounter.status);
    setTactics(encounter.tactics ?? '');
    setTerrain(encounter.terrain ?? '');
    setTreasure(encounter.treasure ?? '');
    setHooks((encounter.hooks ?? []).join('\n'));
    setLocationEntityId(encounter.locationEntityId ?? '');
    setDirty(false);
  }, [encounter._id, encounter.updatedAt]);

  const markDirty = useCallback(() => setDirty(true), []);

  function calculateFromNPCs() {
    let totalXP = 0;
    for (const npc of encounter.npcs) {
      const xp = CR_XP[npc.cr] ?? 0;
      totalXP += xp * npc.count;
    }
    const diff = classifyDifficulty(totalXP);
    setEstimatedXP(totalXP.toString());
    setDifficulty(diff);
    setDirty(true);
    toast.success(`${totalXP.toLocaleString()} XP — ${diff.charAt(0).toUpperCase() + diff.slice(1)}`);
  }

  function handleSave() {
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const parsedHooks = hooks
      .split('\n')
      .map((h) => h.trim())
      .filter(Boolean);

    updateEncounter.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        difficulty: difficulty as EncounterDifficulty,
        estimatedXP: parseInt(estimatedXP, 10) || 0,
        locationEntityId: locationEntityId || null,
        notes: notes.trim(),
        tags: parsedTags,
        status: status as EncounterStatus,
        tactics: tactics.trim(),
        terrain: terrain.trim(),
        treasure: treasure.trim(),
        hooks: parsedHooks,
      },
      {
        onSuccess: () => {
          setDirty(false);
          toast.success('Encounter saved');
        },
        onError: () => toast.error('Failed to save'),
      },
    );
  }

  const selectedLocation = locationEntities.find((e) => e._id === locationEntityId);
  const npcCount = encounter.npcs.reduce((sum, n) => sum + n.count, 0);

  return (
    <div className="mkt-card mkt-card-mounted rounded-xl">
      {renderPreviewCard()}
      <CollapsibleSection title="Basic Info" defaultOpen>
        {renderTopFields()}
      </CollapsibleSection>
      <CollapsibleSection title="Difficulty & Location" defaultOpen>
        {renderMiddleFields()}
      </CollapsibleSection>
      <CollapsibleSection title="Battle Details">
        {renderEncounterFields()}
      </CollapsibleSection>
      <CollapsibleSection title="Notes & Tags">
        {renderBottomFields()}
      </CollapsibleSection>
      <div className="p-3">
        {renderSaveButton()}
      </div>
    </div>
  );

  function renderPreviewCard() {
    const diffColors: Record<EncounterDifficulty, string> = {
      easy: 'bg-emerald-400/15 text-emerald-400',
      medium: 'bg-brass/15 text-brass',
      hard: 'bg-primary/15 text-primary',
      deadly: 'bg-blood/15 text-blood',
    };
    const statusColors: Record<EncounterStatus, string> = {
      draft: 'bg-muted/30 text-muted-foreground',
      ready: 'bg-emerald-400/15 text-emerald-400',
      used: 'bg-muted/20 text-muted-foreground/60',
    };
    return (
      <div className="flex flex-wrap items-center gap-2 border-b border-[hsla(38,30%,25%,0.15)] px-4 py-3">
        <Swords className="h-4 w-4 text-brass" />
        <span className="font-['IM_Fell_English'] text-base text-foreground">
          {name || 'Untitled Encounter'}
        </span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${diffColors[difficulty]}`}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </span>
        {parseInt(estimatedXP) > 0 && (
          <span className="text-[10px] text-muted-foreground">{parseInt(estimatedXP).toLocaleString()} XP</span>
        )}
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {selectedLocation && (
          <span className="flex items-center gap-1 text-[10px] text-[hsl(150,50%,55%)]">
            <MapPin className="h-3 w-3" />
            {selectedLocation.name}
          </span>
        )}
        {npcCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="h-3 w-3" />
            {npcCount} creature{npcCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  function renderTopFields() {
    return (
      <>
        <div>
          <label htmlFor="enc-name" className={labelClass}>Name</label>
          <input
            id="enc-name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); markDirty(); }}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="enc-desc" className={labelClass}>Description</label>
          <textarea
            id="enc-desc"
            value={description}
            onChange={(e) => { setDescription(e.target.value); markDirty(); }}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="What's the setup for this encounter?"
          />
        </div>
      </>
    );
  }

  function renderMiddleFields() {
    return (
      <>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="enc-diff" className={labelClass}>Difficulty</label>
            <select
              id="enc-diff"
              value={difficulty}
              onChange={(e) => { setDifficulty(e.target.value as EncounterDifficulty); markDirty(); }}
              className={inputClass}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="enc-xp" className={labelClass}>
              Est. XP
              {encounter.npcs.length > 0 && (
                <button
                  type="button"
                  onClick={calculateFromNPCs}
                  className="ml-1.5 inline-flex items-center gap-0.5 rounded border border-brass/30 bg-brass/10 px-1 py-0.5 text-[8px] text-brass hover:bg-brass/20 transition-colors normal-case tracking-normal font-sans"
                  title="Calculate XP and difficulty from creature CRs"
                >
                  <Calculator className="h-2.5 w-2.5" />
                  Calc
                </button>
              )}
            </label>
            <input
              id="enc-xp"
              type="number"
              min={0}
              value={estimatedXP}
              onChange={(e) => { setEstimatedXP(e.target.value); markDirty(); }}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="enc-status" className={labelClass}>Status</label>
            <select
              id="enc-status"
              value={status}
              onChange={(e) => { setStatus(e.target.value as EncounterStatus); markDirty(); }}
              className={inputClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Location link */}
        <div>
          <label htmlFor="enc-location" className={labelClass}>
            <MapPin className="mr-1 inline h-3 w-3" />
            World Location
          </label>
          {locationEntityId && selectedLocation ? (
            <div className="mt-1 flex items-center gap-2 rounded-sm border border-forest/30 bg-forest/10 px-3 py-2 text-sm">
              <MapPin className="h-3.5 w-3.5 text-[hsl(150,50%,55%)]" />
              <span className="text-foreground">{selectedLocation.name}</span>
              {selectedLocation.locationType && (
                <span className="rounded bg-background/40 px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">
                  {LOCATION_TYPE_LABELS[selectedLocation.locationType as LocationType] ?? selectedLocation.locationType}
                </span>
              )}
              <button
                type="button"
                onClick={() => { setLocationEntityId(''); markDirty(); }}
                className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <select
              id="enc-location"
              value=""
              onChange={(e) => { setLocationEntityId(e.target.value); markDirty(); }}
              className={inputClass}
            >
              <option value="">— No location —</option>
              {locationEntities.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}
                  {loc.locationType ? ` (${LOCATION_TYPE_LABELS[loc.locationType as LocationType] ?? loc.locationType})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </>
    );
  }

  function renderEncounterFields() {
    return (
      <>
        <div>
          <label htmlFor="enc-tactics" className={labelClass}>Tactics</label>
          <textarea
            id="enc-tactics"
            value={tactics}
            onChange={(e) => { setTactics(e.target.value); markDirty(); }}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="Enemy strategy, positioning, priorities..."
          />
        </div>

        <div>
          <label htmlFor="enc-terrain" className={labelClass}>Terrain</label>
          <textarea
            id="enc-terrain"
            value={terrain}
            onChange={(e) => { setTerrain(e.target.value); markDirty(); }}
            rows={2}
            className={`${inputClass} resize-none`}
            placeholder="Environmental hazards, cover, difficult terrain..."
          />
        </div>

        <div>
          <label htmlFor="enc-treasure" className={labelClass}>Treasure</label>
          <textarea
            id="enc-treasure"
            value={treasure}
            onChange={(e) => { setTreasure(e.target.value); markDirty(); }}
            rows={2}
            className={`${inputClass} resize-none`}
            placeholder="Loot, rewards, items found..."
          />
        </div>

        <div>
          <label htmlFor="enc-hooks" className={labelClass}>Story Hooks (one per line)</label>
          <textarea
            id="enc-hooks"
            value={hooks}
            onChange={(e) => { setHooks(e.target.value); markDirty(); }}
            rows={2}
            className={`${inputClass} resize-none`}
            placeholder="Plot threads, clues, revelations..."
          />
        </div>
      </>
    );
  }

  function renderBottomFields() {
    return (
      <>
        <div>
          <label htmlFor="enc-notes" className={labelClass}>Notes</label>
          <textarea
            id="enc-notes"
            value={notes}
            onChange={(e) => { setNotes(e.target.value); markDirty(); }}
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder="GM notes, reminders, dramatic moments..."
          />
        </div>

        <div>
          <label htmlFor="enc-tags" className={labelClass}>Tags (comma separated)</label>
          <input
            id="enc-tags"
            type="text"
            value={tags}
            onChange={(e) => { setTags(e.target.value); markDirty(); }}
            className={inputClass}
            placeholder="boss, outdoor, level-5"
          />
        </div>
      </>
    );
  }

  function renderSaveButton() {
    return (
      <button
        type="button"
        onClick={handleSave}
        disabled={!dirty || updateEncounter.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-sm border border-brass/40 bg-brass/10 px-4 py-2 font-[Cinzel] text-xs uppercase tracking-wider text-brass transition-all hover:bg-brass/20 disabled:opacity-40"
      >
        {updateEncounter.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Save className="h-3.5 w-3.5" />
        )}
        {dirty ? 'Save Changes' : 'Saved'}
      </button>
    );
  }
}
