import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useNavigationBus } from '../NavigationBusContext';
import {
  useAddTracker,
  useAdjustTracker,
  useRemoveTracker,
  useTrackers,
  useUpdateTracker,
} from '@/hooks/useCampaigns';
import type { TrackerThreshold, WorldStateTracker } from '@/types/campaign';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ShelfFilter = 'all' | 'rising' | 'resolved' | 'public' | 'gm-only';

export interface TrackerEditorState {
  name: string;
  description: string;
  value: string;
  min: string;
  max: string;
  visibility: 'public' | 'dm-only';
  thresholds: TrackerThreshold[];
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

export function buildSummary(trackers: WorldStateTracker[]) {
  return {
    rising: trackers.filter((t) => t.value < t.max).length,
    resolved: trackers.filter((t) => t.value >= t.max).length,
    withThresholds: trackers.filter((t) => t.thresholds.length > 0).length,
  };
}

export function getActiveThreshold(tracker: WorldStateTracker) {
  return [...tracker.thresholds]
    .filter((t) => t.value <= tracker.value)
    .sort((a, b) => b.value - a.value)[0];
}

export function getProgress(tracker: WorldStateTracker) {
  const total = Math.max(1, tracker.max - tracker.min);
  const percent = Math.max(0, Math.min(100, ((tracker.value - tracker.min) / total) * 100));

  if (percent >= 100) {
    return {
      percent,
      statusLabel: 'At maximum',
      fillClass: 'bg-[linear-gradient(90deg,hsla(145,48%,52%,0.94)_0%,hsla(132,42%,40%,0.9)_100%)]',
    };
  }
  if (percent >= 70) {
    return {
      percent,
      statusLabel: 'Escalating',
      fillClass: 'bg-[linear-gradient(90deg,hsla(42,82%,60%,0.96)_0%,hsla(35,74%,48%,0.94)_100%)]',
    };
  }
  if (percent >= 35) {
    return {
      percent,
      statusLabel: 'Active',
      fillClass: 'bg-[linear-gradient(90deg,hsla(42,72%,58%,0.9)_0%,hsla(28,70%,42%,0.9)_100%)]',
    };
  }
  return {
    percent: Math.max(4, percent),
    statusLabel: 'Low pressure',
    fillClass: 'bg-[linear-gradient(90deg,hsla(210,42%,62%,0.82)_0%,hsla(192,38%,46%,0.76)_100%)]',
  };
}

export function createEmptyEditor(): TrackerEditorState {
  return {
    name: '',
    description: '',
    value: '0',
    min: '0',
    max: '8',
    visibility: 'dm-only',
    thresholds: [],
  };
}

export function createEditorFromTracker(tracker: WorldStateTracker): TrackerEditorState {
  return {
    name: tracker.name,
    description: tracker.description ?? '',
    value: String(tracker.value),
    min: String(tracker.min),
    max: String(tracker.max),
    visibility: tracker.visibility,
    thresholds: tracker.thresholds.map((t) => ({ ...t })),
  };
}

export function previewTrackerFromEditor(editor: TrackerEditorState): WorldStateTracker {
  const min = Number.parseInt(editor.min, 10) || 0;
  const max = Math.max(min + 1, Number.parseInt(editor.max, 10) || min + 1);
  const value = clamp(Number.parseInt(editor.value, 10) || min, min, max);

  return {
    _id: 'preview',
    name: editor.name.trim() || 'New tracker',
    description: editor.description.trim(),
    value,
    min,
    max,
    thresholds: editor.thresholds,
    visibility: editor.visibility,
  };
}

export function buildTrackerPayload(editor: TrackerEditorState) {
  const name = editor.name.trim();
  if (!name) {
    toast.error('Tracker title is required');
    return null;
  }

  const min = Number.parseInt(editor.min, 10);
  const max = Number.parseInt(editor.max, 10);
  const value = Number.parseInt(editor.value, 10);

  if (Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(value)) {
    toast.error('Tracker bounds and value must be numbers');
    return null;
  }

  if (min >= max) {
    toast.error('Maximum must be greater than minimum');
    return null;
  }

  return {
    name,
    description: editor.description.trim() || undefined,
    min,
    max,
    value: clamp(value, min, max),
    visibility: editor.visibility,
    thresholds: editor.thresholds
      .map((t) => ({
        value: Number.isFinite(t.value) ? t.value : 0,
        label: t.label.trim(),
        effect: t.effect?.trim() || undefined,
      }))
      .filter((t) => t.label),
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// ── Context value ─────────────────────────────────────────────────────────────

interface TrackersContextValue {
  campaignId: string;
  isDM: boolean;
  trackers: WorldStateTracker[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;

  addTracker: ReturnType<typeof useAddTracker>;
  updateTracker: ReturnType<typeof useUpdateTracker>;
  adjustTracker: ReturnType<typeof useAdjustTracker>;
  removeTracker: ReturnType<typeof useRemoveTracker>;

  selectedTrackerId: string | null;
  setSelectedTrackerId: (id: string | null) => void;
  isCreating: boolean;
  setIsCreating: (value: boolean) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  editor: TrackerEditorState;
  setEditor: (value: TrackerEditorState) => void;

  allVisibleTrackers: WorldStateTracker[];
  selectedTracker: WorldStateTracker | null;
  summary: ReturnType<typeof buildSummary>;

  openCreate: () => void;
  openTracker: (id: string) => void;
}

const TrackersContext = createContext<TrackersContextValue | null>(null);

export function useTrackersContext() {
  const ctx = useContext(TrackersContext);
  if (!ctx) throw new Error('useTrackersContext must be used within TrackersProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function TrackersProvider({
  campaignId,
  isDM,
  children,
}: {
  campaignId: string;
  isDM: boolean;
  children: ReactNode;
}) {
  const { data: trackersData, isLoading, isError, refetch } = useTrackers(campaignId);
  const addTracker = useAddTracker();
  const updateTracker = useUpdateTracker();
  const adjustTracker = useAdjustTracker();
  const removeTracker = useRemoveTracker();

  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Consume pending navigation from the bus
  const { pending: pendingNav, consumeNavigation } = useNavigationBus();
  useEffect(() => {
    const targetId = consumeNavigation('trackers');
    if (targetId) setSelectedTrackerId(targetId);
  }, [pendingNav, consumeNavigation]);
  const [isEditing, setIsEditing] = useState(false);
  const [editor, setEditor] = useState<TrackerEditorState>(() => createEmptyEditor());

  const trackers = useMemo(() => trackersData ?? [], [trackersData]);

  const allVisibleTrackers = useMemo(
    () => trackers.filter((t) => (isDM ? true : t.visibility === 'public')),
    [trackers, isDM],
  );

  const selectedTracker = useMemo(
    () => allVisibleTrackers.find((t) => t._id === selectedTrackerId) ?? null,
    [allVisibleTrackers, selectedTrackerId],
  );

  const summary = useMemo(() => buildSummary(allVisibleTrackers), [allVisibleTrackers]);

  function openCreate() {
    setIsCreating(true);
    setSelectedTrackerId(null);
  }

  function openTracker(id: string) {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedTrackerId(id);
  }

  const value: TrackersContextValue = {
    campaignId,
    isDM,
    trackers,
    isLoading,
    isError,
    refetch,
    addTracker,
    updateTracker,
    adjustTracker,
    removeTracker,
    selectedTrackerId,
    setSelectedTrackerId,
    isCreating,
    setIsCreating,
    isEditing,
    setIsEditing,
    editor,
    setEditor,
    allVisibleTrackers,
    selectedTracker,
    summary,
    openCreate,
    openTracker,
  };

  return <TrackersContext.Provider value={value}>{children}</TrackersContext.Provider>;
}
