import { createElement, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Archive,
  Eye,
  EyeOff,
  FileImage,
  FileText,
  Gem,
  Link2,
  Map,
  Pencil,
  Plus,
  ScrollText,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
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

interface HandoutsArchiveV2Props {
  campaignId: string;
  isDM: boolean;
}

type ArtifactKind =
  | 'letter'
  | 'journal'
  | 'note'
  | 'contract'
  | 'coded_message'
  | 'lore_fragment'
  | 'map'
  | 'drawing'
  | 'document';

type HandoutDraft = {
  title: string;
  type: 'text' | 'image' | 'map';
  artifactKind: ArtifactKind;
  content: string;
  imageUrl: string;
  sessionId: string;
  linkedSessionIds: string[];
  linkedEntityIds: string[];
};

const ARTIFACT_KIND_OPTIONS: Array<{
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

const ARTIFACT_GROUPS: Array<{
  id: string;
  label: string;
  description: string;
  values: ArtifactKind[];
}> = [
  {
    id: 'paper-trail',
    label: 'Paper Trail',
    description: 'Private writing, warnings, and formal records tucked into the archive drawers.',
    values: ['letter', 'journal', 'note', 'contract', 'coded_message', 'lore_fragment'],
  },
  {
    id: 'visual-record',
    label: 'Visual Record',
    description: 'Maps, sketches, and preserved documents pinned into the evidence folio.',
    values: ['map', 'drawing', 'document'],
  },
];

const ENTITY_SECTION_ORDER: Array<{ label: string; types: WorldEntity['type'][] }> = [
  { label: 'NPCs', types: ['npc', 'npc_minor'] },
  { label: 'Locations', types: ['location', 'location_detail'] },
  { label: 'Quests / Threads', types: ['quest', 'event', 'lore'] },
];

const inputClass =
  'w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(38,70%,58%,0.45)] focus:bg-[hsla(26,22%,12%,0.94)]';

const surfaceClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.68)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(22,24%,9%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.35)]';

export function HandoutsArchiveV2({ campaignId, isDM }: HandoutsArchiveV2Props) {
  const role = isDM ? 'dm' : 'player';
  const { data: handouts, isLoading } = useHandouts(campaignId, role);
  const { data: sessions } = useSessions(campaignId);
  const { data: worldEntities } = useWorldEntities(campaignId);
  const { data: members } = useCampaignMembers(campaignId);
  const createHandout = useCreateHandout();
  const updateHandout = useUpdateHandout();
  const deleteHandout = useDeleteHandout();
  const shareHandout = useShareHandout();
  const unshareHandout = useUnshareHandout();
  const queryClient = useQueryClient();

  const [selectedHandoutId, setSelectedHandoutId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'revealed' | 'gm_only'>('all');
  const [composerMode, setComposerMode] = useState<'create' | 'edit' | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<HandoutDraft>(() => getDefaultDraft());

  const players = members?.filter((member) => member.role === 'player') ?? [];

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
    const items = [...(handouts ?? [])];
    return items.filter((handout) => {
      const matchesSearch =
        !searchQuery.trim() ||
        [handout.title, handout.content, getArtifactLabel(handout)]
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
    () => filteredHandouts.find((handout) => handout._id === selectedHandoutId)
      ?? handouts?.find((handout) => handout._id === selectedHandoutId)
      ?? null,
    [filteredHandouts, handouts, selectedHandoutId],
  );

  const newestHandout = useMemo(
    () => [...(handouts ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null,
    [handouts],
  );

  const latestReveal = useMemo(
    () =>
      [...(handouts ?? [])]
        .filter((handout) => handout.sharedAt)
        .sort((a, b) => Date.parse(b.sharedAt ?? '') - Date.parse(a.sharedAt ?? ''))[0] ?? null,
    [handouts],
  );

  useEffect(() => {
    if (composerMode) return;
    if (!selectedHandoutId && filteredHandouts[0]) {
      setSelectedHandoutId(filteredHandouts[0]._id);
      return;
    }
    if (selectedHandoutId && !handouts?.some((handout) => handout._id === selectedHandoutId)) {
      setSelectedHandoutId(filteredHandouts[0]?._id ?? null);
    }
  }, [composerMode, filteredHandouts, handouts, selectedHandoutId]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsla(38,60%,26%,0.12),transparent_32%),linear-gradient(180deg,hsl(24,27%,9%)_0%,hsl(22,31%,7%)_100%)] text-[hsl(38,24%,88%)]">
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(34,28%,58%)]">Campaign Archive</p>
            <h2 className="mt-1 font-['IM_Fell_English'] text-[30px] leading-none text-[hsl(38,42%,90%)]">
              Handouts
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[hsl(30,14%,62%)]">
              Collect the letters, maps, contracts, and fragments your table uncovers as story artifacts.
            </p>
          </div>
          {isDM && (
            <button
              type="button"
              onClick={() => {
                setComposerMode('create');
                setDraft(getDefaultDraft());
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[hsla(38,70%,58%,0.34)] bg-[hsla(38,70%,52%,0.12)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[hsl(38,82%,72%)] transition hover:bg-[hsla(38,70%,52%,0.2)]"
            >
              <Plus className="h-4 w-4" />
              New Artifact
            </button>
          )}
        </div>

        <DiscoveryShelf
          totalArtifacts={handouts?.length ?? 0}
          newestHandout={newestHandout}
          latestReveal={latestReveal}
          revealedCount={(handouts ?? []).filter((handout) => handout.visibleTo !== 'dm_only').length}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="grid min-h-full gap-4 overflow-visible lg:grid-cols-[minmax(340px,0.95fr)_minmax(0,1.55fr)]">
        <section className={`${surfaceClass} flex min-h-[320px] flex-col overflow-visible`}>
          <ExplorerToolbar
            isDM={isDM}
            searchQuery={searchQuery}
            visibilityFilter={visibilityFilter}
            onSearchChange={setSearchQuery}
            onVisibilityChange={setVisibilityFilter}
          />

          <div className="flex-1 px-3 pb-3">
            {isLoading && (
              <div className="space-y-2 px-1 py-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 rounded-[18px] border border-[hsla(32,24%,22%,0.48)] bg-[hsla(26,20%,12%,0.84)]"
                  />
                ))}
              </div>
            )}

            {!isLoading && filteredHandouts.length === 0 && (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
                <Archive className="h-9 w-9 text-[hsl(32,18%,42%)]" />
                <p className="mt-4 font-['IM_Fell_English'] text-2xl text-[hsl(38,34%,84%)]">
                  {isDM ? 'The archive shelves are still empty.' : 'No artifacts have been revealed yet.'}
                </p>
                <p className="mt-2 max-w-sm text-sm text-[hsl(30,14%,56%)]">
                  {isDM
                    ? 'Create a story artifact to capture letters, maps, journals, and clues as the campaign unfolds.'
                    : 'When the GM reveals a story artifact, it will appear here in the campaign archive.'}
                </p>
              </div>
            )}

            <div className="space-y-2 px-1 py-3">
              {filteredHandouts.map((handout) => (
                <ArtifactLedgerRow
                  key={handout._id}
                  handout={handout}
                  session={findSessionById(sessions, handout.linkedSessionIds?.[0] ?? handout.sessionId)}
                  selected={handout._id === selectedHandout?._id}
                  onSelect={() => {
                    setSelectedHandoutId(handout._id);
                    setComposerMode(null);
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        <section className={`${surfaceClass} min-h-[320px] overflow-visible`}>
          <div className="h-full">
            {composerMode ? (
              <ArtifactComposer
                draft={draft}
                sessions={sessions ?? []}
                worldEntities={worldEntities ?? []}
                isPending={createHandout.isPending || updateHandout.isPending}
                mode={composerMode}
                onChange={setDraft}
                onCancel={() => {
                  setComposerMode(null);
                  setDraft(getDefaultDraft());
                }}
                onSubmit={() => handleSaveHandout(composerMode, selectedHandout)}
              />
            ) : selectedHandout ? (
              <ArtifactViewer
                handout={selectedHandout}
                isDM={isDM}
                sessions={sessions ?? []}
                worldEntities={worldEntities ?? []}
                players={players.map((player) => ({
                  id: player.userId._id,
                  username: player.userId.username,
                }))}
                selectedPlayerIds={selectedPlayerIds}
                isSharing={shareHandout.isPending}
                isDeleting={deleteHandout.isPending}
                onTogglePlayer={(playerId) =>
                  setSelectedPlayerIds((current) =>
                    current.includes(playerId)
                      ? current.filter((id) => id !== playerId)
                      : [...current, playerId],
                  )
                }
                onRevealAll={() => {
                  shareHandout.mutate(
                    { campaignId, handoutId: selectedHandout._id },
                    {
                      onSuccess: () => toast.success('Artifact revealed to players.'),
                      onError: () => toast.error('Could not reveal artifact.'),
                    },
                  );
                }}
                onRevealSelected={() => {
                  if (!selectedPlayerIds.length) return;
                  shareHandout.mutate(
                    { campaignId, handoutId: selectedHandout._id, playerIds: selectedPlayerIds },
                    {
                      onSuccess: () => {
                        toast.success('Artifact revealed to selected players.');
                        setSelectedPlayerIds([]);
                      },
                      onError: () => toast.error('Could not reveal artifact.'),
                    },
                  );
                }}
                onHide={() => {
                  unshareHandout.mutate(
                    { campaignId, handoutId: selectedHandout._id },
                    {
                      onSuccess: () => toast.success('Artifact returned to the GM archive.'),
                      onError: () => toast.error('Could not hide artifact.'),
                    },
                  );
                }}
                onEdit={() => {
                  setComposerMode('edit');
                  setDraft(getDraftFromHandout(selectedHandout));
                }}
                onDelete={() => {
                  if (!window.confirm(`Remove "${selectedHandout.title}" from the archive?`)) return;
                  deleteHandout.mutate(
                    { campaignId, handoutId: selectedHandout._id },
                    {
                      onSuccess: () => {
                        toast.success('Artifact removed.');
                        setSelectedHandoutId(null);
                      },
                      onError: () => toast.error('Could not delete artifact.'),
                    },
                  );
                }}
              />
            ) : (
              <ArtifactViewerEmpty isDM={isDM} onCreate={() => setComposerMode('create')} />
            )}
          </div>
        </section>
        </div>
      </div>
    </div>
  );

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
}

function DiscoveryShelf({
  totalArtifacts,
  newestHandout,
  latestReveal,
  revealedCount,
}: {
  totalArtifacts: number;
  newestHandout: Handout | null;
  latestReveal: Handout | null;
  revealedCount: number;
}) {
  const items = [
    {
      label: 'Artifacts Discovered',
      value: String(totalArtifacts),
      detail: totalArtifacts ? 'Story objects catalogued so far' : 'Nothing logged yet',
      icon: Archive,
    },
    {
      label: 'Newest Artifact',
      value: newestHandout?.title ?? 'None yet',
      detail: newestHandout ? formatRelative(newestHandout.createdAt) : 'Waiting for the first clue',
      icon: Sparkles,
    },
    {
      label: 'Recently Revealed',
      value: latestReveal?.title ?? 'None revealed',
      detail: latestReveal?.sharedAt ? formatRelative(latestReveal.sharedAt) : 'Still in the GM archive',
      icon: Eye,
    },
    {
      label: 'Seen by Players',
      value: String(revealedCount),
      detail: revealedCount ? 'Artifacts now part of party memory' : 'GM-only discoveries',
      icon: Users,
    },
  ];

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[22px] border border-[hsla(32,24%,24%,0.68)] bg-[hsla(24,18%,12%,0.78)] px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-[hsla(38,62%,58%,0.22)] bg-[hsla(38,62%,52%,0.08)] p-2 text-[hsl(38,70%,68%)]">
              <item.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">{item.label}</p>
              <p className="truncate font-['IM_Fell_English'] text-[22px] leading-none text-[hsl(38,40%,88%)]">
                {item.value}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-[hsl(30,14%,58%)]">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

function ExplorerToolbar({
  isDM,
  searchQuery,
  visibilityFilter,
  onSearchChange,
  onVisibilityChange,
}: {
  isDM: boolean;
  searchQuery: string;
  visibilityFilter: 'all' | 'revealed' | 'gm_only';
  onSearchChange: (value: string) => void;
  onVisibilityChange: (value: 'all' | 'revealed' | 'gm_only') => void;
}) {
  return (
    <div className="border-b border-[hsla(32,24%,24%,0.42)] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">Handout Explorer</p>
          <h3 className="mt-1 font-['IM_Fell_English'] text-2xl text-[hsl(38,36%,88%)]">Archive Drawer</h3>
        </div>
        <span className="rounded-full border border-[hsla(32,24%,28%,0.72)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[hsl(32,18%,56%)]">
          {isDM ? 'GM Archive' : 'Player Archive'}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(32,18%,46%)]" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search titles, clues, and fragments..."
            className={`${inputClass} pl-10`}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All artifacts' },
            { value: 'revealed', label: 'Revealed' },
            { value: 'gm_only', label: 'GM only' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onVisibilityChange(option.value as 'all' | 'revealed' | 'gm_only')}
              className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition ${
                visibilityFilter === option.value
                  ? 'border border-[hsla(38,70%,58%,0.34)] bg-[hsla(38,70%,52%,0.14)] text-[hsl(38,78%,74%)]'
                  : 'border border-[hsla(32,24%,28%,0.72)] bg-[hsla(24,18%,10%,0.7)] text-[hsl(30,12%,58%)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArtifactLedgerRow({
  handout,
  session,
  selected,
  onSelect,
}: {
  handout: Handout;
  session: Session | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const revealed = handout.visibleTo !== 'dm_only';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid w-full gap-3 rounded-[18px] border px-3 py-3 text-left transition ${
        selected
          ? 'border-[hsla(38,72%,60%,0.42)] bg-[hsla(38,36%,18%,0.32)] shadow-[0_0_0_1px_hsla(38,72%,60%,0.14)]'
          : 'border-[hsla(32,24%,22%,0.56)] bg-[hsla(24,18%,11%,0.78)] hover:border-[hsla(32,28%,32%,0.62)] hover:bg-[hsla(24,18%,13%,0.84)]'
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded-2xl border border-[hsla(32,24%,28%,0.74)] bg-[hsla(24,18%,8%,0.72)] p-2 text-[hsl(38,68%,70%)]">
            {createElement(getArtifactIcon(handout), { className: 'h-4 w-4' })}
          </span>
          <div className="min-w-0">
            <p className="truncate font-[Cinzel] text-sm tracking-[0.08em] text-[hsl(38,34%,86%)]">{handout.title}</p>
            <p className="truncate text-xs text-[hsl(30,14%,56%)]">
              {getArtifactLabel(handout)} · {getArtifactPreview(handout)}
            </p>
          </div>
        </div>
      </div>
      <div className="text-xs text-[hsl(30,14%,62%)]">
        <span className="mr-2 text-[10px] uppercase tracking-[0.18em] text-[hsl(32,18%,50%)]">Discovered</span>
        {formatShortDate(handout.createdAt)}
      </div>
      <div className="truncate text-xs text-[hsl(30,14%,62%)]">
        <span className="mr-2 text-[10px] uppercase tracking-[0.18em] text-[hsl(32,18%,50%)]">Session</span>
        {session?.title ?? 'Unlinked'}
      </div>
      <div>
        <span className="mr-2 text-[10px] uppercase tracking-[0.18em] text-[hsl(32,18%,50%)]">Visibility</span>
        <span
          className={`inline-flex rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${
            revealed
              ? 'border-[hsla(150,52%,44%,0.35)] bg-[hsla(150,52%,44%,0.12)] text-[hsl(150,66%,72%)]'
              : 'border-[hsla(215,20%,42%,0.35)] bg-[hsla(215,20%,42%,0.12)] text-[hsl(214,18%,72%)]'
          }`}
        >
          {revealed ? 'Revealed' : 'GM only'}
        </span>
      </div>
    </button>
  );
}

function ArtifactViewer({
  handout,
  isDM,
  sessions,
  worldEntities,
  players,
  selectedPlayerIds,
  isSharing,
  isDeleting,
  onTogglePlayer,
  onRevealAll,
  onRevealSelected,
  onHide,
  onEdit,
  onDelete,
}: {
  handout: Handout;
  isDM: boolean;
  sessions: Session[];
  worldEntities: WorldEntity[];
  players: Array<{ id: string; username: string }>;
  selectedPlayerIds: string[];
  isSharing: boolean;
  isDeleting: boolean;
  onTogglePlayer: (playerId: string) => void;
  onRevealAll: () => void;
  onRevealSelected: () => void;
  onHide: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const linkedSessions = uniqueIds([handout.sessionId, ...(handout.linkedSessionIds ?? [])])
    .map((id) => findSessionById(sessions, id))
    .filter((session): session is Session => Boolean(session));

  const linkedEntities = (handout.linkedEntityIds ?? [])
    .map((id) => worldEntities.find((entity) => entity._id === id))
    .filter((entity): entity is WorldEntity => Boolean(entity));

  const revealed = handout.visibleTo !== 'dm_only';

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">Artifact Viewer</p>
            <h3 className="mt-1 font-['IM_Fell_English'] text-[32px] leading-none text-[hsl(38,40%,90%)]">
              {handout.title}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <ViewerBadge icon={Gem} label={getArtifactLabel(handout)} />
              <ViewerBadge icon={revealed ? Eye : Shield} label={getVisibilityLabel(handout)} />
              <ViewerBadge icon={Archive} label={`Discovered ${formatRelative(handout.createdAt)}`} />
            </div>
          </div>

          {isDM && (
            <div className="flex flex-wrap gap-2">
              {revealed ? (
                <ActionChip icon={EyeOff} label="Hide Again" onClick={onHide} />
              ) : (
                <ActionChip icon={Eye} label="Reveal to All" onClick={onRevealAll} disabled={isSharing} />
              )}
              <ActionChip icon={Pencil} label="Edit Artifact" onClick={onEdit} />
              <ActionChip icon={Trash2} label="Delete" onClick={onDelete} tone="danger" disabled={isDeleting} />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1.3fr)_320px]">
        <div className="space-y-4">
          <ArtifactSurface handout={handout} />

          <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,9%,0.72)] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">Campaign Connections</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {linkedSessions.map((session) => (
                <LinkedPill key={session._id} label={`Session ${session.sessionNumber} — ${session.title ?? 'Untitled Session'}`} />
              ))}
              {linkedEntities.map((entity) => (
                <LinkedPill key={entity._id} label={`${getEntityLabel(entity)} — ${entity.name}`} />
              ))}
              {!linkedSessions.length && !linkedEntities.length && (
                <p className="text-sm text-[hsl(30,14%,56%)]">
                  This artifact has not been attached to a session, NPC, location, or thread yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <MetadataCard title="Archive Notes">
            <MetadataRow label="Discovered" value={formatLongDate(handout.createdAt)} />
            <MetadataRow label="Revealed" value={handout.sharedAt ? formatLongDate(handout.sharedAt) : 'Not yet'} />
            <MetadataRow label="Visibility" value={getVisibilityLabel(handout)} />
            <MetadataRow
              label="Session revealed"
              value={linkedSessions[0]?.title ?? findSessionById(sessions, handout.sessionId)?.title ?? 'Not attached'}
            />
          </MetadataCard>

          {isDM && (
            <MetadataCard title="Reveal to Players">
              <p className="text-sm text-[hsl(30,14%,58%)]">
                Bring this artifact into the live session when the table discovers it.
              </p>
              <div className="mt-3 space-y-2">
                {players.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => onTogglePlayer(player.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition ${
                      selectedPlayerIds.includes(player.id)
                        ? 'border-[hsla(38,70%,58%,0.36)] bg-[hsla(38,70%,52%,0.12)] text-[hsl(38,78%,74%)]'
                        : 'border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,10%,0.72)] text-[hsl(34,22%,78%)]'
                    }`}
                  >
                    <span>{player.username}</span>
                    <span>{selectedPlayerIds.includes(player.id) ? 'Selected' : 'Reveal only'}</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onRevealAll}
                  disabled={isSharing}
                  className="flex-1 rounded-full border border-[hsla(150,52%,44%,0.32)] bg-[hsla(150,52%,44%,0.12)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(150,70%,76%)] disabled:opacity-50"
                >
                  Reveal to All
                </button>
                <button
                  type="button"
                  onClick={onRevealSelected}
                  disabled={!selectedPlayerIds.length || isSharing}
                  className="flex-1 rounded-full border border-[hsla(38,70%,58%,0.32)] bg-[hsla(38,70%,52%,0.12)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(38,78%,74%)] disabled:opacity-50"
                >
                  Reveal Selected
                </button>
              </div>
            </MetadataCard>
          )}
        </aside>
      </div>
    </div>
  );
}

function ArtifactComposer({
  draft,
  sessions,
  worldEntities,
  isPending,
  mode,
  onChange,
  onCancel,
  onSubmit,
}: {
  draft: HandoutDraft;
  sessions: Session[];
  worldEntities: WorldEntity[];
  isPending: boolean;
  mode: 'create' | 'edit';
  onChange: (draft: HandoutDraft) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="px-5 py-5">
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">
            {mode === 'create' ? 'Create Story Artifact' : 'Edit Story Artifact'}
          </p>
          <h3 className="mt-1 font-['IM_Fell_English'] text-[32px] text-[hsl(38,40%,90%)]">
            {mode === 'create' ? 'Artifact Composer' : 'Restore the Artifact'}
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-[hsl(30,14%,58%)]">
            Shape the handout like an in-world object the table can discover, not a file upload.
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,10%,0.76)] p-4">
              <label className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">Artifact Title</label>
              <input
                value={draft.title}
                onChange={(event) => onChange({ ...draft, title: event.target.value })}
                placeholder="Letter from the Iron Syndicate"
                className={`${inputClass} mt-2`}
              />
            </div>

            <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,10%,0.76)] p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">Attach to Session</p>
              <select
                value={draft.sessionId}
                onChange={(event) => onChange({ ...draft, sessionId: event.target.value })}
                className={`${inputClass} mt-2`}
              >
                <option value="">No specific session</option>
                {sessions.map((session) => (
                  <option key={session._id} value={session._id}>
                    Session {session.sessionNumber} — {session.title ?? 'Untitled Session'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.64)] bg-[linear-gradient(180deg,hsla(25,20%,12%,0.9),hsla(22,18%,9%,0.86))] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">Artifact Cabinet</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(30,14%,58%)]">
                  Choose the kind of story object you are preserving. Think in terms of what the party found in the world,
                  not what file you are uploading.
                </p>
              </div>
              <div className="rounded-[18px] border border-[hsla(38,70%,58%,0.22)] bg-[hsla(38,70%,52%,0.08)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(32,18%,56%)]">Selected Artifact</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-2xl border border-[hsla(38,70%,58%,0.24)] bg-[hsla(38,70%,52%,0.12)] p-2 text-[hsl(38,74%,72%)]">
                    {createElement(getArtifactOptionIcon(draft.artifactKind), { className: 'h-4 w-4' })}
                  </span>
                  <div>
                    <p className="font-[Cinzel] text-base text-[hsl(38,34%,86%)]">
                      {ARTIFACT_KIND_OPTIONS.find((option) => option.value === draft.artifactKind)?.label ?? 'Artifact'}
                    </p>
                    <p className="text-xs text-[hsl(30,14%,56%)]">
                      {draft.type === 'text' ? 'Written artifact' : draft.type === 'map' ? 'Cartographic artifact' : 'Visual artifact'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {ARTIFACT_GROUPS.map((group) => {
                const options = ARTIFACT_KIND_OPTIONS.filter((option) => group.values.includes(option.value));

                return (
                  <section
                    key={group.id}
                    className="rounded-[20px] border border-[hsla(32,24%,24%,0.54)] bg-[hsla(24,18%,11%,0.66)] p-4"
                  >
                    <div className="mb-3">
                      <p className="font-[Cinzel] text-lg text-[hsl(38,30%,84%)]">{group.label}</p>
                      <p className="mt-1 max-w-2xl text-sm text-[hsl(30,14%,56%)]">{group.description}</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {options.map((option) => {
                        const active = draft.artifactKind === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              onChange({
                                ...draft,
                                artifactKind: option.value,
                                type: option.type,
                              })
                            }
                            className={`group relative overflow-hidden rounded-[20px] border px-4 py-4 text-left transition ${
                              active
                                ? 'border-[hsla(38,70%,58%,0.4)] bg-[linear-gradient(180deg,hsla(38,54%,22%,0.28),hsla(30,26%,12%,0.92))] shadow-[0_0_0_1px_hsla(38,70%,58%,0.12)]'
                                : 'border-[hsla(32,24%,24%,0.64)] bg-[linear-gradient(180deg,hsla(26,16%,13%,0.92),hsla(22,18%,10%,0.88))] hover:border-[hsla(32,26%,34%,0.6)]'
                            }`}
                          >
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,hsla(38,48%,62%,0.08),transparent)] opacity-80" />
                            <div className="relative flex items-start gap-3">
                              <span
                                className={`rounded-2xl border p-2 ${
                                  active
                                    ? 'border-[hsla(38,70%,58%,0.28)] bg-[hsla(38,70%,52%,0.14)] text-[hsl(38,78%,74%)]'
                                    : 'border-[hsla(32,24%,24%,0.64)] bg-[hsla(24,18%,9%,0.8)] text-[hsl(30,14%,62%)]'
                                }`}
                              >
                                {createElement(getArtifactOptionIcon(option.value), { className: 'h-4 w-4' })}
                              </span>
                              <div className="min-w-0">
                                <p className="font-[Cinzel] text-lg leading-tight text-[hsl(38,30%,84%)]">{option.label}</p>
                                <p className="mt-2 text-sm leading-6 text-[hsl(30,14%,56%)]">{option.hint}</p>
                              </div>
                            </div>
                            <div className="relative mt-4 flex items-center justify-between text-[11px] uppercase tracking-[0.18em]">
                              <span className="text-[hsl(32,18%,50%)]">
                                {option.type === 'text' ? 'Writing sample' : option.type === 'map' ? 'Map plate' : 'Visual plate'}
                              </span>
                              <span className={active ? 'text-[hsl(38,78%,74%)]' : 'text-[hsl(30,12%,58%)]'}>
                                {active ? 'Selected' : 'Choose'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.15fr)_320px]">
            <div className="space-y-5">
              {(draft.type === 'image' || draft.type === 'map') ? (
                <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,10%,0.76)] p-4">
                  <label className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">
                    {draft.type === 'map' ? 'Map Image URL' : 'Artifact Image URL'}
                  </label>
                  <input
                    value={draft.imageUrl}
                    onChange={(event) => onChange({ ...draft, imageUrl: event.target.value })}
                    placeholder="https://..."
                    className={`${inputClass} mt-2`}
                  />
                  <p className="mt-2 text-xs text-[hsl(30,14%,54%)]">
                    The current model supports image URLs. File upload can be layered in later.
                  </p>
                </div>
              ) : (
                <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,10%,0.76)] p-4">
                  <label className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">In-world Writing</label>
                  <textarea
                    value={draft.content}
                    onChange={(event) => onChange({ ...draft, content: event.target.value })}
                    placeholder="Write the handout as the players should discover it..."
                    rows={14}
                    className={`${inputClass} mt-2 min-h-[320px] resize-y font-['IM_Fell_English'] leading-7`}
                  />
                </div>
              )}

              <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,10%,0.76)] p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">Campaign Connections</p>
                <div className="mt-3 space-y-4">
                  {ENTITY_SECTION_ORDER.map((section) => {
                    const entities = worldEntities.filter((entity) => section.types.includes(entity.type));
                    if (!entities.length) return null;

                    return (
                      <div key={section.label}>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(30,12%,50%)]">{section.label}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {entities.slice(0, 12).map((entity) => {
                            const active = draft.linkedEntityIds.includes(entity._id);
                            return (
                              <button
                                key={entity._id}
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...draft,
                                    linkedEntityIds: toggleId(draft.linkedEntityIds, entity._id),
                                  })
                                }
                                className={`rounded-full px-3 py-1.5 text-xs transition ${
                                  active
                                    ? 'border border-[hsla(38,70%,58%,0.34)] bg-[hsla(38,70%,52%,0.12)] text-[hsl(38,78%,74%)]'
                                    : 'border border-[hsla(32,24%,24%,0.64)] bg-[hsla(24,18%,11%,0.74)] text-[hsl(30,14%,62%)]'
                                }`}
                              >
                                {entity.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,10%,0.76)] p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">Archive Controls</p>
                <p className="mt-2 text-sm leading-6 text-[hsl(30,14%,58%)]">
                  Save this as a story artifact the GM can later reveal during play.
                </p>
                <div className="mt-4 flex gap-2 2xl:flex-col">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 rounded-full border border-[hsla(32,24%,24%,0.64)] bg-[hsla(24,18%,11%,0.74)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(30,14%,62%)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isPending}
                    className="flex-1 rounded-full border border-[hsla(38,70%,58%,0.34)] bg-[hsla(38,70%,52%,0.14)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(38,78%,74%)] disabled:opacity-50"
                  >
                    {isPending ? 'Saving…' : mode === 'create' ? 'Catalogue Artifact' : 'Save Artifact'}
                  </button>
                </div>
              </div>

              <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,10%,0.76)] p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">Current Artifact Path</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <LinkedPill label={ARTIFACT_KIND_OPTIONS.find((option) => option.value === draft.artifactKind)?.label ?? 'Artifact'} />
                  {draft.sessionId && (
                    <LinkedPill
                      label={sessions.find((session) => session._id === draft.sessionId)?.title ?? 'Linked session'}
                    />
                  )}
                  {draft.linkedEntityIds.slice(0, 3).map((entityId) => {
                    const entity = worldEntities.find((item) => item._id === entityId);
                    return entity ? <LinkedPill key={entityId} label={`${getEntityLabel(entity)} — ${entity.name}`} /> : null;
                  })}
                  {!draft.sessionId && draft.linkedEntityIds.length === 0 && (
                    <p className="text-sm text-[hsl(30,14%,56%)]">No campaign ties selected yet.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArtifactSurface({ handout }: { handout: Handout }) {
  const artifactLabel = getArtifactLabel(handout);

  if (handout.type === 'map' || handout.type === 'image') {
    return (
      <div className="overflow-hidden rounded-[26px] border border-[hsla(32,24%,24%,0.64)] bg-[hsla(20,18%,8%,0.78)]">
        <div className="flex items-center justify-between border-b border-[hsla(32,24%,24%,0.42)] px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">{artifactLabel}</p>
          <span className="text-xs text-[hsl(30,14%,56%)]">Artifact Viewer</span>
        </div>
        <div className="p-4">
          {handout.imageUrl ? (
            <img
              src={handout.imageUrl}
              alt={handout.title}
              className="max-h-[580px] w-full rounded-[18px] border border-[hsla(32,24%,24%,0.52)] object-contain"
            />
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-[18px] border border-dashed border-[hsla(32,24%,28%,0.72)] text-sm text-[hsl(30,14%,56%)]">
              No image has been attached to this artifact yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-[hsla(38,24%,34%,0.54)] bg-[linear-gradient(180deg,hsla(38,34%,84%,0.98)_0%,hsla(36,32%,76%,0.98)_100%)] px-6 py-7 text-[hsl(22,22%,22%)] shadow-[inset_0_1px_0_hsla(40,34%,94%,0.55)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,hsla(34,24%,34%,0.06),transparent)]" />
      <p className="text-center text-[11px] uppercase tracking-[0.3em] text-[hsl(24,18%,42%)]">{artifactLabel}</p>
      <div className="mx-auto mt-5 max-w-3xl font-['IM_Fell_English'] text-[21px] leading-9">
        {handout.artifactKind === 'letter' && <p className="mb-6 text-[hsl(24,22%,38%)]">To the one meant to receive this,</p>}
        {handout.artifactKind === 'journal' && <p className="mb-6 text-[hsl(24,22%,38%)]">Journal entry</p>}
        <div className="whitespace-pre-wrap">{handout.content || 'No text was preserved with this artifact.'}</div>
      </div>
    </div>
  );
}

function ArtifactViewerEmpty({ isDM, onCreate }: { isDM: boolean; onCreate: () => void }) {
  return (
    <div className="flex h-full min-h-[520px] flex-col items-center justify-center px-8 text-center">
      <ScrollText className="h-10 w-10 text-[hsl(32,18%,42%)]" />
      <h3 className="mt-5 font-['IM_Fell_English'] text-3xl text-[hsl(38,36%,88%)]">Select an artifact to open it.</h3>
      <p className="mt-2 max-w-md text-sm text-[hsl(30,14%,56%)]">
        The viewer is where letters can be read, maps inspected, and campaign links understood in context.
      </p>
      {isDM && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 rounded-full border border-[hsla(38,70%,58%,0.34)] bg-[hsla(38,70%,52%,0.12)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(38,78%,74%)]"
        >
          Create First Artifact
        </button>
      )}
    </div>
  );
}

function MetadataCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,10%,0.72)] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(32,18%,56%)]">{title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(30,12%,50%)]">{label}</p>
      <p className="mt-1 text-sm text-[hsl(36,22%,82%)]">{value}</p>
    </div>
  );
}

function ViewerBadge({
  icon: Icon,
  label,
}: {
  icon: typeof Eye;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,10%,0.72)] px-3 py-1 text-xs text-[hsl(34,20%,78%)]">
      <Icon className="h-3.5 w-3.5 text-[hsl(38,68%,68%)]" />
      {label}
    </span>
  );
}

function ActionChip({
  icon: Icon,
  label,
  onClick,
  tone = 'default',
  disabled = false,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition disabled:opacity-50 ${
        tone === 'danger'
          ? 'border-[hsla(0,68%,58%,0.3)] bg-[hsla(0,68%,58%,0.1)] text-[hsl(0,80%,76%)]'
          : 'border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,10%,0.72)] text-[hsl(34,20%,78%)]'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function LinkedPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,10%,0.72)] px-3 py-1.5 text-xs text-[hsl(34,20%,78%)]">
      <Link2 className="h-3.5 w-3.5 text-[hsl(38,68%,68%)]" />
      {label}
    </span>
  );
}

function getDefaultDraft(): HandoutDraft {
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

function getDraftFromHandout(handout: Handout): HandoutDraft {
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

function inferArtifactKind(handout: Handout): ArtifactKind {
  if (handout.type === 'map') return 'map';
  if (handout.type === 'image') return 'drawing';
  return 'note';
}

function getArtifactLabel(handout: Pick<Handout, 'artifactKind' | 'type'>) {
  const kind = handout.artifactKind ?? inferArtifactKind(handout as Handout);
  return ARTIFACT_KIND_OPTIONS.find((option) => option.value === kind)?.label ?? 'Artifact';
}

function getArtifactOptionIcon(kind: ArtifactKind) {
  switch (kind) {
    case 'map':
      return Map;
    case 'drawing':
    case 'document':
      return FileImage;
    case 'journal':
    case 'coded_message':
      return ScrollText;
    default:
      return FileText;
  }
}

function getArtifactIcon(handout: Handout) {
  const kind = handout.artifactKind ?? inferArtifactKind(handout);
  if (handout.type === 'image') return FileImage;
  return getArtifactOptionIcon(kind);
}

function getArtifactPreview(handout: Handout) {
  if (handout.type === 'map') return 'Route marks, landmarks, and hidden paths.';
  if (handout.type === 'image') return 'Visual artifact ready for close inspection.';
  const cleaned = handout.content?.replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, 72) : 'Text preserved in the campaign archive.';
}

function getVisibilityLabel(handout: Handout) {
  if (handout.visibleTo === 'all') return 'Revealed to players';
  if (handout.visibleTo === 'selected') return `Revealed to ${handout.sharedWith?.length ?? 0} player(s)`;
  return 'GM only';
}

function findSessionById(sessions: Session[] | undefined, sessionId?: string) {
  if (!sessionId) return null;
  return sessions?.find((session) => session._id === sessionId) ?? null;
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id];
}

function uniqueIds(ids: Array<string | undefined>) {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function getEntityLabel(entity: WorldEntity) {
  if (entity.type === 'npc' || entity.type === 'npc_minor') return 'NPC';
  if (entity.type === 'location' || entity.type === 'location_detail') return 'Location';
  if (entity.type === 'quest') return 'Quest';
  if (entity.type === 'event') return 'Thread';
  if (entity.type === 'lore') return 'Lore';
  return 'World';
}

function formatShortDate(value?: string) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function formatLongDate(value?: string) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function formatRelative(value?: string) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  const days = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return formatLongDate(value);
}
