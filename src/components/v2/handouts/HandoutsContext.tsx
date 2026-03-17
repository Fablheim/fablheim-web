import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCreateHandout,
  useDeleteHandout,
  useHandouts,
  useShareHandout,
  useUnshareHandout,
  useUpdateHandout,
} from '@/hooks/useHandouts';
import { useCampaignMembers } from '@/hooks/useCampaignMembers';
import { useSessions } from '@/hooks/useSessions';
import { useSocketEvent } from '@/hooks/useSocket';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type { Handout, Session, WorldEntity } from '@/types/campaign';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ArtifactKind =
  | 'letter'
  | 'journal'
  | 'note'
  | 'contract'
  | 'coded_message'
  | 'lore_fragment'
  | 'map'
  | 'drawing'
  | 'document';

export type HandoutDraft = {
  title: string;
  type: 'text' | 'image' | 'map';
  artifactKind: ArtifactKind;
  content: string;
  imageUrl: string;
  sessionId: string;
  linkedSessionIds: string[];
  linkedEntityIds: string[];
};

export type HandoutVisibilityFilter = 'all' | 'revealed' | 'gm_only';
export type HandoutComposerMode = 'create' | 'edit' | null;

// ── Draft helpers ─────────────────────────────────────────────────────────────

export function getDefaultDraft(): HandoutDraft {
  return {
    title: '',
    type: 'text',
    artifactKind: 'letter',
    content: '',
    imageUrl: '',
    sessionId: '',
    linkedSessionIds: [],
    linkedEntityIds: [],
  };
}

export function getDraftFromHandout(handout: Handout): HandoutDraft {
  return {
    title: handout.title,
    type: handout.type,
    artifactKind: handout.artifactKind ?? inferArtifactKind(handout),
    content: handout.content ?? '',
    imageUrl: handout.imageUrl ?? '',
    sessionId: handout.sessionId ?? handout.linkedSessionIds?.[0] ?? '',
    linkedSessionIds: handout.linkedSessionIds ?? [],
    linkedEntityIds: handout.linkedEntityIds ?? [],
  };
}

export function inferArtifactKind(handout: Handout): ArtifactKind {
  if (handout.type === 'map') return 'map';
  if (handout.type === 'image') return 'drawing';
  return 'note';
}

// ── Context value ─────────────────────────────────────────────────────────────

interface HandoutsContextValue {
  campaignId: string;
  isDM: boolean;

  // Data
  handouts: Handout[];
  filteredHandouts: Handout[];
  isLoading: boolean;
  sessions: Session[];
  worldEntities: WorldEntity[];
  players: Array<{ id: string; username: string }>;

  // Derived
  selectedHandout: Handout | null;
  newestHandout: Handout | null;
  latestReveal: Handout | null;

  // UI state
  selectedHandoutId: string | null;
  setSelectedHandoutId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  visibilityFilter: HandoutVisibilityFilter;
  setVisibilityFilter: (value: HandoutVisibilityFilter) => void;
  composerMode: HandoutComposerMode;
  setComposerMode: (mode: HandoutComposerMode) => void;
  draft: HandoutDraft;
  setDraft: (value: HandoutDraft) => void;
  selectedPlayerIds: string[];
  setSelectedPlayerIds: (value: string[]) => void;

  // Mutations
  createHandout: ReturnType<typeof useCreateHandout>;
  updateHandout: ReturnType<typeof useUpdateHandout>;
  deleteHandout: ReturnType<typeof useDeleteHandout>;
  shareHandout: ReturnType<typeof useShareHandout>;
  unshareHandout: ReturnType<typeof useUnshareHandout>;

  // Actions
  handleSaveHandout: (mode: 'create' | 'edit', handout: Handout | null) => void;
  startCreate: () => void;
}

const HandoutsContext = createContext<HandoutsContextValue | null>(null);

export function useHandoutsContext() {
  const ctx = useContext(HandoutsContext);
  if (!ctx) throw new Error('useHandoutsContext must be used within HandoutsProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function HandoutsProvider({
  campaignId,
  isDM,
  children,
}: {
  campaignId: string;
  isDM: boolean;
  children: ReactNode;
}) {
  const role = isDM ? 'dm' : 'player';
  const { data: handoutsData, isLoading } = useHandouts(campaignId, role);
  const { data: sessionsData } = useSessions(campaignId);
  const { data: worldEntitiesData } = useWorldEntities(campaignId);
  const { data: membersData } = useCampaignMembers(campaignId);
  const queryClient = useQueryClient();

  const createHandout = useCreateHandout();
  const updateHandout = useUpdateHandout();
  const deleteHandout = useDeleteHandout();
  const shareHandout = useShareHandout();
  const unshareHandout = useUnshareHandout();

  const [selectedHandoutId, setSelectedHandoutId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<HandoutVisibilityFilter>('all');
  const [composerMode, setComposerMode] = useState<HandoutComposerMode>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<HandoutDraft>(() => getDefaultDraft());

  const handouts = useMemo(() => handoutsData ?? [], [handoutsData]);
  const sessions = useMemo(() => sessionsData ?? [], [sessionsData]);
  const worldEntities = useMemo(() => worldEntitiesData ?? [], [worldEntitiesData]);
  const players = useMemo(
    () =>
      (membersData ?? [])
        .filter((member) => member.role === 'player')
        .map((member) => ({ id: member.userId._id, username: member.userId.username })),
    [membersData],
  );

  // Socket events
  useSocketEvent('handout:shared', () => {
    queryClient.invalidateQueries({ queryKey: ['handouts', campaignId] });
  });
  useSocketEvent('handout:unshared', (data: { handoutId?: string }) => {
    queryClient.invalidateQueries({ queryKey: ['handouts', campaignId] });
    if (!isDM && data.handoutId && selectedHandoutId === data.handoutId) {
      setSelectedHandoutId(null);
      toast('That artifact was hidden from players.');
    }
  });

  const filteredHandouts = useMemo(() => {
    return handouts.filter((handout) => {
      const matchesSearch =
        !searchQuery.trim() ||
        [handout.title, handout.content, getArtifactLabelFromKind(handout.artifactKind ?? inferArtifactKind(handout))]
          .join(' ')
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());

      const isRevealed = handout.visibleTo === 'all' || handout.visibleTo === 'selected';
      const matchesVisibility =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'revealed' && isRevealed) ||
        (visibilityFilter === 'gm_only' && !isRevealed);

      return matchesSearch && matchesVisibility;
    });
  }, [handouts, searchQuery, visibilityFilter]);

  const selectedHandout = useMemo(
    () =>
      filteredHandouts.find((handout) => handout._id === selectedHandoutId) ??
      handouts.find((handout) => handout._id === selectedHandoutId) ??
      null,
    [filteredHandouts, handouts, selectedHandoutId],
  );

  const newestHandout = useMemo(
    () =>
      [...handouts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null,
    [handouts],
  );

  const latestReveal = useMemo(
    () =>
      [...handouts]
        .filter((handout) => handout.sharedAt)
        .sort((a, b) => Date.parse(b.sharedAt ?? '') - Date.parse(a.sharedAt ?? ''))[0] ?? null,
    [handouts],
  );

  // Auto-select first handout
  useEffect(() => {
    if (composerMode) return;
    if (!selectedHandoutId && filteredHandouts[0]) {
      setSelectedHandoutId(filteredHandouts[0]._id);
      return;
    }
    if (selectedHandoutId && !handouts.some((handout) => handout._id === selectedHandoutId)) {
      setSelectedHandoutId(filteredHandouts[0]?._id ?? null);
    }
  }, [composerMode, filteredHandouts, handouts, selectedHandoutId]);

  function startCreate() {
    setComposerMode('create');
    setDraft(getDefaultDraft());
  }

  function handleSaveHandout(mode: 'create' | 'edit', handout: Handout | null) {
    const payload = {
      title: draft.title.trim(),
      type: draft.type,
      artifactKind: draft.artifactKind,
      content: draft.content.trim() || undefined,
      imageUrl: draft.imageUrl.trim() || undefined,
      sessionId: draft.sessionId || undefined,
      linkedSessionIds: uniqueIds([draft.sessionId, ...draft.linkedSessionIds]),
      linkedEntityIds: uniqueIds(draft.linkedEntityIds),
    };

    if (!payload.title) {
      toast.error('Give the artifact a title first.');
      return;
    }

    if ((payload.type === 'image' || payload.type === 'map') && !payload.imageUrl) {
      toast.error('Maps and image artifacts need an image URL for now.');
      return;
    }

    if (mode === 'create') {
      createHandout.mutate(
        { campaignId, data: payload },
        {
          onSuccess: (created) => {
            toast.success('Artifact catalogued.');
            setComposerMode(null);
            setDraft(getDefaultDraft());
            setSelectedHandoutId(created._id);
          },
          onError: () => toast.error('Could not catalogue artifact.'),
        },
      );
      return;
    }

    if (!handout) return;
    updateHandout.mutate(
      { campaignId, handoutId: handout._id, data: payload },
      {
        onSuccess: () => {
          toast.success('Artifact restored with new details.');
          setComposerMode(null);
        },
        onError: () => toast.error('Could not update artifact.'),
      },
    );
  }

  const value: HandoutsContextValue = {
    campaignId,
    isDM,
    handouts,
    filteredHandouts,
    isLoading,
    sessions,
    worldEntities,
    players,
    selectedHandout,
    newestHandout,
    latestReveal,
    selectedHandoutId,
    setSelectedHandoutId,
    searchQuery,
    setSearchQuery,
    visibilityFilter,
    setVisibilityFilter,
    composerMode,
    setComposerMode,
    draft,
    setDraft,
    selectedPlayerIds,
    setSelectedPlayerIds,
    createHandout,
    updateHandout,
    deleteHandout,
    shareHandout,
    unshareHandout,
    handleSaveHandout,
    startCreate,
  };

  return <HandoutsContext.Provider value={value}>{children}</HandoutsContext.Provider>;
}

// ── Pure helpers (exported for reuse in sibling files) ────────────────────────

export const ARTIFACT_KIND_OPTIONS: Array<{
  value: ArtifactKind;
  label: string;
  hint: string;
  type: 'text' | 'image' | 'map';
}> = [
  { value: 'letter', label: 'Letter', hint: 'Personal correspondence, sealed or hurried.', type: 'text' },
  { value: 'journal', label: 'Journal Page', hint: 'Private writing, fragments, confessions.', type: 'text' },
  { value: 'note', label: 'Field Note', hint: 'Scraps, warnings, clues, quick observations.', type: 'text' },
  { value: 'contract', label: 'Contract', hint: 'Terms, signatures, debts, obligations.', type: 'text' },
  { value: 'coded_message', label: 'Coded Message', hint: 'Cipher text, hidden marks, riddles.', type: 'text' },
  { value: 'lore_fragment', label: 'Lore Fragment', hint: 'Ancient records, histories, prophecies.', type: 'text' },
  { value: 'map', label: 'Map', hint: 'Routes, hideouts, battle maps, annotated charts.', type: 'map' },
  { value: 'drawing', label: 'Drawing', hint: 'Portraits, symbols, sketches, diagrams.', type: 'image' },
  { value: 'document', label: 'Document', hint: 'Scans, decrees, manifests, formal records.', type: 'image' },
];

export function getArtifactLabelFromKind(kind: ArtifactKind): string {
  return ARTIFACT_KIND_OPTIONS.find((option) => option.value === kind)?.label ?? 'Artifact';
}

function uniqueIds(ids: Array<string | undefined>) {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}
