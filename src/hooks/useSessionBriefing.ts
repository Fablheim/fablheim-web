import { useMemo } from 'react';
import type {
  CampaignArc,
  ArcDevelopment,
  WorldStateTracker,
  TrackerThreshold,
  CalendarEvent,
  Session,
  Handout,
} from '@/types/campaign';
import type { Encounter } from '@/types/encounter';
import type { DowntimeActivity } from '@/types/downtime';
import { useArcs, useTrackers, useCampaign } from './useCampaigns';
import { useEncounters } from './useEncounters';
import { useDowntimeActivities } from './useDowntime';
import { useHandouts } from './useHandouts';
import { diffInDays } from '@/components/v2/calendar/CalendarPrepContext';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ArcBriefing {
  arc: CampaignArc;
  linkedToSession: boolean;
  recentDevelopment: ArcDevelopment | null;
}

export interface TrackerAlert {
  tracker: WorldStateTracker;
  percent: number;
  activeThreshold: TrackerThreshold | null;
}

export interface ApproachingEvent {
  event: CalendarEvent;
  daysAway: number;
}

export interface DowntimeBriefing {
  activity: DowntimeActivity;
  participantName: string;
  isCompleted: boolean;
}

export interface ArcDevelopmentDiff {
  arcName: string;
  arcId: string;
  development: ArcDevelopment;
}

export interface SessionDiff {
  priorSessionNumber: number;
  arcDevelopments: ArcDevelopmentDiff[];
  completedDowntime: DowntimeBriefing[];
  hasDiff: boolean;
}

export interface SessionBriefing {
  arcs: ArcBriefing[];
  trackerAlerts: TrackerAlert[];
  approachingEvents: ApproachingEvent[];
  linkedEncounters: Encounter[];
  linkedHandouts: Handout[];
  recentDowntime: DowntimeBriefing[];
  unresolvedHooks: string[];
  diff: SessionDiff | null;
  isEmpty: boolean;
}

const EMPTY: SessionBriefing = {
  arcs: [],
  trackerAlerts: [],
  approachingEvents: [],
  linkedEncounters: [],
  linkedHandouts: [],
  recentDowntime: [],
  unresolvedHooks: [],
  diff: null,
  isEmpty: true,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const ACTIVE_ARC_STATUSES = new Set(['active', 'advancing', 'threatened']);

function latestDevelopment(arc: CampaignArc): ArcDevelopment | null {
  if (!arc.developments?.length) return null;
  return [...arc.developments].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  )[0];
}

function findActiveThreshold(tracker: WorldStateTracker): TrackerThreshold | null {
  if (!tracker.thresholds?.length) return null;
  const applicable = tracker.thresholds
    .filter((t) => t.value <= tracker.value)
    .sort((a, b) => b.value - a.value);
  return applicable[0] ?? null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSessionBriefing(
  campaignId: string,
  session: Session | null,
  priorSession: Session | null,
): SessionBriefing {
  const { data: arcsData } = useArcs(campaignId);
  const { data: trackersData } = useTrackers(campaignId);
  const { data: campaignData } = useCampaign(campaignId);
  const { data: encountersData } = useEncounters(campaignId);
  const { data: downtimeData } = useDowntimeActivities(campaignId);
  const { data: handoutsData } = useHandouts(campaignId);

  return useMemo(() => {
    if (!session) return EMPTY;

    const allArcs = (arcsData ?? []) as CampaignArc[];
    const allTrackers = (trackersData ?? []) as WorldStateTracker[];
    const allEncounters = (encountersData ?? []) as Encounter[];
    const allDowntime = (downtimeData ?? []) as DowntimeActivity[];
    const calendar = campaignData?.calendar ?? null;

    // ── Arcs: active/advancing/threatened OR explicitly linked ──
    const arcs: ArcBriefing[] = allArcs
      .filter(
        (arc) =>
          ACTIVE_ARC_STATUSES.has(arc.status) ||
          arc.links?.sessionIds?.includes(session._id),
      )
      .map((arc) => ({
        arc,
        linkedToSession: arc.links?.sessionIds?.includes(session._id) ?? false,
        recentDevelopment: latestDevelopment(arc),
      }));

    // ── Trackers at >60% ──
    const trackerAlerts: TrackerAlert[] = allTrackers
      .filter((t) => t.max > 0 && t.value / t.max > 0.6)
      .map((tracker) => ({
        tracker,
        percent: tracker.value / tracker.max,
        activeThreshold: findActiveThreshold(tracker),
      }))
      .sort((a, b) => b.percent - a.percent);

    // ── Approaching calendar events (within 14 in-world days) ──
    const approachingEvents: ApproachingEvent[] = [];
    if (calendar?.currentDate && calendar.events?.length) {
      for (const event of calendar.events) {
        if (event.status === 'completed') continue;
        const dist = diffInDays(calendar, calendar.currentDate, {
          year: event.year,
          month: event.month,
          day: event.day,
        });
        if (dist >= 0 && dist <= 14) {
          approachingEvents.push({ event, daysAway: dist });
        }
      }
      approachingEvents.sort((a, b) => a.daysAway - b.daysAway);
    }

    // ── Linked encounters ──
    const linkedEncounters = allEncounters.filter(
      (e) => e.sessionId === session._id,
    );

    // ── Linked handouts ──
    const allHandouts = (handoutsData ?? []) as Handout[];
    const linkedHandouts = allHandouts.filter(
      (h) => h.sessionId === session._id || h.linkedSessionIds?.includes(session._id),
    );

    // ── Recent downtime (completed since prior session, or all completed if no prior) ──
    const priorCompletedAt = priorSession?.completedAt
      ? new Date(priorSession.completedAt).getTime()
      : 0;
    const recentDowntime: DowntimeBriefing[] = allDowntime
      .filter((a) => {
        if (a.status === 'completed') {
          return priorCompletedAt
            ? new Date(a.updatedAt).getTime() > priorCompletedAt
            : true;
        }
        return a.status === 'active';
      })
      .slice(0, 5)
      .map((activity) => ({
        activity,
        participantName: activity.participantName ?? 'Unknown',
        isCompleted: activity.status === 'completed',
      }));

    // ── Unresolved hooks from prior session ──
    const unresolvedHooks = priorSession?.aiSummary?.unresolvedHooks ?? [];

    // ── "Since Last Session" diff ──
    let diff: SessionDiff | null = null;
    if (priorSession?.completedAt) {
      const cutoff = new Date(priorSession.completedAt).getTime();

      const arcDevelopments: ArcDevelopmentDiff[] = [];
      for (const arc of allArcs) {
        for (const dev of arc.developments ?? []) {
          if (dev.createdAt && new Date(dev.createdAt).getTime() > cutoff) {
            arcDevelopments.push({ arcName: arc.name, arcId: arc._id, development: dev });
          }
        }
      }
      arcDevelopments.sort(
        (a, b) => new Date(a.development.createdAt ?? 0).getTime() - new Date(b.development.createdAt ?? 0).getTime(),
      );

      const completedDowntime: DowntimeBriefing[] = allDowntime
        .filter((a) => a.status === 'completed' && new Date(a.updatedAt).getTime() > cutoff)
        .slice(0, 5)
        .map((activity) => ({
          activity,
          participantName: activity.participantName ?? 'Unknown',
          isCompleted: true,
        }));

      const hasDiff = arcDevelopments.length > 0 || completedDowntime.length > 0;
      if (hasDiff) {
        diff = {
          priorSessionNumber: priorSession.sessionNumber,
          arcDevelopments,
          completedDowntime,
          hasDiff,
        };
      }
    }

    const isEmpty =
      arcs.length === 0 &&
      trackerAlerts.length === 0 &&
      approachingEvents.length === 0 &&
      linkedEncounters.length === 0 &&
      linkedHandouts.length === 0 &&
      recentDowntime.length === 0 &&
      unresolvedHooks.length === 0 &&
      !diff;

    return {
      arcs,
      trackerAlerts,
      approachingEvents,
      linkedEncounters,
      linkedHandouts,
      recentDowntime,
      unresolvedHooks,
      diff,
      isEmpty,
    };
  }, [session, priorSession, arcsData, trackersData, campaignData, encountersData, downtimeData, handoutsData]);
}
