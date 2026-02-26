import { useState, useEffect, useCallback } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateEncounter } from '@/hooks/useEncounters';
import type { Encounter, EncounterDifficulty, EncounterStatus } from '@/types/encounter';

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

export function EncounterDetailsPanel({ campaignId, encounter }: EncounterDetailsPanelProps) {
  const updateEncounter = useUpdateEncounter(campaignId, encounter._id);

  const [name, setName] = useState(encounter.name);
  const [description, setDescription] = useState(encounter.description);
  const [difficulty, setDifficulty] = useState(encounter.difficulty);
  const [estimatedXP, setEstimatedXP] = useState(encounter.estimatedXP.toString());
  const [notes, setNotes] = useState(encounter.notes);
  const [tags, setTags] = useState(encounter.tags.join(', '));
  const [status, setStatus] = useState(encounter.status);
  const [dirty, setDirty] = useState(false);

  // Sync when encounter changes externally
  useEffect(() => {
    setName(encounter.name);
    setDescription(encounter.description);
    setDifficulty(encounter.difficulty);
    setEstimatedXP(encounter.estimatedXP.toString());
    setNotes(encounter.notes);
    setTags(encounter.tags.join(', '));
    setStatus(encounter.status);
    setDirty(false);
  }, [encounter._id, encounter.updatedAt]);

  const markDirty = useCallback(() => setDirty(true), []);

  function handleSave() {
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    updateEncounter.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        difficulty: difficulty as EncounterDifficulty,
        estimatedXP: parseInt(estimatedXP, 10) || 0,
        notes: notes.trim(),
        tags: parsedTags,
        status: status as EncounterStatus,
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

  return (
    <div className="space-y-4">
      {renderTopFields()}
      {renderMiddleFields()}
      {renderBottomFields()}
      {renderSaveButton()}
    </div>
  );

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
          <label htmlFor="enc-xp" className={labelClass}>Est. XP</label>
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
