import { ArrowRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Campaign } from '@/types/campaign';

interface LiveSessionAlertProps {
  campaign: Campaign;
  onResume: () => void;
}

export function LiveSessionAlert({ campaign, onResume }: LiveSessionAlertProps) {
  return (
    <div className="mkt-card mkt-card-mounted live-alert-glow rounded-xl border border-[hsl(5,84%,58%)]/35 p-4">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[hsl(5,84%,58%)]/35 bg-[hsl(5,84%,58%)]/18">
            <Flame className="h-5 w-5 animate-pulse text-[hsl(5,84%,58%)]" />
          </div>
          <div>
            <p className="font-[Cinzel] text-base font-semibold text-[color:var(--mkt-text)]">{campaign.name}</p>
            <p className="text-sm text-[hsl(5,84%,58%)]">Session in progress</p>
          </div>
        </div>
        <Button size="sm" className="shimmer-gold w-full sm:w-auto" onClick={onResume}>
          Resume Session
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
