import { useEffect, useRef, useState } from 'react';
import { Dice5, Loader2 } from 'lucide-react';
import { getSocket } from '@/lib/socket';

interface RollRequestPromptProps {
  campaignId: string;
  requestId: string;
  label: string;
  type: string;
  expiresAt: string;
  onDismiss: () => void;
}

export function RollRequestPrompt({
  campaignId,
  requestId,
  label,
  type,
  expiresAt,
  onDismiss,
}: RollRequestPromptProps) {
  const [rolling, setRolling] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const ms = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 1000));
  });
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      const left = Math.max(0, Math.ceil(ms / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(intervalRef.current);
        onDismiss();
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [expiresAt, onDismiss]);

  function handleRoll() {
    setRolling(true);
    // Roll a d20
    const roll = Math.floor(Math.random() * 20) + 1;
    const modifier = 0; // Player can't set modifier from prompt; just raw d20
    const total = roll + modifier;

    const socket = getSocket();
    socket.emit(
      'roll:respond',
      {
        campaignId,
        requestId,
        total,
        rolls: [roll],
        modifier,
      },
      (res: { success: boolean }) => {
        setRolling(false);
        if (res.success) {
          setSubmitted(true);
          setTimeout(onDismiss, 2000);
        }
      },
    );
  }

  const TYPE_LABELS: Record<string, string> = {
    ability: 'Ability Check',
    save: 'Saving Throw',
    skill: 'Skill Check',
    attack: 'Attack Roll',
    custom: 'Roll',
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="animate-in slide-in-from-top-2 fade-in duration-300 rounded-lg border-2 border-primary/50 bg-card/95 p-4 shadow-warm-lg backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Dice5 className="h-5 w-5 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-[Cinzel] uppercase tracking-wider text-muted-foreground">
            {TYPE_LABELS[type] ?? 'Roll Requested'}
          </p>
          <p className="mt-0.5 font-[Cinzel] text-sm font-semibold text-foreground">
            {label}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {minutes}:{seconds.toString().padStart(2, '0')} remaining
          </p>
        </div>

        <div className="shrink-0">
          {submitted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-3 py-1.5 text-[10px] font-semibold text-green-400 font-[Cinzel] uppercase tracking-wider">
              Submitted
            </span>
          ) : (
            <button
              type="button"
              onClick={handleRoll}
              disabled={rolling}
              className="rounded bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary disabled:opacity-50 transition-colors font-[Cinzel] uppercase tracking-wider"
            >
              {rolling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Roll d20'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
