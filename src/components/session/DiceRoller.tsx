import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { getSocket } from '@/lib/socket';

// -- Types ------------------------------------------------------------------

interface RollResult {
  dice: string;
  rolls: number[];
  total: number;
  modifier: number;
  advantage?: boolean;
  disadvantage?: boolean;
  critical?: 'success' | 'failure';
}

interface DiceRollEvent {
  userId: string;
  username: string;
  result: RollResult;
  purpose?: string;
  timestamp: string;
}

interface DiceRollerProps {
  campaignId: string;
  onRoll?: (result: RollResult) => void;
}

// -- Quick-roll dice --------------------------------------------------------

const QUICK_DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as const;

// -- Helpers ----------------------------------------------------------------

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// -- Component --------------------------------------------------------------

export default function DiceRoller({ campaignId, onRoll }: DiceRollerProps) {
  // Form state
  const [formula, setFormula] = useState('1d20');
  const [purpose, setPurpose] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [rolling, setRolling] = useState(false);

  // Roll history
  const [history, setHistory] = useState<DiceRollEvent[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);

  // Determine if the current formula is a d20 roll (advantage/disadvantage only apply to d20)
  const isD20 = /^\d*d20/i.test(formula.trim());

  // -- Toggle helpers (mutually exclusive) ----------------------------------

  function toggleAdvantage() {
    setAdvantage((prev) => {
      if (!prev) setDisadvantage(false);
      return !prev;
    });
  }

  function toggleDisadvantage() {
    setDisadvantage((prev) => {
      if (!prev) setAdvantage(false);
      return !prev;
    });
  }

  // -- Quick dice click -----------------------------------------------------

  function handleQuickDice(die: string) {
    setFormula(`1${die}`);
    // Reset advantage/disadvantage if switching away from d20
    if (die !== 'd20') {
      setAdvantage(false);
      setDisadvantage(false);
    }
  }

  // -- Push event into history (capped at 50) -------------------------------

  const pushHistory = useCallback((event: DiceRollEvent) => {
    setHistory((prev) => [event, ...prev].slice(0, 50));
  }, []);

  // -- Load initial history -------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await api.get<DiceRollEvent[]>(
          `/campaigns/${campaignId}/session/dice/history`,
        );
        if (!cancelled) {
          setHistory(res.data.slice(0, 50));
        }
      } catch {
        // silently ignore - history is non-critical
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  // -- WebSocket listener ---------------------------------------------------

  useEffect(() => {
    const socket = getSocket();

    function handleDiceRolled(event: DiceRollEvent) {
      pushHistory(event);
    }

    socket.on('dice-rolled', handleDiceRolled);
    return () => {
      socket.off('dice-rolled', handleDiceRolled);
    };
  }, [pushHistory]);

  // -- Roll action ----------------------------------------------------------

  async function handleRoll() {
    if (rolling || !formula.trim()) return;
    setRolling(true);

    try {
      const body: Record<string, unknown> = { dice: formula.trim() };
      if (isD20 && advantage) body.advantage = true;
      if (isD20 && disadvantage) body.disadvantage = true;
      if (purpose.trim()) body.purpose = purpose.trim();
      if (isPrivate) body.isPrivate = true;

      const res = await api.post<DiceRollEvent>(
        `/campaigns/${campaignId}/session/dice/roll`,
        body,
      );

      pushHistory(res.data);
      onRoll?.(res.data.result);
    } catch {
      toast.error('Dice roll failed');
    } finally {
      setRolling(false);
    }
  }

  // -- Render ---------------------------------------------------------------

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-warm tavern-card iron-brackets texture-leather space-y-4">
      {/* Section: Dice Formula */}
      <div className="space-y-2">
        <label className="text-carved font-[Cinzel] tracking-wider uppercase text-xs text-foreground">
          Dice Formula
        </label>
        <input
          type="text"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="e.g. 1d20+5, 2d6+3"
          className="w-full input-carved rounded-sm border-2 border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Quick Dice Buttons */}
      <div className="space-y-2">
        <span className="text-carved font-[Cinzel] tracking-wider uppercase text-xs text-foreground">
          Quick Roll
        </span>
        <div className="flex flex-wrap gap-2">
          {QUICK_DICE.map((die) => (
            <button
              key={die}
              type="button"
              onClick={() => handleQuickDice(die)}
              className="rounded-sm border border-iron/60 bg-accent/60 texture-stone px-4 py-2 text-sm font-[Cinzel] font-bold text-accent-foreground hover:border-gold hover:shadow-glow-sm hover:bg-accent transition-all"
            >
              {die}
            </button>
          ))}
        </div>
      </div>

      {/* Advantage / Disadvantage (only for d20) */}
      {isD20 && (
        <div className="space-y-2">
          <span className="text-carved font-[Cinzel] tracking-wider uppercase text-xs text-foreground">
            Roll Mode
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleAdvantage}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-all ${
                advantage
                  ? 'border-forest bg-forest/20 text-[hsl(150,50%,55%)] shadow-[0_0_10px_hsla(150,50%,40%,0.15)]'
                  : 'border-border bg-accent text-accent-foreground hover:border-primary/50 hover:bg-accent/80'
              }`}
            >
              Advantage
            </button>
            <button
              type="button"
              onClick={toggleDisadvantage}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-all ${
                disadvantage
                  ? 'border-blood bg-blood/20 text-[hsl(0,55%,55%)] shadow-[0_0_10px_hsla(0,50%,40%,0.15)]'
                  : 'border-border bg-accent text-accent-foreground hover:border-primary/50 hover:bg-accent/80'
              }`}
            >
              Disadvantage
            </button>
          </div>
        </div>
      )}

      {/* Purpose */}
      <div className="space-y-2">
        <label className="text-carved font-[Cinzel] tracking-wider uppercase text-xs text-foreground">
          Purpose{' '}
          <span className="text-[10px] font-normal text-muted-foreground normal-case tracking-normal">
            (optional)
          </span>
        </label>
        <input
          type="text"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="e.g. Attack roll, Perception check"
          className="w-full input-carved rounded-sm border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Private Roll */}
      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer font-['IM_Fell_English']">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="accent-primary"
        />
        Private roll (GM only)
      </label>

      {/* Roll Button */}
      <button
        type="button"
        onClick={handleRoll}
        disabled={rolling || !formula.trim()}
        className={`w-full rounded-md bg-primary px-4 py-3 text-base font-[Cinzel] uppercase tracking-widest font-bold text-primary-foreground btn-emboss shimmer-gold hover:bg-primary/90 hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          rolling ? 'animate-candle' : ''
        }`}
      >
        {rolling ? 'Rolling...' : 'Roll'}
      </button>

      {/* Roll History */}
      <div className="space-y-2">
        <h3 className="text-carved font-[Cinzel] tracking-wider uppercase text-xs text-foreground">
          Roll History
        </h3>
        <div
          ref={historyRef}
          className="max-h-64 space-y-2 overflow-y-auto pr-1"
        >
          {history.length === 0 && (
            <p className="text-xs text-muted-foreground italic font-['IM_Fell_English']">
              No rolls yet. Be the first!
            </p>
          )}
          {history.map((event, idx) => (
            <RollHistoryItem key={`${event.timestamp}-${idx}`} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}

// -- Roll History Item ------------------------------------------------------

function RollHistoryItem({ event }: { event: DiceRollEvent }) {
  const { result, username, purpose, timestamp } = event;
  const isCritSuccess = result.critical === 'success';
  const isCritFailure = result.critical === 'failure';

  return (
    <div
      className={`rounded-md border border-border/50 px-3 py-2 space-y-1 texture-parchment ${
        isCritSuccess
          ? 'border-l-2 border-l-primary shadow-glow animate-candle bg-accent/30'
          : isCritFailure
            ? 'border-l-2 border-l-blood shadow-[0_0_12px_hsla(0,60%,40%,0.2)] bg-accent/30'
            : 'border-l-2 border-l-brass/30 bg-accent/30'
      }`}
    >
      {/* Header: username + time */}
      <div className="flex items-center justify-between">
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-foreground">{username}</span>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(timestamp)}
        </span>
      </div>

      {/* Formula + purpose */}
      <div className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{result.dice}</span>
        {purpose && <span className="ml-1">— {purpose}</span>}
        {result.advantage && (
          <span className="ml-1 text-[hsl(150,50%,55%)]">(Advantage)</span>
        )}
        {result.disadvantage && (
          <span className="ml-1 text-[hsl(0,55%,55%)]">(Disadvantage)</span>
        )}
      </div>

      {/* Rolls + total */}
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-muted-foreground">
          [{result.rolls.join(', ')}]
          {result.modifier !== 0 && (
            <span>
              {result.modifier > 0 ? ' + ' : ' - '}
              {Math.abs(result.modifier)}
            </span>
          )}
        </span>
        <span
          className={`text-sm font-bold ${
            isCritSuccess
              ? 'text-flame'
              : isCritFailure
                ? 'text-[hsl(0,55%,55%)] drop-shadow-[0_0_6px_hsla(0,60%,40%,0.4)]'
                : 'text-foreground'
          }`}
        >
          {result.total}
          {isCritSuccess && ' NAT 20!'}
          {isCritFailure && ' NAT 1'}
        </span>
      </div>
    </div>
  );
}
