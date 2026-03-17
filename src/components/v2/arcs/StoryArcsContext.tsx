import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useArcs, useAddArc, useAddArcDevelopment, useUpdateArc, useRemoveArc } from '@/hooks/useCampaigns';
import { useNavigationBus } from '../NavigationBusContext';
import { useDowntimeActivities } from '@/hooks/useDowntime';
import { useEncounters } from '@/hooks/useEncounters';
import { useHandouts } from '@/hooks/useHandouts';
import { useSessions } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type {
  CampaignArc,
  ArcPressure,
  ArcStatus,
  ArcType,
  Handout,
  Session,
  WorldEntity,
} from '@/types/campaign';
import type { Encounter } from '@/types/encounter';
import type { DowntimeActivity } from '@/types/downtime';

// ── Label maps ────────────────────────────────────────────────────────────────

export const ARC_STATUS_LABELS: Record<ArcStatus, string> = {
  upcoming: 'Dormant',
  active: 'Active',
  completed: 'Resolved',
  advancing: 'Advancing',
  dormant: 'Dormant',
  threatened: 'Threatened',
  resolved: 'Resolved',
};

export const STATUS_GROUP_KEY: Record<ArcStatus, string> = {
  active: 'active',
  advancing: 'advancing',
  threatened: 'threatened',
  upcoming: 'inactive',
  dormant: 'inactive',
  completed: 'concluded',
  resolved: 'concluded',
};

export const STATUS_GROUP_LABEL: Record<string, string> = {
  active: 'Active',
  advancing: 'Advancing',
  threatened: 'Threatened',
  inactive: 'Dormant',
  concluded: 'Resolved',
};

export const ARC_TYPE_LABELS: Record<ArcType, string> = {
  main_plot: 'Main Plot',
  faction_conflict: 'Faction Conflict',
  mystery: 'Mystery',
  villain_scheme: 'Villain Scheme',
  character_arc: 'Character Arc',
  world_event: 'World Event',
  prophecy: 'Prophecy',
  custom: 'Custom',
};

export const ARC_PRESSURE_LABELS: Record<ArcPressure, string> = {
  quiet: 'Quiet',
  active: 'Active',
  escalating: 'Escalating',
};

// ── Editor state ──────────────────────────────────────────────────────────────

export interface ArcEditorState {
  name: string;
  description: string;
  status: ArcStatus;
  type: ArcType;
  pressure: ArcPressure;
  stakes: string;
  currentState: string;
  recentChange: string;
  nextDevelopment: string;
  links: {
    entityIds: string[];
    sessionIds: string[];
    encounterIds: string[];
    handoutIds: string[];
    downtimeIds: string[];
    trackerIds: string[];
  };
}

export function emptyEditor(): ArcEditorState {
  return {
    name: '',
    description: '',
    status: 'dormant',
    type: 'mystery',
    pressure: 'quiet',
    stakes: '',
    currentState: '',
    recentChange: '',
    nextDevelopment: '',
    links: {
      entityIds: [],
      sessionIds: [],
      encounterIds: [],
      handoutIds: [],
      downtimeIds: [],
      trackerIds: [],
    },
  };
}

export function arcToEditor(arc: CampaignArc): ArcEditorState {
  return {
    name: arc.name,
    description: arc.description ?? '',
    status: arc.status,
    type: arc.type ?? 'custom',
    pressure: arc.pressure ?? 'quiet',
    stakes: arc.stakes ?? '',
    currentState: arc.currentState ?? '',
    recentChange: arc.recentChange ?? '',
    nextDevelopment: arc.nextDevelopment ?? '',
    links: {
      entityIds: arc.links?.entityIds ?? [],
      sessionIds: arc.links?.sessionIds ?? [],
      encounterIds: arc.links?.encounterIds ?? [],
      handoutIds: arc.links?.handoutIds ?? [],
      downtimeIds: arc.links?.downtimeIds ?? [],
      trackerIds: arc.links?.trackerIds ?? [],
    },
  };
}

export function editorToPayload(editor: ArcEditorState) {
  return {
    name: editor.name.trim(),
    description: editor.description.trim(),
    status: editor.status,
    type: editor.type,
    pressure: editor.pressure,
    stakes: editor.stakes.trim(),
    currentState: editor.currentState.trim(),
    recentChange: editor.recentChange.trim(),
    nextDevelopment: editor.nextDevelopment.trim(),
    links: {
      entityIds: editor.links.entityIds,
      sessionIds: editor.links.sessionIds,
      encounterIds: editor.links.encounterIds,
      handoutIds: editor.links.handoutIds,
      downtimeIds: editor.links.downtimeIds,
      calendarEventIds: [],
      trackerIds: editor.links.trackerIds,
    },
  };
}

export function countLinks(arc: CampaignArc) {
  const links = arc.links;
  if (!links) return 0;
  return (
    (links.entityIds?.length ?? 0) +
    (links.sessionIds?.length ?? 0) +
    (links.encounterIds?.length ?? 0) +
    (links.handoutIds?.length ?? 0) +
    (links.downtimeIds?.length ?? 0) +
    (links.trackerIds?.length ?? 0)
  );
}

export function findSessionLabel(sessions: Session[], sessionId: string) {
  const session = sessions.find((item) => item._id === sessionId);
  if (!session) return 'Linked session';
  return `Session ${session.sessionNumber}${session.title ? ` — ${session.title}` : ''}`;
}

export function hasUnsavedChanges(editor: ArcEditorState, arc: CampaignArc): boolean {
  return (
    editor.name.trim() !== (arc.name ?? '').trim() ||
    editor.description.trim() !== (arc.description ?? '').trim() ||
    editor.stakes.trim() !== (arc.stakes ?? '').trim() ||
    editor.currentState.trim() !== (arc.currentState ?? '').trim() ||
    editor.recentChange.trim() !== (arc.recentChange ?? '').trim() ||
    editor.nextDevelopment.trim() !== (arc.nextDevelopment ?? '').trim()
  );
}

// ── Grouped arcs type ─────────────────────────────────────────────────────────

export interface ArcGroup {
  groupKey: string;
  label: string;
  items: CampaignArc[];
}

// ── Context value ─────────────────────────────────────────────────────────────

interface StoryArcsContextValue {
  campaignId: string;
  arcs: CampaignArc[];
  isLoading: boolean;
  sessions: Session[];
  entities: WorldEntity[];
  encounters: Encounter[];
  handouts: Handout[];
  downtime: DowntimeActivity[];

  selectedArcId: string | null;
  setSelectedArcId: (id: string | null) => void;
  isCreating: boolean;
  setIsCreating: (value: boolean) => void;

  selectedArc: CampaignArc | null;
  groupedArcs: ArcGroup[];

  editor: ArcEditorState;
  setEditor: (value: ArcEditorState) => void;
  developmentTitle: string;
  setDevelopmentTitle: (value: string) => void;
  developmentDescription: string;
  setDevelopmentDescription: (value: string) => void;
  developmentSessionId: string;
  setDevelopmentSessionId: (value: string) => void;
  developmentEntityIds: string[];
  setDevelopmentEntityIds: (value: string[]) => void;

  addArc: ReturnType<typeof useAddArc>;
  updateArc: ReturnType<typeof useUpdateArc>;
  addArcDevelopment: ReturnType<typeof useAddArcDevelopment>;
  removeArc: ReturnType<typeof useRemoveArc>;

  startCreate: () => void;
}

const StoryArcsContext = createContext<StoryArcsContextValue | null>(null);

export function useStoryArcsContext() {
  const ctx = useContext(StoryArcsContext);
  if (!ctx) throw new Error('useStoryArcsContext must be used within StoryArcsProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function StoryArcsProvider({ campaignId, children }: { campaignId: string; children: ReactNode }) {
  const { data: arcsData, isLoading } = useArcs(campaignId);
  const { data: sessionsData } = useSessions(campaignId);
  const { data: entitiesData } = useWorldEntities(campaignId);
  const { data: encountersData } = useEncounters(campaignId);
  const { data: handoutsData } = useHandouts(campaignId);
  const { data: downtimeData } = useDowntimeActivities(campaignId);

  const addArc = useAddArc();
  const updateArc = useUpdateArc();
  const addArcDevelopment = useAddArcDevelopment();
  const removeArc = useRemoveArc();

  const arcs = useMemo(() => arcsData ?? [], [arcsData]);
  const sessions = useMemo(() => sessionsData ?? [], [sessionsData]);
  const entities = useMemo(() => entitiesData ?? [], [entitiesData]);
  const encounters = useMemo(() => encountersData ?? [], [encountersData]);
  const handouts = useMemo(() => handoutsData ?? [], [handoutsData]);
  const downtime = useMemo(() => downtimeData ?? [], [downtimeData]);

  const [selectedArcId, setSelectedArcId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editor, setEditor] = useState<ArcEditorState>(() => emptyEditor());
  const [developmentTitle, setDevelopmentTitle] = useState('');
  const [developmentDescription, setDevelopmentDescription] = useState('');
  const [developmentSessionId, setDevelopmentSessionId] = useState('');
  const [developmentEntityIds, setDevelopmentEntityIds] = useState<string[]>([]);

  const selectedArc = useMemo(
    () => arcs.find((arc) => arc._id === selectedArcId) ?? null,
    [arcs, selectedArcId],
  );

  // Consume pending navigation from the bus
  const { pending: pendingNav, consumeNavigation } = useNavigationBus();
  useEffect(() => {
    const targetId = consumeNavigation('arcs');
    if (targetId) setSelectedArcId(targetId);
  }, [pendingNav, consumeNavigation]);

  // Auto-select first arc when none is selected
  useEffect(() => {
    if (isCreating) return;
    if (selectedArcId && arcs.some((arc) => arc._id === selectedArcId)) return;
    setSelectedArcId(arcs[0]?._id ?? null);
  }, [arcs, selectedArcId, isCreating]);

  // Sync editor when selected arc changes
  useEffect(() => {
    if (!selectedArc) return;
    setEditor(arcToEditor(selectedArc));
  }, [selectedArc]);

  const groupedArcs = useMemo<ArcGroup[]>(() => {
    const groups = new Map<string, CampaignArc[]>();
    for (const arc of arcs) {
      const groupKey = STATUS_GROUP_KEY[arc.status] ?? arc.status;
      const current = groups.get(groupKey) ?? [];
      current.push(arc);
      groups.set(groupKey, current);
    }
    return [...groups.entries()].map(([groupKey, items]) => ({
      groupKey,
      label: STATUS_GROUP_LABEL[groupKey] ?? groupKey,
      items: items.sort((left, right) => left.sortOrder - right.sortOrder),
    }));
  }, [arcs]);

  function startCreate() {
    setIsCreating(true);
    setSelectedArcId(null);
    setEditor(emptyEditor());
  }

  const value: StoryArcsContextValue = {
    campaignId,
    arcs,
    isLoading,
    sessions,
    entities,
    encounters,
    handouts,
    downtime,
    selectedArcId,
    setSelectedArcId,
    isCreating,
    setIsCreating,
    selectedArc,
    groupedArcs,
    editor,
    setEditor,
    developmentTitle,
    setDevelopmentTitle,
    developmentDescription,
    setDevelopmentDescription,
    developmentSessionId,
    setDevelopmentSessionId,
    developmentEntityIds,
    setDevelopmentEntityIds,
    addArc,
    updateArc,
    addArcDevelopment,
    removeArc,
    startCreate,
  };

  return <StoryArcsContext.Provider value={value}>{children}</StoryArcsContext.Provider>;
}
