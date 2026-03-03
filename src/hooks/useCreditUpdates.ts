import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from './useSocket';

interface CreditBalance {
  subscription: number;
  purchased: number;
  total: number;
}

/**
 * Listens for `credits:updated` WebSocket events (emitted by the server after admin
 * credit grants and revocations) and immediately updates the TanStack Query cache so
 * the UI reflects the change without requiring a page refresh or manual refetch.
 *
 * Mount this hook once in the app shell so it's always active for authenticated users.
 */
export function useCreditUpdates() {
  const queryClient = useQueryClient();

  useSocketEvent('credits:updated', (balance: CreditBalance) => {
    queryClient.setQueryData(['credits', 'balance'], balance);
  });
}
