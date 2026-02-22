import { type FormEvent, useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCreateWorldEntity, useUpdateWorldEntity } from '@/hooks/useWorldEntities';
import { TYPE_LABELS, TYPE_DATA_FIELDS } from './world-constants';
import type { WorldEntity, WorldEntityType, WorldEntityVisibility } from '@/types/campaign';

interface CreateEntityModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  entity?: WorldEntity | null;
  defaultType?: WorldEntityType;
}

const ALL_TYPES: WorldEntityType[] = [
  'location', 'location_detail', 'faction', 'npc', 'npc_minor', 'item', 'quest', 'event', 'lore',
];

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

export function CreateEntityModal({ open, onClose, campaignId, entity, defaultType }: CreateEntityModalProps) {
  const isEdit = !!entity;

  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState<WorldEntityType>(defaultType ?? 'location');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [visibility, setVisibility] = useState<WorldEntityVisibility>('public');
  const [typeData, setTypeData] = useState<Record<string, string>>({});

  const createEntity = useCreateWorldEntity();
  const updateEntity = useUpdateWorldEntity();

  useEffect(() => {
    if (entity) {
      setName(entity.name);
      setEntityType(entity.type);
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

  if (!open) return null;

  function resetForm() {
    setName('');
    setEntityType(defaultType ?? 'location');
    setDescription('');
    setTagsInput('');
    setVisibility('public');
    setTypeData({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleTypeDataChange(key: string, value: string) {
    setTypeData((prev) => ({ ...prev, [key]: value }));
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
      type: entityType,
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
  const fields = TYPE_DATA_FIELDS[entityType] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border border-t-2 border-t-brass/50 bg-card p-6 shadow-warm-lg tavern-card iron-brackets texture-parchment">
        <div className="flex items-center justify-between">
          <h2 className="font-['IM_Fell_English'] text-xl text-card-foreground">
            {isEdit ? `Edit ${TYPE_LABELS[entityType]}` : 'Create Entity'}
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
            <label htmlFor="entity-name" className={labelClass}>Name</label>
            <input
              id="entity-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name this entity..."
              className={inputClass}
            />
          </div>

          {/* Type + Visibility row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="entity-type" className={labelClass}>Type</label>
              <select
                id="entity-type"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as WorldEntityType)}
                className={inputClass}
              >
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
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
            <label htmlFor="entity-description" className={labelClass}>Description</label>
            <textarea
              id="entity-description"
              rows={4}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this entity..."
              className={inputClass}
            />
          </div>

          {/* Type-specific fields */}
          {fields.length > 0 && (
            <>
              <div className="divider-ornate" />
              <p className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
                {TYPE_LABELS[entityType]} Details
              </p>
              {fields.map((field) => (
                <div key={field.key}>
                  <label htmlFor={`entity-${field.key}`} className={labelClass}>
                    {field.label}
                  </label>
                  {field.inputType === 'textarea' ? (
                    <textarea
                      id={`entity-${field.key}`}
                      rows={3}
                      maxLength={2000}
                      value={typeData[field.key] ?? ''}
                      onChange={(e) => handleTypeDataChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  ) : (
                    <input
                      id={`entity-${field.key}`}
                      type="text"
                      maxLength={200}
                      value={typeData[field.key] ?? ''}
                      onChange={(e) => handleTypeDataChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  )}
                </div>
              ))}
            </>
          )}

          {/* Tags */}
          <div className="divider-ornate" />
          <div>
            <label htmlFor="entity-tags" className={labelClass}>Tags</label>
            <input
              id="entity-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="tavern, quest-giver, dangerous..."
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
                : isEdit ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
