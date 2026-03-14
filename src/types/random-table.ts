export interface TableEntry {
  text: string;
  weight: number;
}

export type RandomTableSourceType = 'srd' | 'campaign' | 'custom';

export interface RandomTableRow {
  id: string;
  min: number;
  max: number;
  text: string;
}

export interface RandomTableLinks {
  sessionId?: string;
  encounterId?: string;
  worldEntityId?: string;
  downtimeId?: string;
}

export interface RandomTable {
  _id: string;
  name: string;
  category: string;
  description: string;
  diceExpression: string;
  rows: RandomTableRow[];
  sourceType: RandomTableSourceType;
  sourceLabel: string;
  readOnly: boolean;
  links?: RandomTableLinks;
  entries: TableEntry[];
  isBuiltIn: boolean;
}

export interface RollResult {
  tableId: string;
  tableName: string;
  result: string;
  rollTotal?: number;
  matchedRange?: string;
}

export interface CreateRandomTablePayload {
  name: string;
  category?: string;
  description?: string;
  diceExpression?: string;
  sourceType?: Exclude<RandomTableSourceType, 'srd'>;
  links?: RandomTableLinks;
  rows?: Array<{ min: number; max?: number; text: string }>;
  entries: Array<{ text: string; weight?: number }>;
}

export type UpdateRandomTablePayload = Partial<CreateRandomTablePayload>;
