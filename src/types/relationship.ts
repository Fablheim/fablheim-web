export interface RelationshipEvent {
  id: string;
  description: string;
  trustDelta: number;
  sessionNumber?: number;
  date: string;
}

export interface PartyRelationship {
  _id: string;
  campaignId: string;
  characterAId: string;
  characterBId: string;
  trust: number;
  label: string;
  notes: string;
  events: RelationshipEvent[];
}

export interface CreateRelationshipPayload {
  characterAId: string;
  characterBId: string;
  trust?: number;
  label?: string;
  notes?: string;
}

export interface UpdateRelationshipPayload {
  trust?: number;
  label?: string;
  notes?: string;
}

export interface AddRelationshipEventPayload {
  description: string;
  trustDelta?: number;
  sessionNumber?: number;
}
