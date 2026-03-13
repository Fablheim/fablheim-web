import { useMemo, useState, type FormEvent } from 'react';
import { Link2, MapPin, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useCreateWorldEntity, useWorldEntities } from '@/hooks/useWorldEntities';
import type {
  CreateWorldEntityPayload,
  WorldEntity,
  WorldEntityType,
} from '@/types/campaign';
import { ENTITY_TYPE_CONFIG } from './world-config';
import type { WorldNavigation } from './WorldCenterStage';
import {
  CREATABLE_WORLD_TYPES,
  getDefaultCreateSubtitle,
  getDefaultCreateTitle,
  LOCATION_TYPE_OPTIONS,
  type WorldCreateDraft,
} from './world-create';
import { startCase } from './world-ui';

interface WorldCreatePanelProps {
  campaignId: string;
  nav: WorldNavigation;
  open: boolean;
  draft: WorldCreateDraft | null;
  onClose: () => void;
}

export function WorldCreatePanel({
  campaignId,
  nav,
  open,
  draft,
  onClose,
}: WorldCreatePanelProps) {
  const { data: allEntities } = useWorldEntities(campaignId);
  const createEntity = useCreateWorldEntity();

  const [entityType, setEntityType] = useState<WorldEntityType>(draft?.defaultType ?? 'location');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentEntityId, setParentEntityId] = useState(draft?.parentEntityId ?? '');
  const [linkedEntityId, setLinkedEntityId] = useState(draft?.linkedEntityId ?? '');
  const [relationshipType, setRelationshipType] = useState(draft?.linkedRelationshipType ?? '');
  const [locationType, setLocationType] = useState(draft?.defaultType === 'location' ? 'other' : '');

  const sourceEntity =
    draft?.sourceEntityId
      ? (allEntities ?? []).find((entity) => entity._id === draft.sourceEntityId) ?? null
      : null;

  const parentOptions = useMemo(
    () =>
      (allEntities ?? [])
        .filter((entity) => entity.type === 'location' || entity.type === 'location_detail')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allEntities],
  );

  const linkedOptions = useMemo(
    () =>
      (allEntities ?? [])
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allEntities],
  );

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const payload: CreateWorldEntityPayload = {
      name: name.trim(),
      type: entityType,
      description: description.trim() || undefined,
      visibility: 'public',
    };

    if (parentEntityId) {
      payload.parentEntityId = parentEntityId;
    }

    if (linkedEntityId && relationshipType.trim()) {
      payload.relatedEntities = [
        {
          entityId: linkedEntityId,
          relationshipType: relationshipType.trim(),
        },
      ];
    }

    if (entityType === 'location' && locationType) {
      payload.locationType = locationType as CreateWorldEntityPayload['locationType'];
    }

    if (entityType === 'quest') {
      payload.questStatus = 'not_started';
    }

    try {
      const created = await createEntity.mutateAsync({
        campaignId,
        data: payload,
      });
      toast.success(`${created.name} created`);
      onClose();
      nav.goToDetail(created._id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create entity');
    }
  }

  return (
    <div className="absolute inset-0 z-20 flex justify-end">
      <button
        type="button"
        aria-label="Close create panel"
        onClick={onClose}
        className="flex-1 bg-black/25 backdrop-blur-[1px]"
      />

      <aside className="relative flex h-full w-full max-w-[440px] shrink-0 flex-col border-l border-[hsla(32,26%,26%,0.75)] bg-[linear-gradient(180deg,hsla(25,18%,13%,0.98),hsla(24,16%,10%,1))] shadow-[-24px_0_60px_rgba(0,0,0,0.28)]">
        <div className="flex items-start justify-between gap-3 border-b border-[hsla(32,26%,26%,0.4)] px-4 py-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[hsl(30,12%,58%)]">
              World Create
            </p>
            <h2
              className="mt-1 text-[16px] text-[hsl(38,36%,82%)]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {getDefaultCreateTitle(draft ?? undefined)}
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,13%,62%)]">
              {getDefaultCreateSubtitle(draft ?? undefined)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
            aria-label="Close create panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 pb-8">
            <section className="space-y-2">
              <FieldLabel>Entity type</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {CREATABLE_WORLD_TYPES.map((type) => {
                  const config = ENTITY_TYPE_CONFIG[type];
                  const Icon = config.icon;
                  const active = entityType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeChange(type)}
                      className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                        active
                          ? 'border-[hsla(38,60%,52%,0.45)] bg-[hsla(38,70%,46%,0.1)]'
                          : 'border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,16%,12%,0.78)] hover:border-[hsla(32,26%,26%,0.68)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${config.color}15`, color: config.color }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] text-[hsl(35,24%,92%)]">{config.label}</p>
                          <p className="text-[10px] text-[hsl(30,12%,58%)]">
                            {active ? 'Selected' : 'Create quickly'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <FieldLabel htmlFor="world-create-name">Name</FieldLabel>
                <input
                  id="world-create-name"
                  type="text"
                  required
                  maxLength={200}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Give this entity a name"
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel htmlFor="world-create-description">Short description</FieldLabel>
                <textarea
                  id="world-create-description"
                  rows={4}
                  maxLength={5000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="A quick memory cue, hook, or description."
                  className={inputClass}
                />
              </div>

              {entityType === 'location' && (
                <div>
                  <FieldLabel htmlFor="world-create-location-type">Location type</FieldLabel>
                  <select
                    id="world-create-location-type"
                    value={locationType}
                    onChange={(event) => setLocationType(event.target.value)}
                    className={inputClass}
                  >
                    {LOCATION_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </section>

            <section className="space-y-3 rounded-xl border border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,16%,12%,0.78)] p-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]">
                <MapPin className="h-3.5 w-3.5" />
                Placement
              </div>
              <p className="text-[11px] leading-relaxed text-[hsl(30,13%,62%)]">
                Put this somewhere in the world now, or leave it loose and organize it later.
              </p>
              <select
                value={parentEntityId}
                onChange={(event) => setParentEntityId(event.target.value)}
                className={inputClass}
              >
                <option value="">Save as unassigned</option>
                {parentOptions.map((entity) => (
                  <option key={entity._id} value={entity._id}>
                    {entity.name} {entity.locationType ? `· ${startCase(entity.locationType)}` : ''}
                  </option>
                ))}
              </select>
            </section>

            <section className="space-y-3 rounded-xl border border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,16%,12%,0.78)] p-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]">
                <Link2 className="h-3.5 w-3.5" />
                Initial connection
              </div>
              <p className="text-[11px] leading-relaxed text-[hsl(30,13%,62%)]">
                Start with one meaningful connection if it helps. You can always add more from the detail page later.
              </p>
              <select
                value={linkedEntityId}
                onChange={(event) => handleLinkedEntityChange(event.target.value)}
                className={inputClass}
              >
                <option value="">No initial link</option>
                {linkedOptions.map((entity) => (
                  <option key={entity._id} value={entity._id}>
                    {entity.name} · {ENTITY_TYPE_CONFIG[entity.type].label}
                  </option>
                ))}
              </select>
              {linkedEntityId && (
                <div>
                  <FieldLabel htmlFor="world-create-relationship">Connection label</FieldLabel>
                  <input
                    id="world-create-relationship"
                    type="text"
                    maxLength={100}
                    value={relationshipType}
                    onChange={(event) => setRelationshipType(event.target.value)}
                    placeholder="linked_to"
                    className={inputClass}
                  />
                </div>
              )}
            </section>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[hsla(32,26%,26%,0.4)] px-4 py-3">
            <p className="text-[11px] text-[hsl(30,12%,58%)]">
              {parentEntityId ? 'Placement is prefilled.' : 'No placement selected yet.'}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || createEntity.isPending}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {createEntity.isPending ? 'Saving' : `Create ${ENTITY_TYPE_CONFIG[entityType].label}`}
              </Button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );

  function handleTypeChange(type: WorldEntityType) {
    setEntityType(type);
    if (type === 'location') {
      setLocationType((current) => current || 'other');
      return;
    }
    setLocationType('');
  }

  function handleLinkedEntityChange(nextLinkedEntityId: string) {
    setLinkedEntityId(nextLinkedEntityId);
    if (!nextLinkedEntityId) {
      setRelationshipType('');
      return;
    }

    const linkedEntity = linkedOptions.find((entity) => entity._id === nextLinkedEntityId) ?? null;
    setRelationshipType((current) => current || inferRelationshipType(entityType, linkedEntity ?? sourceEntity));
  }
}

function inferRelationshipType(entityType: WorldEntityType, linkedEntity: WorldEntity | null) {
  if (!linkedEntity) return 'linked_to';
  if (entityType === 'npc' && linkedEntity.type === 'faction') return 'member_of';
  if (entityType === 'quest' && linkedEntity.type === 'faction') return 'backed_by';
  if (entityType === 'quest' && (linkedEntity.type === 'location' || linkedEntity.type === 'location_detail')) return 'set_in';
  if (entityType === 'location' && linkedEntity.type === 'quest') return 'site_of';
  if (entityType === 'item' && (linkedEntity.type === 'npc' || linkedEntity.type === 'npc_minor')) return 'owned_by';
  if (entityType === 'npc' && linkedEntity.type === 'quest') return 'involved_in';
  return 'linked_to';
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: string;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]"
    >
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-[hsla(32,26%,26%,0.48)] bg-[hsl(24,16%,10%)] px-3 py-2 text-[12px] text-[hsl(35,24%,92%)] outline-none transition-colors placeholder:text-[hsl(30,10%,42%)] focus:border-[hsla(38,60%,52%,0.45)]';
