import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { relationshipsApi } from '@/api/relationships';
import type {
  CreateRelationshipPayload,
  UpdateRelationshipPayload,
  AddRelationshipEventPayload,
} from '@/types/relationship';

export function useRelationships(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'relationships'],
    queryFn: () => relationshipsApi.list(campaignId),
    enabled: !!campaignId,
  });
}

export function useCreateRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: string;
      data: CreateRelationshipPayload;
    }) => relationshipsApi.create(campaignId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', v.campaignId, 'relationships'],
      });
    },
  });
}

export function useUpdateRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      relationshipId,
      data,
    }: {
      campaignId: string;
      relationshipId: string;
      data: UpdateRelationshipPayload;
    }) => relationshipsApi.update(campaignId, relationshipId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', v.campaignId, 'relationships'],
      });
    },
  });
}

export function useAddRelationshipEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      relationshipId,
      data,
    }: {
      campaignId: string;
      relationshipId: string;
      data: AddRelationshipEventPayload;
    }) => relationshipsApi.addEvent(campaignId, relationshipId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', v.campaignId, 'relationships'],
      });
    },
  });
}

export function useDeleteRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      relationshipId,
    }: {
      campaignId: string;
      relationshipId: string;
    }) => relationshipsApi.remove(campaignId, relationshipId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', v.campaignId, 'relationships'],
      });
    },
  });
}
