import { useState } from 'react';
import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronRight,
  Coffee,
  FileText,
  Flag,
  HelpCircle,
  Swords,
} from 'lucide-react';
import {
  GitCompareArrows,
} from 'lucide-react';
import type {
  SessionBriefing,
  SessionDiff,
  ArcBriefing,
  TrackerAlert,
  ApproachingEvent,
  DowntimeBriefing,
} from '@/hooks/useSessionBriefing';
import type { Handout } from '@/types/campaign';
import type { Encounter } from '@/types/encounter';
import { innerPanelClass } from '@/lib/panel-styles';

// ── Props ────────────────────────────────────────────────────────────────────

interface SessionBriefingPanelProps {
  briefing: SessionBriefing;
  onOpenArc?: (arcId: string) => void;
  onOpenEncounter?: (encounterId: string) => void;
  onOpenTrackers?: () => void;
  onOpenCalendar?: () => void;
  onOpenDowntime?: () => void;
  onOpenHandouts?: () => void;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const eyebrow = 'text-[10px] uppercase tracking-[0.18em] text-[hsl(30,14%,54%)]';
const sectionTitle = 'text-[11px] font-semibold uppercase tracking-[0.06em] text-[hsl(38,36%,72%)]';
const mutedText = 'text-[11px] text-[hsl(30,12%,58%)]';
const badgeBase = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium';

const ARC_STATUS_STYLES: Record<string, string> = {
  active: 'border-[hsla(210,52%,45%,0.32)] bg-[hsla(210,52%,45%,0.12)] text-[hsl(205,80%,72%)]',
  advancing: 'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]',
  threatened: 'border-[hsla(0,60%,50%,0.32)] bg-[hsla(0,60%,50%,0.12)] text-[hsl(0,72%,72%)]',
  dormant: 'border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]',
};

const PRESSURE_STYLES: Record<string, string> = {
  quiet: 'text-[hsl(30,12%,58%)]',
  active: 'text-[hsl(38,82%,63%)]',
  escalating: 'text-[hsl(0,72%,72%)]',
};

// ── Component ────────────────────────────────────────────────────────────────

export function SessionBriefingPanel({
  briefing,
  onOpenArc,
  onOpenEncounter,
  onOpenTrackers,
  onOpenCalendar,
  onOpenDowntime,
  onOpenHandouts,
}: SessionBriefingPanelProps) {
  if (briefing.isEmpty) return null;

  return (
    <div className={`${innerPanelClass} space-y-0 overflow-hidden`}>
      <div className="border-b border-[hsla(32,24%,24%,0.46)] px-4 py-2.5">
        <span className={eyebrow}>Session Briefing</span>
      </div>
      <div className="space-y-0 divide-y divide-[hsla(32,24%,24%,0.28)]">
        {renderSessionDiff(briefing.diff)}
        {renderUnresolvedHooks(briefing.unresolvedHooks)}
        {renderArcs(briefing.arcs, onOpenArc)}
        {renderEncounters(briefing.linkedEncounters, onOpenEncounter)}
        {renderHandouts(briefing.linkedHandouts, onOpenHandouts)}
        {renderTrackers(briefing.trackerAlerts, onOpenTrackers)}
        {renderEvents(briefing.approachingEvents, onOpenCalendar)}
        {renderDowntime(briefing.recentDowntime, onOpenDowntime)}
      </div>
    </div>
  );
}

// ── Section renderers (each returns null when empty) ─────────────────────────

function renderSessionDiff(diff: SessionDiff | null) {
  if (!diff || !diff.hasDiff) return null;
  const totalItems = diff.arcDevelopments.length + diff.completedDowntime.length;
  return (
    <BriefingSection
      icon={GitCompareArrows}
      title={`Since Session ${diff.priorSessionNumber}`}
      count={totalItems}
    >
      <div className="space-y-2">
        {diff.arcDevelopments.map((item, i) => (
          <div key={`arc-dev-${i}`} className="flex gap-2 px-2 py-0.5">
            <Flag className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(38,82%,63%)]" />
            <div className="min-w-0 flex-1">
              <span className="text-[12px] text-[hsl(38,26%,86%)]">
                {item.arcName}
              </span>
              <span className={`${mutedText} ml-1`}>— {item.development.title}</span>
            </div>
          </div>
        ))}
        {diff.completedDowntime.map(({ activity, participantName }) => (
          <div key={activity._id} className="flex gap-2 px-2 py-0.5">
            <Coffee className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(150,62%,70%)]" />
            <span className="text-[12px] text-[hsl(38,26%,86%)]">
              <span className="text-[hsl(30,14%,66%)]">{participantName}:</span>{' '}
              {activity.name}
              <span className={`${mutedText} ml-1`}>completed</span>
            </span>
          </div>
        ))}
      </div>
    </BriefingSection>
  );
}

function renderUnresolvedHooks(hooks: string[]) {
  if (!hooks.length) return null;
  return (
    <BriefingSection icon={HelpCircle} title="Unresolved Threads" count={hooks.length}>
      <ul className="space-y-1">
        {hooks.map((hook, i) => (
          <li key={i} className={`${mutedText} flex gap-2`}>
            <span className="mt-1 shrink-0 text-[hsl(38,60%,52%)]">•</span>
            <span>{hook}</span>
          </li>
        ))}
      </ul>
    </BriefingSection>
  );
}

function renderArcs(arcs: ArcBriefing[], onOpen?: (id: string) => void) {
  if (!arcs.length) return null;
  return (
    <BriefingSection icon={Flag} title="Active Arcs" count={arcs.length}>
      <div className="space-y-2">
        {arcs.map(({ arc, linkedToSession, recentDevelopment }) => (
          <button
            key={arc._id}
            type="button"
            onClick={() => onOpen?.(arc._id)}
            className="flex w-full flex-col gap-1 rounded-lg px-2 py-1.5 text-left transition hover:bg-[hsla(32,20%,20%,0.4)]"
          >
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[hsl(38,26%,86%)]">
                {arc.name}
              </span>
              <span
                className={`${badgeBase} border ${ARC_STATUS_STYLES[arc.status] ?? ARC_STATUS_STYLES.dormant}`}
              >
                {arc.status}
              </span>
              {arc.pressure && arc.pressure !== 'quiet' && (
                <span className={`text-[10px] ${PRESSURE_STYLES[arc.pressure] ?? ''}`}>
                  {arc.pressure}
                </span>
              )}
              {linkedToSession && (
                <span className={`${badgeBase} border border-[hsla(38,60%,52%,0.32)] bg-[hsla(38,60%,52%,0.1)] text-[hsl(38,82%,63%)]`}>
                  linked
                </span>
              )}
            </div>
            {recentDevelopment && (
              <span className={`${mutedText} line-clamp-1`}>
                Latest: {recentDevelopment.title}
              </span>
            )}
          </button>
        ))}
      </div>
    </BriefingSection>
  );
}

function renderEncounters(encounters: Encounter[], onOpen?: (id: string) => void) {
  if (!encounters.length) return null;
  return (
    <BriefingSection icon={Swords} title="Linked Encounters" count={encounters.length}>
      <div className="space-y-1.5">
        {encounters.map((enc) => (
          <button
            key={enc._id}
            type="button"
            onClick={() => onOpen?.(enc._id)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[hsla(32,20%,20%,0.4)]"
          >
            <Swords className="h-3 w-3 shrink-0 text-[hsl(30,12%,58%)]" />
            <span className="flex-1 truncate text-[12px] text-[hsl(38,26%,86%)]">
              {enc.name}
            </span>
            {enc.difficulty && (
              <span className={`${badgeBase} border border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]`}>
                {enc.difficulty}
              </span>
            )}
            {enc.status && (
              <span className={`${badgeBase} border ${enc.status === 'ready' ? 'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]' : 'border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]'}`}>
                {enc.status}
              </span>
            )}
            <span className={mutedText}>
              {enc.participants?.length ?? 0}
            </span>
          </button>
        ))}
      </div>
    </BriefingSection>
  );
}

function renderHandouts(handouts: Handout[], onOpen?: () => void) {
  if (!handouts.length) return null;
  return (
    <BriefingSection icon={FileText} title="Handouts" count={handouts.length}>
      <div className="space-y-1.5">
        {handouts.map((handout) => (
          <div
            key={handout._id}
            className={`flex items-center gap-2 px-2 py-1 ${onOpen ? 'cursor-pointer rounded-lg transition hover:bg-[hsla(32,20%,20%,0.4)]' : ''}`}
            onClick={onOpen}
            role={onOpen ? 'button' : undefined}
            tabIndex={onOpen ? 0 : undefined}
          >
            <FileText className="h-3 w-3 shrink-0 text-[hsl(30,12%,58%)]" />
            <span className="flex-1 truncate text-[12px] text-[hsl(38,26%,86%)]">
              {handout.title}
            </span>
            {handout.artifactKind && (
              <span className={`${badgeBase} border border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]`}>
                {handout.artifactKind}
              </span>
            )}
            <span
              className={`${badgeBase} border ${
                handout.visibleTo === 'all'
                  ? 'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]'
                  : handout.visibleTo === 'dm_only'
                    ? 'border-[hsla(210,52%,45%,0.32)] bg-[hsla(210,52%,45%,0.12)] text-[hsl(205,80%,72%)]'
                    : 'border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]'
              }`}
            >
              {handout.visibleTo === 'all' ? 'Shared' : handout.visibleTo === 'dm_only' ? 'GM' : 'Selected'}
            </span>
          </div>
        ))}
      </div>
    </BriefingSection>
  );
}

function renderTrackers(alerts: TrackerAlert[], onOpen?: () => void) {
  if (!alerts.length) return null;
  return (
    <BriefingSection icon={Activity} title="World Pressure" count={alerts.length}>
      <div className="space-y-2">
        {alerts.map(({ tracker, percent, activeThreshold }) => (
          <div
            key={tracker._id}
            className={`space-y-1 px-2 ${onOpen ? 'cursor-pointer rounded-lg py-1 transition hover:bg-[hsla(32,20%,20%,0.4)]' : ''}`}
            onClick={onOpen}
            role={onOpen ? 'button' : undefined}
            tabIndex={onOpen ? 0 : undefined}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[hsl(38,26%,86%)]">{tracker.name}</span>
              <span className={`text-[11px] font-medium ${percent >= 0.8 ? 'text-[hsl(0,72%,72%)]' : 'text-[hsl(38,82%,63%)]'}`}>
                {tracker.value}/{tracker.max}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[hsla(32,20%,20%,0.5)]">
              <div
                className={`h-full rounded-full transition-all ${percent >= 0.8 ? 'bg-[hsl(0,60%,50%)]' : 'bg-[hsl(38,70%,52%)]'}`}
                style={{ width: `${Math.min(percent * 100, 100)}%` }}
              />
            </div>
            {activeThreshold && (
              <span className={`${mutedText} line-clamp-1`}>
                {activeThreshold.label}{activeThreshold.effect ? ` — ${activeThreshold.effect}` : ''}
              </span>
            )}
          </div>
        ))}
      </div>
    </BriefingSection>
  );
}

function renderEvents(events: ApproachingEvent[], onOpen?: () => void) {
  if (!events.length) return null;
  return (
    <BriefingSection icon={Calendar} title="Approaching Events" count={events.length}>
      <div className="space-y-1.5">
        {events.map(({ event, daysAway }) => (
          <div
            key={event.id}
            className={`flex items-center gap-2 px-2 py-1 ${onOpen ? 'cursor-pointer rounded-lg transition hover:bg-[hsla(32,20%,20%,0.4)]' : ''}`}
            onClick={onOpen}
            role={onOpen ? 'button' : undefined}
            tabIndex={onOpen ? 0 : undefined}
          >
            <Calendar className="h-3 w-3 shrink-0 text-[hsl(30,12%,58%)]" />
            <span className="flex-1 truncate text-[12px] text-[hsl(38,26%,86%)]">
              {event.name}
            </span>
            {event.eventType && (
              <span className={`${badgeBase} border border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]`}>
                {event.eventType}
              </span>
            )}
            <span className="text-[11px] font-medium text-[hsl(38,82%,63%)]">
              {daysAway === 0 ? 'today' : `in ${daysAway}d`}
            </span>
          </div>
        ))}
      </div>
    </BriefingSection>
  );
}

function renderDowntime(items: DowntimeBriefing[], onOpen?: () => void) {
  if (!items.length) return null;
  return (
    <BriefingSection icon={Coffee} title="Recent Downtime" count={items.length}>
      <div className="space-y-1.5">
        {items.map(({ activity, participantName, isCompleted }) => (
          <div
            key={activity._id}
            className={`flex items-center gap-2 px-2 py-1 ${onOpen ? 'cursor-pointer rounded-lg transition hover:bg-[hsla(32,20%,20%,0.4)]' : ''}`}
            onClick={onOpen}
            role={onOpen ? 'button' : undefined}
            tabIndex={onOpen ? 0 : undefined}
          >
            <span className="flex-1 truncate text-[12px] text-[hsl(38,26%,86%)]">
              <span className="text-[hsl(30,14%,66%)]">{participantName}:</span>{' '}
              {activity.name}
            </span>
            <span
              className={`${badgeBase} border ${
                isCompleted
                  ? 'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]'
                  : 'border-[hsla(38,70%,52%,0.32)] bg-[hsla(38,70%,46%,0.12)] text-[hsl(38,82%,63%)]'
              }`}
            >
              {isCompleted ? 'done' : 'active'}
            </span>
          </div>
        ))}
      </div>
    </BriefingSection>
  );
}

// ── Collapsible section wrapper ──────────────────────────────────────────────

function BriefingSection({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-2 flex w-full items-center gap-1.5 text-left"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 text-[hsl(30,12%,58%)]" />
        ) : (
          <ChevronRight className="h-3 w-3 text-[hsl(30,12%,58%)]" />
        )}
        <Icon className="h-3 w-3 text-[hsl(30,12%,58%)]" />
        <span className={sectionTitle}>{title}</span>
        <span className="ml-auto text-[10px] text-[hsl(30,12%,50%)]">{count}</span>
      </button>
      {open && children}
    </div>
  );
}
