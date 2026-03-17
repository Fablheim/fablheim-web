import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock3,
  Compass,
  Globe,
  Layers,
  Play,
  Plus,
  ScrollText,
  Sparkles,
  Swords,
  TrendingUp,
  MessageCircle,
} from 'lucide-react';
import type { CampaignArc, Session } from '@/types/campaign';
import type { AppState } from '@/types/workspace';
import { startCase } from './world/world-ui';
import { OverviewProvider, useOverviewContext } from './overview/OverviewContext';
import { isUpcomingStatus, findPriorSession } from './sessions/SessionsContext';
import { useSessionBriefing } from '@/hooks/useSessionBriefing';
import type { Campaign } from '@/types/campaign';

// ── Public export — accepts original props and self-wraps with provider ───────

interface OverviewCenterStageProps {
  campaignId: string;
  campaign: Campaign;
  appState: AppState;
  isDM: boolean;
  onTabChange: (tab: string) => void;
  onStartSession: () => void;
}

export function OverviewCenterStage({
  campaignId,
  appState,
  isDM,
  onTabChange,
  onStartSession,
}: OverviewCenterStageProps) {
  return (
    <OverviewProvider
      campaignId={campaignId}
      appState={appState}
      isDM={isDM}
      onTabChange={onTabChange}
      onStartSession={onStartSession}
    >
      <OverviewCenterStageInner />
    </OverviewProvider>
  );
}

function OverviewCenterStageInner() {
  const {
    campaign,
    isLoading,
    appState,
    isDM,
    onTabChange,
    onStartSession,
    sortedSessions,
    activeArcs,
    statusStats,
    recentActivity,
    requestWorldCreate,
  } = useOverviewContext();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-[hsl(30,14%,40%)]">Loading overview\u2026</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-[hsl(30,14%,40%)]">Campaign not found.</p>
      </div>
    );
  }

  const currentSession = sortedSessions.find((s) => s._id === campaign.activeSessionId) ?? null;
  const nextSession = buildNextSession(sortedSessions);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[920px] flex-col gap-5 px-4 py-4 pb-10">
          <CampaignStatusCard
            campaign={campaign}
            appState={appState}
            currentSession={currentSession}
            nextSession={nextSession}
            statusStats={statusStats}
            activeArcs={activeArcs}
            onOpenArcs={() => onTabChange('arcs')}
          />
          {renderMiddleRow()}
          <RecentActivityCard items={recentActivity} />
        </div>
      </div>
    </div>
  );

  function renderMiddleRow() {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <NextSessionBriefingCard
          campaignId={campaign!._id}
          sortedSessions={sortedSessions}
          onTabChange={onTabChange}
        />
        <QuickActionsCard
          isDM={isDM}
          appState={appState}
          onOpenWorld={() => onTabChange('world')}
          onCreateEntity={() => {
            requestWorldCreate({
              title: 'Create world entity',
              subtitle: 'Start something new from overview and drop straight into the world flow.',
            });
            onTabChange('world');
          }}
          onOpenSessions={() => onTabChange('sessions')}
          onOpenNotes={() => onTabChange('notes')}
          onStartSession={onStartSession}
        />
      </div>
    );
  }
}

function buildNextSession(sortedSessions: Session[]) {
  const planningStatuses = new Set(['draft', 'scheduled', 'ready', 'planned']);
  const candidates = sortedSessions.filter((s) => planningStatuses.has(s.status));
  return [...candidates].sort((a, b) => {
    const aDate = a.scheduledDate ? new Date(a.scheduledDate).getTime() : null;
    const bDate = b.scheduledDate ? new Date(b.scheduledDate).getTime() : null;
    if (aDate && bDate) return aDate - bDate;
    if (aDate) return -1;
    if (bDate) return 1;
    const aTime = a.completedAt || a.startedAt || a.scheduledDate || a.updatedAt || a.createdAt;
    const bTime = b.completedAt || b.startedAt || b.scheduledDate || b.updatedAt || b.createdAt;
    return (bTime ? new Date(bTime).getTime() : 0) - (aTime ? new Date(aTime).getTime() : 0);
  })[0] ?? null;
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function CampaignStatusCard({
  campaign,
  appState,
  currentSession,
  nextSession,
  statusStats,
  activeArcs,
  onOpenArcs,
}: {
  campaign: NonNullable<ReturnType<typeof useOverviewContext>['campaign']>;
  appState: AppState;
  currentSession: Session | null;
  nextSession: Session | null;
  statusStats: Array<{ label: string; value: number }>;
  activeArcs: CampaignArc[];
  onOpenArcs: () => void;
}) {
  return (
    <section className="rounded-2xl border border-[hsla(32,26%,26%,0.42)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.97),hsla(24,14%,11%,0.99))] p-5">
      {renderStatusTop()}
      {renderActiveArcs()}
      {renderStatusBottom()}
    </section>
  );

  function renderStatusTop() {
    return (
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            Campaign Control Room
          </p>
          <h2
            className="mt-1 text-[22px] text-[hsl(35,24%,92%)]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {campaign.name}
          </h2>
          <p className="mt-2 max-w-[620px] text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">
            {campaign.description?.trim() || 'Campaign summary and launch point for the current prep stage.'}
          </p>
        </div>
        <div className="rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
            Current stage
          </p>
          <p className="mt-1 text-[13px] text-[hsl(38,82%,63%)]">
            {formatStageLabel(appState)}
          </p>
          <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">
            {startCase(campaign.system)} system
          </p>
        </div>
      </div>
    );
  }

  function renderActiveArcs() {
    if (!activeArcs.length) return null;
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">Active arcs</p>
        {activeArcs.map((arc) => (
          <button
            key={arc._id}
            type="button"
            onClick={onOpenArcs}
            className="rounded-full border border-[hsla(38,60%,52%,0.24)] bg-[hsla(38,70%,46%,0.08)] px-2.5 py-1 text-[11px] text-[hsl(38,82%,63%)] transition-colors hover:border-[hsla(38,60%,52%,0.42)] hover:bg-[hsla(38,70%,46%,0.16)]"
          >
            {arc.name}
          </button>
        ))}
      </div>
    );
  }

  function renderStatusBottom() {
    return (
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <SummaryBlock
          title={currentSession ? 'Current session' : 'Next session'}
          value={buildSessionLabel(currentSession ?? nextSession)}
          detail={buildSessionDetail(currentSession, nextSession)}
        />
        <SummaryBlock
          title="Campaign rhythm"
          value={campaign.sessionFrequency || 'Not set'}
          detail={
            campaign.lastSessionDate
              ? `Last session ${formatRelativeDate(campaign.lastSessionDate)}`
              : 'No session history yet'
          }
        />
        <div className="flex flex-wrap gap-2">
          {statusStats.map((stat) => (
            <div
              key={stat.label}
              className="min-w-[92px] rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2"
            >
              <p className="text-[16px] text-[hsl(35,24%,92%)]">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function buildSessionLabel(session: Session | null) {
    if (!session) return 'No session scheduled yet';
    return `Session ${session.sessionNumber}${session.title ? ` \u2014 ${session.title}` : ''}`;
  }

  function buildSessionDetail(current: Session | null, next: Session | null) {
    if (current) return 'Currently in motion';
    if (next) return formatSessionMeta(next);
    return 'Create or schedule one from Session Plans';
  }
}

function NextSessionBriefingCard({
  campaignId,
  sortedSessions,
  onTabChange,
}: {
  campaignId: string;
  sortedSessions: Session[];
  onTabChange: (tab: string) => void;
}) {
  const nextSession =
    sortedSessions.find((s) => isUpcomingStatus(s.status)) ??
    sortedSessions[0] ??
    null;

  const priorSession = nextSession ? findPriorSession(nextSession, sortedSessions) : null;
  const briefing = useSessionBriefing(campaignId, nextSession, priorSession);

  return (
    <section className="space-y-3 rounded-2xl border border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,15%,11%,0.9)] p-4">
      {renderHeader()}
      {renderBody()}
    </section>
  );

  function renderHeader() {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(30,14%,54%)]">
          Next Session Briefing
        </p>
        {nextSession ? (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-full border border-[hsla(38,60%,52%,0.24)] bg-[hsla(38,70%,46%,0.08)] px-2 py-0.5 text-[10px] text-[hsl(38,82%,63%)]">
              #{nextSession.sessionNumber}
            </span>
            <h3
              className="text-[14px] text-[hsl(38,36%,82%)]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {nextSession.title || `Session ${nextSession.sessionNumber}`}
            </h3>
          </div>
        ) : (
          <h3
            className="mt-1.5 text-[14px] text-[hsl(38,36%,82%)]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            No Session Scheduled
          </h3>
        )}
      </div>
    );
  }

  function renderBody() {
    if (!nextSession || briefing.isEmpty) {
      return (
        <p className="text-[12px] leading-relaxed text-[hsl(30,12%,58%)]">
          No active context for the next session. Plan your next session to see the briefing.
        </p>
      );
    }
    return (
      <div className="space-y-1">
        {renderBriefingRows()}
        {renderOpenButton()}
      </div>
    );
  }

  function renderBriefingRows() {
    const rows: Array<{ key: string; icon: typeof Layers; count: number; label: string; tab: string }> = [];

    if (briefing.arcs.length > 0) {
      rows.push({ key: 'arcs', icon: Layers, count: briefing.arcs.length, label: `active arc${briefing.arcs.length !== 1 ? 's' : ''}`, tab: 'sessions' });
    }
    if (briefing.linkedEncounters.length > 0) {
      rows.push({ key: 'encounters', icon: Swords, count: briefing.linkedEncounters.length, label: `linked encounter${briefing.linkedEncounters.length !== 1 ? 's' : ''}`, tab: 'sessions' });
    }
    if (briefing.trackerAlerts.length > 0) {
      rows.push({ key: 'trackers', icon: TrendingUp, count: briefing.trackerAlerts.length, label: `tracker alert${briefing.trackerAlerts.length !== 1 ? 's' : ''}`, tab: 'trackers' });
    }
    if (briefing.approachingEvents.length > 0) {
      rows.push({ key: 'events', icon: Calendar, count: briefing.approachingEvents.length, label: `approaching event${briefing.approachingEvents.length !== 1 ? 's' : ''}`, tab: 'calendar' });
    }
    if (briefing.unresolvedHooks.length > 0 && priorSession) {
      rows.push({ key: 'hooks', icon: MessageCircle, count: briefing.unresolvedHooks.length, label: `unresolved thread${briefing.unresolvedHooks.length !== 1 ? 's' : ''} from Session ${priorSession.sessionNumber}`, tab: 'sessions' });
    }

    return (
      <div className="space-y-1">
        {rows.map((row) => renderRow(row))}
      </div>
    );
  }

  function renderRow(row: { key: string; icon: typeof Layers; count: number; label: string; tab: string }) {
    const Icon = row.icon;
    return (
      <button
        key={row.key}
        type="button"
        onClick={() => onTabChange(row.tab)}
        className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[hsla(24,16%,18%,0.6)]"
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-[hsl(38,82%,63%)]" />
        <span className="text-[12px] text-[hsl(38,26%,86%)]">
          <span className="font-medium text-[hsl(35,24%,92%)]">{row.count}</span> {row.label}
        </span>
        <ArrowRight className="ml-auto h-3 w-3 shrink-0 text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }

  function renderOpenButton() {
    return (
      <div className="pt-2">
        <button
          type="button"
          onClick={() => onTabChange('sessions')}
          className="rounded-full border border-[hsla(38,60%,52%,0.24)] bg-[hsla(38,70%,46%,0.08)] px-4 py-1.5 text-[12px] text-[hsl(38,82%,63%)] transition-colors hover:border-[hsla(38,60%,52%,0.42)] hover:bg-[hsla(38,70%,46%,0.16)]"
        >
          Open Session Briefing
        </button>
      </div>
    );
  }
}

function RecentActivityCard({
  items,
}: {
  items: Array<{
    key: string;
    label: string;
    meta: string;
    note: string;
    icon: typeof BookOpen;
    onClick: () => void;
  }>;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,15%,11%,0.9)] p-4">
      <SectionHeader
        icon={Clock3}
        title="Recent Activity"
        description="A quick sense of movement across sessions and campaign material, so the world feels current."
      />
      {renderActivityList()}
    </section>
  );

  function renderActivityList() {
    if (!items.length) {
      return (
        <p className="text-[12px] text-[hsl(30,12%,58%)]">
          No recent campaign movement yet.
        </p>
      );
    }
    return (
      <div className="space-y-2">
        {items.map((item) => renderActivityButton(item))}
      </div>
    );
  }

  function renderActivityButton(item: (typeof items)[number]) {
    const Icon = item.icon;
    return (
      <button
        key={item.key}
        type="button"
        onClick={item.onClick}
        className="group flex w-full items-start gap-3 rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.74)] px-3.5 py-3 text-left transition-colors hover:bg-[hsl(24,20%,15%)]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsla(38,70%,46%,0.1)] text-[hsl(38,82%,63%)]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-[hsl(35,24%,92%)]">{item.label}</p>
          <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">{item.meta}</p>
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">
            {item.note}
          </p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }
}

function QuickActionsCard({
  isDM,
  appState,
  onOpenWorld,
  onCreateEntity,
  onOpenSessions,
  onOpenNotes,
  onStartSession,
}: {
  isDM: boolean;
  appState: AppState;
  onOpenWorld: () => void;
  onCreateEntity: () => void;
  onOpenSessions: () => void;
  onOpenNotes: () => void;
  onStartSession: () => void;
}) {
  const actions = [
    { key: 'world', label: 'Open World', detail: 'Browse regions, entities, and relationships.', icon: Globe, onClick: onOpenWorld },
    { key: 'create', label: 'Create Entity', detail: 'Capture a new NPC, place, quest, or lore hook.', icon: Plus, onClick: onCreateEntity },
    { key: 'sessions', label: 'Open Sessions', detail: 'Review plans, recaps, and campaign memory.', icon: BookOpen, onClick: onOpenSessions },
    { key: 'notes', label: 'Open Notes', detail: 'Jump into lore and campaign notes.', icon: ScrollText, onClick: onOpenNotes },
  ];

  if (isDM && appState === 'prep') {
    actions.push({
      key: 'start',
      label: 'Start Session',
      detail: 'Move from prep into live play when you are ready.',
      icon: Play,
      onClick: onStartSession,
    });
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,15%,11%,0.9)] p-4">
      <SectionHeader
        icon={Compass}
        title="Quick Actions"
        description="High-value jump points for the next thing a GM usually needs to do."
      />
      <div className="space-y-2">
        {actions.map((action) => renderActionButton(action))}
      </div>
    </section>
  );

  function renderActionButton(action: (typeof actions)[number]) {
    const Icon = action.icon;
    return (
      <button
        key={action.key}
        type="button"
        onClick={action.onClick}
        className="group flex w-full items-center gap-3 rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.74)] px-3.5 py-3 text-left transition-colors hover:bg-[hsl(24,20%,15%)]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsla(38,70%,46%,0.1)] text-[hsl(38,82%,63%)]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-[hsl(35,24%,92%)]">{action.label}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
            {action.detail}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }
}

function SummaryBlock({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.74)] px-3.5 py-3">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
        {title}
      </p>
      <p className="mt-1 text-[13px] text-[hsl(35,24%,92%)]">{value}</p>
      <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">{detail}</p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[hsl(38,82%,63%)]" />
        <h3
          className="text-[14px] text-[hsl(38,36%,82%)]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {title}
        </h3>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
        {description}
      </p>
    </div>
  );
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function formatStageLabel(appState: AppState) {
  switch (appState) {
    case 'prep':
      return 'Prep';
    case 'narrative':
      return 'Live Narrative';
    case 'combat':
      return 'Combat';
    case 'recap':
      return 'Recap';
    default:
      return startCase(appState);
  }
}

function formatSessionMeta(session: Session) {
  const date = session.scheduledDate || session.startedAt || session.completedAt || session.updatedAt;
  return `${startCase(session.status)}${date ? ` \u00b7 ${formatDisplayDate(date)}` : ''}`;
}

function formatDisplayDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unknown';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDisplayDate(value);
}
