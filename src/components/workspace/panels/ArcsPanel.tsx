import { useState } from 'react';
import {
  Flag,
  Plus,

  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import {
  useArcs,
  useAddArc,
  useUpdateArc,
  useRemoveArc,
  useAddArcMilestone,
  useToggleArcMilestone,
} from '@/hooks/useCampaigns';
import type { CampaignArc, ArcStatus } from '@/types/campaign';

interface ArcsPanelProps {
  campaignId: string;
  isDM: boolean;
}

const STATUS_ORDER: Record<ArcStatus, number> = {
  active: 0,
  upcoming: 1,
  completed: 2,
};

const STATUS_BADGE: Record<ArcStatus, { label: string; cls: string }> = {
  upcoming: { label: 'Upcoming', cls: 'bg-muted/40 text-muted-foreground' },
  active: { label: 'Active', cls: 'bg-gold/15 text-gold' },
  completed: { label: 'Completed', cls: 'bg-[hsl(150,50%,55%)]/15 text-[hsl(150,50%,55%)]' },
};

// ── Main Panel ─────────────────────────────────────────────

export function ArcsPanel({ campaignId, isDM }: ArcsPanelProps) {
  const { data: arcs, isLoading, isError, refetch } = useArcs(campaignId);
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (isLoading) {
    return <LoadingSpinner message="Loading story arcs..." />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Failed to load arcs"
        message="Could not retrieve story arcs for this campaign."
        onRetry={refetch}
      />
    );
  }

  const sorted = [...(arcs ?? [])].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.sortOrder - b.sortOrder;
  });

  return (
    <div className="flex h-full flex-col">
      {renderHeader(isDM, showCreateForm, setShowCreateForm)}
      {renderBody(sorted, showCreateForm, setShowCreateForm, campaignId, isDM)}
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────

function renderHeader(
  isDM: boolean,
  showCreateForm: boolean,
  setShowCreateForm: (v: boolean) => void,
) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-2">
        <Flag className="h-4 w-4 text-gold" />
        <h2 className="font-[Cinzel] text-sm font-semibold uppercase tracking-wider text-foreground">
          Story Arcs
        </h2>
      </div>
      {isDM && !showCreateForm && (
        <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-1 h-3 w-3" />
          New Arc
        </Button>
      )}
    </div>
  );
}

// ── Body ───────────────────────────────────────────────────

function renderBody(
  sorted: CampaignArc[],
  showCreateForm: boolean,
  setShowCreateForm: (v: boolean) => void,
  campaignId: string,
  isDM: boolean,
) {
  if (sorted.length === 0 && !showCreateForm) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <Flag className="h-10 w-10 text-muted-foreground/30" />
        <p className="font-[Cinzel] text-sm font-medium text-muted-foreground/60">
          No story arcs yet
        </p>
        <p className="text-xs text-muted-foreground/40 font-['IM_Fell_English']">
          Create your first arc to track campaign storylines
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {showCreateForm && (
        <CreateArcForm
          campaignId={campaignId}
          onClose={() => setShowCreateForm(false)}
        />
      )}
      <div className="divide-y divide-border/30">
        {sorted.map((arc) => (
          <ArcCard key={arc._id} arc={arc} campaignId={campaignId} isDM={isDM} />
        ))}
      </div>
    </div>
  );
}

// ── Create Arc Form ────────────────────────────────────────

function CreateArcForm({
  campaignId,
  onClose,
}: {
  campaignId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ArcStatus>('upcoming');
  const [milestonesText, setMilestonesText] = useState('');
  const addArc = useAddArc();

  const inputCls =
    'w-full rounded-sm border border-border bg-[hsl(24,15%,10%)] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40 transition-colors';
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1';

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Arc name is required');
      return;
    }

    const milestones = milestonesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((description) => ({ description, completed: false }));

    addArc.mutate(
      {
        campaignId,
        data: {
          name: trimmed,
          description: description.trim() || undefined,
          status,
          milestones: milestones.length > 0 ? milestones : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Arc created');
          onClose();
        },
        onError: () => toast.error('Failed to create arc'),
      },
    );
  }

  return (
    <div className="border-b border-border bg-card/50 p-4">
      <div className="space-y-3">
        {renderCreateFormFields(name, setName, description, setDescription, inputCls, labelCls)}
        {renderCreateFormExtra(status, setStatus, milestonesText, setMilestonesText, inputCls, labelCls)}
        {renderCreateFormActions(handleSubmit, onClose, addArc.isPending)}
      </div>
    </div>
  );
}

function renderCreateFormFields(
  name: string,
  setName: (v: string) => void,
  description: string,
  setDescription: (v: string) => void,
  inputCls: string,
  labelCls: string,
) {
  return (
    <>
      <div>
        <label className={labelCls}>Name</label>
        <input
          className={inputCls}
          placeholder="Arc name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          placeholder="Describe this story arc..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </>
  );
}

function renderCreateFormExtra(
  status: ArcStatus,
  setStatus: (v: ArcStatus) => void,
  milestonesText: string,
  setMilestonesText: (v: string) => void,
  inputCls: string,
  labelCls: string,
) {
  return (
    <>
      <div>
        <label className={labelCls}>Status</label>
        <select
          className={inputCls}
          value={status}
          onChange={(e) => setStatus(e.target.value as ArcStatus)}
        >
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Initial Milestones (one per line)</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          placeholder={"Discover the ancient ruins\nDefeat the guardian\nClaim the artifact"}
          value={milestonesText}
          onChange={(e) => setMilestonesText(e.target.value)}
        />
      </div>
    </>
  );
}

function renderCreateFormActions(
  handleSubmit: () => void,
  onClose: () => void,
  isPending: boolean,
) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
        Cancel
      </Button>
      <Button size="sm" onClick={handleSubmit} disabled={isPending}>
        {isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
        Create
      </Button>
    </div>
  );
}

// ── Arc Card ───────────────────────────────────────────────

function ArcCard({
  arc,
  campaignId,
  isDM,
}: {
  arc: CampaignArc;
  campaignId: string;
  isDM: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const completedCount = arc.milestones.filter((m) => m.completed).length;
  const totalCount = arc.milestones.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const badge = STATUS_BADGE[arc.status];

  return (
    <div className="bg-card/30">
      {renderArcCardHeader(expanded, setExpanded, arc, badge, completedCount, totalCount, progressPct)}
      {expanded && (
        <ArcCardDetail arc={arc} campaignId={campaignId} isDM={isDM} />
      )}
    </div>
  );
}

function renderArcCardHeader(
  expanded: boolean,
  setExpanded: (v: boolean) => void,
  arc: CampaignArc,
  badge: { label: string; cls: string },
  completedCount: number,
  totalCount: number,
  progressPct: number,
) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/20"
      onClick={() => setExpanded(!expanded)}
    >
      {expanded ? (
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}
      {renderArcCardHeaderContent(arc, badge, completedCount, totalCount, progressPct)}
    </button>
  );
}

function renderArcCardHeaderContent(
  arc: CampaignArc,
  badge: { label: string; cls: string },
  completedCount: number,
  totalCount: number,
  progressPct: number,
) {
  return (
    <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${badge.cls}`}>
          {badge.label}
        </span>
        <span className="truncate font-[Cinzel] text-xs font-semibold text-foreground">
          {arc.name}
        </span>
      </div>
      {totalCount > 0 && renderMilestoneProgress(completedCount, totalCount, progressPct)}
    </div>
  );
}

function renderMilestoneProgress(
  completedCount: number,
  totalCount: number,
  progressPct: number,
) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-[10px] text-muted-foreground/60">
        {completedCount} of {totalCount}
      </span>
      <div className="h-1 w-12 overflow-hidden rounded-full bg-muted/30">
        <div
          className="h-full rounded-full bg-gold/60 transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

// ── Arc Card Detail ────────────────────────────────────────

function ArcCardDetail({
  arc,
  campaignId,
  isDM,
}: {
  arc: CampaignArc;
  campaignId: string;
  isDM: boolean;
}) {
  const updateArc = useUpdateArc();
  const removeArc = useRemoveArc();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingDesc, setEditingDesc] = useState(arc.description ?? '');

  function handleDescriptionBlur() {
    const trimmed = editingDesc.trim();
    if (trimmed === (arc.description ?? '').trim()) return;
    updateArc.mutate(
      { campaignId, arcId: arc._id, data: { description: trimmed || undefined } },
      { onError: () => toast.error('Failed to update description') },
    );
  }

  function handleStatusChange(newStatus: ArcStatus) {
    updateArc.mutate(
      { campaignId, arcId: arc._id, data: { status: newStatus } },
      {
        onSuccess: () => toast.success(`Arc marked as ${newStatus}`),
        onError: () => toast.error('Failed to update status'),
      },
    );
  }

  function handleDelete() {
    removeArc.mutate(
      { campaignId, arcId: arc._id },
      {
        onSuccess: () => {
          toast.success('Arc deleted');
          setConfirmDelete(false);
        },
        onError: () => toast.error('Failed to delete arc'),
      },
    );
  }

  const inputCls =
    'w-full rounded-sm border border-border bg-[hsl(24,15%,10%)] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40 transition-colors';
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1';

  return (
    <div className="border-t border-border/20 px-4 pb-4 pt-2">
      {renderDetailDescription(isDM, editingDesc, setEditingDesc, handleDescriptionBlur, arc, inputCls, labelCls)}
      {renderDetailStatusAndMilestones(isDM, arc, campaignId, handleStatusChange, inputCls, labelCls)}
      {renderDetailActions(isDM, setConfirmDelete, confirmDelete, handleDelete, removeArc.isPending)}
    </div>
  );
}

function renderDetailDescription(
  isDM: boolean,
  editingDesc: string,
  setEditingDesc: (v: string) => void,
  handleDescriptionBlur: () => void,
  arc: CampaignArc,
  inputCls: string,
  labelCls: string,
) {
  return (
    <div className="mb-3">
      <label className={labelCls}>Description</label>
      {isDM ? (
        <textarea
          className={`${inputCls} resize-none font-['IM_Fell_English']`}
          rows={3}
          placeholder="Describe this story arc..."
          value={editingDesc}
          onChange={(e) => setEditingDesc(e.target.value)}
          onBlur={handleDescriptionBlur}
        />
      ) : (
        <p className="text-xs text-muted-foreground font-['IM_Fell_English'] italic min-h-[2rem]">
          {arc.description || 'No description.'}
        </p>
      )}
    </div>
  );
}

function renderDetailStatusAndMilestones(
  isDM: boolean,
  arc: CampaignArc,
  campaignId: string,
  handleStatusChange: (s: ArcStatus) => void,
  inputCls: string,
  labelCls: string,
) {
  return (
    <>
      {isDM && (
        <div className="mb-3">
          <label className={labelCls}>Status</label>
          <select
            className={inputCls}
            value={arc.status}
            onChange={(e) => handleStatusChange(e.target.value as ArcStatus)}
          >
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}
      <MilestonesList arc={arc} campaignId={campaignId} isDM={isDM} />
    </>
  );
}

function renderDetailActions(
  isDM: boolean,
  setConfirmDelete: (v: boolean) => void,
  confirmDelete: boolean,
  handleDelete: () => void,
  isPending: boolean,
) {
  if (!isDM) return null;

  return (
    <>
      <div className="mt-4 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-blood hover:text-blood/80"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Delete Arc
        </Button>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Arc"
        description="This will permanently remove this story arc and all its milestones. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isPending={isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

// ── Milestones List ────────────────────────────────────────

function MilestonesList({
  arc,
  campaignId,
  isDM,
}: {
  arc: CampaignArc;
  campaignId: string;
  isDM: boolean;
}) {
  const toggleMilestone = useToggleArcMilestone();
  const addMilestone = useAddArcMilestone();
  const [newMilestone, setNewMilestone] = useState('');

  function handleToggle(milestoneId: string) {
    toggleMilestone.mutate(
      { campaignId, arcId: arc._id, milestoneId },
      { onError: () => toast.error('Failed to toggle milestone') },
    );
  }

  function handleAddMilestone() {
    const trimmed = newMilestone.trim();
    if (!trimmed) return;
    addMilestone.mutate(
      { campaignId, arcId: arc._id, data: { description: trimmed } },
      {
        onSuccess: () => setNewMilestone(''),
        onError: () => toast.error('Failed to add milestone'),
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMilestone();
    }
  }

  const inputCls =
    'w-full rounded-sm border border-border bg-[hsl(24,15%,10%)] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40 transition-colors';

  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        Milestones
      </label>
      {renderMilestoneItems(arc, isDM, handleToggle)}
      {isDM && renderAddMilestoneInput(newMilestone, setNewMilestone, handleKeyDown, addMilestone.isPending, inputCls)}
      {arc.milestones.length === 0 && !isDM && (
        <p className="text-[11px] text-muted-foreground/40 italic font-['IM_Fell_English']">
          No milestones yet.
        </p>
      )}
    </div>
  );
}

function renderMilestoneItems(
  arc: CampaignArc,
  isDM: boolean,
  handleToggle: (id: string) => void,
) {
  if (arc.milestones.length === 0) return null;

  return (
    <ul className="mb-2 space-y-1">
      {arc.milestones.map((m) => (
        <li key={m._id} className="flex items-start gap-2 group">
          {isDM ? (
            <button
              type="button"
              className="mt-0.5 shrink-0 transition-colors hover:text-gold"
              onClick={() => handleToggle(m._id)}
            >
              {m.completed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(150,50%,55%)]" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
              )}
            </button>
          ) : (
            <span className="mt-0.5 shrink-0">
              {m.completed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(150,50%,55%)]" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
              )}
            </span>
          )}
          <span
            className={`text-xs font-['IM_Fell_English'] ${
              m.completed
                ? 'text-muted-foreground/50 line-through'
                : 'text-foreground'
            }`}
          >
            {m.description}
          </span>
        </li>
      ))}
    </ul>
  );
}

function renderAddMilestoneInput(
  newMilestone: string,
  setNewMilestone: (v: string) => void,
  handleKeyDown: (e: React.KeyboardEvent) => void,
  isPending: boolean,
  inputCls: string,
) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        className={inputCls}
        placeholder="Add milestone... (Enter to submit)"
        value={newMilestone}
        onChange={(e) => setNewMilestone(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isPending}
      />
      {isPending && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />}
    </div>
  );
}
