import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useAdjustReputation } from '@/hooks/useWorldEntities';
import type { WorldEntity, FactionDisposition } from '@/types/campaign';

const DISPOSITION_CONFIG: Record<FactionDisposition, { label: string; color: string; bg: string }> = {
  hostile: { label: 'Hostile', color: 'text-blood', bg: 'bg-blood/15' },
  unfriendly: { label: 'Unfriendly', color: 'text-brass', bg: 'bg-brass/15' },
  neutral: { label: 'Neutral', color: 'text-muted-foreground', bg: 'bg-muted' },
  friendly: { label: 'Friendly', color: 'text-gold', bg: 'bg-gold/15' },
  allied: { label: 'Allied', color: 'text-[hsl(150,50%,55%)]', bg: 'bg-forest/15' },
};

interface FactionReputationPanelProps {
  entity: WorldEntity;
  canEdit: boolean;
  allEntities: WorldEntity[];
  onViewEntity: (entity: WorldEntity) => void;
}

export function FactionReputationPanel({ entity, canEdit, allEntities, onViewEntity }: FactionReputationPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [delta, setDelta] = useState(0);
  const [description, setDescription] = useState('');
  const adjustReputation = useAdjustReputation();

  if (entity.type !== 'faction') return null;

  const disposition = entity.disposition as FactionDisposition | undefined;
  const dispConfig = disposition ? DISPOSITION_CONFIG[disposition] : null;
  const reputation = entity.reputation ?? 0;
  const history = entity.reputationHistory ?? [];
  const relationships = entity.factionRelationships ?? [];

  function handleAdjust() {
    if (!delta || !description.trim()) return;
    adjustReputation.mutate(
      { campaignId: entity.campaignId, entityId: entity._id, data: { delta, description: description.trim() } },
      {
        onSuccess: () => {
          toast.success('Reputation adjusted');
          setDelta(0);
          setDescription('');
          setShowForm(false);
        },
        onError: () => toast.error('Failed to adjust reputation'),
      },
    );
  }

  // Clamp reputation into a -100..100 visual bar
  const barPercent = ((reputation + 100) / 200) * 100;

  return (
    <>
      <div className="divider-ornate mt-5 mb-4" />
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left"
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <span className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Faction Standing
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Disposition badge + reputation score */}
          <div className="flex items-center gap-3">
            {dispConfig && (
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-[Cinzel] ${dispConfig.bg} ${dispConfig.color}`}>
                {dispConfig.label}
              </span>
            )}
            <span className="font-[Cinzel] text-sm text-foreground">
              Rep: <span className={reputation >= 0 ? 'text-[hsl(150,50%,55%)]' : 'text-blood'}>{reputation > 0 ? '+' : ''}{reputation}</span>
            </span>
          </div>

          {/* Reputation bar */}
          <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all ${reputation >= 0 ? 'bg-[hsl(150,50%,55%)]' : 'bg-blood'}`}
              style={{ width: `${Math.max(2, barPercent)}%` }}
            />
            <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-[Cinzel]">
            <span>-100</span>
            <span>0</span>
            <span>+100</span>
          </div>

          {/* Hidden goals (DM only) */}
          {entity.hiddenGoals && (
            <div className="rounded-md border border-arcane/30 bg-arcane/5 p-2">
              <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-arcane">Hidden Goals</p>
              <p className="mt-1 text-xs text-foreground">{entity.hiddenGoals}</p>
            </div>
          )}

          {/* Inter-faction relationships */}
          {relationships.length > 0 && (
            <div>
              <p className="mb-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                Faction Relationships
              </p>
              <div className="space-y-1">
                {relationships.map((rel) => {
                  const faction = allEntities.find((e) => e._id === rel.factionEntityId);
                  const attConfig = DISPOSITION_CONFIG[rel.attitude];
                  return (
                    <div key={rel.factionEntityId} className="flex items-center gap-2 text-xs">
                      {faction ? (
                        <button onClick={() => onViewEntity(faction)} className="text-brass hover:underline">
                          {faction.name}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">Unknown faction</span>
                      )}
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${attConfig.bg} ${attConfig.color}`}>
                        {attConfig.label}
                      </span>
                      {rel.description && <span className="text-muted-foreground truncate">{rel.description}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reputation history */}
          {history.length > 0 && (
            <div>
              <p className="mb-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                History
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {history.slice().reverse().map((evt, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {evt.delta >= 0 ? (
                      <TrendingUp className="h-3 w-3 shrink-0 text-[hsl(150,50%,55%)]" />
                    ) : (
                      <TrendingDown className="h-3 w-3 shrink-0 text-blood" />
                    )}
                    <span className={evt.delta >= 0 ? 'text-[hsl(150,50%,55%)]' : 'text-blood'}>
                      {evt.delta > 0 ? '+' : ''}{evt.delta}
                    </span>
                    <span className="text-muted-foreground truncate">{evt.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adjust form */}
          {canEdit && !showForm && (
            <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Adjust Reputation
            </Button>
          )}
          {canEdit && showForm && (
            <div className="rounded-md border border-border bg-card/60 p-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-[Cinzel] text-[10px] uppercase tracking-wider text-foreground">Delta</label>
                  <input
                    type="number"
                    value={delta}
                    onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
                    className="block w-full rounded-sm border border-input bg-input px-2 py-1 text-sm text-foreground input-carved font-[Cinzel]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-[Cinzel] text-[10px] uppercase tracking-wider text-foreground">Reason</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What happened?"
                    className="block w-full rounded-sm border border-input bg-input px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground input-carved"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" disabled={!delta || !description.trim() || adjustReputation.isPending} onClick={handleAdjust}>
                  {adjustReputation.isPending ? 'Saving...' : 'Apply'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
