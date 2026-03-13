import { api } from './client';
import type {
  CustomModule,
  CreateCustomModulePayload,
  UpdateCustomModulePayload,
  ResolvedCustomBlocks,
} from '@/types/custom-module';

export const customModulesApi = {
  list: async (campaignId: string): Promise<CustomModule[]> => {
    const { data } = await api.get<CustomModule[]>(
      `/campaigns/${campaignId}/custom-modules`,
    );
    return data;
  },

  get: async (campaignId: string, id: string): Promise<CustomModule> => {
    const { data } = await api.get<CustomModule>(
      `/campaigns/${campaignId}/custom-modules/${id}`,
    );
    return data;
  },

  create: async (
    campaignId: string,
    body: CreateCustomModulePayload,
  ): Promise<CustomModule> => {
    const { data } = await api.post<CustomModule>(
      `/campaigns/${campaignId}/custom-modules`,
      body,
    );
    return data;
  },

  update: async (
    campaignId: string,
    id: string,
    body: UpdateCustomModulePayload,
  ): Promise<CustomModule> => {
    const { data } = await api.patch<CustomModule>(
      `/campaigns/${campaignId}/custom-modules/${id}`,
      body,
    );
    return data;
  },

  remove: async (campaignId: string, id: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/custom-modules/${id}`);
  },

  getResolved: async (campaignId: string): Promise<ResolvedCustomBlocks> => {
    const { data } = await api.get<ResolvedCustomBlocks>(
      `/campaigns/${campaignId}/custom-modules/resolved`,
    );
    return data;
  },
};
