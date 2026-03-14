import { useMemo, useState } from 'react';
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
import type { CampaignArc, Handout, Session, WorldStateTracker } from '@/types/campaign';
import type { Encounter } from '@/types/encounter';
import type { DowntimeActivity } from '@/types/downtime';

interface CampaignHealthDeskV2Props {
  campaignId: string;
  onTabChange: (tab: string) => void;
}

type HealthDomainId =
  | 'session-momentum'
  | 'narrative-health'
  | 'world-pressure'
  | 'party-state'
  | 'prep-coverage';

type HealthTone = 'strong' | 'stable' | 'building' | 'quiet' | 'light' | 'escalating' | 'needs-attention';

type HealthDomain = {
  id: HealthDomainId;
  label: string;
  tone: HealthTone;
  summary: string;
  note: string;
  countLabel?: string;
  icon: typeof BookOpen;
};

const panelClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.68)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(20,24%,8%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]';

export function CampaignHealthDeskV2({
  campaignId,
  onTabChange,
}: CampaignHealthDeskV2Props) {
  const { data: campaign } = useCampaign(campaignId);
  const { data: sessions } = useSessions(campaignId);
  const { data: arcs } = useArcs(campaignId);
  const { data: trackers } = useTrackers(campaignId);
  const { data: encounters } = useEncounters(campaignId);
  const { data: downtime } = useDowntimeActivities(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const { data: allies } = useAllies(campaignId);
  const { data: handouts } = useHandouts(campaignId);

  const health = useMemo(
    () =>
      computeCampaignHealth({
        campaign,
        sessions: sessions ?? [],
        arcs: arcs ?? [],
        trackers: trackers ?? [],
        encounters: encounters ?? [],
        downtime: downtime ?? [],
        characters: characters ?? [],
        allies: allies ?? [],
        handouts: handouts ?? [],
      }),
    [campaign, sessions, arcs, trackers, encounters, downtime, characters, allies, handouts],
  );

  const [selectedDomain, setSelectedDomain] = useState<HealthDomainId>('session-momentum');

  const activeDomain = health.domains.find((domain) => domain.id === selectedDomain) ?? health.domains[0];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsla(42,40%,24%,0.12),transparent_28%),linear-gradient(180deg,hsl(224,18%,8%)_0%,hsl(20,20%,7%)_100%)] text-[hsl(38,24%,88%)]">
      <header className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(38,30%,60%)]">Campaign Review Desk</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,42%,90%)]">
              Campaign Health
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-[hsl(30,14%,66%)]">
              {health.pulseLine}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickNavButton label="Review Next Session" onClick={() => onTabChange('sessions')} />
            <QuickNavButton label="Open Story Arcs" onClick={() => onTabChange('arcs')} />
            <QuickNavButton label="Open Trackers" onClick={() => onTabChange('trackers')} />
            <QuickNavButton label="Open Calendar" onClick={() => onTabChange('calendar')} />
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">
        <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={`${panelClass} min-h-0 overflow-hidden`}>
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Health Overview</p>
                <h3 className="mt-1 font-[Cinzel] text-2xl text-[hsl(38,34%,88%)]">Campaign Pulse</h3>
                <div className="mt-4 rounded-[18px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.62)] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(30,12%,56%)]">Current Read</p>
                  <p className="mt-2 font-[Cinzel] text-xl text-[hsl(38,38%,88%)]">{health.headline}</p>
                  <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,68%)]">{health.headlineNote}</p>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                <div className="space-y-2">
                  {health.domains.map((domain) => (
                    <button
                      key={domain.id}
                      type="button"
                      onClick={() => setSelectedDomain(domain.id)}
                      className={`w-full rounded-[20px] border px-4 py-3 text-left transition ${
                        selectedDomain === domain.id
                          ? 'border-[hsla(42,64%,58%,0.58)] bg-[linear-gradient(180deg,hsla(40,64%,52%,0.16)_0%,hsla(24,22%,12%,0.9)_100%)]'
                          : 'border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] hover:border-[hsla(42,42%,46%,0.38)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <domain.icon className="h-4 w-4 text-[hsl(42,72%,72%)]" />
                            <p className="font-[Cinzel] text-base text-[hsl(38,32%,88%)]">{domain.label}</p>
                          </div>
                          <p className="mt-2 text-sm text-[hsl(38,26%,78%)]">{domain.summary}</p>
                          <p className="mt-1 text-xs leading-6 text-[hsl(30,12%,56%)]">{domain.note}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${toneBadgeClass(domain.tone)}`}>
                            {toneLabel(domain.tone)}
                          </div>
                          {domain.countLabel && (
                            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[hsl(30,12%,52%)]">
                              {domain.countLabel}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className={`${panelClass} min-h-0 overflow-y-auto`}>
            <div className="px-5 py-5">
              <div className="border-b border-[hsla(32,24%,24%,0.4)] pb-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Health Workspace</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <activeDomain.icon className="h-5 w-5 text-[hsl(42,72%,72%)]" />
                  <h3 className="font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">
                    {activeDomain.label}
                  </h3>
                  <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${toneBadgeClass(activeDomain.tone)}`}>
                    {toneLabel(activeDomain.tone)}
                  </span>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[hsl(30,14%,66%)]">
                  {activeDomain.note}
                </p>
              </div>

              {selectedDomain === 'session-momentum' && (
                <SessionMomentumWorkspace
                  summary={health.sessionMomentum}
                  onOpenSessions={() => onTabChange('sessions')}
                />
              )}
              {selectedDomain === 'narrative-health' && (
                <NarrativeHealthWorkspace
                  summary={health.narrativeHealth}
                  onOpenArcs={() => onTabChange('arcs')}
                />
              )}
              {selectedDomain === 'world-pressure' && (
                <WorldPressureWorkspace
                  summary={health.worldPressure}
                  onOpenTrackers={() => onTabChange('trackers')}
                  onOpenCalendar={() => onTabChange('calendar')}
                />
              )}
              {selectedDomain === 'party-state' && (
                <PartyStateWorkspace
                  summary={health.partyState}
                  onOpenPlayers={() => onTabChange('players')}
                  onOpenDowntime={() => onTabChange('downtime')}
                />
              )}
              {selectedDomain === 'prep-coverage' && (
                <PrepCoverageWorkspace
                  summary={health.prepCoverage}
                  onOpenEncounters={() => onTabChange('encounters')}
                  onOpenHandouts={() => onTabChange('handouts')}
                  onOpenSafety={() => onTabChange('safety-tools')}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SessionMomentumWorkspace({
  summary,
  onOpenSessions,
}: {
  summary: ReturnType<typeof buildSessionMomentumSummary>;
  onOpenSessions: () => void;
}) {
  return (
    <div className="mt-5 space-y-5">
      <InsightGrid
        cards={[
          {
            title: 'Completed Sessions',
            value: String(summary.completedCount),
            body: summary.completedCount > 0 ? `${summary.recapCoverageLabel}.` : 'No completed sessions yet.',
          },
          {
            title: 'Next Session',
            value: summary.nextSessionLabel,
            body: summary.readinessLabel,
          },
          {
            title: 'Cadence',
            value: summary.cadenceLabel,
            body: summary.cadenceNote,
          },
        ]}
      />
      <DetailSection
        title="Recent Movement"
        description="Recent sessions and immediate follow-through are the strongest real signal for campaign momentum."
        actionLabel="Open Session Plans"
        onAction={onOpenSessions}
        items={summary.recentSessionLines}
        emptyLabel="No recent session history yet."
      />
    </div>
  );
}

function NarrativeHealthWorkspace({
  summary,
  onOpenArcs,
}: {
  summary: ReturnType<typeof buildNarrativeHealthSummary>;
  onOpenArcs: () => void;
}) {
  return (
    <div className="mt-5 space-y-5">
      <InsightGrid
        cards={[
          {
            title: 'Active Arcs',
            value: String(summary.activeCount),
            body: `${summary.advancingCount} actively advancing, ${summary.dormantCount} dormant.`,
          },
          {
            title: 'Pressure Threads',
            value: String(summary.pressureCount),
            body: 'Threatened or escalating arcs are counted here.',
          },
          {
            title: 'Loose Hooks',
            value: String(summary.unresolvedHookCount),
            body: 'Taken from session summaries and unresolved story hooks.',
          },
        ]}
      />
      <DetailSection
        title="Arcs Needing Attention"
        description="This domain is grounded in campaign arcs and unresolved hooks already stored on sessions."
        actionLabel="Open Story Arcs"
        onAction={onOpenArcs}
        items={summary.attentionLines}
        emptyLabel="No unattended arcs are standing out right now."
      />
    </div>
  );
}

function WorldPressureWorkspace({
  summary,
  onOpenTrackers,
  onOpenCalendar,
}: {
  summary: ReturnType<typeof buildWorldPressureSummary>;
  onOpenTrackers: () => void;
  onOpenCalendar: () => void;
}) {
  return (
    <div className="mt-5 space-y-5">
      <InsightGrid
        cards={[
          {
            title: 'Escalating Trackers',
            value: String(summary.escalatingTrackers),
            body: `${summary.totalTrackers} total world-state trackers currently visible.`,
          },
          {
            title: 'Upcoming Events',
            value: String(summary.upcomingEvents),
            body: summary.calendarLabel,
          },
          {
            title: 'Active Downtime',
            value: String(summary.activeDowntime),
            body: 'Downtime keeps the world moving even between sessions.',
          },
        ]}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <DetailSection
          title="Pressure Sources"
          description="Trackers and calendar events are the clearest current pressure signals in the server model."
          actionLabel="Open Trackers"
          onAction={onOpenTrackers}
          items={summary.pressureLines}
          emptyLabel="No urgent world pressures are surfacing yet."
        />
        <DetailSection
          title="Approaching Dates"
          description="Pulled from the campaign calendar when one is active."
          actionLabel="Open Calendar"
          onAction={onOpenCalendar}
          items={summary.eventLines}
          emptyLabel="No calendar events are approaching."
        />
      </div>
    </div>
  );
}

function PartyStateWorkspace({
  summary,
  onOpenPlayers,
  onOpenDowntime,
}: {
  summary: ReturnType<typeof buildPartyStateSummary>;
  onOpenPlayers: () => void;
  onOpenDowntime: () => void;
}) {
  return (
    <div className="mt-5 space-y-5">
      <InsightGrid
        cards={[
          {
            title: 'Characters',
            value: String(summary.characterCount),
            body: `${summary.allyCount} companions or allies are currently on file.`,
          },
          {
            title: 'Downtime Involvement',
            value: String(summary.charactersInDowntime),
            body: 'Characters currently tied to planned or active downtime.',
          },
          {
            title: 'Roster Pulse',
            value: summary.rosterLabel,
            body: summary.rosterNote,
          },
        ]}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <DetailSection
          title="Roster Notes"
          description="Party state is currently strongest where the data model tracks characters, allies, and current downtime participation."
          actionLabel="Open Players"
          onAction={onOpenPlayers}
          items={summary.rosterLines}
          emptyLabel="No character roster has been built yet."
        />
        <DetailSection
          title="Current Activity"
          description="This is based on downtime participation and available companion records, since player-specific hook tracking is still limited."
          actionLabel="Open Downtime"
          onAction={onOpenDowntime}
          items={summary.activityLines}
          emptyLabel="No current party activity is being tracked here yet."
        />
      </div>
    </div>
  );
}

function PrepCoverageWorkspace({
  summary,
  onOpenEncounters,
  onOpenHandouts,
  onOpenSafety,
}: {
  summary: ReturnType<typeof buildPrepCoverageSummary>;
  onOpenEncounters: () => void;
  onOpenHandouts: () => void;
  onOpenSafety: () => void;
}) {
  return (
    <div className="mt-5 space-y-5">
      <InsightGrid
        cards={[
          {
            title: 'Ready Encounters',
            value: String(summary.readyEncounters),
            body: `${summary.totalEncounters} total encounters on file.`,
          },
          {
            title: 'Linked Handouts',
            value: String(summary.linkedHandouts),
            body: `${summary.revealedHandouts} have been revealed to players.`,
          },
          {
            title: 'Coverage Read',
            value: summary.coverageLabel,
            body: summary.coverageNote,
          },
        ]}
      />
      <div className="grid gap-5 xl:grid-cols-3">
        <DetailSection
          title="Prep Surfaces"
          description="This summary is derived from actual prep records already in the campaign."
          actionLabel="Open Encounters"
          onAction={onOpenEncounters}
          items={summary.surfaceLines}
          emptyLabel="Prep surfaces are still mostly empty."
        />
        <DetailSection
          title="Artifact Coverage"
          description="Handouts are counted here because they show whether discoveries and reveals are being tracked."
          actionLabel="Open Handouts"
          onAction={onOpenHandouts}
          items={summary.handoutLines}
          emptyLabel="No handouts have been created yet."
        />
        <DetailSection
          title="Table Safety"
          description="Safety tools are included because they are a real prep surface and part of campaign readiness."
          actionLabel="Open Safety Tools"
          onAction={onOpenSafety}
          items={summary.safetyLines}
          emptyLabel="Safety settings have not been configured yet."
        />
      </div>
    </div>
  );
}

function InsightGrid({
  cards,
}: {
  cards: Array<{ title: string; value: string; body: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4"
        >
          <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(34,18%,58%)]">{card.title}</p>
          <p className="mt-3 font-[Cinzel] text-3xl text-[hsl(38,40%,90%)]">{card.value}</p>
          <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,68%)]">{card.body}</p>
        </div>
      ))}
    </div>
  );
}

function DetailSection({
  title,
  description,
  items,
  emptyLabel,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  items: string[];
  emptyLabel: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(34,18%,58%)]">{title}</p>
          <p className="mt-2 max-w-xl text-sm leading-7 text-[hsl(30,14%,68%)]">{description}</p>
        </div>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="rounded-full border border-[hsla(32,24%,26%,0.62)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[hsl(38,24%,80%)]"
          >
            {actionLabel}
          </button>
        )}
      </div>
      {items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item}
              className="rounded-[18px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,10%,0.8)] px-4 py-3 text-sm leading-7 text-[hsl(32,18%,76%)]"
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[hsl(30,12%,60%)]">{emptyLabel}</p>
      )}
    </section>
  );
}

function QuickNavButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[hsla(32,24%,26%,0.62)] bg-[hsla(24,18%,10%,0.72)] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[hsl(38,24%,80%)] transition hover:border-[hsla(42,52%,48%,0.42)]"
    >
      {label}
    </button>
  );
}

function computeCampaignHealth({
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

function buildSessionMomentumSummary(sessions: Session[]) {
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

function buildNarrativeHealthSummary(arcs: CampaignArc[], sessions: Session[]) {
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

function buildWorldPressureSummary(
  calendar: ReturnType<typeof useCampaign>['data']['calendar'] | null | undefined,
  trackers: WorldStateTracker[],
  downtime: DowntimeActivity[],
) {
  const escalatingTrackers = trackers.filter((tracker) => getTrackerPercent(tracker) >= 70 && tracker.value < tracker.max).length;
  const activeDowntime = downtime.filter((activity) => ['planned', 'active'].includes(activity.status)).length;
  const upcomingCalendarEvents = calendar
    ? calendar.events.filter((event) => diffCalendarDays(calendar, calendar.currentDate, event) >= 0 && diffCalendarDays(calendar, calendar.currentDate, event) <= 14)
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
      .map((event) => `${event.name} — in ${diffCalendarDays(calendar!, calendar!.currentDate, event)} day(s)`),
    calendarLabel: calendar ? 'Uses active calendar events and deadlines.' : 'No campaign calendar initialized.',
  };
}

function buildPartyStateSummary(
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
      ...activeActivities.slice(0, 4).map((activity) => `${activity.participantName} — ${activity.title}`),
      ...allies.slice(0, 3).map((ally) => `${ally.name} — companion or allied support on file`),
    ],
  };
}

function buildPrepCoverageSummary(
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
    coverageLabel: toneLabel(tone),
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

function getTrackerPercent(tracker: WorldStateTracker) {
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

function diffCalendarDays(
  calendar: NonNullable<ReturnType<typeof useCampaign>['data']>['calendar'],
  from: { year: number; month: number; day: number },
  to: { year: number; month: number; day: number },
) {
  const fromAbs = toAbsoluteDay(calendar, from);
  const toAbs = toAbsoluteDay(calendar, to);
  return toAbs - fromAbs;
}

function toAbsoluteDay(
  calendar: NonNullable<ReturnType<typeof useCampaign>['data']>['calendar'],
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

function toneLabel(tone: HealthTone) {
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

function toneBadgeClass(tone: HealthTone) {
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
