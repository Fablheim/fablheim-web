import { api } from './client';
import type { Domain, CreateDomainPayload, UpdateDomainPayload } from '@/types/campaign';

export const domainsApi = {
  list: async (campaignId: string): Promise<Domain[]> => {
    const { data } = await api.get<Domain[]>(`/campaigns/${campaignId}/domains`);
    return data;
  },

  get: async (campaignId: string, id: string): Promise<Domain> => {
    const { data } = await api.get<Domain>(`/campaigns/${campaignId}/domains/${id}`);
    return data;
  },

  create: async (campaignId: string, body: CreateDomainPayload): Promise<Domain> => {
    const { data } = await api.post<Domain>(`/campaigns/${campaignId}/domains`, body);
    return data;
  },

  update: async (campaignId: string, id: string, body: UpdateDomainPayload): Promise<Domain> => {
    const { data } = await api.patch<Domain>(`/campaigns/${campaignId}/domains/${id}`, body);
    return data;
  },

  delete: async (campaignId: string, id: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/domains/${id}`);
  },

  adjustResource: async (
    campaignId: string,
    domainId: string,
    body: { resourceName: string; delta: number },
  ): Promise<Domain> => {
    const { data } = await api.post<Domain>(
      `/campaigns/${campaignId}/domains/${domainId}/resources/adjust`,
      body,
    );
    return data;
  },

  adjustPopulation: async (
    campaignId: string,
    domainId: string,
    delta: number,
  ): Promise<Domain> => {
    const { data } = await api.post<Domain>(
      `/campaigns/${campaignId}/domains/${domainId}/population/adjust`,
      { delta },
    );
    return data;
  },

  buildUpgrade: async (
    campaignId: string,
    domainId: string,
    body: { categoryId: string; tier: number },
  ): Promise<Domain> => {
    const { data } = await api.post<Domain>(
      `/campaigns/${campaignId}/domains/${domainId}/upgrades/build`,
      body,
    );
    return data;
  },

  recruitSpecialist: async (
    campaignId: string,
    domainId: string,
    body: { specialistId: string; name?: string; npcEntityId?: string },
  ): Promise<Domain> => {
    const { data } = await api.post<Domain>(
      `/campaigns/${campaignId}/domains/${domainId}/specialists/recruit`,
      body,
    );
    return data;
  },
};
