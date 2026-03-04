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

export interface DiceRolledEvent {
  userId: string;
  username: string;
  result: RollResult;
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

export interface InitiativeEntry {
  id: string;
  type: 'pc' | 'npc' | 'monster' | 'other';
  name: string;
  initiativeRoll: number;
  initiativeBonus: number;
  currentHp?: number;
  maxHp?: number;
  ac?: number;
  conditions?: string[];
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
  systemData?: Record<string, any>;
}

export interface AddInitiativeEntryRequest {
  type: 'pc' | 'npc' | 'monster' | 'other';
  name: string;
  initiativeRoll: number;
  initiativeBonus: number;
  currentHp?: number;
  maxHp?: number;
  ac?: number;
  conditions?: string[];
  notes?: string;
  characterId?: string;
  isHidden?: boolean;
  imageUrl?: string;
  systemData?: Record<string, any>;
}

export interface UpdateInitiativeEntryRequest {
  initiativeRoll?: number;
  currentHp?: number;
  maxHp?: number;
  tempHp?: number;
  ac?: number;
  conditions?: string[];
  notes?: string;
  resistances?: string[];
  vulnerabilities?: string[];
  immunities?: string[];
  isConcentrating?: boolean;
  concentrationSpell?: string;
  isHidden?: boolean;
  systemData?: Record<string, any>;
}

export interface UpdateDeathSavesRequest {
  successes?: number;
  failures?: number;
  clear?: boolean;
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
