import { type FormEvent, useState, useEffect, useMemo } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useCreateCharacter, useUpdateCharacter } from '@/hooks/useCharacters';
import { useSystemDefinition } from '@/hooks/useSystems';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { Character, CampaignSystem } from '@/types/campaign';
import type { SystemDefinition, CustomFieldDefinition } from '@/types/system';

interface CharacterFormModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  character?: Character | null;
  campaignSystem?: CampaignSystem;
}

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

function computeModifier(formula: string | null, value: number): string | null {
  if (!formula) return null;
  if (formula === 'floor((value - 10) / 2)') {
    const mod = Math.floor((value - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
  return null;
}

function buildDefaultStats(systemDef: SystemDefinition): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const stat of systemDef.stats) {
    defaults[stat.key] = stat.defaultValue;
  }
  return defaults;
}

function buildDefaultSystemData(systemDef: SystemDefinition): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of systemDef.customFields) {
    defaults[field.key] = field.defaultValue ?? (field.type === 'string-array' ? [] : '');
  }
  return defaults;
}

function buildDefaultPassiveScores(systemDef: SystemDefinition): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const ps of systemDef.passiveScores) {
    defaults[ps.key] = 10;
  }
  return defaults;
}

function renderIdentityFields(
  systemDef: SystemDefinition,
  race: string,
  setRace: (v: string) => void,
  charClass: string,
  setCharClass: (v: string) => void,
  level: number,
  setLevel: (v: number) => void,
) {
  const { identity } = systemDef;
  const hasAncestry = !!identity.ancestry;
  const hasClass = !!identity.class;
  const hasLevel = !!identity.level;

  if (!hasAncestry && !hasClass && !hasLevel) return null;

  return (
    <>
      {(hasAncestry || hasClass) && (
        <div className={`grid gap-4 ${hasAncestry && hasClass ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {identity.ancestry && (
            <div>
              <label htmlFor="char-race" className={labelClass}>
                {identity.ancestry.label}
              </label>
              <input
                id="char-race"
                type="text"
                maxLength={50}
                value={race}
                onChange={(e) => setRace(e.target.value)}
                placeholder={identity.ancestry.placeholder}
                className={inputClass}
              />
            </div>
          )}
          {identity.class && (
            <div>
              <label htmlFor="char-class" className={labelClass}>
                {identity.class.label}
              </label>
              <input
                id="char-class"
                type="text"
                maxLength={50}
                value={charClass}
                onChange={(e) => setCharClass(e.target.value)}
                placeholder={identity.class.placeholder}
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}
      {identity.level && (
        <div className="w-24">
          <label htmlFor="char-level" className={labelClass}>Level</label>
          <input
            id="char-level"
            type="number"
            min={identity.level.min}
            max={identity.level.max}
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value) || identity.level!.min)}
            className={inputClass}
          />
        </div>
      )}
    </>
  );
}

function renderStatInputs(
  systemDef: SystemDefinition,
  stats: Record<string, number>,
  updateStat: (key: string, value: number) => void,
) {
  if (systemDef.stats.length === 0) return null;

  const cols = systemDef.stats.length <= 6 ? 3 : systemDef.stats.length <= 9 ? 3 : 4;

  return (
    <div>
      <div className="divider-ornate mb-3" />
      <p className={`${labelClass} mb-2`}>
        {systemDef.statModifierFormula ? 'Ability Scores' : 'Stats'}
      </p>
      <div className={`grid gap-3 grid-cols-${cols}`}>
        {systemDef.stats.map((stat) => (
          <div key={stat.key} className="rounded-md bg-background/40 p-2 text-center">
            <label
              htmlFor={`stat-${stat.key}`}
              className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              {stat.label}
            </label>
            <input
              id={`stat-${stat.key}`}
              type="number"
              min={stat.min ?? 0}
              max={stat.max ?? 99}
              value={stats[stat.key] ?? stat.defaultValue}
              onChange={(e) =>
                updateStat(stat.key, parseInt(e.target.value) || stat.defaultValue)
              }
              className="mt-1 w-full rounded-sm border border-input bg-input px-2 py-1 text-center text-sm text-foreground input-carved"
            />
            {systemDef.statModifierFormula && (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {computeModifier(
                  systemDef.statModifierFormula,
                  stats[stat.key] ?? stat.defaultValue,
                )}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderPassiveScores(
  systemDef: SystemDefinition,
  passiveScores: Record<string, number>,
  setPassiveScore: (key: string, value: number) => void,
) {
  if (systemDef.passiveScores.length === 0) return null;

  return (
    <div>
      <div className="divider-ornate mb-3" />
      <p className={`${labelClass} mb-2`}>Passive Scores</p>
      <div className="grid grid-cols-3 gap-3">
        {systemDef.passiveScores.map((ps) => (
          <div key={ps.key}>
            <label
              htmlFor={`passive-${ps.key}`}
              className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              {ps.label}
            </label>
            <input
              id={`passive-${ps.key}`}
              type="number"
              min={1}
              max={30}
              value={passiveScores[ps.key] ?? 10}
              onChange={(e) =>
                setPassiveScore(ps.key, parseInt(e.target.value) || 10)
              }
              className={inputClass}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function renderCustomFieldInput(
  field: CustomFieldDefinition,
  value: unknown,
  onChange: (key: string, value: unknown) => void,
) {
  if (field.type === 'number') {
    return (
      <input
        id={`custom-${field.key}`}
        type="number"
        value={(value as number) ?? 0}
        onChange={(e) => onChange(field.key, parseInt(e.target.value) || 0)}
        className={inputClass}
      />
    );
  }
  if (field.type === 'textarea') {
    return (
      <textarea
        id={`custom-${field.key}`}
        rows={3}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={inputClass}
      />
    );
  }
  if (field.type === 'boolean') {
    return (
      <label className="mt-1 flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(field.key, e.target.checked)}
          className="rounded border-input"
        />
        {field.label}
      </label>
    );
  }
  if (field.type === 'string-array') {
    const items = Array.isArray(value) ? (value as string[]) : [];
    return (
      <textarea
        id={`custom-${field.key}`}
        rows={3}
        value={items.join('\n')}
        onChange={(e) =>
          onChange(
            field.key,
            e.target.value
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        placeholder="One per line"
        className={inputClass}
      />
    );
  }
  // text
  return (
    <input
      id={`custom-${field.key}`}
      type="text"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      className={inputClass}
    />
  );
}

function renderCustomFields(
  systemDef: SystemDefinition,
  systemData: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void,
) {
  if (systemDef.customFields.length === 0) return null;

  const grouped = new Map<string, CustomFieldDefinition[]>();
  for (const field of systemDef.customFields) {
    if (!grouped.has(field.group)) grouped.set(field.group, []);
    grouped.get(field.group)!.push(field);
  }

  return (
    <>
      {Array.from(grouped.entries()).map(([group, fields]) => (
        <div key={group}>
          <div className="divider-ornate mb-3" />
          <p className={`${labelClass} mb-2`}>{group}</p>
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.key}>
                {field.type !== 'boolean' && (
                  <label htmlFor={`custom-${field.key}`} className={labelClass}>
                    {field.label}
                  </label>
                )}
                {renderCustomFieldInput(field, systemData[field.key], onChange)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function CharacterFormModal({
  open,
  onClose,
  campaignId,
  character,
  campaignSystem = 'dnd5e',
}: CharacterFormModalProps) {
  const isEdit = !!character;
  const { data: systemDef, isLoading: systemLoading } = useSystemDefinition(campaignSystem);

  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [charClass, setCharClass] = useState('');
  const [level, setLevel] = useState(1);
  const [backstory, setBackstory] = useState('');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [passiveScores, setPassiveScoresState] = useState<Record<string, number>>({});
  const [systemData, setSystemData] = useState<Record<string, unknown>>({});
  const [portraitFile, setPortraitFile] = useState<File | null>(null);

  const createCharacter = useCreateCharacter();
  const updateCharacter = useUpdateCharacter();
  const { uploadPortrait, progress: uploadProgress } = useFileUpload();

  // Initialize defaults when system definition loads
  const defaultStats = useMemo(
    () => (systemDef ? buildDefaultStats(systemDef) : {}),
    [systemDef],
  );
  const defaultSystemData = useMemo(
    () => (systemDef ? buildDefaultSystemData(systemDef) : {}),
    [systemDef],
  );
  const defaultPassiveScores = useMemo(
    () => (systemDef ? buildDefaultPassiveScores(systemDef) : {}),
    [systemDef],
  );

  useEffect(() => {
    if (character) {
      setName(character.name);
      setRace(character.race || '');
      setCharClass(character.class || '');
      setLevel(character.level);
      setBackstory(character.backstory || '');
      setStats(character.stats || defaultStats);
      setPassiveScoresState(
        character.passiveScores
          ? {
              perception: character.passiveScores.perception,
              insight: character.passiveScores.insight,
              investigation: character.passiveScores.investigation,
            }
          : defaultPassiveScores,
      );
      setSystemData(character.systemData || defaultSystemData);
    } else {
      resetForm();
    }
  }, [character, defaultStats, defaultPassiveScores, defaultSystemData]);

  if (!open) return null;

  function resetForm() {
    setName('');
    setRace('');
    setCharClass('');
    setLevel(systemDef?.identity.level?.min ?? 1);
    setBackstory('');
    setStats(defaultStats);
    setPassiveScoresState(defaultPassiveScores);
    setSystemData(defaultSystemData);
    setPortraitFile(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function updateStat(key: string, value: number) {
    setStats((prev) => ({ ...prev, [key]: value }));
  }

  function updatePassiveScore(key: string, value: number) {
    setPassiveScoresState((prev) => ({ ...prev, [key]: value }));
  }

  function updateSystemField(key: string, value: unknown) {
    setSystemData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    let portrait = character?.portrait;
    if (portraitFile) {
      try {
        const result = await uploadPortrait.mutateAsync(portraitFile);
        portrait = {
          url: result.url,
          key: result.key,
          filename: result.filename,
          width: result.width ?? 0,
          height: result.height ?? 0,
        };
      } catch {
        toast.error('Portrait upload failed');
        return;
      }
    }

    // Build passive scores for backend (D&D-style object)
    const passivePayload =
      systemDef && systemDef.passiveScores.length > 0
        ? {
            perception: passiveScores.perception ?? 10,
            insight: passiveScores.insight ?? 10,
            investigation: passiveScores.investigation ?? 10,
          }
        : undefined;

    const payload = {
      name,
      race: race || undefined,
      class: charClass || undefined,
      ...(systemDef?.identity.level ? { level } : {}),
      backstory: backstory || undefined,
      stats: Object.keys(stats).length > 0 ? stats : undefined,
      ...(passivePayload ? { passiveScores: passivePayload } : {}),
      ...(Object.keys(systemData).length > 0 ? { systemData } : {}),
      ...(portrait ? { portrait } : {}),
    };

    if (isEdit && character) {
      await updateCharacter.mutateAsync({
        id: character._id,
        campaignId,
        data: payload,
      });
    } else {
      await createCharacter.mutateAsync({ campaignId, ...payload });
    }
    handleClose();
  }

  const isPending =
    createCharacter.isPending ||
    updateCharacter.isPending ||
    uploadPortrait.isPending;

  if (systemLoading || !systemDef) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative rounded-lg border border-border bg-card p-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border border-t-2 border-t-brass/50 bg-card p-6 shadow-warm-lg tavern-card iron-brackets texture-parchment">
        {renderHeader(isEdit, handleClose)}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {renderNameField(name, setName)}
          {renderPortraitUpload(portraitFile, setPortraitFile, character, uploadProgress)}
          {renderIdentityFields(
            systemDef,
            race,
            setRace,
            charClass,
            setCharClass,
            level,
            setLevel,
          )}
          {renderStatInputs(systemDef, stats, updateStat)}
          {renderPassiveScores(systemDef, passiveScores, updatePassiveScore)}
          {renderCustomFields(systemDef, systemData, updateSystemField)}
          {renderBackstory(backstory, setBackstory)}
          {renderActions(isEdit, isPending, handleClose)}
        </form>
      </div>
    </div>
  );
}

function renderHeader(isEdit: boolean, handleClose: () => void) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-['IM_Fell_English'] text-xl text-card-foreground">
        {isEdit ? 'Edit Character' : 'Create Character'}
      </h2>
      <button
        onClick={handleClose}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function renderNameField(
  name: string,
  setName: (v: string) => void,
) {
  return (
    <div>
      <label htmlFor="char-name" className={labelClass}>
        Name
      </label>
      <input
        id="char-name"
        type="text"
        required
        maxLength={100}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Character name"
        className={inputClass}
      />
    </div>
  );
}

function renderPortraitUpload(
  _portraitFile: File | null,
  setPortraitFile: (f: File | null) => void,
  character: Character | null | undefined,
  uploadProgress: { percentage: number } | null,
) {
  return (
    <>
      <ImageUpload
        onFileSelect={(file) => setPortraitFile(file)}
        maxSizeMB={2}
        currentImage={character?.portrait?.url}
        label="Portrait (Optional)"
        compact
      />
      {uploadProgress && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Uploading... {uploadProgress.percentage}%
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent/40">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${uploadProgress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}

function renderBackstory(
  backstory: string,
  setBackstory: (v: string) => void,
) {
  return (
    <div>
      <div className="divider-ornate mb-3" />
      <label htmlFor="char-backstory" className={labelClass}>
        Backstory
      </label>
      <textarea
        id="char-backstory"
        rows={4}
        maxLength={5000}
        value={backstory}
        onChange={(e) => setBackstory(e.target.value)}
        placeholder="Your character's history..."
        className={inputClass}
      />
    </div>
  );
}

function renderActions(
  isEdit: boolean,
  isPending: boolean,
  handleClose: () => void,
) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <Button type="button" variant="ghost" onClick={handleClose}>
        Cancel
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending
          ? isEdit
            ? 'Saving...'
            : 'Creating...'
          : isEdit
            ? 'Save Changes'
            : 'Create Character'}
      </Button>
    </div>
  );
}
