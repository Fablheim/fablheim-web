import { useState } from 'react';
import {
  Swords,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Target,
  Clock,
  CheckCheck,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import {
  useUpdateQuestStatus,
  useToggleObjective,
  useAddObjective,
  useRemoveObjective,
} from '@/hooks/useWorldEntities';
import type { WorldEntity, QuestObjective } from '@/types/campaign';

interface QuestTrackerProps {
  quests: WorldEntity[];
  campaignId: string;
  isDM: boolean;
  onViewQuest: (quest: WorldEntity) => void;
}

type QuestStatusFilter = 'all' | 'available' | 'in_progress' | 'completed' | 'failed';

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  available: { label: 'Available', icon: Target, color: 'text-gold', bg: 'bg-gold/20' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-brass', bg: 'bg-brass/20' },
  completed: { label: 'Completed', icon: CheckCheck, color: 'text-[hsl(150,50%,55%)]', bg: 'bg-forest/20' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-blood', bg: 'bg-blood/20' },
};

const STATUS_OPTIONS: QuestStatusFilter[] = ['all', 'available', 'in_progress', 'completed', 'failed'];

export function QuestTracker({ quests, campaignId, isDM, onViewQuest }: QuestTrackerProps) {
  const [statusFilter, setStatusFilter] = useState<QuestStatusFilter>('all');
  const [expandedQuests, setExpandedQuests] = useState<Set<string>>(new Set());
  const [newObjectiveText, setNewObjectiveText] = useState<Record<string, string>>({});

  const updateStatus = useUpdateQuestStatus();
  const toggleObjective = useToggleObjective();
  const addObjective = useAddObjective();
  const removeObjective = useRemoveObjective();

  const filtered = statusFilter === 'all'
    ? quests
    : quests.filter((q) => (q.questStatus ?? 'available') === statusFilter);

  const statusCounts: Record<string, number> = { all: quests.length };
  for (const q of quests) {
    const s = q.questStatus ?? 'available';
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }

  function toggleExpanded(id: string) {
    setExpandedQuests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleStatusChange(entityId: string, status: string) {
    updateStatus.mutate(
      { campaignId, entityId, status },
      { onError: () => toast.error('Failed to update quest status') },
    );
  }

  function handleToggleObjective(entityId: string, objectiveId: string) {
    toggleObjective.mutate(
      { campaignId, entityId, objectiveId },
      { onError: () => toast.error('Failed to toggle objective') },
    );
  }

  function handleAddObjective(entityId: string) {
    const desc = newObjectiveText[entityId]?.trim();
    if (!desc) return;
    addObjective.mutate(
      { campaignId, entityId, description: desc },
      {
        onSuccess: () => setNewObjectiveText((prev) => ({ ...prev, [entityId]: '' })),
        onError: () => toast.error('Failed to add objective'),
      },
    );
  }

  function handleRemoveObjective(entityId: string, objectiveId: string) {
    removeObjective.mutate(
      { campaignId, entityId, objectiveId },
      { onError: () => toast.error('Failed to remove objective') },
    );
  }

  function getProgress(objectives?: QuestObjective[]) {
    if (!objectives || objectives.length === 0) return null;
    const done = objectives.filter((o) => o.completed).length;
    return { done, total: objectives.length, pct: Math.round((done / objectives.length) * 100) };
  }

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {STATUS_OPTIONS.map((s) => {
          const conf = s === 'all' ? null : STATUS_CONFIG[s];
          const count = statusCounts[s] ?? 0;
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-[Cinzel] text-xs uppercase tracking-wider transition-colors ${
                isActive
                  ? s === 'all'
                    ? 'bg-brass/20 text-brass'
                    : `${conf!.bg} ${conf!.color}`
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              {s === 'all' ? 'All' : conf!.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                isActive ? 'bg-black/10' : 'bg-muted'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quest list */}
      {filtered.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-8 text-center texture-parchment">
          <Swords className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 font-['IM_Fell_English'] text-muted-foreground">
            {statusFilter === 'all' ? 'No quests yet' : `No ${STATUS_CONFIG[statusFilter]?.label.toLowerCase()} quests`}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((quest) => {
          const status = quest.questStatus ?? 'available';
          const conf = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
          const StatusIcon = conf.icon;
          const progress = getProgress(quest.objectives);
          const isExpanded = expandedQuests.has(quest._id);

          return (
            <div
              key={quest._id}
              className="rounded-lg border border-border border-l-4 border-l-gold/60 bg-card tavern-card texture-leather transition-all"
            >
              {/* Quest header */}
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggleExpanded(quest._id)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onViewQuest(quest)}>
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-[Cinzel] font-semibold text-card-foreground">
                      {quest.name}
                    </h3>
                    <span className={`inline-flex items-center gap-1 rounded-md ${conf.bg} px-2 py-0.5 text-[10px] ${conf.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {conf.label}
                    </span>
                  </div>
                  {quest.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{quest.description}</p>
                  )}
                </div>

                {/* Progress bar */}
                {progress && (
                  <div className="hidden shrink-0 sm:flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gold transition-all"
                        style={{ width: `${progress.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-[Cinzel]">
                      {progress.done}/{progress.total}
                    </span>
                  </div>
                )}

                {/* DM status selector */}
                {isDM && (
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(quest._id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 rounded-sm border border-input bg-input px-2 py-1 font-[Cinzel] text-[10px] uppercase text-foreground input-carved"
                  >
                    <option value="available">Available</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                )}
              </div>

              {/* Expanded: objectives */}
              {isExpanded && (
                <div className="border-t border-border/50 px-4 py-3">
                  {/* Quest details */}
                  {quest.questGiver && (
                    <p className="mb-2 text-xs text-muted-foreground">
                      <span className="font-[Cinzel] uppercase tracking-wider">Quest Giver:</span>{' '}
                      {typeof quest.questGiver === 'object' ? quest.questGiver.name : quest.questGiver}
                    </p>
                  )}
                  {quest.rewards && (
                    <p className="mb-2 text-xs text-muted-foreground">
                      <span className="font-[Cinzel] uppercase tracking-wider">Rewards:</span>{' '}
                      {quest.rewards}
                    </p>
                  )}

                  {/* Objectives */}
                  <p className="mb-2 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                    Objectives
                  </p>
                  {(!quest.objectives || quest.objectives.length === 0) && (
                    <p className="text-xs italic text-muted-foreground/60">No objectives set</p>
                  )}
                  <ul className="space-y-1.5">
                    {quest.objectives?.map((obj) => (
                      <li key={obj.id} className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleObjective(quest._id, obj.id)}
                          className="shrink-0"
                        >
                          {obj.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-[hsl(150,50%,55%)]" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground hover:text-gold" />
                          )}
                        </button>
                        <span className={`flex-1 text-sm ${obj.completed ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>
                          {obj.description}
                        </span>
                        {isDM && (
                          <button
                            onClick={() => handleRemoveObjective(quest._id, obj.id)}
                            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Add objective (DM only) */}
                  {isDM && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={newObjectiveText[quest._id] ?? ''}
                        onChange={(e) =>
                          setNewObjectiveText((prev) => ({ ...prev, [quest._id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddObjective(quest._id);
                          }
                        }}
                        placeholder="Add objective..."
                        className="flex-1 rounded-sm border border-input bg-input px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground input-carved"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddObjective(quest._id)}
                        disabled={!newObjectiveText[quest._id]?.trim()}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Tags */}
                  {quest.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {quest.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-background/40 px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
