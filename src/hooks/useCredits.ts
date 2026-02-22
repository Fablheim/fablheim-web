import { useQuery } from '@tanstack/react-query';
import { creditsApi } from '@/api/credits';

export function useCreditBalance() {
  return useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: creditsApi.getBalance,
  });
}

export function useCreditHistory(limit = 20) {
  return useQuery({
    queryKey: ['credits', 'history', limit],
    queryFn: () => creditsApi.getHistory(limit),
  });
}

export function useCreditCosts() {
  return useQuery({
    queryKey: ['credits', 'costs'],
    queryFn: creditsApi.getCosts,
    staleTime: Infinity,
  });
}
