import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useCreateSession, useSessions, useUpdateSession } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type {
  CreateSessionRequest,
  Session,
  SessionScene,
  UpdateSessionRequest,
  WorldEntity,
} from '@/types/campaign';
import { useWorldExplorerContext } from '../world/useWorldExplorerContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SessionPlanStatus =
  | 'draft'
  | 'scheduled'
  | 'ready'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type SessionFilter = 'all' | 'planned' | 'played';

export const UPCOMING_STATUSES: SessionPlanStatus[] = [
  'ready',
  'scheduled',
  'planned',
  'draft',
  'in_progress',
];

export const STATUS_OPTIONS: Array<{ value: SessionPlanStatus; label: string; hint: string }> = [
  { value: 'draft', label: 'Draft', hint: 'Early idea that still needs shaping.' },
  {
    value: 'scheduled',
    label: 'Scheduled',
    hint: 'Date is on the calendar, prep is still forming.',
  },
  { value: 'ready', label: 'Ready', hint: 'Scheduled and mostly prepped.' },
  { value: 'in_progress', label: 'Live', hint: 'Currently being played.' },
  {
    value: 'completed',
    label: 'Completed',
    hint: 'Already played and archived into campaign memory.',
  },
  { value: 'cancelled', label: 'Cancelled', hint: 'Set aside or no longer happening.' },
];

export const STATUS_STYLES: Record<SessionPlanStatus, string> = {
  draft: 'border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]',
  scheduled:
    'border-[hsla(210,52%,45%,0.32)] bg-[hsla(210,52%,45%,0.12)] text-[hsl(205,80%,72%)]',
  ready: 'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]',
  planned: 'border-[hsla(210,52%,45%,0.32)] bg-[hsla(210,52%,45%,0.12)] text-[hsl(205,80%,72%)]',
  in_progress:
    'border-[hsla(38,70%,52%,0.32)] bg-[hsla(38,70%,46%,0.12)] text-[hsl(38,82%,63%)]',
  completed:
    'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]',
  cancelled: 'border-[hsla(0,0%,40%,0.28)] bg-[hsla(0,0%,40%,0.1)] text-[hsl(30,8%,58%)]',
};

// ── Editor state ──────────────────────────────────────────────────────────────

export type SessionEditorState = {
  title: string;
  summary: string;
  notes: string;
  date: string;
  time: string;
  durationMinutes: number;
  status: SessionPlanStatus;
  npcIds: string[];
  locationIds: string[];
  questIds: string[];
  scenes: SessionScene[];
};

export function getEmptyCreateDraft(sessionNumber = 1): SessionEditorState {
  return {
    title: `Session ${sessionNumber}`,
    summary: '',
    notes: '',
    date: '',
    time: '',
    durationMinutes: 180,
    status: 'draft',
    npcIds: [],
    locationIds: [],
    questIds: [],
    scenes: [],
  };
}

export function getEditorStateFromSession(session: Session): SessionEditorState {
  const { date, time } = splitScheduledDate(session.scheduledDate);
  return {
    title: session.title ?? `Session ${session.sessionNumber}`,
    summary: session.summary ?? '',
    notes: session.notes ?? '',
    date,
    time,
    durationMinutes: session.durationMinutes || 0,
    status: normalizePlanStatus(session.status),
    npcIds: session.npcIds ?? [],
    locationIds: session.locationIds ?? [],
    questIds: session.questIds ?? [],
    scenes: session.scenes ?? [],
  };
}

export function buildSessionPayload(input: {
  campaignId: string;
  sessionNumber: number;
  title: string;
  summary: string;
  notes: string;
  status: SessionPlanStatus;
  date: string;
  time: string;
  durationMinutes: number;
}): CreateSessionRequest {
  return {
    campaignId: input.campaignId,
    sessionNumber: input.sessionNumber,
    title: input.title,
    summary: input.summary.trim() || undefined,
    notes: input.notes.trim() || undefined,
    scheduledDate: combineDateAndTime(input.date, input.time),
    status: input.status,
    durationMinutes: input.durationMinutes || undefined,
    npcIds: [],
    locationIds: [],
    questIds: [],
    scenes: [],
  };
}

export function buildUpdatePayload(editor: SessionEditorState): UpdateSessionRequest {
  return {
    title: editor.title.trim() || undefined,
    summary: editor.summary.trim() || undefined,
    notes: editor.notes.trim() || undefined,
    scheduledDate: combineDateAndTime(editor.date, editor.time),
    durationMinutes: editor.durationMinutes || 0,
    status: editor.status,
    npcIds: editor.npcIds,
    locationIds: editor.locationIds,
    questIds: editor.questIds,
    scenes: editor.scenes,
  };
}

export function normalizePlanStatus(status: Session['status']): SessionPlanStatus {
  return status === 'planned' ? 'scheduled' : status;
}

export function getStatusLabel(status: SessionPlanStatus) {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'scheduled':
    case 'planned':
      return 'Scheduled';
    case 'ready':
      return 'Ready';
    case 'in_progress':
      return 'Live';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return String(status);
  }
}

export function isUpcomingStatus(status: Session['status']) {
  return UPCOMING_STATUSES.includes(normalizePlanStatus(status));
}

export function compareSessionsForPlanView(a: Session, b: Session) {
  const aUpcoming = isUpcomingStatus(a.status);
  const bUpcoming = isUpcomingStatus(b.status);
  if (aUpcoming && !bUpcoming) return -1;
  if (!aUpcoming && bUpcoming) return 1;

  const aTime = getSessionSortTime(a);
  const bTime = getSessionSortTime(b);
  if (aUpcoming) return aTime - bTime || a.sessionNumber - b.sessionNumber;
  return bTime - aTime || b.sessionNumber - a.sessionNumber;
}

export function getSessionSortTime(session: Session) {
  const candidate =
    session.scheduledDate ||
    session.startedAt ||
    session.completedAt ||
    session.updatedAt ||
    session.createdAt;
  return candidate ? new Date(candidate).getTime() : 0;
}

export function formatSessionIdentity(session: Session) {
  return session.title?.trim() || `Session ${session.sessionNumber}`;
}

export function formatScheduleLine(session: Session) {
  if (!session.scheduledDate) return 'Not scheduled yet';
  const date = new Date(session.scheduledDate);
  if (Number.isNaN(date.getTime())) return 'Schedule unavailable';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function extractPremise(session: Session) {
  return (
    session.summary?.trim() ||
    session.aiSummary?.summary?.trim() ||
    session.notes?.trim() ||
    'No premise written yet. Capture the likely conflict, scene, or promise of play here.'
  );
}

export function buildSessionWorldLinks(session: Session, worldEntities: WorldEntity[]) {
  const explicitNpcs = resolveEntitiesByIds(session.npcIds, worldEntities);
  const explicitLocations = resolveEntitiesByIds(session.locationIds, worldEntities);
  const explicitQuests = resolveEntitiesByIds(session.questIds, worldEntities);

  const content = [
    formatSessionIdentity(session),
    session.summary ?? '',
    session.notes ?? '',
    session.aiRecap ?? '',
    session.aiSummary?.summary ?? '',
    ...(session.aiSummary?.keyEvents ?? []),
    ...(session.aiSummary?.unresolvedHooks ?? []),
    ...(session.statistics.keyMoments ?? []),
    ...(session.statistics.npcsIntroduced ?? []),
    ...(session.statistics.questsAdvanced ?? []),
  ]
    .join(' ')
    .toLowerCase();

  const npcs = dedupeEntities(
    explicitNpcs.length
      ? explicitNpcs
      : worldEntities.filter(
          (entity) =>
            (entity.type === 'npc' || entity.type === 'npc_minor') &&
            (session.statistics.npcsIntroduced.includes(entity.name) ||
              content.includes(entity.name.toLowerCase())),
        ),
  ).slice(0, 6);

  const quests = dedupeEntities(
    explicitQuests.length
      ? explicitQuests
      : worldEntities.filter(
          (entity) =>
            entity.type === 'quest' &&
            (session.statistics.questsAdvanced.includes(entity.name) ||
              content.includes(entity.name.toLowerCase())),
        ),
  ).slice(0, 6);

  const locations = dedupeEntities(
    explicitLocations.length
      ? explicitLocations
      : worldEntities.filter(
          (entity) =>
            (entity.type === 'location' || entity.type === 'location_detail') &&
            content.includes(entity.name.toLowerCase()),
        ),
  ).slice(0, 6);

  return { npcs, quests, locations };
}

export function summarizeLinkedWorld(links: {
  npcs: WorldEntity[];
  quests: WorldEntity[];
  locations: WorldEntity[];
}) {
  const parts = [];
  if (links.quests.length)
    parts.push(`${links.quests.length} quest${links.quests.length === 1 ? '' : 's'}`);
  if (links.npcs.length)
    parts.push(`${links.npcs.length} NPC${links.npcs.length === 1 ? '' : 's'}`);
  if (links.locations.length)
    parts.push(`${links.locations.length} location${links.locations.length === 1 ? '' : 's'}`);
  return parts.join(' · ') || 'No campaign links yet';
}

export function extractBulletLikeLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter((line) => line.length > 12);
}

export function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

export function buildSessionSceneOutline(session: Session, worldEntities: WorldEntity[]) {
  if (session.scenes?.length) {
    return session.scenes.map((scene) => {
      const location = scene.locationId
        ? worldEntities.find((entity) => entity._id === scene.locationId)
        : undefined;
      return {
        ...scene,
        title: location ? `${scene.title} — ${location.name}` : scene.title,
      };
    });
  }

  return dedupeStrings([
    ...extractBulletLikeLines(session.summary ?? ''),
    ...extractBulletLikeLines(session.notes ?? ''),
    ...(session.aiSummary?.keyEvents ?? []),
    ...(session.statistics.keyMoments ?? []),
  ])
    .slice(0, 4)
    .map((item, index) => ({
      id: `fallback-${index + 1}`,
      title: getSceneTitle(item, index),
      description: item,
    }));
}

export function getSceneTitle(detail: string, index: number) {
  const cleaned = detail.replace(/^Scene\s+\d+\s*[-:]\s*/i, '').trim();
  const words = cleaned.split(/\s+/).slice(0, 5).join(' ');
  return `Scene ${index + 1} — ${words}${cleaned.split(/\s+/).length > 5 ? '…' : ''}`;
}

export function buildCarryoverNotes(priorSession: Session | null) {
  if (!priorSession) return [];
  return dedupeStrings([
    priorSession.aiSummary?.summary ?? '',
    ...(priorSession.statistics.keyMoments ?? []),
    ...(priorSession.aiSummary?.unresolvedHooks ?? []),
  ]).slice(0, 3);
}

export function buildMissingPrepNote(
  session: Pick<Session, 'summary' | 'notes' | 'scheduledDate' | 'status'>,
  links: { npcs: WorldEntity[]; quests: WorldEntity[]; locations: WorldEntity[] },
  sceneCount: number,
) {
  const missing: string[] = [];
  if (!session.scheduledDate) missing.push('a schedule');
  if (!session.summary?.trim()) missing.push('a premise');
  if (!sceneCount) missing.push('scenes');
  if (!session.notes?.trim()) missing.push('prep notes');
  if (!links.npcs.length && !links.locations.length && !links.quests.length)
    missing.push('linked threads');
  if (!missing.length) return null;
  return `Still missing ${formatList(missing)}.`;
}

export function pickLinkedFields(editor: SessionEditorState) {
  return {
    npcIds: editor.npcIds,
    locationIds: editor.locationIds,
    questIds: editor.questIds,
    scenes: editor.scenes,
  };
}

export function findPriorSession(session: Session, sessions: Session[]) {
  const ordered = [...sessions].sort(
    (a, b) => getSessionSortTime(b) - getSessionSortTime(a) || b.sessionNumber - a.sessionNumber,
  );
  const currentIndex = ordered.findIndex((candidate) => candidate._id === session._id);
  if (currentIndex === -1) return null;
  return (
    ordered
      .slice(currentIndex + 1)
      .find((candidate) => candidate.sessionNumber < session.sessionNumber) ?? null
  );
}

export function dedupeEntities(entities: WorldEntity[]) {
  const seen = new Set<string>();
  return entities.filter((entity) => {
    if (seen.has(entity._id)) return false;
    seen.add(entity._id);
    return true;
  });
}

export function resolveEntitiesByIds(ids: string[] | undefined, worldEntities: WorldEntity[]) {
  if (!ids?.length) return [];
  return ids
    .map((id) => worldEntities.find((entity) => entity._id === id))
    .filter((entity): entity is WorldEntity => Boolean(entity));
}

export function createSceneDraft(sceneNumber: number): SessionScene {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `scene-${Date.now()}-${sceneNumber}`,
    title: `Scene ${sceneNumber}`,
    description: '',
    npcIds: [],
  };
}

export function updateScene(scenes: SessionScene[], sceneId: string, patch: Partial<SessionScene>) {
  return scenes.map((scene) => (scene.id === sceneId ? { ...scene, ...patch } : scene));
}

export function formatList(items: string[]) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

export function splitScheduledDate(value?: string) {
  if (!value) return { date: '', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

export function combineDateAndTime(date: string, time: string) {
  if (!date) return undefined;
  return new Date(`${date}T${time || '19:00'}`).toISOString();
}

export function formatDuration(minutes: number) {
  if (!minutes) return 'Duration not set';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

// ── Context value ─────────────────────────────────────────────────────────────

interface SessionsContextValue {
  campaignId: string;
  onOpenWorldEntity: (entityId: string) => void;

  sessions: Session[];
  isLoading: boolean;
  worldEntities: WorldEntity[];

  sortedSessions: Session[];
  filteredSessions: Session[];
  nextSession: Session | null;
  nextSessionNumber: number;
  selectedSession: Session | null;
  priorSession: Session | null;

  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;

  activeFilter: SessionFilter;
  setActiveFilter: (filter: SessionFilter) => void;

  isCreating: boolean;
  setIsCreating: (value: boolean) => void;
  createDraft: SessionEditorState;
  setCreateDraft: (value: SessionEditorState) => void;

  createSession: ReturnType<typeof useCreateSession>;
  updateSession: ReturnType<typeof useUpdateSession>;

  handleCreateSession: () => Promise<void>;
  handleUpdateSession: (sessionId: string, data: UpdateSessionRequest) => Promise<void>;
  openWorldEntity: (entityId: string) => void;
}

const SessionsContext = createContext<SessionsContextValue | null>(null);

export function useSessionsContext() {
  const ctx = useContext(SessionsContext);
  if (!ctx) throw new Error('useSessionsContext must be used within SessionsProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function SessionsProvider({
  campaignId,
  onOpenWorldEntity,
  children,
}: {
  campaignId: string;
  onOpenWorldEntity: (entityId: string) => void;
  children: ReactNode;
}) {
  const { data: sessionsData, isLoading } = useSessions(campaignId);
  const { data: worldEntitiesData } = useWorldEntities(campaignId);
  const {
    requestEntityNavigation,
    pendingSessionNavigationId,
    requestSessionNavigation,
    setActiveSessionId: setBrainSessionId,
    setActiveEntityId,
    setActiveView,
  } = useWorldExplorerContext();

  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SessionFilter>('all');
  const [createDraft, setCreateDraft] = useState<SessionEditorState>(() =>
    getEmptyCreateDraft(1),
  );

  const sessions = useMemo(() => sessionsData ?? [], [sessionsData]);
  const worldEntities = useMemo(() => worldEntitiesData ?? [], [worldEntitiesData]);

  const sortedSessions = useMemo(
    () => [...sessions].sort(compareSessionsForPlanView),
    [sessions],
  );

  const nextSessionNumber = useMemo(
    () => Math.max(...sortedSessions.map((s) => s.sessionNumber), 0) + 1,
    [sortedSessions],
  );

  const nextSession = useMemo(
    () => sortedSessions.find((s) => isUpcomingStatus(s.status)) ?? null,
    [sortedSessions],
  );

  const selectedSession = useMemo(
    () => sortedSessions.find((s) => s._id === selectedSessionId) ?? nextSession ?? null,
    [nextSession, selectedSessionId, sortedSessions],
  );

  const priorSession = useMemo(
    () => (selectedSession ? findPriorSession(selectedSession, sortedSessions) : null),
    [selectedSession, sortedSessions],
  );

  const filteredSessions = useMemo(() => {
    if (activeFilter === 'planned')
      return sortedSessions.filter((s) => isUpcomingStatus(s.status));
    if (activeFilter === 'played')
      return sortedSessions.filter((s) => !isUpcomingStatus(s.status));
    return sortedSessions;
  }, [activeFilter, sortedSessions]);

  // Sync world-explorer brain with selected session
  useEffect(() => {
    setActiveEntityId(null);
    setActiveView(null);
    setBrainSessionId(selectedSession?._id ?? null);
    return () => {
      setBrainSessionId(null);
    };
  }, [selectedSession?._id, setActiveEntityId, setActiveView, setBrainSessionId]);

  // Handle external session navigation requests
  useEffect(() => {
    if (!pendingSessionNavigationId) return;
    setSelectedSessionId(pendingSessionNavigationId);
    requestSessionNavigation(null);
  }, [pendingSessionNavigationId, requestSessionNavigation]);

  async function handleCreateSession() {
    const payload = buildSessionPayload({
      campaignId,
      sessionNumber: nextSessionNumber,
      title: createDraft.title.trim() || `Session ${nextSessionNumber}`,
      summary: createDraft.summary,
      notes: createDraft.notes,
      status: createDraft.status,
      date: createDraft.date,
      time: createDraft.time,
      durationMinutes: createDraft.durationMinutes,
    });

    try {
      const created = await createSession.mutateAsync(payload);
      const { toast } = await import('sonner');
      toast.success(`Session ${created.sessionNumber} planned`);
      setIsCreating(false);
      setCreateDraft(getEmptyCreateDraft(created.sessionNumber + 1));
      setSelectedSessionId(created._id);
    } catch (error) {
      const { toast } = await import('sonner');
      toast.error(error instanceof Error ? error.message : 'Failed to create session plan');
    }
  }

  async function handleUpdateSession(sessionId: string, data: UpdateSessionRequest) {
    try {
      await updateSession.mutateAsync({ campaignId, id: sessionId, data });
      const { toast } = await import('sonner');
      toast.success('Session plan updated');
    } catch (error) {
      const { toast } = await import('sonner');
      toast.error(error instanceof Error ? error.message : 'Failed to update session plan');
    }
  }

  function openWorldEntity(entityId: string) {
    requestEntityNavigation(entityId);
    onOpenWorldEntity(entityId);
  }

  const value: SessionsContextValue = {
    campaignId,
    onOpenWorldEntity,
    sessions,
    isLoading,
    worldEntities,
    sortedSessions,
    filteredSessions,
    nextSession,
    nextSessionNumber,
    selectedSession,
    priorSession,
    selectedSessionId,
    setSelectedSessionId,
    activeFilter,
    setActiveFilter,
    isCreating,
    setIsCreating,
    createDraft,
    setCreateDraft,
    createSession,
    updateSession,
    handleCreateSession,
    handleUpdateSession,
    openWorldEntity,
  };

  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>;
}
