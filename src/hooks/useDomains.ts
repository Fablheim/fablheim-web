import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { domainsApi } from '@/api/domains';
import type { CreateDomainPayload, UpdateDomainPayload } from '@/types/campaign';

export function useDomains(campaignId: string) {
  return useQuery({
    queryKey: ['domains', campaignId],
    queryFn: () => domainsApi.list(campaignId),
    enabled: !!campaignId,
  });
}

export function useDomain(campaignId: string, domainId: string) {
  return useQuery({
    queryKey: ['domains', campaignId, domainId],
    queryFn: () => domainsApi.get(campaignId, domainId),
    enabled: !!campaignId && !!domainId,
  });
}

/** Find a domain by its linked location entity ID */
export function useDomainByLocation(campaignId: string, locationEntityId: string | undefined) {
  const { data: domains, ...rest } = useDomains(campaignId);
  const domain = domains?.find((d) => d.locationEntityId === locationEntityId) ?? null;
  return { data: domain, domains, ...rest };
}

export function useCreateDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateDomainPayload }) =>
      domainsApi.create(campaignId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['domains', v.campaignId] });
    },
  });
}

export function useUpdateDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, domainId, data }: { campaignId: string; domainId: string; data: UpdateDomainPayload }) =>
      domainsApi.update(campaignId, domainId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['domains', v.campaignId] });
    },
  });
}

export function useDeleteDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, domainId }: { campaignId: string; domainId: string }) =>
      domainsApi.delete(campaignId, domainId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['domains', v.campaignId] });
    },
  });
}

export function useAdjustResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, domainId, data }: { campaignId: string; domainId: string; data: { resourceName: string; delta: number } }) =>
      domainsApi.adjustResource(campaignId, domainId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['domains', v.campaignId] });
    },
  });
}

export function useAdjustPopulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, domainId, delta }: { campaignId: string; domainId: string; delta: number }) =>
      domainsApi.adjustPopulation(campaignId, domainId, delta),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['domains', v.campaignId] });
    },
  });
}

export function useBuildUpgrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, domainId, data }: { campaignId: string; domainId: string; data: { categoryId: string; tier: number } }) =>
      domainsApi.buildUpgrade(campaignId, domainId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['domains', v.campaignId] });
    },
  });
}

export function useRecruitSpecialist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, domainId, data }: { campaignId: string; domainId: string; data: { specialistId: string; name?: string; npcEntityId?: string } }) =>
      domainsApi.recruitSpecialist(campaignId, domainId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['domains', v.campaignId] });
    },
  });
}
