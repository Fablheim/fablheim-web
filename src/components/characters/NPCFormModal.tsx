import { type FormEvent, useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCreateWorldEntity, useUpdateWorldEntity } from '@/hooks/useWorldEntities';
import { TYPE_DATA_FIELDS } from '@/components/world/world-constants';
import type { WorldEntity, WorldEntityVisibility } from '@/types/campaign';

interface NPCFormModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  entity?: WorldEntity | null;
}

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

export function NPCFormModal({ open, onClose, campaignId, entity }: NPCFormModalProps) {
  const isEdit = !!entity;

  const [name, setName] = useState('');
  const [npcType, setNpcType] = useState<'npc' | 'npc_minor'>('npc');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [visibility, setVisibility] = useState<WorldEntityVisibility>('public');
  const [typeData, setTypeData] = useState<Record<string, string>>({});

  const createEntity = useCreateWorldEntity();
  const updateEntity = useUpdateWorldEntity();

  function resetForm() {
    setName('');
    setNpcType('npc');
    setDescription('');
    setTagsInput('');
    setVisibility('public');
    setTypeData({});
  }

  /* eslint-disable react-hooks/set-state-in-effect -- syncing form state from prop */
  useEffect(() => {
    if (entity) {
      setName(entity.name);
      setNpcType(entity.type as 'npc' | 'npc_minor');
      setDescription(entity.description || '');
      setTagsInput(entity.tags.join(', '));
      setVisibility(entity.visibility);
      const td: Record<string, string> = {};
      if (entity.typeData) {
        for (const [k, v] of Object.entries(entity.typeData)) {
          td[k] = String(v ?? '');
        }
      }
      setTypeData(td);
    } else {
      resetForm();
    }
  }, [entity]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!open) return null;

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const cleanTypeData: Record<string, string> = {};
    for (const [k, v] of Object.entries(typeData)) {
      if (v.trim()) cleanTypeData[k] = v.trim();
    }

    const payload = {
      name,
      type: npcType as 'npc' | 'npc_minor',
      description: description || undefined,
      tags: tags.length > 0 ? tags : undefined,
      visibility,
      typeData: Object.keys(cleanTypeData).length > 0 ? cleanTypeData : undefined,
    };

    if (isEdit && entity) {
      await updateEntity.mutateAsync({ campaignId, id: entity._id, data: payload });
    } else {
      await createEntity.mutateAsync({ campaignId, data: payload });
    }
    handleClose();
  }

  const isPending = createEntity.isPending || updateEntity.isPending;
  const fields = TYPE_DATA_FIELDS[npcType] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border border-t-2 border-t-brass/50 bg-card p-6 shadow-warm-lg tavern-card iron-brackets texture-parchment">
        <div className="flex items-center justify-between">
          <h2 className="font-['IM_Fell_English'] text-xl text-card-foreground">
            {isEdit ? 'Edit NPC' : 'Create NPC'}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="npc-name" className={labelClass}>Name</label>
            <input
              id="npc-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Barkeep Morten, The Whisperer..."
              className={inputClass}
            />
          </div>

          {/* Type + Visibility row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="npc-type" className={labelClass}>Type</label>
              <select
                id="npc-type"
                value={npcType}
                onChange={(e) => setNpcType(e.target.value as 'npc' | 'npc_minor')}
                className={inputClass}
              >
                <option value="npc">NPC</option>
                <option value="npc_minor">Minor NPC</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Visibility</label>
              <button
                type="button"
                onClick={() => setVisibility(visibility === 'public' ? 'dm-only' : 'public')}
                className={`mt-1 flex w-full items-center gap-2 rounded-sm border px-3 py-2 text-sm transition-colors ${
                  visibility === 'dm-only'
                    ? 'border-arcane/40 bg-arcane/10 text-arcane'
                    : 'border-forest/40 bg-forest/10 text-[hsl(150,50%,55%)]'
                }`}
              >
                {visibility === 'dm-only' ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span className="font-[Cinzel] text-xs uppercase tracking-wider">GM Only</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span className="font-[Cinzel] text-xs uppercase tracking-wider">Public</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="npc-description" className={labelClass}>Description</label>
            <textarea
              id="npc-description"
              rows={4}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A grizzled innkeeper with a knowing smile and a collection of scars..."
              className={inputClass}
            />
          </div>

          {/* Type-specific fields (role, personality, secrets, stat block) */}
          {fields.length > 0 && (
            <>
              <div className="divider-ornate" />
              <p className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
                NPC Details
              </p>
              {fields.map((field) => (
                <div key={field.key}>
                  <label htmlFor={`npc-${field.key}`} className={labelClass}>
                    {field.label}
                  </label>
                  {field.inputType === 'textarea' ? (
                    <textarea
                      id={`npc-${field.key}`}
                      rows={field.key === 'statBlock' ? 6 : 3}
                      maxLength={2000}
                      value={typeData[field.key] ?? ''}
                      onChange={(e) => setTypeData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  ) : (
                    <input
                      id={`npc-${field.key}`}
                      type="text"
                      maxLength={200}
                      value={typeData[field.key] ?? ''}
                      onChange={(e) => setTypeData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  )}
                </div>
              ))}
            </>
          )}

          {/* Tags */}
          <div>
            <label htmlFor="npc-tags" className={labelClass}>Tags</label>
            <input
              id="npc-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="merchant, quest-giver, ally..."
              className={inputClass}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">Separate tags with commas</p>
            {tagsInput && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tagsInput.split(',').map((tag, i) => {
                  const trimmed = tag.trim();
                  if (!trimmed) return null;
                  return (
                    <span
                      key={i}
                      className="rounded bg-background/40 px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground"
                    >
                      {trimmed}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit ? 'Saving...' : 'Creating...'
                : isEdit ? 'Save Changes' : 'Create NPC'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
