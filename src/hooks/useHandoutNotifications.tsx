import { useCallback, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useSocketEvent } from '@/hooks/useSocket';

/**
 * Manages handout notification badge count via socket events.
 * Suppresses badge increment when the user is already viewing handouts.
 */
export function useHandoutNotifications(isViewingHandouts: boolean) {
  const [newHandoutCount, setNewHandoutCount] = useState(0);

  useSocketEvent('handout:shared', (data: { title?: string }) => {
    toast(
      <span className="flex items-center gap-2 text-sm">
        <Sparkles className="h-4 w-4 text-gold" />
        New handout: <strong>{data?.title ?? 'Untitled'}</strong>
      </span>,
    );
    if (!isViewingHandouts) {
      setNewHandoutCount((prev) => prev + 1);
    }
  });

  const clearCount = useCallback(() => setNewHandoutCount(0), []);

  return {
    newHandoutCount,
    clearCount,
  };
}
