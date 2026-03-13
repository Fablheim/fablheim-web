import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { randomTablesApi } from '@/api/random-tables';
import type { CreateRandomTablePayload, UpdateRandomTablePayload } from '@/types/random-table';

export function useRandomTables(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'tables'],
    queryFn: () => randomTablesApi.list(campaignId),
    enabled: !!campaignId,
  });
}

export function useRollTable() {
  return useMutation({
    mutationFn: ({
      campaignId,
      tableId,
    }: {
      campaignId: string;
      tableId: string;
    }) => randomTablesApi.roll(campaignId, tableId),
  });
}

export function useCreateRandomTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: string;
      data: CreateRandomTablePayload;
    }) => randomTablesApi.create(campaignId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', v.campaignId, 'tables'],
      });
    },
  });
}

export function useUpdateRandomTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      tableId,
      data,
    }: {
      campaignId: string;
      tableId: string;
      data: UpdateRandomTablePayload;
    }) => randomTablesApi.update(campaignId, tableId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', v.campaignId, 'tables'],
      });
    },
  });
}

export function useDeleteRandomTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      tableId,
    }: {
      campaignId: string;
      tableId: string;
    }) => randomTablesApi.remove(campaignId, tableId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', v.campaignId, 'tables'],
      });
    },
  });
}
