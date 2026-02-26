import { useQuery } from '@tanstack/react-query';
import { srdApi } from '@/api/srd';

const SRD_STALE_TIME = 1000 * 60 * 60; // 1 hour — SRD content is static

export function useSRDSystems() {
  return useQuery({
    queryKey: ['srd', 'systems'],
    queryFn: () => srdApi.getSystems(),
    staleTime: SRD_STALE_TIME,
  });
}

export function useSRDSystem(system: string) {
  return useQuery({
    queryKey: ['srd', system],
    queryFn: () => srdApi.getSystem(system),
    enabled: !!system,
    staleTime: SRD_STALE_TIME,
  });
}

export function useSRDCategoryEntries(system: string, category: string) {
  return useQuery({
    queryKey: ['srd', system, 'category', category],
    queryFn: () => srdApi.getCategoryEntries(system, category),
    enabled: !!system && !!category,
    staleTime: SRD_STALE_TIME,
  });
}

export function useSRDEntry(system: string, entryPath: string) {
  return useQuery({
    queryKey: ['srd', system, 'entry', entryPath],
    queryFn: () => srdApi.getEntry(system, entryPath),
    enabled: !!system && !!entryPath,
    staleTime: SRD_STALE_TIME,
  });
}

export function useSRDSearch(system: string, query: string) {
  return useQuery({
    queryKey: ['srd', system, 'search', query],
    queryFn: () => srdApi.search(system, query),
    enabled: !!system && query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}
