import { useMemo } from 'react';
import { BookOpen, Flag, Activity, Clock } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { useArcs, useTrackers } from '@/hooks/useCampaigns';
import { useNavigationBus } from '@/components/v2/NavigationBusContext';
import { shellPanelClass } from '@/lib/panel-styles';
import type { Session, CampaignArc, WorldStateTracker } from '@/types/campaign';

// ── Types ────────────────────────────────────────────────

interface CampaignTimelineProps {
  campaignId: string;
  onTabChange?: (tab: string) => void;
}

interface TimelineArcDev {
  arcName: string;
  title: string;
  arcId: string;
}

interface TimelineTrackerAdj {
  trackerName: string;
  delta: number;
  valueBefore: number;
  valueAfter: number;
  reason?: string;
  trackerId: string;
}

interface TimelineSession {
  session: Session;
  arcDevelopments: TimelineArcDev[];
  trackerAdjustments: TimelineTrackerAdj[];
  keyMoments: string[];
}

interface UnattachedEvents {
  arcDevelopments: TimelineArcDev[];
  trackerAdjustments: TimelineTrackerAdj[];
}

// ── Helpers ──────────────────────────────────────────────

const MAX_SESSIONS = 30;

function buildTimeline(
  sessions: Session[],
  arcs: CampaignArc[],
  trackers: WorldStateTracker[],
): { timeline: TimelineSession[]; unattached: UnattachedEvents } {
  const sessionMap = new Map<string, number>();
  const sessionNumMap = new Map<number, string>();
  sessions.forEach((s) => {
    sessionMap.set(s._id, s.sessionNumber);
    sessionNumMap.set(s.sessionNumber, s._id);
  });

  const attachedArcDevIds = new Set<string>();
  const attachedTrackerKeys = new Set<string>();

  // Build per-session data
  const sorted = [...sessions]
    .sort((a, b) => b.sessionNumber - a.sessionNumber)
    .slice(0, MAX_SESSIONS);

  const timeline: TimelineSession[] = sorted.map((session) => {
    const arcDevelopments: TimelineArcDev[] = [];
    for (const arc of arcs) {
      for (const dev of arc.developments ?? []) {
        if (dev.sessionId === session._id) {
          arcDevelopments.push({ arcName: arc.name, title: dev.title, arcId: arc._id });
          attachedArcDevIds.add(dev._id);
        }
      }
    }

    const trackerAdjustments: TimelineTrackerAdj[] = [];
    for (const tracker of trackers) {
      for (const adj of tracker.adjustments ?? []) {
        if (adj.sessionNumber === session.sessionNumber) {
          const key = `${tracker._id}-${adj.createdAt}`;
          trackerAdjustments.push({
            trackerName: tracker.name,
            delta: adj.delta,
            valueBefore: adj.valueBefore,
            valueAfter: adj.valueAfter,
            reason: adj.reason,
            trackerId: tracker._id,
          });
          attachedTrackerKeys.add(key);
        }
      }
    }

    const keyMoments = session.statistics?.keyMoments ?? [];

    return { session, arcDevelopments, trackerAdjustments, keyMoments };
  });

  // Unattached events
  const unattachedArcDevs: TimelineArcDev[] = [];
  for (const arc of arcs) {
    for (const dev of arc.developments ?? []) {
      if (!attachedArcDevIds.has(dev._id)) {
        unattachedArcDevs.push({ arcName: arc.name, title: dev.title, arcId: arc._id });
      }
    }
  }

  const unattachedTrackerAdjs: TimelineTrackerAdj[] = [];
  for (const tracker of trackers) {
    for (const adj of tracker.adjustments ?? []) {
      const key = `${tracker._id}-${adj.createdAt}`;
      if (!attachedTrackerKeys.has(key)) {
        unattachedTrackerAdjs.push({
          trackerName: tracker.name,
          delta: adj.delta,
          valueBefore: adj.valueBefore,
          valueAfter: adj.valueAfter,
          reason: adj.reason,
          trackerId: tracker._id,
        });
      }
    }
  }

  return {
    timeline,
    unattached: { arcDevelopments: unattachedArcDevs, trackerAdjustments: unattachedTrackerAdjs },
  };
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function statusBadge(status: Session['status']) {
  const colors: Record<string, string> = {
    completed: 'bg-[hsla(130,40%,30%,0.5)] text-[hsl(130,50%,72%)]',
    in_progress: 'bg-[hsla(38,60%,30%,0.5)] text-[hsl(38,82%,63%)]',
    scheduled: 'bg-[hsla(205,40%,30%,0.5)] text-[hsl(205,80%,72%)]',
    planned: 'bg-[hsla(205,40%,30%,0.5)] text-[hsl(205,80%,72%)]',
    draft: 'bg-[hsla(30,14%,30%,0.4)] text-[hsl(30,14%,54%)]',
    ready: 'bg-[hsla(160,40%,30%,0.5)] text-[hsl(160,50%,68%)]',
    cancelled: 'bg-[hsla(0,30%,30%,0.4)] text-[hsl(0,40%,60%)]',
  };
  const labels: Record<string, string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    scheduled: 'Scheduled',
    planned: 'Planned',
    draft: 'Draft',
    ready: 'Ready',
    cancelled: 'Cancelled',
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${colors[status] ?? colors.draft}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

// ── Component ────────────────────────────────────────────

export function CampaignTimeline({ campaignId, onTabChange }: CampaignTimelineProps) {
  const { data: sessions = [], isLoading: loadingSessions } = useSessions(campaignId);
  const { data: arcs = [], isLoading: loadingArcs } = useArcs(campaignId);
  const { data: trackers = [], isLoading: loadingTrackers } = useTrackers(campaignId);
  const { requestNavigation } = useNavigationBus();

  const { timeline, unattached } = useMemo(
    () => buildTimeline(sessions, arcs, trackers),
    [sessions, arcs, trackers],
  );

  const isLoading = loadingSessions || loadingArcs || loadingTrackers;
  const hasUnattached = unattached.arcDevelopments.length > 0 || unattached.trackerAdjustments.length > 0;

  // Navigation handlers
  function navToSession(sessionId: string) {
    requestNavigation('sessions', sessionId);
    onTabChange?.('sessions');
  }

  function navToArc(arcId: string) {
    requestNavigation('arcs', arcId);
    onTabChange?.('arcs');
  }

  function navToTracker(trackerId: string) {
    requestNavigation('trackers', trackerId);
    onTabChange?.('trackers');
  }

  return (
    <div className={`flex h-full flex-col overflow-hidden ${shellPanelClass}`}>
      {renderHeader()}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {renderBody()}
      </div>
    </div>
  );

  // ── Render helpers (TS 5.9 compliance) ─────────────────

  function renderHeader() {
    return (
      <div className="flex-none border-b border-[hsla(32,24%,24%,0.46)] px-6 py-5">
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(30,14%,54%)]">
          Campaign Timeline
        </p>
        <div className="mt-1 flex items-center gap-3">
          <h2
            className="text-[28px] leading-none text-[hsl(38,26%,86%)]"
            style={{ fontFamily: "'IM Fell English', serif" }}
          >
            Campaign Story
          </h2>
          {sessions.length > 0 && (
            <span className="rounded-full bg-[hsla(38,40%,30%,0.4)] px-2.5 py-0.5 text-[11px] font-medium text-[hsl(38,82%,63%)]">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    );
  }

  function renderBody() {
    if (isLoading) {
      return (
        <div className="flex flex-1 items-center justify-center py-20">
          <Clock className="mr-2 h-4 w-4 animate-pulse text-[hsl(30,14%,40%)]" />
          <span className="text-sm text-[hsl(30,14%,40%)]">Loading timeline...</span>
        </div>
      );
    }

    if (sessions.length === 0) {
      return renderEmpty();
    }

    return (
      <div className="space-y-1 pt-4">
        {timeline.map((entry) => renderTimelineEntry(entry))}
        {hasUnattached && renderUnattached()}
      </div>
    );
  }

  function renderEmpty() {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Clock className="mb-3 h-8 w-8 text-[hsl(30,14%,30%)]" />
        <p className="text-sm text-[hsl(30,14%,54%)]">
          No sessions recorded yet.
        </p>
        <p className="mt-1 text-xs text-[hsl(30,14%,40%)]">
          Complete your first session to see the campaign timeline.
        </p>
      </div>
    );
  }

  function renderTimelineEntry(entry: TimelineSession) {
    const { session } = entry;
    const hasEvents =
      entry.keyMoments.length > 0 ||
      entry.arcDevelopments.length > 0 ||
      entry.trackerAdjustments.length > 0;

    return (
      <div key={session._id} className="relative pb-3">
        {renderSessionDivider(session)}
        {hasEvents && renderSessionEvents(entry)}
      </div>
    );
  }

  function renderSessionDivider(session: Session) {
    const dateStr = formatDate(session.completedAt ?? session.scheduledDate);
    return (
      <button
        type="button"
        onClick={() => navToSession(session._id)}
        className="group flex w-full items-center gap-3 border-l-2 border-[hsl(38,82%,63%)] py-2 pl-4 text-left transition-colors hover:bg-[hsla(38,30%,20%,0.15)]"
      >
        <span
          className="text-sm font-medium text-[hsl(38,26%,86%)] group-hover:text-[hsl(38,82%,63%)]"
          style={{ fontFamily: "'IM Fell English', serif" }}
        >
          Session {session.sessionNumber}
          {session.title ? ` — ${session.title}` : ''}
        </span>
        <span className="flex-1 border-t border-[hsla(32,24%,24%,0.3)]" />
        {dateStr && (
          <span className="text-[11px] text-[hsl(30,14%,46%)]">{dateStr}</span>
        )}
        {statusBadge(session.status)}
      </button>
    );
  }

  function renderSessionEvents(entry: TimelineSession) {
    return (
      <div className="ml-4 border-l border-[hsla(32,24%,24%,0.2)] pl-4 pt-1">
        {renderKeyMoments(entry.keyMoments)}
        {renderArcDevs(entry.arcDevelopments)}
        {renderTrackerAdjs(entry.trackerAdjustments)}
      </div>
    );
  }

  function renderKeyMoments(moments: string[]) {
    if (moments.length === 0) return null;
    return (
      <div className="space-y-0.5 pb-1">
        {moments.map((m, i) => (
          <div key={i} className="flex items-start gap-2 py-0.5">
            <BookOpen className="mt-0.5 h-3.5 w-3.5 flex-none text-[hsl(38,26%,86%)]" />
            <span className="text-xs leading-relaxed text-[hsl(38,26%,86%)]">{m}</span>
          </div>
        ))}
      </div>
    );
  }

  function renderArcDevs(devs: TimelineArcDev[]) {
    if (devs.length === 0) return null;
    return (
      <div className="space-y-0.5 pb-1">
        {devs.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navToArc(d.arcId);
            }}
            className="flex w-full items-start gap-2 py-0.5 text-left transition-colors hover:bg-[hsla(38,30%,20%,0.12)]"
          >
            <Flag className="mt-0.5 h-3.5 w-3.5 flex-none text-[hsl(38,82%,63%)]" />
            <span className="text-xs leading-relaxed text-[hsl(38,82%,63%)]">
              <span className="font-medium">{d.arcName}:</span> {d.title}
            </span>
          </button>
        ))}
      </div>
    );
  }

  function renderTrackerAdjs(adjs: TimelineTrackerAdj[]) {
    if (adjs.length === 0) return null;
    return (
      <div className="space-y-0.5 pb-1">
        {adjs.map((a, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navToTracker(a.trackerId);
            }}
            className="flex w-full items-start gap-2 py-0.5 text-left transition-colors hover:bg-[hsla(205,30%,20%,0.12)]"
          >
            <Activity className="mt-0.5 h-3.5 w-3.5 flex-none text-[hsl(205,80%,72%)]" />
            <span className="text-xs leading-relaxed text-[hsl(205,80%,72%)]">
              <span className="font-medium">{a.trackerName}</span>{' '}
              <span className={a.delta >= 0 ? 'text-[hsl(130,50%,60%)]' : 'text-[hsl(0,50%,65%)]'}>
                {a.delta >= 0 ? '+' : ''}{a.delta}
              </span>
              {' '}({a.valueBefore} → {a.valueAfter})
              {a.reason && <span className="text-[hsl(30,14%,46%)]"> — {a.reason}</span>}
            </span>
          </button>
        ))}
      </div>
    );
  }

  function renderUnattached() {
    return (
      <div className="mt-4 pt-2">
        <div className="flex items-center gap-3 py-2 pl-4">
          <span
            className="text-sm font-medium text-[hsl(30,14%,54%)]"
            style={{ fontFamily: "'IM Fell English', serif" }}
          >
            Other Events
          </span>
          <span className="flex-1 border-t border-[hsla(32,24%,24%,0.3)]" />
        </div>
        <div className="ml-4 border-l border-[hsla(32,24%,24%,0.2)] pl-4 pt-1">
          {renderArcDevs(unattached.arcDevelopments)}
          {renderTrackerAdjs(unattached.trackerAdjustments)}
        </div>
      </div>
    );
  }
}
