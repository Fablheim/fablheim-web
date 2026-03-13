import { useMemo } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  FolderTree,
  Link2,
  MapPin,
  Plus,
  ScrollText,
  Swords,
} from 'lucide-react';
import {
  useWorldEntity,
  useWorldEntityChildren,
  useWorldEntityReferences,
  useWorldTree,
} from '@/hooks/useWorldEntities';
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
import { buildContextualCreateActions } from './world-create';

interface WorldEntityDetailProps {
  campaignId: string;
  isDM: boolean;
  entityId: string;
  nav: WorldNavigation;
}

export function WorldEntityDetail({
  campaignId,
  entityId,
  nav,
}: WorldEntityDetailProps) {
  const { data: entity, isLoading } = useWorldEntity(campaignId, entityId);
  const { data: children } = useWorldEntityChildren(campaignId, entityId);
  const { data: references } = useWorldEntityReferences(campaignId, entityId);
  const { data: tree } = useWorldTree(campaignId);

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
          {renderIdentity()}
          {renderPlacement()}
          {renderContainedEntities()}
          {renderOutgoingRelationships()}
          {renderIncomingReferences()}
          {renderTypeSpecific()}
          {renderNotesAndLore()}
        </div>
      </div>
    </div>
  );

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
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        objective.completed
                          ? 'bg-[hsl(150,50%,55%)]'
                          : 'bg-[hsl(30,12%,58%)]'
                      }`}
                    />
                    <span className={objective.completed ? 'opacity-60 line-through' : ''}>
                      {objective.description}
                    </span>
                  </li>
                ))}
              </ul>
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
              <DetailField label="Reputation" value={String(currentEntity.reputation)} />
            )}
          </div>

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
            {currentEntity.secrets?.length ? (
              <DetailField
                label="Secrets"
                value={`${currentEntity.secrets.length} hidden thread${currentEntity.secrets.length === 1 ? '' : 's'}`}
              />
            ) : null}
          </div>

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
}

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
