import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import { useCampaign, useArcs, useTrackers } from '@/hooks/useCampaigns';
import { useSessions } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import { useWorldExplorerContext } from '../world/useWorldExplorerContext';
import { ENTITY_TYPE_CONFIG } from '../world/world-config';
import { formatWorldEntityContext, startCase } from '../world/world-ui';
import type { Campaign, CampaignArc, Session, WorldEntity } from '@/types/campaign';
import type { AppState } from '@/types/workspace';
import { extractSessionMoment } from '@/lib/session-utils';

// ── Context value ─────────────────────────────────────────────────────────────

interface StatusStat {
  label: string;
  value: number;
}

interface RecentActivityItem {
  key: string;
  label: string;
  meta: string;
  note: string;
  icon: typeof BookOpen;
  onClick: () => void;
}

interface OverviewContextValue {
  campaignId: string;
  appState: AppState;
  isDM: boolean;
  onTabChange: (tab: string) => void;
  onStartSession: () => void;

  // Data
  campaign: Campaign | null;
  isLoading: boolean;
  sortedSessions: Session[];
  worldEntities: WorldEntity[];
  activeArcs: CampaignArc[];
  activeQuests: WorldEntity[];
  keyNpcs: WorldEntity[];
  importantLocations: WorldEntity[];
  unresolvedThreads: string[];
  escalatingTrackerCount: number;

  // Computed
  statusStats: StatusStat[];
  recentActivity: RecentActivityItem[];

  // Actions
  openWorldEntity: (entityId: string) => void;
  requestWorldCreate: (opts: { title: string; subtitle: string }) => void;
}

const OverviewContext = createContext<OverviewContextValue | null>(null);

export function useOverviewContext() {
  const ctx = useContext(OverviewContext);
  if (!ctx) throw new Error('useOverviewContext must be used within OverviewProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface OverviewProviderProps {
  campaignId: string;
  appState: AppState;
  isDM: boolean;
  onTabChange: (tab: string) => void;
  onStartSession: () => void;
  children: ReactNode;
}

export function OverviewProvider({
  campaignId,
  appState,
  isDM,
  onTabChange,
  onStartSession,
  children,
}: OverviewProviderProps) {
  const { data: campaignData } = useCampaign(campaignId);
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions(campaignId);
  const { data: worldEntitiesData, isLoading: entitiesLoading } = useWorldEntities(campaignId);
  const { data: arcsData } = useArcs(campaignId);
  const { data: trackersData } = useTrackers(campaignId);
  const { requestEntityNavigation, requestWorldCreate } = useWorldExplorerContext();
  const [now] = useState(() => Date.now());

  const campaign = campaignData ?? null;
  const isLoading = sessionsLoading || entitiesLoading;

  const sortedSessions = useMemo(
    () => [...(sessionsData ?? [])].sort((a, b) => getSessionTime(b) - getSessionTime(a)),
    [sessionsData],
  );

  const allEntities = useMemo(() => worldEntitiesData ?? [], [worldEntitiesData]);

  const activeQuests = useMemo(
    () =>
      allEntities
        .filter((entity) => entity.type === 'quest' && isQuestActive(entity.questStatus))
        .sort((a, b) => getEntityTime(b) - getEntityTime(a))
        .slice(0, 3),
    [allEntities],
  );

  const keyNpcs = useMemo(
    () =>
      allEntities
        .filter((entity) => (entity.type === 'npc' || entity.type === 'npc_minor') && isEntityRelevant(entity))
        .sort((a, b) => getEntityWeight(b) - getEntityWeight(a))
        .slice(0, 3),
    [allEntities],
  );

  const importantLocations = useMemo(
    () =>
      allEntities
        .filter((entity) => (entity.type === 'location' || entity.type === 'location_detail') && isLocationRelevant(entity))
        .sort((a, b) => getEntityWeight(b) - getEntityWeight(a))
        .slice(0, 3),
    [allEntities],
  );

  const activeArcs = useMemo(
    () =>
      (arcsData ?? [])
        .filter((a) => a.status === 'active' || a.status === 'advancing' || a.status === 'threatened')
        .slice(0, 3),
    [arcsData],
  );

  const escalatingTrackerCount = useMemo(() => {
    return (trackersData ?? []).filter((t) => {
      const total = Math.max(1, t.max - t.min);
      const percent = Math.max(0, Math.min(100, ((t.value - t.min) / total) * 100));
      return percent >= 70 && t.value < t.max;
    }).length;
  }, [trackersData]);

  const unresolvedThreads = useMemo(() => {
    const hooks = sortedSessions.flatMap((session) => session.aiSummary?.unresolvedHooks ?? []);
    const fromHooks = Array.from(new Set(hooks.filter(Boolean))).slice(0, 3);
    if (fromHooks.length) return fromHooks;
    const fromArcs = activeArcs.map((arc) => arc.name).slice(0, 3);
    if (fromArcs.length) return fromArcs;
    return (trackersData ?? [])
      .filter((t) => {
        const total = Math.max(1, t.max - t.min);
        const percent = Math.max(0, Math.min(100, ((t.value - t.min) / total) * 100));
        return percent >= 70 && t.value < t.max;
      })
      .map((t) => t.name)
      .slice(0, 3);
  }, [sortedSessions, activeArcs, trackersData]);

  const statusStats = useMemo<StatusStat[]>(() => {
    const totalEntities = allEntities.length;
    const recentSessionCount = sortedSessions.filter(
      (session) => getSessionTime(session) > now - 1000 * 60 * 60 * 24 * 60,
    ).length;
    return [
      { label: 'world entities', value: totalEntities },
      { label: 'active quests', value: activeQuests.length },
      { label: 'recent sessions', value: recentSessionCount },
      { label: 'escalating', value: escalatingTrackerCount },
    ];
  }, [activeQuests.length, allEntities.length, escalatingTrackerCount, now, sortedSessions]);

  const openWorldEntity = useCallback(
    (entityId: string) => {
      requestEntityNavigation(entityId);
      onTabChange('world');
    },
    [onTabChange, requestEntityNavigation],
  );

  const recentActivity = useMemo<RecentActivityItem[]>(() => {
    const recentSessions = sortedSessions.slice(0, 2).map((session) => ({
      key: `session-${session._id}`,
      label: `Session ${session.sessionNumber}${session.title ? ` \u2014 ${session.title}` : ''}`,
      meta: formatSessionMeta(session),
      note: extractSessionMoment(session),
      icon: BookOpen,
      onClick: () => onTabChange('sessions'),
    }));

    const recentEntities = [...allEntities]
      .sort((a, b) => getEntityTime(b) - getEntityTime(a))
      .slice(0, 3)
      .map((entity) => ({
        key: `entity-${entity._id}`,
        label: entity.name,
        meta: `Updated ${formatRelativeDate(entity.updatedAt)} \u00b7 ${formatWorldEntityContext(entity)}`,
        note: entity.description?.trim() || 'Recently added to the campaign world.',
        icon: ENTITY_TYPE_CONFIG[entity.type].icon,
        onClick: () => openWorldEntity(entity._id),
      }));

    return [...recentSessions, ...recentEntities].slice(0, 4);
  }, [allEntities, onTabChange, openWorldEntity, sortedSessions]);

  const value: OverviewContextValue = {
    campaignId,
    appState,
    isDM,
    onTabChange,
    onStartSession,
    campaign,
    isLoading,
    sortedSessions,
    worldEntities: allEntities,
    activeArcs,
    activeQuests,
    keyNpcs,
    importantLocations,
    unresolvedThreads,
    escalatingTrackerCount,
    statusStats,
    recentActivity,
    openWorldEntity,
    requestWorldCreate,
  };

  return <OverviewContext.Provider value={value}>{children}</OverviewContext.Provider>;
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function getSessionTime(session: Session) {
  const candidate = session.completedAt || session.startedAt || session.scheduledDate || session.updatedAt || session.createdAt;
  return candidate ? new Date(candidate).getTime() : 0;
}

function getEntityTime(entity: WorldEntity) {
  return new Date(entity.updatedAt || entity.createdAt).getTime();
}

function getEntityWeight(entity: WorldEntity) {
  return (
    (entity.relatedEntities?.length ?? 0) +
    (entity.tags?.length ?? 0) +
    (entity.discoveredByParty ? 2 : 0) +
    (entity.description ? 1 : 0)
  );
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

function formatSessionMeta(session: Session) {
  const date = session.scheduledDate || session.startedAt || session.completedAt || session.updatedAt;
  return `${startCase(session.status)}${date ? ` \u00b7 ${formatDisplayDate(date)}` : ''}`;
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
