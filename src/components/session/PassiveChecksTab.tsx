import { useState } from 'react';
import { Plus, Eye, Archive, Trash2, X, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  usePassiveChecks,
  useCreatePassiveCheck,
  useUpdatePassiveCheck,
  useDeletePassiveCheck,
} from '@/hooks/usePassiveChecks';
import type { PassiveCheck } from '@/api/passive-checks';

interface PassiveChecksTabProps {
  campaignId: string;
}

const CHECK_TYPE_LABELS: Record<string, string> = {
  perception: 'Perception',
  insight: 'Insight',
  investigation: 'Investigation',
};

const CHECK_TYPE_COLORS: Record<string, string> = {
  perception: 'text-amber-400',
  insight: 'text-violet-400',
  investigation: 'text-cyan-400',
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-400' },
  revealed: { label: 'Revealed', className: 'bg-forest/15 text-[hsl(150,50%,55%)]' },
  archived: { label: 'Archived', className: 'bg-muted text-muted-foreground' },
};

const inputClass =
  'block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

type StatusFilter = 'all' | 'pending' | 'revealed' | 'archived';

export function PassiveChecksTab({ campaignId }: PassiveChecksTabProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const queryStatus = statusFilter === 'all' ? undefined : statusFilter;
  const { data: checks, isLoading } = usePassiveChecks(campaignId, queryStatus);
  const createCheck = useCreatePassiveCheck();
  const updateCheck = useUpdatePassiveCheck();
  const deleteCheck = useDeletePassiveCheck();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Create form state
  const [checkType, setCheckType] = useState<'perception' | 'insight' | 'investigation'>('perception');
  const [dc, setDc] = useState(15);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  function resetForm() {
    setCheckType('perception');
    setDc(15);
    setDescription('');
    setLocation('');
    setShowCreateForm(false);
  }

  function handleCreate() {
    createCheck.mutate(
      {
        campaignId,
        data: {
          checkType,
          dc,
          description: description.trim() || undefined,
          location: location.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Passive check created');
          resetForm();
        },
        onError: () => toast.error('Failed to create passive check'),
      },
    );
  }

  function handleReveal(id: string) {
    updateCheck.mutate(
      { campaignId, id, data: { status: 'revealed' } },
      {
        onSuccess: () => toast.success('Check revealed'),
        onError: () => toast.error('Failed to reveal check'),
      },
    );
  }

  function handleArchive(id: string) {
    updateCheck.mutate(
      { campaignId, id, data: { status: 'archived' } },
      {
        onSuccess: () => toast.success('Check archived'),
        onError: () => toast.error('Failed to archive check'),
      },
    );
  }

  function handleDelete(id: string) {
    deleteCheck.mutate(
      { campaignId, id },
      {
        onSuccess: () => {
          toast.success('Check deleted');
          setDeleteConfirmId(null);
        },
        onError: () => toast.error('Failed to delete check'),
      },
    );
  }

  return (
    <div className="p-4 space-y-4">
      <ConfirmDialog
        open={!!deleteConfirmId}
        title="Delete Passive Check?"
        description="This check and its results will be permanently deleted."
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteCheck.isPending}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-['IM_Fell_English'] text-lg text-foreground">Passive Checks</h2>
        {!showCreateForm && (
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Check
          </Button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-1">
        {(['all', 'pending', 'revealed', 'archived'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-md px-2 py-1 text-xs font-[Cinzel] transition-colors ${
              statusFilter === s
                ? 'bg-primary/15 text-primary border border-primary/40'
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3 tavern-card">
          <div className="flex items-center justify-between">
            <p className="font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
              New Passive Check
            </p>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Check Type</label>
              <select
                value={checkType}
                onChange={(e) => setCheckType(e.target.value as typeof checkType)}
                className={inputClass}
              >
                <option value="perception">Perception</option>
                <option value="insight">Insight</option>
                <option value="investigation">Investigation</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>DC</label>
              <input
                type="number"
                min={1}
                max={30}
                value={dc}
                onChange={(e) => setDc(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are they noticing?"
              maxLength={500}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where in the scene?"
              maxLength={200}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
            <Button
              size="sm"
              disabled={createCheck.isPending}
              onClick={handleCreate}
            >
              {createCheck.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-4">
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="mt-2 h-3 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!checks || checks.length === 0) && (
        <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-8 text-center texture-parchment">
          <Eye className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 font-['IM_Fell_English'] text-muted-foreground">
            No passive checks yet. Create one to automatically check party scores.
          </p>
        </div>
      )}

      {/* Check list */}
      {checks && checks.length > 0 && (
        <div className="space-y-3">
          {checks.map((check) => renderCheck(check))}
        </div>
      )}
    </div>
  );

  function renderCheck(check: PassiveCheck) {
    const badge = STATUS_BADGES[check.status] ?? STATUS_BADGES.pending;
    const passCount = check.results.filter((r) => r.passed).length;
    const failCount = check.results.filter((r) => !r.passed).length;
    const isExpanded = expandedId === check._id;

    return (
      <div
        key={check._id}
        className="group rounded-lg border border-border bg-card p-4 tavern-card texture-leather transition-all hover:border-gold/40"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setExpandedId(isExpanded ? null : check._id)}
                className="font-[Cinzel] font-semibold text-card-foreground hover:text-brass transition-colors"
              >
                <span className={CHECK_TYPE_COLORS[check.checkType]}>
                  {CHECK_TYPE_LABELS[check.checkType]}
                </span>
                {' '}DC {check.dc}
              </button>
              <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] ${badge.className}`}>
                {badge.label}
              </span>
              {check.results.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  <CheckCircle2 className="inline h-3 w-3 text-[hsl(150,50%,55%)]" /> {passCount}
                  {' '}
                  <XCircle className="inline h-3 w-3 text-destructive" /> {failCount}
                </span>
              )}
            </div>
            {check.description && (
              <p className="mt-1 text-xs text-muted-foreground truncate">
                {check.description}
              </p>
            )}
            {check.location && (
              <p className="mt-0.5 text-[10px] text-muted-foreground/70 italic">
                {check.location}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {check.status === 'pending' && (
              <button
                onClick={() => handleReveal(check._id)}
                className="rounded-md p-1 text-muted-foreground hover:bg-forest/20 hover:text-[hsl(150,50%,55%)]"
                title="Reveal to players"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            )}
            {check.status !== 'archived' && (
              <button
                onClick={() => handleArchive(check._id)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Archive"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setDeleteConfirmId(check._id)}
              className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Expanded results */}
        {isExpanded && check.results.length > 0 && (
          <div className="mt-3 border-t border-border/50 pt-3 space-y-1.5">
            {check.results.map((r) => (
              <div
                key={r.characterId}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-[Cinzel] text-card-foreground">{r.characterName}</span>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">Score: {r.passiveScore}</span>
                  {r.passed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(150,50%,55%)]" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
        {isExpanded && check.results.length === 0 && (
          <div className="mt-3 border-t border-border/50 pt-3">
            <p className="text-xs text-muted-foreground italic">No characters evaluated yet.</p>
          </div>
        )}
      </div>
    );
  }
}
