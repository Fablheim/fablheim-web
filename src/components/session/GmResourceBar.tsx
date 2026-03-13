import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useGmResources, useUpsertGmResource, useAdjustGmResource, useRemoveGmResource } from '@/hooks/useLiveSession';
import { useCampaignModuleEnabled } from '@/hooks/useModuleEnabled';

interface GmResourceBarProps {
  campaignId: string;
  isDM: boolean;
}

export function GmResourceBar({ campaignId, isDM }: GmResourceBarProps) {
  const enabled = useCampaignModuleEnabled(campaignId, 'gm-resource-pool');
  const { data: resources } = useGmResources(campaignId);
  const upsert = useUpsertGmResource(campaignId);
  const adjust = useAdjustGmResource(campaignId);
  const remove = useRemoveGmResource(campaignId);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMax, setNewMax] = useState(5);

  if (!enabled || !resources) return null;

  function handleAdd() {
    if (!newName.trim()) return;
    upsert.mutate({
      id: `gm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newName.trim(),
      current: newMax,
      max: newMax,
    });
    setNewName('');
    setNewMax(5);
    setAdding(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          GM Resources
        </h4>
        {isDM && (
          <button
            type="button"
            onClick={() => setAdding(!adding)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Add resource pool"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {adding && isDM && (
        <div className="flex gap-1.5 items-end">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="flex-1 rounded border border-border bg-muted/30 px-2 py-1 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            type="number"
            value={newMax}
            onChange={(e) => setNewMax(parseInt(e.target.value, 10) || 1)}
            min={1}
            max={20}
            className="w-12 rounded border border-border bg-muted/30 px-1.5 py-1 text-xs text-center"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="rounded bg-gold/20 px-2 py-1 text-xs text-gold hover:bg-gold/30"
          >
            Add
          </button>
        </div>
      )}

      {resources.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-2 rounded-sm border border-iron/30 bg-accent/20 px-2 py-1.5"
        >
          <span
            className="font-[Cinzel] text-xs font-medium text-foreground truncate flex-1"
            style={r.color ? { color: r.color } : undefined}
          >
            {r.name}
          </span>

          <div className="flex items-center gap-1">
            {isDM && (
              <button
                type="button"
                onClick={() => adjust.mutate({ resourceId: r.id, delta: -1 })}
                disabled={r.current <= 0}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <Minus className="h-3 w-3" />
              </button>
            )}

            <div className="flex gap-0.5">
              {Array.from({ length: r.max }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full border transition-colors ${
                    i < r.current
                      ? 'border-gold bg-gold/60'
                      : 'border-border bg-muted/30'
                  }`}
                />
              ))}
            </div>

            {isDM && (
              <button
                type="button"
                onClick={() => adjust.mutate({ resourceId: r.id, delta: 1 })}
                disabled={r.current >= r.max}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </div>

          <span className="font-[Cinzel] text-[10px] text-muted-foreground w-8 text-right">
            {r.current}/{r.max}
          </span>

          {isDM && (
            <button
              type="button"
              onClick={() => remove.mutate(r.id)}
              className="text-muted-foreground/40 hover:text-blood transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      {resources.length === 0 && !adding && isDM && (
        <p className="text-[10px] text-muted-foreground italic font-['IM_Fell_English']">
          No resource pools. Click + to add one.
        </p>
      )}
    </div>
  );
}
