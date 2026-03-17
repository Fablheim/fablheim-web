import { useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Check,
  Eye,
  FileText,
  FolderTree,
  Link2,
  MapPin,
  Moon,
  Pencil,
  Plus,
  ScrollText,
  Signpost,
  Swords,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useWorldEntity,
  useWorldEntityChildren,
  useWorldEntityReferences,
  useWorldTree,
  useUpdateWorldEntity,
  useDeleteWorldEntity,
  useToggleDiscovery,
  useRevealSecret,
  useToggleObjective,
  useAddObjective,
  useAdjustReputation,
} from '@/hooks/useWorldEntities';
import { useCrossFeatureReferences } from '@/hooks/useCrossFeatureReferences';
import type { CrossFeatureGroup } from '@/hooks/useCrossFeatureReferences';
import { useEntityTimeline } from '@/hooks/useEntityTimeline';
import { useNavigationBus } from '../NavigationBusContext';
import { EntityTimelineSection } from './EntityTimelineSection';
import { ENTITY_TYPE_CONFIG } from './world-config';
import { EntityListItem } from './EntityListItem';
import { WorldBreadcrumbs } from './WorldBreadcrumbs';
import { WorldPathNav } from './WorldPathNav';
import type { Crumb } from './WorldBreadcrumbs';
import type { WorldNavigation } from './WorldCenterStage';
import type {
  WorldEntity,
  WorldEntityType,
  WorldTreeNode,
} from '@/types/campaign';
import {
  formatWorldEntityContext,
  normalizeEntityType,
  resolveWorldParentId,
} from './world-ui';
import { buildContextualCreateActions, LOCATION_TYPE_OPTIONS } from './world-create';

interface WorldEntityDetailProps {
  campaignId: string;
  isDM: boolean;
  entityId: string;
  nav: WorldNavigation;
  onTabChange?: (tab: string) => void;
}

const QUEST_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'abandoned', label: 'Abandoned' },
] as const;

const inputClass =
  'w-full rounded-lg border border-[hsla(32,26%,26%,0.48)] bg-[hsl(24,16%,10%)] px-3 py-2 text-[12px] text-[hsl(35,24%,92%)] outline-none transition-colors placeholder:text-[hsl(30,10%,42%)] focus:border-[hsla(38,60%,52%,0.45)]';

export function WorldEntityDetail({
  campaignId,
  entityId,
  nav,
  onTabChange,
}: WorldEntityDetailProps) {
  const { requestNavigation } = useNavigationBus();
  const { data: entity, isLoading } = useWorldEntity(campaignId, entityId);
  const { data: children } = useWorldEntityChildren(campaignId, entityId);
  const { data: references } = useWorldEntityReferences(campaignId, entityId);
  const { data: tree } = useWorldTree(campaignId);
  const crossFeatureRefs = useCrossFeatureReferences(campaignId, entityId);
  const timeline = useEntityTimeline(campaignId, entityId);

  const updateEntity = useUpdateWorldEntity();
  const deleteEntity = useDeleteWorldEntity();
  const toggleDiscovery = useToggleDiscovery();
  const revealSecret = useRevealSecret();
  const toggleObjective = useToggleObjective();
  const addObjective = useAddObjective();
  const adjustReputation = useAdjustReputation();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocationType, setEditLocationType] = useState('');
  const [editQuestStatus, setEditQuestStatus] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newObjectiveText, setNewObjectiveText] = useState('');
  const [repDelta, setRepDelta] = useState(0);
  const [repDescription, setRepDescription] = useState('');

  const nodeMap = useMemo(
    () => new Map((tree ?? []).map((node) => [node._id, node])),
    [tree],
  );

  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(entityId, tree ?? []),
    [entityId, tree],
  );

  const groupedChildren = useMemo(
    () => groupEntitiesForSections(children ?? []),
    [children],
  );

  const outgoingConnections = useMemo(
    () => (entity ? buildOutgoingConnections(entity, nodeMap) : []),
    [entity, nodeMap],
  );

  const incomingReferences = useMemo(
    () => groupReferencedEntities(references ?? []),
    [references],
  );

  const identityBadges = useMemo(
    () => (entity ? buildIdentityBadges(entity, references ?? [], children ?? []) : []),
    [children, entity, references],
  );

  const contextualCreateActions = useMemo(
    () => (entity ? buildContextualCreateActions(entity) : []),
    [entity],
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-[hsl(30,14%,40%)]">Loading…</p>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-[hsl(30,14%,40%)]">Entity not found</p>
      </div>
    );
  }

  const currentEntity = entity;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {renderTopBar()}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[840px] space-y-5 px-4 py-4 pb-10">
          {isEditing ? renderEditForm() : renderIdentity()}
          {renderPlacement()}
          {renderContainedEntities()}
          {renderOutgoingRelationships()}
          {renderIncomingReferences()}
          {renderTypeSpecific()}
          {renderNotesAndLore()}
          {renderCrossFeatureReferences()}
          {renderTimeline()}
        </div>
      </div>
      {showDeleteConfirm && renderDeleteConfirm()}
    </div>
  );

  function enterEditMode() {
    setEditName(currentEntity.name);
    setEditDescription(currentEntity.description ?? '');
    setEditLocationType(currentEntity.locationType ?? '');
    setEditQuestStatus(currentEntity.questStatus ?? '');
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  async function handleSave() {
    const payload: Record<string, unknown> = {};

    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== currentEntity.name) {
      payload.name = trimmedName;
    }
    const trimmedDesc = editDescription.trim();
    if (trimmedDesc !== (currentEntity.description ?? '')) {
      payload.description = trimmedDesc || undefined;
    }
    if (currentEntity.type === 'location' && editLocationType !== (currentEntity.locationType ?? '')) {
      payload.locationType = editLocationType || undefined;
    }
    if (currentEntity.type === 'quest' && editQuestStatus !== (currentEntity.questStatus ?? '')) {
      payload.questStatus = editQuestStatus || undefined;
    }

    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }

    try {
      await updateEntity.mutateAsync({
        campaignId,
        id: entityId,
        data: payload,
      });
      toast.success(`${trimmedName || currentEntity.name} updated`);
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update entity');
    }
  }

  async function handleDelete() {
    try {
      await deleteEntity.mutateAsync({ campaignId, id: entityId });
      toast.success(`${currentEntity.name} deleted`);
      setShowDeleteConfirm(false);
      nav.goHome();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete entity';
      const isChildrenError =
        message.toLowerCase().includes('children') ||
        message.toLowerCase().includes('child');
      toast.error(
        isChildrenError
          ? `Cannot delete ${currentEntity.name} — it still has child entities. Remove or move them first.`
          : message,
      );
    }
  }

  function renderTopBar() {
    return (
      <div className="flex shrink-0 items-center gap-2 border-b border-[hsla(32,26%,26%,0.4)] px-4 py-2">
        <button
          type="button"
          onClick={nav.goBack}
          className="flex h-6 w-6 items-center justify-center rounded text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
          aria-label="Back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <WorldBreadcrumbs crumbs={breadcrumbs} nav={nav} />
        <div className="ml-auto flex items-center gap-1">
          {!isEditing && (
            <button
              type="button"
              onClick={enterEditMode}
              className="flex h-6 w-6 items-center justify-center rounded text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
              aria-label="Edit entity"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex h-6 w-6 items-center justify-center rounded text-[hsl(30,12%,58%)] hover:bg-[hsla(0,60%,40%,0.15)] hover:text-[hsl(0,70%,65%)]"
            aria-label="Delete entity"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  function renderEditForm() {
    const config = ENTITY_TYPE_CONFIG[currentEntity.type];
    const Icon = config.icon;

    return (
      <section className="rounded-xl border border-[hsla(38,60%,52%,0.35)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.96),hsla(24,14%,11%,0.98))] p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `${config.color}15`,
              color: config.color,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            {renderEditFields()}
            {renderEditActions()}
          </div>
        </div>
      </section>
    );
  }

  function renderEditFields() {
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
            Name
          </label>
          <input
            type="text"
            required
            maxLength={200}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Entity name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
            Description
          </label>
          <textarea
            rows={4}
            maxLength={5000}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="A quick memory cue, hook, or description."
            className={inputClass}
          />
        </div>
        {currentEntity.type === 'location' && (
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
              Location type
            </label>
            <select
              value={editLocationType}
              onChange={(e) => setEditLocationType(e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {LOCATION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {currentEntity.type === 'quest' && (
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
              Quest status
            </label>
            <select
              value={editQuestStatus}
              onChange={(e) => setEditQuestStatus(e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {QUEST_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  function renderEditActions() {
    return (
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={!editName.trim() || updateEntity.isPending}
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-md border border-[hsla(38,60%,52%,0.45)] bg-[hsla(38,70%,46%,0.12)] px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] text-[hsl(38,82%,63%)] transition-colors hover:bg-[hsla(38,70%,46%,0.2)] disabled:opacity-40"
        >
          <Check className="h-3 w-3" />
          {updateEntity.isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)] transition-colors hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    );
  }

  function renderDeleteConfirm() {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
        <div className="mx-4 w-full max-w-[360px] rounded-xl border border-[hsla(32,26%,26%,0.6)] bg-[hsl(24,16%,12%)] p-5 shadow-lg">
          <h3 className="text-[14px] text-[hsl(35,24%,92%)]">
            Delete {currentEntity.name}?
          </h3>
          <p className="mt-2 text-[12px] leading-relaxed text-[hsl(30,12%,58%)]">
            This cannot be undone. All data for this entity will be permanently removed.
          </p>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-md px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)] transition-colors hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteEntity.isPending}
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-md border border-[hsla(0,60%,40%,0.4)] bg-[hsla(0,60%,40%,0.12)] px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] text-[hsl(0,70%,65%)] transition-colors hover:bg-[hsla(0,60%,40%,0.22)] disabled:opacity-40"
            >
              <Trash2 className="h-3 w-3" />
              {deleteEntity.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderIdentity() {
    const config = ENTITY_TYPE_CONFIG[currentEntity.type];
    const Icon = config.icon;

    return (
      <section className="rounded-xl border border-[hsla(32,26%,26%,0.42)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.96),hsla(24,14%,11%,0.98))] p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `${config.color}15`,
              color: config.color,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] text-[hsl(35,24%,92%)]">
              {currentEntity.name}
            </h2>
            <p className="mt-1 text-[12px] text-[hsl(30,12%,58%)]">
              {buildIdentityLine(currentEntity)}
            </p>
            {identityBadges.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {identityBadges.map((badge) => (
                  <Badge
                    key={`${badge.label}-${badge.value ?? badge.tone}`}
                    label={badge.label}
                    value={badge.value}
                    tone={badge.tone}
                  />
                ))}
              </div>
            )}
            {renderDiscoveryToggle()}
            {contextualCreateActions.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)]">
                  <Plus className="h-3 w-3" />
                  Create in context
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {contextualCreateActions.map((action) => (
                    <ContextCreateButton
                      key={action.key}
                      label={action.label}
                      onClick={() => nav.openCreate(action.draft)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  function renderDiscoveryToggle() {
    const discovered = currentEntity.discoveredByParty ?? false;
    return (
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={toggleDiscovery.isPending}
          onClick={() =>
            toggleDiscovery.mutate({
              campaignId,
              entityId,
              discovered: !discovered,
            })
          }
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] transition-colors ${
            discovered
              ? 'border border-[hsla(150,50%,45%,0.35)] bg-[hsla(150,50%,40%,0.12)] text-[hsl(150,50%,60%)]'
              : 'border border-[hsla(32,24%,30%,0.42)] bg-[hsla(24,18%,16%,0.66)] text-[hsl(30,14%,68%)]'
          } ${toggleDiscovery.isPending ? 'opacity-50' : 'hover:opacity-80'}`}
        >
          <Eye className="h-3 w-3" />
          {discovered ? 'Known to Party' : 'Undiscovered'}
        </button>
        {discovered && currentEntity.discoveredAt && (
          <span className="text-[10px] text-[hsl(30,12%,58%)]">
            {new Date(currentEntity.discoveredAt).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  }

  function renderPlacement() {
    const parentId = resolveWorldParentId(currentEntity.parentEntityId);

    return (
      <DetailSection
        icon={MapPin}
        title="World placement"
        subtitle="See where this entity sits in the campaign world and keep moving through the hierarchy."
      >
        <div className="rounded-xl border border-[hsla(32,24%,30%,0.3)] bg-[hsla(24,16%,12%,0.9)] p-3">
          <WorldPathNav
            crumbs={breadcrumbs}
            currentLabel={currentEntity.name}
            nav={nav}
          />
          <p className="mt-2 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
            Move upward to containing places or continue laterally through connected entities.
          </p>
          {parentId && (
            <button
              type="button"
              onClick={() => nav.goToHierarchy(parentId)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-[hsl(38,82%,63%)] hover:bg-[hsl(24,20%,15%)]"
            >
              <FolderTree className="h-3 w-3" />
              Browse containing area
            </button>
          )}
        </div>
      </DetailSection>
    );
  }

  function renderContainedEntities() {
    if (groupedChildren.length === 0) return null;

    return (
      <DetailSection
        icon={FolderTree}
        title="Contained entities"
        subtitle="Things nested here appear first so you can move deeper into the world before reading notes."
      >
        <div className="space-y-4">
          {groupedChildren.map((group) => (
            <section key={group.key} className="space-y-1.5">
              <GroupHeading title={group.title} count={group.items.length} />
              <div className="space-y-0.5">
                {group.items.map((child) => (
                  <EntityListItem key={child._id} entity={child} nav={nav} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </DetailSection>
    );
  }

  function renderOutgoingRelationships() {
    if (outgoingConnections.length === 0) return null;

    return (
      <DetailSection
        icon={Link2}
        title="Connected entities"
        subtitle="These are the people, places, quests, and factions this entity points toward."
      >
        <div className="space-y-4">
          {outgoingConnections.map((group) => (
            <section key={group.key} className="space-y-1.5">
              <GroupHeading title={group.title} count={group.items.length} />
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <RelationshipRow
                    key={`${group.key}-${item.entity._id}-${item.relationshipLabel}`}
                    entity={item.entity}
                    relationshipLabel={item.relationshipLabel}
                    nav={nav}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </DetailSection>
    );
  }

  function renderIncomingReferences() {
    if (incomingReferences.length === 0) return null;

    return (
      <DetailSection
        icon={ArrowUpRight}
        title="Incoming references"
        subtitle="These campaign elements point back to this entity, reinforcing why it matters in the world graph."
      >
        <div className="space-y-4">
          {incomingReferences.map((group) => (
            <section key={group.key} className="space-y-1.5">
              <GroupHeading title={group.title} count={group.items.length} />
              <div className="space-y-0.5">
                {group.items.map((ref) => (
                  <EntityListItem key={ref._id} entity={ref} nav={nav} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </DetailSection>
    );
  }

  function renderTypeSpecific() {
    const sections: ReactNode[] = [];

    if (currentEntity.type === 'quest') {
      const questSection = renderQuestDetails();
      if (questSection) sections.push(questSection);
    }
    if (currentEntity.type === 'faction') {
      const factionSection = renderFactionDetails();
      if (factionSection) sections.push(factionSection);
    }
    if (currentEntity.type === 'npc' || currentEntity.type === 'npc_minor') {
      const npcSection = renderNpcDetails();
      if (npcSection) sections.push(npcSection);
    }

    return sections.length > 0 ? <>{sections}</> : null;
  }

  function renderQuestDetails() {
    const questConnections = buildQuestSpecificRows(currentEntity, nodeMap);
    const hasBody =
      currentEntity.questStatus ||
      currentEntity.questType ||
      currentEntity.rewards ||
      currentEntity.objectives?.length ||
      questConnections.length;

    if (!hasBody) return null;

    return (
      <DetailSection
        icon={Swords}
        title="Quest context"
        subtitle="Quest-specific campaign context stays below the graph sections, but still remains easy to navigate."
      >
        <div className="space-y-3">
          <div className="space-y-1.5 text-[12px] text-[hsl(30,18%,72%)]">
            {currentEntity.questStatus && (
              <DetailField label="Status" value={currentEntity.questStatus} />
            )}
            {currentEntity.questType && (
              <DetailField label="Type" value={currentEntity.questType} />
            )}
            {currentEntity.rewards && (
              <DetailField label="Rewards" value={currentEntity.rewards} />
            )}
          </div>

          {currentEntity.objectives?.length ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)]">
                Objectives
              </p>
              <ul className="mt-1.5 space-y-1">
                {currentEntity.objectives.map((objective) => (
                  <li key={objective.id} className="flex items-center gap-2 text-[12px] text-[hsl(35,24%,92%)]">
                    <button
                      type="button"
                      disabled={toggleObjective.isPending}
                      onClick={() => toggleObjective.mutate({ campaignId, entityId, objectiveId: objective.id })}
                      className={`h-3.5 w-3.5 shrink-0 rounded border transition ${
                        objective.completed
                          ? 'border-[hsl(150,50%,55%)] bg-[hsl(150,50%,55%)]'
                          : 'border-[hsl(30,12%,58%)] hover:border-[hsl(38,60%,52%)]'
                      }`}
                    >
                      {objective.completed && <Check className="h-3 w-3 text-[hsl(24,14%,9%)]" />}
                    </button>
                    <span className={objective.completed ? 'opacity-60 line-through' : ''}>
                      {objective.description}
                    </span>
                    {objective.completedAt && (
                      <span className="text-[10px] text-[hsl(30,12%,50%)]">
                        {new Date(objective.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newObjectiveText}
                  onChange={(e) => setNewObjectiveText(e.target.value)}
                  placeholder="Add objective..."
                  className="flex-1 rounded border border-[hsla(32,26%,26%,0.48)] bg-[hsl(24,16%,10%)] px-2 py-1 text-[11px] text-[hsl(35,24%,92%)] outline-none placeholder:text-[hsl(30,10%,42%)]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newObjectiveText.trim()) {
                      addObjective.mutate({ campaignId, entityId, description: newObjectiveText.trim() });
                      setNewObjectiveText('');
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!newObjectiveText.trim() || addObjective.isPending}
                  onClick={() => {
                    if (newObjectiveText.trim()) {
                      addObjective.mutate({ campaignId, entityId, description: newObjectiveText.trim() });
                      setNewObjectiveText('');
                    }
                  }}
                  className="rounded border border-[hsla(42,72%,52%,0.38)] px-2 py-1 text-[10px] text-[hsl(42,78%,80%)] transition hover:border-[hsla(42,72%,60%,0.46)] disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          ) : null}

          {questConnections.length > 0 && (
            <div className="space-y-1.5">
              <GroupHeading title="Quest links" count={questConnections.length} />
              <div className="space-y-0.5">
                {questConnections.map((item) => (
                  <RelationshipRow
                    key={`quest-${item.entity._id}-${item.relationshipLabel}`}
                    entity={item.entity}
                    relationshipLabel={item.relationshipLabel}
                    nav={nav}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DetailSection>
    );
  }

  function renderFactionDetails() {
    const factionRows = buildFactionSpecificRows(currentEntity, nodeMap);
    const hasBody =
      currentEntity.disposition ||
      currentEntity.reputation != null ||
      factionRows.length > 0;

    if (!hasBody) return null;

    return (
      <DetailSection
        icon={Link2}
        title="Faction context"
        subtitle="Disposition, reputation, and faction ties stay visible without overpowering the world graph."
      >
        <div className="space-y-3">
          <div className="space-y-1.5 text-[12px] text-[hsl(30,18%,72%)]">
            {currentEntity.disposition && (
              <DetailField label="Disposition" value={currentEntity.disposition} />
            )}
            {currentEntity.reputation != null && (
              <DetailField label="Reputation" value={`${currentEntity.reputation} (${currentEntity.disposition ?? 'neutral'})`} />
            )}
          </div>

          {currentEntity.reputation != null && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)]">Adjust Reputation</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={repDelta}
                  onChange={(e) => setRepDelta(Number(e.target.value))}
                  className="w-16 rounded border border-[hsla(32,26%,26%,0.48)] bg-[hsl(24,16%,10%)] px-2 py-1 text-center text-[11px] text-[hsl(35,24%,92%)] outline-none"
                  placeholder="±"
                />
                <input
                  type="text"
                  value={repDescription}
                  onChange={(e) => setRepDescription(e.target.value)}
                  placeholder="Reason..."
                  className="flex-1 rounded border border-[hsla(32,26%,26%,0.48)] bg-[hsl(24,16%,10%)] px-2 py-1 text-[11px] text-[hsl(35,24%,92%)] outline-none placeholder:text-[hsl(30,10%,42%)]"
                />
                <button
                  type="button"
                  disabled={!repDelta || !repDescription.trim() || adjustReputation.isPending}
                  onClick={() => {
                    adjustReputation.mutate({ campaignId, entityId, data: { delta: repDelta, description: repDescription.trim() } });
                    setRepDelta(0);
                    setRepDescription('');
                  }}
                  className="rounded border border-[hsla(42,72%,52%,0.38)] px-2 py-1 text-[10px] text-[hsl(42,78%,80%)] transition hover:border-[hsla(42,72%,60%,0.46)] disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
              {currentEntity.reputationHistory?.length ? (
                <ul className="mt-1 space-y-0.5">
                  {currentEntity.reputationHistory.slice(-5).reverse().map((evt, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11px] text-[hsl(30,12%,58%)]">
                      <span className={evt.delta > 0 ? 'text-[hsl(150,62%,70%)]' : 'text-[hsl(0,72%,72%)]'}>
                        {evt.delta > 0 ? '+' : ''}{evt.delta}
                      </span>
                      <span className="truncate">{evt.description}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          {factionRows.length > 0 && (
            <div className="space-y-1.5">
              <GroupHeading title="Faction relationships" count={factionRows.length} />
              <div className="space-y-0.5">
                {factionRows.map((item) => (
                  <RelationshipRow
                    key={`faction-${item.entity._id}-${item.relationshipLabel}`}
                    entity={item.entity}
                    relationshipLabel={item.relationshipLabel}
                    nav={nav}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DetailSection>
    );
  }

  function renderNpcDetails() {
    const npcRows = buildNpcSpecificRows(currentEntity, nodeMap);
    const hasBody =
      currentEntity.npcDisposition ||
      currentEntity.motivations?.length ||
      currentEntity.secrets?.length ||
      npcRows.length > 0;

    if (!hasBody) return null;

    return (
      <DetailSection
        icon={Link2}
        title="Character context"
        subtitle="Keep close at hand the motivations, loyalties, and sensitive threads that make this NPC matter."
      >
        <div className="space-y-3">
          <div className="space-y-1.5 text-[12px] text-[hsl(30,18%,72%)]">
            {currentEntity.npcDisposition && (
              <DetailField label="Disposition" value={currentEntity.npcDisposition} />
            )}
            {currentEntity.motivations?.length ? (
              <DetailField
                label="Motivations"
                value={currentEntity.motivations.join(', ')}
              />
            ) : null}
          </div>

          {currentEntity.secrets?.length ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)]">
                Secrets ({currentEntity.secrets.filter(s => s.revealed).length}/{currentEntity.secrets.length} revealed)
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {currentEntity.secrets.map((secret, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[12px]">
                    {secret.revealed ? (
                      <span className="mt-0.5 shrink-0 rounded-full border border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] px-1.5 py-0.5 text-[9px] text-[hsl(150,62%,70%)]">
                        revealed
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={revealSecret.isPending}
                        onClick={() => revealSecret.mutate({ campaignId, entityId, secretId: (secret as unknown as { _id: string })._id ?? String(idx) })}
                        className="mt-0.5 shrink-0 rounded-full border border-[hsla(42,72%,52%,0.38)] bg-[hsla(42,72%,52%,0.1)] px-1.5 py-0.5 text-[9px] text-[hsl(42,78%,80%)] transition hover:border-[hsla(42,72%,60%,0.46)] disabled:opacity-40"
                      >
                        reveal
                      </button>
                    )}
                    <span className={`flex-1 text-[hsl(35,24%,92%)] ${secret.revealed ? 'opacity-60' : ''}`}>
                      {secret.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {npcRows.length > 0 && (
            <div className="space-y-1.5">
              <GroupHeading title="Loyalties and ties" count={npcRows.length} />
              <div className="space-y-0.5">
                {npcRows.map((item) => (
                  <RelationshipRow
                    key={`npc-${item.entity._id}-${item.relationshipLabel}`}
                    entity={item.entity}
                    relationshipLabel={item.relationshipLabel}
                    nav={nav}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DetailSection>
    );
  }

  function renderNotesAndLore() {
    if (!currentEntity.description) return null;

    return (
      <DetailSection
        icon={ScrollText}
        title="Notes and lore"
        subtitle="Long-form description stays available, but after context, placement, and connections."
      >
        <div className="rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.78)] px-4 py-3">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[hsl(30,18%,72%)]">
            {currentEntity.description}
          </p>
        </div>
      </DetailSection>
    );
  }

  function renderCrossFeatureReferences() {
    if (crossFeatureRefs.totalCount === 0) {
      return (
        <DetailSection
          icon={Signpost}
          title="Used in"
          subtitle="Cross-feature references show where this entity appears outside the world graph."
        >
          <p className="px-1 text-[12px] text-[hsl(30,12%,58%)]">
            Not referenced by any other feature yet.
          </p>
        </DetailSection>
      );
    }

    return (
      <DetailSection
        icon={Signpost}
        title={`Used in (${crossFeatureRefs.totalCount})`}
        subtitle="Cross-feature references show where this entity appears outside the world graph."
      >
        <div className="space-y-3">
          {crossFeatureRefs.groups.map((group) => (
            <CrossFeatureRefGroup key={group.key} group={group} onNavigate={handleCrossFeatureNavigate} />
          ))}
        </div>
      </DetailSection>
    );
  }

  function handleTimelineNavigate(sourceType: string, sourceId: string) {
    const tabMap: Record<string, string> = {
      session: 'sessions',
      encounter: 'encounters',
      arc_development: 'arcs',
    };
    const tab = tabMap[sourceType];
    if (!tab) return;
    requestNavigation(tab, sourceId);
    onTabChange?.(tab);
  }

  function handleCrossFeatureNavigate(groupKey: string, itemId: string) {
    const tabMap: Record<string, string> = {
      sessions: 'sessions',
      encounters: 'encounters',
      arcs: 'arcs',
      events: 'calendar',
      downtime: 'downtime',
      handouts: 'handouts',
    };
    const tab = tabMap[groupKey];
    if (!tab) return;
    requestNavigation(tab, itemId);
    onTabChange?.(tab);
  }

  function renderTimeline() {
    if (timeline.totalCount === 0) return null;
    return <EntityTimelineSection timeline={timeline} onNavigate={handleTimelineNavigate} />;
  }
}

function CrossFeatureRefGroup({ group, onNavigate }: { group: CrossFeatureGroup; onNavigate?: (groupKey: string, itemId: string) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const IconComponent = CROSS_FEATURE_ICON_MAP[group.icon] ?? Signpost;

  return (
    <section className="space-y-1.5">
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="flex w-full items-center gap-2 px-1 text-left"
      >
        <IconComponent className="h-3.5 w-3.5 text-[hsl(30,12%,58%)]" />
        <h4 className="flex-1 text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)]">
          {group.label}
        </h4>
        <span className="text-[10px] text-[hsl(30,12%,50%)]">{group.items.length}</span>
      </button>
      {!collapsed && (
        <div className="flex flex-wrap gap-1.5 pl-1">
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate?.(group.key, item.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[hsla(32,24%,30%,0.42)] bg-[hsla(24,18%,16%,0.66)] px-2.5 py-1 text-[11px] text-[hsl(35,24%,88%)] cursor-pointer hover:bg-[hsla(32,20%,20%,0.4)] transition"
              title={item.detail ? `${item.name} (${item.detail})` : item.name}
            >
              <IconComponent className="h-3 w-3 text-[hsl(30,12%,58%)]" />
              {item.name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

const CROSS_FEATURE_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  scroll: ScrollText,
  swords: Swords,
  'book-open': BookOpen,
  calendar: Calendar,
  moon: Moon,
  'file-text': FileText,
};

function ContextCreateButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[hsla(32,24%,30%,0.42)] bg-[hsla(24,18%,16%,0.66)] px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-[hsl(35,24%,88%)] transition-colors hover:border-[hsla(38,60%,52%,0.34)] hover:text-[hsl(38,82%,63%)]"
    >
      {label}
    </button>
  );
}

type MiniEntity = Pick<WorldEntity, '_id' | 'name' | 'type'> | WorldTreeNode;
type ConnectionGroup = {
  key: WorldEntityType;
  title: string;
  items: Array<{ entity: MiniEntity; relationshipLabel: string }>;
};

function DetailSection({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-[hsl(30,12%,58%)]" />
          <h3 className="text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]">
            {title}
          </h3>
        </div>
        <p className="text-[11px] leading-relaxed text-[hsl(30,13%,62%)]">
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 text-[11px] text-[hsl(30,12%,58%)]">
        {label}
      </span>
      <span className="text-[12px] capitalize text-[hsl(35,24%,92%)]">
        {value.replace(/_/g, ' ')}
      </span>
    </div>
  );
}

function GroupHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h4 className="text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)]">
        {title}
      </h4>
      <span className="text-[10px] text-[hsl(30,12%,50%)]">{count}</span>
    </div>
  );
}

function Badge({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value?: number | string;
  tone?: 'neutral' | 'highlight';
}) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] ${
        tone === 'highlight'
          ? 'border-[hsla(38,60%,52%,0.3)] bg-[hsla(38,70%,46%,0.12)] text-[hsl(38,82%,63%)]'
          : 'border-[hsla(32,24%,30%,0.42)] bg-[hsla(24,18%,16%,0.66)] text-[hsl(30,14%,68%)]'
      }`}
    >
      {value != null ? `${value} ${label}` : label}
    </span>
  );
}

function RelationshipRow({
  entity,
  relationshipLabel,
  nav,
}: {
  entity: MiniEntity;
  relationshipLabel: string;
  nav: WorldNavigation;
}) {
  const config = ENTITY_TYPE_CONFIG[entity.type];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={() => nav.goToDetail(entity._id)}
      className="group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-[hsl(24,20%,15%)]"
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
        style={{ backgroundColor: `${config.color}15`, color: config.color }}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-[hsl(35,24%,92%)]">{entity.name}</p>
        <p className="truncate text-[11px] text-[hsl(30,12%,58%)]">
          {relationshipLabel.replace(/_/g, ' ')} · {formatWorldEntityContext(entity)}
        </p>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function buildIdentityLine(entity: WorldEntity) {
  return formatWorldEntityContext(entity);
}

function buildIdentityBadges(
  entity: WorldEntity,
  references: WorldEntity[],
  children: WorldEntity[],
) {
  const badges: Array<{ label: string; value?: number | string; tone?: 'neutral' | 'highlight' }> = [];

  if (!entity.parentEntityId) {
    badges.push({ label: 'unassigned/root', tone: 'highlight' });
  }
  if (children.length > 0) {
    badges.push({ label: 'contains', value: children.length });
  }
  if (references.length > 0) {
    badges.push({ label: 'referenced by', value: references.length, tone: 'highlight' });
  }
  if ((entity.relatedEntities?.length ?? 0) > 0) {
    badges.push({ label: 'links', value: entity.relatedEntities.length });
  }
  if (entity.discoveredByParty) {
    badges.push({ label: 'known to party', tone: 'highlight' });
  }
  if (entity.type === 'quest' && isActiveQuestStatus(entity.questStatus)) {
    badges.push({ label: 'active quest', tone: 'highlight' });
  }

  return badges.slice(0, 5);
}

function groupEntitiesForSections(entities: WorldEntity[]) {
  const groups = [
    {
      key: 'locations',
      title: 'Locations within',
      items: entities.filter((entity) => entity.type === 'location' || entity.type === 'location_detail'),
    },
    {
      key: 'npcs',
      title: 'Residents and NPCs',
      items: entities.filter((entity) => entity.type === 'npc' || entity.type === 'npc_minor'),
    },
    {
      key: 'factions',
      title: 'Factions present',
      items: entities.filter((entity) => entity.type === 'faction'),
    },
    {
      key: 'quests',
      title: 'Quests tied here',
      items: entities.filter((entity) => entity.type === 'quest'),
    },
    {
      key: 'items',
      title: 'Items and lore',
      items: entities.filter((entity) => ['item', 'lore', 'event', 'trap'].includes(entity.type)),
    },
  ];

  return groups.filter((group) => group.items.length > 0);
}

function buildOutgoingConnections(
  entity: WorldEntity,
  nodeMap: Map<string, WorldTreeNode>,
) {
  const items: Array<{ entity: MiniEntity; relationshipLabel: string }> = [];

  for (const rel of entity.relatedEntities ?? []) {
    if (typeof rel.entityId === 'object') {
      items.push({
        entity: normalizeMiniEntity(rel.entityId),
        relationshipLabel: rel.relationshipType,
      });
      continue;
    }

    const node = nodeMap.get(rel.entityId);
    if (!node) continue;
    items.push({ entity: node, relationshipLabel: rel.relationshipType });
  }

  if (entity.questGiver) {
    const questGiver =
      typeof entity.questGiver === 'object'
        ? { _id: entity.questGiver._id, name: entity.questGiver.name, type: 'npc' as const }
        : nodeMap.get(entity.questGiver);

    if (questGiver) {
      items.push({ entity: questGiver, relationshipLabel: 'quest giver' });
    }
  }

  return groupConnections(items);
}

function buildQuestSpecificRows(
  entity: WorldEntity,
  nodeMap: Map<string, WorldTreeNode>,
) {
  const rows: Array<{ entity: MiniEntity; relationshipLabel: string }> = [];

  for (const questId of entity.prerequisiteQuests ?? []) {
    const quest = nodeMap.get(questId);
    if (quest) rows.push({ entity: quest, relationshipLabel: 'requires' });
  }
  for (const questId of entity.nextQuests ?? []) {
    const quest = nodeMap.get(questId);
    if (quest) rows.push({ entity: quest, relationshipLabel: 'leads to' });
  }
  for (const questId of entity.branchQuests ?? []) {
    const quest = nodeMap.get(questId);
    if (quest) rows.push({ entity: quest, relationshipLabel: 'branches to' });
  }

  return rows;
}

function buildFactionSpecificRows(
  entity: WorldEntity,
  nodeMap: Map<string, WorldTreeNode>,
) {
  const rows: Array<{ entity: MiniEntity; relationshipLabel: string }> = [];

  for (const rel of entity.factionRelationships ?? []) {
    const faction = nodeMap.get(rel.factionEntityId);
    if (!faction) continue;
    rows.push({
      entity: faction,
      relationshipLabel: rel.description || rel.attitude,
    });
  }

  return rows;
}

function buildNpcSpecificRows(
  entity: WorldEntity,
  nodeMap: Map<string, WorldTreeNode>,
) {
  const rows: Array<{ entity: MiniEntity; relationshipLabel: string }> = [];

  for (const loyalty of entity.loyalties ?? []) {
    const faction = nodeMap.get(loyalty.factionEntityId);
    if (!faction) continue;
    rows.push({
      entity: faction,
      relationshipLabel: `loyalty ${loyalty.strength}/5`,
    });
  }

  return rows;
}

function groupReferencedEntities(references: WorldEntity[]) {
  const order: WorldEntityType[] = [
    'quest',
    'npc',
    'npc_minor',
    'faction',
    'location',
    'location_detail',
    'event',
    'item',
    'lore',
    'trap',
  ];

  return order
    .map((type) => {
      const items = references.filter((ref) => ref.type === type);
      if (items.length === 0) return null;
      const group = {
        key: type,
        title: `Referenced by ${ENTITY_TYPE_CONFIG[type].pluralLabel}`,
        items,
      };
      return group;
    })
    .filter((group): group is { key: WorldEntityType; title: string; items: WorldEntity[] } => group !== null);
}

function groupConnections(
  items: Array<{ entity: MiniEntity; relationshipLabel: string }>,
): ConnectionGroup[] {
  const order: WorldEntityType[] = [
    'location',
    'location_detail',
    'npc',
    'npc_minor',
    'faction',
    'quest',
    'event',
    'item',
    'lore',
    'trap',
  ];

  return order
    .map((type) => {
      const typed = items.filter((item) => item.entity.type === type);
      if (typed.length === 0) return null;
      const group = {
        key: type,
        title: ENTITY_TYPE_CONFIG[type].pluralLabel,
        items: typed,
      };
      return group;
    })
    .filter((group): group is ConnectionGroup => group !== null);
}

function buildBreadcrumbs(
  entityId: string,
  tree: WorldTreeNode[],
): Crumb[] {
  const byId = new Map(tree.map((node) => [node._id, node]));
  const crumbs: Crumb[] = [];
  const current = byId.get(entityId);

  if (current?.parentEntityId) {
    let parentId: string | undefined = current.parentEntityId;
    while (parentId) {
      const parent = byId.get(parentId);
      if (!parent) break;
      crumbs.unshift({ id: parent._id, label: parent.name });
      parentId = parent.parentEntityId;
    }
  }

  return crumbs;
}

function isActiveQuestStatus(status?: string) {
  if (!status) return true;
  const normalized = status.trim().toLowerCase();
  return !['completed', 'resolved', 'failed', 'abandoned', 'inactive'].includes(normalized);
}

function normalizeMiniEntity(entity: { _id: string; name: string; type: string }): MiniEntity {
  return {
    _id: entity._id,
    name: entity.name,
    type: normalizeEntityType(entity.type),
  };
}
