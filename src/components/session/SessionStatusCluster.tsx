import { useMemo } from 'react';
import { AlertTriangle, CircleDot, Link2, Link2Off, RotateCw } from 'lucide-react';
import type { CampaignStage } from '@/types/campaign';
import type { Session } from '@/types/campaign';

interface SessionStatusClusterProps {
  connected: boolean;
  joined: boolean;
  stage?: CampaignStage;
  sessionStatus?: Session['status'];
  onlineCount?: number;
}

function formatStage(stage?: CampaignStage): string {
  if (!stage) return 'Stage unknown';
  return stage === 'prep' ? 'Prep' : stage === 'live' ? 'Live' : 'Recap';
}

export function SessionStatusCluster({
  connected,
  joined,
  stage,
  sessionStatus,
  onlineCount = 0,
}: SessionStatusClusterProps) {
  const showDisconnectWarning = !connected && joined;
  const isLive = stage === 'live' || sessionStatus === 'in_progress';

  const connectionChip = useMemo(() => {
    if (!joined) {
      return {
        label: 'Connecting',
        state: 'reconnecting',
        icon: RotateCw,
        iconClassName: 'animate-spin',
      } as const;
    }

    if (connected) {
      return {
        label: `${onlineCount} online`,
        state: 'connected',
        icon: Link2,
        iconClassName: '',
      } as const;
    }

    return {
      label: showDisconnectWarning ? 'Disconnected' : 'Reconnecting',
      state: showDisconnectWarning ? 'disconnected' : 'reconnecting',
      icon: showDisconnectWarning ? Link2Off : RotateCw,
      iconClassName: showDisconnectWarning ? '' : 'animate-spin',
    } as const;
  }, [connected, joined, onlineCount, showDisconnectWarning]);

  const ConnectionIcon = connectionChip.icon;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="app-chip inline-flex min-h-[34px] items-center gap-1.5 px-3 py-1.5 text-xs font-medium" data-state={connectionChip.state}>
        <ConnectionIcon className={`h-3.5 w-3.5 ${connectionChip.iconClassName}`} aria-hidden="true" />
        {connectionChip.label}
      </span>

      <span className="app-chip inline-flex min-h-[34px] items-center gap-1.5 px-3 py-1.5 text-xs font-medium" data-state="stage">
        <CircleDot className="h-3.5 w-3.5" aria-hidden="true" />
        {formatStage(stage)}
      </span>

      <span className="app-chip inline-flex min-h-[34px] items-center gap-1.5 px-3 py-1.5 text-xs font-medium" data-state={isLive ? 'live' : 'idle'}>
        <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-[hsl(5,84%,58%)] shadow-[0_0_10px_hsla(5,84%,58%,0.6)]' : 'bg-muted-foreground/55'}`} aria-hidden="true" />
        {isLive ? 'Live' : 'Idle'}
      </span>

      {showDisconnectWarning && (
        <span
          className="app-chip inline-flex min-h-[34px] items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
          data-state="warning"
        >
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          Connection unstable
        </span>
      )}
    </div>
  );
}
