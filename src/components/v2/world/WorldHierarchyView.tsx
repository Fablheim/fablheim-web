import { useCallback, useMemo } from 'react';
import type { ComponentType } from 'react';
import {
  ArrowLeft,
  FolderTree,
  Link2,
  MapPin,
  Plus,
  Users,
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
} from './world-ui';
import { buildContextualCreateActions } from './world-create';

interface WorldHierarchyViewProps {
  campaignId: string;
  isDM: boolean;
  entityId: string;
  nav: WorldNavigation;
}

export function WorldHierarchyView({
  campaignId,
  entityId,
  nav,
}: WorldHierarchyViewProps) {
  const { data: entity, isLoading: entityLoading } = useWorldEntity(
    campaignId,
    entityId,
  );
  const { data: children, isLoading: childrenLoading } =
    useWorldEntityChildren(campaignId, entityId);
  const { data: references } = useWorldEntityReferences(campaignId, entityId);
  const { data: tree } = useWorldTree(campaignId);

  const nodeMap = useMemo(
    () => new Map((tree ?? []).map((node) => [node._id, node])),
    [tree],
  );

  const childCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of tree ?? []) {
      if (node.parentEntityId) {
        counts.set(
          node.parentEntityId,
          (counts.get(node.parentEntityId) ?? 0) + 1,
        );
      }
    }
    return counts;
  }, [tree]);

  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(entityId, tree ?? []),
    [entityId, tree],
  );

  const groupedChildren = useMemo(
    () => groupEntitiesByBrowseSection(children ?? []),
    [children],
  );

  const groupedConnections = useMemo(() => {
    if (!entity) return [];

    const outgoing = (entity.relatedEntities ?? [])
      .map((rel) => {
        const populated = readPopulatedRelatedEntity(rel.entityId);
        if (populated) {
          return {
            entity: {
              _id: populated._id,
              name: populated.name,
              type: normalizeEntityType(populated.type),
            },
            relationshipLabel: rel.relationshipType,
          };
        }

        const node = nodeMap.get(rel.entityId);
        if (!node) return null;

        return {
          entity: node,
          relationshipLabel: rel.relationshipType,
        };
      })
      .filter((item): item is { entity: MiniEntity; relationshipLabel: string } => item !== null);

    const incoming = (references ?? [])
      .filter((ref) => ref._id !== entity._id)
      .map((ref) => ({
        entity: ref,
        relationshipLabel: 'references this',
      }));

    return groupMiniEntitiesByType([...outgoing, ...incoming], 2);
  }, [entity, nodeMap, references]);

  const headerSignals = useMemo(() => {
    if (!entity) return [];

    const contained = children ?? [];
    const counts = countEntityTypes(contained);
    const signals = [
      { label: 'contained', value: contained.length },
      { label: 'NPCs', value: counts.npc + counts.npc_minor },
      { label: 'factions', value: counts.faction },
      { label: 'quests', value: counts.quest },
      { label: 'linked', value: (entity.relatedEntities?.length ?? 0) + (references?.length ?? 0) },
    ];

    return signals.filter((signal) => signal.value > 0).slice(0, 4);
  }, [children, entity, references]);

  const contextualCreateActions = useMemo(
    () => (entity ? buildContextualCreateActions(entity) : []),
    [entity],
  );

  const handleViewDetail = useCallback(() => {
    nav.goToDetail(entityId);
  }, [entityId, nav]);

  if (entityLoading) {
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
  const config = ENTITY_TYPE_CONFIG[currentEntity.type];
  const Icon = config.icon;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {renderNav()}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[840px] space-y-5 px-4 py-4 pb-10">
          {renderEntitySummary()}
          {renderChildren()}
          {renderConnections()}
        </div>
      </div>
    </div>
  );

  function renderNav() {
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

  function renderEntitySummary() {
    return (
      <section className="rounded-xl border border-[hsla(32,26%,26%,0.42)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.96),hsla(24,14%,11%,0.98))] p-4">
        <button
          type="button"
          onClick={handleViewDetail}
          className="group flex w-full items-start gap-3 text-left"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `${config.color}15`,
              color: config.color,
            }}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[18px] text-[hsl(35,24%,92%)]">
                  {currentEntity.name}
                </p>
                <p className="mt-1 text-[12px] text-[hsl(30,12%,58%)]">
                  {formatWorldEntityContext(currentEntity)}
                </p>
              </div>

              <span className="shrink-0 text-[10px] text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100">
                Open detail →
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {headerSignals.map((signal) => (
                <ContextChip
                  key={`${signal.label}-${signal.value}`}
                  label={signal.label}
                  value={signal.value}
                />
              ))}
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)]">
                <MapPin className="h-3 w-3" />
                World placement
              </div>
              <WorldPathNav
                crumbs={breadcrumbs}
                currentLabel={currentEntity.name}
                nav={nav}
              />
            </div>
          </div>
        </button>
        {contextualCreateActions.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-[hsla(32,26%,26%,0.28)] pt-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)]">
              <Plus className="h-3 w-3" />
              Create in context
            </div>
            <div className="flex flex-wrap gap-1.5">
              {contextualCreateActions.map((action) => (
                <ContextActionButton
                  key={action.key}
                  label={action.label}
                  onClick={() => nav.openCreate(action.draft)}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  function renderChildren() {
    if (childrenLoading) {
      return (
        <div className="flex h-48 items-center justify-center">
          <p className="text-xs text-[hsl(30,14%,40%)]">Loading children…</p>
        </div>
      );
    }

    return (
      <section className="space-y-3">
        <SectionHeader
          icon={FolderTree}
          title="Contained entities"
          subtitle="Browse deeper into this part of the world by what is inside it."
        />

        {groupedChildren.length === 0 ? (
          <EmptyState
            message="Nothing is nested here yet."
            hint="As places, people, and quests get attached here, they will appear in browseable groups."
          />
        ) : (
          <div className="space-y-4">
            {groupedChildren.map((group) => (
              <section key={group.key} className="space-y-1.5">
                <GroupHeading title={group.title} count={group.items.length} />
                <div className="space-y-0.5">
                  {group.items.map((child) => (
                    <EntityListItem
                      key={child._id}
                      entity={child}
                      nav={nav}
                      childCount={childCounts.get(child._id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    );
  }

  function renderConnections() {
    return (
      <section className="space-y-3">
        <SectionHeader
          icon={Link2}
          title="Connected entities"
          subtitle="Jump sideways through factions, NPCs, quests, and other threads tied to this part of the campaign."
        />

        {groupedConnections.length === 0 ? (
          <EmptyState
            message="No connected entities yet."
            hint="As this entity is referenced by other material, those shortcuts will appear here."
          />
        ) : (
          <div className="space-y-4">
            {groupedConnections.map((group) => (
              <section key={group.key} className="space-y-1.5">
                <GroupHeading title={group.title} count={group.items.length} />
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <MiniEntityRow
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
        )}
      </section>
    );
  }
}

function ContextActionButton({
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

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
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

function ContextChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-[hsla(32,24%,30%,0.42)] bg-[hsla(24,18%,16%,0.66)] px-2 py-0.5 text-[10px] text-[hsl(30,14%,68%)]">
      {value} {label}
    </span>
  );
}

function EmptyState({
  message,
  hint,
}: {
  message: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[hsla(32,24%,28%,0.34)] px-4 py-5 text-center">
      <p className="text-[12px] text-[hsl(35,24%,88%)]">{message}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
        {hint}
      </p>
    </div>
  );
}

function MiniEntityRow({
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
        <p className="truncate text-[13px] text-[hsl(35,24%,92%)]">
          {entity.name}
        </p>
        <p className="truncate text-[11px] text-[hsl(30,12%,58%)]">
          {relationshipLabel.replace(/_/g, ' ')} · {formatWorldEntityContext(entity as WorldEntity)}
        </p>
      </div>
      <Users className="h-3.5 w-3.5 shrink-0 text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function groupEntitiesByBrowseSection(entities: WorldEntity[]) {
  const groups = [
    {
      key: 'locations',
      title: 'Locations within',
      items: entities.filter((entity) => entity.type === 'location' || entity.type === 'location_detail'),
    },
    {
      key: 'npcs',
      title: 'NPCs here',
      items: entities.filter((entity) => entity.type === 'npc' || entity.type === 'npc_minor'),
    },
    {
      key: 'factions',
      title: 'Factions operating here',
      items: entities.filter((entity) => entity.type === 'faction'),
    },
    {
      key: 'quests',
      title: 'Quests tied here',
      items: entities.filter((entity) => entity.type === 'quest'),
    },
    {
      key: 'events',
      title: 'Events here',
      items: entities.filter((entity) => entity.type === 'event'),
    },
    {
      key: 'other',
      title: 'Other entities',
      items: entities.filter(
        (entity) =>
          ![
            'location',
            'location_detail',
            'npc',
            'npc_minor',
            'faction',
            'quest',
            'event',
          ].includes(entity.type),
      ),
    },
  ];

  return groups.filter((group) => group.items.length > 0);
}

function groupMiniEntitiesByType(
  items: Array<{ entity: MiniEntity; relationshipLabel: string }>,
  maxPerGroup?: number,
) {
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
      return {
        key: type,
        title: ENTITY_TYPE_CONFIG[type].pluralLabel,
        items: maxPerGroup ? typed.slice(0, maxPerGroup) : typed,
      };
    })
    .filter((group): group is { key: WorldEntityType; title: string; items: Array<{ entity: MiniEntity; relationshipLabel: string }> } => group !== null);
}

function countEntityTypes(entities: WorldEntity[]) {
  const counts = {
    location: 0,
    location_detail: 0,
    npc: 0,
    npc_minor: 0,
    faction: 0,
    quest: 0,
    event: 0,
  };

  for (const entity of entities) {
    if (entity.type in counts) {
      counts[entity.type as keyof typeof counts] += 1;
    }
  }

  return counts;
}

/** Walk up the tree to build breadcrumb trail (excluding the current node). */
function buildBreadcrumbs(
  entityId: string,
  tree: WorldTreeNode[],
): Crumb[] {
  const byId = new Map(tree.map((n) => [n._id, n]));
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

function readPopulatedRelatedEntity(value: unknown) {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as { _id?: string; name?: string; type?: string };
  if (!candidate._id || !candidate.name || !candidate.type) return null;

  return {
    _id: candidate._id,
    name: candidate.name,
    type: candidate.type,
  };
}
