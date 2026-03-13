import { useCampaignStage } from '@/hooks/useCampaignStage';
import { useInitiative } from '@/hooks/useLiveSession';
import { useBattleMap } from '@/hooks/useBattleMap';
import type { AppState, CampaignStage } from '@/types/workspace';
import type { Initiative, BattleMap } from '@/types/live-session';

interface UseAppStateResult {
  appState: AppState;
  stage: CampaignStage;
  isCombatActive: boolean;
  hasTacticalMap: boolean;
  initiative: Initiative | undefined;
  battleMap: BattleMap | undefined;
}

export function useAppState(campaignId: string): UseAppStateResult {
  const { stage } = useCampaignStage(campaignId);
  const { data: initiative } = useInitiative(campaignId);
  const { data: battleMap } = useBattleMap(campaignId);

  const isCombatActive = !!initiative?.isActive;
  const hasTacticalMap = !!(
    battleMap?.isActive ||
    (battleMap?.tokens?.length ?? 0) > 0 ||
    !!battleMap?.backgroundImageUrl
  );

  let appState: AppState;
  if (stage === 'prep') {
    appState = 'prep';
  } else if (stage === 'recap') {
    appState = 'recap';
  } else if (isCombatActive) {
    appState = 'combat';
  } else {
    appState = 'narrative';
  }

  return { appState, stage, isCombatActive, hasTacticalMap, initiative, battleMap };
}
