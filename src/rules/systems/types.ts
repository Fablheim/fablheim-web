import type { Character } from '@/types/campaign';
import type { EnemyAttack, EnemyTemplate } from '@/types/creature-template';
import type { RollDiceRequest, RollResult, HopeFearRollRequest, HopeFearRollResult, InitiativeEntry } from '@/types/live-session';

export type SystemActionKind = 'attack' | 'ability' | 'skill' | 'custom';

export interface SystemAction {
  id: string;
  label: string;
  kind: SystemActionKind;
  summary?: string;
  rollLabel?: string;
  rollPayload: unknown;
  tags?: string[];
  disabledReason?: string;
}

export interface SystemActionRollOptions {
  mapPenalty?: number;
  modifier?: number;
  mode?: 'roll' | 'damage';
}

export type DegreeOfSuccess = 'critical-success' | 'success' | 'failure' | 'critical-failure';

export interface SystemActionRollOutcome {
  primaryTotal?: number;
  secondaryTotal?: number;
  message?: string;
  degree?: DegreeOfSuccess;
  naturalRoll?: number;
}

export interface SystemActionContext {
  entry: InitiativeEntry;
  character?: Character | null;
  template?: EnemyTemplate | null;
  legacyNpcAttacks?: EnemyAttack[];
  systemKey?: string | null;
}

export interface SystemActionRollContext extends SystemActionContext {
  rollDice: (request: RollDiceRequest) => Promise<RollResult>;
  rollHopeFear?: (request: HopeFearRollRequest) => Promise<HopeFearRollResult>;
  isPrivate: boolean;
  options?: SystemActionRollOptions;
}

export interface SystemActionAdapter {
  toSystemActions: (context: SystemActionContext) => SystemAction[];
  performActionRoll: (
    action: SystemAction,
    context: SystemActionRollContext,
  ) => Promise<SystemActionRollOutcome>;
}
