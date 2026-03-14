export type ActivityType =
  | 'crafting'
  | 'training'
  | 'carousing'
  | 'research'
  | 'working'
  | 'recuperating'
  | 'travel'
  | 'faction_work'
  | 'business'
  | 'other';

export type ActivityStatus = 'planned' | 'active' | 'completed' | 'cancelled';
export type DowntimeParticipantType = 'character' | 'npc' | 'companion';

export interface DowntimeLinks {
  sessionId?: string;
  locationId?: string;
  npcId?: string;
  factionId?: string;
  questId?: string;
  randomTableId?: string;
}

export interface DowntimeActivity {
  _id: string;
  campaignId: string;
  participantId: string;
  participantType: DowntimeParticipantType;
  participantName?: string;
  name: string;
  type: ActivityType;
  status: ActivityStatus;
  description: string;
  startDate?: { year: number; month: number; day: number } | null;
  durationDays: number;
  progressDays: number;
  cost: number;
  locationId?: string;
  notes?: string;
  materials: string;
  outcome: string;
  links?: DowntimeLinks;
  complicationTableId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDowntimePayload {
  participantId: string;
  participantType: DowntimeParticipantType;
  participantName?: string;
  name: string;
  type?: ActivityType;
  status?: ActivityStatus;
  description?: string;
  startDate?: { year: number; month: number; day: number } | null;
  durationDays?: number;
  progressDays?: number;
  cost?: number;
  locationId?: string;
  notes?: string;
  materials?: string;
  outcome?: string;
  links?: DowntimeLinks;
  complicationTableId?: string;
}

export type UpdateDowntimePayload = Partial<Omit<CreateDowntimePayload, 'participantId' | 'participantType'>>;

export interface AdvanceDowntimePayload {
  days: number;
}
