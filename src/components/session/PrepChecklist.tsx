import { useState, useCallback } from 'react';
import { Plus, X, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useUpdateSession } from '@/hooks/useSessions';
import type { Session, PrepChecklistItem } from '@/types/campaign';

interface PrepChecklistProps {
  session: Session;
  campaignId: string;
}

const DEFAULT_ITEMS: Omit<PrepChecklistItem, 'id'>[] = [
  { label: 'Review last session recap', completed: false, category: 'review' },
  { label: 'Prep encounter(s)', completed: false, category: 'combat' },
  { label: 'Review NPC motivations', completed: false, category: 'roleplay' },
  { label: 'Prepare handouts / maps', completed: false, category: 'materials' },
  { label: 'Check party status (HP, resources)', completed: false, category: 'review' },
];

function generateId() {
  return `prep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PrepChecklist({ session, campaignId }: PrepChecklistProps) {
  const updateSession = useUpdateSession();
  const [newItemLabel, setNewItemLabel] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const items = session.prepChecklist ?? [];
  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;

  const saveChecklist = useCallback(
    (nextItems: PrepChecklistItem[]) => {
      updateSession.mutate({
        campaignId,
        id: session._id,
        data: { prepChecklist: nextItems },
      });
    },
    [updateSession, campaignId, session._id],
  );

  const toggleItem = useCallback(
    (id: string) => {
      const nextItems = items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      );
      saveChecklist(nextItems);
    },
    [items, saveChecklist],
  );

  const addItem = useCallback(() => {
    const label = newItemLabel.trim();
    if (!label) return;
    const nextItems = [...items, { id: generateId(), label, completed: false }];
    saveChecklist(nextItems);
    setNewItemLabel('');
    setShowAddInput(false);
  }, [newItemLabel, items, saveChecklist]);

  const removeItem = useCallback(
    (id: string) => {
      saveChecklist(items.filter((i) => i.id !== id));
    },
    [items, saveChecklist],
  );

  const initDefaults = useCallback(() => {
    if (items.length > 0) {
      toast.info('Checklist already has items');
      return;
    }
    const defaults = DEFAULT_ITEMS.map((item) => ({
      ...item,
      id: generateId(),
    }));
    saveChecklist(defaults);
  }, [items.length, saveChecklist]);

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-[Cinzel] text-xs font-semibold uppercase tracking-wider text-foreground">
            Prep Checklist
          </h4>
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className={`h-full rounded-full transition-all ${
              progressPct === 100 ? 'bg-green-500' : 'bg-primary'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Checklist items */}
      {items.length > 0 ? (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 rounded-sm px-1 py-0.5 hover:bg-muted/30"
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className={`h-4 w-4 shrink-0 rounded-sm border transition-colors ${
                  item.completed
                    ? 'border-green-500 bg-green-500/20 text-green-500'
                    : 'border-border hover:border-primary'
                }`}
              >
                {item.completed && (
                  <svg viewBox="0 0 12 12" className="h-full w-full">
                    <path d="M3 6l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </button>
              <span
                className={`flex-1 text-xs ${
                  item.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}
              >
                {item.label}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-2 text-center">
          <p className="text-xs text-muted-foreground italic mb-2">No checklist items yet</p>
          <Button size="sm" variant="ghost" onClick={initDefaults}>
            Load defaults
          </Button>
        </div>
      )}

      {/* Add item */}
      {showAddInput ? (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newItemLabel}
            onChange={(e) => setNewItemLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="New checklist item..."
            maxLength={200}
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
            autoFocus
          />
          <Button size="sm" onClick={addItem}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowAddInput(false); setNewItemLabel(''); }}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddInput(true)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          <span className="font-[Cinzel] uppercase tracking-wider">Add item</span>
        </button>
      )}
    </div>
  );
}
