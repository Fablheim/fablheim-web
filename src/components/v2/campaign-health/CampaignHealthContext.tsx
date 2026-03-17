import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  BookOpen,
  Flag,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useCampaign, useArcs, useTrackers } from '@/hooks/useCampaigns';
import { useSessions } from '@/hooks/useSessions';
import { useEncounters } from '@/hooks/useEncounters';
import { useDowntimeActivities } from '@/hooks/useDowntime';
import { useCharacters } from '@/hooks/useCharacters';
import { useAllies } from '@/hooks/useAllies';
import { useHandouts } from '@/hooks/useHandouts';
import type { CalendarEvent, CampaignArc, CampaignCalendar, Handout, Session, WorldStateTracker } from '@/types/campaign';
import type { Encounter } from '@/types/encounter';
import type { DowntimeActivity } from '@/types/downtime';

// ── Types ────────────────────────────────────────────────────────────────────

export type HealthDomainId =
  | 'session-momentum'
  | 'narrative-health'
  | 'world-pressure'
  | 'party-state'
  | 'prep-coverage';

export type HealthTone = 'strong' | 'stable' | 'building' | 'quiet' | 'light' | 'escalating' | 'needs-attention';

export type HealthDomain = {
  id: HealthDomainId;
  label: string;
  tone: HealthTone;
  summary: string;
  note: string;
  countLabel?: string;
  icon: typeof BookOpen;
};

// ── Context value ─────────────────────────────────────────────────────────────

interface CampaignHealthContextValue {
  campaignId: string;
  onTabChange: (tab: string) => void;

  campaign: ReturnType<typeof useCampaign>['data'];
  sessions: Session[];
  arcs: CampaignArc[];
  trackers: WorldStateTracker[];
  encounters: Encounter[];
  downtime: DowntimeActivity[];
  characters: Array<{ _id: string; name: string }>;
  allies: Array<{ _id: string; name: string }>;
  handouts: Handout[];

  health: ReturnType<typeof computeCampaignHealth>;
  selectedDomain: HealthDomainId;
  setSelectedDomain: (id: HealthDomainId) => void;
  activeDomain: HealthDomain;
}

const CampaignHealthContext = createContext<CampaignHealthContextValue | null>(null);

export function useCampaignHealthContext() {
  const ctx = useContext(CampaignHealthContext);
  if (!ctx) throw new Error('useCampaignHealthContext must be used within CampaignHealthProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function CampaignHealthProvider({
  campaignId,
  onTabChange,
  children,
}: {
  campaignId: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
}) {
  const { data: campaign } = useCampaign(campaignId);
  const { data: sessionsData } = useSessions(campaignId);
  const { data: arcsData } = useArcs(campaignId);
  const { data: trackersData } = useTrackers(campaignId);
  const { data: encountersData } = useEncounters(campaignId);
  const { data: downtimeData } = useDowntimeActivities(campaignId);
  const { data: charactersData } = useCharacters(campaignId);
  const { data: alliesData } = useAllies(campaignId);
  const { data: handoutsData } = useHandouts(campaignId);

  const sessions = useMemo(() => sessionsData ?? [], [sessionsData]);
  const arcs = useMemo(() => arcsData ?? [], [arcsData]);
  const trackers = useMemo(() => trackersData ?? [], [trackersData]);
  const encounters = useMemo(() => encountersData ?? [], [encountersData]);
  const downtime = useMemo(() => downtimeData ?? [], [downtimeData]);
  const characters = useMemo(() => charactersData ?? [], [charactersData]);
  const allies = useMemo(() => alliesData ?? [], [alliesData]);
  const handouts = useMemo(() => handoutsData ?? [], [handoutsData]);

  const health = useMemo(
    () =>
      computeCampaignHealth({
        campaign,
        sessions,
        arcs,
        trackers,
        encounters,
        downtime,
        characters,
        allies,
        handouts,
      }),
    [campaign, sessions, arcs, trackers, encounters, downtime, characters, allies, handouts],
  );

  const [selectedDomain, setSelectedDomain] = useState<HealthDomainId>('session-momentum');

  const activeDomain = health.domains.find((domain) => domain.id === selectedDomain) ?? health.domains[0];

  const value: CampaignHealthContextValue = {
    campaignId,
    onTabChange,
    campaign,
    sessions,
    arcs,
    trackers,
    encounters,
    downtime,
    characters,
    allies,
    handouts,
    health,
    selectedDomain,
    setSelectedDomain,
    activeDomain,
  };

  return <CampaignHealthContext.Provider value={value}>{children}</CampaignHealthContext.Provider>;
}

// ── computeCampaignHealth ────────────────────────────────────────────────────

export function computeCampaignHealth({
  campaign,
  sessions,
  arcs,
  trackers,
  encounters,
  downtime,
  characters,
  allies,
  handouts,
}: {
  campaign: ReturnType<typeof useCampaign>['data'];
  sessions: Session[];
  arcs: CampaignArc[];
  trackers: WorldStateTracker[];
  encounters: Encounter[];
  downtime: DowntimeActivity[];
  characters: Array<{ _id: string; name: string }>;
  allies: Array<{ _id: string; name: string }>;
  handouts: Handout[];
}) {
  const sessionMomentum = buildSessionMomentumSummary(sessions);
  const narrativeHealth = buildNarrativeHealthSummary(arcs, sessions);
  const worldPressure = buildWorldPressureSummary(campaign?.calendar, trackers, downtime);
  const partyState = buildPartyStateSummary(characters, allies, downtime);
  const prepCoverage = buildPrepCoverageSummary(campaign, encounters, handouts, downtime, sessions);

  const domains: HealthDomain[] = [
    {
      id: 'session-momentum',
      label: 'Session Momentum',
      tone: sessionMomentum.tone,
      summary: sessionMomentum.summary,
      note: sessionMomentum.note,
      countLabel: `${sessionMomentum.completedCount} completed`,
      icon: BookOpen,
    },
    {
      id: 'narrative-health',
      label: 'Narrative Health',
      tone: narrativeHealth.tone,
      summary: narrativeHealth.summary,
      note: narrativeHealth.note,
      countLabel: `${narrativeHealth.activeCount} active arcs`,
      icon: Flag,
    },
    {
      id: 'world-pressure',
      label: 'World Pressure',
      tone: worldPressure.tone,
      summary: worldPressure.summary,
      note: worldPressure.note,
      countLabel: `${worldPressure.escalatingTrackers} escalating`,
      icon: Activity,
    },
    {
      id: 'party-state',
      label: 'Party State',
      tone: partyState.tone,
      summary: partyState.summary,
      note: partyState.note,
      countLabel: `${partyState.characterCount} characters`,
      icon: Users,
    },
    {
      id: 'prep-coverage',
      label: 'Prep Coverage',
      tone: prepCoverage.tone,
      summary: prepCoverage.summary,
      note: prepCoverage.note,
      countLabel: `${prepCoverage.readyEncounters} ready encounters`,
      icon: ShieldCheck,
    },
  ];

  const tones = domains.map((domain) => domain.tone);
  const headline =
    tones.includes('needs-attention')
      ? 'Needs attention'
      : tones.includes('escalating')
        ? 'Pressure is building'
        : tones.includes('strong')
          ? 'Strong forward motion'
          : 'Stable, with room to deepen prep';

  const headlineNote =
    tones.includes('needs-attention')
      ? 'One or more campaign areas are going quiet or missing follow-through, so the page is calling those out first.'
      : tones.includes('escalating')
        ? 'The campaign has active pressure in motion, and several systems are showing forward movement.'
        : 'The campaign has enough structure in place to keep moving, even if some surfaces are still light.';

  const pulseLine = `${sessionMomentum.summary}. ${narrativeHealth.summary}. ${worldPressure.summary}.`;

  return {
    headline,
    headlineNote,
    pulseLine,
    domains,
    sessionMomentum,
    narrativeHealth,
    worldPressure,
    partyState,
    prepCoverage,
  };
}

// ── Summary builders ─────────────────────────────────────────────────────────

export function buildSessionMomentumSummary(sessions: Session[]) {
  const completed = sessions.filter((session) => session.status === 'completed');
  const planned = [...sessions]
    .filter((session) => ['draft', 'scheduled', 'ready', 'planned'].includes(session.status))
    .sort((left, right) => getSessionSortTime(left) - getSessionSortTime(right));
  const nextSession = planned[0] ?? null;
  const latestCompleted = [...completed].sort((left, right) => getSessionSortTime(right) - getSessionSortTime(left))[0] ?? null;

  const recapCovered = completed.filter((session) => Boolean(session.aiSummary?.summary || session.aiRecap || session.summary));
  const prepItems = nextSession?.prepChecklist ?? [];
  const prepDone = prepItems.filter((item) => item.completed).length;
  const prepRatio = prepItems.length > 0 ? prepDone / prepItems.length : null;
  const cadence = latestCompleted?.completedAt ?? latestCompleted?.scheduledDate;
  const daysSinceLast = cadence ? diffFromToday(cadence) : null;

  let tone: HealthTone = 'stable';
  if (!nextSession && completed.length === 0) tone = 'light';
  else if (!nextSession || (daysSinceLast != null && daysSinceLast > 30)) tone = 'needs-attention';
  else if (prepRatio != null && prepRatio >= 0.75 && recapCovered.length >= Math.max(1, completed.length - 1)) tone = 'strong';
  else if (prepRatio != null && prepRatio < 0.4) tone = 'building';

  return {
    tone,
    completedCount: completed.length,
    summary:
      !nextSession && completed.length === 0
        ? 'The campaign has not established a clear session rhythm yet'
        : nextSession && prepRatio != null && prepRatio >= 0.75
          ? 'Session momentum looks ready to carry forward'
          : nextSession
            ? 'There is a next session on the horizon, but prep still needs shape'
            : 'Recent play exists, but the next session is not yet anchored',
    note:
      nextSession
        ? `${nextSession.title || `Session ${nextSession.sessionNumber}`} is the clearest next point of momentum.`
        : 'Without a scheduled or ready next session, campaign rhythm can start to drift.',
    nextSessionLabel: nextSession ? nextSession.title || `Session ${nextSession.sessionNumber}` : 'Not scheduled',
    readinessLabel:
      nextSession && prepRatio != null
        ? `${prepDone}/${prepItems.length} prep items complete`
        : nextSession
          ? 'No prep checklist on the next session yet'
          : 'Create or schedule the next session to restore momentum',
    recapCoverageLabel:
      completed.length > 0
        ? `${recapCovered.length}/${completed.length} completed sessions have recap coverage`
        : 'No recap history yet',
    cadenceLabel:
      daysSinceLast == null ? 'No cadence yet' : `${daysSinceLast} day${daysSinceLast === 1 ? '' : 's'} since last completed`,
    cadenceNote:
      daysSinceLast == null
        ? 'Once sessions are completed, cadence becomes easier to read.'
        : daysSinceLast > 30
          ? 'It has been a while since the last completed session.'
          : 'Recent play cadence still feels alive.',
    recentSessionLines: [...completed]
      .sort((left, right) => getSessionSortTime(right) - getSessionSortTime(left))
      .slice(0, 4)
      .map((session) => {
        const recap = session.aiSummary?.summary || session.aiRecap || session.summary;
        return `${session.title || `Session ${session.sessionNumber}`} — ${recap ? 'recap captured' : 'no recap yet'}${session.completedAt ? ` · completed ${formatDate(session.completedAt)}` : ''}`;
      }),
  };
}

export function buildNarrativeHealthSummary(arcs: CampaignArc[], sessions: Session[]) {
  const activeCount = arcs.filter((arc) => ['active', 'advancing', 'threatened'].includes(arc.status)).length;
  const dormantCount = arcs.filter((arc) => ['dormant', 'upcoming'].includes(arc.status)).length;
  const pressureCount = arcs.filter((arc) => arc.status === 'threatened' || arc.pressure === 'escalating').length;
  const advancingCount = arcs.filter((arc) => arc.status === 'advancing').length;
  const unresolvedHooks = sessions.flatMap((session) => session.aiSummary?.unresolvedHooks ?? []).filter(Boolean);
  const unresolvedHookCount = new Set(unresolvedHooks).size;

  let tone: HealthTone = 'stable';
  if (pressureCount >= 2) tone = 'escalating';
  else if (dormantCount > activeCount && dormantCount > 0) tone = 'needs-attention';
  else if (advancingCount > 0 || activeCount > 0) tone = 'building';
  else tone = 'quiet';

  const attentionLines = [
    ...arcs
      .filter((arc) => arc.status === 'threatened' || arc.status === 'dormant' || arc.pressure === 'escalating')
      .slice(0, 4)
      .map((arc) => `${arc.name} — ${arc.status.replace('_', ' ')}${arc.recentChange ? ` · ${arc.recentChange}` : ''}`),
    ...Array.from(new Set(unresolvedHooks)).slice(0, 3).map((hook) => `Unresolved hook — ${hook}`),
  ];

  return {
    tone,
    activeCount,
    dormantCount,
    pressureCount,
    advancingCount,
    unresolvedHookCount,
    summary:
      activeCount === 0 && unresolvedHookCount === 0
        ? 'Story threads are quiet right now'
        : pressureCount > 0
          ? 'Narrative pressure is building across active arcs'
          : dormantCount > activeCount
            ? 'Several threads are sitting dormant'
            : 'The campaign still has active narrative motion',
    note:
      unresolvedHookCount > 0
        ? 'Session summary hooks are helping reveal where loose threads may be piling up.'
        : 'Arc statuses are the main narrative-health signal currently available.',
    attentionLines,
  };
}

export function buildWorldPressureSummary(
  calendar: CampaignCalendar | null | undefined,
  trackers: WorldStateTracker[],
  downtime: DowntimeActivity[],
) {
  const escalatingTrackers = trackers.filter((tracker) => getTrackerPercent(tracker) >= 70 && tracker.value < tracker.max).length;
  const activeDowntime = downtime.filter((activity) => ['planned', 'active'].includes(activity.status)).length;
  const upcomingCalendarEvents = calendar
    ? calendar.events.filter((event: CalendarEvent) => diffCalendarDays(calendar, calendar.currentDate, event) >= 0 && diffCalendarDays(calendar, calendar.currentDate, event) <= 14)
    : [];

  let tone: HealthTone = 'quiet';
  if (escalatingTrackers > 0 || upcomingCalendarEvents.length > 0) tone = 'escalating';
  else if (trackers.length > 0 || activeDowntime > 0) tone = 'building';

  return {
    tone,
    escalatingTrackers,
    totalTrackers: trackers.length,
    upcomingEvents: upcomingCalendarEvents.length,
    activeDowntime,
    summary:
      escalatingTrackers > 0
        ? 'World pressure is escalating'
        : upcomingCalendarEvents.length > 0
          ? 'Calendar pressure is approaching'
          : trackers.length > 0 || activeDowntime > 0
            ? 'The world is in motion, but not yet urgent'
            : 'No major world pressure is currently being tracked',
    note:
      calendar
        ? 'This domain reads from trackers, downtime, and the campaign calendar.'
        : 'This domain currently depends mostly on trackers and downtime because no campaign calendar is initialized.',
    pressureLines: trackers
      .slice()
      .sort((left, right) => getTrackerPercent(right) - getTrackerPercent(left))
      .slice(0, 4)
      .map((tracker) => `${tracker.name} — ${tracker.value}/${tracker.max}${getTrackerPercent(tracker) >= 70 ? ' · escalating' : ''}`),
    eventLines: upcomingCalendarEvents
      .slice(0, 4)
      .map((event: CalendarEvent) => `${event.name} — in ${diffCalendarDays(calendar as CampaignCalendar, (calendar as CampaignCalendar).currentDate, event)} day(s)`),
    calendarLabel: calendar ? 'Uses active calendar events and deadlines.' : 'No campaign calendar initialized.',
  };
}

export function buildPartyStateSummary(
  characters: Array<{ _id: string; name: string }>,
  allies: Array<{ _id: string; name: string }>,
  downtime: DowntimeActivity[],
) {
  const activeActivities = downtime.filter((activity) => ['planned', 'active'].includes(activity.status));
  const charactersInDowntime = new Set(
    activeActivities
      .filter((activity) => activity.participantType === 'character')
      .map((activity) => activity.participantId),
  ).size;

  let tone: HealthTone = 'stable';
  if (characters.length === 0) tone = 'needs-attention';
  else if (charactersInDowntime === 0 && allies.length === 0) tone = 'quiet';

  return {
    tone,
    characterCount: characters.length,
    allyCount: allies.length,
    charactersInDowntime,
    summary:
      characters.length === 0
        ? 'The party roster is not established yet'
        : charactersInDowntime > 0
          ? 'The party still has visible activity between adventures'
          : allies.length > 0
            ? 'The party roster is stable, with support around them'
            : 'The party is present, but current activity is lightly tracked',
    note:
      'Party state is currently strongest where the data model tracks characters, allies, and downtime participation.',
    rosterLabel: characters.length > 0 ? 'Established' : 'Unbuilt',
    rosterNote:
      characters.length > 0
        ? `${characters.length} characters are in the campaign roster.`
        : 'Create player characters to make party-state signals more useful.',
    rosterLines: characters.slice(0, 5).map((character) => character.name),
    activityLines: [
      ...activeActivities.slice(0, 4).map((activity) => `${activity.participantName} — ${activity.name}`),
      ...allies.slice(0, 3).map((ally) => `${ally.name} — companion or allied support on file`),
    ],
  };
}

export function buildPrepCoverageSummary(
  campaign: ReturnType<typeof useCampaign>['data'],
  encounters: Encounter[],
  handouts: Handout[],
  downtime: DowntimeActivity[],
  sessions: Session[],
) {
  const readyEncounters = encounters.filter((encounter) => encounter.status === 'ready').length;
  const linkedHandouts = handouts.filter((handout) => (handout.linkedEntityIds?.length ?? 0) > 0 || (handout.linkedSessionIds?.length ?? 0) > 0).length;
  const revealedHandouts = handouts.filter((handout) => handout.visibleTo !== 'dm_only').length;
  const activeDowntime = downtime.filter((activity) => ['planned', 'active'].includes(activity.status)).length;
  const nextSession = sessions.find((session) => ['draft', 'scheduled', 'ready', 'planned'].includes(session.status)) ?? null;
  const prepChecklistCount = nextSession?.prepChecklist?.length ?? 0;
  const safetySignals = campaign?.safetyTools
    ? [
        (campaign.safetyTools.lines?.length ?? 0) > 0,
        (campaign.safetyTools.veils?.length ?? 0) > 0,
        Boolean(campaign.safetyTools.xCardEnabled),
        Boolean(campaign.safetyTools.openDoorEnabled),
      ].filter(Boolean).length
    : 0;

  let tone: HealthTone = 'light';
  if (readyEncounters > 0 && linkedHandouts > 0 && campaign?.calendar && safetySignals > 0) tone = 'strong';
  else if (readyEncounters > 0 || linkedHandouts > 0 || prepChecklistCount > 0 || activeDowntime > 0) tone = 'stable';

  return {
    tone,
    readyEncounters,
    totalEncounters: encounters.length,
    linkedHandouts,
    revealedHandouts,
    summary:
      tone === 'strong'
        ? 'Prep coverage is broad across the campaign shell'
        : tone === 'stable'
          ? 'Prep coverage is present, but some surfaces are still light'
          : 'Only a thin slice of the prep surfaces is being used right now',
    note:
      'This domain reads from encounters, handouts, downtime, safety tools, the calendar, and next-session prep checklist coverage.',
    coverageLabel: healthToneLabel(tone),
    coverageNote:
      prepChecklistCount > 0
        ? `${prepChecklistCount} checklist item(s) are attached to the next planned session.`
        : 'The next session does not yet have a prep checklist attached.',
    surfaceLines: [
      `${encounters.length} encounter record(s), ${readyEncounters} marked ready`,
      campaign?.calendar ? 'Calendar initialized and available for world time' : 'Calendar not initialized yet',
      activeDowntime > 0 ? `${activeDowntime} downtime activity entries are in motion` : 'No downtime currently in motion',
    ],
    handoutLines: handouts.slice(0, 4).map((handout) => `${handout.title} — ${handout.visibleTo === 'dm_only' ? 'GM only' : 'revealed'}`),
    safetyLines:
      safetySignals > 0
        ? [
            `${campaign?.safetyTools?.lines?.length ?? 0} line(s) recorded`,
            `${campaign?.safetyTools?.veils?.length ?? 0} veil(s) recorded`,
            campaign?.safetyTools?.xCardEnabled ? 'X-Card enabled' : 'X-Card not enabled',
          ]
        : [],
  };
}

// ── Pure helpers ─────────────────────────────────────────────────────────────

export function getTrackerPercent(tracker: WorldStateTracker) {
  const range = Math.max(1, tracker.max - tracker.min);
  return ((tracker.value - tracker.min) / range) * 100;
}

function getSessionSortTime(session: Session) {
  return new Date(session.scheduledDate ?? session.completedAt ?? session.createdAt).getTime();
}

function diffFromToday(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function diffCalendarDays(
  calendar: CampaignCalendar,
  from: { year: number; month: number; day: number },
  to: { year: number; month: number; day: number },
) {
  const fromAbs = toAbsoluteDay(calendar, from);
  const toAbs = toAbsoluteDay(calendar, to);
  return toAbs - fromAbs;
}

function toAbsoluteDay(
  calendar: CampaignCalendar,
  date: { year: number; month: number; day: number },
) {
  const daysPerYear = calendar.months.reduce((sum, month) => sum + month.days, 0);
  let total = date.year * daysPerYear;
  for (let index = 0; index < date.month; index += 1) {
    total += calendar.months[index].days;
  }
  total += date.day - 1;
  return total;
}

export function healthToneLabel(tone: HealthTone) {
  switch (tone) {
    case 'strong':
      return 'Strong';
    case 'stable':
      return 'Stable';
    case 'building':
      return 'Building';
    case 'quiet':
      return 'Quiet';
    case 'light':
      return 'Light';
    case 'escalating':
      return 'Escalating';
    case 'needs-attention':
      return 'Needs attention';
  }
}

export function healthToneBadgeClass(tone: HealthTone) {
  switch (tone) {
    case 'strong':
      return 'border-[hsla(145,42%,42%,0.42)] bg-[hsla(145,42%,18%,0.22)] text-[hsl(145,58%,74%)]';
    case 'stable':
      return 'border-[hsla(210,28%,42%,0.42)] bg-[hsla(210,28%,18%,0.22)] text-[hsl(210,48%,76%)]';
    case 'building':
      return 'border-[hsla(42,52%,42%,0.42)] bg-[hsla(42,52%,18%,0.22)] text-[hsl(42,72%,78%)]';
    case 'quiet':
      return 'border-[hsla(220,10%,28%,0.42)] bg-[hsla(220,10%,14%,0.22)] text-[hsl(220,12%,72%)]';
    case 'light':
      return 'border-[hsla(32,18%,28%,0.42)] bg-[hsla(32,18%,14%,0.22)] text-[hsl(32,18%,72%)]';
    case 'escalating':
      return 'border-[hsla(12,58%,42%,0.42)] bg-[hsla(12,48%,18%,0.22)] text-[hsl(12,72%,78%)]';
    case 'needs-attention':
      return 'border-[hsla(0,58%,42%,0.42)] bg-[hsla(0,48%,18%,0.22)] text-[hsl(6,72%,78%)]';
  }
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
