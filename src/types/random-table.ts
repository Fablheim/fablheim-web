export interface TableEntry {
  text: string;
  weight: number;
}

export interface RandomTable {
  _id: string;
  name: string;
  category: string;
  description: string;
  entries: TableEntry[];
  isBuiltIn: boolean;
}

export interface RollResult {
  tableId: string;
  tableName: string;
  result: string;
}

export interface CreateRandomTablePayload {
  name: string;
  category?: string;
  description?: string;
  entries: Array<{ text: string; weight?: number }>;
}

export type UpdateRandomTablePayload = Partial<CreateRandomTablePayload>;
