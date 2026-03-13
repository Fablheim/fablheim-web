import { useCallback, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Compass,
  Globe,
  Play,
  Plus,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type { Campaign, Session, WorldEntity } from '@/types/campaign';
import type { AppState } from '@/types/workspace';
import { ENTITY_TYPE_CONFIG } from './world/world-config';
import { useWorldExplorerContext } from './world/useWorldExplorerContext';
import { formatWorldEntityContext, startCase } from './world/world-ui';

interface OverviewCenterStageProps {
  campaignId: string;
  campaign: Campaign;
  appState: AppState;
  isDM: boolean;
  onTabChange: (tab: string) => void;
  onStartSession: () => void;
}

export function OverviewCenterStage({
  campaignId,
  campaign,
  appState,
  isDM,
  onTabChange,
  onStartSession,
}: OverviewCenterStageProps) {
  const { data: sessions, isLoading: sessionsLoading } = useSessions(campaignId);
  const { data: worldEntities, isLoading: entitiesLoading } = useWorldEntities(campaignId);
  const { requestEntityNavigation, requestWorldCreate } = useWorldExplorerContext();
  const [now] = useState(() => Date.now());

  const openWorldEntity = useCallback((entityId: string) => {
    requestEntityNavigation(entityId);
    onTabChange('world');
  }, [onTabChange, requestEntityNavigation]);

  const sortedSessions = useMemo(
    () => [...(sessions ?? [])].sort((a, b) => getSessionTime(b) - getSessionTime(a)),
    [sessions],
  );

  const activeQuests = useMemo(
    () =>
      (worldEntities ?? [])
        .filter((entity) => entity.type === 'quest' && isQuestActive(entity.questStatus))
        .sort((a, b) => getEntityTime(b) - getEntityTime(a))
        .slice(0, 3),
    [worldEntities],
  );

  const keyNpcs = useMemo(
    () =>
      (worldEntities ?? [])
        .filter((entity) => (entity.type === 'npc' || entity.type === 'npc_minor') && isEntityRelevant(entity))
        .sort((a, b) => getEntityWeight(b) - getEntityWeight(a))
        .slice(0, 3),
    [worldEntities],
  );

  const importantLocations = useMemo(
    () =>
      (worldEntities ?? [])
        .filter((entity) => (entity.type === 'location' || entity.type === 'location_detail') && isLocationRelevant(entity))
        .sort((a, b) => getEntityWeight(b) - getEntityWeight(a))
        .slice(0, 3),
    [worldEntities],
  );

  const unresolvedThreads = useMemo(() => {
    const hooks = sortedSessions.flatMap((session) => session.aiSummary?.unresolvedHooks ?? []);
    return Array.from(new Set(hooks.filter(Boolean))).slice(0, 3);
  }, [sortedSessions]);

  const recentActivity = useMemo(() => {
    const recentSessions = sortedSessions.slice(0, 2).map((session) => ({
      key: `session-${session._id}`,
      label: `Session ${session.sessionNumber}${session.title ? ` — ${session.title}` : ''}`,
      meta: formatSessionMeta(session),
      note: extractSessionSnippet(session),
      icon: BookOpen,
      onClick: () => onTabChange('sessions'),
    }));

    const recentEntities = [...(worldEntities ?? [])]
      .sort((a, b) => getEntityTime(b) - getEntityTime(a))
      .slice(0, 3)
      .map((entity) => ({
        key: `entity-${entity._id}`,
        label: entity.name,
        meta: `Updated ${formatRelativeDate(entity.updatedAt)} · ${formatWorldEntityContext(entity)}`,
        note: entity.description?.trim() || 'Recently added to the campaign world.',
        icon: ENTITY_TYPE_CONFIG[entity.type].icon,
        onClick: () => openWorldEntity(entity._id),
      }));

    return [...recentSessions, ...recentEntities].slice(0, 4);
  }, [onTabChange, openWorldEntity, sortedSessions, worldEntities]);

  const statusStats = useMemo(() => {
    const totalEntities = worldEntities?.length ?? 0;
    const recentSessionCount = sortedSessions.filter((session) => getSessionTime(session) > now - 1000 * 60 * 60 * 24 * 60).length;
    return [
      { label: 'world entities', value: totalEntities },
      { label: 'active quests', value: activeQuests.length },
      { label: 'recent sessions', value: recentSessionCount },
    ];
  }, [activeQuests.length, now, sortedSessions, worldEntities]);

  const currentSession = sortedSessions.find((session) => session._id === campaign.activeSessionId) ?? null;
  const nextSession = sortedSessions.find((session) =>
    ['draft', 'scheduled', 'ready', 'planned'].includes(session.status),
  ) ?? null;
  const loading = sessionsLoading || entitiesLoading;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-[hsl(30,14%,40%)]">Loading overview…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[920px] flex-col gap-5 px-4 py-4 pb-10">
          <CampaignStatusCard
            campaign={campaign}
            appState={appState}
            currentSession={currentSession}
            nextSession={nextSession}
            statusStats={statusStats}
          />

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <ActiveThreadsCard
              activeQuests={activeQuests}
              keyNpcs={keyNpcs}
              importantLocations={importantLocations}
              unresolvedThreads={unresolvedThreads}
              onOpenWorldEntity={openWorldEntity}
            />
            <QuickActionsCard
              isDM={isDM}
              appState={appState}
              onOpenWorld={() => onTabChange('world')}
              onCreateEntity={() => {
                requestWorldCreate({
                  title: 'Create world entity',
                  subtitle: 'Start something new from overview and drop straight into the world flow.',
                });
                onTabChange('world');
              }}
              onOpenSessions={() => onTabChange('sessions')}
              onOpenNotes={() => onTabChange('notes')}
              onStartSession={onStartSession}
            />
          </div>

          <RecentActivityCard items={recentActivity} />
        </div>
      </div>
    </div>
  );
}

function CampaignStatusCard({
  campaign,
  appState,
  currentSession,
  nextSession,
  statusStats,
}: {
  campaign: Campaign;
  appState: AppState;
  currentSession: Session | null;
  nextSession: Session | null;
  statusStats: Array<{ label: string; value: number }>;
}) {
  return (
    <section className="rounded-2xl border border-[hsla(32,26%,26%,0.42)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.97),hsla(24,14%,11%,0.99))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            Campaign Control Room
          </p>
          <h2
            className="mt-1 text-[22px] text-[hsl(35,24%,92%)]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {campaign.name}
          </h2>
          <p className="mt-2 max-w-[620px] text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">
            {campaign.description?.trim() || 'Campaign summary and launch point for the current prep stage.'}
          </p>
        </div>
        <div className="rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
            Current stage
          </p>
          <p className="mt-1 text-[13px] text-[hsl(38,82%,63%)]">
            {formatStageLabel(appState)}
          </p>
          <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">
            {startCase(campaign.system)} system
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <SummaryBlock
          title={currentSession ? 'Current session' : 'Next session'}
          value={
            currentSession
              ? `Session ${currentSession.sessionNumber}${currentSession.title ? ` — ${currentSession.title}` : ''}`
              : nextSession
                ? `Session ${nextSession.sessionNumber}${nextSession.title ? ` — ${nextSession.title}` : ''}`
                : 'No session scheduled yet'
          }
          detail={
            currentSession
              ? 'Currently in motion'
              : nextSession
                ? formatSessionMeta(nextSession)
                : 'Create or schedule one from Session Plans'
          }
        />
        <SummaryBlock
          title="Campaign rhythm"
          value={campaign.sessionFrequency || 'Not set'}
          detail={
            campaign.lastSessionDate
              ? `Last session ${formatRelativeDate(campaign.lastSessionDate)}`
              : 'No session history yet'
          }
        />
        <div className="flex flex-wrap gap-2">
          {statusStats.map((stat) => (
            <div
              key={stat.label}
              className="min-w-[92px] rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2"
            >
              <p className="text-[16px] text-[hsl(35,24%,92%)]">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActiveThreadsCard({
  activeQuests,
  keyNpcs,
  importantLocations,
  unresolvedThreads,
  onOpenWorldEntity,
}: {
  activeQuests: WorldEntity[];
  keyNpcs: WorldEntity[];
  importantLocations: WorldEntity[];
  unresolvedThreads: string[];
  onOpenWorldEntity: (entityId: string) => void;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,15%,11%,0.9)] p-4">
      <SectionHeader
        icon={Sparkles}
        title="Active Threads"
        description="The campaign elements currently in motion, so you can orient quickly before diving deeper."
      />

      <div className="space-y-4">
        <EntityGroup
          title="Active quests"
          empty="No active quests right now."
          items={activeQuests}
          onOpenWorldEntity={onOpenWorldEntity}
        />
        <EntityGroup
          title="Key NPCs"
          empty="No standout NPC activity yet."
          items={keyNpcs}
          onOpenWorldEntity={onOpenWorldEntity}
        />
        <EntityGroup
          title="Important locations"
          empty="No high-signal locations yet."
          items={importantLocations}
          onOpenWorldEntity={onOpenWorldEntity}
        />

        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
            Unresolved threads
          </p>
          {unresolvedThreads.length ? (
            <ul className="mt-2 space-y-1.5">
              {unresolvedThreads.map((thread) => (
                <li key={thread} className="flex gap-2 text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(38,82%,63%)]" />
                  <span>{thread}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[12px] text-[hsl(30,12%,58%)]">
              No unresolved hooks have been captured yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function RecentActivityCard({
  items,
}: {
  items: Array<{
    key: string;
    label: string;
    meta: string;
    note: string;
    icon: typeof BookOpen;
    onClick: () => void;
  }>;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,15%,11%,0.9)] p-4">
      <SectionHeader
        icon={Clock3}
        title="Recent Activity"
        description="A quick sense of movement across sessions and campaign material, so the world feels current."
      />

      <div className="space-y-2">
        {items.length ? (
          items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                className="group flex w-full items-start gap-3 rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.74)] px-3.5 py-3 text-left transition-colors hover:bg-[hsl(24,20%,15%)]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsla(38,70%,46%,0.1)] text-[hsl(38,82%,63%)]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-[hsl(35,24%,92%)]">{item.label}</p>
                  <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">{item.meta}</p>
                  <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">
                    {item.note}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            );
          })
        ) : (
          <p className="text-[12px] text-[hsl(30,12%,58%)]">
            No recent campaign movement yet.
          </p>
        )}
      </div>
    </section>
  );
}

function QuickActionsCard({
  isDM,
  appState,
  onOpenWorld,
  onCreateEntity,
  onOpenSessions,
  onOpenNotes,
  onStartSession,
}: {
  isDM: boolean;
  appState: AppState;
  onOpenWorld: () => void;
  onCreateEntity: () => void;
  onOpenSessions: () => void;
  onOpenNotes: () => void;
  onStartSession: () => void;
}) {
  const actions = [
    { key: 'world', label: 'Open World', detail: 'Browse regions, entities, and relationships.', icon: Globe, onClick: onOpenWorld },
    { key: 'create', label: 'Create Entity', detail: 'Capture a new NPC, place, quest, or lore hook.', icon: Plus, onClick: onCreateEntity },
    { key: 'sessions', label: 'Open Sessions', detail: 'Review plans, recaps, and campaign memory.', icon: BookOpen, onClick: onOpenSessions },
    { key: 'notes', label: 'Open Notes', detail: 'Jump into lore and campaign notes.', icon: ScrollText, onClick: onOpenNotes },
  ];

  if (isDM && appState === 'prep') {
    actions.push({
      key: 'start',
      label: 'Start Session',
      detail: 'Move from prep into live play when you are ready.',
      icon: Play,
      onClick: onStartSession,
    });
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,15%,11%,0.9)] p-4">
      <SectionHeader
        icon={Compass}
        title="Quick Actions"
        description="High-value jump points for the next thing a GM usually needs to do."
      />

      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              className="group flex w-full items-center gap-3 rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.74)] px-3.5 py-3 text-left transition-colors hover:bg-[hsl(24,20%,15%)]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsla(38,70%,46%,0.1)] text-[hsl(38,82%,63%)]">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-[hsl(35,24%,92%)]">{action.label}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
                  {action.detail}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EntityGroup({
  title,
  empty,
  items,
  onOpenWorldEntity,
}: {
  title: string;
  empty: string;
  items: WorldEntity[];
  onOpenWorldEntity: (entityId: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
        {title}
      </p>
      {items.length ? (
        <div className="mt-2 space-y-1.5">
          {items.map((entity) => {
            const Icon = ENTITY_TYPE_CONFIG[entity.type].icon;
            return (
              <button
                key={entity._id}
                type="button"
                onClick={() => onOpenWorldEntity(entity._id)}
                className="group flex w-full items-center gap-2.5 rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2 text-left transition-colors hover:bg-[hsl(24,20%,15%)]"
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
                  style={{
                    backgroundColor: `${ENTITY_TYPE_CONFIG[entity.type].color}15`,
                    color: ENTITY_TYPE_CONFIG[entity.type].color,
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] text-[hsl(35,24%,92%)]">{entity.name}</p>
                  <p className="truncate text-[11px] text-[hsl(30,12%,58%)]">
                    {formatWorldEntityContext(entity)}
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-[hsl(30,12%,58%)]">{empty}</p>
      )}
    </div>
  );
}

function SummaryBlock({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.74)] px-3.5 py-3">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
        {title}
      </p>
      <p className="mt-1 text-[13px] text-[hsl(35,24%,92%)]">{value}</p>
      <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">{detail}</p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[hsl(38,82%,63%)]" />
        <h3
          className="text-[14px] text-[hsl(38,36%,82%)]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {title}
        </h3>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
        {description}
      </p>
    </div>
  );
}

function formatStageLabel(appState: AppState) {
  switch (appState) {
    case 'prep':
      return 'Prep';
    case 'narrative':
      return 'Live Narrative';
    case 'combat':
      return 'Combat';
    case 'recap':
      return 'Recap';
    default:
      return startCase(appState);
  }
}

function formatSessionMeta(session: Session) {
  const date = session.scheduledDate || session.startedAt || session.completedAt || session.updatedAt;
  return `${startCase(session.status)}${date ? ` · ${formatDisplayDate(date)}` : ''}`;
}

function extractSessionSnippet(session: Session) {
  return session.summary?.trim()
    || session.aiSummary?.summary?.trim()
    || session.aiRecap?.trim()
    || (session.statistics.keyMoments[0] ?? 'Session activity captured here.');
}

function getSessionTime(session: Session) {
  const candidate = session.completedAt || session.startedAt || session.scheduledDate || session.updatedAt || session.createdAt;
  return candidate ? new Date(candidate).getTime() : 0;
}

function getEntityTime(entity: WorldEntity) {
  return new Date(entity.updatedAt || entity.createdAt).getTime();
}

function getEntityWeight(entity: WorldEntity) {
  return (entity.relatedEntities?.length ?? 0)
    + (entity.tags?.length ?? 0)
    + (entity.discoveredByParty ? 2 : 0)
    + (entity.description ? 1 : 0);
}

function isQuestActive(status?: string) {
  if (!status) return true;
  const normalized = status.trim().toLowerCase();
  return !['completed', 'failed', 'resolved', 'cancelled'].includes(normalized);
}

function isEntityRelevant(entity: WorldEntity) {
  return (entity.relatedEntities?.length ?? 0) > 0 || entity.discoveredByParty || Boolean(entity.description?.trim());
}

function isLocationRelevant(entity: WorldEntity) {
  return isEntityRelevant(entity) || Boolean(entity.locationType);
}

function formatDisplayDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unknown';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDisplayDate(value);
}
