import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { layoutsApi } from '@/api/layouts';
import type { CreateLayoutPayload, UpdateLayoutPayload } from '@/types/layout';

export function useLayouts(campaignId?: string) {
  return useQuery({
    queryKey: ['layouts', campaignId],
    queryFn: () => layoutsApi.getAll(campaignId),
  });
}

export function useDefaultLayout() {
  return useQuery({
    queryKey: ['layouts', 'default'],
    queryFn: () => layoutsApi.getDefault(),
  });
}

export function useLayout(id: string) {
  return useQuery({
    queryKey: ['layouts', id],
    queryFn: () => layoutsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLayoutPayload) => layoutsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });
}

export function useUpdateLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLayoutPayload }) =>
      layoutsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });
}

export function useLoadLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => layoutsApi.load(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });
}

export function useDeleteLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => layoutsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });
}

export function useWorkspacePresets(stage?: string, campaignId?: string) {
  return useQuery({
    queryKey: ['layouts', 'mosaic', stage, campaignId],
    queryFn: () => layoutsApi.getAll(campaignId, 'mosaic', stage),
    enabled: !!stage,
  });
}
