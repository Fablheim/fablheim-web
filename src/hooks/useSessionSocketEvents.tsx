import { useCallback, useState } from 'react';
import { X as XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useSocketEvent } from '@/hooks/useSocket';

export interface RollRequestState {
  requestId: string;
  label: string;
  type: string;
  expiresAt: string;
}

/**
 * Subscribes to session-global socket events and manages roll request state.
 *
 * Events handled:
 * - safety:x-card-activated → toast for all participants
 * - condition-expired → toast per expired condition
 * - condition-expiring-soon → DM-only warning toast
 * - roll:request / roll:request:cancelled / roll:request:expired → player roll prompt state
 */
export function useSessionSocketEvents(_campaignId: string, options: { isDM: boolean }) {
  const { isDM } = options;

  const [rollRequest, setRollRequest] = useState<RollRequestState | null>(null);
  const dismissRollRequest = useCallback(() => setRollRequest(null), []);

  // X-Card activation — visible to all participants
  useSocketEvent('safety:x-card-activated', () => {
    toast(
      <span className="flex items-center gap-2 text-sm">
        <XIcon className="h-4 w-4 text-destructive" />
        <strong>The X-Card has been used.</strong> The scene will be adjusted.
      </span>,
      { duration: 10000 },
    );
  });

  // Condition expired — visible to all participants
  useSocketEvent('condition-expired', (data: { expired: Array<{ condition: string; entryName: string }> }) => {
    for (const { condition, entryName } of data.expired) {
      toast(
        <span className="text-sm">
          <strong>{condition}</strong> expired on <strong>{entryName}</strong>
        </span>,
      );
    }
  });

  // Condition expiring soon — DM-only warning
  useSocketEvent('condition-expiring-soon', (data: { expiring: Array<{ condition: string; entryName: string }> }) => {
    if (!isDM) return;
    for (const { condition, entryName } of data.expiring) {
      toast.warning(
        <span className="text-sm">
          <strong>{condition}</strong> on <strong>{entryName}</strong> expires next round
        </span>,
      );
    }
  });

  // Roll request — player side only (DMs have the modal)
  useSocketEvent('roll:request', (data: RollRequestState) => {
    if (isDM) return;
    setRollRequest(data);
  });

  useSocketEvent('roll:request:cancelled', (data: { requestId: string }) => {
    setRollRequest((prev) => (prev?.requestId === data.requestId ? null : prev));
  });

  useSocketEvent('roll:request:expired', (data: { requestId: string }) => {
    setRollRequest((prev) => (prev?.requestId === data.requestId ? null : prev));
  });

  return {
    rollRequest,
    dismissRollRequest,
  };
}
