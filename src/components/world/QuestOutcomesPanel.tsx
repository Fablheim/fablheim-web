import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, AlertTriangle, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useChooseOutcome } from '@/hooks/useWorldEntities';
import type { WorldEntity } from '@/types/campaign';

interface QuestOutcomesPanelProps {
  entity: WorldEntity;
  canEdit: boolean;
  allEntities: WorldEntity[];
  onViewEntity: (entity: WorldEntity) => void;
}

export function QuestOutcomesPanel({ entity, canEdit, allEntities, onViewEntity }: QuestOutcomesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOutcomeId, setConfirmOutcomeId] = useState<string | null>(null);
  const chooseOutcome = useChooseOutcome();

  if (entity.type !== 'quest') return null;

  const outcomes = entity.outcomes ?? [];
  const stakes = entity.stakes;
  const factionImpact = entity.factionImpact ?? [];
  const branchQuests = entity.branchQuests ?? [];
  const arcId = entity.arcId;

  const hasContent = outcomes.length > 0 || stakes || factionImpact.length > 0 || branchQuests.length > 0 || arcId;
  if (!hasContent) return null;

  const chosenOutcome = outcomes.find((o) => o.chosen);

  function handleChoose(outcomeId: string) {
    chooseOutcome.mutate(
      { campaignId: entity.campaignId, entityId: entity._id, outcomeId },
      {
        onSuccess: () => {
          toast.success('Outcome chosen — side effects applied');
          setConfirmOutcomeId(null);
        },
        onError: () => toast.error('Failed to choose outcome'),
      },
    );
  }

  return (
    <>
      <div className="divider-ornate mt-5 mb-4" />

      <ConfirmDialog
        open={!!confirmOutcomeId}
        title="Choose This Outcome?"
        description="This will trigger quest side effects (faction reputation changes, arc milestones, follow-up quests). This cannot be undone."
        confirmLabel="Choose Outcome"
        variant="default"
        isPending={chooseOutcome.isPending}
        onConfirm={() => confirmOutcomeId && handleChoose(confirmOutcomeId)}
        onCancel={() => setConfirmOutcomeId(null)}
      />

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left"
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <span className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Quest Outcomes & Stakes
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Stakes */}
          {stakes && (
            <div className="rounded-md border border-blood/30 bg-blood/5 p-2">
              <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-blood">
                <AlertTriangle className="inline h-3 w-3 mr-1" />Stakes
              </p>
              <p className="mt-1 text-xs text-foreground">{stakes}</p>
            </div>
          )}

          {/* Outcomes */}
          {outcomes.length > 0 && (
            <div>
              <p className="mb-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                Possible Outcomes
              </p>
              <div className="space-y-2">
                {outcomes.map((outcome) => (
                  <div
                    key={outcome.id}
                    className={`rounded-md border p-2 ${
                      outcome.chosen
                        ? 'border-[hsl(150,50%,55%)]/40 bg-forest/10'
                        : 'border-border bg-card/40'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {outcome.chosen ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(150,50%,55%)] mt-0.5" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground">{outcome.description}</p>
                        {outcome.consequences && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground italic">{outcome.consequences}</p>
                        )}
                      </div>
                      {canEdit && !chosenOutcome && (
                        <button
                          onClick={() => setConfirmOutcomeId(outcome.id)}
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-[Cinzel] text-brass hover:bg-brass/15"
                        >
                          Choose
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Faction impact preview */}
          {factionImpact.length > 0 && (
            <div>
              <p className="mb-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                Faction Impact
              </p>
              <div className="space-y-1">
                {factionImpact.map((impact) => {
                  const faction = allEntities.find((e) => e._id === impact.factionEntityId);
                  return (
                    <div key={impact.factionEntityId} className="flex items-center gap-2 text-xs">
                      {faction ? (
                        <button onClick={() => onViewEntity(faction)} className="text-brass hover:underline">
                          {faction.name}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">Unknown faction</span>
                      )}
                      <span className={impact.reputationDelta >= 0 ? 'text-[hsl(150,50%,55%)]' : 'text-blood'}>
                        {impact.reputationDelta > 0 ? '+' : ''}{impact.reputationDelta}
                      </span>
                      {impact.description && <span className="text-muted-foreground truncate">{impact.description}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Branch quests */}
          {branchQuests.length > 0 && (
            <div>
              <p className="mb-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                <GitBranch className="inline h-3 w-3 mr-1" />Branch Quests
              </p>
              <div className="space-y-1">
                {branchQuests.map((qId) => {
                  const quest = allEntities.find((e) => e._id === qId);
                  if (!quest) return null;
                  return (
                    <button
                      key={qId}
                      onClick={() => onViewEntity(quest)}
                      className="block text-xs text-brass hover:underline"
                    >
                      {quest.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
