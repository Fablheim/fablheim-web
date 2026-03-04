export interface CombatRuleActionSlot {
  key: 'action' | 'bonus' | 'reaction' | 'free' | string;
  label: string;
  maxPerTurn: number;
  resetsOnTurnStart: boolean;
}

// ── Typed config shapes (correction #9) ─────────────────────

export interface CategoricalDamageConfig {
  categories: Array<{ key: string; label: string }>;
  modifiers: string[];
}

export interface NumericDamageConfig {
  categories: Array<{ key: string; label: string }>;
  modifiers: string[];
}

export interface AbstractDamageConfig {
  label: string;
}

export type DamageModel =
  | { type: 'categorical'; config: CategoricalDamageConfig }
  | { type: 'numeric'; config: NumericDamageConfig }
  | { type: 'abstract'; config: AbstractDamageConfig };

export type DeathStateModel =
  | { type: 'death-saves'; config: Record<string, unknown> }
  | { type: 'dying-value'; config: { maxDyingValue?: number } }
  | { type: 'stress-track'; config: { physicalBoxes?: number; mentalBoxes?: number; consequenceSlots?: string[] } }
  | { type: 'last-breath'; config: { promptText?: string } }
  | { type: 'none'; config: Record<string, unknown> };

export type ConcentrationModel =
  | { type: 'check-on-damage'; config: { checkAbility: string; dcFormula: string } }
  | { type: 'sustain-action'; config: Record<string, unknown> }
  | { type: 'disabled'; config: Record<string, unknown> };

export interface ConditionDef {
  key: string;
  label: string;
  description: string;
  hasValue?: boolean;
}

// ── Main profile interface ──────────────────────────────────

export interface CombatRulesProfile {
  profileVersion: 2;
  system: string;
  actionEconomy: {
    slots: CombatRuleActionSlot[];
    hasMovement: boolean;
    defaultMovementFt: number;
  };
  deathStateModel: DeathStateModel;
  concentrationModel: ConcentrationModel;
  damageModel: DamageModel;
  conditions: ConditionDef[];
  aoeShapes: Array<{
    key: AoEOverlayShape;
    label: string;
    hasRadius: boolean;
    hasLength: boolean;
    hasWidth: boolean;
    hasAngle: boolean;
  }>;
}

/** @deprecated Use CombatRulesProfile instead */
export type CombatRulesResponse = CombatRulesProfile;

export type AoEOverlayShape =
  | 'sphere'
  | 'cone'
  | 'line'
  | 'cube'
  | 'cylinder'
  | 'emanation'
  | 'burst';

export interface AoEOverlay {
  id: string;
  shape: AoEOverlayShape;
  originX: number;
  originY: number;
  radiusFt?: number;
  lengthFt?: number;
  widthFt?: number;
  angleDeg?: number;
  color: string;
  label?: string;
  createdBy: string;
  isVisible: boolean;
  includedTokenIds?: string[];
  excludedTokenIds?: string[];
}

export interface AddAoEOverlayRequest {
  shape: AoEOverlayShape;
  originX: number;
  originY: number;
  radiusFt?: number;
  lengthFt?: number;
  widthFt?: number;
  angleDeg?: number;
  color: string;
  label?: string;
  isVisible?: boolean;
}

export interface UpdateAoEOverlayRequest {
  shape?: AoEOverlayShape;
  originX?: number;
  originY?: number;
  radiusFt?: number;
  lengthFt?: number;
  widthFt?: number;
  angleDeg?: number;
  color?: string;
  label?: string;
  isVisible?: boolean;
}

export interface DamagePreviewInput {
  amount: number;
  damageType?: string;
  currentHp: number;
  maxHp: number;
  tempHp: number;
  resistances?: string[];
  vulnerabilities?: string[];
  immunities?: string[];
  isConcentrating?: boolean;
}

export interface DamagePreviewResult {
  inputDamage: number;
  adjustedDamage: number;
  finalDamage: number;
  tempHpAbsorbed: number;
  remainingTempHp: number;
  resultingHp: number;
  wasResisted: boolean;
  wasVulnerable: boolean;
  wasImmune: boolean;
  concentrationCheckDC: number | null;
  triggersDeathState: boolean;
}

export interface HealPreviewResult {
  healAmount: number;
  resultingHp: number;
  overheal: number;
}

export interface TempHpPreviewResult {
  inputTempHp: number;
  existingTempHp: number;
  newTempHp: number;
  replaced: boolean;
}
