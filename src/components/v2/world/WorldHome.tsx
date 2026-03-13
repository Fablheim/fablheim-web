import { useMemo, type ReactNode } from 'react';
import {
  ChevronRight,
  FolderTree,
  Plus,
  Unplug,
} from 'lucide-react';
import { useWorldEntities, useUnassignedEntities } from '@/hooks/useWorldEntities';
import type { WorldEntity, WorldEntityType } from '@/types/campaign';
import { ENTITY_TYPE_CONFIG, BROWSABLE_TYPES } from './world-config';
import type { WorldNavigation } from './WorldCenterStage';
import type { WorldCreateDraft } from './world-create';

interface WorldHomeProps {
  campaignId: string;
  isDM: boolean;
  nav: WorldNavigation;
}

type TypeStats = {
  total: number;
  unassigned: number;
  placed: number;
  active: number;
  discovered: number;
  connected: number;
  roots: number;
};

type RegionSummary = {
  entity: WorldEntity;
  directChildren: number;
  totalContained: number;
  activeThreads: number;
  signals: Array<{ label: string; value: number }>;
};

export function WorldHome({ campaignId, nav }: WorldHomeProps) {
  const { data: allEntities, isLoading } = useWorldEntities(campaignId);
  const { data: unassigned } = useUnassignedEntities(campaignId);

  const entityMap = useMemo(
    () => new Map((allEntities ?? []).map((entity) => [entity._id, entity])),
    [allEntities],
  );

  const rootEntities = useMemo(
    () =>
      (allEntities ?? []).filter(
        (entity) =>
          !entity.parentEntityId &&
          (entity.type === 'location' || entity.type === 'location_detail'),
      ),
    [allEntities],
  );

  const typeStats = useMemo(() => {
    const stats = {} as Record<WorldEntityType, TypeStats>;

    for (const type of BROWSABLE_TYPES) {
      stats[type] = {
        total: 0,
        unassigned: 0,
        placed: 0,
        active: 0,
        discovered: 0,
        connected: 0,
        roots: 0,
      };
    }

    for (const entity of allEntities ?? []) {
      if (!(entity.type in stats)) continue;
      const current = stats[entity.type];
      current.total += 1;
      if (entity.parentEntityId) current.placed += 1;
      else current.unassigned += 1;
      if (entity.discoveredByParty) current.discovered += 1;
      if ((entity.relatedEntities?.length ?? 0) > 0) current.connected += 1;
      if (!entity.parentEntityId && entity.type === 'location') current.roots += 1;
      if (isEntityActive(entity)) current.active += 1;
    }

    return stats;
  }, [allEntities]);

  const regionSummaries = useMemo(() => {
    const summaries = new Map<string, RegionSummary>();

    for (const root of rootEntities) {
      summaries.set(root._id, {
        entity: root,
        directChildren: 0,
        totalContained: 0,
        activeThreads: 0,
        signals: [],
      });
    }

    for (const entity of allEntities ?? []) {
      const rootId = resolveRootEntityId(entity, entityMap);
      if (!rootId || rootId === entity._id) continue;

      const summary = summaries.get(rootId);
      if (!summary) continue;

      summary.totalContained += 1;
      if (resolveParentId(entity.parentEntityId) === rootId) {
        summary.directChildren += 1;
      }
      if (isEntityActive(entity)) {
        summary.activeThreads += 1;
      }
    }

    for (const summary of summaries.values()) {
      const counts = countEntitiesInRegion(summary.entity._id, allEntities ?? [], entityMap);
      const regionSignals = [
        { label: 'subplaces', value: counts.subplaces },
        { label: 'NPCs', value: counts.npcs },
        { label: 'factions', value: counts.factions },
        { label: 'quests', value: counts.quests },
        { label: 'events', value: counts.events },
      ].filter((signal) => signal.value > 0);

      summary.signals = regionSignals.slice(0, 3);
    }

    return rootEntities
      .map((root) => summaries.get(root._id)!)
      .sort((a, b) => b.totalContained - a.totalContained);
  }, [allEntities, entityMap, rootEntities]);

  const unassignedGroups = useMemo(() => {
    const groups = new Map<WorldEntityType, WorldEntity[]>();
    for (const entity of unassigned ?? []) {
      const current = groups.get(entity.type) ?? [];
      current.push(entity);
      groups.set(entity.type, current);
    }
    return groups;
  }, [unassigned]);

  if (isLoading) {
    return renderLoading();
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[840px] flex-col gap-7 px-4 py-5 pb-10">
        {renderRootRegions()}
        {renderTypeGrid()}
        {renderUnassignedArea()}
      </div>
    </div>
  );

  function renderLoading() {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-[hsl(30,14%,40%)]">Loading world…</p>
      </div>
    );
  }

  function renderRootRegions() {
    if (regionSummaries.length === 0) return null;

    return (
      <section className="space-y-3">
        <SectionHeader
          eyebrow="1. World Structure"
          title="Regions"
          description="Start from the world map. Each region hints at what it contains so you can browse by place, not just by name."
          action={
            <HeaderActionButton
              label="Create entity"
              onClick={() => nav.openCreate(getGlobalCreateDraft())}
            />
          }
        />

        <div className="space-y-2">
          {regionSummaries.map((summary) => {
            const { entity } = summary;
            return (
              <button
                key={entity._id}
                type="button"
                onClick={() => nav.goToHierarchy(entity._id)}
                className="group w-full rounded-xl border border-[hsla(32,26%,26%,0.45)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.96),hsla(24,14%,11%,0.98))] px-4 py-3 text-left transition-colors hover:border-[hsla(38,50%,58%,0.4)] hover:bg-[linear-gradient(180deg,hsla(26,20%,16%,0.98),hsla(24,16%,12%,1))]"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsla(180,30%,40%,0.14)] text-[hsl(180,42%,62%)]">
                    <FolderTree className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] text-[hsl(35,24%,92%)]">
                          {entity.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[hsl(30,12%,58%)]">
                          {formatRegionContext(entity, summary)}
                        </p>
                      </div>

                      {summary.activeThreads > 0 && (
                        <span className="shrink-0 rounded-full border border-[hsla(38,60%,52%,0.28)] bg-[hsla(38,70%,46%,0.12)] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[hsl(38,82%,63%)]">
                          {summary.activeThreads} active
                        </span>
                      )}
                    </div>

                    {summary.signals.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {summary.signals.map((signal) => (
                          <StatPill
                            key={`${entity._id}-${signal.label}`}
                            label={signal.label}
                            value={signal.value}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  function renderTypeGrid() {
    return (
      <section className="space-y-3">
        <SectionHeader
          eyebrow="2. Browse Paths"
          title="Browse by Type"
          description="Jump into the world by entity type, with quick state cues for what is placed, loose, active, or already tied into play."
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BROWSABLE_TYPES.map((type) => {
            const config = ENTITY_TYPE_CONFIG[type];
            const Icon = config.icon;
            const stats = typeStats[type];
            const contextualSignal = getTypeContextSignal(type, stats);

            return (
              <button
                key={type}
                type="button"
                onClick={() => nav.goToType(type)}
                className="group rounded-xl border border-[hsla(32,26%,26%,0.4)] bg-[hsl(24,14%,11%)] px-3.5 py-3 text-left transition-colors hover:border-[hsla(32,26%,26%,0.72)] hover:bg-[hsl(24,20%,13%)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${config.color}16`,
                        color: config.color,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-[hsl(35,24%,92%)]">
                        {config.pluralLabel}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[hsl(30,12%,58%)]">
                        {stats.total} total
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <p className="mt-2 text-[11px] leading-relaxed text-[hsl(30,13%,64%)]">
                  {contextualSignal}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatPill label="placed" value={stats.placed} />
                  <StatPill label="loose" value={stats.unassigned} muted={stats.unassigned === 0} />
                  {renderTypeSignalPill(type, stats)}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  function renderUnassignedArea() {
    const totalUnassigned = unassigned?.length ?? 0;
    const previewTypes = BROWSABLE_TYPES.filter(
      (type) => (unassignedGroups.get(type)?.length ?? 0) > 0,
    ).slice(0, 4);

    return (
      <section className="space-y-3 pb-2">
        <SectionHeader
          eyebrow="3. Loose Content"
          title="Unassigned"
          description="Loose ideas are normal in active prep. This area keeps them visible until you decide where they belong."
          action={
            <HeaderActionButton
              label="Add loose idea"
              onClick={() =>
                nav.openCreate({
                  title: 'Create loose world entity',
                  subtitle:
                    'Start something without placement. It will land in the world inbox until you decide where it belongs.',
                })
              }
            />
          }
        />

        <button
          type="button"
          onClick={nav.goToUnassigned}
          className="group w-full rounded-xl border border-dashed border-[hsla(32,26%,26%,0.52)] bg-[linear-gradient(180deg,hsla(27,15%,14%,0.96),hsla(24,14%,11%,0.98))] px-4 py-3 text-left transition-colors hover:border-[hsla(38,90%,55%,0.3)] hover:bg-[linear-gradient(180deg,hsla(27,18%,15%,0.98),hsla(24,16%,12%,1))]"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsla(38,70%,46%,0.1)] text-[hsl(38,70%,58%)]">
              <Unplug className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-[hsl(35,24%,92%)]">
                    {totalUnassigned > 0 ? 'World inbox' : 'World inbox is clear'}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[hsl(30,13%,64%)]">
                    {totalUnassigned > 0
                      ? `${totalUnassigned} loose entries waiting to be placed, grouped, or connected when the campaign needs them.`
                      : 'Everything currently has a place. New loose ideas will collect here until you are ready to organize them.'}
                  </p>
                </div>

                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              {previewTypes.length > 0 ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {previewTypes.map((type) => {
                    const items = unassignedGroups.get(type) ?? [];
                    const config = ENTITY_TYPE_CONFIG[type];
                    return (
                      <div
                        key={type}
                        className="rounded-lg border border-[hsla(32,26%,26%,0.32)] bg-[hsla(24,18%,10%,0.66)] px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)]">
                            {config.pluralLabel}
                          </span>
                          <span className="text-[11px] text-[hsl(35,24%,88%)]">
                            {items.length}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[11px] text-[hsl(30,13%,64%)]">
                          {items.slice(0, 2).map((item) => item.name).join(' · ')}
                          {items.length > 2 ? ` +${items.length - 2} more` : ''}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <StatPill label="ready to fill" value={0} muted />
                  <StatPill label="organized" value={rootEntities.length} />
                </div>
              )}
            </div>
          </div>
        </button>
      </section>
    );
  }
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            {eyebrow}
          </p>
          <div className="flex items-center gap-2">
            <h3
              className="text-[14px] text-[hsl(38,36%,82%)]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {title}
            </h3>
          </div>
        </div>
        {action}
      </div>
      <p className="max-w-[640px] text-[11px] leading-relaxed text-[hsl(30,13%,62%)]">
        {description}
      </p>
    </div>
  );
}

function HeaderActionButton({
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
      className="inline-flex items-center gap-1.5 rounded-full border border-[hsla(38,60%,52%,0.3)] bg-[hsla(38,70%,46%,0.08)] px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-[hsl(38,82%,63%)] transition-colors hover:bg-[hsla(38,70%,46%,0.14)]"
    >
      <Plus className="h-3 w-3" />
      {label}
    </button>
  );
}

function getGlobalCreateDraft(): WorldCreateDraft {
  return {
    title: 'Create world entity',
    subtitle:
      'Capture something new with just a name, a quick cue, and optional placement or connection. Leave placement blank to keep it unassigned.',
  };
}

function StatPill({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] ${
        muted
          ? 'border-[hsla(32,22%,26%,0.26)] text-[hsl(30,10%,46%)]'
          : 'border-[hsla(32,24%,30%,0.42)] bg-[hsla(24,18%,16%,0.66)] text-[hsl(30,14%,68%)]'
      }`}
    >
      {value} {label}
    </span>
  );
}

function renderTypeSignalPill(type: WorldEntityType, stats: TypeStats) {
  if (type === 'quest') {
    return <StatPill label="active" value={stats.active} muted={stats.active === 0} />;
  }

  if (type === 'location') {
    return <StatPill label="roots" value={stats.roots} muted={stats.roots === 0} />;
  }

  if (type === 'npc') {
    return <StatPill label="known" value={stats.discovered} muted={stats.discovered === 0} />;
  }

  return <StatPill label="linked" value={stats.connected} muted={stats.connected === 0} />;
}

function getTypeContextSignal(type: WorldEntityType, stats: TypeStats) {
  if (stats.total === 0) {
    return 'No entries yet. This is ready for new campaign material.';
  }

  if (type === 'quest') {
    return `${stats.active} active thread${stats.active === 1 ? '' : 's'} in motion, with ${stats.unassigned} still waiting for a home.`;
  }

  if (type === 'location') {
    return `${stats.roots} root region${stats.roots === 1 ? '' : 's'} anchor the world, with ${stats.placed} placed beneath them.`;
  }

  if (type === 'npc') {
    return `${stats.placed} already live in the world, and ${stats.discovered} ${stats.discovered === 1 ? 'has' : 'have'} crossed the party's path.`;
  }

  return `${stats.placed} already tied into the world, with ${stats.unassigned} loose and ${stats.connected} connected through relationships.`;
}

function formatRegionContext(entity: WorldEntity, summary: RegionSummary) {
  const parts = [];

  if (entity.locationType) {
    parts.push(startCase(entity.locationType));
  }

  if (summary.totalContained > 0) {
    parts.push(`${summary.totalContained} contained entries`);
  } else {
    parts.push('Ready for details');
  }

  if (summary.directChildren > 0) {
    parts.push(`${summary.directChildren} direct branch${summary.directChildren === 1 ? '' : 'es'}`);
  }

  return parts.join(' · ');
}

function countEntitiesInRegion(
  rootId: string,
  allEntities: WorldEntity[],
  entityMap: Map<string, WorldEntity>,
) {
  const counts = {
    subplaces: 0,
    npcs: 0,
    factions: 0,
    quests: 0,
    events: 0,
  };

  for (const entity of allEntities) {
    const resolvedRootId = resolveRootEntityId(entity, entityMap);
    if (!resolvedRootId || resolvedRootId !== rootId || entity._id === rootId) continue;

    if (entity.type === 'location' || entity.type === 'location_detail') counts.subplaces += 1;
    if (entity.type === 'npc' || entity.type === 'npc_minor') counts.npcs += 1;
    if (entity.type === 'faction') counts.factions += 1;
    if (entity.type === 'quest') counts.quests += 1;
    if (entity.type === 'event') counts.events += 1;
  }

  return counts;
}

function resolveRootEntityId(
  entity: WorldEntity,
  entityMap: Map<string, WorldEntity>,
) {
  const parentId = resolveParentId(entity.parentEntityId);
  if (!parentId) return entity._id;

  let currentId = parentId;
  let guard = 0;

  while (currentId && guard < 50) {
    const parent = entityMap.get(currentId);
    if (!parent) return null;

    const nextParentId = resolveParentId(parent.parentEntityId);
    if (!nextParentId) return parent._id;

    currentId = nextParentId;
    guard += 1;
  }

  return null;
}

function resolveParentId(
  parentEntityId?: string | { _id: string; name: string; type: string },
) {
  if (!parentEntityId) return null;
  return typeof parentEntityId === 'string' ? parentEntityId : parentEntityId._id;
}

function isEntityActive(entity: WorldEntity) {
  if (entity.type === 'quest') {
    return isActiveQuestStatus(entity.questStatus);
  }

  if (entity.type === 'event') {
    return true;
  }

  if (entity.type === 'faction') {
    return (entity.factionRelationships?.length ?? 0) > 0 || (entity.reputationHistory?.length ?? 0) > 0;
  }

  if (entity.type === 'npc') {
    return (entity.secrets?.length ?? 0) > 0 || (entity.motivations?.length ?? 0) > 0;
  }

  return (entity.relatedEntities?.length ?? 0) > 0;
}

function isActiveQuestStatus(status?: string) {
  if (!status) return true;

  const normalized = status.trim().toLowerCase();
  return !['completed', 'resolved', 'failed', 'abandoned', 'inactive'].includes(normalized);
}

function startCase(value: string) {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
