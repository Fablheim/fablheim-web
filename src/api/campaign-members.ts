import { api } from './client';

export interface CampaignMembership {
  _id: string;
  campaignId: {
    _id: string;
    name: string;
    description: string;
    status: string;
  };
  userId: string;
  role: 'player' | 'co_dm';
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMember {
  _id: string;
  campaignId: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  role: 'player' | 'co_dm';
  createdAt: string;
  updatedAt: string;
}

export const campaignMembersApi = {
  /** Get all campaigns the current user is a member of (as player/co-dm) */
  listMyCampaigns: async (): Promise<CampaignMembership[]> => {
    const { data } = await api.get<CampaignMembership[]>('/campaign-members');
    return data;
  },

  /** Get all members of a specific campaign */
  listByCampaign: async (campaignId: string): Promise<CampaignMember[]> => {
    const { data } = await api.get<CampaignMember[]>(
      `/campaigns/${campaignId}/members`,
    );
    return data;
  },
};
