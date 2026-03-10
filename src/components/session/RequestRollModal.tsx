import { useState } from 'react';
import { Dice5, Loader2, X, Check, Minus } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { useCharacters } from '@/hooks/useCharacters';

type RollType = 'ability' | 'save' | 'skill' | 'attack' | 'custom';

interface RollResponse {
  requestId: string;
  userId: string;
  characterName: string;
  total: number;
  rolls: number[];
  modifier: number;
}

interface DcResult {
  requestId: string;
  userId: string;
  passedDc: boolean;
  dc: number;
}

interface ActiveRequest {
  requestId: string;
  label: string;
  type: RollType;
  dc?: number;
  responses: RollResponse[];
  dcResults: Map<string, DcResult>;
}

interface RequestRollModalProps {
  campaignId: string;
  onClose: () => void;
}

const ROLL_TYPES: { value: RollType; label: string }[] = [
  { value: 'ability', label: 'Ability Check' },
  { value: 'save', label: 'Saving Throw' },
  { value: 'skill', label: 'Skill Check' },
  { value: 'attack', label: 'Attack Roll' },
  { value: 'custom', label: 'Custom' },
];

export function RequestRollModal({ campaignId, onClose }: RequestRollModalProps) {
  const { data: characters } = useCharacters(campaignId);
  const [type, setType] = useState<RollType>('ability');
  const [label, setLabel] = useState('');
  const [dc, setDc] = useState('');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [active, setActive] = useState<ActiveRequest | null>(null);

  const pcCharacters = characters?.filter((c) => c.userId) ?? [];

  useSocketEvent('roll:response', (data: RollResponse) => {
    if (!active || data.requestId !== active.requestId) return;
    setActive((prev) => {
      if (!prev) return prev;
      if (prev.responses.some((r) => r.userId === data.userId)) return prev;
      return { ...prev, responses: [...prev.responses, data] };
    });
  });

  useSocketEvent('roll:response:dc', (data: DcResult) => {
    if (!active || data.requestId !== active.requestId) return;
    setActive((prev) => {
      if (!prev) return prev;
      const next = new Map(prev.dcResults);
      next.set(data.userId, data);
      return { ...prev, dcResults: next };
    });
  });

  useSocketEvent('roll:request:expired', (data: { requestId: string }) => {
    if (active?.requestId === data.requestId) {
      setActive(null);
    }
  });

  function toggleTarget(userId: string) {
    setSelectedTargets((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  function handleSend() {
    if (!label.trim()) return;
    setSending(true);
    const socket = getSocket();
    const dcNum = dc ? parseInt(dc, 10) : undefined;
    socket.emit(
      'roll:request',
      {
        campaignId,
        type,
        label: label.trim(),
        dc: dcNum && !isNaN(dcNum) ? dcNum : undefined,
        targetUserIds: selectedTargets.length > 0 ? selectedTargets : undefined,
      },
      (res: { success: boolean; requestId?: string }) => {
        setSending(false);
        if (res.success && res.requestId) {
          setActive({
            requestId: res.requestId,
            label: label.trim(),
            type,
            dc: dcNum && !isNaN(dcNum) ? dcNum : undefined,
            responses: [],
            dcResults: new Map(),
          });
        }
      },
    );
  }

  function handleCancel() {
    if (!active) return;
    const socket = getSocket();
    socket.emit('roll:request:cancel', {
      campaignId,
      requestId: active.requestId,
    });
    setActive(null);
  }

  function handleNewRequest() {
    setActive(null);
    setLabel('');
    setDc('');
    setSelectedTargets([]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg border border-border border-t-2 border-t-primary/50 bg-card p-5 shadow-warm-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-[Cinzel] text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Dice5 className="h-4 w-4 text-primary" />
            Request Roll
          </h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!active ? renderForm() : renderPending()}
      </div>
    </div>
  );

  function renderForm() {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-[Cinzel] uppercase tracking-wider text-muted-foreground">Roll Type</label>
          <div className="mt-1 flex flex-wrap gap-1">
            {ROLL_TYPES.map((rt) => (
              <button
                key={rt.value}
                type="button"
                onClick={() => setType(rt.value)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium font-[Cinzel] uppercase tracking-wider transition-colors ${
                  type === rt.value
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'bg-accent/40 text-muted-foreground hover:bg-accent/60 border border-transparent'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-[Cinzel] uppercase tracking-wider text-muted-foreground">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Perception, DEX Save, Stealth..."
            className="mt-1 w-full rounded border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-[Cinzel] uppercase tracking-wider text-muted-foreground">
            DC <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <input
            type="number"
            value={dc}
            onChange={(e) => setDc(e.target.value)}
            placeholder="—"
            min={1}
            max={30}
            className="mt-1 w-20 rounded border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none"
          />
        </div>

        {pcCharacters.length > 0 && (
          <div>
            <label className="text-[10px] font-[Cinzel] uppercase tracking-wider text-muted-foreground">
              Targets <span className="normal-case tracking-normal">(leave empty for all)</span>
            </label>
            <div className="mt-1 flex flex-wrap gap-1">
              {pcCharacters.map((c) => {
                const selected = selectedTargets.includes(c.userId!);
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => toggleTarget(c.userId!)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium font-[Cinzel] uppercase tracking-wider transition-colors ${
                      selected
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'bg-accent/40 text-muted-foreground hover:bg-accent/60 border border-transparent'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSend}
          disabled={!label.trim() || sending}
          className="mt-2 w-full rounded bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-[Cinzel] uppercase tracking-wider"
        >
          {sending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Send Roll Request'}
        </button>
      </div>
    );
  }

  function renderPending() {
    if (!active) return null;

    return (
      <div className="space-y-3">
        <div className="rounded border border-primary/30 bg-primary/5 p-3">
          <p className="font-[Cinzel] text-xs font-semibold uppercase tracking-wider text-primary">
            {active.label}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {ROLL_TYPES.find((rt) => rt.value === active.type)?.label}
            {active.dc ? ` · DC ${active.dc}` : ''}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-[Cinzel] uppercase tracking-wider text-muted-foreground mb-1.5">
            Responses ({active.responses.length})
          </p>

          {active.responses.length === 0 && (
            <p className="text-[10px] text-muted-foreground/60 italic flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Waiting for players...
            </p>
          )}

          <div className="space-y-1.5">
            {active.responses.map((r) => {
              const dcResult = active.dcResults.get(r.userId);
              return (
                <div
                  key={r.userId}
                  className="flex items-center justify-between rounded border border-border/60 bg-background/30 px-3 py-2"
                >
                  <span className="font-[Cinzel] text-xs font-medium text-foreground">
                    {r.characterName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{r.total}</span>
                    <span className="text-[9px] text-muted-foreground">
                      [{r.rolls.join(', ')}]{r.modifier >= 0 ? '+' : ''}{r.modifier}
                    </span>
                    {dcResult && (
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                          dcResult.passedDc
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {dcResult.passedDc ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-[10px] font-[Cinzel] uppercase tracking-wider text-destructive hover:bg-destructive/20 transition-colors"
          >
            Cancel Request
          </button>
          <button
            type="button"
            onClick={handleNewRequest}
            className="flex-1 rounded border border-border/60 bg-accent/40 px-3 py-2 text-[10px] font-[Cinzel] uppercase tracking-wider text-muted-foreground hover:bg-accent/60 transition-colors"
          >
            New Request
          </button>
        </div>
      </div>
    );
  }
}
