import { useState, useMemo, useCallback } from 'react';
import {
  Activity,
  Plus,
  Minus,
  X,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import {
  useTrackers,
  useAddTracker,
  useUpdateTracker,
  useAdjustTracker,
  useRemoveTracker,
} from '@/hooks/useCampaigns';
import type { WorldStateTracker, TrackerThreshold } from '@/types/campaign';

interface TrackersPanelProps {
  campaignId: string;
  isDM: boolean;
}

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const INPUT_CLS =
  'w-full rounded-sm border border-border bg-[hsl(24,15%,10%)] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40 transition-colors';
const LABEL_CLS = 'block text-xs font-medium text-muted-foreground mb-1';

function barColor(pct: number): string {
  if (pct > 75) return 'bg-[hsl(150,50%,55%)]';
  if (pct >= 25) return 'bg-[hsl(45,90%,55%)]';
  return 'bg-blood';
}

function activeThreshold(
  thresholds: TrackerThreshold[],
  value: number,
): TrackerThreshold | null {
  const sorted = [...thresholds]
    .filter((t) => t.value <= value)
    .sort((a, b) => b.value - a.value);
  return sorted[0] ?? null;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/* ------------------------------------------------------------------ */
/*  Threshold preview bar (reused in create form & tracker card)       */
/* ------------------------------------------------------------------ */

function ProgressBar({
  value,
  min,
  max,
  thresholds,
}: {
  value: number;
  min: number;
  max: number;
  thresholds: TrackerThreshold[];
}) {
  const range = max - min || 1;
  const pct = ((value - min) / range) * 100;

  function renderFill() {
    return (
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${barColor(pct)}`}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    );
  }

  function renderTicks() {
    return (
      <>
        {thresholds.map((t, i) => {
          const pos = ((t.value - min) / range) * 100;
          if (pos < 0 || pos > 100) return null;
          return (
            <div
              key={i}
              className="absolute top-0 h-full w-px bg-foreground/60"
              style={{ left: `${pos}%` }}
              title={`${t.label} (${t.value})`}
            />
          );
        })}
      </>
    );
  }

  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
      {renderFill()}
      {renderTicks()}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Threshold row editor                                               */
/* ------------------------------------------------------------------ */

interface ThresholdRowProps {
  threshold: TrackerThreshold;
  onChange: (t: TrackerThreshold) => void;
  onRemove: () => void;
}

function ThresholdRow({ threshold, onChange, onRemove }: ThresholdRowProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-20 shrink-0">
        <input
          type="number"
          className={INPUT_CLS}
          placeholder="Value"
          value={threshold.value}
          onChange={(e) =>
            onChange({ ...threshold, value: Number(e.target.value) })
          }
        />
      </div>
      <div className="flex-1">
        <input
          type="text"
          className={INPUT_CLS}
          placeholder="Label"
          value={threshold.label}
          onChange={(e) => onChange({ ...threshold, label: e.target.value })}
        />
      </div>
      <div className="flex-1">
        <input
          type="text"
          className={INPUT_CLS}
          placeholder="Effect (optional)"
          value={threshold.effect ?? ''}
          onChange={(e) =>
            onChange({
              ...threshold,
              effect: e.target.value || undefined,
            })
          }
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-1 rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create tracker form                                                */
/* ------------------------------------------------------------------ */

interface CreateFormProps {
  campaignId: string;
  onClose: () => void;
}

function CreateTrackerForm({ campaignId, onClose }: CreateFormProps) {
  const addTracker = useAddTracker();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(100);
  const [initialVal, setInitialVal] = useState(0);
  const [visibility, setVisibility] = useState<'public' | 'dm-only'>('public');
  const [thresholds, setThresholds] = useState<TrackerThreshold[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const updateThreshold = useCallback(
    (idx: number, t: TrackerThreshold) =>
      setThresholds((prev) => prev.map((p, i) => (i === idx ? t : p))),
    [],
  );
  const removeThreshold = useCallback(
    (idx: number) => setThresholds((prev) => prev.filter((_, i) => i !== idx)),
    [],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (maxVal <= minVal) {
      toast.error('Max must be greater than min');
      return;
    }
    addTracker.mutate(
      {
        campaignId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          value: clamp(initialVal, minVal, maxVal),
          min: minVal,
          max: maxVal,
          thresholds,
          visibility,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Tracker "${name.trim()}" created`);
          onClose();
        },
        onError: () => toast.error('Failed to create tracker'),
      },
    );
  }

  function renderNameAndDescription() {
    return (
      <>
        <div>
          <label className={LABEL_CLS}>Name *</label>
          <input
            type="text"
            className={INPUT_CLS}
            placeholder="e.g. Kingdom Stability"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Description</label>
          <textarea
            className={`${INPUT_CLS} resize-none`}
            rows={2}
            placeholder="What does this tracker measure?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </>
    );
  }

  function renderNumericFields() {
    return (
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={LABEL_CLS}>Min</label>
          <input
            type="number"
            className={INPUT_CLS}
            value={minVal}
            onChange={(e) => setMinVal(Number(e.target.value))}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Max *</label>
          <input
            type="number"
            className={INPUT_CLS}
            value={maxVal}
            onChange={(e) => setMaxVal(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Initial</label>
          <input
            type="number"
            className={INPUT_CLS}
            value={initialVal}
            onChange={(e) => setInitialVal(Number(e.target.value))}
          />
        </div>
      </div>
    );
  }

  function renderVisibility() {
    return (
      <div>
        <label className={LABEL_CLS}>Visibility</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
            <input
              type="radio"
              name="visibility"
              checked={visibility === 'public'}
              onChange={() => setVisibility('public')}
              className="accent-primary"
            />
            <Eye className="h-3 w-3 text-muted-foreground" />
            Public
          </label>
          <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
            <input
              type="radio"
              name="visibility"
              checked={visibility === 'dm-only'}
              onChange={() => setVisibility('dm-only')}
              className="accent-primary"
            />
            <EyeOff className="h-3 w-3 text-muted-foreground" />
            GM Only
          </label>
        </div>
      </div>
    );
  }

  function renderThresholdEntries() {
    return (
      <>
        {thresholds.map((t, i) => (
          <ThresholdRow
            key={i}
            threshold={t}
            onChange={(updated) => updateThreshold(i, updated)}
            onRemove={() => removeThreshold(i)}
          />
        ))}
      </>
    );
  }

  function renderThresholdsSection() {
    return (
      <div>
        <label className={LABEL_CLS}>Thresholds</label>
        <div className="space-y-2">
          {renderThresholdEntries()}
          <button
            type="button"
            onClick={() =>
              setThresholds((prev) => [
                ...prev,
                { value: 0, label: '', effect: undefined },
              ])
            }
            className="flex items-center gap-1 text-xs text-brass hover:text-gold transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Threshold
          </button>
        </div>
      </div>
    );
  }

  function renderPreview() {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          {showPreview ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          Preview
        </button>
        {showPreview && (
          <div className="rounded border border-border bg-muted/30 p-3">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-[Cinzel] text-xs text-foreground">
                {name || 'Tracker Name'}
              </span>
              <span className="text-xs text-muted-foreground">
                {clamp(initialVal, minVal, maxVal)} / {maxVal}
              </span>
            </div>
            <ProgressBar
              value={clamp(initialVal, minVal, maxVal)}
              min={minVal}
              max={maxVal}
              thresholds={thresholds}
            />
          </div>
        )}
      </div>
    );
  }

  function renderActions() {
    return (
      <div className="flex justify-end gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={onClose}
          disabled={addTracker.isPending}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          type="submit"
          disabled={addTracker.isPending || !name.trim()}
        >
          {addTracker.isPending && (
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
          )}
          Create
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-lg border border-border border-t-2 border-t-primary/50 bg-card p-4 space-y-3"
    >
      {renderNameAndDescription()}
      {renderNumericFields()}
      {renderVisibility()}
      {renderThresholdsSection()}
      {renderPreview()}
      {renderActions()}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit tracker (inline)                                              */
/* ------------------------------------------------------------------ */

interface EditTrackerInlineProps {
  campaignId: string;
  tracker: WorldStateTracker;
  onClose: () => void;
}

function EditTrackerInline({
  campaignId,
  tracker,
  onClose,
}: EditTrackerInlineProps) {
  const updateTracker = useUpdateTracker();
  const removeTracker = useRemoveTracker();

  const [name, setName] = useState(tracker.name);
  const [description, setDescription] = useState(tracker.description ?? '');
  const [visibility, setVisibility] = useState(tracker.visibility);
  const [thresholds, setThresholds] = useState<TrackerThreshold[]>([
    ...tracker.thresholds,
  ]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateThreshold = useCallback(
    (idx: number, t: TrackerThreshold) =>
      setThresholds((prev) => prev.map((p, i) => (i === idx ? t : p))),
    [],
  );
  const removeThresholdRow = useCallback(
    (idx: number) => setThresholds((prev) => prev.filter((_, i) => i !== idx)),
    [],
  );

  function handleSave() {
    if (!name.trim()) return;
    updateTracker.mutate(
      {
        campaignId,
        trackerId: tracker._id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          visibility,
          thresholds,
        },
      },
      {
        onSuccess: () => {
          toast.success('Tracker updated');
          onClose();
        },
        onError: () => toast.error('Failed to update tracker'),
      },
    );
  }

  function handleDelete() {
    removeTracker.mutate(
      { campaignId, trackerId: tracker._id },
      {
        onSuccess: () => {
          toast.success(`"${tracker.name}" deleted`);
          setConfirmDelete(false);
          onClose();
        },
        onError: () => toast.error('Failed to delete tracker'),
      },
    );
  }

  function renderNameAndVisibility() {
    return (
      <>
        <div>
          <label className={LABEL_CLS}>Name</label>
          <input
            type="text"
            className={INPUT_CLS}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Description</label>
          <textarea
            className={`${INPUT_CLS} resize-none`}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Visibility</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
              <input
                type="radio"
                name={`edit-vis-${tracker._id}`}
                checked={visibility === 'public'}
                onChange={() => setVisibility('public')}
                className="accent-primary"
              />
              <Eye className="h-3 w-3 text-muted-foreground" />
              Public
            </label>
            <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
              <input
                type="radio"
                name={`edit-vis-${tracker._id}`}
                checked={visibility === 'dm-only'}
                onChange={() => setVisibility('dm-only')}
                className="accent-primary"
              />
              <EyeOff className="h-3 w-3 text-muted-foreground" />
              GM Only
            </label>
          </div>
        </div>
      </>
    );
  }

  function renderThresholdRows() {
    return (
      <>
        {thresholds.map((t, i) => (
          <ThresholdRow
            key={i}
            threshold={t}
            onChange={(updated) => updateThreshold(i, updated)}
            onRemove={() => removeThresholdRow(i)}
          />
        ))}
      </>
    );
  }

  function renderThresholdsSection() {
    return (
      <div>
        <label className={LABEL_CLS}>Thresholds</label>
        <div className="space-y-2">
          {renderThresholdRows()}
          <button
            type="button"
            onClick={() =>
              setThresholds((prev) => [
                ...prev,
                { value: 0, label: '', effect: undefined },
              ])
            }
            className="flex items-center gap-1 text-xs text-brass hover:text-gold transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Threshold
          </button>
        </div>
      </div>
    );
  }

  function renderActions() {
    return (
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={updateTracker.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateTracker.isPending || !name.trim()}
          >
            {updateTracker.isPending && (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            )}
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      {renderNameAndVisibility()}
      {renderThresholdsSection()}
      {renderActions()}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Tracker"
        description={`Are you sure you want to delete "${tracker.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={removeTracker.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tracker card                                                       */
/* ------------------------------------------------------------------ */

interface TrackerCardProps {
  campaignId: string;
  tracker: WorldStateTracker;
  isDM: boolean;
}

function TrackerCard({ campaignId, tracker, isDM }: TrackerCardProps) {
  const adjustTracker = useAdjustTracker();
  const updateTracker = useUpdateTracker();

  const [editing, setEditing] = useState(false);
  const [stepSize, setStepSize] = useState(1);
  const [directValue, setDirectValue] = useState(String(tracker.value));

  const active = activeThreshold(tracker.thresholds, tracker.value);
  const range = tracker.max - tracker.min || 1;
  const pct = ((tracker.value - tracker.min) / range) * 100;

  function handleAdjust(delta: number) {
    adjustTracker.mutate(
      { campaignId, trackerId: tracker._id, delta },
      { onError: () => toast.error('Failed to adjust tracker') },
    );
  }

  function handleDirectValue() {
    const num = Number(directValue);
    if (isNaN(num)) return;
    const clamped = clamp(num, tracker.min, tracker.max);
    updateTracker.mutate(
      { campaignId, trackerId: tracker._id, data: { value: clamped } },
      {
        onSuccess: () => setDirectValue(String(clamped)),
        onError: () => toast.error('Failed to set value'),
      },
    );
  }

  function renderHeader() {
    return (
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-[Cinzel] text-sm font-semibold text-foreground truncate">
              {tracker.name}
            </h3>
            {renderVisibilityBadge()}
          </div>
          {tracker.description && (
            <p className="mt-0.5 text-xs text-muted-foreground font-['IM_Fell_English'] italic line-clamp-2">
              {tracker.description}
            </p>
          )}
        </div>
        {isDM && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
            title="Edit tracker"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  function renderVisibilityBadge() {
    if (tracker.visibility === 'dm-only') {
      return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          <EyeOff className="h-2.5 w-2.5" />
          GM Only
        </span>
      );
    }
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
        <Eye className="h-2.5 w-2.5" />
        Public
      </span>
    );
  }

  function renderProgressSection() {
    return (
      <div className="mt-3">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-lg font-[Cinzel] font-bold text-foreground">
            {tracker.value}
          </span>
          <span className="text-xs text-muted-foreground">
            {tracker.min} &ndash; {tracker.max}
          </span>
        </div>
        <ProgressBar
          value={tracker.value}
          min={tracker.min}
          max={tracker.max}
          thresholds={tracker.thresholds}
        />
      </div>
    );
  }

  function renderActiveThreshold() {
    if (!active) return null;
    return (
      <div className="mt-2">
        <span
          className={`font-[Cinzel] text-xs font-semibold uppercase tracking-wider ${
            pct > 75
              ? 'text-[hsl(150,50%,55%)]'
              : pct >= 25
                ? 'text-gold'
                : 'text-blood'
          }`}
        >
          {active.label}
        </span>
        {active.effect && (
          <p className="mt-0.5 text-[11px] text-muted-foreground font-['IM_Fell_English'] italic">
            {active.effect}
          </p>
        )}
      </div>
    );
  }

  function renderStepSelector() {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground mr-1">Step:</span>
        {[1, 5, 10].map((s) => (
          <button
            key={s}
            onClick={() => setStepSize(s)}
            className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
              stepSize === s
                ? 'bg-primary/20 text-gold font-semibold'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    );
  }

  function renderDMControls() {
    if (!isDM) return null;
    return (
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleAdjust(-stepSize)}
            disabled={adjustTracker.isPending}
            className="rounded border border-border bg-muted p-1 text-foreground hover:bg-accent/60 transition-colors disabled:opacity-50"
            title={`Decrease by ${stepSize}`}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleAdjust(stepSize)}
            disabled={adjustTracker.isPending}
            className="rounded border border-border bg-muted p-1 text-foreground hover:bg-accent/60 transition-colors disabled:opacity-50"
            title={`Increase by ${stepSize}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {renderStepSelector()}
        <div className="ml-auto flex items-center gap-1">
          <input
            type="number"
            className="w-16 rounded-sm border border-border bg-[hsl(24,15%,10%)] px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/40 transition-colors"
            value={directValue}
            min={tracker.min}
            max={tracker.max}
            onChange={(e) => setDirectValue(e.target.value)}
            onBlur={handleDirectValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleDirectValue();
            }}
          />
          <span className="text-[10px] text-muted-foreground">set</span>
        </div>
      </div>
    );
  }

  function renderCardBody() {
    return (
      <>
        {renderHeader()}
        {renderProgressSection()}
        {renderActiveThreshold()}
        {renderDMControls()}
      </>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {renderCardBody()}
      {editing && (
        <EditTrackerInline
          campaignId={campaignId}
          tracker={tracker}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ isDM }: { isDM: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Activity className="mb-3 h-10 w-10 text-muted-foreground/40" />
      <p className="font-[Cinzel] text-sm font-medium text-muted-foreground">
        No world state trackers yet
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70 font-['IM_Fell_English'] italic">
        {isDM
          ? 'Create a tracker to monitor campaign-wide metrics'
          : 'No public trackers available'}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main panel                                                         */
/* ------------------------------------------------------------------ */

export function TrackersPanel({ campaignId, isDM }: TrackersPanelProps) {
  const { data: trackers, isLoading, isError, refetch } = useTrackers(campaignId);
  const [showCreate, setShowCreate] = useState(false);

  const visibleTrackers = useMemo(() => {
    if (!trackers) return [];
    if (isDM) return trackers;
    return trackers.filter((t) => t.visibility === 'public');
  }, [trackers, isDM]);

  if (isLoading) {
    return <LoadingSpinner message="Loading trackers..." />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Failed to load trackers"
        message="Could not retrieve world state data."
        onRetry={refetch}
      />
    );
  }

  function renderHeader() {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gold" />
          <h2 className="font-[Cinzel] text-sm font-semibold uppercase tracking-wider text-foreground">
            World State
          </h2>
        </div>
        {isDM && !showCreate && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3 w-3" />
            New Tracker
          </Button>
        )}
      </div>
    );
  }

  function renderTrackerList() {
    if (visibleTrackers.length === 0) {
      return <EmptyState isDM={isDM} />;
    }
    return (
      <div className="space-y-3">
        {visibleTrackers.map((t) => (
          <TrackerCard
            key={t._id}
            campaignId={campaignId}
            tracker={t}
            isDM={isDM}
          />
        ))}
      </div>
    );
  }

  function renderBody() {
    return (
      <>
        {showCreate && (
          <CreateTrackerForm
            campaignId={campaignId}
            onClose={() => setShowCreate(false)}
          />
        )}
        {renderTrackerList()}
      </>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {renderHeader()}
      {renderBody()}
    </div>
  );
}
