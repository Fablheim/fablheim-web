import { api } from './client';
import type {
  CampaignContext,
  UpdateCampaignContextPayload,
} from '@/types/campaign-context';

export const campaignContextApi = {
  get: async (campaignId: string): Promise<CampaignContext> => {
    const { data } = await api.get<CampaignContext>(
      `/campaigns/${campaignId}/context`,
    );
    return data;
  },

  update: async (
    campaignId: string,
    payload: UpdateCampaignContextPayload,
  ): Promise<CampaignContext> => {
    const { data } = await api.patch<CampaignContext>(
      `/campaigns/${campaignId}/context`,
      payload,
    );
    return data;
  },
};
