import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { treasuryApi, type TreasuryTransactionPayload } from '@/api/treasury';

export function useTreasury(campaignId: string) {
  return useQuery({
    queryKey: ['treasury', campaignId],
    queryFn: () => treasuryApi.get(campaignId),
    enabled: !!campaignId,
  });
}

export function useTreasuryLedger(campaignId: string, limit = 50) {
  return useQuery({
    queryKey: ['treasury', campaignId, 'ledger', limit],
    queryFn: () => treasuryApi.getLedger(campaignId, limit),
    enabled: !!campaignId,
  });
}

export function useAddTreasuryTransaction(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TreasuryTransactionPayload) =>
      treasuryApi.addTransaction(campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', campaignId] });
    },
  });
}
