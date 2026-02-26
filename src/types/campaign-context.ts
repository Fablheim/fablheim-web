export interface ToneSliders {
  gritty: number;
  humorous: number;
  heroic: number;
  horror: number;
}

export interface KeyLocation {
  name: string;
  description: string;
  importance: 'major' | 'minor' | 'background';
}

export interface KeyFaction {
  name: string;
  goals: string;
  power: 'dominant' | 'major' | 'minor';
  attitude: string;
}

export interface KeyNPC {
  name: string;
  role: string;
  importance: 'critical' | 'important' | 'supporting';
  secrets: string[];
}

export interface PlotThread {
  title: string;
  description: string;
  status: 'active' | 'resolved' | 'failed' | 'unknown';
  priority: 'urgent' | 'important' | 'background';
}

export interface PartyRelationship {
  faction: string;
  status: 'hostile' | 'friendly' | 'neutral' | 'unknown';
}

export interface PartyContext {
  reputation: string;
  relationships: PartyRelationship[];
  knownSecrets: string[];
}

export interface DMPreferences {
  narrativeVoice: string;
  detailLevel: 'minimal' | 'moderate' | 'verbose';
  emphasize: string[];
}

export interface CampaignContext {
  _id: string;
  campaignId: string;
  settingOverview: string;
  themes: string[];
  toneSliders: ToneSliders;
  houseRules: string;
  keyLocations: KeyLocation[];
  keyFactions: KeyFaction[];
  keyNPCs: KeyNPC[];
  currentSituation: string;
  plotThreads: PlotThread[];
  partyContext: PartyContext;
  dmPreferences: DMPreferences;
  createdAt: string;
  updatedAt: string;
}

export type UpdateCampaignContextPayload = Partial<
  Omit<CampaignContext, '_id' | 'campaignId' | 'createdAt' | 'updatedAt'>
>;
