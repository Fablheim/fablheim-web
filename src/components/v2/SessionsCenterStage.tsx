import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Loader2,
  NotebookPen,
  Plus,
  ScrollText,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useCreateSession, useSessions, useUpdateSession } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type { CreateSessionRequest, Session, SessionScene, UpdateSessionRequest, WorldEntity } from '@/types/campaign';
import { ENTITY_TYPE_CONFIG } from './world/world-config';
import { useWorldExplorerContext } from './world/useWorldExplorerContext';
import { formatWorldEntityContext, startCase } from './world/world-ui';

interface SessionsCenterStageProps {
  campaignId: string;
  onOpenWorldEntity: () => void;
}

type SessionPlanStatus = 'draft' | 'scheduled' | 'ready' | 'planned' | 'in_progress' | 'completed' | 'cancelled';

const UPCOMING_STATUSES: SessionPlanStatus[] = ['ready', 'scheduled', 'planned', 'draft', 'in_progress'];

const STATUS_OPTIONS: Array<{ value: SessionPlanStatus; label: string; hint: string }> = [
  { value: 'draft', label: 'Draft', hint: 'Early idea that still needs shaping.' },
  { value: 'scheduled', label: 'Scheduled', hint: 'Date is on the calendar, prep is still forming.' },
  { value: 'ready', label: 'Ready', hint: 'Scheduled and mostly prepped.' },
  { value: 'in_progress', label: 'Live', hint: 'Currently being played.' },
  { value: 'completed', label: 'Completed', hint: 'Already played and archived into campaign memory.' },
  { value: 'cancelled', label: 'Cancelled', hint: 'Set aside or no longer happening.' },
];

const STATUS_STYLES: Record<SessionPlanStatus, string> = {
  draft: 'border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]',
  scheduled: 'border-[hsla(210,52%,45%,0.32)] bg-[hsla(210,52%,45%,0.12)] text-[hsl(205,80%,72%)]',
  ready: 'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]',
  planned: 'border-[hsla(210,52%,45%,0.32)] bg-[hsla(210,52%,45%,0.12)] text-[hsl(205,80%,72%)]',
  in_progress: 'border-[hsla(38,70%,52%,0.32)] bg-[hsla(38,70%,46%,0.12)] text-[hsl(38,82%,63%)]',
  completed: 'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]',
  cancelled: 'border-[hsla(0,0%,40%,0.28)] bg-[hsla(0,0%,40%,0.1)] text-[hsl(30,8%,58%)]',
};

export function SessionsCenterStage({
  campaignId,
  onOpenWorldEntity,
}: SessionsCenterStageProps) {
  const { data: sessions, isLoading } = useSessions(campaignId);
  const { data: worldEntities } = useWorldEntities(campaignId);
  const {
    requestEntityNavigation,
    pendingSessionNavigationId,
    requestSessionNavigation,
    setActiveSessionId: setBrainSessionId,
    setActiveEntityId,
    setActiveView,
  } = useWorldExplorerContext();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createDraft, setCreateDraft] = useState(() => getEmptyCreateDraft());

  const sortedSessions = useMemo(
    () => [...(sessions ?? [])].sort(compareSessionsForPlanView),
    [sessions],
  );

  const nextSessionNumber = useMemo(
    () => Math.max(...(sortedSessions.map((session) => session.sessionNumber)), 0) + 1,
    [sortedSessions],
  );

  const nextSession = useMemo(
    () => sortedSessions.find((session) => isUpcomingStatus(session.status)) ?? null,
    [sortedSessions],
  );

  const selectedSession = useMemo(
    () => sortedSessions.find((session) => session._id === selectedSessionId) ?? nextSession ?? null,
    [nextSession, selectedSessionId, sortedSessions],
  );

  const priorSession = useMemo(
    () => (selectedSession ? findPriorSession(selectedSession, sortedSessions) : null),
    [selectedSession, sortedSessions],
  );

  useEffect(() => {
    setActiveEntityId(null);
    setActiveView(null);
    setBrainSessionId(selectedSession?._id ?? null);
    return () => {
      setBrainSessionId(null);
    };
  }, [selectedSession?._id, setActiveEntityId, setActiveView, setBrainSessionId]);

  useEffect(() => {
    if (!pendingSessionNavigationId) return;
    setSelectedSessionId(pendingSessionNavigationId);
    requestSessionNavigation(null);
  }, [pendingSessionNavigationId, requestSessionNavigation]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-[hsl(30,14%,40%)]">Loading session plans…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[hsla(32,26%,26%,0.4)] px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              className="text-[14px] text-[hsl(38,36%,82%)]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Session Plans
            </h2>
            <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">
              Plan the next session, connect it to campaign threads, and see what still needs prep.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setShowCreateForm((current) => !current);
              setCreateDraft(getEmptyCreateDraft(nextSessionNumber));
            }}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Plan Session {nextSessionNumber}
          </Button>
        </div>

        {showCreateForm && (
          <SessionPlanCreateForm
            draft={createDraft}
            sessionNumber={nextSessionNumber}
            isPending={createSession.isPending}
            onChange={setCreateDraft}
            onCancel={() => {
              setShowCreateForm(false);
              setCreateDraft(getEmptyCreateDraft(nextSessionNumber));
            }}
            onSubmit={handleCreateSession}
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex w-full max-w-[920px] flex-col gap-5 pb-10">
          {nextSession ? (
            <NextSessionCard
              session={nextSession}
              worldEntities={worldEntities ?? []}
            />
          ) : (
            <EmptyNextSessionCard />
          )}

          {selectedSession ? (
            <SessionPlanDetail
              key={selectedSession._id}
              session={selectedSession}
              priorSession={priorSession}
              worldEntities={worldEntities ?? []}
              isPending={updateSession.isPending}
              onSave={(data) => handleUpdateSession(selectedSession._id, data)}
              onOpenWorldEntity={openWorldEntity}
              onBack={nextSession && selectedSession._id !== nextSession._id ? () => setSelectedSessionId(nextSession._id) : undefined}
            />
          ) : (
            <EmptyDetailCard />
          )}
        </div>
      </div>
    </div>
  );

  async function handleCreateSession() {
    const payload = buildSessionPayload({
      campaignId,
      sessionNumber: nextSessionNumber,
      title: createDraft.title.trim() || `Session ${nextSessionNumber}`,
      summary: createDraft.summary,
      notes: createDraft.notes,
      status: createDraft.status,
      date: createDraft.date,
      time: createDraft.time,
      durationMinutes: createDraft.durationMinutes,
    });

    try {
      const created = await createSession.mutateAsync(payload);
      toast.success(`Session ${created.sessionNumber} planned`);
      setShowCreateForm(false);
      setCreateDraft(getEmptyCreateDraft(created.sessionNumber + 1));
      setSelectedSessionId(created._id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create session plan');
    }
  }

  async function handleUpdateSession(sessionId: string, data: UpdateSessionRequest) {
    try {
      await updateSession.mutateAsync({ campaignId, id: sessionId, data });
      toast.success('Session plan updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update session plan');
    }
  }

  function openWorldEntity(entityId: string) {
    requestEntityNavigation(entityId);
    onOpenWorldEntity();
  }

}

function SessionPlanCreateForm({
  draft,
  sessionNumber,
  isPending,
  onChange,
  onCancel,
  onSubmit,
}: {
  draft: SessionEditorState;
  sessionNumber: number;
  isPending: boolean;
  onChange: Dispatch<SetStateAction<SessionEditorState>>;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="mt-4 rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.74)] p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-[hsl(30,12%,58%)]">
            New Session Plan
          </p>
          <p className="mt-1 text-[13px] text-[hsl(35,24%,92%)]">Session {sessionNumber}</p>
        </div>
      </div>

      <SessionScheduleFields state={draft} onChange={onChange} includePremise />

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
          Create Session Plan
        </Button>
      </div>
    </form>
  );
}

function NextSessionCard({
  session,
  worldEntities,
}: {
  session: Session;
  worldEntities: WorldEntity[];
}) {
  const links = buildSessionWorldLinks(session, worldEntities);
  const scenes = buildSessionSceneOutline(session, worldEntities);
  const missingPrep = buildMissingPrepNote(session, links, scenes.length);

  return (
    <section className="rounded-2xl border border-[hsla(32,26%,26%,0.42)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.97),hsla(24,14%,11%,0.99))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            Next Session
          </p>
          <h3
            className="mt-1 text-[20px] text-[hsl(35,24%,92%)]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {formatSessionIdentity(session)}
          </h3>
          <p className="mt-2 max-w-[680px] text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">
            {extractPremise(session)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill status={normalizePlanStatus(session.status)} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[hsl(30,16%,72%)]">
        <span>{formatScheduleLine(session)}</span>
        {session.durationMinutes > 0 && <span>{formatDuration(session.durationMinutes)} planned</span>}
        {(links.npcs.length > 0 || links.locations.length > 0 || links.quests.length > 0) && (
          <span>{summarizeLinkedWorld(links)}</span>
        )}
      </div>

      {missingPrep && (
        <p className="mt-3 text-[11px] text-[hsl(30,12%,58%)]">{missingPrep}</p>
      )}

      {scenes.length > 0 && (
        <div className="mt-4 rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.62)] px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">Scenes</p>
          <p className="mt-1 text-[12px] text-[hsl(35,24%,92%)]">{scenes.slice(0, 3).map((scene) => scene.title).join(' · ')}</p>
        </div>
      )}
    </section>
  );
}

function SessionPlanDetail({
  session,
  priorSession,
  worldEntities,
  isPending,
  onSave,
  onOpenWorldEntity,
  onBack,
}: {
  session: Session;
  priorSession: Session | null;
  worldEntities: WorldEntity[];
  isPending: boolean;
  onSave: (data: UpdateSessionRequest) => void;
  onOpenWorldEntity: (entityId: string) => void;
  onBack?: () => void;
}) {
  const [editor, setEditor] = useState(() => getEditorStateFromSession(session));
  const links = useMemo(() => buildSessionWorldLinks({ ...session, ...pickLinkedFields(editor) }, worldEntities), [editor, session, worldEntities]);
  const scenes = useMemo(() => buildSessionSceneOutline({ ...session, ...pickLinkedFields(editor), summary: editor.summary, notes: editor.notes }, worldEntities), [editor, session, worldEntities]);
  const carryover = useMemo(() => buildCarryoverNotes(priorSession), [priorSession]);
  const missingPrep = buildMissingPrepNote(
    {
      ...session,
      summary: editor.summary,
      notes: editor.notes,
      scheduledDate: combineDateAndTime(editor.date, editor.time),
      ...pickLinkedFields(editor),
    },
    links,
    scenes.length,
  );

  return (
    <section className="space-y-5 rounded-2xl border border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,15%,11%,0.9)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-2 inline-flex items-center gap-1 text-[11px] text-[hsl(30,12%,58%)] hover:text-[hsl(35,24%,92%)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to next session
            </button>
          )}
          <h3
            className="text-[18px] text-[hsl(38,36%,82%)]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {formatSessionIdentity(session)}
          </h3>
          <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">
            {formatScheduleLine({
              ...session,
              scheduledDate: combineDateAndTime(editor.date, editor.time),
            } as Session)}
          </p>
          {missingPrep && <p className="mt-2 text-[11px] text-[hsl(30,12%,58%)]">{missingPrep}</p>}
        </div>
        <StatusPill status={editor.status} />
      </div>

      <DetailSection icon={CalendarDays} title="Identity / Schedule" subtitle="Keep the next session concrete.">
        <SessionScheduleFields state={editor} onChange={setEditor} includePremise={false} />
        <div className="mt-3 flex justify-end">
          <Button type="button" onClick={() => onSave(buildUpdatePayload(editor))} disabled={isPending}>
            {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Save details
          </Button>
        </div>
      </DetailSection>

      <DetailSection icon={ScrollText} title="Premise" subtitle="What is this session about?">
        <textarea
          value={editor.summary}
          onChange={(event) => setEditor((current) => ({ ...current, summary: event.target.value }))}
          rows={4}
          className={textAreaClass}
          placeholder="What is this session about?"
        />
        <div className="mt-3 flex justify-end">
          <Button type="button" onClick={() => onSave({ summary: editor.summary })} disabled={isPending}>
            Save premise
          </Button>
        </div>
      </DetailSection>

      <DetailSection icon={Sparkles} title="Scenes" subtitle="Likely beats of play.">
        <SceneOutlineEditor
          scenes={editor.scenes}
          locationOptions={worldEntities.filter((entity) => entity.type === 'location' || entity.type === 'location_detail')}
          onChange={(scenesValue) => setEditor((current) => ({ ...current, scenes: scenesValue }))}
        />
        {editor.scenes.length === 0 && scenes.length > 0 && (
          <div className="mt-3">
            <ExpectedScenesBlock scenes={scenes} />
          </div>
        )}
        <div className="mt-3 flex justify-end">
          <Button type="button" onClick={() => onSave({ scenes: editor.scenes })} disabled={isPending}>
            Save scenes
          </Button>
        </div>
      </DetailSection>

      <DetailSection icon={NotebookPen} title="Prep Notes" subtitle="Loose reminders, beats, and table notes.">
        {carryover.length > 0 && (
          <div className="mb-3 rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
              Carryover from {formatSessionIdentity(priorSession!)}
            </p>
            <ul className="mt-2 space-y-1.5">
              {carryover.map((item) => (
                <li key={item} className="flex gap-2 text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(38,82%,63%)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <textarea
          value={editor.notes}
          onChange={(event) => setEditor((current) => ({ ...current, notes: event.target.value }))}
          rows={7}
          className={textAreaClass}
          placeholder="Prep notes, reminders, encounter thoughts, callbacks."
        />
        <div className="mt-3 flex justify-end">
          <Button type="button" onClick={() => onSave({ notes: editor.notes })} disabled={isPending}>
            Save notes
          </Button>
        </div>
      </DetailSection>

      <DetailSection icon={Users} title="In Play" subtitle="Who, where, and which threads matter in this session.">
        <div className="space-y-4">
          <LinkedEntityEditor
            title="NPCs in Play"
            items={links.npcs}
            ids={editor.npcIds}
            options={worldEntities.filter((entity) => entity.type === 'npc' || entity.type === 'npc_minor')}
            emptyLabel="No NPCs linked yet."
            onIdsChange={(npcIds) => setEditor((current) => ({ ...current, npcIds }))}
            onOpenWorldEntity={onOpenWorldEntity}
          />
          <LinkedEntityEditor
            title="Locations in Play"
            items={links.locations}
            ids={editor.locationIds}
            options={worldEntities.filter((entity) => entity.type === 'location' || entity.type === 'location_detail')}
            emptyLabel="No locations linked yet."
            onIdsChange={(locationIds) => setEditor((current) => ({ ...current, locationIds }))}
            onOpenWorldEntity={onOpenWorldEntity}
          />
          <LinkedEntityEditor
            title="Open Threads"
            items={links.quests}
            ids={editor.questIds}
            options={worldEntities.filter((entity) => entity.type === 'quest')}
            emptyLabel="No quest threads linked yet."
            onIdsChange={(questIds) => setEditor((current) => ({ ...current, questIds }))}
            onOpenWorldEntity={onOpenWorldEntity}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            onClick={() => onSave({ npcIds: editor.npcIds, locationIds: editor.locationIds, questIds: editor.questIds })}
            disabled={isPending}
          >
            Save links
          </Button>
        </div>
      </DetailSection>
    </section>
  );
}

function DetailSection({
  sectionId,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  sectionId?: string;
  icon: typeof BookOpen;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section id={sectionId} className="space-y-2">
      <div>
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-[hsl(38,82%,63%)]" />
          <h4 className="text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]">
            {title}
          </h4>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function SessionScheduleFields({
  state,
  onChange,
  includePremise,
}: {
  state: SessionEditorState;
  onChange: Dispatch<SetStateAction<SessionEditorState>>;
  includePremise: boolean;
}) {
  const update = (patch: Partial<SessionEditorState>) => {
    if (typeof onChange === 'function') {
      onChange((current) => ({ ...current, ...patch }));
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
        <Field>
          <FieldLabel htmlFor="session-title">Title</FieldLabel>
          <input
            id="session-title"
            type="text"
            value={state.title}
            onChange={(event) => update({ title: event.target.value })}
            className={inputClass}
            placeholder="Session title"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="session-status">Prep status</FieldLabel>
          <select
            id="session-status"
            value={state.status}
            onChange={(event) => update({ status: event.target.value as SessionPlanStatus })}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="session-date">Date</FieldLabel>
          <input
            id="session-date"
            type="date"
            value={state.date}
            onChange={(event) => update({ date: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="session-time">Time</FieldLabel>
          <input
            id="session-time"
            type="time"
            value={state.time}
            onChange={(event) => update({ time: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="session-duration">Duration</FieldLabel>
          <input
            id="session-duration"
            type="number"
            min={0}
            step={15}
            value={state.durationMinutes}
            onChange={(event) => update({ durationMinutes: Number(event.target.value) || 0 })}
            className={inputClass}
            placeholder="Minutes"
          />
        </Field>
      </div>

      {includePremise && (
        <Field>
          <FieldLabel htmlFor="session-premise">Premise</FieldLabel>
          <textarea
            id="session-premise"
            rows={4}
            value={state.summary}
            onChange={(event) => update({ summary: event.target.value })}
            className={textAreaClass}
            placeholder="What is likely to happen in this session?"
          />
        </Field>
      )}
    </div>
  );
}

function LinkedEntityEditor({
  title,
  items,
  ids,
  options,
  emptyLabel,
  onIdsChange,
  onOpenWorldEntity,
}: {
  title: string;
  items: WorldEntity[];
  ids: string[];
  options: WorldEntity[];
  emptyLabel: string;
  onIdsChange: (ids: string[]) => void;
  onOpenWorldEntity: (entityId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState('');
  const available = options.filter((option) => !ids.includes(option._id));

  return (
    <div className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]">{title}</p>
        {!ids.length && items.length > 0 && (
          <span className="text-[10px] text-[hsl(30,12%,58%)]">Shown from existing session notes</span>
        )}
      </div>

      {items.length ? (
        <div className="mt-2 space-y-1.5">
          {items.map((entity) => {
            const Icon = ENTITY_TYPE_CONFIG[entity.type].icon;
            const isExplicit = ids.includes(entity._id);
            return (
              <div
                key={entity._id}
                className="flex items-center gap-2 rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,14%,10%,0.72)] px-3 py-2"
              >
                <button type="button" onClick={() => onOpenWorldEntity(entity._id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
                    style={{
                      backgroundColor: `${ENTITY_TYPE_CONFIG[entity.type].color}15`,
                      color: ENTITY_TYPE_CONFIG[entity.type].color,
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] text-[hsl(35,24%,92%)]">{entity.name}</p>
                    <p className="truncate text-[11px] text-[hsl(30,12%,58%)]">{formatWorldEntityContext(entity)}</p>
                  </div>
                </button>
                {isExplicit && (
                  <button
                    type="button"
                    onClick={() => onIdsChange(ids.filter((id) => id !== entity._id))}
                    className="rounded p-1 text-[hsl(30,12%,58%)] hover:text-[hsl(35,24%,92%)]"
                    aria-label={`Remove ${entity.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-[hsl(30,12%,58%)]">{emptyLabel}</p>
      )}

      <div className="mt-3 flex gap-2">
        <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className={inputClass}>
          <option value="">Add link…</option>
          {available.map((option) => (
            <option key={option._id} value={option._id}>
              {option.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!selectedId) return;
            onIdsChange([...ids, selectedId]);
            setSelectedId('');
          }}
          disabled={!selectedId}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

function EmptyNextSessionCard() {
  return (
    <section className="rounded-2xl border border-dashed border-[hsla(32,26%,26%,0.45)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.92),hsla(24,14%,11%,0.96))] p-5">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Next Session</p>
      <h3
        className="mt-1 text-[20px] text-[hsl(35,24%,92%)]"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        Nothing planned yet
      </h3>
      <p className="mt-2 text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">
        Plan the next session here so campaign prep has a concrete destination instead of living in scattered notes.
      </p>
    </section>
  );
}

function EmptyDetailCard() {
  return (
    <section className="rounded-2xl border border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,15%,11%,0.9)] p-4">
      <p className="text-[12px] text-[hsl(30,12%,58%)]">
        Select a session plan to review its premise, linked campaign content, and missing prep.
      </p>
    </section>
  );
}

function StatusPill({
  status,
  compact = false,
}: {
  status: SessionPlanStatus;
  compact?: boolean;
}) {
  return (
    <span
      className={`rounded-full border py-0.5 text-[10px] uppercase tracking-[0.08em] ${compact ? 'px-2' : 'px-2.5'} ${STATUS_STYLES[status]}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function ExpectedScenesBlock({
  scenes,
}: {
  scenes: SessionScene[];
}) {
  if (!scenes.length) {
    return (
      <p className="text-[12px] text-[hsl(30,12%,58%)]">
        No scenes outlined yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {scenes.map((scene) => (
        <div
          key={scene.id}
          className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3.5 py-3"
        >
          <p className="text-[12px] text-[hsl(35,24%,92%)]">{scene.title}</p>
          {scene.description && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">{scene.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function SceneOutlineEditor({
  scenes,
  locationOptions,
  onChange,
}: {
  scenes: SessionScene[];
  locationOptions: WorldEntity[];
  onChange: (scenes: SessionScene[]) => void;
}) {
  return (
    <div className="space-y-3">
      {scenes.map((scene, index) => (
        <div
          key={scene.id}
          className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] p-3"
        >
          <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr_auto]">
            <Field>
              <FieldLabel htmlFor={`scene-title-${scene.id}`}>{`Scene ${index + 1}`}</FieldLabel>
              <input
                id={`scene-title-${scene.id}`}
                type="text"
                value={scene.title}
                onChange={(event) => onChange(updateScene(scenes, scene.id, { title: event.target.value }))}
                className={inputClass}
                placeholder="Arrival at Stormhold"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`scene-location-${scene.id}`}>Location</FieldLabel>
              <select
                id={`scene-location-${scene.id}`}
                value={scene.locationId ?? ''}
                onChange={(event) => onChange(updateScene(scenes, scene.id, { locationId: event.target.value || undefined }))}
                className={inputClass}
              >
                <option value="">None</option>
                {locationOptions.map((option) => (
                  <option key={option._id} value={option._id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <Button type="button" variant="ghost" onClick={() => onChange(scenes.filter((item) => item.id !== scene.id))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <FieldLabel htmlFor={`scene-description-${scene.id}`}>Note</FieldLabel>
            <textarea
              id={`scene-description-${scene.id}`}
              rows={3}
              value={scene.description ?? ''}
              onChange={(event) => onChange(updateScene(scenes, scene.id, { description: event.target.value }))}
              className={textAreaClass}
              placeholder="What should happen in this beat?"
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={() => onChange([...scenes, createSceneDraft(scenes.length + 1)])}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add scene
      </Button>
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
      {children}
    </label>
  );
}

type SessionEditorState = {
  title: string;
  summary: string;
  notes: string;
  date: string;
  time: string;
  durationMinutes: number;
  status: SessionPlanStatus;
  npcIds: string[];
  locationIds: string[];
  questIds: string[];
  scenes: SessionScene[];
};

function getEmptyCreateDraft(sessionNumber = 1): SessionEditorState {
  return {
    title: `Session ${sessionNumber}`,
    summary: '',
    notes: '',
    date: '',
    time: '',
    durationMinutes: 180,
    status: 'draft',
    npcIds: [],
    locationIds: [],
    questIds: [],
    scenes: [],
  };
}

function getEditorStateFromSession(session: Session): SessionEditorState {
  const { date, time } = splitScheduledDate(session.scheduledDate);
  return {
    title: session.title ?? `Session ${session.sessionNumber}`,
    summary: session.summary ?? '',
    notes: session.notes ?? '',
    date,
    time,
    durationMinutes: session.durationMinutes || 0,
    status: normalizePlanStatus(session.status),
    npcIds: session.npcIds ?? [],
    locationIds: session.locationIds ?? [],
    questIds: session.questIds ?? [],
    scenes: session.scenes ?? [],
  };
}

function buildSessionPayload(input: {
  campaignId: string;
  sessionNumber: number;
  title: string;
  summary: string;
  notes: string;
  status: SessionPlanStatus;
  date: string;
  time: string;
  durationMinutes: number;
}): CreateSessionRequest {
  return {
    campaignId: input.campaignId,
    sessionNumber: input.sessionNumber,
    title: input.title,
    summary: input.summary.trim() || undefined,
    notes: input.notes.trim() || undefined,
    scheduledDate: combineDateAndTime(input.date, input.time),
    status: input.status,
    durationMinutes: input.durationMinutes || undefined,
    npcIds: [],
    locationIds: [],
    questIds: [],
    scenes: [],
  };
}

function buildUpdatePayload(editor: SessionEditorState): UpdateSessionRequest {
  return {
    title: editor.title.trim() || undefined,
    summary: editor.summary.trim() || undefined,
    notes: editor.notes.trim() || undefined,
    scheduledDate: combineDateAndTime(editor.date, editor.time),
    durationMinutes: editor.durationMinutes || 0,
    status: editor.status,
    npcIds: editor.npcIds,
    locationIds: editor.locationIds,
    questIds: editor.questIds,
    scenes: editor.scenes,
  };
}

function normalizePlanStatus(status: Session['status']): SessionPlanStatus {
  return status === 'planned' ? 'scheduled' : status;
}

function getStatusLabel(status: SessionPlanStatus) {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'scheduled':
    case 'planned':
      return 'Scheduled';
    case 'ready':
      return 'Ready';
    case 'in_progress':
      return 'Live';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return startCase(status);
  }
}

function isUpcomingStatus(status: Session['status']) {
  return UPCOMING_STATUSES.includes(normalizePlanStatus(status));
}

function compareSessionsForPlanView(a: Session, b: Session) {
  const aUpcoming = isUpcomingStatus(a.status);
  const bUpcoming = isUpcomingStatus(b.status);
  if (aUpcoming && !bUpcoming) return -1;
  if (!aUpcoming && bUpcoming) return 1;

  const aTime = getSessionSortTime(a);
  const bTime = getSessionSortTime(b);
  if (aUpcoming) return aTime - bTime || a.sessionNumber - b.sessionNumber;
  return bTime - aTime || b.sessionNumber - a.sessionNumber;
}

function getSessionSortTime(session: Session) {
  const candidate = session.scheduledDate || session.startedAt || session.completedAt || session.updatedAt || session.createdAt;
  return candidate ? new Date(candidate).getTime() : 0;
}

function formatSessionIdentity(session: Session) {
  return session.title?.trim() || `Session ${session.sessionNumber}`;
}

function formatScheduleLine(session: Session) {
  if (!session.scheduledDate) return 'Not scheduled yet';
  const date = new Date(session.scheduledDate);
  if (Number.isNaN(date.getTime())) return 'Schedule unavailable';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function extractPremise(session: Session) {
  return session.summary?.trim()
    || session.aiSummary?.summary?.trim()
    || session.notes?.trim()
    || 'No premise written yet. Capture the likely conflict, scene, or promise of play here.';
}

function buildSessionWorldLinks(session: Session, worldEntities: WorldEntity[]) {
  const explicitNpcs = resolveEntitiesByIds(session.npcIds, worldEntities);
  const explicitLocations = resolveEntitiesByIds(session.locationIds, worldEntities);
  const explicitQuests = resolveEntitiesByIds(session.questIds, worldEntities);

  const content = [
    formatSessionIdentity(session),
    session.summary ?? '',
    session.notes ?? '',
    session.aiRecap ?? '',
    session.aiSummary?.summary ?? '',
    ...(session.aiSummary?.keyEvents ?? []),
    ...(session.aiSummary?.unresolvedHooks ?? []),
    ...(session.statistics.keyMoments ?? []),
    ...(session.statistics.npcsIntroduced ?? []),
    ...(session.statistics.questsAdvanced ?? []),
  ]
    .join(' ')
    .toLowerCase();

  const npcs = dedupeEntities(
    explicitNpcs.length ? explicitNpcs : worldEntities.filter(
      (entity) =>
        (entity.type === 'npc' || entity.type === 'npc_minor') &&
        (session.statistics.npcsIntroduced.includes(entity.name) || content.includes(entity.name.toLowerCase())),
    ),
  ).slice(0, 6);

  const quests = dedupeEntities(
    explicitQuests.length ? explicitQuests : worldEntities.filter(
      (entity) =>
        entity.type === 'quest' &&
        (session.statistics.questsAdvanced.includes(entity.name) || content.includes(entity.name.toLowerCase())),
    ),
  ).slice(0, 6);

  const locations = dedupeEntities(
    explicitLocations.length ? explicitLocations : worldEntities.filter(
      (entity) =>
        (entity.type === 'location' || entity.type === 'location_detail') &&
        content.includes(entity.name.toLowerCase()),
    ),
  ).slice(0, 6);

  return { npcs, quests, locations };
}

function summarizeLinkedWorld(links: { npcs: WorldEntity[]; quests: WorldEntity[]; locations: WorldEntity[] }) {
  const parts = [];
  if (links.quests.length) parts.push(`${links.quests.length} quest${links.quests.length === 1 ? '' : 's'}`);
  if (links.npcs.length) parts.push(`${links.npcs.length} NPC${links.npcs.length === 1 ? '' : 's'}`);
  if (links.locations.length) parts.push(`${links.locations.length} location${links.locations.length === 1 ? '' : 's'}`);
  return parts.join(' · ') || 'No campaign links yet';
}

function extractBulletLikeLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter((line) => line.length > 12);
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function buildSessionSceneOutline(session: Session, worldEntities: WorldEntity[]) {
  if (session.scenes?.length) {
    return session.scenes.map((scene) => {
      const location = scene.locationId ? worldEntities.find((entity) => entity._id === scene.locationId) : undefined;
      return {
        ...scene,
        title: location ? `${scene.title} — ${location.name}` : scene.title,
      };
    });
  }

  return dedupeStrings([
    ...extractBulletLikeLines(session.summary ?? ''),
    ...extractBulletLikeLines(session.notes ?? ''),
    ...(session.aiSummary?.keyEvents ?? []),
    ...(session.statistics.keyMoments ?? []),
  ])
    .slice(0, 4)
    .map((item, index) => ({
      id: `fallback-${index + 1}`,
      title: getSceneTitle(item, index),
      description: item,
    }));
}

function getSceneTitle(detail: string, index: number) {
  const cleaned = detail.replace(/^Scene\s+\d+\s*[-:]\s*/i, '').trim();
  const words = cleaned.split(/\s+/).slice(0, 5).join(' ');
  return `Scene ${index + 1} — ${words}${cleaned.split(/\s+/).length > 5 ? '…' : ''}`;
}

function buildCarryoverNotes(priorSession: Session | null) {
  if (!priorSession) return [];
  return dedupeStrings([
    priorSession.aiSummary?.summary ?? '',
    ...(priorSession.statistics.keyMoments ?? []),
    ...(priorSession.aiSummary?.unresolvedHooks ?? []),
  ]).slice(0, 3);
}

function buildMissingPrepNote(
  session: Pick<Session, 'summary' | 'notes' | 'scheduledDate' | 'status'>,
  links: { npcs: WorldEntity[]; quests: WorldEntity[]; locations: WorldEntity[] },
  sceneCount: number,
) {
  const missing: string[] = [];
  if (!session.scheduledDate) missing.push('a schedule');
  if (!session.summary?.trim()) missing.push('a premise');
  if (!sceneCount) missing.push('scenes');
  if (!session.notes?.trim()) missing.push('prep notes');
  if (!links.npcs.length && !links.locations.length && !links.quests.length) missing.push('linked threads');
  if (!missing.length) return null;
  return `Still missing ${formatList(missing)}.`;
}

function pickLinkedFields(editor: SessionEditorState) {
  return {
    npcIds: editor.npcIds,
    locationIds: editor.locationIds,
    questIds: editor.questIds,
    scenes: editor.scenes,
  };
}

function findPriorSession(session: Session, sessions: Session[]) {
  const ordered = [...sessions].sort((a, b) => getSessionSortTime(b) - getSessionSortTime(a) || b.sessionNumber - a.sessionNumber);
  const currentIndex = ordered.findIndex((candidate) => candidate._id === session._id);
  if (currentIndex === -1) return null;
  return ordered.slice(currentIndex + 1).find((candidate) => candidate.sessionNumber < session.sessionNumber) ?? null;
}

function dedupeEntities(entities: WorldEntity[]) {
  const seen = new Set<string>();
  return entities.filter((entity) => {
    if (seen.has(entity._id)) return false;
    seen.add(entity._id);
    return true;
  });
}

function resolveEntitiesByIds(ids: string[] | undefined, worldEntities: WorldEntity[]) {
  if (!ids?.length) return [];
  return ids
    .map((id) => worldEntities.find((entity) => entity._id === id))
    .filter((entity): entity is WorldEntity => Boolean(entity));
}

function createSceneDraft(sceneNumber: number): SessionScene {
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `scene-${Date.now()}-${sceneNumber}`,
    title: `Scene ${sceneNumber}`,
    description: '',
    npcIds: [],
  };
}

function updateScene(scenes: SessionScene[], sceneId: string, patch: Partial<SessionScene>) {
  return scenes.map((scene) => (scene.id === sceneId ? { ...scene, ...patch } : scene));
}

function formatList(items: string[]) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function splitScheduledDate(value?: string) {
  if (!value) return { date: '', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

function combineDateAndTime(date: string, time: string) {
  if (!date) return undefined;
  return new Date(`${date}T${time || '19:00'}`).toISOString();
}

function formatDuration(minutes: number) {
  if (!minutes) return 'Duration not set';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

const inputClass =
  'w-full rounded-lg border border-[hsla(32,26%,26%,0.48)] bg-[hsl(24,16%,10%)] px-3 py-2 text-[12px] text-[hsl(35,24%,92%)] outline-none transition-colors placeholder:text-[hsl(30,10%,42%)] focus:border-[hsla(38,60%,52%,0.45)]';

const textAreaClass =
  'w-full rounded-lg border border-[hsla(32,26%,26%,0.48)] bg-[hsl(24,16%,10%)] px-3 py-2 text-[12px] text-[hsl(35,24%,92%)] outline-none transition-colors placeholder:text-[hsl(30,10%,42%)] focus:border-[hsla(38,60%,52%,0.45)]';
