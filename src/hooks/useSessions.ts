import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '@/api/sessions';
import type { CreateSessionRequest, UpdateSessionRequest } from '@/types/campaign';

export function useSessions(campaignId: string) {
  return useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: () => sessionsApi.list(campaignId),
    enabled: !!campaignId,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['sessions', 'detail', id],
    queryFn: () => sessionsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSessionRequest) => sessionsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.campaignId] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionRequest }) =>
      sessionsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'detail', data._id] });
    },
  });
}

export function useGenerateAISummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, sessionId }: { campaignId: string; sessionId: string }) =>
      sessionsApi.generateAISummary(campaignId, sessionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'detail', data._id] });
    },
  });
}
