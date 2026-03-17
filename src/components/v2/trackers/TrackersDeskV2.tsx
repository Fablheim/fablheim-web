import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Minus,
  Plus,
  Sparkles,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TrackerThreshold, WorldStateTracker } from '@/types/campaign';
import { shellPanelClass } from '@/lib/panel-styles';
import { ArcLinker } from '../shared/ArcLinker';
import {
  useTrackersContext,
  buildSummary,
  getActiveThreshold,
  getProgress,
  createEditorFromTracker,
  previewTrackerFromEditor,
  buildTrackerPayload,
  clamp,
  type TrackerEditorState,
} from './TrackersContext';

// ── Style constants ───────────────────────────────────────────────────────────

const fieldClass =
  'w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(24,18%,10%,0.92)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,10%,44%)] outline-none transition focus:border-[hsla(42,64%,58%,0.58)]';
const labelClass =
  'text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]';
const sectionLabelClass = 'text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]';

// ── Main component ────────────────────────────────────────────────────────────

export function TrackersDeskV2() {
  const {
    campaignId,
    isDM,
    isCreating,
    setIsCreating,
    isEditing,
    setIsEditing,
    editor,
    setEditor,
    selectedTracker,
    allVisibleTrackers,
    summary,
    addTracker,
    updateTracker,
    adjustTracker,
    removeTracker,
    openCreate,
    setSelectedTrackerId,
  } = useTrackersContext();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(42,48%,28%,0.12),transparent_32%),linear-gradient(180deg,hsl(224,18%,8%)_0%,hsl(20,20%,7%)_100%)] p-4 text-[hsl(38,24%,88%)]">
      <section className={`${shellPanelClass} min-h-0 flex-1 flex flex-col overflow-hidden`}>
        {renderShellHeader()}
        {renderShellBody()}
      </section>
    </div>
  );

  // ── Header ─────────────────────────────────────────────────────────────────

  function renderShellHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {renderHeaderLeft()}
          {renderHeaderActions()}
        </div>
        {renderHeaderBadges()}
      </div>
    );
  }

  function renderHeaderLeft() {
    const title = isCreating
      ? 'New Tracker'
      : selectedTracker?.name ?? 'World State';
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(30,14%,54%)]">
          World State
        </p>
        <h2 className="mt-0.5 font-['IM_Fell_English'] text-[26px] leading-none text-[hsl(38,42%,90%)]">
          {title}
        </h2>
      </div>
    );
  }

  function renderHeaderActions() {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {isDM && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full border border-[hsla(42,72%,52%,0.38)] bg-[linear-gradient(180deg,hsla(42,72%,56%,0.18)_0%,hsla(42,72%,38%,0.16)_100%)] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[hsl(42,78%,80%)] transition hover:border-[hsla(42,72%,60%,0.46)]"
          >
            <Plus className="h-4 w-4" />
            Create Tracker
          </button>
        )}
        {selectedTracker && !isCreating && isDM && renderTrackerQuickActions()}
      </div>
    );
  }

  function renderTrackerQuickActions() {
    return (
      <>
        <button
          type="button"
          onClick={() => handleAdjust(1)}
          disabled={adjustTracker.isPending}
          className="inline-flex items-center gap-2 rounded-full border border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[hsl(30,12%,62%)] transition hover:text-[hsl(38,24%,88%)] disabled:opacity-40"
        >
          <Sparkles className="h-4 w-4" />
          Advance Tracker
        </button>
        <button
          type="button"
          onClick={handleResolve}
          disabled={updateTracker.isPending}
          className="inline-flex items-center gap-2 rounded-full border border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[hsl(30,12%,62%)] transition hover:text-[hsl(38,24%,88%)] disabled:opacity-40"
        >
          <Target className="h-4 w-4" />
          Resolve Tracker
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={removeTracker.isPending}
          className="inline-flex items-center gap-2 rounded-full border border-[hsla(0,48%,38%,0.38)] bg-[hsla(0,38%,16%,0.22)] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[hsl(8,70%,76%)] transition hover:border-[hsla(0,58%,48%,0.5)] disabled:opacity-40"
        >
          Archive
        </button>
      </>
    );
  }

  function renderHeaderBadges() {
    if (!selectedTracker || isCreating) return null;
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(42,78%,78%)]">
          {selectedTracker.value} / {selectedTracker.max}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(30,12%,58%)]">
          {selectedTracker.visibility === 'public'
            ? <Eye className="h-3 w-3" />
            : <EyeOff className="h-3 w-3" />}
          {selectedTracker.visibility === 'public' ? 'Public' : 'GM Only'}
        </span>
      </div>
    );
  }

  // ── Body ───────────────────────────────────────────────────────────────────

  function renderShellBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isCreating ? (
          <TrackerComposer
            title="Compose a New Pressure"
            subtitle="Define the meter, its boundaries, and the moments where the world shifts."
            editor={editor}
            onChange={setEditor}
            onCancel={() => setIsCreating(false)}
            onSubmit={handleCreate}
            isBusy={addTracker.isPending}
          />
        ) : selectedTracker ? (
          <SelectedTrackerWorkspace
            key={selectedTracker._id}
            campaignId={campaignId}
            tracker={selectedTracker}
            isDM={isDM}
            isEditing={isEditing}
            editor={editor}
            onEditorChange={setEditor}
            onStartEditing={() => {
              setEditor(createEditorFromTracker(selectedTracker));
              setIsEditing(true);
            }}
            onCancelEditing={() => {
              setIsEditing(false);
              setEditor(createEditorFromTracker(selectedTracker));
            }}
            onSave={handleSave}
            onAdjust={handleAdjust}
            onResolve={handleResolve}
            onDelete={handleDelete}
            onDirectSet={(value) => {
              const next = Number.parseInt(value, 10);
              if (Number.isNaN(next)) return;
              const clamped = clamp(next, selectedTracker.min, selectedTracker.max);
              updateTracker.mutate(
                { campaignId, trackerId: selectedTracker._id, data: { value: clamped } },
                {
                  onSuccess: () => toast.success('Tracker value updated'),
                  onError: () => toast.error('Failed to set tracker value'),
                },
              );
            }}
            isSaving={updateTracker.isPending}
          />
        ) : (
          <TrackerOverview
            isDM={isDM}
            summary={summary}
            hasTrackers={allVisibleTrackers.length > 0}
            onCreate={openCreate}
          />
        )}
      </div>
    );
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleCreate() {
    const payload = buildTrackerPayload(editor);
    if (!payload) return;

    addTracker.mutate(
      { campaignId, data: payload },
      {
        onSuccess: (campaign) => {
          toast.success('Tracker created');
          const nextTracker = (campaign.worldStateTrackers ?? []).at(-1);
          setIsCreating(false);
          if (nextTracker?._id) {
            setSelectedTrackerId(nextTracker._id);
          }
        },
        onError: () => toast.error('Failed to create tracker'),
      },
    );
  }

  function handleSave() {
    if (!selectedTracker) return;
    const payload = buildTrackerPayload(editor);
    if (!payload) return;

    updateTracker.mutate(
      { campaignId, trackerId: selectedTracker._id, data: payload },
      {
        onSuccess: () => {
          toast.success('Tracker updated');
          setIsEditing(false);
        },
        onError: () => toast.error('Failed to update tracker'),
      },
    );
  }

  function handleAdjust(delta: number) {
    if (!selectedTracker) return;
    adjustTracker.mutate(
      { campaignId, trackerId: selectedTracker._id, delta },
      { onError: () => toast.error('Failed to update tracker') },
    );
  }

  function handleResolve() {
    if (!selectedTracker) return;
    updateTracker.mutate(
      { campaignId, trackerId: selectedTracker._id, data: { value: selectedTracker.max } },
      { onSuccess: () => toast.success('Tracker marked at full pressure') },
    );
  }

  function handleDelete() {
    if (!selectedTracker) return;
    removeTracker.mutate(
      { campaignId, trackerId: selectedTracker._id },
      {
        onSuccess: () => {
          toast.success('Tracker removed');
          setSelectedTrackerId(null);
          setIsEditing(false);
        },
        onError: () => toast.error('Failed to remove tracker'),
      },
    );
  }
}

// ── TrackerComposer ───────────────────────────────────────────────────────────

function TrackerComposer({
  title,
  subtitle,
  editor,
  onChange,
  onCancel,
  onSubmit,
  isBusy,
  submitLabel = 'Create Tracker',
}: {
  title: string;
  subtitle: string;
  editor: TrackerEditorState;
  onChange: (next: TrackerEditorState) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isBusy: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="px-5 py-5">
      {renderComposerHeader()}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {renderComposerMain()}
        {renderComposerSidebar()}
      </div>
    </div>
  );

  function renderComposerHeader() {
    return (
      <div className="border-b border-[hsla(32,24%,24%,0.4)] pb-4">
        <p className={sectionLabelClass}>Tracker Workspace</p>
        <h3 className="mt-2 font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">
          {title}
        </h3>
        <p className="mt-3 max-w-2xl text-sm text-[hsl(30,14%,66%)]">{subtitle}</p>
      </div>
    );
  }

  function renderComposerMain() {
    return (
      <div className="space-y-5">
        {renderCoreRecord()}
        {renderThresholdsSection()}
      </div>
    );
  }

  function renderCoreRecord() {
    return (
      <section className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
        <p className={sectionLabelClass}>Core Record</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {renderCoreTitle()}
          {renderCoreMeaning()}
          {renderCoreBounds()}
          {renderCoreVisibility()}
        </div>
      </section>
    );
  }

  function renderCoreTitle() {
    return (
      <div className="md:col-span-2">
        <label className={labelClass}>Title</label>
        <input
          value={editor.name}
          onChange={(event) => onChange({ ...editor, name: event.target.value })}
          placeholder="Silver Council Suspicion"
          className={`${fieldClass} mt-2`}
        />
      </div>
    );
  }

  function renderCoreMeaning() {
    return (
      <div className="md:col-span-2">
        <label className={labelClass}>Meaning</label>
        <textarea
          value={editor.description}
          onChange={(event) => onChange({ ...editor, description: event.target.value })}
          rows={4}
          placeholder="What pressure or fragile balance does this tracker represent?"
          className={`${fieldClass} mt-2 resize-none`}
        />
      </div>
    );
  }

  function renderCoreBounds() {
    return (
      <>
        <div>
          <label className={labelClass}>Minimum</label>
          <input
            value={editor.min}
            onChange={(event) => onChange({ ...editor, min: event.target.value })}
            className={`${fieldClass} mt-2`}
          />
        </div>
        <div>
          <label className={labelClass}>Maximum</label>
          <input
            value={editor.max}
            onChange={(event) => onChange({ ...editor, max: event.target.value })}
            className={`${fieldClass} mt-2`}
          />
        </div>
        <div>
          <label className={labelClass}>Current Value</label>
          <input
            value={editor.value}
            onChange={(event) => onChange({ ...editor, value: event.target.value })}
            className={`${fieldClass} mt-2`}
          />
        </div>
      </>
    );
  }

  function renderCoreVisibility() {
    return (
      <div>
        <label className={labelClass}>Visibility</label>
        <select
          value={editor.visibility}
          onChange={(event) =>
            onChange({ ...editor, visibility: event.target.value as 'public' | 'dm-only' })
          }
          className={`${fieldClass} mt-2`}
        >
          <option value="public">Public</option>
          <option value="dm-only">GM Only</option>
        </select>
      </div>
    );
  }

  function renderThresholdsSection() {
    return (
      <section className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
        {renderThresholdsHeader()}
        <div className="mt-4 divide-y divide-[hsla(32,24%,24%,0.4)]">
          {editor.thresholds.length > 0
            ? editor.thresholds.map((threshold, index) =>
                renderThresholdRow(threshold, index),
              )
            : renderThresholdsEmpty()}
        </div>
      </section>
    );
  }

  function renderThresholdsHeader() {
    return (
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={sectionLabelClass}>Thresholds</p>
          <p className="mt-1 text-xs text-[hsl(30,12%,58%)]">
            Call out the points where the world changes texture.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...editor,
              thresholds: [...editor.thresholds, { value: 0, label: '', effect: '' }],
            })
          }
          className="rounded-full border border-[hsla(42,54%,46%,0.48)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[hsl(42,82%,78%)]"
        >
          Add Threshold
        </button>
      </div>
    );
  }

  function renderThresholdsEmpty() {
    return (
      <p className="text-sm text-[hsl(30,12%,60%)]">
        No thresholds yet. Add one if the meter should call out meaningful breakpoints.
      </p>
    );
  }

  function renderThresholdRow(threshold: TrackerThreshold, index: number) {
    return (
      <div key={`${index}-${threshold.label}`} className="py-3">
        <div className="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)]">
          <div>
            <label className={labelClass}>Value</label>
            <input
              value={String(threshold.value)}
              onChange={(event) =>
                onChange({
                  ...editor,
                  thresholds: editor.thresholds.map((entry, i) =>
                    i === index
                      ? { ...entry, value: Number.parseInt(event.target.value || '0', 10) || 0 }
                      : entry,
                  ),
                })
              }
              className={`${fieldClass} mt-2`}
            />
          </div>
          <div>
            <label className={labelClass}>Label</label>
            <input
              value={threshold.label}
              onChange={(event) =>
                onChange({
                  ...editor,
                  thresholds: editor.thresholds.map((entry, i) =>
                    i === index ? { ...entry, label: event.target.value } : entry,
                  ),
                })
              }
              placeholder="Suspicion hardens"
              className={`${fieldClass} mt-2`}
            />
          </div>
        </div>
        <div className="mt-3 flex items-end gap-3">
          <div className="flex-1">
            <label className={labelClass}>Effect Note</label>
            <input
              value={threshold.effect ?? ''}
              onChange={(event) =>
                onChange({
                  ...editor,
                  thresholds: editor.thresholds.map((entry, i) =>
                    i === index ? { ...entry, effect: event.target.value } : entry,
                  ),
                })
              }
              placeholder="Watch patrols start recognizing the party on sight."
              className={`${fieldClass} mt-2`}
            />
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...editor,
                thresholds: editor.thresholds.filter((_, i) => i !== index),
              })
            }
            className="rounded-2xl border border-[hsla(0,48%,38%,0.38)] px-3 py-2 text-sm text-[hsl(8,70%,76%)]"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  function renderComposerSidebar() {
    return (
      <aside className="space-y-5">
        <section className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
          <p className={sectionLabelClass}>Preview</p>
          <TrackerPreview editor={editor} />
        </section>
        {renderComposerActions()}
      </aside>
    );
  }

  function renderComposerActions() {
    return (
      <section className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
        <p className={sectionLabelClass}>Actions</p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isBusy}
            className="rounded-2xl border border-[hsla(42,54%,46%,0.48)] bg-[linear-gradient(180deg,hsla(40,72%,52%,0.26)_0%,hsla(36,68%,42%,0.18)_100%)] px-4 py-2 text-sm text-[hsl(40,82%,78%)] transition disabled:opacity-40"
          >
            {submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-[hsla(32,24%,26%,0.62)] px-4 py-2 text-sm text-[hsl(38,24%,80%)]"
          >
            Cancel
          </button>
        </div>
      </section>
    );
  }
}

// ── SelectedTrackerWorkspace ──────────────────────────────────────────────────

function SelectedTrackerWorkspace({
  campaignId,
  tracker,
  isDM,
  isEditing,
  editor,
  onEditorChange,
  onStartEditing,
  onCancelEditing,
  onSave,
  onAdjust,
  onResolve,
  onDelete,
  onDirectSet,
  isSaving,
}: {
  campaignId: string;
  tracker: WorldStateTracker;
  isDM: boolean;
  isEditing: boolean;
  editor: TrackerEditorState;
  onEditorChange: (next: TrackerEditorState) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSave: () => void;
  onAdjust: (delta: number) => void;
  onResolve: () => void;
  onDelete: () => void;
  onDirectSet: (value: string) => void;
  isSaving: boolean;
}) {
  const progress = getProgress(tracker);
  const threshold = getActiveThreshold(tracker);
  const [directValue, setDirectValue] = useState(String(tracker.value));

  return (
    <div className="px-5 py-5">
      {renderWorkspaceHeader()}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_320px]">
        {renderWorkspaceMain()}
        {renderWorkspaceSidebar()}
      </div>
      {isEditing && renderInlineEditor()}
    </div>
  );

  function renderWorkspaceHeader() {
    return (
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[hsla(32,24%,24%,0.4)] pb-4">
        <div>
          <p className={sectionLabelClass}>Selected Tracker</p>
          <h3 className="mt-2 font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">
            {tracker.name}
          </h3>
          {renderWorkspaceHeaderBadges()}
        </div>
        {isDM && !isEditing && renderWorkspaceEditButtons()}
      </div>
    );
  }

  function renderWorkspaceHeaderBadges() {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[hsl(30,12%,60%)]">
        <span className="rounded-full border border-[hsla(32,24%,26%,0.62)] px-3 py-1">
          Numeric meter
        </span>
        <span className="rounded-full border border-[hsla(32,24%,26%,0.62)] px-3 py-1">
          {tracker.value} / {tracker.max}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[hsla(32,24%,26%,0.62)] px-3 py-1">
          {tracker.visibility === 'public' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {tracker.visibility === 'public' ? 'Public' : 'GM Only'}
        </span>
      </div>
    );
  }

  function renderWorkspaceEditButtons() {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onStartEditing}
          className="rounded-2xl border border-[hsla(32,24%,26%,0.62)] bg-[hsla(24,18%,10%,0.88)] px-4 py-2 text-sm text-[hsl(38,24%,82%)] transition hover:border-[hsla(42,54%,46%,0.44)]"
        >
          Edit Tracker
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-2xl border border-[hsla(0,48%,38%,0.38)] bg-[hsla(0,38%,16%,0.22)] px-4 py-2 text-sm text-[hsl(8,70%,76%)] transition hover:border-[hsla(0,58%,48%,0.5)]"
        >
          Archive
        </button>
      </div>
    );
  }

  function renderWorkspaceMain() {
    return (
      <div className="space-y-5">
        {renderPressureGauge()}
        {renderMeaningPanel()}
        {renderRelatedArcPanel()}
        {renderThresholdLedger()}
        {renderRecentChanges()}
      </div>
    );
  }

  function renderPressureGauge() {
    return (
      <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
        <p className={sectionLabelClass}>Pressure Gauge</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="font-[Cinzel] text-4xl text-[hsl(38,40%,90%)]">{tracker.value}</p>
            <p className="mt-1 text-sm text-[hsl(30,12%,60%)]">
              Range {tracker.min} to {tracker.max}
            </p>
          </div>
          <div className="rounded-full border border-[hsla(32,24%,24%,0.52)] px-3 py-1 text-xs text-[hsl(38,24%,76%)]">
            {progress.statusLabel}
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[hsla(24,14%,16%,0.9)]">
          <div
            className={`h-full rounded-full ${progress.fillClass}`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        {threshold && renderActiveThreshold(threshold)}
      </div>
    );
  }

  function renderActiveThreshold(t: NonNullable<ReturnType<typeof getActiveThreshold>>) {
    return (
      <div className="mt-4 rounded-[18px] border border-[hsla(42,40%,40%,0.26)] bg-[hsla(40,54%,18%,0.2)] px-4 py-3">
        <p className={sectionLabelClass}>Current Threshold</p>
        <p className="mt-2 font-[Cinzel] text-lg text-[hsl(42,82%,78%)]">{t.label}</p>
        {t.effect && <p className="mt-1 text-sm text-[hsl(30,14%,66%)]">{t.effect}</p>}
      </div>
    );
  }

  function renderMeaningPanel() {
    return (
      <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
        <p className={sectionLabelClass}>Meaning</p>
        <p className="mt-3 text-sm leading-7 text-[hsl(30,14%,72%)]">
          {tracker.description?.trim()
            ? tracker.description
            : 'No note has been recorded for what this tracker represents yet.'}
        </p>
      </div>
    );
  }

  function renderRelatedArcPanel() {
    return (
      <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
        <ArcLinker
          campaignId={campaignId}
          linkField="trackerIds"
          entityId={tracker._id}
          label="Related Arc"
        />
      </div>
    );
  }

  function renderThresholdLedger() {
    return (
      <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
        {renderThresholdLedgerHeader()}
        {renderThresholdLedgerItems()}
      </div>
    );
  }

  function renderThresholdLedgerHeader() {
    return (
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={sectionLabelClass}>Threshold Ledger</p>
          <p className="mt-1 text-xs text-[hsl(30,12%,58%)]">
            The notable states this tracker calls out as it rises.
          </p>
        </div>
        <div className="rounded-full border border-[hsla(32,24%,24%,0.52)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[hsl(30,12%,58%)]">
          {tracker.thresholds.length} entries
        </div>
      </div>
    );
  }

  function renderThresholdLedgerItems() {
    if (tracker.thresholds.length === 0) {
      return (
        <p className="mt-4 text-sm text-[hsl(30,12%,60%)]">
          No thresholds yet. This tracker currently behaves like a straight meter.
        </p>
      );
    }
    return (
      <div className="mt-4 divide-y divide-[hsla(32,24%,24%,0.4)]">
        {[...tracker.thresholds]
          .sort((a, b) => a.value - b.value)
          .map((entry) => (
            <div key={`${entry.value}-${entry.label}`} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-[Cinzel] text-base text-[hsl(38,30%,86%)]">{entry.label}</p>
                <span className="text-xs text-[hsl(42,72%,72%)]">{entry.value}</span>
              </div>
              {entry.effect && (
                <p className="mt-2 text-sm text-[hsl(30,14%,68%)]">{entry.effect}</p>
              )}
            </div>
          ))}
      </div>
    );
  }

  function renderRecentChanges() {
    const adjustments = tracker.adjustments;
    if (!adjustments || adjustments.length === 0) return null;
    const recent = [...adjustments].reverse().slice(0, 5);
    return (
      <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
        <p className={sectionLabelClass}>Recent Changes</p>
        <div className="mt-4 divide-y divide-[hsla(32,24%,24%,0.4)]">
          {recent.map((adj, i) => {
            const sign = adj.delta > 0 ? '+' : '';
            const dateStr = new Date(adj.createdAt).toLocaleDateString();
            return (
              <div key={i} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className={`font-[Cinzel] text-base ${adj.delta > 0 ? 'text-[hsl(150,62%,70%)]' : 'text-[hsl(0,72%,72%)]'}`}>
                    {sign}{adj.delta}
                  </span>
                  <span className="text-xs text-[hsl(30,12%,58%)]">
                    {adj.valueBefore} &rarr; {adj.valueAfter}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[hsl(30,14%,62%)]">
                  {adj.reason && <span>{adj.reason}</span>}
                  {adj.sessionNumber != null && (
                    <span className="rounded-full border border-[hsla(32,24%,26%,0.62)] px-2 py-0.5 text-[10px]">
                      Session {adj.sessionNumber}
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-[hsl(30,10%,50%)]">{dateStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderWorkspaceSidebar() {
    return (
      <aside className="space-y-5">
        {renderQuickShift()}
        {renderTrackerNotes()}
      </aside>
    );
  }

  function renderQuickShift() {
    return (
      <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
        <p className={sectionLabelClass}>Quick Shift</p>
        {isDM ? renderQuickShiftDM() : renderQuickShiftPlayer()}
      </div>
    );
  }

  function renderQuickShiftDM() {
    return (
      <>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <QuickAdjustButton icon={Minus} label="-1" onClick={() => onAdjust(-1)} />
          <QuickAdjustButton icon={Plus} label="+1" onClick={() => onAdjust(1)} />
          <QuickAdjustButton label="-5" onClick={() => onAdjust(-5)} />
          <QuickAdjustButton label="+5" onClick={() => onAdjust(5)} />
        </div>
        {renderDirectSetInput()}
        <button
          type="button"
          onClick={onResolve}
          className="mt-4 w-full rounded-2xl border border-[hsla(42,54%,46%,0.34)] bg-[hsla(40,54%,18%,0.16)] px-4 py-2 text-sm text-[hsl(42,78%,80%)]"
        >
          Push to maximum
        </button>
      </>
    );
  }

  function renderDirectSetInput() {
    return (
      <div className="mt-4">
        <label className={labelClass}>Set exact value</label>
        <div className="mt-2 flex gap-2">
          <input
            value={directValue}
            onChange={(event) => setDirectValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onDirectSet(directValue);
            }}
            className={fieldClass}
          />
          <button
            type="button"
            onClick={() => onDirectSet(directValue)}
            className="shrink-0 rounded-2xl border border-[hsla(42,54%,46%,0.48)] px-4 py-2 text-sm text-[hsl(42,82%,78%)] transition hover:border-[hsla(42,60%,60%,0.72)]"
          >
            Set
          </button>
        </div>
      </div>
    );
  }

  function renderQuickShiftPlayer() {
    return (
      <p className="mt-3 text-sm text-[hsl(30,12%,62%)]">
        Only the GM can shift world-state trackers.
      </p>
    );
  }

  function renderTrackerNotes() {
    return (
      <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
        <p className={sectionLabelClass}>Tracker Notes</p>
        <div className="mt-3 space-y-3 text-sm text-[hsl(30,14%,68%)]">
          <p>
            This tracker is campaign-scoped and uses the built-in world-state meter model from the
            server.
          </p>
          <p>
            Thresholds are annotations only, so this surface highlights them narratively instead of
            treating them as separate rules logic.
          </p>
        </div>
      </div>
    );
  }

  function renderInlineEditor() {
    return (
      <div className="mt-5">
        <TrackerComposer
          title="Refine Tracker"
          subtitle="Adjust the meter, change what it measures, or tune the thresholds that matter."
          editor={editor}
          onChange={onEditorChange}
          onCancel={onCancelEditing}
          onSubmit={onSave}
          isBusy={isSaving}
          submitLabel="Save Tracker"
        />
      </div>
    );
  }
}

// ── TrackerOverview ───────────────────────────────────────────────────────────

function TrackerOverview({
  isDM,
  summary,
  hasTrackers,
  onCreate,
}: {
  isDM: boolean;
  summary: ReturnType<typeof buildSummary>;
  hasTrackers: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="px-5 py-5">
      <p className={sectionLabelClass}>Tracker Workspace</p>
      <h3 className="mt-2 font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">
        World State Overview
      </h3>
      <p className="mt-3 max-w-2xl text-sm text-[hsl(30,14%,66%)]">
        Pick a tracker from the shelf to inspect it closely, or open a new meter for an unfolding
        threat, fragile alliance, or slow-burning project.
      </p>
      {renderOverviewCards(summary)}
      {renderOverviewNote(isDM, hasTrackers, onCreate)}
    </div>
  );
}

function renderOverviewCards(summary: ReturnType<typeof buildSummary>) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      <OverviewCard
        title="Rising Pressures"
        value={String(summary.rising)}
        body="Meters that still have room to climb and deserve ongoing attention."
      />
      <OverviewCard
        title="Thresholded Meters"
        value={String(summary.withThresholds)}
        body="Trackers with named breakpoints that change the fiction as they move."
      />
      <OverviewCard
        title="Resolved"
        value={String(summary.resolved)}
        body="Meters that currently sit at their maximum and can be revisited or cleared."
      />
    </div>
  );
}

function renderOverviewNote(
  isDM: boolean,
  hasTrackers: boolean,
  onCreate: () => void,
) {
  return (
    <div className="mt-6 rounded-[24px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-5">
      <p className={sectionLabelClass}>How This Surface Maps To The Server</p>
      <div className="mt-4 space-y-3 text-sm leading-7 text-[hsl(30,14%,72%)]">
        <p>
          Trackers are currently stored as campaign-scoped world-state meters with a current value,
          bounds, thresholds, and visibility.
        </p>
        <p>
          That means this first v2 pass is strongest for suspicion, danger, ritual progress, repair
          progress, political pressure, and other numeric campaign states.
        </p>
        {!hasTrackers && isDM && (
          <button
            type="button"
            onClick={onCreate}
            className="mt-2 rounded-2xl border border-[hsla(42,54%,46%,0.48)] bg-[linear-gradient(180deg,hsla(40,72%,52%,0.26)_0%,hsla(36,68%,42%,0.18)_100%)] px-4 py-2 text-sm text-[hsl(40,82%,78%)] transition hover:border-[hsla(42,60%,60%,0.72)]"
          >
            Create the first tracker
          </button>
        )}
      </div>
    </div>
  );
}

// ── TrackerPreview ────────────────────────────────────────────────────────────

function TrackerPreview({ editor }: { editor: TrackerEditorState }) {
  const tracker = previewTrackerFromEditor(editor);
  const progress = getProgress(tracker);
  const threshold = getActiveThreshold(tracker);

  return (
    <div className="mt-4 rounded-[18px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,10%,0.8)] p-4">
      {renderPreviewTop(tracker)}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[hsla(24,14%,16%,0.9)]">
        <div
          className={`h-full rounded-full ${progress.fillClass}`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-[hsl(30,14%,70%)]">
        {threshold?.label ?? progress.statusLabel}
      </p>
    </div>
  );

  function renderPreviewTop(t: WorldStateTracker) {
    return (
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-[Cinzel] text-lg text-[hsl(38,34%,88%)]">{t.name}</p>
          <p className="mt-1 text-xs text-[hsl(30,12%,58%)]">{t.value} / {t.max}</p>
        </div>
        <div className="rounded-full border border-[hsla(32,24%,24%,0.52)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[hsl(38,24%,74%)]">
          {t.visibility === 'public' ? 'Public' : 'GM Only'}
        </div>
      </div>
    );
  }
}

// ── OverviewCard ──────────────────────────────────────────────────────────────

function OverviewCard({ title, value, body }: { title: string; value: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
      <p className={labelClass}>{title}</p>
      <p className="mt-3 font-[Cinzel] text-4xl text-[hsl(38,40%,90%)]">{value}</p>
      <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,68%)]">{body}</p>
    </div>
  );
}

// ── QuickAdjustButton ─────────────────────────────────────────────────────────

function QuickAdjustButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon?: typeof Plus;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-1 rounded-2xl border border-[hsla(32,24%,26%,0.62)] bg-[hsla(22,18%,10%,0.8)] px-3 py-2 text-sm text-[hsl(38,24%,82%)] transition hover:border-[hsla(42,54%,46%,0.44)]"
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {label}
    </button>
  );
}

