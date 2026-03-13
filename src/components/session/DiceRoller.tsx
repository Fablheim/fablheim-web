import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { getSocket } from '@/lib/socket';
import { Pbta2d6Result } from './Pbta2d6Result';
import { DicePoolResult } from './DicePoolResult';

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

interface PbtaResultData {
  die1: number;
  die2: number;
  modifier: number;
  finalTotal: number;
  band: { label: string; description: string };
}

interface PoolResultData {
  dice: number[];
  explodedDice: number[];
  allDice: number[];
  successes: number;
  isSuccess: boolean;
  threshold: number;
}

interface DiceRollEvent {
  userId: string;
  username: string;
  result: RollResult;
  purpose?: string;
  timestamp?: string;
  createdAt?: string;
  pbtaResult?: PbtaResultData;
  poolResult?: PoolResultData;
}

interface DiceRollerProps {
  campaignId: string;
  onRoll?: (result: RollResult) => void;
}

// -- Quick-roll dice --------------------------------------------------------

const QUICK_DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as const;

// -- Sound effect (Web Audio API) ------------------------------------------

function playDiceSound(isCrit = false) {
  try {
    const ctx = new AudioContext();
    const duration = isCrit ? 0.4 : 0.25;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    // Clicky/rattly sound — white noise burst via rapid frequency modulation
    osc.type = 'square';
    osc.frequency.setValueAtTime(isCrit ? 800 : 400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isCrit ? 1200 : 200, ctx.currentTime + duration * 0.3);
    osc.frequency.exponentialRampToValueAtTime(isCrit ? 600 : 100, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    // Second tap for crit
    if (isCrit) {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1400, ctx.currentTime + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.5);
      gain2.gain.setValueAtTime(0.06, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.5);
    }
  } catch {
    // Web Audio not available — silently skip
  }
}

const SOUND_KEY = 'fablheim:dice-sound-enabled';

// -- Helpers ----------------------------------------------------------------

function formatTimestamp(value?: string): string {
  if (!value) return '--:--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function eventTime(event: DiceRollEvent): string | undefined {
  return event.timestamp ?? event.createdAt;
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
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem(SOUND_KEY);
    return saved !== 'false'; // default on
  });

  // PbtA 2d6 section state
  const [pbtaOpen, setPbtaOpen] = useState(false);
  const [pbtaModifier, setPbtaModifier] = useState(0);

  // Dice Pool section state
  const [poolOpen, setPoolOpen] = useState(false);
  const [poolCount, setPoolCount] = useState(5);
  const [poolDieSize, setPoolDieSize] = useState<6 | 10>(10);
  const [poolThreshold, setPoolThreshold] = useState(8);
  const [poolExploding, setPoolExploding] = useState(true);

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
    if (soundEnabled) {
      const isCrit = event.result?.critical === 'success' || event.result?.critical === 'failure';
      playDiceSound(isCrit);
    }
  }, [soundEnabled]);

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

  // -- PbtA 2d6 roll --------------------------------------------------------

  async function handlePbtaRoll() {
    if (rolling) return;
    setRolling(true);

    try {
      const body: Record<string, unknown> = { modifier: pbtaModifier };
      if (purpose.trim()) body.purpose = purpose.trim();
      if (isPrivate) body.isPrivate = true;

      const res = await api.post<{
        die1: number;
        die2: number;
        total: number;
        modifier: number;
        finalTotal: number;
        band: { label: string; description: string };
      }>(`/campaigns/${campaignId}/session/dice/pbta-2d6`, body);

      const { die1, die2, finalTotal, modifier: mod, band } = res.data;

      pushHistory({
        userId: '',
        username: 'You',
        result: { dice: '2d6', rolls: [die1, die2], total: finalTotal, modifier: mod },
        purpose: purpose.trim() || undefined,
        timestamp: new Date().toISOString(),
        pbtaResult: { die1, die2, modifier: mod, finalTotal, band },
      });
    } catch {
      toast.error('PbtA roll failed');
    } finally {
      setRolling(false);
    }
  }

  // -- Dice Pool roll -------------------------------------------------------

  async function handlePoolRoll() {
    if (rolling) return;
    setRolling(true);

    try {
      const body: Record<string, unknown> = {
        dieSize: poolDieSize,
        count: poolCount,
        successThreshold: poolThreshold,
        exploding: poolExploding,
      };
      if (purpose.trim()) body.purpose = purpose.trim();
      if (isPrivate) body.isPrivate = true;

      const res = await api.post<{
        dice: number[];
        explodedDice: number[];
        allDice: number[];
        successes: number;
        isSuccess: boolean;
      }>(`/campaigns/${campaignId}/session/dice/pool`, body);

      const poolData = res.data;

      pushHistory({
        userId: '',
        username: 'You',
        result: { dice: `${poolCount}d${poolDieSize}`, rolls: poolData.allDice, total: poolData.successes, modifier: 0 },
        purpose: purpose.trim() || undefined,
        timestamp: new Date().toISOString(),
        poolResult: { ...poolData, threshold: poolThreshold },
      });
    } catch {
      toast.error('Dice pool roll failed');
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

      {/* PbtA 2d6 Section */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setPbtaOpen((v) => !v)}
          className="flex items-center gap-1 text-carved font-[Cinzel] tracking-wider uppercase text-xs text-foreground hover:text-primary transition-colors"
        >
          {pbtaOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          PbtA 2d6
        </button>
        {pbtaOpen && (
          <div className="space-y-3 pl-5">
            <div className="space-y-1">
              <label className="text-carved font-[Cinzel] tracking-wider uppercase text-[10px] text-foreground">
                Modifier
              </label>
              <input
                type="number"
                value={pbtaModifier}
                onChange={(e) => setPbtaModifier(Number(e.target.value))}
                className="w-24 input-carved rounded-sm border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              type="button"
              onClick={handlePbtaRoll}
              disabled={rolling}
              className={`w-full rounded-md bg-primary px-4 py-2.5 text-sm font-[Cinzel] uppercase tracking-widest font-bold text-primary-foreground btn-emboss shimmer-gold hover:bg-primary/90 hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                rolling ? 'animate-candle' : ''
              }`}
            >
              {rolling ? 'Rolling...' : 'Roll 2d6'}
            </button>
          </div>
        )}
      </div>

      {/* Dice Pool Section */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setPoolOpen((v) => !v)}
          className="flex items-center gap-1 text-carved font-[Cinzel] tracking-wider uppercase text-xs text-foreground hover:text-primary transition-colors"
        >
          {poolOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          Dice Pool
        </button>
        {poolOpen && (
          <div className="space-y-3 pl-5">
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1">
                <label className="text-carved font-[Cinzel] tracking-wider uppercase text-[10px] text-foreground">
                  Count
                </label>
                <input
                  type="number"
                  value={poolCount}
                  min={1}
                  max={20}
                  onChange={(e) => setPoolCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                  className="w-20 input-carved rounded-sm border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-carved font-[Cinzel] tracking-wider uppercase text-[10px] text-foreground">
                  Die Size
                </label>
                <select
                  value={poolDieSize}
                  onChange={(e) => setPoolDieSize(Number(e.target.value) as 6 | 10)}
                  className="w-20 input-carved rounded-sm border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value={6}>d6</option>
                  <option value={10}>d10</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-carved font-[Cinzel] tracking-wider uppercase text-[10px] text-foreground">
                  Threshold
                </label>
                <input
                  type="number"
                  value={poolThreshold}
                  onChange={(e) => setPoolThreshold(Number(e.target.value))}
                  className="w-20 input-carved rounded-sm border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer font-['IM_Fell_English']">
              <input
                type="checkbox"
                checked={poolExploding}
                onChange={(e) => setPoolExploding(e.target.checked)}
                className="accent-primary"
              />
              Exploding dice
            </label>
            <button
              type="button"
              onClick={handlePoolRoll}
              disabled={rolling}
              className={`w-full rounded-md bg-primary px-4 py-2.5 text-sm font-[Cinzel] uppercase tracking-widest font-bold text-primary-foreground btn-emboss shimmer-gold hover:bg-primary/90 hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                rolling ? 'animate-candle' : ''
              }`}
            >
              {rolling ? 'Rolling...' : 'Roll Pool'}
            </button>
          </div>
        )}
      </div>

      {/* Roll History */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-carved font-[Cinzel] tracking-wider uppercase text-xs text-foreground">
            Roll History
          </h3>
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              localStorage.setItem(SOUND_KEY, String(next));
            }}
            className="rounded p-1 text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
            title={soundEnabled ? 'Mute dice sounds' : 'Enable dice sounds'}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
        </div>
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
            <RollHistoryItem key={`${eventTime(event) ?? 'no-time'}-${idx}`} event={event} isNew={idx === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

// -- Roll History Item ------------------------------------------------------

function RollHistoryItem({ event, isNew }: { event: DiceRollEvent; isNew?: boolean }) {
  const { result, username, purpose } = event;
  if (!result) return null;
  const isCritSuccess = result.critical === 'success';
  const isCritFailure = result.critical === 'failure';
  const isCrit = isCritSuccess || isCritFailure;

  return (
    <div
      className={`rounded-md border border-border/50 px-3 py-2 space-y-1 texture-parchment ${
        isCritSuccess
          ? 'border-l-2 border-l-primary shadow-glow animate-candle bg-accent/30'
          : isCritFailure
            ? 'border-l-2 border-l-blood shadow-[0_0_12px_hsla(0,60%,40%,0.2)] bg-accent/30'
            : 'border-l-2 border-l-brass/30 bg-accent/30'
      }`}
      style={isNew && isCrit ? { animation: 'crit-flash 0.8s ease-out' } : isNew ? { animation: 'dice-bounce 0.5s ease-out' } : undefined}
    >
      {/* Header: username + time */}
      <div className="flex items-center justify-between">
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-foreground">{username}</span>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(eventTime(event))}
        </span>
      </div>

      {/* Purpose line */}
      {purpose && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{result.dice}</span>
          <span className="ml-1">— {purpose}</span>
        </div>
      )}

      {/* Rich PbtA 2d6 result */}
      {event.pbtaResult && (
        <Pbta2d6Result
          die1={event.pbtaResult.die1}
          die2={event.pbtaResult.die2}
          modifier={event.pbtaResult.modifier}
          finalTotal={event.pbtaResult.finalTotal}
          band={event.pbtaResult.band}
        />
      )}

      {/* Rich Dice Pool result */}
      {event.poolResult && (
        <DicePoolResult
          dice={event.poolResult.dice}
          explodedDice={event.poolResult.explodedDice}
          allDice={event.poolResult.allDice}
          successes={event.poolResult.successes}
          isSuccess={event.poolResult.isSuccess}
          threshold={event.poolResult.threshold}
        />
      )}

      {/* Standard roll display (only when no rich result) */}
      {!event.pbtaResult && !event.poolResult && (
        <>
          {!purpose && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{result.dice}</span>
              {result.advantage && (
                <span className="ml-1 text-[hsl(150,50%,55%)]">(Advantage)</span>
              )}
              {result.disadvantage && (
                <span className="ml-1 text-[hsl(0,55%,55%)]">(Disadvantage)</span>
              )}
            </div>
          )}
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
              className={`font-bold ${
                isCritSuccess
                  ? 'text-lg text-flame drop-shadow-[0_0_8px_hsla(38,90%,55%,0.5)]'
                  : isCritFailure
                    ? 'text-lg text-[hsl(0,55%,55%)] drop-shadow-[0_0_6px_hsla(0,60%,40%,0.4)]'
                    : 'text-sm text-foreground'
              }`}
              style={isNew ? { animation: 'dice-tumble 0.6s cubic-bezier(0.34,1.56,0.64,1)' } : undefined}
            >
              {result.total}
              {isCritSuccess && ' NAT 20!'}
              {isCritFailure && ' NAT 1'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
