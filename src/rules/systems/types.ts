import type { Character } from '@/types/campaign';
import type { EnemyAttack, EnemyTemplate } from '@/types/enemy-template';
import type { RollDiceRequest, RollResult, InitiativeEntry } from '@/types/live-session';

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

export interface SystemActionRollOutcome {
  primaryTotal?: number;
  secondaryTotal?: number;
  message?: string;
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
