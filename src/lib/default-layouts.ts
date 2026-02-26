import type { MosaicNode } from 'react-mosaic-component';
import type { PanelId, CampaignStage } from '@/types/workspace';

const PREP_LAYOUT: MosaicNode<PanelId> = {
  direction: 'row',
  first: 'campaign-overview',
  second: 'encounter-prep',
  splitPercentage: 40,
};

const LIVE_LAYOUT: MosaicNode<PanelId> = {
  direction: 'row',
  first: 'initiative',
  second: {
    direction: 'row',
    first: {
      direction: 'column',
      first: 'map',
      second: 'session-notes',
      splitPercentage: 60,
    },
    second: {
      direction: 'column',
      first: 'party-overview',
      second: 'chat',
      splitPercentage: 40,
    },
    splitPercentage: 70,
  },
  splitPercentage: 20,
};

const RECAP_LAYOUT: MosaicNode<PanelId> = {
  direction: 'row',
  first: 'session-recap',
  second: {
    direction: 'column',
    first: 'session-statistics',
    second: 'session-notes-recap',
    splitPercentage: 50,
  },
  splitPercentage: 55,
};

const DEFAULT_LAYOUTS: Record<CampaignStage, MosaicNode<PanelId>> = {
  prep: PREP_LAYOUT,
  live: LIVE_LAYOUT,
  recap: RECAP_LAYOUT,
};

export function getDefaultLayout(stage: CampaignStage): MosaicNode<PanelId> {
  return structuredClone(DEFAULT_LAYOUTS[stage]);
}
