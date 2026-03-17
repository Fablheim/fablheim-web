import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentRegistryApi, type ContentSearchQuery } from '@/api/content-registry';
import type {
  CreateContentEntryPayload,
  UpdateContentEntryPayload,
} from '@/types/content-entry';

export function useContentSearch(query: ContentSearchQuery) {
  return useQuery({
    queryKey: ['content-registry', 'search', query],
    queryFn: () => contentRegistryApi.search(query),
    enabled: !!(query.q || query.contentType || query.campaignId),
  });
}

export function useContentEntry(id: string) {
  return useQuery({
    queryKey: ['content-registry', id],
    queryFn: () => contentRegistryApi.findById(id),
    enabled: !!id,
  });
}

export function useCampaignContent(campaignId: string, type?: string) {
  return useQuery({
    queryKey: ['content-registry', 'campaign', campaignId, type],
    queryFn: () => contentRegistryApi.findByCampaign(campaignId, type),
    enabled: !!campaignId,
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateContentEntryPayload }) =>
      contentRegistryApi.create(campaignId, data),
    onSuccess: (_result, { campaignId }) => {
      void queryClient.invalidateQueries({ queryKey: ['content-registry', 'campaign', campaignId] });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: UpdateContentEntryPayload; campaignId: string }) =>
      contentRegistryApi.update(vars.id, vars.data),
    onSuccess: (_result, { campaignId }) => {
      void queryClient.invalidateQueries({ queryKey: ['content-registry', 'campaign', campaignId] });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; campaignId: string }) =>
      contentRegistryApi.delete(vars.id),
    onSuccess: (_result, { campaignId }) => {
      void queryClient.invalidateQueries({ queryKey: ['content-registry', 'campaign', campaignId] });
    },
  });
}
