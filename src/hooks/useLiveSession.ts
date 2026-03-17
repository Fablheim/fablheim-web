import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { liveSessionApi } from '@/api/live-session';
import type {
  RollDiceRequest,
  HopeFearRollRequest,
  PbtaRollRequest,
  DicePoolRollRequest,
  GmResource,
  SceneAspect,
  CountdownClock,
  AddInitiativeEntryRequest,
  UpdateInitiativeEntryRequest,
  UpdateDeathSavesRequest,
} from '@/types/live-session';
import type { CombatRulesProfile } from '@/types/combat-rules';

export function useInitiative(campaignId: string) {
  return useQuery({
    queryKey: ['initiative', campaignId],
    queryFn: () => liveSessionApi.getInitiative(campaignId),
    enabled: !!campaignId,
  });
}

export function useDiceHistory(campaignId: string) {
  return useQuery({
    queryKey: ['dice-history', campaignId],
    queryFn: () => liveSessionApi.getDiceHistory(campaignId),
    enabled: !!campaignId,
  });
}

export function useCombatRules(campaignId: string) {
  return useQuery<CombatRulesProfile>({
    queryKey: ['combat-rules', campaignId],
    queryFn: () => liveSessionApi.getCombatRules(campaignId),
    enabled: !!campaignId,
    staleTime: Infinity,
  });
}

export function useRollDice(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RollDiceRequest) => liveSessionApi.rollDice(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dice-history', campaignId] });
    },
  });
}

export function useRollHopeFear(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: HopeFearRollRequest) => liveSessionApi.rollHopeFear(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dice-history', campaignId] });
    },
  });
}

export function useRollPbta2d6(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PbtaRollRequest) => liveSessionApi.rollPbta2d6(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dice-history', campaignId] });
    },
  });
}

export function useRollDicePool(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DicePoolRollRequest) => liveSessionApi.rollDicePool(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dice-history', campaignId] });
    },
  });
}

export function useAddInitiativeEntry(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddInitiativeEntryRequest) =>
      liveSessionApi.addInitiativeEntry(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useUpdateInitiativeEntry(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, body }: { entryId: string; body: UpdateInitiativeEntryRequest }) =>
      liveSessionApi.updateInitiativeEntry(campaignId, entryId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useRemoveInitiativeEntry(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      liveSessionApi.removeInitiativeEntry(campaignId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useUpdateDeathSaves(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, body }: { entryId: string; body: UpdateDeathSavesRequest }) =>
      liveSessionApi.updateDeathSaves(campaignId, entryId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useWoundAdvance(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => liveSessionApi.woundAdvance(campaignId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useWoundReduce(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => liveSessionApi.woundReduce(campaignId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function usePf2eRecoveryCheck(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => liveSessionApi.pf2eRecoveryCheck(campaignId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function usePf2eSetDying(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, dyingValue, woundedValue }: { entryId: string; dyingValue: number; woundedValue?: number }) =>
      liveSessionApi.pf2eSetDying(campaignId, entryId, dyingValue, woundedValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useStartCombat(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => liveSessionApi.startCombat(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useNextTurn(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => liveSessionApi.nextTurn(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useEndCombat(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => liveSessionApi.endCombat(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function usePauseCombat(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => liveSessionApi.pauseCombat(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

// ── GM Resource Pools ──────────────────────────────────

export function useGmResources(campaignId: string) {
  return useQuery({
    queryKey: ['gm-resources', campaignId],
    queryFn: () => liveSessionApi.getGmResources(campaignId),
    enabled: !!campaignId,
  });
}

export function useUpsertGmResource(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resource: GmResource) => liveSessionApi.upsertGmResource(campaignId, resource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gm-resources', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useAdjustGmResource(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, delta }: { resourceId: string; delta: number }) =>
      liveSessionApi.adjustGmResource(campaignId, resourceId, delta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gm-resources', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useRemoveGmResource(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) => liveSessionApi.removeGmResource(campaignId, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gm-resources', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

// ── Scene Aspects ──────────────────────────────────────

export function useSceneAspects(campaignId: string) {
  return useQuery({
    queryKey: ['scene-aspects', campaignId],
    queryFn: () => liveSessionApi.getSceneAspects(campaignId),
    enabled: !!campaignId,
  });
}

export function useUpsertSceneAspect(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (aspect: SceneAspect) => liveSessionApi.upsertSceneAspect(campaignId, aspect),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scene-aspects', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useInvokeSceneAspect(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (aspectId: string) => liveSessionApi.invokeSceneAspect(campaignId, aspectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scene-aspects', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useRemoveSceneAspect(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (aspectId: string) => liveSessionApi.removeSceneAspect(campaignId, aspectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scene-aspects', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

// ── Countdown Clocks ──────────────────────────────────

export function useCountdowns(campaignId: string) {
  return useQuery({
    queryKey: ['countdowns', campaignId],
    queryFn: () => liveSessionApi.getCountdowns(campaignId),
    enabled: !!campaignId,
  });
}

export function useUpsertCountdown(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clock: CountdownClock) => liveSessionApi.upsertCountdown(campaignId, clock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countdowns', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useAdvanceCountdown(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clockId, delta }: { clockId: string; delta?: number }) =>
      liveSessionApi.advanceCountdown(campaignId, clockId, delta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countdowns', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useRemoveCountdown(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clockId: string) => liveSessionApi.removeCountdown(campaignId, clockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countdowns', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}
