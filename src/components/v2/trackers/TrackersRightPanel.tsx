import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTrackersContext, getActiveThreshold, getProgress, type ShelfFilter } from './TrackersContext';

export function TrackersRightPanel() {
  const {
    isDM,
    allVisibleTrackers,
    selectedTrackerId,
    isLoading,
    isError,
    refetch,
    summary,
    openCreate,
    openTracker,
  } = useTrackersContext();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ShelfFilter>('all');

  const visibleTrackers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allVisibleTrackers
      .filter((tracker) => {
        if (!normalizedQuery) return true;
        return (
          tracker.name.toLowerCase().includes(normalizedQuery) ||
          (tracker.description ?? '').toLowerCase().includes(normalizedQuery) ||
          getActiveThreshold(tracker)?.label.toLowerCase().includes(normalizedQuery)
        );
      })
      .filter((tracker) => {
        if (filter === 'all') return true;
        if (filter === 'resolved') return tracker.value >= tracker.max;
        if (filter === 'rising') return tracker.value < tracker.max;
        if (filter === 'public') return tracker.visibility === 'public';
        if (filter === 'gm-only') return tracker.visibility === 'dm-only';
        return true;
      });
  }, [allVisibleTrackers, query, filter]);

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
          {renderCounts()}
          {isDM && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-full border border-[hsla(42,72%,52%,0.38)] bg-[hsla(42,72%,42%,0.14)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[hsl(42,78%,80%)] transition hover:border-[hsla(42,72%,60%,0.46)]"
            >
              <Plus className="h-3.5 w-3.5" />
              New Tracker
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderCounts() {
    return (
      <div className="flex gap-2">
        {renderCountPill(String(summary.rising), 'Rising', 'text-[hsl(42,78%,78%)]')}
        {renderCountPill(String(summary.withThresholds), 'Threshold', 'text-[hsl(30,12%,58%)]')}
        {renderCountPill(String(summary.resolved), 'Resolved', 'text-[hsl(146,44%,72%)]')}
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
            placeholder="Search trackers..."
            className="w-full rounded-xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(24,18%,10%,0.92)] py-1.5 pl-8 pr-3 text-[11px] text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,10%,44%)] outline-none transition focus:border-[hsla(42,64%,58%,0.58)]"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'All'],
              ['rising', 'Rising'],
              ['resolved', 'Resolved'],
              ['public', 'Public'],
              ['gm-only', 'GM Only'],
            ] as Array<[ShelfFilter, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] transition ${
                filter === value
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
        {renderListContent()}
      </div>
    );
  }

  function renderListContent() {
    if (isLoading) {
      return (
        <p className="px-3 py-4 text-xs text-[hsl(30,12%,58%)]">Loading trackers…</p>
      );
    }
    if (isError) {
      return (
        <div className="px-3 py-4 text-center">
          <p className="text-xs text-[hsl(30,12%,58%)]">Failed to load trackers.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[hsl(42,72%,72%)] hover:text-[hsl(42,82%,82%)]"
          >
            Try again
          </button>
        </div>
      );
    }
    if (visibleTrackers.length === 0) {
      return (
        <p className="px-3 py-4 text-xs text-[hsl(30,12%,58%)]">
          {allVisibleTrackers.length === 0
            ? 'No trackers yet. Create the first meter.'
            : 'No trackers match this filter.'}
        </p>
      );
    }
    return (
      <div className="space-y-1.5">
        {visibleTrackers.map((tracker) => renderTrackerButton(tracker))}
      </div>
    );
  }

  function renderTrackerButton(tracker: (typeof visibleTrackers)[number]) {
    const progress = getProgress(tracker);
    const threshold = getActiveThreshold(tracker);
    const isSelected = tracker._id === selectedTrackerId;

    return (
      <button
        key={tracker._id}
        type="button"
        onClick={() => openTracker(tracker._id)}
        className={`block w-full rounded-[12px] border px-2.5 py-2 text-left transition ${
          isSelected
            ? 'border-[hsla(42,72%,52%,0.36)] bg-[hsla(42,72%,42%,0.14)]'
            : 'border-[hsla(32,26%,26%,0.35)] bg-[hsla(26,16%,12%,0.6)] hover:border-[hsla(38,50%,58%,0.3)]'
        }`}
      >
        {renderTrackerTop(tracker, threshold, progress)}
        {renderTrackerBar(progress)}
        {renderTrackerFooter(tracker)}
      </button>
    );
  }

  function renderTrackerTop(
    tracker: (typeof visibleTrackers)[number],
    threshold: ReturnType<typeof getActiveThreshold>,
    progress: ReturnType<typeof getProgress>,
  ) {
    return (
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs text-[hsl(35,24%,90%)]">{tracker.name}</p>
          <p className="mt-0.5 text-[10px] text-[hsl(30,12%,52%)]">
            {threshold ? threshold.label : progress.statusLabel}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[hsla(32,24%,24%,0.38)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[hsl(38,24%,74%)]">
          {tracker.value}/{tracker.max}
        </span>
      </div>
    );
  }

  function renderTrackerBar(progress: ReturnType<typeof getProgress>) {
    return (
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsla(24,14%,16%,0.9)]">
        <div
          className={`h-full rounded-full ${progress.fillClass}`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    );
  }

  function renderTrackerFooter(tracker: (typeof visibleTrackers)[number]) {
    return (
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.14em] text-[hsl(30,12%,48%)]">
        <span>{tracker.visibility === 'public' ? 'Public' : 'GM Only'}</span>
        <span>{tracker.thresholds.length} thresholds</span>
      </div>
    );
  }
}
