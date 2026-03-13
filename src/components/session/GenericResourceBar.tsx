import { useState, useCallback } from 'react';
import { Minus, Plus, Trash2, Sparkles } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useCampaignModuleEnabled } from '@/hooks/useModuleEnabled';

interface CharacterResource {
  id: string;
  name: string;
  current: number;
  max: number;
  rechargeOn?: string;
  display?: string;
}

interface GenericResourceBarProps {
  campaignId: string;
  characterId: string;
  editable?: boolean;
}

export function GenericResourceBar({ campaignId, characterId, editable = true }: GenericResourceBarProps) {
  const enabled = useCampaignModuleEnabled(campaignId, 'generic-resource');
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMax, setNewMax] = useState(5);
  const [newRecharge, setNewRecharge] = useState<string>('long-rest');

  const { data: resources } = useQuery({
    queryKey: ['custom-resources', characterId],
    queryFn: async () => {
      const { data } = await api.get<CharacterResource[]>(`/characters/${characterId}/custom-resources`);
      return data;
    },
    enabled: !!characterId && enabled,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['custom-resources', characterId] });
    queryClient.invalidateQueries({ queryKey: ['characters', campaignId] });
  }, [queryClient, characterId, campaignId]);

  const upsert = useMutation({
    mutationFn: async (resource: CharacterResource) => {
      await api.patch(`/characters/${characterId}/custom-resources/${resource.id}`, resource);
    },
    onSuccess: invalidate,
  });

  const adjust = useMutation({
    mutationFn: async ({ resourceId, delta }: { resourceId: string; delta: number }) => {
      await api.patch(`/characters/${characterId}/custom-resources/${resourceId}/adjust`, { delta });
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (resourceId: string) => {
      await api.delete(`/characters/${characterId}/custom-resources/${resourceId}`);
    },
    onSuccess: invalidate,
  });

  if (!enabled || !resources) return null;

  function handleAdd() {
    if (!newName.trim()) return;
    upsert.mutate({
      id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newName.trim(),
      current: newMax,
      max: newMax,
      rechargeOn: newRecharge,
      display: 'dots',
    });
    setNewName('');
    setNewMax(5);
    setAdding(false);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-2.5 w-2.5" />
          Resources
        </span>
        {editable && (
          <button
            type="button"
            onClick={() => setAdding(!adding)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>

      {adding && editable && (
        <div className="flex gap-1 items-end flex-wrap">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="flex-1 min-w-[60px] rounded border border-border bg-muted/30 px-1.5 py-0.5 text-[10px]"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            type="number"
            value={newMax}
            onChange={(e) => setNewMax(parseInt(e.target.value, 10) || 1)}
            min={1}
            max={20}
            className="w-10 rounded border border-border bg-muted/30 px-1 py-0.5 text-[10px] text-center"
          />
          <select
            value={newRecharge}
            onChange={(e) => setNewRecharge(e.target.value)}
            className="rounded border border-border bg-muted/30 px-1 py-0.5 text-[10px]"
          >
            <option value="long-rest">Long Rest</option>
            <option value="short-rest">Short Rest</option>
            <option value="manual">Manual</option>
          </select>
          <button
            type="button"
            onClick={handleAdd}
            className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] text-gold hover:bg-gold/30"
          >
            Add
          </button>
        </div>
      )}

      {resources.map((r) => (
        <ResourceRow
          key={r.id}
          resource={r}
          editable={editable}
          onAdjust={(delta) => adjust.mutate({ resourceId: r.id, delta })}
          onRemove={() => remove.mutate(r.id)}
        />
      ))}
    </div>
  );
}

function ResourceRow({
  resource,
  editable,
  onAdjust,
  onRemove,
}: {
  resource: CharacterResource;
  editable: boolean;
  onAdjust: (delta: number) => void;
  onRemove: () => void;
}) {
  const display = resource.display ?? 'dots';

  return (
    <div className="flex items-center gap-1.5 rounded-sm border border-border bg-muted/30 px-2 py-1">
      <span className="font-[Cinzel] text-[10px] text-muted-foreground truncate min-w-0 flex-shrink">
        {resource.name}
      </span>

      <div className="flex items-center gap-0.5 flex-1 justify-end">
        {editable && (
          <button
            type="button"
            onClick={() => onAdjust(-1)}
            disabled={resource.current <= 0}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>
        )}

        {display === 'dots' && resource.max <= 10 ? (
          <div className="flex gap-0.5">
            {Array.from({ length: resource.max }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 w-2.5 rounded-full border transition-colors ${
                  i < resource.current
                    ? 'border-violet-500 bg-violet-500/60'
                    : 'border-muted-foreground/30 bg-muted/20'
                }`}
              />
            ))}
          </div>
        ) : (
          <span className="font-[Cinzel] text-xs text-foreground">
            {resource.current}/{resource.max}
          </span>
        )}

        {editable && (
          <button
            type="button"
            onClick={() => onAdjust(1)}
            disabled={resource.current >= resource.max}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      {editable && (
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground/30 hover:text-blood transition-colors ml-0.5"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}
