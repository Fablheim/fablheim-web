import type { DynamicSchemaData } from './campaign';

// ── Dice Rolling ─────────────────────────────────────────────

export interface RollDiceRequest {
  dice: string;          // e.g. "2d20+5"
  advantage?: boolean;
  disadvantage?: boolean;
  purpose?: string;      // e.g. "Attack roll"
  isPrivate?: boolean;
}

export interface RollResult {
  dice: string;
  rolls: number[];
  total: number;
  modifier: number;
  advantage?: boolean;
  disadvantage?: boolean;
  critical?: 'success' | 'failure';
}

export interface DiceRollRecord {
  _id: string;
  campaignId: string;
  userId: string;
  username: string;
  result: RollResult;
  purpose?: string;
  isPrivate: boolean;
  createdAt: string;
}

// ── WebSocket Events ─────────────────────────────────────────

export type HopeFearOutcome = 'with-hope' | 'with-fear' | 'critical-success';

export interface HopeFearRollResult {
  hopeDie: number;
  fearDie: number;
  total: number;
  modifier: number;
  outcome: HopeFearOutcome;
  withHope: boolean;
  withFear: boolean;
  isCritical: boolean;
  allDice: number[];
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface HopeFearRollRequest {
  modifier?: number;
  advantage?: boolean;
  disadvantage?: boolean;
  purpose?: string;
  isPrivate?: boolean;
}

// ── PbtA 2d6 ──────────────────────────────────────────────────

export interface Pbta2d6Band {
  min?: number;
  max?: number;
  label: string;
  description: string;
}

export interface Pbta2d6Result {
  die1: number;
  die2: number;
  total: number;
  modifier: number;
  finalTotal: number;
  band: { label: string; description: string };
}

export interface PbtaRollRequest {
  modifier?: number;
  purpose?: string;
  isPrivate?: boolean;
  bands?: Pbta2d6Band[];
}

// ── Dice Pool ─────────────────────────────────────────────────

export interface DicePoolResult {
  dice: number[];
  explodedDice: number[];
  allDice: number[];
  successes: number;
  isSuccess: boolean;
}

export interface DicePoolRollRequest {
  dieSize: 6 | 10;
  count: number;
  successThreshold: number;
  exploding: boolean;
  purpose?: string;
  isPrivate?: boolean;
}

export interface DiceRolledEvent {
  userId: string;
  username: string;
  result: RollResult;
  purpose?: string;
  timestamp: string;
}

export interface HopeFearRolledEvent {
  userId: string;
  username: string;
  result: HopeFearRollResult;
  purpose?: string;
  timestamp: string;
}

export interface InitiativeUpdatedEvent {
  action: 'entry-added' | 'entry-updated' | 'entry-removed' | 'combat-started' | 'turn-advanced' | 'combat-ended';
  entryId?: string;
  initiative: Initiative;
  stateVersion?: number;
}

// ── Sync / Reconnection ──────────────────────────────────────

export interface SyncResponse {
  connectedUsers: ConnectedUser[];
  sessionState: { isActive: boolean; startedAt?: string; pausedAt?: string; currentTurn?: string; activeScene?: string };
  initiative: Initiative | null;
  missedMessages: import('@/types/campaign').ChatMessage[];
  currentStateVersion: number;
  desynced: boolean;
}

// ── Initiative ───────────────────────────────────────────────

export interface ConditionEntry {
  id: string;
  name: string;
  durationRounds?: number;
  remainingRounds?: number;
  source?: string;
  saveDC?: number;
  saveAbility?: string;
  endsOn?: 'start' | 'end';
  appliedRound?: number;
}

export interface InitiativeEntry {
  id: string;
  type: 'pc' | 'npc' | 'monster' | 'other';
  name: string;
  initiativeRoll: number;
  initiativeBonus: number;
  currentHp?: number;
  maxHp?: number;
  ac?: number;
  conditions?: ConditionEntry[];
  notes?: string;
  characterId?: string;
  isHidden?: boolean;
  imageUrl?: string;
  tempHp?: number;
  resistances?: string[];
  vulnerabilities?: string[];
  immunities?: string[];
  isConcentrating?: boolean;
  concentrationSpell?: string;
  deathSaves?: {
    successes: number;
    failures: number;
  } | null;
  systemData?: DynamicSchemaData;
  legendaryActions?: { total: number; remaining: number };
  lairInitiative?: number;
  turnState?: 'normal' | 'readied' | 'delayed';
  readiedAction?: { action: string; trigger: string };
  isSurprised?: boolean;
}

export interface AddInitiativeEntryRequest {
  type: 'pc' | 'npc' | 'monster' | 'other';
  name: string;
  initiativeRoll: number;
  initiativeBonus: number;
  currentHp?: number;
  maxHp?: number;
  ac?: number;
  conditions?: ConditionEntry[];
  notes?: string;
  characterId?: string;
  isHidden?: boolean;
  imageUrl?: string;
  systemData?: DynamicSchemaData;
  legendaryActions?: { total: number; remaining: number };
  lairInitiative?: number;
  isSurprised?: boolean;
}

export interface UpdateInitiativeEntryRequest {
  initiativeRoll?: number;
  currentHp?: number;
  maxHp?: number;
  tempHp?: number;
  ac?: number;
  conditions?: ConditionEntry[];
  notes?: string;
  resistances?: string[];
  vulnerabilities?: string[];
  immunities?: string[];
  isConcentrating?: boolean;
  concentrationSpell?: string;
  isHidden?: boolean;
  systemData?: DynamicSchemaData;
  legendaryActions?: { total: number; remaining: number };
  lairInitiative?: number;
  turnState?: 'normal' | 'readied' | 'delayed';
  readiedAction?: { action: string; trigger: string };
  isSurprised?: boolean;
}

export interface UpdateDeathSavesRequest {
  successes?: number;
  failures?: number;
  clear?: boolean;
}

// ── GM Resource Pool (gm-resource-pool module) ──────────────
export interface GmResource {
  id: string;
  name: string;
  current: number;
  max: number;
  color?: string;
}

// ── Scene Aspects (situation-aspects module) ────────────────
export interface SceneAspect {
  id: string;
  name: string;
  freeInvokes: number;
  isBoost: boolean;
  isHidden: boolean;
  source?: string;
  createdRound?: number;
}

// ── Countdown Clocks (countdown-clocks module) ──────────────
export interface CountdownClock {
  id: string;
  name: string;
  segments: number;
  filled: number;
  isHidden: boolean;
  color?: string;
  description?: string;
}

export interface Initiative {
  _id: string;
  campaignId: string;
  sessionId?: string;
  entries: InitiativeEntry[];
  currentTurn: number;
  round: number;
  isActive: boolean;
  startedAt?: string;
  lastUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
  gmResources?: GmResource[];
  sceneAspects?: SceneAspect[];
  countdowns?: CountdownClock[];
}

// ── Battle Map ──────────────────────────────────────────────

export interface MapToken {
  id: string;
  name: string;
  type: 'pc' | 'npc' | 'monster' | 'other';
  x: number;
  y: number;
  size: number;
  color: string;
  characterId?: string;
  initiativeEntryId?: string;
  imageUrl?: string;
  isHidden?: boolean;
}

export interface BattleMap {
  _id: string;
  campaignId: string;
  name: string;
  backgroundImageUrl?: string;
  sourceEncounterId?: string;
  sourceEncounterName?: string;
  gridWidth: number;
  gridHeight: number;
  gridSquareSizeFt: number;
  gridOpacity?: number;
  snapToGrid?: boolean;
  gridOffsetX?: number;
  gridOffsetY?: number;
  tokens: MapToken[];
  aoeOverlays: import('@/types/combat-rules').AoEOverlay[];
  isActive: boolean;
}

export interface MapUpdatedEvent {
  action: string;
  map: BattleMap;
}

export interface AddMapTokenRequest {
  name: string;
  type: 'pc' | 'npc' | 'monster' | 'other';
  x: number;
  y: number;
  size?: number;
  color?: string;
  characterId?: string;
  imageUrl?: string;
  isHidden?: boolean;
}

export interface UpdateMapTokenRequest {
  name?: string;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  characterId?: string;
  imageUrl?: string;
  isHidden?: boolean;
}

// ── Connected Users ──────────────────────────────────────────

export interface ConnectedUser {
  userId: string;
  username: string;
  socketId: string;
  role: 'dm' | 'player';
  connectedAt: string;
  lastActivity: string;
}
