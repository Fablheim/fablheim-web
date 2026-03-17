import { useState } from 'react';
import {
  BookMarked,
  ChevronRight,
  Loader2,
  Plus,
  ScrollText,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CampaignArc, ArcStatus, Handout, Session, WorldEntity } from '@/types/campaign';
import type { Encounter } from '@/types/encounter';
import type { DowntimeActivity } from '@/types/downtime';
import { shellPanelClass, innerPanelClass } from '@/lib/panel-styles';
import {
  useStoryArcsContext,
  ARC_STATUS_LABELS,
  ARC_TYPE_LABELS,
  ARC_PRESSURE_LABELS,
  editorToPayload,
  findSessionLabel,
  hasUnsavedChanges,
  type ArcEditorState,
} from './StoryArcsContext';

// ── Style helpers ─────────────────────────────────────────────────────────────

const panelClass = innerPanelClass;

const fieldClass =
  'w-full rounded-[16px] border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(42,72%,52%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)]';

function actionButtonClass(emphasis = false) {
  return `inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
    emphasis
      ? 'border-[hsla(42,72%,52%,0.38)] bg-[linear-gradient(180deg,hsla(42,72%,56%,0.18)_0%,hsla(42,72%,38%,0.16)_100%)] text-[hsl(42,78%,80%)] hover:border-[hsla(42,72%,60%,0.46)]'
      : 'border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] text-[hsl(30,12%,62%)] hover:text-[hsl(38,24%,88%)]'
  }`;
}

// ── Main component ────────────────────────────────────────────────────────────

export function StoryArcsDeskV2() {
  const {
    campaignId,
    isLoading,
    isCreating,
    setIsCreating,
    selectedArc,
    editor,
    setEditor,
    sessions,
    entities,
    encounters,
    handouts,
    downtime,
    developmentTitle,
    setDevelopmentTitle,
    developmentDescription,
    setDevelopmentDescription,
    developmentSessionId,
    setDevelopmentSessionId,
    developmentEntityIds,
    setDevelopmentEntityIds,
    addArc,
    updateArc,
    addArcDevelopment,
    removeArc,
    startCreate,
    setSelectedArcId,
  } = useStoryArcsContext();

  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
        {renderShellHeaderBadges()}
      </div>
    );
  }

  function renderShellHeaderLeft() {
    const title = isCreating
      ? 'New Arc'
      : selectedArc?.name ?? 'Choose a Thread';
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(30,14%,54%)]">
          Story Arcs
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
        <button type="button" onClick={startCreate} className={actionButtonClass(true)}>
          <Plus className="h-4 w-4" />
          Create Arc
        </button>
        {selectedArc && !isCreating && renderArcQuickActions()}
      </div>
    );
  }

  function renderArcQuickActions() {
    return (
      <>
        <button
          type="button"
          onClick={() => quickStatus('advancing')}
          className={actionButtonClass()}
        >
          <Sparkles className="h-4 w-4" />
          Advance Arc
        </button>
        <button
          type="button"
          onClick={() => quickStatus('resolved')}
          className={actionButtonClass()}
        >
          <BookMarked className="h-4 w-4" />
          Resolve Arc
        </button>
        <button
          type="button"
          disabled={removeArc.isPending}
          onClick={() => {
            if (confirmingDelete) {
              handleDeleteArc();
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
          {removeArc.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {confirmingDelete ? 'Confirm Delete?' : 'Delete'}
        </button>
      </>
    );
  }

  function renderShellHeaderBadges() {
    if (!selectedArc || isCreating) return null;
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(42,78%,78%)]">
          {ARC_TYPE_LABELS[selectedArc.type ?? 'custom']}
        </span>
        <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(212,24%,66%)]">
          {ARC_STATUS_LABELS[selectedArc.status]}
        </span>
        <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(30,12%,58%)]">
          Pressure: {ARC_PRESSURE_LABELS[selectedArc.pressure ?? 'quiet']}
        </span>
      </div>
    );
  }

  function renderShellBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {isCreating
          ? renderCreateView()
          : selectedArc
          ? renderWorkspaceView()
          : renderEmptyState()}
      </div>
    );
  }

  function renderCreateView() {
    return (
      <ArcEditor
        editor={editor}
        sessions={sessions}
        entities={entities}
        encounters={encounters}
        handouts={handouts}
        downtime={downtime}
        pending={addArc.isPending}
        onChange={setEditor}
        onCancel={() => setIsCreating(false)}
        onSave={handleCreate}
      />
    );
  }

  function renderWorkspaceView() {
    if (!selectedArc) return null;
    return (
      <ArcWorkspace
        arc={selectedArc}
        editor={editor}
        sessions={sessions}
        entities={entities}
        encounters={encounters}
        handouts={handouts}
        downtime={downtime}
        pending={updateArc.isPending || addArcDevelopment.isPending}
        developmentTitle={developmentTitle}
        developmentDescription={developmentDescription}
        developmentSessionId={developmentSessionId}
        developmentEntityIds={developmentEntityIds}
        onEditorChange={setEditor}
        onSave={handleSave}
        onDevelopmentTitleChange={setDevelopmentTitle}
        onDevelopmentDescriptionChange={setDevelopmentDescription}
        onDevelopmentSessionChange={setDevelopmentSessionId}
        onDevelopmentEntityIdsChange={setDevelopmentEntityIds}
        onAddDevelopment={handleAddDevelopment}
      />
    );
  }

  function renderEmptyState() {
    return (
      <div className={`${panelClass} flex min-h-[360px] items-center justify-center px-6 text-center`}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            No Arc Selected
          </p>
          <h4 className="mt-3 font-['IM_Fell_English'] text-[32px] leading-none text-[hsl(38,42%,90%)]">
            Map the bigger story
          </h4>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[hsl(30,14%,58%)]">
            Keep faction schemes, prophecies, mysteries, and personal debts visible so the
            campaign's long-form motion never disappears between sessions.
          </p>
          <button
            type="button"
            onClick={startCreate}
            className={`${actionButtonClass(true)} mt-6`}
          >
            <Plus className="h-4 w-4" />
            Create Arc
          </button>
        </div>
      </div>
    );
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleCreate() {
    try {
      const arc = await addArc.mutateAsync({
        campaignId,
        data: editorToPayload(editor),
      });
      const createdArc = (arc.arcs ?? []).slice().sort((a, b) => b.sortOrder - a.sortOrder)[0];
      setIsCreating(false);
      setSelectedArcId(createdArc?._id ?? null);
      toast.success('Story arc created');
    } catch {
      toast.error('Failed to create story arc');
    }
  }

  async function handleSave() {
    if (!selectedArc) return;
    try {
      await updateArc.mutateAsync({
        campaignId,
        arcId: selectedArc._id,
        data: editorToPayload(editor),
      });
      toast.success('Story arc updated');
    } catch {
      toast.error('Failed to update story arc');
    }
  }

  async function handleAddDevelopment() {
    if (!selectedArc || !developmentTitle.trim()) return;
    try {
      await addArcDevelopment.mutateAsync({
        campaignId,
        arcId: selectedArc._id,
        data: {
          title: developmentTitle.trim(),
          description: developmentDescription.trim() || undefined,
          sessionId: developmentSessionId || undefined,
          linkedEntityIds: developmentEntityIds,
        },
      });
      setDevelopmentTitle('');
      setDevelopmentDescription('');
      setDevelopmentSessionId('');
      setDevelopmentEntityIds([]);
      toast.success('Arc development recorded');
    } catch {
      toast.error('Failed to add arc development');
    }
  }

  async function handleDeleteArc() {
    if (!selectedArc) return;
    try {
      await removeArc.mutateAsync({ campaignId, arcId: selectedArc._id });
      setSelectedArcId(null);
      setConfirmingDelete(false);
      toast.success(`Arc "${selectedArc.name}" deleted`);
    } catch {
      toast.error('Failed to delete story arc');
    }
  }

  async function quickStatus(status: ArcStatus) {
    if (!selectedArc) return;
    if (hasUnsavedChanges(editor, selectedArc)) {
      const confirmed = window.confirm(
        `You have unsaved changes to "${selectedArc.name}". Changing the arc status will discard them. Continue?`,
      );
      if (!confirmed) return;
    }
    try {
      await updateArc.mutateAsync({
        campaignId,
        arcId: selectedArc._id,
        data: { status },
      });
      toast.success(`Arc marked ${ARC_STATUS_LABELS[status].toLowerCase()}`);
    } catch {
      toast.error('Failed to update arc status');
    }
  }
}

// ── ArcEditor ─────────────────────────────────────────────────────────────────

function ArcEditor({
  editor,
  sessions,
  entities,
  encounters,
  handouts,
  downtime,
  pending,
  onChange,
  onCancel,
  onSave,
}: {
  editor: ArcEditorState;
  sessions: Session[];
  entities: WorldEntity[];
  encounters: Encounter[];
  handouts: Handout[];
  downtime: DowntimeActivity[];
  pending: boolean;
  onChange: (value: ArcEditorState) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const locations = entities.filter(
    (entity) => entity.type === 'location' || entity.type === 'location_detail',
  );
  const npcs = entities.filter(
    (entity) => entity.type === 'npc' || entity.type === 'npc_minor',
  );
  const factions = entities.filter((entity) => entity.type === 'faction');
  const quests = entities.filter((entity) => entity.type === 'quest');

  return (
    <div className="space-y-4">
      {renderEditorFields()}
      <ArcLinksEditor
        editor={editor}
        sessions={sessions}
        npcs={npcs}
        factions={factions}
        locations={locations}
        quests={quests}
        encounters={encounters}
        handouts={handouts}
        downtime={downtime}
        onChange={onChange}
      />
      {renderEditorFooter()}
    </div>
  );

  function renderEditorFields() {
    return (
      <div className={`${panelClass} p-5`}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {renderEditorLeft()}
          {renderEditorRight()}
        </div>
      </div>
    );
  }

  function renderEditorLeft() {
    return (
      <div className="space-y-4">
        <Field label="Arc Title">
          <input
            value={editor.name}
            onChange={(event) => onChange({ ...editor, name: event.target.value })}
            className={fieldClass}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Status">
            <select
              value={editor.status}
              onChange={(event) =>
                onChange({ ...editor, status: event.target.value as ArcStatus })
              }
              className={fieldClass}
            >
              {Object.entries(ARC_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select
              value={editor.type}
              onChange={(event) =>
                onChange({ ...editor, type: event.target.value as ArcEditorState['type'] })
              }
              className={fieldClass}
            >
              {Object.entries(ARC_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Pressure">
            <select
              value={editor.pressure}
              onChange={(event) =>
                onChange({ ...editor, pressure: event.target.value as ArcEditorState['pressure'] })
              }
              className={fieldClass}
            >
              {Object.entries(ARC_PRESSURE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Premise">
          <textarea
            value={editor.description}
            onChange={(event) => onChange({ ...editor, description: event.target.value })}
            className={`${fieldClass} min-h-[120px] resize-y`}
          />
        </Field>
        <Field label="Stakes">
          <textarea
            value={editor.stakes}
            onChange={(event) => onChange({ ...editor, stakes: event.target.value })}
            className={`${fieldClass} min-h-[100px] resize-y`}
          />
        </Field>
      </div>
    );
  }

  function renderEditorRight() {
    return (
      <div className="space-y-4">
        <Field label="Current State">
          <textarea
            value={editor.currentState}
            onChange={(event) => onChange({ ...editor, currentState: event.target.value })}
            className={`${fieldClass} min-h-[100px] resize-y`}
          />
        </Field>
        <Field label="Recent Change">
          <textarea
            value={editor.recentChange}
            onChange={(event) => onChange({ ...editor, recentChange: event.target.value })}
            className={`${fieldClass} min-h-[100px] resize-y`}
          />
        </Field>
        <Field label="Next Likely Development">
          <textarea
            value={editor.nextDevelopment}
            onChange={(event) => onChange({ ...editor, nextDevelopment: event.target.value })}
            className={`${fieldClass} min-h-[100px] resize-y`}
          />
        </Field>
      </div>
    );
  }

  function renderEditorFooter() {
    return (
      <div className={`${panelClass} p-5`}>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} className={actionButtonClass()}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className={actionButtonClass(true)}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save Arc
          </button>
        </div>
      </div>
    );
  }
}

// ── ArcWorkspace ──────────────────────────────────────────────────────────────

function ArcWorkspace({
  arc,
  editor,
  sessions,
  entities,
  encounters,
  handouts,
  downtime,
  pending,
  developmentTitle,
  developmentDescription,
  developmentSessionId,
  developmentEntityIds,
  onEditorChange,
  onSave,
  onDevelopmentTitleChange,
  onDevelopmentDescriptionChange,
  onDevelopmentSessionChange,
  onDevelopmentEntityIdsChange,
  onAddDevelopment,
}: {
  arc: CampaignArc;
  editor: ArcEditorState;
  sessions: Session[];
  entities: WorldEntity[];
  encounters: Encounter[];
  handouts: Handout[];
  downtime: DowntimeActivity[];
  pending: boolean;
  developmentTitle: string;
  developmentDescription: string;
  developmentSessionId: string;
  developmentEntityIds: string[];
  onEditorChange: (value: ArcEditorState) => void;
  onSave: () => void;
  onDevelopmentTitleChange: (value: string) => void;
  onDevelopmentDescriptionChange: (value: string) => void;
  onDevelopmentSessionChange: (value: string) => void;
  onDevelopmentEntityIdsChange: (value: string[]) => void;
  onAddDevelopment: () => void;
}) {
  const relatedEntities = entities.filter((entity) =>
    (arc.links?.entityIds ?? []).includes(entity._id),
  );
  const relatedSessions = sessions.filter((session) =>
    (arc.links?.sessionIds ?? []).includes(session._id),
  );
  const relatedEncounters = encounters.filter((encounter) =>
    (arc.links?.encounterIds ?? []).includes(encounter._id),
  );
  const relatedHandouts = handouts.filter((handout) =>
    (arc.links?.handoutIds ?? []).includes(handout._id),
  );
  const relatedDowntime = downtime.filter((item) =>
    (arc.links?.downtimeIds ?? []).includes(item._id),
  );

  const npcs = entities.filter(
    (entity) => entity.type === 'npc' || entity.type === 'npc_minor',
  );
  const factions = entities.filter((entity) => entity.type === 'faction');
  const locations = entities.filter(
    (entity) => entity.type === 'location' || entity.type === 'location_detail',
  );
  const quests = entities.filter((entity) => entity.type === 'quest');

  return (
    <div className="space-y-4">
      {renderWorkspaceFields()}
      {renderWorkspaceLower()}
    </div>
  );

  function renderWorkspaceFields() {
    return (
      <div className={`${panelClass} p-5`}>
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          {renderWorkspaceMain()}
          {renderWorkspaceSidebar()}
        </div>
      </div>
    );
  }

  function renderWorkspaceMain() {
    return (
      <div className="space-y-4">
        <Field label="Premise">
          <textarea
            value={editor.description}
            onChange={(event) => onEditorChange({ ...editor, description: event.target.value })}
            className={`${fieldClass} min-h-[120px] resize-y`}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Current State">
            <textarea
              value={editor.currentState}
              onChange={(event) => onEditorChange({ ...editor, currentState: event.target.value })}
              className={`${fieldClass} min-h-[120px] resize-y`}
            />
          </Field>
          <Field label="Recent Change">
            <textarea
              value={editor.recentChange}
              onChange={(event) => onEditorChange({ ...editor, recentChange: event.target.value })}
              className={`${fieldClass} min-h-[120px] resize-y`}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Stakes">
            <textarea
              value={editor.stakes}
              onChange={(event) => onEditorChange({ ...editor, stakes: event.target.value })}
              className={`${fieldClass} min-h-[120px] resize-y`}
            />
          </Field>
          <Field label="Next Likely Development">
            <textarea
              value={editor.nextDevelopment}
              onChange={(event) =>
                onEditorChange({ ...editor, nextDevelopment: event.target.value })
              }
              className={`${fieldClass} min-h-[120px] resize-y`}
            />
          </Field>
        </div>
      </div>
    );
  }

  function renderWorkspaceSidebar() {
    return (
      <div className={`${panelClass} p-4`}>
        <Field label="Status">
          <select
            value={editor.status}
            onChange={(event) =>
              onEditorChange({ ...editor, status: event.target.value as ArcStatus })
            }
            className={fieldClass}
          >
            {Object.entries(ARC_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <div className="mt-4">
          <Field label="Pressure">
            <select
              value={editor.pressure}
              onChange={(event) =>
                onEditorChange({
                  ...editor,
                  pressure: event.target.value as ArcEditorState['pressure'],
                })
              }
              className={fieldClass}
            >
              {Object.entries(ARC_PRESSURE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className={`${actionButtonClass(true)} mt-4 w-full justify-center`}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ScrollText className="h-4 w-4" />
          )}
          Save Arc
        </button>
      </div>
    );
  }

  function renderWorkspaceLower() {
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        {renderDevelopmentsPanel()}
        {renderWorkspaceLinks()}
      </div>
    );
  }

  function renderDevelopmentsPanel() {
    return (
      <div className={`${panelClass} p-5`}>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
          Recent Developments
        </p>
        {renderDevelopmentsList()}
        {renderAddDevelopmentForm()}
      </div>
    );
  }

  function renderDevelopmentsList() {
    return (
      <div className="mt-4 space-y-3">
        {(arc.developments ?? []).length === 0 ? (
          <p className="text-sm leading-7 text-[hsl(30,14%,58%)]">
            No developments logged yet. Record what changed in-session to keep the arc's
            chronology visible.
          </p>
        ) : (
          [...(arc.developments ?? [])].slice().reverse().map((development) => (
            <div
              key={development._id}
              className="rounded-[18px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,10%,0.56)] p-4"
            >
              <p className="font-[Cinzel] text-sm text-[hsl(38,32%,86%)]">{development.title}</p>
              <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,62%)]">
                {development.description || 'No extra note recorded for this development.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em] text-[hsl(212,24%,66%)]">
                {development.sessionId && (
                  <span>{findSessionLabel(sessions, development.sessionId)}</span>
                )}
                {development.createdAt && (
                  <span>{new Date(development.createdAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  function renderAddDevelopmentForm() {
    return (
      <div className="mt-5 rounded-[18px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.58)] p-4">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
          Add Development
        </p>
        <div className="mt-3 space-y-3">
          <input
            value={developmentTitle}
            onChange={(event) => onDevelopmentTitleChange(event.target.value)}
            className={fieldClass}
            placeholder="Captain Merrow was exposed as an informant"
          />
          <textarea
            value={developmentDescription}
            onChange={(event) => onDevelopmentDescriptionChange(event.target.value)}
            className={`${fieldClass} min-h-[100px] resize-y`}
            placeholder="What changed in the world or at the table?"
          />
          <select
            value={developmentSessionId}
            onChange={(event) => onDevelopmentSessionChange(event.target.value)}
            className={fieldClass}
          >
            <option value="">No linked session</option>
            {sessions.map((session) => (
              <option key={session._id} value={session._id}>
                {findSessionLabel(sessions, session._id)}
              </option>
            ))}
          </select>
          <select
            multiple
            value={developmentEntityIds}
            onChange={(event) =>
              onDevelopmentEntityIdsChange(
                Array.from(event.target.selectedOptions).map((option) => option.value),
              )
            }
            className={`${fieldClass} min-h-[120px]`}
          >
            {entities.map((entity) => (
              <option key={entity._id} value={entity._id}>{entity.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAddDevelopment}
            disabled={pending || !developmentTitle.trim()}
            className={actionButtonClass(true)}
          >
            <Plus className="h-4 w-4" />
            Record Development
          </button>
        </div>
      </div>
    );
  }

  function renderWorkspaceLinks() {
    return (
      <div className="space-y-4">
        <ArcLinksEditor
          editor={editor}
          sessions={sessions}
          npcs={npcs}
          factions={factions}
          locations={locations}
          quests={quests}
          encounters={encounters}
          handouts={handouts}
          downtime={downtime}
          onChange={onEditorChange}
        />
        <LinkedRecordsPanel
          entities={relatedEntities}
          sessions={relatedSessions}
          encounters={relatedEncounters}
          handouts={relatedHandouts}
          downtime={relatedDowntime}
        />
      </div>
    );
  }
}

// ── ArcLinksEditor ────────────────────────────────────────────────────────────

function ArcLinksEditor({
  editor,
  sessions,
  npcs,
  factions,
  locations,
  quests,
  encounters,
  handouts,
  downtime,
  onChange,
}: {
  editor: ArcEditorState;
  sessions: Session[];
  npcs: WorldEntity[];
  factions: WorldEntity[];
  locations: WorldEntity[];
  quests: WorldEntity[];
  encounters: Encounter[];
  handouts: Handout[];
  downtime: DowntimeActivity[];
  onChange: (value: ArcEditorState) => void;
}) {
  const entityOptions = [...npcs, ...factions, ...locations, ...quests];
  return (
    <div className={`${panelClass} p-5`}>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
        Campaign Connections
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {renderEntitySelect()}
        {renderSessionSelect()}
        {renderOtherSelects()}
      </div>
    </div>
  );

  function renderEntitySelect() {
    return (
      <Field label="NPCs / Factions / Locations / Quests">
        <select
          multiple
          value={editor.links.entityIds}
          onChange={(event) =>
            onChange({
              ...editor,
              links: {
                ...editor.links,
                entityIds: Array.from(event.target.selectedOptions).map((option) => option.value),
              },
            })
          }
          className={`${fieldClass} min-h-[140px]`}
        >
          {entityOptions.map((entity) => (
            <option key={entity._id} value={entity._id}>{entity.name}</option>
          ))}
        </select>
      </Field>
    );
  }

  function renderSessionSelect() {
    return (
      <Field label="Sessions">
        <select
          multiple
          value={editor.links.sessionIds}
          onChange={(event) =>
            onChange({
              ...editor,
              links: {
                ...editor.links,
                sessionIds: Array.from(event.target.selectedOptions).map((option) => option.value),
              },
            })
          }
          className={`${fieldClass} min-h-[140px]`}
        >
          {sessions.map((session) => (
            <option key={session._id} value={session._id}>
              {findSessionLabel(sessions, session._id)}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  function renderOtherSelects() {
    return (
      <Field label="Encounters / Handouts / Downtime">
        <div className="grid gap-3">
          <select
            multiple
            value={editor.links.encounterIds}
            onChange={(event) =>
              onChange({
                ...editor,
                links: {
                  ...editor.links,
                  encounterIds: Array.from(event.target.selectedOptions).map(
                    (option) => option.value,
                  ),
                },
              })
            }
            className={`${fieldClass} min-h-[96px]`}
          >
            {encounters.map((encounter) => (
              <option key={encounter._id} value={encounter._id}>{encounter.name}</option>
            ))}
          </select>
          <select
            multiple
            value={editor.links.handoutIds}
            onChange={(event) =>
              onChange({
                ...editor,
                links: {
                  ...editor.links,
                  handoutIds: Array.from(event.target.selectedOptions).map(
                    (option) => option.value,
                  ),
                },
              })
            }
            className={`${fieldClass} min-h-[96px]`}
          >
            {handouts.map((handout) => (
              <option key={handout._id} value={handout._id}>{handout.title}</option>
            ))}
          </select>
          <select
            multiple
            value={editor.links.downtimeIds}
            onChange={(event) =>
              onChange({
                ...editor,
                links: {
                  ...editor.links,
                  downtimeIds: Array.from(event.target.selectedOptions).map(
                    (option) => option.value,
                  ),
                },
              })
            }
            className={`${fieldClass} min-h-[96px]`}
          >
            {downtime.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>
        </div>
      </Field>
    );
  }
}

// ── LinkedRecordsPanel ────────────────────────────────────────────────────────

function LinkedRecordsPanel({
  entities,
  sessions,
  encounters,
  handouts,
  downtime,
}: {
  entities: WorldEntity[];
  sessions: Session[];
  encounters: Encounter[];
  handouts: Handout[];
  downtime: DowntimeActivity[];
}) {
  return (
    <div className={`${panelClass} p-4`}>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
        Linked Records
      </p>
      <div className="mt-3 space-y-3">
        <LinkGroup title="Entities" items={entities.map((entity) => entity.name)} />
        <LinkGroup
          title="Sessions"
          items={sessions.map((session) => findSessionLabel(sessions, session._id))}
        />
        <LinkGroup title="Encounters" items={encounters.map((encounter) => encounter.name)} />
        <LinkGroup title="Handouts" items={handouts.map((handout) => handout.title)} />
        <LinkGroup title="Downtime" items={downtime.map((item) => item.name)} />
      </div>
    </div>
  );
}

// ── LinkGroup ─────────────────────────────────────────────────────────────────

function LinkGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-[16px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,10%,0.56)] p-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">{title}</p>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-[hsl(38,24%,88%)]">
            <ChevronRight className="h-3.5 w-3.5 text-[hsl(30,12%,58%)]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SummaryPill ───────────────────────────────────────────────────────────────

export function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.62)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">{label}</p>
      <p className="text-sm text-[hsl(38,24%,88%)]">{value}</p>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
        {label}
      </span>
      {children}
    </label>
  );
}
