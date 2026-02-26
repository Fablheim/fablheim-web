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

export function useSession(campaignId: string, id: string) {
  return useQuery({
    queryKey: ['sessions', 'detail', id],
    queryFn: () => sessionsApi.get(campaignId, id),
    enabled: !!campaignId && !!id,
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
    mutationFn: ({
      campaignId,
      id,
      data,
    }: {
      campaignId: string;
      id: string;
      data: UpdateSessionRequest;
    }) => sessionsApi.update(campaignId, id, data),
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

// ── Session Lifecycle Hooks ──────────────────────────────────

export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, sessionId }: { campaignId: string; sessionId: string }) =>
      sessionsApi.startSession(campaignId, sessionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'detail', data._id] });
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      sessionId,
      generateRecap,
    }: {
      campaignId: string;
      sessionId: string;
      generateRecap?: boolean;
    }) => sessionsApi.endSession(campaignId, sessionId, generateRecap),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'detail', data._id] });
    },
  });
}

export function useSessionRecap(campaignId: string, sessionId: string, enabled = true) {
  return useQuery({
    queryKey: ['session-recap', sessionId],
    queryFn: () => sessionsApi.getRecap(campaignId, sessionId),
    enabled: !!campaignId && !!sessionId && enabled,
  });
}

export function useRegenerateRecap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, sessionId }: { campaignId: string; sessionId: string }) =>
      sessionsApi.regenerateRecap(campaignId, sessionId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['session-recap', vars.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'detail', vars.sessionId] });
    },
  });
}
