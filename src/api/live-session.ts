import { api } from './client';
import type {
  RollDiceRequest,
  RollResult,
  HopeFearRollRequest,
  HopeFearRollResult,
  PbtaRollRequest,
  Pbta2d6Result,
  DicePoolRollRequest,
  DicePoolResult,
  DiceRollRecord,
  Initiative,
  GmResource,
  SceneAspect,
  CountdownClock,
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

  rollHopeFear: async (campaignId: string, body: HopeFearRollRequest): Promise<HopeFearRollResult> => {
    const { data } = await api.post<HopeFearRollResult>(
      `/campaigns/${campaignId}/session/dice/hope-fear`,
      body,
    );
    return data;
  },

  rollPbta2d6: async (campaignId: string, body: PbtaRollRequest): Promise<Pbta2d6Result> => {
    const { data } = await api.post<Pbta2d6Result>(
      `/campaigns/${campaignId}/session/dice/pbta-2d6`,
      body,
    );
    return data;
  },

  rollDicePool: async (campaignId: string, body: DicePoolRollRequest): Promise<DicePoolResult> => {
    const { data } = await api.post<DicePoolResult>(
      `/campaigns/${campaignId}/session/dice/pool`,
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

  // ── GM Resource Pools ────────────────────────────────────
  getGmResources: async (campaignId: string): Promise<GmResource[]> => {
    const { data } = await api.get<GmResource[]>(
      `/campaigns/${campaignId}/session/gm-resources`,
    );
    return data;
  },

  upsertGmResource: async (campaignId: string, resource: GmResource): Promise<void> => {
    await api.patch(`/campaigns/${campaignId}/session/gm-resources/${resource.id}`, resource);
  },

  adjustGmResource: async (campaignId: string, resourceId: string, delta: number): Promise<void> => {
    await api.patch(`/campaigns/${campaignId}/session/gm-resources/${resourceId}/adjust`, { delta });
  },

  removeGmResource: async (campaignId: string, resourceId: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/session/gm-resources/${resourceId}`);
  },

  // ── Scene Aspects ──────────────────────────────────────
  getSceneAspects: async (campaignId: string): Promise<SceneAspect[]> => {
    const { data } = await api.get<SceneAspect[]>(
      `/campaigns/${campaignId}/session/scene-aspects`,
    );
    return data;
  },

  upsertSceneAspect: async (campaignId: string, aspect: SceneAspect): Promise<void> => {
    await api.patch(`/campaigns/${campaignId}/session/scene-aspects/${aspect.id}`, aspect);
  },

  invokeSceneAspect: async (campaignId: string, aspectId: string): Promise<void> => {
    await api.post(`/campaigns/${campaignId}/session/scene-aspects/${aspectId}/invoke`);
  },

  removeSceneAspect: async (campaignId: string, aspectId: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/session/scene-aspects/${aspectId}`);
  },

  // ── Countdown Clocks ──────────────────────────────────
  getCountdowns: async (campaignId: string): Promise<CountdownClock[]> => {
    const { data } = await api.get<CountdownClock[]>(
      `/campaigns/${campaignId}/session/countdowns`,
    );
    return data;
  },

  upsertCountdown: async (campaignId: string, clock: CountdownClock): Promise<void> => {
    await api.patch(`/campaigns/${campaignId}/session/countdowns/${clock.id}`, clock);
  },

  advanceCountdown: async (campaignId: string, clockId: string, delta?: number): Promise<void> => {
    await api.post(`/campaigns/${campaignId}/session/countdowns/${clockId}/advance`, { delta });
  },

  removeCountdown: async (campaignId: string, clockId: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/session/countdowns/${clockId}`);
  },

  // ── PF2e Dying ─────────────────────────────────────────
  pf2eRecoveryCheck: async (campaignId: string, entryId: string) => {
    const { data } = await api.post<{
      roll: number; dc: number; degree: string;
      dyingValue: number; woundedValue: number; dead: boolean;
    }>(`/campaigns/${campaignId}/session/initiative/entries/${entryId}/pf2e-recovery`);
    return data;
  },

  pf2eSetDying: async (campaignId: string, entryId: string, dyingValue: number, woundedValue?: number): Promise<Initiative> => {
    const { data } = await api.patch<Initiative>(
      `/campaigns/${campaignId}/session/initiative/entries/${entryId}/pf2e-dying`,
      { dyingValue, woundedValue },
    );
    return data;
  },

  // ── Wound Levels ─────────────────────────────────────────
  woundAdvance: async (campaignId: string, entryId: string): Promise<Initiative> => {
    const { data } = await api.post<Initiative>(
      `/campaigns/${campaignId}/session/initiative/entries/${entryId}/wound-advance`,
    );
    return data;
  },

  woundReduce: async (campaignId: string, entryId: string): Promise<Initiative> => {
    const { data } = await api.post<Initiative>(
      `/campaigns/${campaignId}/session/initiative/entries/${entryId}/wound-reduce`,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy v1 shape is untyped
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy untyped data
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
