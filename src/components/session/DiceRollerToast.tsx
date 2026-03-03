import { useState } from 'react';
import DiceRoller from '@/components/session/DiceRoller';

interface DiceRollerToastProps {
  campaignId: string;
}

export default function DiceRollerToast({ campaignId }: DiceRollerToastProps) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground shadow-lg transition-transform hover:scale-105"
        aria-label="Open dice roller"
      >
        🎲
      </button>
    );
  }

  return (
    <div className="w-80 rounded-lg border border-border bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-[Cinzel] text-sm font-semibold text-foreground">Dice Roller</h3>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-sm text-muted-foreground hover:text-foreground"
          aria-label="Close dice roller"
        >
          ✕
        </button>
      </div>
      <div className="p-3">
        <DiceRoller campaignId={campaignId} />
      </div>
    </div>
  );
}
