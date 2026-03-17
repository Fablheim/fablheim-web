import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  PanelRightOpen,
  PanelRightClose,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useCampaign, useAdjustTracker } from '@/hooks/useCampaigns';
import { useSessions, useUpdateSession } from '@/hooks/useSessions';
import {
  useWorldEntities,
  useToggleDiscovery,
  useRevealSecret,
  useToggleObjective,
} from '@/hooks/useWorldEntities';
import { useWorldExplorerContext } from './world/useWorldExplorerContext';
import { useSessionBriefing } from '@/hooks/useSessionBriefing';
import type { ArcBriefing, TrackerAlert } from '@/hooks/useSessionBriefing';
import type { Session, WorldEntity } from '@/types/campaign';
import type { Encounter } from '@/types/encounter';
import {
  findPriorSession,
  isUpcomingStatus,
  resolveEntitiesByIds,
  STATUS_STYLES,
  normalizePlanStatus,
  getStatusLabel,
} from '@/components/v2/sessions/SessionsContext';

// ── Props ────────────────────────────────────────────────────────────────────

interface PlayContextSidebarProps {
  campaignId: string;
  isOpen: boolean;
  onToggle: () => void;
  onTabChange: (tab: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function PlayContextSidebar({
  campaignId,
  isOpen,
  onToggle,
  onTabChange,
}: PlayContextSidebarProps) {
  const { data: campaign } = useCampaign(campaignId);
  const { data: sessionsData } = useSessions(campaignId);
  const { data: worldEntitiesData } = useWorldEntities(campaignId);

  const sessions = useMemo(() => sessionsData ?? [], [sessionsData]);
  const worldEntities = useMemo(() => worldEntitiesData ?? [], [worldEntitiesData]);

  const activeSession = useMemo(() => {
    if (!sessions.length) return null;
    if (campaign?.activeSessionId) {
      const found = sessions.find((s) => s._id === campaign.activeSessionId);
      if (found) return found;
    }
    const live = sessions.find((s) => s.status === 'in_progress');
    if (live) return live;
    const sorted = [...sessions].sort(
      (a, b) =>
        new Date(a.scheduledDate ?? a.createdAt).getTime() -
        new Date(b.scheduledDate ?? b.createdAt).getTime(),
    );
    return sorted.find((s) => isUpcomingStatus(s.status)) ?? null;
  }, [sessions, campaign?.activeSessionId]);

  const priorSession = useMemo(
    () => (activeSession ? findPriorSession(activeSession, sessions) : null),
    [activeSession, sessions],
  );

  const briefing = useSessionBriefing(campaignId, activeSession ?? null, priorSession);

  if (!isOpen) {
    return renderRail();
  }

  return (
    <aside className="flex h-full w-[260px] min-w-[240px] max-w-[300px] xl:w-[340px] xl:min-w-[300px] xl:max-w-[400px] flex-col border-l border-[hsla(32,26%,26%,0.75)] bg-[hsl(24,14%,9%)]">
      {renderHeader()}
      {renderBody()}
    </aside>
  );

  // ── Rail (collapsed) ─────────────────────────────────────────────────────

  function renderRail() {
    return (
      <div className="flex h-full w-[52px] shrink-0 flex-col items-center border-l border-[hsla(32,26%,26%,0.75)] bg-[hsl(24,14%,9%)] py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
          aria-label="Open session context"
        >
          <PanelRightOpen className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // ── Header ───────────────────────────────────────────────────────────────

  function renderHeader() {
    return (
      <div className="flex h-[42px] shrink-0 items-center justify-between border-b border-[hsla(32,26%,26%,0.4)] px-3">
        <h2
          className="text-[11px] uppercase tracking-[0.06em] text-[hsl(38,36%,72%)]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Session Context
        </h2>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-6 w-6 items-center justify-center rounded text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
          aria-label="Close session context"
        >
          <PanelRightClose className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // ── Scrollable body ──────────────────────────────────────────────────────

  function renderBody() {
    if (!activeSession) {
      return (
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-center text-[12px] text-[hsl(30,12%,58%)]">
            No active session
          </p>
        </div>
      );
    }
    return (
      <div className="flex-1 overflow-y-auto">
        {renderTopSections(activeSession)}
        {renderBottomSections()}
      </div>
    );
  }

  function renderTopSections(session: Session) {
    return (
      <>
        <CurrentSessionHeader session={session} />
        <SceneEntitiesSection
          campaignId={campaignId}
          session={session}
          worldEntities={worldEntities}
          onTabChange={onTabChange}
        />
      </>
    );
  }

  function renderBottomSections() {
    return (
      <>
        <ActiveArcsSection arcs={briefing.arcs} />
        <PressureAlertsSection alerts={briefing.trackerAlerts} campaignId={campaignId} />
        <LinkedEncountersSection encounters={briefing.linkedEncounters} onTabChange={onTabChange} />
        <SessionNotesSection campaignId={campaignId} session={activeSession} />
      </>
    );
  }
}

// ── Section 1: Current session header ──────────────────────────────────────

function CurrentSessionHeader({ session }: { session: Session }) {
  const status = normalizePlanStatus(session.status);
  const premise = session.summary?.trim() || session.notes?.trim() || '';
  return (
    <div className="border-b border-[hsla(32,26%,26%,0.3)] px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="flex-1 truncate text-[12px] font-medium text-[hsl(38,26%,86%)]">
          {session.title ?? `Session ${session.sessionNumber}`}
        </span>
        <StatusBadge label={getStatusLabel(status)} style={STATUS_STYLES[status]} />
      </div>
      {premise ? (
        <p className="mt-1 truncate text-[11px] text-[hsl(30,12%,58%)]">{premise}</p>
      ) : null}
    </div>
  );
}

// ── Section 2: Scene entities ──────────────────────────────────────────────

function SceneEntitiesSection({
  campaignId,
  session,
  worldEntities,
  onTabChange,
}: {
  campaignId: string;
  session: Session;
  worldEntities: WorldEntity[];
  onTabChange: (tab: string) => void;
}) {
  const [expandedEntityId, setExpandedEntityId] = useState<string | null>(null);
  const npcs = resolveEntitiesByIds(session.npcIds, worldEntities);
  const locations = resolveEntitiesByIds(session.locationIds, worldEntities);
  const quests = resolveEntitiesByIds(session.questIds, worldEntities);
  if (!npcs.length && !locations.length && !quests.length) return null;
  return (
    <CollapsibleSection title="Scene Entities">
      <EntityGroup label="NPCs" entities={npcs} campaignId={campaignId} expandedEntityId={expandedEntityId} onToggleExpand={setExpandedEntityId} onTabChange={onTabChange} />
      <EntityGroup label="Locations" entities={locations} campaignId={campaignId} expandedEntityId={expandedEntityId} onToggleExpand={setExpandedEntityId} onTabChange={onTabChange} />
      <EntityGroup label="Quests" entities={quests} campaignId={campaignId} expandedEntityId={expandedEntityId} onToggleExpand={setExpandedEntityId} onTabChange={onTabChange} />
    </CollapsibleSection>
  );
}

function EntityGroup({
  label,
  entities,
  campaignId,
  expandedEntityId,
  onToggleExpand,
  onTabChange,
}: {
  label: string;
  entities: WorldEntity[];
  campaignId: string;
  expandedEntityId: string | null;
  onToggleExpand: (id: string | null) => void;
  onTabChange: (tab: string) => void;
}) {
  if (!entities.length) return null;
  return (
    <div className="mb-1.5">
      <p className="mb-0.5 text-[10px] uppercase tracking-[0.18em] text-[hsl(30,14%,54%)]">
        {label}
      </p>
      {entities.map((e) => (
        <EntityRow
          key={e._id}
          entity={e}
          campaignId={campaignId}
          isExpanded={expandedEntityId === e._id}
          onToggleExpand={() => onToggleExpand(expandedEntityId === e._id ? null : e._id)}
          onTabChange={onTabChange}
        />
      ))}
    </div>
  );
}

function EntityRow({
  entity,
  campaignId,
  isExpanded,
  onToggleExpand,
  onTabChange,
}: {
  entity: WorldEntity;
  campaignId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTabChange: (tab: string) => void;
}) {
  const { requestEntityNavigation } = useWorldExplorerContext();
  const Icon = isExpanded ? ChevronDown : ChevronRight;
  return (
    <div className="mb-0.5">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex items-center gap-1 min-w-0 flex-1 text-left text-[12px] text-[hsl(38,26%,86%)] hover:text-[hsl(38,50%,78%)]"
        >
          <Icon className="h-2.5 w-2.5 shrink-0 text-[hsl(30,14%,54%)]" />
          <span className="truncate">{entity.name}</span>
        </button>
        <button
          type="button"
          onClick={() => { requestEntityNavigation(entity._id); onTabChange('world'); }}
          className="shrink-0 text-[10px] text-[hsl(30,14%,54%)] hover:text-[hsl(38,50%,78%)]"
          title="View in World tab"
        >
          &#8599;
        </button>
      </div>
      {isExpanded ? (
        <EntityActionPanel entity={entity} campaignId={campaignId} />
      ) : null}
    </div>
  );
}

function EntityActionPanel({
  entity,
  campaignId,
}: {
  entity: WorldEntity;
  campaignId: string;
}) {
  return (
    <div className="pl-6 pt-1 pb-1.5 space-y-1">
      <DiscoveryToggle entity={entity} campaignId={campaignId} />
      <EntitySecrets entity={entity} campaignId={campaignId} />
      <EntityObjectives entity={entity} campaignId={campaignId} />
    </div>
  );
}

function DiscoveryToggle({
  entity,
  campaignId,
}: {
  entity: WorldEntity;
  campaignId: string;
}) {
  const toggleDiscovery = useToggleDiscovery();
  const discovered = entity.discoveredByParty ?? false;
  return (
    <button
      type="button"
      disabled={toggleDiscovery.isPending}
      onClick={() =>
        toggleDiscovery.mutate({
          campaignId,
          entityId: entity._id,
          discovered: !discovered,
        })
      }
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border transition disabled:opacity-40 ${
        discovered
          ? 'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]'
          : 'border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]'
      }`}
    >
      {discovered ? '\u2713 Known to Party' : 'Undiscovered'}
    </button>
  );
}

function EntitySecrets({
  entity,
  campaignId,
}: {
  entity: WorldEntity;
  campaignId: string;
}) {
  const revealSecret = useRevealSecret();
  if (entity.type !== 'npc' && entity.type !== 'npc_minor') return null;
  const unrevealed = (entity.secrets ?? []).filter((s) => !s.revealed);
  if (!unrevealed.length) return null;
  return (
    <>
      {unrevealed.map((secret) => (
        <div key={secret._id ?? secret.description} className="flex items-start gap-1.5">
          <span className="flex-1 min-w-0 truncate text-[11px] text-[hsl(30,12%,58%)]" title={secret.description}>
            Secret: &ldquo;{secret.description.length > 40 ? secret.description.slice(0, 40) + '...' : secret.description}&rdquo;
          </span>
          <button
            type="button"
            disabled={revealSecret.isPending}
            onClick={() =>
              revealSecret.mutate({
                campaignId,
                entityId: entity._id,
                secretId: secret._id ?? '',
              })
            }
            className="shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border border-[hsla(38,60%,50%,0.32)] bg-[hsla(38,60%,50%,0.12)] text-[hsl(38,70%,68%)] hover:bg-[hsla(38,60%,50%,0.22)] transition disabled:opacity-40"
          >
            Reveal
          </button>
        </div>
      ))}
    </>
  );
}

function EntityObjectives({
  entity,
  campaignId,
}: {
  entity: WorldEntity;
  campaignId: string;
}) {
  const toggleObjective = useToggleObjective();
  if (entity.type !== 'quest') return null;
  const objectives = entity.objectives ?? [];
  const incomplete = objectives.filter((o) => !o.completed);
  if (!incomplete.length) return null;
  return (
    <>
      {incomplete.map((obj) => (
        <label key={obj.id} className="flex items-start gap-1.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={false}
            disabled={toggleObjective.isPending}
            onChange={() =>
              toggleObjective.mutate({
                campaignId,
                entityId: entity._id,
                objectiveId: obj.id,
              })
            }
            className="mt-0.5 h-3 w-3 shrink-0 rounded border-[hsla(32,24%,30%,0.6)] bg-transparent accent-[hsl(38,70%,52%)]"
          />
          <span className="flex-1 min-w-0 truncate text-[11px] text-[hsl(30,12%,58%)] group-hover:text-[hsl(38,26%,86%)]" title={obj.description}>
            {obj.description}
          </span>
        </label>
      ))}
    </>
  );
}

// ── Section 3: Active arcs ─────────────────────────────────────────────────

function ActiveArcsSection({ arcs }: { arcs: ArcBriefing[] }) {
  if (!arcs.length) return null;
  const capped = arcs.slice(0, 5);
  return (
    <CollapsibleSection title="Active Arcs">
      {capped.map((ab) => (
        <div key={ab.arc._id} className="mb-1.5 flex items-center gap-1.5">
          <span className="flex-1 truncate text-[12px] text-[hsl(38,26%,86%)]">
            {ab.arc.name}
          </span>
          <StatusBadge label={ab.arc.status} style={arcStatusStyle(ab.arc.status)} />
          <span className="text-[10px] text-[hsl(30,14%,54%)]">
            {ab.arc.pressure ?? 'quiet'}
          </span>
        </div>
      ))}
    </CollapsibleSection>
  );
}

// ── Section 4: Pressure alerts ─────────────────────────────────────────────

function PressureAlertsSection({
  alerts,
  campaignId,
}: {
  alerts: TrackerAlert[];
  campaignId: string;
}) {
  const adjustTracker = useAdjustTracker();
  if (!alerts.length) return null;
  return (
    <CollapsibleSection title="Pressure Alerts">
      {alerts.map((a) => (
        <div key={a.tracker._id} className="mb-1.5">
          <div className="flex items-center justify-between">
            <span className="flex-1 truncate text-[12px] text-[hsl(38,26%,86%)]">
              {a.tracker.name}
            </span>
            <span className="mr-1.5 text-[10px] text-[hsl(30,14%,54%)]">
              {a.tracker.value}/{a.tracker.max}
            </span>
            <div className="flex gap-0.5">
              <button
                type="button"
                disabled={adjustTracker.isPending}
                onClick={() =>
                  adjustTracker.mutate({
                    campaignId,
                    trackerId: a.tracker._id,
                    delta: -1,
                    reason: 'Adjusted during play',
                  })
                }
                className="flex h-5 w-5 items-center justify-center rounded border border-[hsla(32,24%,24%,0.46)] text-[11px] text-[hsl(30,12%,58%)] transition hover:bg-[hsla(32,20%,20%,0.4)] disabled:opacity-40"
              >
                &minus;
              </button>
              <button
                type="button"
                disabled={adjustTracker.isPending}
                onClick={() =>
                  adjustTracker.mutate({
                    campaignId,
                    trackerId: a.tracker._id,
                    delta: 1,
                    reason: 'Adjusted during play',
                  })
                }
                className="flex h-5 w-5 items-center justify-center rounded border border-[hsla(32,24%,24%,0.46)] text-[11px] text-[hsl(30,12%,58%)] transition hover:bg-[hsla(32,20%,20%,0.4)] disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
          <FillBar percent={a.percent} />
        </div>
      ))}
    </CollapsibleSection>
  );
}

// ── Section 5: Linked encounters ───────────────────────────────────────────

function LinkedEncountersSection({
  encounters,
  onTabChange,
}: {
  encounters: Encounter[];
  onTabChange: (tab: string) => void;
}) {
  if (!encounters.length) return null;
  return (
    <CollapsibleSection title="Linked Encounters">
      {encounters.map((enc) => (
        <button
          key={enc._id}
          type="button"
          onClick={() => onTabChange('encounters')}
          className="mb-1 flex w-full items-center gap-1.5 text-left"
        >
          <span className="flex-1 truncate text-[12px] text-[hsl(38,26%,86%)] hover:text-[hsl(38,50%,78%)]">
            {enc.name}
          </span>
          <StatusBadge label={enc.status} style={encounterStatusStyle(enc.status)} />
        </button>
      ))}
    </CollapsibleSection>
  );
}

// ── Section 6: Session notes ────────────────────────────────────────────────

function SessionNotesSection({
  campaignId,
  session,
}: {
  campaignId: string;
  session: Session | null;
}) {
  const updateSession = useUpdateSession();
  const [localNotes, setLocalNotes] = useState(session?.notes ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when the session changes (e.g. first load, session switch)
  useEffect(() => {
    setLocalNotes(session?.notes ?? '');
  }, [session?._id, session?.notes]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const saveNotes = useCallback(
    (value: string) => {
      if (!session) return;
      updateSession.mutate({ campaignId, id: session._id, data: { notes: value } });
    },
    [session, campaignId, updateSession],
  );

  function handleNotesChange(value: string) {
    setLocalNotes(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveNotes(value), 3000);
  }

  function handleBlur() {
    if (timerRef.current) clearTimeout(timerRef.current);
    saveNotes(localNotes);
  }

  if (!session) {
    return (
      <CollapsibleSection title="Session Notes">
        <p className="text-[11px] text-[hsl(30,12%,58%)]">No active session</p>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection title="Session Notes">
      <textarea
        value={localNotes}
        onChange={(e) => handleNotesChange(e.target.value)}
        onBlur={handleBlur}
        rows={4}
        placeholder="Jot down notes for this session..."
        className="w-full resize-y rounded border border-[hsla(32,26%,26%,0.6)] bg-[hsla(24,14%,9%,0.6)] px-2 py-1.5 text-[12px] text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,44%)] focus:border-[hsl(38,50%,42%)] focus:outline-none"
      />
    </CollapsibleSection>
  );
}

// ── Shared primitives ──────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const Icon = open ? ChevronDown : ChevronRight;
  return (
    <div className="border-b border-[hsla(32,26%,26%,0.3)] px-3 py-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mb-1 flex w-full items-center gap-1 text-left"
      >
        <Icon className="h-3 w-3 text-[hsl(30,14%,54%)]" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-[hsl(30,14%,54%)]">
          {title}
        </span>
      </button>
      {open ? children : null}
    </div>
  );
}

function StatusBadge({ label, style }: { label: string; style: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${style}`}
    >
      {label}
    </span>
  );
}

function FillBar({ percent }: { percent: number }) {
  const clamped = Math.min(Math.max(percent, 0), 1);
  return (
    <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-[hsla(32,16%,20%,0.6)]">
      <div
        className="h-full rounded-full bg-[hsl(38,70%,52%)]"
        style={{ width: `${Math.round(clamped * 100)}%` }}
      />
    </div>
  );
}

// ── Style helpers ──────────────────────────────────────────────────────────

function arcStatusStyle(status: string): string {
  switch (status) {
    case 'active':
    case 'advancing':
      return 'border-[hsla(210,52%,45%,0.32)] bg-[hsla(210,52%,45%,0.12)] text-[hsl(205,80%,72%)]';
    case 'threatened':
      return 'border-[hsla(0,60%,50%,0.32)] bg-[hsla(0,60%,50%,0.12)] text-[hsl(0,70%,72%)]';
    case 'completed':
    case 'resolved':
      return 'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]';
    default:
      return 'border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]';
  }
}

function encounterStatusStyle(status: string): string {
  switch (status) {
    case 'ready':
      return 'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]';
    case 'used':
      return 'border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]';
    default:
      return 'border-[hsla(210,52%,45%,0.32)] bg-[hsla(210,52%,45%,0.12)] text-[hsl(205,80%,72%)]';
  }
}
