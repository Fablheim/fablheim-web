export type ActivityType =
  | 'crafting'
  | 'training'
  | 'carousing'
  | 'research'
  | 'working'
  | 'recuperating'
  | 'other';

export type ActivityStatus = 'planned' | 'in_progress' | 'completed';

export interface DowntimeActivity {
  _id: string;
  campaignId: string;
  characterId: string;
  name: string;
  type: ActivityType;
  status: ActivityStatus;
  description: string;
  durationDays: number;
  cost: number;
  materials: string;
  outcome: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDowntimePayload {
  characterId: string;
  name: string;
  type?: ActivityType;
  status?: ActivityStatus;
  description?: string;
  durationDays?: number;
  cost?: number;
  materials?: string;
  outcome?: string;
  sessionId?: string;
}

export type UpdateDowntimePayload = Partial<Omit<CreateDowntimePayload, 'characterId'>>;
