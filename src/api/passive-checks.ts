import { api } from './client';

export interface PassiveCheckResult {
  characterId: string;
  characterName: string;
  passiveScore: number;
  passed: boolean;
}

export interface PassiveCheck {
  _id: string;
  campaignId: string;
  sessionId?: string;
  checkType: 'perception' | 'insight' | 'investigation';
  dc: number;
  description: string;
  location: string;
  results: PassiveCheckResult[];
  status: 'pending' | 'revealed' | 'archived';
  createdByDmId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PassiveCheckSummary extends PassiveCheck {
  passCount: number;
  failCount: number;
}

export interface CreatePassiveCheckData {
  checkType: 'perception' | 'insight' | 'investigation';
  dc: number;
  description?: string;
  location?: string;
  sessionId?: string;
}

export interface UpdatePassiveCheckData {
  status?: 'pending' | 'revealed' | 'archived';
}

export const passiveChecksApi = {
  list: async (campaignId: string, status?: string): Promise<PassiveCheck[]> => {
    const { data } = await api.get<PassiveCheck[]>(
      `/campaigns/${campaignId}/passive-checks`,
      { params: status ? { status } : undefined },
    );
    return data;
  },

  getById: async (campaignId: string, id: string): Promise<PassiveCheck> => {
    const { data } = await api.get<PassiveCheck>(
      `/campaigns/${campaignId}/passive-checks/${id}`,
    );
    return data;
  },

  getSummary: async (campaignId: string, id: string): Promise<PassiveCheckSummary> => {
    const { data } = await api.get<PassiveCheckSummary>(
      `/campaigns/${campaignId}/passive-checks/${id}/summary`,
    );
    return data;
  },

  create: async (campaignId: string, body: CreatePassiveCheckData): Promise<PassiveCheck> => {
    const { data } = await api.post<PassiveCheck>(
      `/campaigns/${campaignId}/passive-checks`,
      body,
    );
    return data;
  },

  update: async (
    campaignId: string,
    id: string,
    body: UpdatePassiveCheckData,
  ): Promise<PassiveCheck> => {
    const { data } = await api.patch<PassiveCheck>(
      `/campaigns/${campaignId}/passive-checks/${id}`,
      body,
    );
    return data;
  },

  remove: async (campaignId: string, id: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/passive-checks/${id}`);
  },
};
