import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Never retry 401 — the axios interceptor handles token refresh
        if (error && typeof error === 'object' && 'response' in error) {
          const status = (error as Record<string, any>).response?.status;
          if (status === 401 || status === 403) return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
