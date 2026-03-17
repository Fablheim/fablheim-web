import { useMemo, useState } from 'react';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import {
  useStoryArcsContext,
  ARC_TYPE_LABELS,
  ARC_PRESSURE_LABELS,
  STATUS_GROUP_KEY,
  STATUS_GROUP_LABEL,
  countLinks,
} from './StoryArcsContext';

type ArcShelfFilter = 'all' | 'active' | 'dormant' | 'resolved';

function btnClass(accent = false) {
  return `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] transition ${
    accent
      ? 'border-[hsla(42,72%,52%,0.38)] bg-[hsla(42,72%,42%,0.14)] text-[hsl(42,78%,80%)] hover:border-[hsla(42,72%,60%,0.46)]'
      : 'border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] text-[hsl(30,12%,62%)] hover:text-[hsl(38,24%,88%)]'
  }`;
}

const ACTIVE_STATUSES = new Set(['active', 'advancing', 'threatened']);
const DORMANT_STATUSES = new Set(['upcoming', 'dormant']);
const RESOLVED_STATUSES = new Set(['completed', 'resolved']);

export function StoryArcsRightPanel() {
  const {
    arcs,
    selectedArcId,
    isCreating,
    setSelectedArcId,
    setIsCreating,
    startCreate,
  } = useStoryArcsContext();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArcShelfFilter>('all');

  const activeCount = arcs.filter((arc) => ACTIVE_STATUSES.has(arc.status)).length;
  const dormantCount = arcs.filter((arc) => DORMANT_STATUSES.has(arc.status)).length;
  const resolvedCount = arcs.filter((arc) => RESOLVED_STATUSES.has(arc.status)).length;

  const filteredGroupedArcs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = arcs.filter((arc) => {
      // Text search
      if (normalizedQuery) {
        const matches =
          arc.name.toLowerCase().includes(normalizedQuery) ||
          (arc.description ?? '').toLowerCase().includes(normalizedQuery) ||
          (arc.currentState ?? '').toLowerCase().includes(normalizedQuery) ||
          (arc.recentChange ?? '').toLowerCase().includes(normalizedQuery);
        if (!matches) return false;
      }
      // Status filter
      if (statusFilter === 'active') return ACTIVE_STATUSES.has(arc.status);
      if (statusFilter === 'dormant') return DORMANT_STATUSES.has(arc.status);
      if (statusFilter === 'resolved') return RESOLVED_STATUSES.has(arc.status);
      return true;
    });

    // Re-group the filtered arcs the same way groupedArcs does
    const groups = new Map<string, typeof arcs>();
    for (const arc of filtered) {
      const groupKey = STATUS_GROUP_KEY[arc.status] ?? arc.status;
      const current = groups.get(groupKey) ?? [];
      current.push(arc);
      groups.set(groupKey, current);
    }

    const order = ['active', 'advancing', 'threatened', 'inactive', 'concluded'];
    return order
      .filter((key) => groups.has(key))
      .map((key) => ({
        groupKey: key,
        label: STATUS_GROUP_LABEL[key] ?? key,
        items: groups.get(key)!,
      }));
  }, [arcs, query, statusFilter]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {renderHeader()}
      {renderSearch()}
      {renderList()}
    </div>
  );

  function renderHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {renderCountPill(`${activeCount}`, 'Active', 'text-[hsl(42,78%,78%)]')}
            {renderCountPill(`${dormantCount}`, 'Dormant', 'text-[hsl(30,12%,58%)]')}
            {renderCountPill(`${resolvedCount}`, 'Resolved', 'text-[hsl(146,44%,72%)]')}
          </div>
          <button type="button" onClick={startCreate} className={btnClass(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Arc
          </button>
        </div>
      </div>
    );
  }

  function renderCountPill(value: string, label: string, tone: string) {
    return (
      <div className="rounded-full border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,9%,0.54)] px-2 py-1 text-center">
        <p className={`text-[11px] font-medium ${tone}`}>{value}</p>
        <p className="text-[9px] uppercase tracking-[0.14em] text-[hsl(30,12%,48%)]">{label}</p>
      </div>
    );
  }

  function renderSearch() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(30,12%,42%)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search arcs..."
            className="w-full rounded-xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(24,18%,10%,0.92)] py-1.5 pl-8 pr-3 text-[11px] text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,10%,44%)] outline-none transition focus:border-[hsla(42,64%,58%,0.58)]"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'All'],
              ['active', 'Active'],
              ['dormant', 'Dormant'],
              ['resolved', 'Resolved'],
            ] as Array<[ArcShelfFilter, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] transition ${
                statusFilter === value
                  ? 'border-[hsla(42,64%,58%,0.62)] bg-[hsla(40,70%,52%,0.16)] text-[hsl(42,82%,78%)]'
                  : 'border-[hsla(32,24%,26%,0.62)] text-[hsl(30,12%,60%)] hover:border-[hsla(42,40%,46%,0.42)] hover:text-[hsl(38,24%,82%)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderList() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {filteredGroupedArcs.length === 0 ? (
          <p className="px-3 py-4 text-xs text-[hsl(30,12%,58%)]">
            {arcs.length === 0
              ? 'No story arcs yet. Create the first thread.'
              : 'No arcs match this filter.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredGroupedArcs.map((group) => renderGroup(group))}
          </div>
        )}
      </div>
    );
  }

  function renderGroup(group: { groupKey: string; label: string; items: typeof arcs }) {
    return (
      <div
        key={group.groupKey}
        className="rounded-[16px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,9%,0.54)] p-2"
      >
        <p className="px-1.5 pb-1.5 font-[Cinzel] text-xs text-[hsl(38,32%,86%)]">
          {group.label}
        </p>
        <div className="space-y-1">
          {group.items.map((arc) => {
            const isSelected = selectedArcId === arc._id && !isCreating;
            return (
              <button
                key={arc._id}
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setSelectedArcId(arc._id);
                }}
                className={`block w-full rounded-[12px] border px-2.5 py-2 text-left transition ${
                  isSelected
                    ? 'border-[hsla(42,72%,52%,0.36)] bg-[hsla(42,72%,42%,0.14)]'
                    : 'border-[hsla(32,26%,26%,0.35)] bg-[hsla(26,16%,12%,0.6)] hover:border-[hsla(38,50%,58%,0.3)]'
                }`}
              >
                {renderArcButtonTop(arc)}
                {renderArcButtonMeta(arc)}
                {renderArcButtonSnippet(arc)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderArcButtonTop(arc: (typeof arcs)[number]) {
    return (
      <div className="flex items-start justify-between gap-1.5">
        <p className="truncate text-xs text-[hsl(35,24%,90%)]">{arc.name}</p>
        <span className="shrink-0 rounded-full border border-[hsla(32,24%,24%,0.38)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-[hsl(212,24%,66%)]">
          {countLinks(arc)}
        </span>
      </div>
    );
  }

  function renderArcButtonMeta(arc: (typeof arcs)[number]) {
    return (
      <p className="mt-0.5 text-[10px] text-[hsl(30,12%,52%)]">
        {ARC_TYPE_LABELS[arc.type ?? 'custom']} · {ARC_PRESSURE_LABELS[arc.pressure ?? 'quiet']}
      </p>
    );
  }

  function renderArcButtonSnippet(arc: (typeof arcs)[number]) {
    const snippet = arc.currentState || arc.recentChange || arc.description;
    if (!snippet && arc.pressure !== 'escalating') return null;
    return (
      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[hsl(30,12%,50%)]">
        {arc.pressure === 'escalating' && (
          <AlertTriangle className="h-3 w-3 shrink-0 text-[hsl(8,58%,72%)]" />
        )}
        {snippet && <span className="line-clamp-1">{snippet}</span>}
      </div>
    );
  }
}
