import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { ActivityStatus, ActivityType, DowntimeActivity } from '@/types/downtime';
import { useDowntimeContext } from './DowntimeContext';

type DowntimeShelfFilter = 'all' | 'active' | 'planned' | 'completed';

const STATUS_META: Record<ActivityStatus, { label: string; tone: string }> = {
  planned: { label: 'Planned', tone: 'text-[hsl(212,24%,72%)]' },
  active: { label: 'Active', tone: 'text-[hsl(42,78%,78%)]' },
  completed: { label: 'Completed', tone: 'text-[hsl(146,44%,72%)]' },
  cancelled: { label: 'Cancelled', tone: 'text-[hsl(8,58%,72%)]' },
};

const TYPE_META: Record<ActivityType, string> = {
  crafting: 'Crafting',
  training: 'Training',
  carousing: 'Carousing',
  research: 'Research',
  working: 'Work',
  recuperating: 'Recovery',
  travel: 'Travel',
  faction_work: 'Faction Work',
  business: 'Business',
  other: 'Custom',
};

function computeProgress(activity: DowntimeActivity) {
  const total = Math.max(1, activity.durationDays || 1);
  const current = Math.min(total, activity.progressDays || 0);
  return {
    value: Math.round((current / total) * 100),
    label: `${current} / ${total} days`,
  };
}

function groupActivitiesByParticipant(activities: DowntimeActivity[]) {
  const groups = new Map<string, { key: string; name: string; participantType: string; activities: DowntimeActivity[] }>();
  for (const activity of activities) {
    const key = `${activity.participantType}:${activity.participantId}`;
    const group = groups.get(key) ?? {
      key,
      name: activity.participantName ?? 'Unknown',
      participantType: activity.participantType,
      activities: [],
    };
    group.activities.push(activity);
    groups.set(key, group);
  }
  return [...groups.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function btnClass(accent = false) {
  return `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] transition ${
    accent
      ? 'border-[hsla(42,72%,52%,0.38)] bg-[hsla(42,72%,42%,0.14)] text-[hsl(42,78%,80%)] hover:border-[hsla(42,72%,60%,0.46)]'
      : 'border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] text-[hsl(30,12%,62%)] hover:text-[hsl(38,24%,88%)]'
  }`;
}

export function DowntimeRightPanel() {
  const { activities, selectedActivityId, workspaceMode, setSelectedActivityId, setWorkspaceMode, startCreate } =
    useDowntimeContext();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DowntimeShelfFilter>('all');

  const filteredActivities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return activities.filter((activity) => {
      // Text search
      if (normalizedQuery) {
        const matches =
          activity.name.toLowerCase().includes(normalizedQuery) ||
          (activity.participantName ?? '').toLowerCase().includes(normalizedQuery) ||
          (activity.type ? TYPE_META[activity.type] : '').toLowerCase().includes(normalizedQuery) ||
          (activity.description ?? '').toLowerCase().includes(normalizedQuery);
        if (!matches) return false;
      }
      // Status filter
      if (statusFilter === 'active') return activity.status === 'active';
      if (statusFilter === 'planned') return activity.status === 'planned';
      if (statusFilter === 'completed') return activity.status === 'completed';
      return true;
    });
  }, [activities, query, statusFilter]);

  const groupedActivities = useMemo(() => groupActivitiesByParticipant(filteredActivities), [filteredActivities]);

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
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Participant Ledger</p>
          <button type="button" onClick={startCreate} className={btnClass(true)}>
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>
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
            placeholder="Search activities..."
            className="w-full rounded-xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(24,18%,10%,0.92)] py-1.5 pl-8 pr-3 text-[11px] text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,10%,44%)] outline-none transition focus:border-[hsla(42,64%,58%,0.58)]"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'All'],
              ['active', 'Active'],
              ['planned', 'Planned'],
              ['completed', 'Completed'],
            ] as Array<[DowntimeShelfFilter, string]>
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
        {groupedActivities.length === 0 ? (
          <p className="px-3 py-4 text-xs text-[hsl(30,12%,58%)]">
            {activities.length === 0
              ? 'No activities logged yet.'
              : 'No activities match this filter.'}
          </p>
        ) : (
          <div className="space-y-2">
            {groupedActivities.map((group) => renderGroup(group))}
          </div>
        )}
      </div>
    );
  }

  function renderGroup(group: { key: string; name: string; participantType: string; activities: DowntimeActivity[] }) {
    return (
      <div
        key={group.key}
        className="rounded-[16px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,9%,0.54)] p-2"
      >
        <div className="px-1.5 pb-1.5">
          <p className="font-[Cinzel] text-xs text-[hsl(38,32%,86%)]">{group.name}</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(30,12%,52%)]">{group.participantType}</p>
        </div>
        <div className="space-y-1">
          {group.activities.map((activity) => renderActivityRow(activity))}
        </div>
      </div>
    );
  }

  function renderActivityRow(activity: DowntimeActivity) {
    const progress = computeProgress(activity);
    const isSelected = selectedActivityId === activity._id && workspaceMode === 'detail';
    return (
      <button
        key={activity._id}
        type="button"
        onClick={() => {
          setWorkspaceMode('detail');
          setSelectedActivityId(activity._id);
        }}
        className={`block w-full rounded-[12px] border px-2.5 py-2 text-left transition ${
          isSelected
            ? 'border-[hsla(42,72%,52%,0.36)] bg-[hsla(42,72%,42%,0.14)]'
            : 'border-[hsla(32,26%,26%,0.35)] bg-[hsla(26,16%,12%,0.6)] hover:border-[hsla(38,50%,58%,0.3)]'
        }`}
      >
        {renderActivityRowTop(activity)}
        <p className="mt-0.5 text-[10px] text-[hsl(30,12%,52%)]">{TYPE_META[activity.type]}</p>
        {renderActivityProgress(progress)}
      </button>
    );
  }

  function renderActivityRowTop(activity: DowntimeActivity) {
    return (
      <div className="flex items-start justify-between gap-1.5">
        <p className="truncate text-xs text-[hsl(35,24%,90%)]">{activity.name}</p>
        <span className={`shrink-0 text-[9px] uppercase tracking-[0.16em] ${STATUS_META[activity.status].tone}`}>
          {STATUS_META[activity.status].label}
        </span>
      </div>
    );
  }

  function renderActivityProgress(progress: { value: number; label: string }) {
    return (
      <div className="mt-1.5">
        <div className="h-1.5 rounded-full bg-[hsla(32,24%,14%,0.82)]">
          <div
            className="h-1.5 rounded-full bg-[linear-gradient(90deg,hsla(42,72%,58%,0.88),hsla(35,72%,48%,0.78))]"
            style={{ width: `${progress.value}%` }}
          />
        </div>
        <p className="mt-0.5 text-[9px] text-[hsl(30,12%,50%)]">{progress.label}</p>
      </div>
    );
  }
}
