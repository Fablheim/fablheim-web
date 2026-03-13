import { useState } from 'react';
import { Sparkles, Eye, EyeOff, Plus, Trash2, Zap } from 'lucide-react';
import { useSceneAspects, useUpsertSceneAspect, useInvokeSceneAspect, useRemoveSceneAspect } from '@/hooks/useLiveSession';
import { useCampaignModuleEnabled } from '@/hooks/useModuleEnabled';

interface SceneAspectsPanelProps {
  campaignId: string;
  isDM: boolean;
}

export function SceneAspectsPanel({ campaignId, isDM }: SceneAspectsPanelProps) {
  const enabled = useCampaignModuleEnabled(campaignId, 'situation-aspects');
  const { data: aspects } = useSceneAspects(campaignId);
  const upsert = useUpsertSceneAspect(campaignId);
  const invoke = useInvokeSceneAspect(campaignId);
  const remove = useRemoveSceneAspect(campaignId);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIsBoost, setNewIsBoost] = useState(false);
  const [newFreeInvokes, setNewFreeInvokes] = useState(1);

  if (!enabled || !aspects) return null;

  function handleAdd() {
    if (!newName.trim()) return;
    upsert.mutate({
      id: `aspect-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newName.trim(),
      freeInvokes: newFreeInvokes,
      isBoost: newIsBoost,
      isHidden: false,
    });
    setNewName('');
    setNewIsBoost(false);
    setNewFreeInvokes(1);
    setAdding(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          Scene Aspects
        </h4>
        {isDM && (
          <button
            type="button"
            onClick={() => setAdding(!adding)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {adding && isDM && (
        <div className="space-y-1.5 rounded border border-border bg-muted/20 p-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Aspect name"
            className="w-full rounded border border-border bg-muted/30 px-2 py-1 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <input
                type="checkbox"
                checked={newIsBoost}
                onChange={(e) => setNewIsBoost(e.target.checked)}
                className="h-3 w-3"
              />
              Boost
            </label>
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
              Free invokes:
              <input
                type="number"
                value={newFreeInvokes}
                onChange={(e) => setNewFreeInvokes(parseInt(e.target.value, 10) || 0)}
                min={0}
                max={5}
                className="w-10 rounded border border-border bg-muted/30 px-1 py-0.5 text-center text-[10px]"
              />
            </label>
            <button
              type="button"
              onClick={handleAdd}
              className="ml-auto rounded bg-gold/20 px-2 py-0.5 text-[10px] text-gold hover:bg-gold/30"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {aspects.map((a) => (
        <div
          key={a.id}
          className={`flex items-center gap-2 rounded-sm border px-2 py-1.5 transition-colors ${
            a.isBoost
              ? 'border-yellow-500/30 bg-yellow-500/5'
              : 'border-arcane/30 bg-arcane/5'
          }`}
        >
          <span className="font-['IM_Fell_English'] text-xs text-foreground truncate flex-1 italic">
            {a.name}
          </span>

          {a.freeInvokes > 0 && (
            <button
              type="button"
              onClick={() => invoke.mutate(a.id)}
              className="flex items-center gap-0.5 rounded bg-arcane/20 px-1.5 py-0.5 text-[9px] text-arcane hover:bg-arcane/30"
              title="Use free invoke"
            >
              <Zap className="h-2.5 w-2.5" />
              {a.freeInvokes}
            </button>
          )}

          {a.isBoost && (
            <span className="rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[9px] text-yellow-500">
              Boost
            </span>
          )}

          {isDM && (
            <>
              <button
                type="button"
                onClick={() => upsert.mutate({ ...a, isHidden: !a.isHidden })}
                className="text-muted-foreground/40 hover:text-foreground transition-colors"
                title={a.isHidden ? 'Reveal' : 'Hide'}
              >
                {a.isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={() => remove.mutate(a.id)}
                className="text-muted-foreground/40 hover:text-blood transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      ))}

      {aspects.length === 0 && !adding && (
        <p className="text-[10px] text-muted-foreground italic font-['IM_Fell_English']">
          No scene aspects active.
        </p>
      )}
    </div>
  );
}
