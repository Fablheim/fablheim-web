import { Eye, FileImage, FileText, Map, Plus, ScrollText } from 'lucide-react';
import {
  useHandoutsContext,
  ARTIFACT_KIND_OPTIONS,
  inferArtifactKind,
  type ArtifactKind,
} from './HandoutsContext';
import type { Handout } from '@/types/campaign';

// ── Style helpers ─────────────────────────────────────────────────────────────

function pillBtnClass(active: boolean) {
  return `rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition border ${
    active
      ? 'border-[hsla(38,70%,58%,0.34)] bg-[hsla(38,70%,52%,0.14)] text-[hsl(38,78%,74%)]'
      : 'border-[hsla(32,24%,28%,0.72)] bg-[hsla(24,18%,10%,0.7)] text-[hsl(30,12%,58%)]'
  }`;
}

function newHandoutBtnClass() {
  return 'inline-flex items-center gap-1.5 rounded-full border border-[hsla(38,70%,58%,0.34)] bg-[hsla(38,70%,52%,0.12)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[hsl(38,82%,72%)] transition hover:bg-[hsla(38,70%,52%,0.2)]';
}

// ── Icon helper ───────────────────────────────────────────────────────────────

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

function getHandoutIcon(handout: Handout) {
  const kind = handout.artifactKind ?? inferArtifactKind(handout);
  if (handout.type === 'image') return FileImage;
  return getArtifactOptionIcon(kind);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HandoutsRightPanel() {
  const {
    isDM,
    handouts,
    filteredHandouts,
    selectedHandoutId,
    composerMode,
    visibilityFilter,
    setVisibilityFilter,
    setSelectedHandoutId,
    setComposerMode,
    startCreate,
  } = useHandoutsContext();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {renderHeader()}
      {renderFilters()}
      {renderList()}
    </div>
  );

  function renderHeader() {
    const revealedCount = handouts.filter(
      (h) => h.visibleTo === 'all' || h.visibleTo === 'selected',
    ).length;
    const gmOnlyCount = handouts.filter((h) => h.visibleTo === 'dm_only').length;

    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          {renderCountPills(revealedCount, gmOnlyCount)}
          {isDM && (
            <button type="button" onClick={startCreate} className={newHandoutBtnClass()}>
              <Plus className="h-3.5 w-3.5" />
              New Handout
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderCountPills(revealedCount: number, gmOnlyCount: number) {
    return (
      <div className="flex gap-2">
        <CountPill value={String(handouts.length)} label="Total" tone="text-[hsl(38,74%,76%)]" />
        <CountPill value={String(revealedCount)} label="Revealed" tone="text-[hsl(146,44%,72%)]" />
        <CountPill value={String(gmOnlyCount)} label="GM Only" tone="text-[hsl(214,18%,72%)]" />
      </div>
    );
  }

  function renderFilters() {
    const filters: Array<{ value: typeof visibilityFilter; label: string }> = [
      { value: 'all', label: 'All' },
      { value: 'revealed', label: 'Revealed' },
      { value: 'gm_only', label: 'GM Only' },
    ];

    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-2">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setVisibilityFilter(f.value)}
              className={pillBtnClass(visibilityFilter === f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderList() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {filteredHandouts.length === 0 ? renderEmpty() : renderHandoutItems()}
      </div>
    );
  }

  function renderEmpty() {
    return (
      <p className="px-3 py-4 text-xs text-[hsl(30,12%,58%)]">
        {handouts.length === 0
          ? isDM
            ? 'No artifacts yet. Create the first handout.'
            : 'No artifacts have been revealed yet.'
          : 'No artifacts match the current filter.'}
      </p>
    );
  }

  function renderHandoutItems() {
    return (
      <div className="space-y-1">
        {filteredHandouts.map((handout) => renderHandoutButton(handout))}
      </div>
    );
  }

  function renderHandoutButton(handout: Handout) {
    const isSelected = selectedHandoutId === handout._id && !composerMode;
    const revealed = handout.visibleTo !== 'dm_only';
    const HIcon = getHandoutIcon(handout);
    const kindLabel =
      ARTIFACT_KIND_OPTIONS.find(
        (option) => option.value === (handout.artifactKind ?? inferArtifactKind(handout)),
      )?.label ?? 'Artifact';

    return (
      <button
        key={handout._id}
        type="button"
        onClick={() => {
          setComposerMode(null);
          setSelectedHandoutId(handout._id);
        }}
        className={`block w-full rounded-[12px] border px-2.5 py-2 text-left transition ${
          isSelected
            ? 'border-[hsla(42,72%,52%,0.36)] bg-[hsla(42,72%,42%,0.14)]'
            : 'border-[hsla(32,26%,26%,0.35)] bg-[hsla(26,16%,12%,0.6)] hover:border-[hsla(38,50%,58%,0.3)]'
        }`}
      >
        {renderHandoutTop(handout, HIcon, kindLabel, revealed)}
        {renderHandoutMeta(handout)}
      </button>
    );
  }

  function renderHandoutTop(
    handout: Handout,
    HIcon: typeof FileText,
    kindLabel: string,
    revealed: boolean,
  ) {
    return (
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded-xl border border-[hsla(32,24%,28%,0.74)] bg-[hsla(24,18%,8%,0.72)] p-1.5 text-[hsl(38,68%,70%)]">
          <HIcon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-[hsl(35,24%,90%)]">{handout.title}</p>
          <p className="mt-0.5 text-[10px] text-[hsl(30,12%,52%)]">{kindLabel}</p>
        </div>
        {renderRevealBadge(revealed)}
      </div>
    );
  }

  function renderRevealBadge(revealed: boolean) {
    return (
      <span
        className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] ${
          revealed
            ? 'border-[hsla(150,52%,44%,0.35)] bg-[hsla(150,52%,44%,0.12)] text-[hsl(150,66%,72%)]'
            : 'border-[hsla(215,20%,42%,0.35)] bg-[hsla(215,20%,42%,0.12)] text-[hsl(214,18%,72%)]'
        }`}
      >
        {revealed ? <Eye className="h-2.5 w-2.5" /> : null}
        {revealed ? 'Shared' : 'GM'}
      </span>
    );
  }

  function renderHandoutMeta(handout: Handout) {
    const session = null; // session label would need sessions from context; keep lightweight here
    void session;
    return (
      <p className="mt-1 text-[10px] text-[hsl(30,12%,48%)]">
        {handout.createdAt
          ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
              new Date(handout.createdAt),
            )
          : 'Unknown date'}
      </p>
    );
  }
}

// ── CountPill ─────────────────────────────────────────────────────────────────

function CountPill({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="rounded-full border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,9%,0.54)] px-2 py-1 text-center">
      <p className={`text-[11px] font-medium ${tone}`}>{value}</p>
      <p className="text-[9px] uppercase tracking-[0.14em] text-[hsl(30,12%,48%)]">{label}</p>
    </div>
  );
}
