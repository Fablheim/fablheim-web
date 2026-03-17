import { useState } from 'react';
import type { ComponentType } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  Flag,
  KeyRound,
  Swords,
  TrendingUp,
} from 'lucide-react';
import type { EntityTimeline, TimelineEntry, TimelineSourceType } from '@/hooks/useEntityTimeline';

// ── Props ────────────────────────────────────────────────────────────────────

interface EntityTimelineSectionProps {
  timeline: EntityTimeline;
  onNavigate?: (sourceType: string, sourceId: string) => void;
}

// ── Icon map ─────────────────────────────────────────────────────────────────

const SOURCE_ICONS: Record<TimelineSourceType, ComponentType<{ className?: string }>> = {
  session: BookOpen,
  encounter: Swords,
  arc_development: Flag,
  discovery: Eye,
  secret_reveal: KeyRound,
  objective_complete: CheckCircle2,
  reputation_change: TrendingUp,
};

const SOURCE_COLORS: Record<TimelineSourceType, string> = {
  session: 'text-[hsl(205,80%,72%)]',
  encounter: 'text-[hsl(0,72%,72%)]',
  arc_development: 'text-[hsl(38,82%,63%)]',
  discovery: 'text-[hsl(150,62%,70%)]',
  secret_reveal: 'text-[hsl(280,60%,72%)]',
  objective_complete: 'text-[hsl(150,62%,70%)]',
  reputation_change: 'text-[hsl(205,80%,72%)]',
};

// ── Component ────────────────────────────────────────────────────────────────

export function EntityTimelineSection({ timeline, onNavigate }: EntityTimelineSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (timeline.totalCount === 0) return null;

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center gap-1.5 text-left"
        >
          <Clock className="h-3.5 w-3.5 text-[hsl(30,12%,58%)]" />
          <h3 className="text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]">
            Appearance Timeline ({timeline.totalCount})
          </h3>
          {collapsed ? (
            <ChevronRight className="ml-auto h-3 w-3 text-[hsl(30,12%,50%)]" />
          ) : (
            <ChevronDown className="ml-auto h-3 w-3 text-[hsl(30,12%,50%)]" />
          )}
        </button>
        <p className="text-[11px] leading-relaxed text-[hsl(30,13%,62%)]">
          Where this entity has appeared across sessions, encounters, and story arcs.
        </p>
      </div>
      {!collapsed && (
        <div className="space-y-1">
          {timeline.entries.map((entry, i) => (
            <TimelineRow key={`${entry.sourceType}-${entry.sourceId}-${i}`} entry={entry} onNavigate={onNavigate} />
          ))}
          {timeline.totalCount > timeline.entries.length && (
            <p className="px-1 text-[11px] text-[hsl(30,12%,50%)]">
              Showing {timeline.entries.length} of {timeline.totalCount}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function TimelineRow({ entry, onNavigate }: { entry: TimelineEntry; onNavigate?: (sourceType: string, sourceId: string) => void }) {
  const Icon = SOURCE_ICONS[entry.sourceType];
  const color = SOURCE_COLORS[entry.sourceType];
  const navigableTypes: Set<TimelineSourceType> = new Set(['session', 'encounter', 'arc_development']);
  const isClickable = !!onNavigate && !!entry.sourceId && navigableTypes.has(entry.sourceType);

  const className = isClickable
    ? 'flex w-full gap-2 rounded-lg px-1 py-1.5 text-left cursor-pointer hover:bg-[hsla(32,20%,20%,0.4)] transition'
    : 'flex gap-2 rounded-lg px-1 py-1.5';

  const content = (
    <>
      <Icon className={`mt-0.5 h-3 w-3 shrink-0 ${color}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-[hsl(38,26%,86%)]">
          {entry.label}
        </p>
        {entry.excerpt && (
          <p className="line-clamp-1 text-[11px] text-[hsl(30,12%,58%)]">
            {entry.excerpt}
          </p>
        )}
      </div>
    </>
  );

  if (isClickable) {
    return (
      <button
        type="button"
        onClick={() => onNavigate(entry.sourceType, entry.sourceId)}
        className={className}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
