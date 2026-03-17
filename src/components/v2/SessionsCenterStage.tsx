import { useMemo, useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Link2Off,
  Loader2,
  NotebookPen,
  Plus,
  ScrollText,
  Sparkles,
  Swords,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useDeleteSession } from '@/hooks/useSessions';
import { useEncounters, useUpdateEncounter } from '@/hooks/useEncounters';
import { useSessionBriefing } from '@/hooks/useSessionBriefing';
import { SessionBriefingPanel } from './sessions/SessionBriefingPanel';
import { useNavigationBus } from './NavigationBusContext';
import { SessionRecapFlow } from './sessions/SessionRecapFlow';
import type { Session, SessionScene, UpdateSessionRequest, WorldEntity } from '@/types/campaign';
import type { Encounter } from '@/types/encounter';
import { shellPanelClass, innerPanelClass } from '@/lib/panel-styles';
import { useWorldExplorerContext } from './world/useWorldExplorerContext';
import { ENTITY_TYPE_CONFIG } from './world/world-config';
import { formatWorldEntityContext } from './world/world-ui';
import {
  useSessionsContext,
  SessionsProvider,
  getStatusLabel,
  normalizePlanStatus,
  STATUS_OPTIONS,
  STATUS_STYLES,
  getEmptyCreateDraft,
  getEditorStateFromSession,
  buildUpdatePayload,
  buildSessionWorldLinks,
  buildSessionSceneOutline,
  buildCarryoverNotes,
  buildMissingPrepNote,
  pickLinkedFields,
  formatSessionIdentity,
  formatScheduleLine,
  formatDuration,
  combineDateAndTime,
  createSceneDraft,
  updateScene,
  type SessionEditorState,
  type SessionPlanStatus,
} from './sessions/SessionsContext';

// ── Style constants ────────────────────────────────────────────────────────────

const panelClass = innerPanelClass;

const inputClass =
  'w-full rounded-lg border border-[hsla(32,26%,26%,0.48)] bg-[hsl(24,16%,10%)] px-3 py-2 text-[12px] text-[hsl(35,24%,92%)] outline-none transition-colors placeholder:text-[hsl(30,10%,42%)] focus:border-[hsla(38,60%,52%,0.45)]';

const textAreaClass =
  'w-full rounded-lg border border-[hsla(32,26%,26%,0.48)] bg-[hsl(24,16%,10%)] px-3 py-2 text-[12px] text-[hsl(35,24%,92%)] outline-none transition-colors placeholder:text-[hsl(30,10%,42%)] focus:border-[hsla(38,60%,52%,0.45)]';

// ── Main component ─────────────────────────────────────────────────────────────

interface SessionsCenterStageProps {
  campaignId: string;
  onOpenWorldEntity: (entityId: string) => void;
  onTabChange?: (tab: string) => void;
}

export function SessionsCenterStage({ campaignId, onOpenWorldEntity, onTabChange }: SessionsCenterStageProps) {
  return (
    <SessionsProvider campaignId={campaignId} onOpenWorldEntity={onOpenWorldEntity}>
      <SessionsCenterStageInner onTabChange={onTabChange} />
    </SessionsProvider>
  );
}

function SessionsCenterStageInner({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const {
    campaignId,
    isLoading,
    isCreating,
    setIsCreating,
    createDraft,
    setCreateDraft,
    nextSessionNumber,
    nextSession,
    selectedSession,
    priorSession,
    worldEntities,
    createSession,
    updateSession,
    setSelectedSessionId,
    handleCreateSession,
    handleUpdateSession,
    openWorldEntity,
  } = useSessionsContext();

  const deleteSession = useDeleteSession();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDeleteSession = useCallback(async () => {
    if (!selectedSession) return;
    try {
      await deleteSession.mutateAsync({ campaignId, sessionId: selectedSession._id });
      setSelectedSessionId(null);
      setConfirmingDelete(false);
      toast.success(`Session "${formatSessionIdentity(selectedSession)}" deleted`);
    } catch {
      toast.error('Failed to delete session');
    }
  }, [campaignId, deleteSession, selectedSession, setSelectedSessionId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-[hsl(30,14%,62%)]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] p-4 text-[hsl(38,24%,88%)]">
      <section className={`${shellPanelClass} min-h-0 flex-1 flex flex-col overflow-hidden`}>
        {renderShellHeader()}
        {renderShellBody()}
      </section>
    </div>
  );

  function renderShellHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {renderShellHeaderLeft()}
          {renderShellHeaderActions()}
        </div>
        {renderShellHeaderBadge()}
      </div>
    );
  }

  function renderShellHeaderLeft() {
    const title = isCreating
      ? `Plan Session ${nextSessionNumber}`
      : selectedSession
      ? formatSessionIdentity(selectedSession)
      : 'Session Plans';
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(30,14%,54%)]">
          Session Plans
        </p>
        <h2 className="mt-0.5 font-['IM_Fell_English'] text-[26px] leading-none text-[hsl(38,42%,90%)]">
          {title}
        </h2>
      </div>
    );
  }

  function renderShellHeaderActions() {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setIsCreating(true);
            setCreateDraft(getEmptyCreateDraft(nextSessionNumber));
          }}
          className="inline-flex items-center gap-2 rounded-full border border-[hsla(42,72%,52%,0.38)] bg-[linear-gradient(180deg,hsla(42,72%,56%,0.18)_0%,hsla(42,72%,38%,0.16)_100%)] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[hsl(42,78%,80%)] transition hover:border-[hsla(42,72%,60%,0.46)]"
        >
          <Plus className="h-4 w-4" />
          Plan Session {nextSessionNumber}
        </button>
        {selectedSession && !isCreating && (
          <button
            type="button"
            disabled={deleteSession.isPending}
            onClick={() => {
              if (confirmingDelete) {
                handleDeleteSession();
              } else {
                setConfirmingDelete(true);
              }
            }}
            onBlur={() => setConfirmingDelete(false)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
              confirmingDelete
                ? 'border-[hsla(0,60%,50%,0.46)] bg-[hsla(0,60%,40%,0.18)] text-[hsl(0,72%,72%)]'
                : 'border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] text-[hsl(30,12%,62%)] hover:text-red-400'
            }`}
          >
            {deleteSession.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {confirmingDelete ? 'Confirm Delete?' : 'Delete'}
          </button>
        )}
      </div>
    );
  }

  function renderShellHeaderBadge() {
    if (!selectedSession || isCreating) return null;
    const planStatus = normalizePlanStatus(selectedSession.status);
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${STATUS_STYLES[planStatus]}`}
        >
          {getStatusLabel(planStatus)}
        </span>
        {selectedSession.scheduledDate && (
          <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(30,12%,58%)]">
            {formatScheduleLine(selectedSession)}
          </span>
        )}
        {selectedSession.durationMinutes > 0 && (
          <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(30,12%,58%)]">
            {formatDuration(selectedSession.durationMinutes)}
          </span>
        )}
      </div>
    );
  }

  function renderShellBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {isCreating
          ? renderCreateView()
          : selectedSession
          ? renderDetailView()
          : renderEmptyState()}
      </div>
    );
  }

  function renderCreateView() {
    return (
      <SessionPlanCreateForm
        draft={createDraft}
        sessionNumber={nextSessionNumber}
        isPending={createSession.isPending}
        onChange={setCreateDraft}
        onCancel={() => setIsCreating(false)}
        onSubmit={handleCreateSession}
      />
    );
  }

  function renderDetailView() {
    if (!selectedSession) return null;
    return (
      <SessionPlanDetail
        key={selectedSession._id}
        session={selectedSession}
        priorSession={priorSession}
        worldEntities={worldEntities}
        isPending={updateSession.isPending}
        onSave={(data) => handleUpdateSession(selectedSession._id, data)}
        onOpenWorldEntity={openWorldEntity}
        onTabChange={onTabChange}
        onBack={
          nextSession && selectedSession._id !== nextSession._id
            ? () => {
                const { setSelectedSessionId } = useSessionsContextRef;
                setSelectedSessionId(nextSession._id);
              }
            : undefined
        }
      />
    );
  }

  function renderEmptyState() {
    return (
      <div
        className={`${panelClass} flex min-h-[360px] items-center justify-center px-6 text-center`}
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            No Session Selected
          </p>
          <h4 className="mt-3 font-['IM_Fell_English'] text-[32px] leading-none text-[hsl(38,42%,90%)]">
            Map the upcoming session
          </h4>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[hsl(30,14%,58%)]">
            Plan the next session here so campaign prep has a concrete destination instead of living
            in scattered notes.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsCreating(true);
              setCreateDraft(getEmptyCreateDraft(nextSessionNumber));
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[hsla(42,72%,52%,0.38)] bg-[linear-gradient(180deg,hsla(42,72%,56%,0.18)_0%,hsla(42,72%,38%,0.16)_100%)] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[hsl(42,78%,80%)] transition hover:border-[hsla(42,72%,60%,0.46)]"
          >
            <Plus className="h-4 w-4" />
            Plan Session {nextSessionNumber}
          </button>
        </div>
      </div>
    );
  }
}

// Workaround: capture context ref for the onBack closure inside renderDetailView
// We expose setSelectedSessionId via a module-level ref updated on each render
const useSessionsContextRef = {
  setSelectedSessionId: (_id: string | null) => {},
};

// ── SessionPlanCreateForm ──────────────────────────────────────────────────────

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
  onChange: (value: SessionEditorState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.74)] p-4"
    >
      {renderFormHeader()}
      <SessionScheduleFields state={draft} onChange={onChange} includePremise />
      {renderFormFooter()}
    </form>
  );

  function renderFormHeader() {
    return (
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-[hsl(30,12%,58%)]">
            New Session Plan
          </p>
          <p className="mt-1 text-[13px] text-[hsl(35,24%,92%)]">Session {sessionNumber}</p>
        </div>
      </div>
    );
  }

  function renderFormFooter() {
    return (
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1.5 h-4 w-4" />
          )}
          Create Session Plan
        </Button>
      </div>
    );
  }

  function SessionScheduleFields({
    state,
    onChange: onFieldChange,
    includePremise,
  }: {
    state: SessionEditorState;
    onChange: (value: SessionEditorState) => void;
    includePremise: boolean;
  }) {
    const update = (patch: Partial<SessionEditorState>) =>
      onFieldChange({ ...state, ...patch });

    return (
      <div className="space-y-3">
        {renderTitleStatusRow()}
        {renderDateTimeRow()}
        {includePremise && renderPremiseField()}
      </div>
    );

    function renderTitleStatusRow() {
      return (
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
      );
    }

    function renderDateTimeRow() {
      return (
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
      );
    }

    function renderPremiseField() {
      return (
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
      );
    }
  }
}

// ── SessionPlanDetail ──────────────────────────────────────────────────────────

function SessionPlanDetail({
  session,
  priorSession,
  worldEntities,
  isPending,
  onSave,
  onOpenWorldEntity,
  onTabChange,
  onBack,
}: {
  session: Session;
  priorSession: Session | null;
  worldEntities: WorldEntity[];
  isPending: boolean;
  onSave: (data: UpdateSessionRequest) => void;
  onOpenWorldEntity: (entityId: string) => void;
  onTabChange?: (tab: string) => void;
  onBack?: () => void;
}) {
  const { campaignId, setSelectedSessionId } = useSessionsContext();
  const { requestNavigation } = useNavigationBus();
  // Keep ref updated so closures in parent can call it
  useSessionsContextRef.setSelectedSessionId = setSelectedSessionId;

  const [editor, setEditor] = useState(() => getEditorStateFromSession(session));
  const links = useMemo(
    () => buildSessionWorldLinks({ ...session, ...pickLinkedFields(editor) }, worldEntities),
    [editor, session, worldEntities],
  );
  const scenes = useMemo(
    () =>
      buildSessionSceneOutline(
        { ...session, ...pickLinkedFields(editor), summary: editor.summary, notes: editor.notes },
        worldEntities,
      ),
    [editor, session, worldEntities],
  );
  const carryover = useMemo(() => buildCarryoverNotes(priorSession), [priorSession]);
  const briefing = useSessionBriefing(campaignId, session, priorSession);
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
      {renderTopGroup()}
      {renderBottomGroup()}
    </section>
  );

  function renderTopGroup() {
    return (
      <>
        {renderDetailHeader()}
        {renderBriefingSection()}
        {(session.status === 'in_progress' || session.status === 'completed') && (
          <SessionRecapFlow campaignId={campaignId} session={session} onComplete={() => {}} />
        )}
        {session.status === 'completed' && renderNextSessionCTA()}
        {renderIdentitySection()}
      </>
    );
  }

  function renderNextSessionCTA() {
    return <NextSessionCTA />;
  }

  function renderBottomGroup() {
    return (
      <>
        {renderPremiseSection()}
        {renderScenesSection()}
        {renderNotesSection()}
        {renderInPlaySection()}
        <LinkedEncountersSection
          campaignId={campaignId}
          sessionId={session._id}
          onTabChange={onTabChange}
        />
      </>
    );
  }

  function renderDetailHeader() {
    return (
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
          {missingPrep && (
            <p className="mt-2 text-[11px] text-[hsl(30,12%,58%)]">{missingPrep}</p>
          )}
        </div>
        <StatusPill status={editor.status} />
      </div>
    );
  }

  function renderBriefingSection() {
    if (briefing.isEmpty) return null;
    return (
      <SessionBriefingPanel
        briefing={briefing}
        onOpenArc={onTabChange ? (arcId) => { requestNavigation('arcs', arcId); onTabChange('arcs'); } : undefined}
        onOpenEncounter={onTabChange ? (encId) => { requestNavigation('encounters', encId); onTabChange('encounters'); } : undefined}
        onOpenTrackers={onTabChange ? () => { onTabChange('trackers'); } : undefined}
        onOpenCalendar={onTabChange ? () => { onTabChange('calendar'); } : undefined}
        onOpenDowntime={onTabChange ? () => { onTabChange('downtime'); } : undefined}
        onOpenHandouts={onTabChange ? () => { onTabChange('handouts'); } : undefined}
      />
    );
  }

  function renderIdentitySection() {
    return (
      <DetailSection icon={CalendarDays} title="Identity / Schedule" subtitle="Keep the next session concrete.">
        <SessionScheduleFields state={editor} onChange={setEditor} includePremise={false} />
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            onClick={() => onSave(buildUpdatePayload(editor))}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Save details
          </Button>
        </div>
      </DetailSection>
    );
  }

  function renderPremiseSection() {
    return (
      <DetailSection icon={ScrollText} title="Premise" subtitle="What is this session about?">
        <textarea
          value={editor.summary}
          onChange={(event) =>
            setEditor((current) => ({ ...current, summary: event.target.value }))
          }
          rows={4}
          className={textAreaClass}
          placeholder="What is this session about?"
        />
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            onClick={() => onSave({ summary: editor.summary })}
            disabled={isPending}
          >
            Save premise
          </Button>
        </div>
      </DetailSection>
    );
  }

  function renderScenesSection() {
    return (
      <DetailSection icon={Sparkles} title="Scenes" subtitle="Likely beats of play.">
        <SceneOutlineEditor
          scenes={editor.scenes}
          locationOptions={worldEntities.filter(
            (entity) => entity.type === 'location' || entity.type === 'location_detail',
          )}
          onChange={(scenesValue) => setEditor((current) => ({ ...current, scenes: scenesValue }))}
        />
        {editor.scenes.length === 0 && scenes.length > 0 && (
          <div className="mt-3">
            <ExpectedScenesBlock scenes={scenes} />
          </div>
        )}
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            onClick={() => onSave({ scenes: editor.scenes })}
            disabled={isPending}
          >
            Save scenes
          </Button>
        </div>
      </DetailSection>
    );
  }

  function renderNotesSection() {
    return (
      <DetailSection
        icon={NotebookPen}
        title="Prep Notes"
        subtitle="Loose reminders, beats, and table notes."
      >
        {carryover.length > 0 && renderCarryover()}
        <textarea
          value={editor.notes}
          onChange={(event) =>
            setEditor((current) => ({ ...current, notes: event.target.value }))
          }
          rows={7}
          className={textAreaClass}
          placeholder="Prep notes, reminders, encounter thoughts, callbacks."
        />
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            onClick={() => onSave({ notes: editor.notes })}
            disabled={isPending}
          >
            Save notes
          </Button>
        </div>
      </DetailSection>
    );
  }

  function renderCarryover() {
    return (
      <div className="mb-3 rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3.5 py-3">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
          Carryover from {formatSessionIdentity(priorSession!)}
        </p>
        <ul className="mt-2 space-y-1.5">
          {carryover.map((item) => (
            <li
              key={item}
              className="flex gap-2 text-[12px] leading-relaxed text-[hsl(30,16%,72%)]"
            >
              <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(38,82%,63%)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function renderInPlaySection() {
    return (
      <DetailSection
        icon={Users}
        title="In Play"
        subtitle="Who, where, and which threads matter in this session."
      >
        <div className="space-y-4">
          {renderNpcEditor()}
          {renderLocationEditor()}
          {renderQuestEditor()}
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            onClick={() =>
              onSave({
                npcIds: editor.npcIds,
                locationIds: editor.locationIds,
                questIds: editor.questIds,
              })
            }
            disabled={isPending}
          >
            Save links
          </Button>
        </div>
      </DetailSection>
    );
  }

  function renderNpcEditor() {
    return (
      <LinkedEntityEditor
        title="NPCs in Play"
        items={links.npcs}
        ids={editor.npcIds}
        options={worldEntities.filter(
          (entity) => entity.type === 'npc' || entity.type === 'npc_minor',
        )}
        emptyLabel="No NPCs linked yet."
        onIdsChange={(npcIds) => setEditor((current) => ({ ...current, npcIds }))}
        onOpenWorldEntity={onOpenWorldEntity}
      />
    );
  }

  function renderLocationEditor() {
    return (
      <LinkedEntityEditor
        title="Locations in Play"
        items={links.locations}
        ids={editor.locationIds}
        options={worldEntities.filter(
          (entity) => entity.type === 'location' || entity.type === 'location_detail',
        )}
        emptyLabel="No locations linked yet."
        onIdsChange={(locationIds) => setEditor((current) => ({ ...current, locationIds }))}
        onOpenWorldEntity={onOpenWorldEntity}
      />
    );
  }

  function renderQuestEditor() {
    return (
      <LinkedEntityEditor
        title="Open Threads"
        items={links.quests}
        ids={editor.questIds}
        options={worldEntities.filter((entity) => entity.type === 'quest')}
        emptyLabel="No quest threads linked yet."
        onIdsChange={(questIds) => setEditor((current) => ({ ...current, questIds }))}
        onOpenWorldEntity={onOpenWorldEntity}
      />
    );
  }
}

// ── SessionScheduleFields ──────────────────────────────────────────────────────

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
      {renderTitleStatus()}
      {renderDateTime()}
      {includePremise && renderPremise()}
    </div>
  );

  function renderTitleStatus() {
    return (
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
    );
  }

  function renderDateTime() {
    return (
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
    );
  }

  function renderPremise() {
    return (
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
    );
  }
}

// ── LinkedEntityEditor ────────────────────────────────────────────────────────

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
      {renderEditorHeader()}
      {items.length ? renderItems() : renderEmpty()}
      {renderAddRow()}
    </div>
  );

  function renderEditorHeader() {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]">{title}</p>
        {!ids.length && items.length > 0 && (
          <span className="text-[10px] text-[hsl(30,12%,58%)]">
            Shown from existing session notes
          </span>
        )}
      </div>
    );
  }

  function renderItems() {
    return (
      <div className="mt-2 space-y-1.5">
        {items.map((entity) => renderEntityRow(entity))}
      </div>
    );
  }

  function renderEntityRow(entity: WorldEntity) {
    const Icon = ENTITY_TYPE_CONFIG[entity.type].icon;
    const isExplicit = ids.includes(entity._id);
    return (
      <div
        key={entity._id}
        className="flex items-center gap-2 rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,14%,10%,0.72)] px-3 py-2"
      >
        <button
          type="button"
          onClick={() => onOpenWorldEntity(entity._id)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
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
            <p className="truncate text-[11px] text-[hsl(30,12%,58%)]">
              {formatWorldEntityContext(entity)}
            </p>
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
  }

  function renderEmpty() {
    return <p className="mt-2 text-[12px] text-[hsl(30,12%,58%)]">{emptyLabel}</p>;
  }

  function renderAddRow() {
    return (
      <div className="mt-3 flex gap-2">
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className={inputClass}
        >
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
    );
  }
}

// ── NextSessionCTA ────────────────────────────────────────────────────────────

function NextSessionCTA() {
  const { nextSessionNumber, setIsCreating, setCreateDraft } = useSessionsContext();
  return (
    <div className="flex items-center justify-between rounded-xl border border-[hsla(42,72%,52%,0.22)] bg-[hsla(42,72%,52%,0.06)] px-4 py-3">
      <span className="text-[12px] text-[hsl(30,14%,66%)]">
        Ready to plan the next session?
      </span>
      <button
        type="button"
        onClick={() => {
          setIsCreating(true);
          setCreateDraft(getEmptyCreateDraft(nextSessionNumber));
        }}
        className="inline-flex items-center gap-2 rounded-full border border-[hsla(42,72%,52%,0.38)] bg-[linear-gradient(180deg,hsla(42,72%,56%,0.18)_0%,hsla(42,72%,38%,0.16)_100%)] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[hsl(42,78%,80%)] transition hover:border-[hsla(42,72%,60%,0.46)]"
      >
        <Plus className="h-3.5 w-3.5" />
        Plan Session {nextSessionNumber}
      </button>
    </div>
  );
}

// ── LinkedEncountersSection ────────────────────────────────────────────────────

function LinkedEncountersSection({
  campaignId,
  sessionId,
  onTabChange,
}: {
  campaignId: string;
  sessionId: string;
  onTabChange?: (tab: string) => void;
}) {
  const { data: allEncounters } = useEncounters(campaignId);
  const { requestEncounterNavigation } = useWorldExplorerContext();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedEncounterId, setSelectedEncounterId] = useState('');

  const linkedEncounters = useMemo(
    () => (allEncounters ?? []).filter((enc) => enc.sessionId === sessionId),
    [allEncounters, sessionId],
  );

  const unlinkedEncounters = useMemo(
    () => (allEncounters ?? []).filter((enc) => !enc.sessionId),
    [allEncounters],
  );

  function handleNavigateToEncounter(encounterId: string) {
    requestEncounterNavigation(encounterId);
    onTabChange?.('encounters');
  }

  return (
    <DetailSection
      icon={Swords}
      title="Linked Encounters"
      subtitle="Encounters prepared for this session."
    >
      {linkedEncounters.length > 0 ? renderLinkedList() : renderEmpty()}
      {renderLinkActions()}
    </DetailSection>
  );

  function renderLinkedList() {
    return (
      <div className="space-y-1.5">
        {linkedEncounters.map((enc) => (
          <LinkedEncounterCard
            key={enc._id}
            encounter={enc}
            campaignId={campaignId}
            onNavigate={() => handleNavigateToEncounter(enc._id)}
          />
        ))}
      </div>
    );
  }

  function renderEmpty() {
    return (
      <p className="text-[12px] text-[hsl(30,12%,58%)]">
        No encounters linked to this session.
      </p>
    );
  }

  function renderLinkActions() {
    if (!showPicker) {
      return (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            disabled={unlinkedEncounters.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsla(32,26%,26%,0.45)] bg-[hsla(24,14%,12%,0.74)] px-3 py-1.5 text-[11px] text-[hsl(30,12%,64%)] transition hover:border-[hsla(38,50%,58%,0.4)] hover:text-[hsl(35,24%,92%)] disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Link Encounter
          </button>
        </div>
      );
    }

    return (
      <div className="mt-3 flex gap-2">
        <select
          value={selectedEncounterId}
          onChange={(event) => setSelectedEncounterId(event.target.value)}
          className={inputClass}
        >
          <option value="">Select encounter...</option>
          {unlinkedEncounters.map((enc) => (
            <option key={enc._id} value={enc._id}>
              {enc.name}
            </option>
          ))}
        </select>
        <LinkEncounterButton
          campaignId={campaignId}
          encounterId={selectedEncounterId}
          sessionId={sessionId}
          onDone={() => {
            setSelectedEncounterId('');
            setShowPicker(false);
          }}
        />
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setShowPicker(false);
            setSelectedEncounterId('');
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }
}

function LinkedEncounterCard({
  encounter,
  campaignId,
  onNavigate,
}: {
  encounter: Encounter;
  campaignId: string;
  onNavigate: () => void;
}) {
  const updateEncounter = useUpdateEncounter(campaignId, encounter._id);
  const participantCount = encounter.participants?.length ?? 0;

  const statusColors: Record<string, string> = {
    ready: 'border-[hsla(145,52%,42%,0.4)] bg-[hsla(145,52%,28%,0.16)] text-[hsl(145,62%,62%)]',
    used: 'border-[hsla(32,26%,26%,0.45)] bg-[hsla(24,14%,11%,0.98)] text-[hsl(30,12%,52%)]',
    draft: 'border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] text-[hsl(212,34%,74%)]',
  };
  const statusColor = statusColors[encounter.status] ?? statusColors.draft;

  function handleUnlink() {
    updateEncounter.mutate({ sessionId: null } as never, {
      onSuccess: () => toast.success(`Unlinked "${encounter.name}"`),
      onError: () => toast.error('Failed to unlink encounter'),
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,14%,10%,0.72)] px-3 py-2">
      <button
        type="button"
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        {renderEncounterIcon()}
        {renderEncounterInfo()}
      </button>
      {renderUnlinkButton()}
    </div>
  );

  function renderEncounterIcon() {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[hsla(2,42%,48%,0.15)] text-[hsl(2,52%,62%)]">
        <Swords className="h-3.5 w-3.5" />
      </div>
    );
  }

  function renderEncounterInfo() {
    return (
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[12px] text-[hsl(35,24%,92%)]">{encounter.name}</p>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${statusColor}`}>
            {encounter.status}
          </span>
        </div>
        <p className="text-[11px] text-[hsl(30,12%,58%)]">
          {capitalize(encounter.difficulty)}
          {participantCount > 0 && ` · ${participantCount} participant${participantCount === 1 ? '' : 's'}`}
        </p>
      </div>
    );
  }

  function renderUnlinkButton() {
    return (
      <button
        type="button"
        onClick={handleUnlink}
        disabled={updateEncounter.isPending}
        className="rounded p-1 text-[hsl(30,12%,58%)] transition hover:text-[hsl(2,52%,62%)] disabled:opacity-50"
        title="Unlink encounter from session"
      >
        <Link2Off className="h-3.5 w-3.5" />
      </button>
    );
  }
}

function LinkEncounterButton({
  campaignId,
  encounterId,
  sessionId,
  onDone,
}: {
  campaignId: string;
  encounterId: string;
  sessionId: string;
  onDone: () => void;
}) {
  const updateEncounter = useUpdateEncounter(campaignId, encounterId);

  return (
    <Button
      type="button"
      variant="outline"
      disabled={!encounterId || updateEncounter.isPending}
      onClick={() => {
        if (!encounterId) return;
        updateEncounter.mutate({ sessionId } as never, {
          onSuccess: () => {
            toast.success('Encounter linked to session');
            onDone();
          },
          onError: () => toast.error('Failed to link encounter'),
        });
      }}
    >
      Link
    </Button>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── DetailSection ─────────────────────────────────────────────────────────────

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

// ── StatusPill ────────────────────────────────────────────────────────────────

function StatusPill({ status, compact = false }: { status: SessionPlanStatus; compact?: boolean }) {
  return (
    <span
      className={`rounded-full border py-0.5 text-[10px] uppercase tracking-[0.08em] ${compact ? 'px-2' : 'px-2.5'} ${STATUS_STYLES[status]}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

// ── ExpectedScenesBlock ───────────────────────────────────────────────────────

function ExpectedScenesBlock({ scenes }: { scenes: SessionScene[] }) {
  if (!scenes.length) {
    return <p className="text-[12px] text-[hsl(30,12%,58%)]">No scenes outlined yet.</p>;
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
            <p className="mt-1.5 text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">
              {scene.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── SceneOutlineEditor ────────────────────────────────────────────────────────

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
      {scenes.map((scene, index) => renderSceneRow(scene, index))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...scenes, createSceneDraft(scenes.length + 1)])}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add scene
      </Button>
    </div>
  );

  function renderSceneRow(scene: SessionScene, index: number) {
    return (
      <div
        key={scene.id}
        className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] p-3"
      >
        {renderSceneTopRow(scene, index)}
        {renderSceneNote(scene)}
      </div>
    );
  }

  function renderSceneTopRow(scene: SessionScene, index: number) {
    return (
      <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr_auto]">
        <Field>
          <FieldLabel htmlFor={`scene-title-${scene.id}`}>{`Scene ${index + 1}`}</FieldLabel>
          <input
            id={`scene-title-${scene.id}`}
            type="text"
            value={scene.title}
            onChange={(event) =>
              onChange(updateScene(scenes, scene.id, { title: event.target.value }))
            }
            className={inputClass}
            placeholder="Arrival at Stormhold"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`scene-location-${scene.id}`}>Location</FieldLabel>
          <select
            id={`scene-location-${scene.id}`}
            value={scene.locationId ?? ''}
            onChange={(event) =>
              onChange(
                updateScene(scenes, scene.id, { locationId: event.target.value || undefined }),
              )
            }
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
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange(scenes.filter((item) => item.id !== scene.id))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  function renderSceneNote(scene: SessionScene) {
    return (
      <div className="mt-3">
        <FieldLabel htmlFor={`scene-description-${scene.id}`}>Note</FieldLabel>
        <textarea
          id={`scene-description-${scene.id}`}
          rows={3}
          value={scene.description ?? ''}
          onChange={(event) =>
            onChange(updateScene(scenes, scene.id, { description: event.target.value }))
          }
          className={textAreaClass}
          placeholder="What should happen in this beat?"
        />
      </div>
    );
  }
}

// ── Field / FieldLabel ────────────────────────────────────────────────────────

function Field({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]"
    >
      {children}
    </label>
  );
}

