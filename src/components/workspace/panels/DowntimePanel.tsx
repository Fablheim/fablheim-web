import { useState } from 'react';
import {
  Coffee,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  CircleDot,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import {
  useDowntimeActivities,
  useCreateDowntime,
  useUpdateDowntime,
  useDeleteDowntime,
} from '@/hooks/useDowntime';
import { useCharacters } from '@/hooks/useCharacters';
import type { DowntimeActivity, ActivityType, ActivityStatus } from '@/types/downtime';

interface DowntimePanelProps {
  campaignId: string;
}

const INPUT_CLS =
  'w-full rounded-sm border border-border bg-[hsl(24,15%,10%)] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40 transition-colors';
const LABEL_CLS = 'block text-xs font-medium text-muted-foreground mb-1';

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  crafting: 'Crafting',
  training: 'Training',
  carousing: 'Carousing',
  research: 'Research',
  working: 'Working',
  recuperating: 'Recuperating',
  other: 'Other',
};

const STATUS_CONFIG: Record<ActivityStatus, { label: string; color: string; icon: typeof Clock }> = {
  planned: { label: 'Planned', color: 'text-muted-foreground', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-amber-400', icon: CircleDot },
  completed: { label: 'Completed', color: 'text-emerald-400', icon: CheckCircle2 },
};

export function DowntimePanel({ campaignId }: DowntimePanelProps) {
  const { data: activities, isLoading, error } = useDowntimeActivities(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ActivityStatus | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load downtime activities" />;

  const all = activities ?? [];
  const filtered = filterStatus ? all.filter((a) => a.status === filterStatus) : all;
  const charMap = new Map((characters ?? []).map((c) => [c._id, c.name]));

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {renderHeader()}
      <div className="flex-1 space-y-3 p-4">
        {renderStatusFilter()}
        {renderSummary(all)}
        {renderActivityList(filtered, charMap)}
        {showCreate && (
          <CreateDowntimeForm
            campaignId={campaignId}
            characters={characters ?? []}
            onClose={() => setShowCreate(false)}
          />
        )}
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center justify-between border-b border-[hsla(38,30%,25%,0.2)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Coffee className="h-4 w-4 text-primary/70" />
          <h2 className="font-['IM_Fell_English'] text-base font-semibold text-foreground">
            Downtime
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-3 w-3" />
          New Activity
        </Button>
      </div>
    );
  }

  function renderStatusFilter() {
    return (
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setFilterStatus(null)}
          className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
            filterStatus === null
              ? 'bg-primary/20 text-primary'
              : 'bg-[hsl(24,15%,12%)] text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({all.length})
        </button>
        {(Object.keys(STATUS_CONFIG) as ActivityStatus[]).map((status) => {
          const count = all.filter((a) => a.status === status).length;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status === filterStatus ? null : status)}
              className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                filterStatus === status
                  ? 'bg-primary/20 text-primary'
                  : 'bg-[hsl(24,15%,12%)] text-muted-foreground hover:text-foreground'
              }`}
            >
              {STATUS_CONFIG[status].label} ({count})
            </button>
          );
        })}
      </div>
    );
  }

  function renderSummary(acts: DowntimeActivity[]) {
    if (acts.length === 0) return null;

    const totalDays = acts.reduce((sum, a) => sum + a.durationDays, 0);
    const totalCost = acts.reduce((sum, a) => sum + a.cost, 0);

    return (
      <div className="flex gap-3">
        <div className="rounded border border-border/30 bg-[hsl(24,15%,11%)] px-3 py-1.5 text-center">
          <p className="text-[10px] text-muted-foreground/60">Activities</p>
          <p className="text-sm font-medium text-foreground">{acts.length}</p>
        </div>
        <div className="rounded border border-border/30 bg-[hsl(24,15%,11%)] px-3 py-1.5 text-center">
          <p className="text-[10px] text-muted-foreground/60">Total Days</p>
          <p className="text-sm font-medium text-foreground">{totalDays}</p>
        </div>
        {totalCost > 0 && (
          <div className="rounded border border-border/30 bg-[hsl(24,15%,11%)] px-3 py-1.5 text-center">
            <p className="text-[10px] text-muted-foreground/60">Total Cost</p>
            <p className="text-sm font-medium text-foreground">{totalCost} gp</p>
          </div>
        )}
      </div>
    );
  }

  function renderActivityList(acts: DowntimeActivity[], chars: Map<string, string>) {
    if (acts.length === 0) {
      return (
        <p className="text-center text-xs italic text-muted-foreground/60">
          No downtime activities yet
        </p>
      );
    }

    return (
      <div className="space-y-1">
        {acts.map((activity) => (
          <ActivityCard
            key={activity._id}
            activity={activity}
            characterName={chars.get(activity.characterId) ?? 'Unknown'}
            campaignId={campaignId}
          />
        ))}
      </div>
    );
  }
}

/* ── Activity Card ───────────────────────────────────────────── */

function ActivityCard({
  activity,
  characterName,
  campaignId,
}: {
  activity: DowntimeActivity;
  characterName: string;
  campaignId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const updateDowntime = useUpdateDowntime();
  const deleteDowntime = useDeleteDowntime();

  const statusCfg = STATUS_CONFIG[activity.status];
  const StatusIcon = statusCfg.icon;

  function cycleStatus() {
    const order: ActivityStatus[] = ['planned', 'in_progress', 'completed'];
    const idx = order.indexOf(activity.status);
    const next = order[(idx + 1) % order.length];

    updateDowntime.mutate(
      { campaignId, activityId: activity._id, data: { status: next } },
      { onError: () => toast.error('Failed to update status') },
    );
  }

  return (
    <div className="rounded border border-border/40 bg-[hsl(24,15%,11%)]">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground/50 hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>

        <button
          type="button"
          onClick={cycleStatus}
          className={`shrink-0 ${statusCfg.color} transition-colors hover:opacity-80`}
          title={`Status: ${statusCfg.label} (click to cycle)`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">{activity.name}</span>
            <span className="rounded bg-[hsl(24,15%,14%)] px-1.5 py-0.5 text-[9px] text-muted-foreground">
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            {characterName} · {activity.durationDays}d
            {activity.cost > 0 ? ` · ${activity.cost} gp` : ''}
          </p>
        </div>

        <button
          type="button"
          className="shrink-0 text-muted-foreground/40 transition-colors hover:text-blood"
          disabled={deleteDowntime.isPending}
          onClick={() =>
            deleteDowntime.mutate(
              { campaignId, activityId: activity._id },
              {
                onSuccess: () => toast.success('Activity deleted'),
                onError: () => toast.error('Failed to delete'),
              },
            )
          }
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {expanded && renderExpanded()}
    </div>
  );

  function renderExpanded() {
    return (
      <div className="space-y-1.5 border-t border-border/20 px-3 py-2 text-[10px]">
        {activity.description && (
          <div>
            <span className="text-muted-foreground/50">Description: </span>
            <span className="text-muted-foreground">{activity.description}</span>
          </div>
        )}
        {activity.materials && (
          <div>
            <span className="text-muted-foreground/50">Materials: </span>
            <span className="text-muted-foreground">{activity.materials}</span>
          </div>
        )}
        {activity.outcome && (
          <div>
            <span className="text-muted-foreground/50">Outcome: </span>
            <span className="text-foreground">{activity.outcome}</span>
          </div>
        )}
        <OutcomeInput activity={activity} campaignId={campaignId} />
      </div>
    );
  }
}

/* ── Inline Outcome Input ────────────────────────────────────── */

function OutcomeInput({
  activity,
  campaignId,
}: {
  activity: DowntimeActivity;
  campaignId: string;
}) {
  const [outcome, setOutcome] = useState(activity.outcome);
  const updateDowntime = useUpdateDowntime();

  if (activity.outcome) return null;

  return (
    <div className="flex gap-1">
      <input
        className={`${INPUT_CLS} flex-1`}
        placeholder="Record outcome..."
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={!outcome.trim() || updateDowntime.isPending}
        onClick={() =>
          updateDowntime.mutate(
            {
              campaignId,
              activityId: activity._id,
              data: { outcome: outcome.trim(), status: 'completed' },
            },
            {
              onSuccess: () => toast.success('Outcome recorded'),
              onError: () => toast.error('Failed to save outcome'),
            },
          )
        }
      >
        Save
      </Button>
    </div>
  );
}

/* ── Create Form ─────────────────────────────────────────────── */

function CreateDowntimeForm({
  campaignId,
  characters,
  onClose,
}: {
  campaignId: string;
  characters: Array<{ _id: string; name: string }>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [characterId, setCharacterId] = useState(characters[0]?._id ?? '');
  const [type, setType] = useState<ActivityType>('other');
  const [durationDays, setDurationDays] = useState(1);
  const [cost, setCost] = useState(0);
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState('');
  const createDowntime = useCreateDowntime();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !characterId) return;

    createDowntime.mutate(
      {
        campaignId,
        data: {
          characterId,
          name: name.trim(),
          type,
          durationDays,
          cost: cost || undefined,
          description: description.trim() || undefined,
          materials: materials.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Downtime activity created');
          onClose();
        },
        onError: () => toast.error('Failed to create activity'),
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded border border-border/40 bg-[hsl(24,15%,11%)] p-3"
    >
      <p className="text-xs font-medium text-muted-foreground">New Downtime Activity</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={LABEL_CLS}>Character</label>
          <select
            className={INPUT_CLS}
            value={characterId}
            onChange={(e) => setCharacterId(e.target.value)}
          >
            {characters.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Type</label>
          <select
            className={INPUT_CLS}
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
          >
            {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <input
        className={INPUT_CLS}
        placeholder="Activity name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={LABEL_CLS}>Duration (days)</label>
          <input
            type="number"
            className={INPUT_CLS}
            min={1}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Cost (gp)</label>
          <input
            type="number"
            className={INPUT_CLS}
            min={0}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
          />
        </div>
      </div>

      <input
        className={INPUT_CLS}
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        className={INPUT_CLS}
        placeholder="Materials needed (optional)"
        value={materials}
        onChange={(e) => setMaterials(e.target.value)}
      />

      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={createDowntime.isPending || !name.trim() || !characterId}
        >
          {createDowntime.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Create
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
