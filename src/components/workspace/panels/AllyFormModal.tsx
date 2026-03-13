import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCharacters } from '@/hooks/useCharacters';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type {
  Ally,
  AllyDurationType,
  AllyKind,
  AllySourceType,
  AllyStatBlock,
  AllyVisibility,
  CreateAllyPayload,
  UpdateAllyPayload,
} from '@/types/campaign';

interface AllyFormModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  ally?: Ally | null;
  onSubmit: (payload: CreateAllyPayload | UpdateAllyPayload) => void;
  isPending?: boolean;
}

const labelClass =
  'block font-[Cinzel] text-[10px] uppercase tracking-wider text-foreground';
const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved';

const KIND_OPTIONS: AllyKind[] = ['npc', 'familiar', 'summon', 'pet', 'mount', 'retainer', 'custom'];
const SOURCE_OPTIONS: AllySourceType[] = ['world_entity', 'custom', 'template'];
const DURATION_OPTIONS: AllyDurationType[] = ['permanent', 'session', 'timed', 'concentration'];

const DEFAULT_VISIBILITY: AllyVisibility = {
  summary: true,
  statBlock: false,
  currentHp: true,
  maxHp: true,
  ac: true,
  owner: true,
  duration: true,
  notes: false,
};

function toDatetimeLocal(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function AllyFormModal({
  open,
  onClose,
  campaignId,
  ally,
  onSubmit,
  isPending,
}: AllyFormModalProps) {
  const { data: characters } = useCharacters(campaignId);
  const { data: entities } = useWorldEntities(campaignId);
  const worldNpcs = useMemo(
    () => (entities ?? []).filter((entity) => entity.type === 'npc' || entity.type === 'npc_minor'),
    [entities],
  );

  const isEdit = !!ally;
  const [sourceType, setSourceType] = useState<AllySourceType>('custom');
  const [sourceId, setSourceId] = useState('');
  const [kind, setKind] = useState<AllyKind>('custom');
  const [name, setName] = useState('');
  const [ownerCharacterId, setOwnerCharacterId] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState('');
  const [personality, setPersonality] = useState('');
  const [durationType, setDurationType] = useState<AllyDurationType>('permanent');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [visibility, setVisibility] = useState<AllyVisibility>(DEFAULT_VISIBILITY);
  const [statBlock, setStatBlock] = useState<AllyStatBlock>({});

  useEffect(() => {
    if (!open) return;
    if (ally) {
      setSourceType(ally.sourceType);
      setSourceId(ally.sourceId ?? '');
      setKind(ally.kind);
      setName(ally.name);
      setOwnerCharacterId(ally.ownerCharacterId ?? '');
      setDescription(ally.description ?? '');
      setRole(ally.role ?? '');
      setPersonality(ally.personality ?? '');
      setDurationType(ally.durationType);
      setExpiresAt(toDatetimeLocal(ally.expiresAt));
      setNotes(ally.notes ?? '');
      setVisibility({ ...DEFAULT_VISIBILITY, ...ally.visibility });
      setStatBlock(ally.statBlock ?? {});
      return;
    }

    setSourceType('custom');
    setSourceId('');
    setKind('custom');
    setName('');
    setOwnerCharacterId('');
    setDescription('');
    setRole('');
    setPersonality('');
    setDurationType('permanent');
    setExpiresAt('');
    setNotes('');
    setVisibility(DEFAULT_VISIBILITY);
    setStatBlock({});
  }, [open, ally]);

  if (!open) return null;

  function updateStatBlock<K extends keyof AllyStatBlock>(key: K, value: AllyStatBlock[K]) {
    setStatBlock((prev) => ({ ...prev, [key]: value }));
  }

  function updateAbility(key: keyof NonNullable<AllyStatBlock['abilities']>, value: string) {
    setStatBlock((prev) => ({
      ...prev,
      abilities: {
        ...(prev.abilities ?? {}),
        [key]: value === '' ? undefined : Number(value),
      },
    }));
  }

  function updateHp(key: keyof NonNullable<AllyStatBlock['hp']>, value: string) {
    setStatBlock((prev) => ({
      ...prev,
      hp: {
        ...(prev.hp ?? {}),
        [key]: value === '' ? undefined : Number(value),
      },
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const payloadBase = {
      sourceType,
      kind,
      name: name.trim() || undefined,
      ownerCharacterId: ownerCharacterId || undefined,
      description: description.trim() || undefined,
      role: role.trim() || undefined,
      personality: personality.trim() || undefined,
      durationType,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      visibility,
      notes: notes.trim() || undefined,
      statBlock: cleanStatBlock(statBlock),
    };

    const payload =
      sourceType === 'world_entity'
        ? { ...payloadBase, sourceId: sourceId || undefined }
        : payloadBase;

    onSubmit(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-border border-t-2 border-t-brass/50 bg-card p-6 shadow-warm-lg tavern-card iron-brackets texture-parchment"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-['IM_Fell_English'] text-2xl text-card-foreground">
          {isEdit ? 'Edit Ally' : 'Create Ally'}
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Source</label>
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value as AllySourceType)} className={inputClass}>
              {SOURCE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Kind</label>
            <select value={kind} onChange={(e) => setKind(e.target.value as AllyKind)} className={inputClass}>
              {KIND_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          {sourceType === 'world_entity' ? (
            <div className="md:col-span-2">
              <label className={labelClass}>World NPC</label>
              <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className={inputClass} required>
                <option value="">Select an NPC</option>
                {worldNpcs.map((entity) => (
                  <option key={entity._id} value={entity._id}>{entity.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className={labelClass}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
            </div>
          )}
          <div>
            <label className={labelClass}>Owner Character</label>
            <select value={ownerCharacterId} onChange={(e) => setOwnerCharacterId(e.target.value)} className={inputClass}>
              <option value="">Unassigned</option>
              {(characters ?? []).map((character) => (
                <option key={character._id} value={character._id}>{character.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Duration</label>
            <select value={durationType} onChange={(e) => setDurationType(e.target.value as AllyDurationType)} className={inputClass}>
              {DURATION_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          {durationType === 'timed' && (
            <div className="md:col-span-2">
              <label className={labelClass}>Expires At</label>
              <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputClass} />
            </div>
          )}
          <div className="md:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Personality</label>
            <input value={personality} onChange={(e) => setPersonality(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="divider-ornate my-5" />
        <p className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">Structured Stat Block</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelClass}>AC</label>
            <input type="number" min={0} value={statBlock.ac ?? ''} onChange={(e) => updateStatBlock('ac', e.target.value === '' ? undefined : Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>HP Current</label>
            <input type="number" min={0} value={statBlock.hp?.current ?? ''} onChange={(e) => updateHp('current', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>HP Max</label>
            <input type="number" min={1} value={statBlock.hp?.max ?? ''} onChange={(e) => updateHp('max', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Speed</label>
            <input value={statBlock.speed ?? ''} onChange={(e) => updateStatBlock('speed', e.target.value || undefined)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Init Bonus</label>
            <input type="number" value={statBlock.initiativeBonus ?? ''} onChange={(e) => updateStatBlock('initiativeBonus', e.target.value === '' ? undefined : Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>CR</label>
            <input type="number" min={0} step={0.125} value={statBlock.cr ?? ''} onChange={(e) => updateStatBlock('cr', e.target.value === '' ? undefined : Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Size</label>
            <input value={statBlock.size ?? ''} onChange={(e) => updateStatBlock('size', e.target.value || undefined)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Creature Type</label>
            <input value={statBlock.creatureType ?? ''} onChange={(e) => updateStatBlock('creatureType', e.target.value || undefined)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Alignment</label>
            <input value={statBlock.alignment ?? ''} onChange={(e) => updateStatBlock('alignment', e.target.value || undefined)} className={inputClass} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-6">
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((ability) => (
            <div key={ability}>
              <label className={labelClass}>{ability.toUpperCase()}</label>
              <input
                type="number"
                value={statBlock.abilities?.[ability] ?? ''}
                onChange={(e) => updateAbility(ability, e.target.value)}
                className={inputClass}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Traits</label>
            <textarea rows={4} value={statBlock.traits ?? ''} onChange={(e) => updateStatBlock('traits', e.target.value || undefined)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Actions</label>
            <textarea rows={4} value={statBlock.actions ?? ''} onChange={(e) => updateStatBlock('actions', e.target.value || undefined)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Reactions</label>
            <textarea rows={3} value={statBlock.reactions ?? ''} onChange={(e) => updateStatBlock('reactions', e.target.value || undefined)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Raw Stat Block</label>
            <textarea rows={6} value={statBlock.rawText ?? ''} onChange={(e) => updateStatBlock('rawText', e.target.value || undefined)} className={inputClass} />
          </div>
        </div>

        <div className="divider-ornate my-5" />
        <p className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">Player Visibility</p>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          {Object.entries(visibility).map(([key, value]) => (
            <label key={key} className="flex items-center gap-2 rounded-md border border-iron/20 px-2 py-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={value}
                onChange={() => setVisibility((prev) => ({ ...prev, [key]: !prev[key as keyof AllyVisibility] }))}
                className="accent-primary h-3.5 w-3.5"
              />
              {key}
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label className={labelClass}>Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending}>{isEdit ? 'Save Ally' : 'Create Ally'}</Button>
        </div>
      </form>
    </div>
  );
}

function cleanStatBlock(statBlock: AllyStatBlock): AllyStatBlock | undefined {
  const cleaned: AllyStatBlock = {
    ...statBlock,
    hp: statBlock.hp && Object.values(statBlock.hp).some((value) => value !== undefined) ? statBlock.hp : undefined,
    abilities:
      statBlock.abilities && Object.values(statBlock.abilities).some((value) => value !== undefined)
        ? statBlock.abilities
        : undefined,
  };

  return Object.values(cleaned).some((value) => value !== undefined && value !== '')
    ? cleaned
    : undefined;
}
