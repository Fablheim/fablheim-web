import { shellPanelClass } from '@/lib/panel-styles';
import { useCampaignHealthContext } from './CampaignHealthContext';
import {
  healthToneBadgeClass,
  healthToneLabel,
  buildSessionMomentumSummary,
  buildNarrativeHealthSummary,
  buildWorldPressureSummary,
  buildPartyStateSummary,
  buildPrepCoverageSummary,
  getTrackerPercent,
  formatDate,
} from './CampaignHealthContext';
import { useNavigationBus } from '../NavigationBusContext';
import type { CampaignArc, Handout, Session, WorldStateTracker } from '@/types/campaign';

type DetailItem = string | { label: string; onClick: () => void };

export function CampaignHealthDeskV2() {
  const { health, selectedDomain, activeDomain, onTabChange, sessions, arcs, trackers, handouts } = useCampaignHealthContext();
  const { requestNavigation } = useNavigationBus();

  const navigateTo = (tab: string, id: string) => {
    requestNavigation(tab, id);
    onTabChange(tab);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(42,40%,24%,0.12),transparent_28%),linear-gradient(180deg,hsl(224,18%,8%)_0%,hsl(20,20%,7%)_100%)] p-4 text-[hsl(38,24%,88%)]">
      <div className={`${shellPanelClass} min-h-0 flex-1 flex flex-col overflow-hidden`}>
        {renderHeader()}
        {renderBody()}
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <header className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(38,30%,60%)]">Campaign Review</p>
        {renderHeaderContent()}
      </header>
    );
  }

  function renderHeaderContent() {
    return (
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        {renderTitle()}
        {renderQuickNav()}
      </div>
    );
  }

  function renderTitle() {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,42%,90%)]">
          {activeDomain ? activeDomain.label : 'Campaign Health'}
        </h2>
        {activeDomain && (
          <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${healthToneBadgeClass(activeDomain.tone)}`}>
            {healthToneLabel(activeDomain.tone)}
          </span>
        )}
      </div>
    );
  }

  function renderQuickNav() {
    return (
      <div className="flex flex-wrap gap-2">
        <QuickNavButton label="Review Next Session" onClick={() => onTabChange('sessions')} />
        <QuickNavButton label="Open Story Arcs" onClick={() => onTabChange('arcs')} />
        <QuickNavButton label="Open Trackers" onClick={() => onTabChange('trackers')} />
        <QuickNavButton label="Open Calendar" onClick={() => onTabChange('calendar')} />
      </div>
    );
  }

  function renderBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {selectedDomain === 'session-momentum' && renderSessionMomentum()}
        {selectedDomain === 'narrative-health' && renderNarrativeHealth()}
        {selectedDomain === 'world-pressure' && renderWorldPressure()}
        {selectedDomain === 'party-state' && renderPartyState()}
        {selectedDomain === 'prep-coverage' && renderPrepCoverage()}
      </div>
    );
  }

  function renderSessionMomentum() {
    return (
      <SessionMomentumWorkspace
        summary={health.sessionMomentum}
        sessions={sessions}
        onOpenSessions={() => onTabChange('sessions')}
        onNavigate={navigateTo}
      />
    );
  }

  function renderNarrativeHealth() {
    return (
      <NarrativeHealthWorkspace
        summary={health.narrativeHealth}
        arcs={arcs}
        onOpenArcs={() => onTabChange('arcs')}
        onNavigate={navigateTo}
      />
    );
  }

  function renderWorldPressure() {
    return (
      <WorldPressureWorkspace
        summary={health.worldPressure}
        trackers={trackers}
        onOpenTrackers={() => onTabChange('trackers')}
        onOpenCalendar={() => onTabChange('calendar')}
        onNavigate={navigateTo}
      />
    );
  }

  function renderPartyState() {
    return (
      <PartyStateWorkspace
        summary={health.partyState}
        onOpenPlayers={() => onTabChange('players')}
        onOpenDowntime={() => onTabChange('downtime')}
      />
    );
  }

  function renderPrepCoverage() {
    return (
      <PrepCoverageWorkspace
        summary={health.prepCoverage}
        handouts={handouts}
        onOpenEncounters={() => onTabChange('encounters')}
        onOpenHandouts={() => onTabChange('handouts')}
        onOpenSafety={() => onTabChange('safety-tools')}
        onNavigate={navigateTo}
      />
    );
  }
}

// ── Workspace subcomponents ───────────────────────────────────────────────────

function SessionMomentumWorkspace({
  summary,
  sessions,
  onOpenSessions,
  onNavigate,
}: {
  summary: ReturnType<typeof buildSessionMomentumSummary>;
  sessions: Session[];
  onOpenSessions: () => void;
  onNavigate: (tab: string, id: string) => void;
}) {
  const completed = [...sessions]
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(b.completedAt ?? b.scheduledDate ?? b.createdAt).getTime() - new Date(a.completedAt ?? a.scheduledDate ?? a.createdAt).getTime())
    .slice(0, 4);

  const clickableItems: DetailItem[] = completed.map((session) => {
    const recap = session.aiSummary?.summary || session.aiRecap || session.summary;
    const label = `${session.title || `Session ${session.sessionNumber}`} — ${recap ? 'recap captured' : 'no recap yet'}${session.completedAt ? ` · completed ${formatDate(session.completedAt)}` : ''}`;
    return { label, onClick: () => onNavigate('sessions', session._id) };
  });

  return (
    <div className="space-y-5">
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
        items={clickableItems}
        emptyLabel="No recent session history yet."
      />
    </div>
  );
}

function NarrativeHealthWorkspace({
  summary,
  arcs,
  onOpenArcs,
  onNavigate,
}: {
  summary: ReturnType<typeof buildNarrativeHealthSummary>;
  arcs: CampaignArc[];
  onOpenArcs: () => void;
  onNavigate: (tab: string, id: string) => void;
}) {
  const attentionArcs = arcs
    .filter((arc) => arc.status === 'threatened' || arc.status === 'dormant' || arc.pressure === 'escalating')
    .slice(0, 4);

  const clickableItems: DetailItem[] = [
    ...attentionArcs.map((arc) => ({
      label: `${arc.name} — ${arc.status.replace('_', ' ')}${arc.recentChange ? ` · ${arc.recentChange}` : ''}`,
      onClick: () => onNavigate('arcs', arc._id),
    })),
    ...summary.attentionLines
      .filter((line) => line.startsWith('Unresolved hook'))
      .map((line) => line),
  ];

  return (
    <div className="space-y-5">
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
        items={clickableItems}
        emptyLabel="No unattended arcs are standing out right now."
      />
    </div>
  );
}

function WorldPressureWorkspace({
  summary,
  trackers,
  onOpenTrackers,
  onOpenCalendar,
  onNavigate,
}: {
  summary: ReturnType<typeof buildWorldPressureSummary>;
  trackers: WorldStateTracker[];
  onOpenTrackers: () => void;
  onOpenCalendar: () => void;
  onNavigate: (tab: string, id: string) => void;
}) {
  const sortedTrackers = [...trackers]
    .sort((a, b) => getTrackerPercent(b) - getTrackerPercent(a))
    .slice(0, 4);

  const clickablePressureItems: DetailItem[] = sortedTrackers.map((tracker) => ({
    label: `${tracker.name} — ${tracker.value}/${tracker.max}${getTrackerPercent(tracker) >= 70 ? ' · escalating' : ''}`,
    onClick: () => onNavigate('trackers', tracker._id),
  }));

  return (
    <div className="space-y-5">
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
          items={clickablePressureItems}
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
    <div className="space-y-5">
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
  handouts,
  onOpenEncounters,
  onOpenHandouts,
  onOpenSafety,
  onNavigate,
}: {
  summary: ReturnType<typeof buildPrepCoverageSummary>;
  handouts: Handout[];
  onOpenEncounters: () => void;
  onOpenHandouts: () => void;
  onOpenSafety: () => void;
  onNavigate: (tab: string, id: string) => void;
}) {
  const clickableHandoutItems: DetailItem[] = handouts.slice(0, 4).map((handout) => ({
    label: `${handout.title} — ${handout.visibleTo === 'dm_only' ? 'GM only' : 'revealed'}`,
    onClick: () => onNavigate('handouts', handout._id),
  }));

  return (
    <div className="space-y-5">
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
          items={clickableHandoutItems}
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

// ── Shared UI components ──────────────────────────────────────────────────────

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
  items: DetailItem[];
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
          {items.map((item) => {
            const label = typeof item === 'string' ? item : item.label;
            const onClick = typeof item === 'string' ? undefined : item.onClick;
            return onClick ? (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className="w-full cursor-pointer rounded-lg border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,10%,0.8)] px-4 py-3 text-left text-sm leading-7 text-[hsl(32,18%,76%)] transition hover:bg-[hsla(32,20%,20%,0.4)]"
              >
                {label}
              </button>
            ) : (
              <div
                key={label}
                className="rounded-[18px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,10%,0.8)] px-4 py-3 text-sm leading-7 text-[hsl(32,18%,76%)]"
              >
                {label}
              </div>
            );
          })}
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
