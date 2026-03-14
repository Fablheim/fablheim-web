import { useMemo, useState } from 'react';
import {
  Activity,
  Eye,
  EyeOff,
  Gauge,
  Minus,
  Plus,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAddTracker,
  useAdjustTracker,
  useRemoveTracker,
  useTrackers,
  useUpdateTracker,
} from '@/hooks/useCampaigns';
import type { TrackerThreshold, WorldStateTracker } from '@/types/campaign';

interface TrackersDeskV2Props {
  campaignId: string;
  isDM: boolean;
}

type ShelfFilter = 'all' | 'rising' | 'resolved' | 'public' | 'gm-only';

interface TrackerEditorState {
  name: string;
  description: string;
  value: string;
  min: string;
  max: string;
  visibility: 'public' | 'dm-only';
  thresholds: TrackerThreshold[];
}

const shellClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.68)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(20,24%,8%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]';
const fieldClass =
  'w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(24,18%,10%,0.92)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,10%,44%)] outline-none transition focus:border-[hsla(42,64%,58%,0.58)]';
const labelClass =
  'text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]';

export function TrackersDeskV2({ campaignId, isDM }: TrackersDeskV2Props) {
  const { data: trackers, isLoading, isError, refetch } = useTrackers(campaignId);
  const addTracker = useAddTracker();
  const updateTracker = useUpdateTracker();
  const adjustTracker = useAdjustTracker();
  const removeTracker = useRemoveTracker();

  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ShelfFilter>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editor, setEditor] = useState<TrackerEditorState>(() => createEmptyEditor());

  const visibleTrackers = useMemo(() => {
    const allTrackers = trackers ?? [];
    const normalizedQuery = query.trim().toLowerCase();

    return allTrackers
      .filter((tracker) => (isDM ? true : tracker.visibility === 'public'))
      .filter((tracker) => {
        if (!normalizedQuery) return true;
        return (
          tracker.name.toLowerCase().includes(normalizedQuery) ||
          (tracker.description ?? '').toLowerCase().includes(normalizedQuery) ||
          getActiveThreshold(tracker)?.label.toLowerCase().includes(normalizedQuery)
        );
      })
      .filter((tracker) => {
        if (filter === 'all') return true;
        if (filter === 'resolved') return tracker.value >= tracker.max;
        if (filter === 'rising') return tracker.value < tracker.max;
        if (filter === 'public') return tracker.visibility === 'public';
        if (filter === 'gm-only') return tracker.visibility === 'dm-only';
        return true;
      });
  }, [trackers, isDM, query, filter]);

  const allVisibleTrackers = useMemo(
    () => (trackers ?? []).filter((tracker) => (isDM ? true : tracker.visibility === 'public')),
    [trackers, isDM],
  );

  const selectedTracker = useMemo(
    () => allVisibleTrackers.find((tracker) => tracker._id === selectedTrackerId) ?? null,
    [allVisibleTrackers, selectedTrackerId],
  );

  const summary = useMemo(() => buildSummary(allVisibleTrackers), [allVisibleTrackers]);

  function openCreate() {
    setIsCreating(true);
    setSelectedTrackerId(null);
  }

  function openTracker(trackerId: string) {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedTrackerId(trackerId);
  }

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

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsla(42,48%,28%,0.12),transparent_32%),linear-gradient(180deg,hsl(224,18%,8%)_0%,hsl(20,20%,7%)_100%)] text-[hsl(38,24%,88%)]">
      <header className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(38,30%,60%)]">Campaign Pressure Board</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,42%,90%)]">Trackers</h2>
            <p className="mt-2 max-w-2xl text-xs text-[hsl(30,14%,62%)]">
              Keep the rising pressures, fragile balances, and looming changes of the campaign in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SummaryChip icon={Gauge} label="Rising" value={String(summary.rising)} />
            <SummaryChip icon={Sparkles} label="Thresholds" value={String(summary.withThresholds)} />
            <SummaryChip icon={Target} label="Resolved" value={String(summary.resolved)} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isDM && (
            <>
              <button
                type="button"
                onClick={openCreate}
                className="rounded-2xl border border-[hsla(42,54%,46%,0.48)] bg-[linear-gradient(180deg,hsla(40,72%,52%,0.26)_0%,hsla(36,68%,42%,0.18)_100%)] px-4 py-2 text-sm text-[hsl(40,82%,78%)] transition hover:border-[hsla(42,60%,60%,0.72)] hover:text-[hsl(42,90%,86%)]"
              >
                Create Tracker
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(1)}
                disabled={!selectedTracker || adjustTracker.isPending}
                className="rounded-2xl border border-[hsla(32,22%,28%,0.7)] bg-[hsla(24,18%,10%,0.88)] px-4 py-2 text-sm text-[hsl(38,24%,82%)] transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-[hsla(42,54%,46%,0.44)]"
              >
                Advance Tracker
              </button>
              <button
                type="button"
                onClick={handleResolve}
                disabled={!selectedTracker || updateTracker.isPending}
                className="rounded-2xl border border-[hsla(32,22%,28%,0.7)] bg-[hsla(24,18%,10%,0.88)] px-4 py-2 text-sm text-[hsl(38,24%,82%)] transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-[hsla(42,54%,46%,0.44)]"
              >
                Resolve Tracker
              </button>
            </>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">
        <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={`${shellClass} min-h-0 overflow-hidden`}>
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Tracker Library</p>
                    <h3 className="mt-1 font-[Cinzel] text-2xl text-[hsl(38,34%,88%)]">World State Shelf</h3>
                  </div>
                  <div className="rounded-full border border-[hsla(32,24%,26%,0.62)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[hsl(38,22%,70%)]">
                    {allVisibleTrackers.length} active records
                  </div>
                </div>
                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(30,12%,42%)]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search names, notes, thresholds..."
                    className={`${fieldClass} pl-9`}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    [
                      ['all', 'All'],
                      ['rising', 'Rising'],
                      ['resolved', 'Resolved'],
                      ['public', 'Public'],
                      ['gm-only', 'GM Only'],
                    ] as Array<[ShelfFilter, string]>
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] transition ${
                        filter === value
                          ? 'border-[hsla(42,64%,58%,0.62)] bg-[hsla(40,70%,52%,0.16)] text-[hsl(42,82%,78%)]'
                          : 'border-[hsla(32,24%,26%,0.62)] text-[hsl(30,12%,60%)] hover:border-[hsla(42,40%,46%,0.42)] hover:text-[hsl(38,24%,82%)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                {isLoading ? (
                  <EmptyMessage
                    title="Loading trackers"
                    body="Pulling the current campaign pressures into view."
                  />
                ) : isError ? (
                  <EmptyMessage
                    title="Trackers unavailable"
                    body="The world-state ledger could not be loaded right now."
                    actionLabel="Try again"
                    onAction={() => void refetch()}
                  />
                ) : visibleTrackers.length === 0 ? (
                  <EmptyMessage
                    title={allVisibleTrackers.length === 0 ? 'No trackers yet' : 'No trackers match this shelf'}
                    body={
                      allVisibleTrackers.length === 0
                        ? isDM
                          ? 'Create a tracker to follow pressure, suspicion, ritual progress, or any other living meter in the campaign.'
                          : 'There are no public trackers visible right now.'
                        : 'Try a different shelf or search term to bring another tracker forward.'
                    }
                    actionLabel={isDM && allVisibleTrackers.length === 0 ? 'Create tracker' : undefined}
                    onAction={isDM && allVisibleTrackers.length === 0 ? openCreate : undefined}
                  />
                ) : (
                  <div className="space-y-2">
                    {visibleTrackers.map((tracker) => {
                      const progress = getProgress(tracker);
                      const threshold = getActiveThreshold(tracker);
                      const selected = tracker._id === selectedTrackerId;

                      return (
                        <button
                          key={tracker._id}
                          type="button"
                          onClick={() => openTracker(tracker._id)}
                          className={`w-full rounded-[20px] border px-4 py-3 text-left transition ${
                            selected
                              ? 'border-[hsla(42,64%,58%,0.58)] bg-[linear-gradient(180deg,hsla(40,64%,52%,0.16)_0%,hsla(24,22%,12%,0.9)_100%)]'
                              : 'border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] hover:border-[hsla(42,42%,46%,0.38)] hover:bg-[hsla(22,20%,11%,0.9)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-[Cinzel] text-base text-[hsl(38,32%,88%)]">{tracker.name}</p>
                              <p className="mt-1 text-xs text-[hsl(30,12%,60%)]">
                                {threshold ? threshold.label : progress.statusLabel}
                              </p>
                            </div>
                            <div className="shrink-0 rounded-full border border-[hsla(32,24%,26%,0.6)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[hsl(38,24%,74%)]">
                              {tracker.value}/{tracker.max}
                            </div>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[hsla(24,14%,16%,0.9)]">
                            <div
                              className={`h-full rounded-full ${progress.fillClass}`}
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.18em] text-[hsl(30,12%,52%)]">
                            <span>{tracker.visibility === 'public' ? 'Public' : 'GM Only'}</span>
                            <span>{tracker.thresholds.length} thresholds</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>

          <section className={`${shellClass} min-h-0 overflow-y-auto`}>
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
                  const clampedValue = clamp(next, selectedTracker.min, selectedTracker.max);
                  updateTracker.mutate(
                    { campaignId, trackerId: selectedTracker._id, data: { value: clampedValue } },
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
          </section>
        </div>
      </div>
    </div>
  );
}

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
      <div className="border-b border-[hsla(32,24%,24%,0.4)] pb-4">
        <p className={labelClass}>Tracker Workspace</p>
        <h3 className="mt-2 font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">{title}</h3>
        <p className="mt-3 max-w-2xl text-sm text-[hsl(30,14%,66%)]">{subtitle}</p>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
            <p className={labelClass}>Core Record</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelClass}>Title</label>
                <input
                  value={editor.name}
                  onChange={(event) => onChange({ ...editor, name: event.target.value })}
                  placeholder="Silver Council Suspicion"
                  className={`${fieldClass} mt-2`}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Meaning</label>
                <textarea
                  value={editor.description}
                  onChange={(event) => onChange({ ...editor, description: event.target.value })}
                  rows={4}
                  placeholder="What pressure or fragile balance does this tracker represent in the campaign?"
                  className={`${fieldClass} mt-2 resize-none`}
                />
              </div>
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
              <div>
                <label className={labelClass}>Visibility</label>
                <select
                  value={editor.visibility}
                  onChange={(event) =>
                    onChange({
                      ...editor,
                      visibility: event.target.value as 'public' | 'dm-only',
                    })
                  }
                  className={`${fieldClass} mt-2`}
                >
                  <option value="public">Public</option>
                  <option value="dm-only">GM Only</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={labelClass}>Thresholds</p>
                <p className="mt-1 text-xs text-[hsl(30,12%,58%)]">
                  Call out the points where the world changes texture or the table should take notice.
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
            <div className="mt-4 space-y-3">
              {editor.thresholds.length > 0 ? (
                editor.thresholds.map((threshold, index) => (
                  <div
                    key={`${index}-${threshold.label}`}
                    className="rounded-[18px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,10%,0.8)] p-3"
                  >
                    <div className="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)]">
                      <div>
                        <label className={labelClass}>Value</label>
                        <input
                          value={String(threshold.value)}
                          onChange={(event) =>
                            onChange({
                              ...editor,
                              thresholds: editor.thresholds.map((entry, entryIndex) =>
                                entryIndex === index
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
                              thresholds: editor.thresholds.map((entry, entryIndex) =>
                                entryIndex === index ? { ...entry, label: event.target.value } : entry,
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
                              thresholds: editor.thresholds.map((entry, entryIndex) =>
                                entryIndex === index ? { ...entry, effect: event.target.value } : entry,
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
                            thresholds: editor.thresholds.filter((_, entryIndex) => entryIndex !== index),
                          })
                        }
                        className="rounded-2xl border border-[hsla(0,48%,38%,0.38)] px-3 py-2 text-sm text-[hsl(8,70%,76%)]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[hsl(30,12%,60%)]">
                  No thresholds yet. Add one if the meter should call out meaningful breakpoints.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
            <p className={labelClass}>Preview</p>
            <TrackerPreview editor={editor} />
          </section>

          <section className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
            <p className={labelClass}>Actions</p>
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
        </aside>
      </div>
    </div>
  );
}

function SelectedTrackerWorkspace({
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
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[hsla(32,24%,24%,0.4)] pb-4">
        <div>
          <p className={labelClass}>Selected Tracker</p>
          <h3 className="mt-2 font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">
            {tracker.name}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[hsl(30,12%,60%)]">
            <span className="rounded-full border border-[hsla(32,24%,26%,0.62)] px-3 py-1">Numeric meter</span>
            <span className="rounded-full border border-[hsla(32,24%,26%,0.62)] px-3 py-1">
              {tracker.value} / {tracker.max}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[hsla(32,24%,26%,0.62)] px-3 py-1">
              {tracker.visibility === 'public' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {tracker.visibility === 'public' ? 'Public' : 'GM Only'}
            </span>
          </div>
        </div>
        {isDM && !isEditing && (
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
        )}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_320px]">
        <div className="space-y-5">
          <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
            <p className={labelClass}>Pressure Gauge</p>
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
              <div className={`h-full rounded-full ${progress.fillClass}`} style={{ width: `${progress.percent}%` }} />
            </div>
            {threshold && (
              <div className="mt-4 rounded-[18px] border border-[hsla(42,40%,40%,0.26)] bg-[hsla(40,54%,18%,0.2)] px-4 py-3">
                <p className={labelClass}>Current Threshold</p>
                <p className="mt-2 font-[Cinzel] text-lg text-[hsl(42,82%,78%)]">{threshold.label}</p>
                {threshold.effect && <p className="mt-1 text-sm text-[hsl(30,14%,66%)]">{threshold.effect}</p>}
              </div>
            )}
          </div>

          <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
            <p className={labelClass}>Meaning</p>
            <p className="mt-3 text-sm leading-7 text-[hsl(30,14%,72%)]">
              {tracker.description?.trim()
                ? tracker.description
                : 'No note has been recorded for what this tracker represents yet.'}
            </p>
          </div>

          <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={labelClass}>Threshold Ledger</p>
                <p className="mt-1 text-xs text-[hsl(30,12%,58%)]">
                  These are the notable states the tracker calls out as it rises.
                </p>
              </div>
              <div className="rounded-full border border-[hsla(32,24%,24%,0.52)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[hsl(30,12%,58%)]">
                {tracker.thresholds.length} entries
              </div>
            </div>
            {tracker.thresholds.length > 0 ? (
              <div className="mt-4 space-y-3">
                {[...tracker.thresholds]
                  .sort((left, right) => left.value - right.value)
                  .map((entry) => (
                    <div
                      key={`${entry.value}-${entry.label}`}
                      className="rounded-[18px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,10%,0.8)] px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-[Cinzel] text-base text-[hsl(38,30%,86%)]">{entry.label}</p>
                        <span className="text-xs text-[hsl(42,72%,72%)]">{entry.value}</span>
                      </div>
                      {entry.effect && <p className="mt-2 text-sm text-[hsl(30,14%,68%)]">{entry.effect}</p>}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[hsl(30,12%,60%)]">
                No thresholds yet. This tracker currently behaves like a straight meter.
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
            <p className={labelClass}>Quick Shift</p>
            {isDM ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <QuickAdjustButton icon={Minus} label="-1" onClick={() => onAdjust(-1)} />
                  <QuickAdjustButton icon={Plus} label="+1" onClick={() => onAdjust(1)} />
                  <QuickAdjustButton label="-5" onClick={() => onAdjust(-5)} />
                  <QuickAdjustButton label="+5" onClick={() => onAdjust(5)} />
                </div>
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
                <button
                  type="button"
                  onClick={onResolve}
                  className="mt-4 w-full rounded-2xl border border-[hsla(42,54%,46%,0.34)] bg-[hsla(40,54%,18%,0.16)] px-4 py-2 text-sm text-[hsl(42,78%,80%)]"
                >
                  Push to maximum
                </button>
              </>
            ) : (
              <p className="mt-3 text-sm text-[hsl(30,12%,62%)]">
                Only the GM can shift world-state trackers.
              </p>
            )}
          </div>

          <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
            <p className={labelClass}>Tracker Notes</p>
            <div className="mt-3 space-y-3 text-sm text-[hsl(30,14%,68%)]">
              <p>This tracker is campaign-scoped and uses the built-in world-state meter model from the server.</p>
              <p>Thresholds are annotations only, so this surface highlights them narratively instead of treating them as separate rules logic.</p>
            </div>
          </div>
        </aside>
      </div>

      {isEditing && (
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
      )}
    </div>
  );
}

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
      <p className={labelClass}>Tracker Workspace</p>
      <h3 className="mt-2 font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">
        World State Overview
      </h3>
      <p className="mt-3 max-w-2xl text-sm text-[hsl(30,14%,66%)]">
        Pick a tracker from the shelf to inspect it closely, or open a new meter for an unfolding threat, fragile alliance, or slow-burning project.
      </p>

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

      <div className="mt-6 rounded-[24px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-5">
        <p className={labelClass}>How This Surface Maps To The Server</p>
        <div className="mt-4 space-y-3 text-sm leading-7 text-[hsl(30,14%,72%)]">
          <p>
            Trackers are currently stored as campaign-scoped world-state meters with a current value, bounds, thresholds, and visibility.
          </p>
          <p>
            That means this first v2 pass is strongest for suspicion, danger, ritual progress, repair progress, political pressure, and other numeric campaign states.
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
    </div>
  );
}

function TrackerPreview({ editor }: { editor: TrackerEditorState }) {
  const tracker = previewTrackerFromEditor(editor);
  const progress = getProgress(tracker);
  const threshold = getActiveThreshold(tracker);

  return (
    <div className="mt-4 rounded-[18px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,10%,0.8)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-[Cinzel] text-lg text-[hsl(38,34%,88%)]">{tracker.name}</p>
          <p className="mt-1 text-xs text-[hsl(30,12%,58%)]">{tracker.value} / {tracker.max}</p>
        </div>
        <div className="rounded-full border border-[hsla(32,24%,24%,0.52)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[hsl(38,24%,74%)]">
          {tracker.visibility === 'public' ? 'Public' : 'GM Only'}
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[hsla(24,14%,16%,0.9)]">
        <div className={`h-full rounded-full ${progress.fillClass}`} style={{ width: `${progress.percent}%` }} />
      </div>
      <p className="mt-3 text-sm text-[hsl(30,14%,70%)]">{threshold?.label ?? progress.statusLabel}</p>
    </div>
  );
}

function SummaryChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[hsla(32,24%,24%,0.58)] bg-[hsla(24,18%,10%,0.72)] px-3 py-1.5">
      <Icon className="h-3.5 w-3.5 text-[hsl(42,72%,72%)]" />
      <span className="text-[10px] uppercase tracking-[0.18em] text-[hsl(30,12%,58%)]">{label}</span>
      <span className="font-[Cinzel] text-sm text-[hsl(38,34%,88%)]">{value}</span>
    </div>
  );
}

function OverviewCard({ title, value, body }: { title: string; value: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
      <p className={labelClass}>{title}</p>
      <p className="mt-3 font-[Cinzel] text-4xl text-[hsl(38,40%,90%)]">{value}</p>
      <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,68%)]">{body}</p>
    </div>
  );
}

function EmptyMessage({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <Activity className="h-10 w-10 text-[hsl(30,10%,30%)]" />
      <p className="mt-4 font-[Cinzel] text-lg text-[hsl(38,32%,86%)]">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-7 text-[hsl(30,12%,60%)]">{body}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-2xl border border-[hsla(42,54%,46%,0.48)] px-4 py-2 text-sm text-[hsl(42,82%,78%)]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

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

function buildSummary(trackers: WorldStateTracker[]) {
  return {
    rising: trackers.filter((tracker) => tracker.value < tracker.max).length,
    resolved: trackers.filter((tracker) => tracker.value >= tracker.max).length,
    withThresholds: trackers.filter((tracker) => tracker.thresholds.length > 0).length,
  };
}

function getActiveThreshold(tracker: WorldStateTracker) {
  return [...tracker.thresholds]
    .filter((threshold) => threshold.value <= tracker.value)
    .sort((left, right) => right.value - left.value)[0];
}

function getProgress(tracker: WorldStateTracker) {
  const total = Math.max(1, tracker.max - tracker.min);
  const percent = Math.max(0, Math.min(100, ((tracker.value - tracker.min) / total) * 100));

  if (percent >= 100) {
    return {
      percent,
      statusLabel: 'At maximum',
      fillClass: 'bg-[linear-gradient(90deg,hsla(145,48%,52%,0.94)_0%,hsla(132,42%,40%,0.9)_100%)]',
    };
  }
  if (percent >= 70) {
    return {
      percent,
      statusLabel: 'Escalating',
      fillClass: 'bg-[linear-gradient(90deg,hsla(42,82%,60%,0.96)_0%,hsla(35,74%,48%,0.94)_100%)]',
    };
  }
  if (percent >= 35) {
    return {
      percent,
      statusLabel: 'Active',
      fillClass: 'bg-[linear-gradient(90deg,hsla(42,72%,58%,0.9)_0%,hsla(28,70%,42%,0.9)_100%)]',
    };
  }
  return {
    percent: Math.max(4, percent),
    statusLabel: 'Low pressure',
    fillClass: 'bg-[linear-gradient(90deg,hsla(210,42%,62%,0.82)_0%,hsla(192,38%,46%,0.76)_100%)]',
  };
}

function createEmptyEditor(): TrackerEditorState {
  return {
    name: '',
    description: '',
    value: '0',
    min: '0',
    max: '8',
    visibility: 'dm-only',
    thresholds: [],
  };
}

function createEditorFromTracker(tracker: WorldStateTracker): TrackerEditorState {
  return {
    name: tracker.name,
    description: tracker.description ?? '',
    value: String(tracker.value),
    min: String(tracker.min),
    max: String(tracker.max),
    visibility: tracker.visibility,
    thresholds: tracker.thresholds.map((threshold) => ({ ...threshold })),
  };
}

function previewTrackerFromEditor(editor: TrackerEditorState): WorldStateTracker {
  const min = Number.parseInt(editor.min, 10) || 0;
  const max = Math.max(min + 1, Number.parseInt(editor.max, 10) || min + 1);
  const value = clamp(Number.parseInt(editor.value, 10) || min, min, max);

  return {
    _id: 'preview',
    name: editor.name.trim() || 'New tracker',
    description: editor.description.trim(),
    value,
    min,
    max,
    thresholds: editor.thresholds,
    visibility: editor.visibility,
  };
}

function buildTrackerPayload(editor: TrackerEditorState) {
  const name = editor.name.trim();
  if (!name) {
    toast.error('Tracker title is required');
    return null;
  }

  const min = Number.parseInt(editor.min, 10);
  const max = Number.parseInt(editor.max, 10);
  const value = Number.parseInt(editor.value, 10);

  if (Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(value)) {
    toast.error('Tracker bounds and value must be numbers');
    return null;
  }

  if (min >= max) {
    toast.error('Maximum must be greater than minimum');
    return null;
  }

  return {
    name,
    description: editor.description.trim() || undefined,
    min,
    max,
    value: clamp(value, min, max),
    visibility: editor.visibility,
    thresholds: editor.thresholds
      .map((threshold) => ({
        value: Number.isFinite(threshold.value) ? threshold.value : 0,
        label: threshold.label.trim(),
        effect: threshold.effect?.trim() || undefined,
      }))
      .filter((threshold) => threshold.label),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
