import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { encountersApi } from '@/api/encounters';
import type {
  CreateEncounterRequest,
  UpdateEncounterRequest,
  AddEncounterTokenRequest,
  UpdateEncounterTokenRequest,
  SaveAIEncounterRequest,
  LoadEncounterRequest,
} from '@/types/encounter';

// ── Queries ──────────────────────────────────────────────────

export function useEncounters(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['encounters', campaignId],
    queryFn: () => encountersApi.list(campaignId!),
    enabled: !!campaignId,
  });
}

export function useEncounter(
  campaignId: string | undefined,
  encounterId: string | undefined,
) {
  return useQuery({
    queryKey: ['encounters', campaignId, encounterId],
    queryFn: () => encountersApi.get(campaignId!, encounterId!),
    enabled: !!campaignId && !!encounterId,
  });
}

// ── CRUD Mutations ──────────────────────────────────────────

export function useCreateEncounter(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEncounterRequest) =>
      encountersApi.create(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounters', campaignId] });
    },
  });
}

export function useUpdateEncounter(campaignId: string, encounterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateEncounterRequest) =>
      encountersApi.update(campaignId, encounterId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['encounters', campaignId, encounterId],
        data,
      );
      queryClient.invalidateQueries({ queryKey: ['encounters', campaignId] });
    },
  });
}

export function useDeleteEncounter(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (encounterId: string) =>
      encountersApi.remove(campaignId, encounterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounters', campaignId] });
    },
  });
}

// ── Token Mutations ─────────────────────────────────────────

export function useAddEncounterToken(
  campaignId: string,
  encounterId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddEncounterTokenRequest) =>
      encountersApi.addToken(campaignId, encounterId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['encounters', campaignId, encounterId],
        data,
      );
    },
  });
}

export function useUpdateEncounterToken(
  campaignId: string,
  encounterId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tokenId,
      body,
    }: {
      tokenId: string;
      body: UpdateEncounterTokenRequest;
    }) => encountersApi.updateToken(campaignId, encounterId, tokenId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['encounters', campaignId, encounterId],
        data,
      );
    },
  });
}

export function useRemoveEncounterToken(
  campaignId: string,
  encounterId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tokenId: string) =>
      encountersApi.removeToken(campaignId, encounterId, tokenId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['encounters', campaignId, encounterId],
        data,
      );
    },
  });
}

// ── AI + Load ───────────────────────────────────────────────

export function useSaveAIEncounter(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveAIEncounterRequest) =>
      encountersApi.saveFromAI(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounters', campaignId] });
    },
  });
}

export function useLoadEncounter(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      encounterId,
      body,
    }: {
      encounterId: string;
      body: LoadEncounterRequest;
    }) => encountersApi.load(campaignId, encounterId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['encounters', campaignId] });
    },
  });
}
