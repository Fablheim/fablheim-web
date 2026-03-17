import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import {
  useSessionsContext,
  getEmptyCreateDraft,
  getStatusLabel,
  isUpcomingStatus,
  normalizePlanStatus,
  STATUS_STYLES,
  type SessionFilter,
} from './SessionsContext';

function btnClass(accent = false) {
  return `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] transition ${
    accent
      ? 'border-[hsla(42,72%,52%,0.38)] bg-[hsla(42,72%,42%,0.14)] text-[hsl(42,78%,80%)] hover:border-[hsla(42,72%,60%,0.46)]'
      : 'border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] text-[hsl(30,12%,62%)] hover:text-[hsl(38,24%,88%)]'
  }`;
}

const FILTER_OPTIONS: Array<{ value: SessionFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'planned', label: 'Planned' },
  { value: 'played', label: 'Played' },
];

export function SessionsRightPanel() {
  const {
    sortedSessions,
    filteredSessions,
    selectedSessionId,
    selectedSession,
    isCreating,
    nextSessionNumber,
    activeFilter,
    setActiveFilter,
    setSelectedSessionId,
    setIsCreating,
    setCreateDraft,
  } = useSessionsContext();

  const [query, setQuery] = useState('');

  const plannedCount = sortedSessions.filter((s) => isUpcomingStatus(s.status)).length;
  const playedCount = sortedSessions.filter((s) => !isUpcomingStatus(s.status)).length;

  const searchFilteredSessions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return filteredSessions;
    return filteredSessions.filter((session) => {
      return (
        (session.title ?? '').toLowerCase().includes(normalizedQuery) ||
        String(session.sessionNumber).includes(normalizedQuery) ||
        getStatusLabel(normalizePlanStatus(session.status)).toLowerCase().includes(normalizedQuery) ||
        (session.summary ?? '').toLowerCase().includes(normalizedQuery) ||
        (session.notes ?? '').toLowerCase().includes(normalizedQuery)
      );
    });
  }, [filteredSessions, query]);

  function startCreate() {
    setIsCreating(true);
    setCreateDraft(getEmptyCreateDraft(nextSessionNumber));
  }

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
            {renderCountPill(`${plannedCount}`, 'Planned', 'text-[hsl(205,80%,72%)]')}
            {renderCountPill(`${playedCount}`, 'Played', 'text-[hsl(150,62%,70%)]')}
          </div>
          <button type="button" onClick={startCreate} className={btnClass(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Session
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
            placeholder="Search sessions..."
            className="w-full rounded-xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(24,18%,10%,0.92)] py-1.5 pl-8 pr-3 text-[11px] text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,10%,44%)] outline-none transition focus:border-[hsla(42,64%,58%,0.58)]"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setActiveFilter(option.value)}
              className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] transition ${
                activeFilter === option.value
                  ? 'border-[hsla(42,64%,58%,0.62)] bg-[hsla(40,70%,52%,0.16)] text-[hsl(42,82%,78%)]'
                  : 'border-[hsla(32,24%,26%,0.62)] text-[hsl(30,12%,60%)] hover:border-[hsla(42,40%,46%,0.42)] hover:text-[hsl(38,24%,82%)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderList() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {searchFilteredSessions.length === 0 ? (
          <p className="px-3 py-4 text-xs text-[hsl(30,12%,58%)]">
            {sortedSessions.length === 0
              ? 'No sessions yet. Plan the first session.'
              : 'No sessions match this filter.'}
          </p>
        ) : (
          <div className="space-y-1">
            {searchFilteredSessions.map((session) => renderSessionButton(session))}
          </div>
        )}
      </div>
    );
  }

  function renderSessionButton(session: (typeof filteredSessions)[number]) {
    const isSelected =
      (selectedSessionId === session._id || selectedSession?._id === session._id) && !isCreating;
    const planStatus = normalizePlanStatus(session.status);

    return (
      <button
        key={session._id}
        type="button"
        onClick={() => {
          setIsCreating(false);
          setSelectedSessionId(session._id);
        }}
        className={`block w-full rounded-[12px] border px-2.5 py-2 text-left transition ${
          isSelected
            ? 'border-[hsla(42,72%,52%,0.36)] bg-[hsla(42,72%,42%,0.14)]'
            : 'border-[hsla(32,26%,26%,0.35)] bg-[hsla(26,16%,12%,0.6)] hover:border-[hsla(38,50%,58%,0.3)]'
        }`}
      >
        {renderSessionTop(session, planStatus)}
        {renderSessionDate(session)}
      </button>
    );
  }

  function renderSessionTop(
    session: (typeof filteredSessions)[number],
    planStatus: ReturnType<typeof normalizePlanStatus>,
  ) {
    return (
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <p className="text-[10px] text-[hsl(30,12%,52%)]">Session {session.sessionNumber}</p>
          <p className="truncate text-xs text-[hsl(35,24%,90%)]">
            {session.title?.trim() || `Session ${session.sessionNumber}`}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${STATUS_STYLES[planStatus]}`}
        >
          {getStatusLabel(planStatus)}
        </span>
      </div>
    );
  }

  function renderSessionDate(session: (typeof filteredSessions)[number]) {
    if (!session.scheduledDate) return null;
    const date = new Date(session.scheduledDate);
    if (Number.isNaN(date.getTime())) return null;
    const label = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
    return <p className="mt-0.5 text-[10px] text-[hsl(30,12%,48%)]">{label}</p>;
  }
}
