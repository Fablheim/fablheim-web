import { createElement, type ReactNode } from 'react';
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
  Shield,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { shellPanelClass } from '@/lib/panel-styles';
import type { Handout, Session, WorldEntity } from '@/types/campaign';
import {
  HandoutsProvider,
  useHandoutsContext,
  ARTIFACT_KIND_OPTIONS,
  inferArtifactKind,
  getDraftFromHandout,
  getArtifactLabelFromKind,
  type ArtifactKind,
  type HandoutDraft,
} from './HandoutsContext';

// ── Style helpers ─────────────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(38,70%,58%,0.45)] focus:bg-[hsla(26,22%,12%,0.94)]';

const innerSurfaceClass =
  'rounded-[22px] border border-[hsla(32,24%,24%,0.46)] bg-[linear-gradient(180deg,hsla(26,22%,11%,0.95)_0%,hsla(20,20%,9%,0.96)_100%)]';

function actionButtonClass(emphasis = false) {
  return `inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
    emphasis
      ? 'border-[hsla(38,70%,58%,0.34)] bg-[hsla(38,70%,52%,0.12)] text-[hsl(38,82%,72%)] hover:bg-[hsla(38,70%,52%,0.2)]'
      : 'border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] text-[hsl(30,12%,62%)] hover:text-[hsl(38,24%,88%)]'
  }`;
}

// ── Artifact groups ───────────────────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

/**
 * Self-wrapping entry point. Accepts optional campaignId/isDM props so that
 * existing callers (CenterStageV2, HandoutsTab) continue to work before the
 * final wiring agent threads HandoutsProvider into the shell. When props are
 * provided, the component creates its own provider; when used inside an
 * existing HandoutsProvider (right panel wiring) it must be called with no
 * props and context is inherited.
 */
export function HandoutsArchiveV2({
  campaignId,
  isDM,
}: {
  campaignId?: string;
  isDM?: boolean;
} = {}) {
  if (campaignId !== undefined) {
    return (
      <HandoutsProvider campaignId={campaignId} isDM={isDM ?? false}>
        <HandoutsArchiveV2Inner />
      </HandoutsProvider>
    );
  }
  return <HandoutsArchiveV2Inner />;
}

function HandoutsArchiveV2Inner() {
  const {
    isDM,
    handouts,
    filteredHandouts,
    isLoading,
    sessions,
    worldEntities,
    players,
    selectedHandout,
    setSelectedHandoutId,
    composerMode,
    setComposerMode,
    draft,
    setDraft,
    selectedPlayerIds,
    setSelectedPlayerIds,
    shareHandout,
    unshareHandout,
    deleteHandout,
    handleSaveHandout,
    startCreate,
    campaignId,
    createHandout,
    updateHandout,
  } = useHandoutsContext();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(38,60%,26%,0.12),transparent_32%),linear-gradient(180deg,hsl(24,27%,9%)_0%,hsl(22,31%,7%)_100%)] p-4 text-[hsl(38,24%,88%)]">
      <section className={`${shellPanelClass} min-h-0 flex-1 flex flex-col overflow-hidden`}>
        {renderShellHeader()}
        {renderShellBody()}
      </section>
    </div>
  );

  function renderShellHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {renderHeaderLeft()}
          {renderHeaderActions()}
        </div>
      </div>
    );
  }

  function renderHeaderLeft() {
    const title = composerMode
      ? composerMode === 'create'
        ? 'New Artifact'
        : 'Edit Artifact'
      : selectedHandout?.title ?? 'Handout Archive';
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(30,14%,54%)]">
          Handout Archive
        </p>
        <h2 className="mt-0.5 font-['IM_Fell_English'] text-[26px] leading-none text-[hsl(38,42%,90%)]">
          {title}
        </h2>
      </div>
    );
  }

  function renderHeaderActions() {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {isDM && (
          <button type="button" onClick={startCreate} className={actionButtonClass(true)}>
            <Plus className="h-4 w-4" />
            New Handout
          </button>
        )}
        {selectedHandout && !composerMode && isDM && renderViewerActions()}
      </div>
    );
  }

  function renderViewerActions() {
    if (!selectedHandout) return null;
    const revealed = selectedHandout.visibleTo !== 'dm_only';
    return (
      <>
        {revealed ? (
          <button
            type="button"
            onClick={() => {
              unshareHandout.mutate(
                { campaignId, handoutId: selectedHandout._id },
                {
                  onSuccess: () => toast.success('Artifact returned to the GM archive.'),
                  onError: () => toast.error('Could not hide artifact.'),
                },
              );
            }}
            className={actionButtonClass()}
          >
            <EyeOff className="h-4 w-4" />
            Hide Again
          </button>
        ) : (
          <button
            type="button"
            disabled={shareHandout.isPending}
            onClick={() => {
              shareHandout.mutate(
                { campaignId, handoutId: selectedHandout._id },
                {
                  onSuccess: () => toast.success('Artifact revealed to players.'),
                  onError: () => toast.error('Could not reveal artifact.'),
                },
              );
            }}
            className={actionButtonClass()}
          >
            <Eye className="h-4 w-4" />
            Reveal to All
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setComposerMode('edit');
            setDraft(getDraftFromHandout(selectedHandout));
          }}
          className={actionButtonClass()}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      </>
    );
  }

  function renderShellBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {composerMode
          ? renderComposerView()
          : selectedHandout
          ? renderViewerView()
          : renderEmptyState()}
      </div>
    );
  }

  function renderComposerView() {
    return (
      <ArtifactComposer
        draft={draft}
        sessions={sessions}
        worldEntities={worldEntities}
        isPending={createHandout.isPending || updateHandout.isPending}
        mode={composerMode ?? 'create'}
        onChange={setDraft}
        onCancel={() => {
          setComposerMode(null);
        }}
        onSubmit={() => handleSaveHandout(composerMode ?? 'create', selectedHandout)}
      />
    );
  }

  function renderViewerView() {
    if (!selectedHandout) return null;
    return (
      <ArtifactViewer
        handout={selectedHandout}
        isDM={isDM}
        sessions={sessions}
        worldEntities={worldEntities}
        players={players}
        selectedPlayerIds={selectedPlayerIds}
        isSharing={shareHandout.isPending}
        isDeleting={deleteHandout.isPending}
        onTogglePlayer={(playerId) =>
          setSelectedPlayerIds(
            selectedPlayerIds.includes(playerId)
              ? selectedPlayerIds.filter((id) => id !== playerId)
              : [...selectedPlayerIds, playerId],
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
    );
  }

  function renderEmptyState() {
    void isLoading;
    return (
      <div className={`${innerSurfaceClass} flex min-h-[360px] items-center justify-center px-6 text-center`}>
        <div>
          <Archive className="mx-auto h-10 w-10 text-[hsl(32,18%,42%)]" />
          <h4 className="mt-4 font-['IM_Fell_English'] text-[30px] leading-none text-[hsl(38,42%,90%)]">
            {filteredHandouts.length === 0 && handouts.length === 0
              ? isDM
                ? 'The archive shelves are empty.'
                : 'No artifacts have been revealed yet.'
              : 'Select an artifact to open it.'}
          </h4>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[hsl(30,14%,58%)]">
            {isDM
              ? 'Create a story artifact to capture letters, maps, journals, and clues as the campaign unfolds.'
              : 'When the GM reveals a story artifact, it will appear here in the campaign archive.'}
          </p>
          {isDM && (
            <button
              type="button"
              onClick={startCreate}
              className={`${actionButtonClass(true)} mt-6`}
            >
              <Plus className="h-4 w-4" />
              New Artifact
            </button>
          )}
        </div>
      </div>
    );
  }
}

// ── ArtifactViewer ────────────────────────────────────────────────────────────

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
    <div className="space-y-4">
      {renderViewerBadges(handout, revealed)}
      {renderViewerContent(handout, linkedSessions, linkedEntities)}
      {isDM && renderViewerSidebar(handout, linkedSessions, players, selectedPlayerIds, isSharing, isDeleting, revealed)}
    </div>
  );

  function renderViewerBadges(h: Handout, isRevealed: boolean) {
    return (
      <div className="flex flex-wrap gap-2">
        <ViewerBadge icon={Gem} label={getArtifactLabel(h)} />
        <ViewerBadge icon={isRevealed ? Eye : Shield} label={getVisibilityLabel(h)} />
        <ViewerBadge icon={Archive} label={`Discovered ${formatRelative(h.createdAt)}`} />
        {isDM && (
          <div className="ml-auto flex flex-wrap gap-2">
            {isRevealed ? (
              <ActionChip icon={EyeOff} label="Hide Again" onClick={onHide} />
            ) : (
              <ActionChip icon={Eye} label="Reveal to All" onClick={onRevealAll} disabled={isSharing} />
            )}
            <ActionChip icon={Pencil} label="Edit" onClick={onEdit} />
            <ActionChip icon={Trash2} label="Delete" onClick={onDelete} tone="danger" disabled={isDeleting} />
          </div>
        )}
      </div>
    );
  }

  function renderViewerContent(h: Handout, lSessions: Session[], lEntities: WorldEntity[]) {
    return (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_320px]">
        {renderArtifactBody(h, lSessions, lEntities)}
        {renderMetadataSide(h, lSessions)}
      </div>
    );
  }

  function renderArtifactBody(h: Handout, lSessions: Session[], lEntities: WorldEntity[]) {
    return (
      <div className="space-y-4">
        <ArtifactSurface handout={h} />
        <div className={`${innerSurfaceClass} p-4`}>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            Campaign Connections
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lSessions.map((session) => (
              <LinkedPill
                key={session._id}
                label={`Session ${session.sessionNumber} — ${session.title ?? 'Untitled Session'}`}
              />
            ))}
            {lEntities.map((entity) => (
              <LinkedPill key={entity._id} label={`${getEntityLabel(entity)} — ${entity.name}`} />
            ))}
            {!lSessions.length && !lEntities.length && (
              <p className="text-sm text-[hsl(30,14%,56%)]">
                This artifact has not been attached to a session, NPC, location, or thread yet.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderMetadataSide(h: Handout, lSessions: Session[]) {
    return (
      <aside className="space-y-4">
        <MetadataCard title="Archive Notes">
          <MetadataRow label="Discovered" value={formatLongDate(h.createdAt)} />
          <MetadataRow label="Revealed" value={h.sharedAt ? formatLongDate(h.sharedAt) : 'Not yet'} />
          <MetadataRow label="Visibility" value={getVisibilityLabel(h)} />
          <MetadataRow
            label="Session revealed"
            value={
              lSessions[0]?.title ??
              findSessionById(sessions, h.sessionId)?.title ??
              'Not attached'
            }
          />
        </MetadataCard>
      </aside>
    );
  }

  function renderViewerSidebar(
    _h: Handout,
    _lSessions: Session[],
    pList: typeof players,
    selPlayerIds: string[],
    sharing: boolean,
    _deleting: boolean,
    _isRevealed: boolean,
  ) {
    if (!pList.length) return null;
    return (
      <div className={`${innerSurfaceClass} p-4`}>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
          Reveal to Players
        </p>
        <p className="mt-2 text-sm text-[hsl(30,14%,58%)]">
          Bring this artifact into the live session when the table discovers it.
        </p>
        <div className="mt-3 space-y-2">
          {pList.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => onTogglePlayer(player.id)}
              className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition ${
                selPlayerIds.includes(player.id)
                  ? 'border-[hsla(38,70%,58%,0.36)] bg-[hsla(38,70%,52%,0.12)] text-[hsl(38,78%,74%)]'
                  : 'border-[hsla(32,24%,24%,0.64)] bg-[hsla(22,18%,10%,0.72)] text-[hsl(34,22%,78%)]'
              }`}
            >
              <span>{player.username}</span>
              <span>{selPlayerIds.includes(player.id) ? 'Selected' : 'Reveal only'}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onRevealAll}
            disabled={sharing}
            className="flex-1 rounded-full border border-[hsla(150,52%,44%,0.32)] bg-[hsla(150,52%,44%,0.12)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(150,70%,76%)] disabled:opacity-50"
          >
            Reveal to All
          </button>
          <button
            type="button"
            onClick={onRevealSelected}
            disabled={!selPlayerIds.length || sharing}
            className="flex-1 rounded-full border border-[hsla(38,70%,58%,0.32)] bg-[hsla(38,70%,52%,0.12)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(38,78%,74%)] disabled:opacity-50"
          >
            Reveal Selected
          </button>
        </div>
      </div>
    );
  }
}

// ── ArtifactComposer ──────────────────────────────────────────────────────────

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
    <div className="mx-auto max-w-5xl space-y-5">
      {renderComposerHeader(mode)}
      <div className="space-y-5">
        {renderTitleAndSession()}
        {renderArtifactCabinet()}
        {renderComposerBottom()}
      </div>
    </div>
  );

  function renderComposerHeader(m: 'create' | 'edit') {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
          {m === 'create' ? 'Create Story Artifact' : 'Edit Story Artifact'}
        </p>
        <h3 className="mt-1 font-['IM_Fell_English'] text-[32px] text-[hsl(38,40%,90%)]">
          {m === 'create' ? 'Artifact Composer' : 'Restore the Artifact'}
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-[hsl(30,14%,58%)]">
          Shape the handout like an in-world object the table can discover, not a file upload.
        </p>
      </div>
    );
  }

  function renderTitleAndSession() {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <div className={`${innerSurfaceClass} p-4`}>
          <label className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            Artifact Title
          </label>
          <input
            value={draft.title}
            onChange={(event) => onChange({ ...draft, title: event.target.value })}
            placeholder="Letter from the Iron Syndicate"
            className={`${inputClass} mt-2`}
          />
        </div>
        <div className={`${innerSurfaceClass} p-4`}>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            Attach to Session
          </p>
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
    );
  }

  function renderArtifactCabinet() {
    return (
      <div className={`${innerSurfaceClass} p-4`}>
        {renderCabinetHeader()}
        <div className="mt-4 space-y-4">
          {ARTIFACT_GROUPS.map((group) => renderArtifactGroup(group))}
        </div>
      </div>
    );
  }

  function renderCabinetHeader() {
    return (
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            Artifact Cabinet
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(30,14%,58%)]">
            Choose the kind of story object you are preserving.
          </p>
        </div>
        <div className="rounded-[18px] border border-[hsla(38,70%,58%,0.22)] bg-[hsla(38,70%,52%,0.08)] px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            Selected Artifact
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-2xl border border-[hsla(38,70%,58%,0.24)] bg-[hsla(38,70%,52%,0.12)] p-2 text-[hsl(38,74%,72%)]">
              {createElement(getArtifactOptionIcon(draft.artifactKind), { className: 'h-4 w-4' })}
            </span>
            <div>
              <p className="font-[Cinzel] text-base text-[hsl(38,34%,86%)]">
                {ARTIFACT_KIND_OPTIONS.find((opt) => opt.value === draft.artifactKind)?.label ?? 'Artifact'}
              </p>
              <p className="text-xs text-[hsl(30,14%,56%)]">
                {draft.type === 'text'
                  ? 'Written artifact'
                  : draft.type === 'map'
                  ? 'Cartographic artifact'
                  : 'Visual artifact'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderArtifactGroup(group: (typeof ARTIFACT_GROUPS)[number]) {
    const options = ARTIFACT_KIND_OPTIONS.filter((opt) => group.values.includes(opt.value));
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
          {options.map((option) => renderKindButton(option))}
        </div>
      </section>
    );
  }

  function renderKindButton(option: (typeof ARTIFACT_KIND_OPTIONS)[number]) {
    const active = draft.artifactKind === option.value;
    return (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange({ ...draft, artifactKind: option.value, type: option.type })}
        className={`group relative overflow-hidden rounded-[20px] border px-4 py-4 text-left transition ${
          active
            ? 'border-[hsla(38,70%,58%,0.4)] bg-[linear-gradient(180deg,hsla(38,54%,22%,0.28),hsla(30,26%,12%,0.92))]'
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
            <p className="font-[Cinzel] text-lg leading-tight text-[hsl(38,30%,84%)]">
              {option.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-[hsl(30,14%,56%)]">{option.hint}</p>
          </div>
        </div>
        <div className="relative mt-4 flex items-center justify-between text-[11px] uppercase tracking-[0.18em]">
          <span className="text-[hsl(32,18%,50%)]">
            {option.type === 'text'
              ? 'Writing sample'
              : option.type === 'map'
              ? 'Map plate'
              : 'Visual plate'}
          </span>
          <span className={active ? 'text-[hsl(38,78%,74%)]' : 'text-[hsl(30,12%,58%)]'}>
            {active ? 'Selected' : 'Choose'}
          </span>
        </div>
      </button>
    );
  }

  function renderComposerBottom() {
    return (
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.15fr)_320px]">
        {renderComposerContentFields()}
        {renderComposerControls()}
      </div>
    );
  }

  function renderComposerContentFields() {
    return (
      <div className="space-y-5">
        {renderContentField()}
        {renderConnectionsField()}
      </div>
    );
  }

  function renderContentField() {
    if (draft.type === 'image' || draft.type === 'map') {
      return (
        <div className={`${innerSurfaceClass} p-4`}>
          <label className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
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
      );
    }
    return (
      <div className={`${innerSurfaceClass} p-4`}>
        <label className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
          In-world Writing
        </label>
        <textarea
          value={draft.content}
          onChange={(event) => onChange({ ...draft, content: event.target.value })}
          placeholder="Write the handout as the players should discover it..."
          rows={14}
          className={`${inputClass} mt-2 min-h-[320px] resize-y font-['IM_Fell_English'] leading-7`}
        />
      </div>
    );
  }

  function renderConnectionsField() {
    return (
      <div className={`${innerSurfaceClass} p-4`}>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
          Campaign Connections
        </p>
        <div className="mt-3 space-y-4">
          {ENTITY_SECTION_ORDER.map((section) => {
            const entities = worldEntities.filter((entity) => section.types.includes(entity.type));
            if (!entities.length) return null;
            return (
              <div key={section.label}>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
                  {section.label}
                </p>
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
    );
  }

  function renderComposerControls() {
    return (
      <aside className="space-y-5">
        <div className={`${innerSurfaceClass} p-4`}>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            Archive Controls
          </p>
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

        <div className={`${innerSurfaceClass} p-4`}>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            Current Artifact Path
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <LinkedPill
              label={
                ARTIFACT_KIND_OPTIONS.find((opt) => opt.value === draft.artifactKind)?.label ??
                'Artifact'
              }
            />
            {draft.sessionId && (
              <LinkedPill
                label={
                  sessions.find((session) => session._id === draft.sessionId)?.title ??
                  'Linked session'
                }
              />
            )}
            {draft.linkedEntityIds.slice(0, 3).map((entityId) => {
              const entity = worldEntities.find((item) => item._id === entityId);
              return entity ? (
                <LinkedPill key={entityId} label={`${getEntityLabel(entity)} — ${entity.name}`} />
              ) : null;
            })}
            {!draft.sessionId && draft.linkedEntityIds.length === 0 && (
              <p className="text-sm text-[hsl(30,14%,56%)]">No campaign ties selected yet.</p>
            )}
          </div>
        </div>
      </aside>
    );
  }
}

// ── ArtifactSurface ───────────────────────────────────────────────────────────

function ArtifactSurface({ handout }: { handout: Handout }) {
  const artifactLabel = getArtifactLabel(handout);

  if (handout.type === 'map' || handout.type === 'image') {
    return (
      <div className="overflow-hidden rounded-[26px] border border-[hsla(32,24%,24%,0.64)] bg-[hsla(20,18%,8%,0.78)]">
        <div className="flex items-center justify-between border-b border-[hsla(32,24%,24%,0.42)] px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            {artifactLabel}
          </p>
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
      <p className="text-center text-[11px] uppercase tracking-[0.3em] text-[hsl(24,18%,42%)]">
        {artifactLabel}
      </p>
      <div className="mx-auto mt-5 max-w-3xl font-['IM_Fell_English'] text-[21px] leading-9">
        {handout.artifactKind === 'letter' && (
          <p className="mb-6 text-[hsl(24,22%,38%)]">To the one meant to receive this,</p>
        )}
        {handout.artifactKind === 'journal' && (
          <p className="mb-6 text-[hsl(24,22%,38%)]">Journal entry</p>
        )}
        <div className="whitespace-pre-wrap">
          {handout.content || 'No text was preserved with this artifact.'}
        </div>
      </div>
    </div>
  );
}

// ── Small reusable components ─────────────────────────────────────────────────

function MetadataCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={`${innerSurfaceClass} p-4`}>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">{title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">{label}</p>
      <p className="mt-1 text-sm text-[hsl(36,22%,82%)]">{value}</p>
    </div>
  );
}

function ViewerBadge({ icon: Icon, label }: { icon: typeof Eye; label: string }) {
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

// ── Pure helpers ──────────────────────────────────────────────────────────────

function getArtifactLabel(handout: Pick<Handout, 'artifactKind' | 'type'>) {
  const kind = handout.artifactKind ?? inferArtifactKind(handout as Handout);
  return getArtifactLabelFromKind(kind);
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

function getVisibilityLabel(handout: Handout) {
  if (handout.visibleTo === 'all') return 'Revealed to players';
  if (handout.visibleTo === 'selected')
    return `Revealed to ${handout.sharedWith?.length ?? 0} player(s)`;
  return 'GM only';
}

function findSessionById(sessions: Session[], sessionId?: string) {
  if (!sessionId) return null;
  return sessions.find((session) => session._id === sessionId) ?? null;
}

function getEntityLabel(entity: WorldEntity) {
  if (entity.type === 'npc' || entity.type === 'npc_minor') return 'NPC';
  if (entity.type === 'location' || entity.type === 'location_detail') return 'Location';
  if (entity.type === 'quest') return 'Quest';
  if (entity.type === 'event') return 'Thread';
  if (entity.type === 'lore') return 'Lore';
  return 'World';
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id];
}

function uniqueIds(ids: Array<string | undefined>) {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function formatLongDate(value?: string) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
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
