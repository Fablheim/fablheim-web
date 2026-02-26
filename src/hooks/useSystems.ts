import { useQuery } from '@tanstack/react-query';
import { systemsApi } from '@/api/systems';

export function useSystems() {
  return useQuery({
    queryKey: ['systems'],
    queryFn: () => systemsApi.list(),
    staleTime: Infinity,
  });
}

export function useSystemDefinition(systemId: string) {
  return useQuery({
    queryKey: ['systems', systemId],
    queryFn: () => systemsApi.get(systemId),
    staleTime: Infinity,
    enabled: !!systemId,
  });
}
