import { api } from './client';
import type {
  RollDiceRequest,
  RollResult,
  DiceRollRecord,
  Initiative,
  AddInitiativeEntryRequest,
  UpdateInitiativeEntryRequest,
  BattleMap,
  AddMapTokenRequest,
  UpdateMapTokenRequest,
} from '@/types/live-session';

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
    body: Partial<Pick<BattleMap, 'name' | 'backgroundImageUrl' | 'gridWidth' | 'gridHeight' | 'gridSquareSizeFt'>>,
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
};
