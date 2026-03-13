import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Pencil,
  RefreshCw,
  Loader2,
  Dice5,
  Swords,
  Flame,
  Heart,
  Target,
  Skull,
  BookOpen,
  Plus,
  X,
  CalendarDays,
  Flag,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { useCreateSession, useSessions, useUpdateSession, useRegenerateRecap } from '@/hooks/useSessions';
import { useArcs } from '@/hooks/useCampaigns';
import type { Session, CampaignArc } from '@/types/campaign';

interface SessionsPrepPanelProps {
  campaignId: string;
}

export function SessionsPrepPanel({ campaignId }: SessionsPrepPanelProps) {
  const { data: sessions, isLoading } = useSessions(campaignId);
  const { data: arcs } = useArcs(campaignId);
  const createSession = useCreateSession();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [summary, setSummary] = useState('');

  const nextSessionNumber = Math.max(...((sessions ?? []).map((session) => session.sessionNumber)), 0) + 1;

  // Group sessions by status
  const { upcoming, completed, cancelled } = useMemo(() => {
    const all = sessions ?? [];
    const up = all
      .filter((s) => ['draft', 'scheduled', 'ready', 'planned', 'in_progress'].includes(s.status))
      .sort((a, b) => a.sessionNumber - b.sessionNumber);
    const done = all
      .filter((s) => s.status === 'completed')
      .sort((a, b) => {
        if (a.completedAt && b.completedAt) {
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        }
        return b.sessionNumber - a.sessionNumber;
      });
    const can = all
      .filter((s) => s.status === 'cancelled')
      .sort((a, b) => b.sessionNumber - a.sessionNumber);
    return { upcoming: up, completed: done, cancelled: can };
  }, [sessions]);

  // Active arc for focus banner
  const activeArc = useMemo(() => {
    if (!arcs?.length) return null;
    return arcs.find((a: CampaignArc) => a.status === 'active') ?? null;
  }, [arcs]);

  // Next planned session for focus banner
  const nextSession = upcoming[0] ?? null;

  async function handleCreateSession() {
    try {
      await createSession.mutateAsync({
        campaignId,
        sessionNumber: nextSessionNumber,
        title: title.trim() || `Session ${nextSessionNumber}`,
        summary: summary.trim() || undefined,
        scheduledDate: scheduledDate || undefined,
        status: 'planned',
      });
      toast.success(`Session ${nextSessionNumber} planned`);
      setShowCreate(false);
      setTitle('');
      setScheduledDate('');
      setSummary('');
    } catch {
      toast.error('Failed to create session plan');
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessions?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground/60">
          No session plans yet. Create one here so prep has somewhere to live before game night.
        </p>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Plan Session 1
        </Button>
        {showCreate && (
          <SessionPlanForm
            sessionNumber={nextSessionNumber}
            title={title}
            scheduledDate={scheduledDate}
            summary={summary}
            isPending={createSession.isPending}
            onTitleChange={setTitle}
            onScheduledDateChange={setScheduledDate}
            onSummaryChange={setSummary}
            onCancel={() => setShowCreate(false)}
            onSubmit={handleCreateSession}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {renderHeader()}
      {renderFocusBanner()}
      {renderSessionGroups()}
    </div>
  );

  function renderHeader() {
    return (
      <div className="sticky top-0 z-10 border-b border-[hsla(38,30%,25%,0.15)] bg-[hsl(24,18%,9%)]/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-['IM_Fell_English'] text-lg text-foreground">Session Plans</p>
            <p className="text-xs text-muted-foreground">
              Plan upcoming sessions, keep prep notes attached, and review completed recaps.
            </p>
          </div>
          {!showCreate && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Plan Session {nextSessionNumber}
            </Button>
          )}
        </div>
        {showCreate && (
          <div className="mt-3">
            <SessionPlanForm
              sessionNumber={nextSessionNumber}
              title={title}
              scheduledDate={scheduledDate}
              summary={summary}
              isPending={createSession.isPending}
              onTitleChange={setTitle}
              onScheduledDateChange={setScheduledDate}
              onSummaryChange={setSummary}
              onCancel={() => setShowCreate(false)}
              onSubmit={handleCreateSession}
            />
          </div>
        )}
      </div>
    );
  }

  function renderFocusBanner() {
    if (!activeArc && !nextSession) return null;
    return (
      <div className="border-b border-[hsla(38,30%,25%,0.15)] bg-[hsla(38,30%,25%,0.06)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          {activeArc && (
            <div className="flex items-center gap-2">
              <Flag className="h-3.5 w-3.5 text-brass" />
              <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                Active Arc
              </span>
              <span className="font-['IM_Fell_English'] text-sm text-foreground">
                {activeArc.name}
              </span>
              {activeArc.milestones.length > 0 && (
                <ArcProgressPill milestones={activeArc.milestones} />
              )}
            </div>
          )}
          {nextSession && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                Next
              </span>
              <span className="font-['IM_Fell_English'] text-sm text-foreground">
                {nextSession.title ?? `Session ${nextSession.sessionNumber}`}
              </span>
              {nextSession.scheduledDate && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                  {new Date(nextSession.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderSessionGroups() {
    return (
      <div>
        {upcoming.length > 0 && (
          <CollapsibleSection title={`Upcoming (${upcoming.length})`} defaultOpen>
            <div className="divide-y divide-[hsla(38,30%,25%,0.1)]">
              {upcoming.map((session) => (
                <SessionCard key={session._id} session={session} campaignId={campaignId} />
              ))}
            </div>
          </CollapsibleSection>
        )}
        {completed.length > 0 && (
          <CollapsibleSection title={`Completed (${completed.length})`}>
            <div className="divide-y divide-[hsla(38,30%,25%,0.1)]">
              {completed.map((session) => (
                <SessionCard key={session._id} session={session} campaignId={campaignId} />
              ))}
            </div>
          </CollapsibleSection>
        )}
        {cancelled.length > 0 && (
          <CollapsibleSection title={`Cancelled (${cancelled.length})`}>
            <div className="divide-y divide-[hsla(38,30%,25%,0.1)]">
              {cancelled.map((session) => (
                <SessionCard key={session._id} session={session} campaignId={campaignId} />
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    );
  }
}

// ── Arc Progress Pill ────────────────────────────────────────

function ArcProgressPill({ milestones }: { milestones: CampaignArc['milestones'] }) {
  const done = milestones.filter((m) => m.completed).length;
  const total = milestones.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted/30">
        <div
          className="h-full rounded-full bg-brass transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">
        {done}/{total}
      </span>
    </div>
  );
}

// ── Session Plan Form ───────────────────────────────────────

interface SessionPlanFormProps {
  sessionNumber: number;
  title: string;
  scheduledDate: string;
  summary: string;
  isPending: boolean;
  onTitleChange: (value: string) => void;
  onScheduledDateChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

function SessionPlanForm({
  sessionNumber,
  title,
  scheduledDate,
  summary,
  isPending,
  onTitleChange,
  onScheduledDateChange,
  onSummaryChange,
  onCancel,
  onSubmit,
}: SessionPlanFormProps) {
  return (
    <div className="rounded-xl border border-[hsla(38,30%,25%,0.18)] bg-[hsla(38,30%,18%,0.08)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
            New Session Plan
          </p>
          <p className="mt-1 font-['IM_Fell_English'] text-base text-foreground">
            Session {sessionNumber}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-background/50 hover:text-foreground"
          aria-label="Close session plan form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.4fr_0.9fr]">
        <label className="space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
            Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={`Session ${sessionNumber}`}
            maxLength={200}
            className="w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/45 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
            Scheduled Date
          </span>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => onScheduledDateChange(e.target.value)}
            className="w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </label>
      </div>

      <label className="mt-3 block space-y-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
          Prep Summary
        </span>
        <textarea
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder="What is this session about? Add the expected scene, hook, or problem to solve."
          rows={4}
          maxLength={10000}
          className="w-full resize-y rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/45 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1.5 h-4 w-4" />
          )}
          Create Session Plan
        </Button>
      </div>
    </div>
  );
}

// ── Session Card ─────────────────────────────────────────────

function SessionCard({ session, campaignId }: { session: Session; campaignId: string }) {
  const [expanded, setExpanded] = useState(false);

  const statusLabel: Record<Session['status'], string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    ready: 'Ready',
    planned: 'Planned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const statusColor: Record<Session['status'], string> = {
    draft: 'text-muted-foreground/60 bg-muted/20',
    scheduled: 'text-primary bg-primary/10',
    ready: 'text-emerald-400 bg-emerald-400/10',
    planned: 'text-muted-foreground/60 bg-muted/20',
    in_progress: 'text-amber-400 bg-amber-400/10',
    completed: 'text-emerald-400 bg-emerald-400/10',
    cancelled: 'text-red-400/60 bg-red-400/10',
  };

  function formatDuration(minutes: number) {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  function formatDate(iso?: string) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[hsla(38,30%,30%,0.06)]"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}

        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/15 text-xs font-bold text-primary">
          {session.sessionNumber}
        </span>

        <span className="flex-1 truncate font-['IM_Fell_English'] text-sm text-foreground">
          {session.title ?? `Session ${session.sessionNumber}`}
        </span>

        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${statusColor[session.status]}`}
        >
          {statusLabel[session.status]}
        </span>

        {formatDate(session.completedAt ?? session.scheduledDate) && (
          <span className="shrink-0 text-xs text-muted-foreground/50">
            {formatDate(session.completedAt ?? session.scheduledDate)}
          </span>
        )}

        {formatDuration(session.durationMinutes) && (
          <span className="shrink-0 text-xs text-muted-foreground/50">
            {formatDuration(session.durationMinutes)}
          </span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-[hsla(38,30%,25%,0.1)] bg-[hsla(38,30%,20%,0.03)] px-4 pb-4 pt-3">
          <SessionCardBody session={session} campaignId={campaignId} />
        </div>
      )}
    </div>
  );
}

// ── Session Card Body ────────────────────────────────────────

function SessionCardBody({ session, campaignId }: { session: Session; campaignId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <StatisticsRow statistics={session.statistics} />
      <RecapSection session={session} campaignId={campaignId} />
      <NotesSection session={session} campaignId={campaignId} />
    </div>
  );
}

// ── Statistics Row ───────────────────────────────────────────

function StatisticsRow({ statistics }: { statistics: Session['statistics'] }) {
  const stats = [
    { icon: Dice5, label: 'Dice', value: statistics.diceRolls },
    { icon: Swords, label: 'Rounds', value: statistics.combatRounds },
    { icon: Flame, label: 'Damage', value: statistics.damageDealt },
    { icon: Heart, label: 'Healing', value: statistics.healingDone },
    { icon: Target, label: 'Crits', value: statistics.criticalHits },
    { icon: Skull, label: 'Misses', value: statistics.criticalMisses },
  ];

  const hasAny = stats.some((s) => s.value > 0);
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {stats.map(({ icon: Icon, label, value }) =>
        value > 0 ? (
          <div
            key={label}
            className="flex items-center gap-1.5 rounded bg-[hsla(38,30%,25%,0.12)] px-2 py-1"
          >
            <Icon className="h-3 w-3 text-primary/60" />
            <span className="text-xs font-medium text-foreground">{value}</span>
            <span className="text-[10px] text-muted-foreground/60">{label}</span>
          </div>
        ) : null,
      )}
    </div>
  );
}

// ── Recap Section ────────────────────────────────────────────

function RecapSection({ session, campaignId }: { session: Session; campaignId: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const updateSession = useUpdateSession();
  const regenerate = useRegenerateRecap();

  function startEdit() {
    setDraft(session.aiRecap ?? '');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft('');
  }

  function handleSave() {
    updateSession.mutate(
      { campaignId, id: session._id, data: { aiRecap: draft } },
      {
        onSuccess: () => {
          toast.success('Recap saved');
          setEditing(false);
          setDraft('');
        },
        onError: () => toast.error('Failed to save recap'),
      },
    );
  }

  function handleCopy() {
    if (session.aiRecap) {
      navigator.clipboard.writeText(session.aiRecap);
      toast.success('Recap copied to clipboard');
    }
  }

  function handleRegenerate() {
    regenerate.mutate(
      { campaignId, sessionId: session._id },
      {
        onSuccess: () => toast.success('Recap regenerated'),
        onError: () => toast.error('Failed to regenerate recap'),
      },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          Recap
        </span>
        {!editing && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!session.aiRecap}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              title="Copy recap"
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={startEdit}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              title="Edit recap"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerate.isPending}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              title="Regenerate AI recap"
            >
              <RefreshCw
                className={`h-3 w-3 ${regenerate.isPending ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            className="w-full resize-y rounded border border-[hsla(38,30%,25%,0.3)] bg-[hsla(38,30%,20%,0.06)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
            placeholder="Write your session recap here…"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateSession.isPending}
              className="flex items-center gap-1.5 rounded bg-primary/20 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/30 disabled:opacity-50"
            >
              {updateSession.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Save
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={updateSession.isPending}
              className="rounded px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : session.aiRecap ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {session.aiRecap}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground/40 italic">
          No recap generated yet.{' '}
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerate.isPending}
            className="underline underline-offset-2 transition-opacity hover:opacity-80 disabled:opacity-30"
          >
            Generate one now
          </button>
          {regenerate.isPending && ' Generating…'}
        </p>
      )}
    </div>
  );
}

// ── Notes Section ────────────────────────────────────────────

function NotesSection({ session, campaignId }: { session: Session; campaignId: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const updateSession = useUpdateSession();

  function startEdit() {
    setDraft(session.notes ?? '');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft('');
  }

  function handleSave() {
    updateSession.mutate(
      { campaignId, id: session._id, data: { notes: draft } },
      {
        onSuccess: () => {
          toast.success('Notes saved');
          setEditing(false);
          setDraft('');
        },
        onError: () => toast.error('Failed to save notes'),
      },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          Session Notes
        </span>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            title="Edit notes"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className="w-full resize-y rounded border border-[hsla(38,30%,25%,0.3)] bg-[hsla(38,30%,20%,0.06)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
            placeholder="Add session notes…"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateSession.isPending}
              className="flex items-center gap-1.5 rounded bg-primary/20 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/30 disabled:opacity-50"
            >
              {updateSession.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Save
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={updateSession.isPending}
              className="rounded px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : session.notes ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {session.notes}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground/40 italic">
          No notes for this session.{' '}
          <button
            type="button"
            onClick={startEdit}
            className="underline underline-offset-2 transition-opacity hover:opacity-80"
          >
            Add some
          </button>
        </p>
      )}
    </div>
  );
}
