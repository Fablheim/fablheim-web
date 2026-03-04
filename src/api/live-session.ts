import { api } from './client';
import type {
  RollDiceRequest,
  RollResult,
  DiceRollRecord,
  Initiative,
  AddInitiativeEntryRequest,
  UpdateInitiativeEntryRequest,
  UpdateDeathSavesRequest,
  BattleMap,
  AddMapTokenRequest,
  UpdateMapTokenRequest,
} from '@/types/live-session';
import type {
  CombatRulesProfile,
  AddAoEOverlayRequest,
  UpdateAoEOverlayRequest,
} from '@/types/combat-rules';

export const liveSessionApi = {
  // ── Dice ──────────────────────────────────────────────────
  rollDice: async (campaignId: string, body: RollDiceRequest): Promise<RollResult> => {
    const { data } = await api.post<RollResult>(
      `/campaigns/${campaignId}/session/dice/roll`,
      body,
    );
    return data;
  },

  getDiceHistory: async (campaignId: string): Promise<DiceRollRecord[]> => {
    const { data } = await api.get<DiceRollRecord[]>(
      `/campaigns/${campaignId}/session/dice/history`,
    );
    return data;
  },

  // ── Initiative ────────────────────────────────────────────
  getInitiative: async (campaignId: string): Promise<Initiative> => {
    const { data } = await api.get<Initiative>(
      `/campaigns/${campaignId}/session/initiative`,
    );
    return data;
  },

  addInitiativeEntry: async (
    campaignId: string,
    body: AddInitiativeEntryRequest,
  ): Promise<Initiative> => {
    const { data } = await api.post<Initiative>(
      `/campaigns/${campaignId}/session/initiative/entries`,
      body,
    );
    return data;
  },

  updateInitiativeEntry: async (
    campaignId: string,
    entryId: string,
    body: UpdateInitiativeEntryRequest,
  ): Promise<Initiative> => {
    const { data } = await api.patch<Initiative>(
      `/campaigns/${campaignId}/session/initiative/entries/${entryId}`,
      body,
    );
    return data;
  },

  removeInitiativeEntry: async (
    campaignId: string,
    entryId: string,
  ): Promise<void> => {
    await api.delete(
      `/campaigns/${campaignId}/session/initiative/entries/${entryId}`,
    );
  },

  updateDeathSaves: async (
    campaignId: string,
    entryId: string,
    body: UpdateDeathSavesRequest,
  ): Promise<Initiative> => {
    const { data } = await api.patch<Initiative>(
      `/campaigns/${campaignId}/session/initiative/entries/${entryId}/death-saves`,
      body,
    );
    return data;
  },

  startCombat: async (campaignId: string): Promise<Initiative> => {
    const { data } = await api.post<Initiative>(
      `/campaigns/${campaignId}/session/initiative/start`,
    );
    return data;
  },

  nextTurn: async (campaignId: string): Promise<Initiative> => {
    const { data } = await api.post<Initiative>(
      `/campaigns/${campaignId}/session/initiative/next-turn`,
    );
    return data;
  },

  endCombat: async (campaignId: string): Promise<Initiative> => {
    const { data } = await api.post<Initiative>(
      `/campaigns/${campaignId}/session/initiative/end`,
    );
    return data;
  },

  // ── Battle Map ──────────────────────────────────────────
  getMap: async (campaignId: string): Promise<BattleMap> => {
    const { data } = await api.get<BattleMap>(
      `/campaigns/${campaignId}/session/map`,
    );
    return data;
  },

  updateMapSettings: async (
    campaignId: string,
    body: Partial<
      Pick<
        BattleMap,
        | 'name'
        | 'backgroundImageUrl'
        | 'gridWidth'
        | 'gridHeight'
        | 'gridSquareSizeFt'
        | 'gridOpacity'
        | 'snapToGrid'
        | 'gridOffsetX'
        | 'gridOffsetY'
      >
    >,
  ): Promise<BattleMap> => {
    const { data } = await api.patch<BattleMap>(
      `/campaigns/${campaignId}/session/map`,
      body,
    );
    return data;
  },

  addMapToken: async (
    campaignId: string,
    body: AddMapTokenRequest,
  ): Promise<BattleMap> => {
    const { data } = await api.post<BattleMap>(
      `/campaigns/${campaignId}/session/map/tokens`,
      body,
    );
    return data;
  },

  updateMapToken: async (
    campaignId: string,
    tokenId: string,
    body: UpdateMapTokenRequest,
  ): Promise<BattleMap> => {
    const { data } = await api.patch<BattleMap>(
      `/campaigns/${campaignId}/session/map/tokens/${tokenId}`,
      body,
    );
    return data;
  },

  removeMapToken: async (
    campaignId: string,
    tokenId: string,
  ): Promise<void> => {
    await api.delete(
      `/campaigns/${campaignId}/session/map/tokens/${tokenId}`,
    );
  },

  clearMap: async (campaignId: string): Promise<BattleMap> => {
    const { data } = await api.post<BattleMap>(
      `/campaigns/${campaignId}/session/map/clear`,
    );
    return data;
  },

  addAoEOverlay: async (
    campaignId: string,
    body: AddAoEOverlayRequest,
  ): Promise<BattleMap> => {
    const { data } = await api.post<BattleMap>(
      `/campaigns/${campaignId}/session/map/aoe`,
      body,
    );
    return data;
  },

  updateAoEOverlay: async (
    campaignId: string,
    overlayId: string,
    body: UpdateAoEOverlayRequest,
  ): Promise<BattleMap> => {
    const { data } = await api.patch<BattleMap>(
      `/campaigns/${campaignId}/session/map/aoe/${overlayId}`,
      body,
    );
    return data;
  },

  removeAoEOverlay: async (
    campaignId: string,
    overlayId: string,
  ): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/session/map/aoe/${overlayId}`);
  },

  getCombatRules: async (campaignId: string): Promise<CombatRulesProfile> => {
    const { data } = await api.get<CombatRulesProfile>(
      `/campaigns/${campaignId}/session/combat/rules`,
    );
    return normalizeCombatRules(data);
  },
};

// ── Backward compat normalization (correction #10) ──────────
// If a legacy backend returns a v1 shape (no profileVersion), convert it
// to a v2 CombatRulesProfile so the rest of the FE can assume v2 always.

function normalizeCombatRules(raw: any): CombatRulesProfile {
  if (raw.profileVersion === 2) return raw as CombatRulesProfile;

  // Legacy v1 shape: had concentrationModel.enabled, damageTypes[], no profileVersion
  return {
    profileVersion: 2,
    system: raw.system ?? 'dnd5e',
    actionEconomy: raw.actionEconomy ?? {
      slots: [],
      hasMovement: true,
      defaultMovementFt: 30,
    },
    deathStateModel: raw.deathStateModel ?? { type: 'death-saves', config: {} },
    concentrationModel: raw.concentrationModel?.type
      ? raw.concentrationModel
      : {
          type: raw.concentrationModel?.enabled !== false ? 'check-on-damage' : 'disabled',
          config: {
            checkAbility: raw.concentrationModel?.checkAbility ?? 'constitution',
            dcFormula: raw.concentrationModel?.dcFormula ?? 'max(10, floor(damage / 2))',
          },
        },
    damageModel: raw.damageModel?.type
      ? raw.damageModel
      : {
          type: 'categorical' as const,
          config: {
            categories: (raw.damageTypes ?? []).map((dt: any) => ({
              key: dt.key,
              label: dt.label,
            })),
            modifiers: ['resist', 'vulnerable', 'immune'],
          },
        },
    conditions: raw.conditions ?? [],
    aoeShapes: raw.aoeShapes ?? [],
  };
}
