import { api } from './client';
import type {
  DowntimeActivity,
  CreateDowntimePayload,
  UpdateDowntimePayload,
} from '@/types/downtime';

export const downtimeApi = {
  list: async (campaignId: string): Promise<DowntimeActivity[]> => {
    const { data } = await api.get<DowntimeActivity[]>(
      `/campaigns/${campaignId}/downtime`,
    );
    return data;
  },

  create: async (
    campaignId: string,
    body: CreateDowntimePayload,
  ): Promise<DowntimeActivity> => {
    const { data } = await api.post<DowntimeActivity>(
      `/campaigns/${campaignId}/downtime`,
      body,
    );
    return data;
  },

  update: async (
    campaignId: string,
    activityId: string,
    body: UpdateDowntimePayload,
  ): Promise<DowntimeActivity> => {
    const { data } = await api.patch<DowntimeActivity>(
      `/campaigns/${campaignId}/downtime/${activityId}`,
      body,
    );
    return data;
  },

  remove: async (campaignId: string, activityId: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/downtime/${activityId}`);
  },
};
