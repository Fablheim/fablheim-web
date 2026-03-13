import { useState } from 'react';
import { Clock, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useCountdowns, useUpsertCountdown, useAdvanceCountdown, useRemoveCountdown } from '@/hooks/useLiveSession';
import { useCampaignModuleEnabled } from '@/hooks/useModuleEnabled';

interface CountdownClocksPanelProps {
  campaignId: string;
  isDM: boolean;
}

function ClockDisplay({ segments, filled, color }: { segments: number; filled: number; color?: string }) {
  const radius = 18;
  const cx = 20;
  const cy = 20;
  const fillColor = color ?? 'hsl(var(--blood))';

  return (
    <svg width={40} height={40} viewBox="0 0 40 40" className="shrink-0">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={2} />
      {Array.from({ length: segments }).map((_, i) => {
        const startAngle = (i * 360) / segments - 90;
        const endAngle = ((i + 1) * 360) / segments - 90;
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        return (
          <g key={i}>
            <path
              d={`M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`}
              fill={i < filled ? fillColor : 'transparent'}
              opacity={i < filled ? 0.6 : 0}
            />
            {/* Segment divider line */}
            <line
              x1={cx}
              y1={cy}
              x2={x1}
              y2={y1}
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function CountdownClocksPanel({ campaignId, isDM }: CountdownClocksPanelProps) {
  const enabled = useCampaignModuleEnabled(campaignId, 'countdown-clocks');
  const { data: clocks } = useCountdowns(campaignId);
  const upsert = useUpsertCountdown(campaignId);
  const advance = useAdvanceCountdown(campaignId);
  const remove = useRemoveCountdown(campaignId);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSegments, setNewSegments] = useState(4);

  if (!enabled || !clocks) return null;

  function handleAdd() {
    if (!newName.trim()) return;
    upsert.mutate({
      id: `clock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newName.trim(),
      segments: newSegments,
      filled: 0,
      isHidden: false,
    });
    setNewName('');
    setNewSegments(4);
    setAdding(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3 w-3" />
          Countdown Clocks
        </h4>
        {isDM && (
          <button
            type="button"
            onClick={() => setAdding(!adding)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {adding && isDM && (
        <div className="flex gap-1.5 items-end">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Clock name"
            className="flex-1 rounded border border-border bg-muted/30 px-2 py-1 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <select
            value={newSegments}
            onChange={(e) => setNewSegments(parseInt(e.target.value, 10))}
            className="rounded border border-border bg-muted/30 px-1.5 py-1 text-xs"
          >
            {[4, 6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>{n} seg</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            className="rounded bg-gold/20 px-2 py-1 text-xs text-gold hover:bg-gold/30"
          >
            Add
          </button>
        </div>
      )}

      {clocks.map((c) => {
        const isComplete = c.filled >= c.segments;
        return (
          <div
            key={c.id}
            className={`flex items-center gap-2 rounded-sm border px-2 py-1.5 transition-colors ${
              isComplete
                ? 'border-blood/40 bg-blood/10'
                : 'border-iron/30 bg-accent/20'
            }`}
          >
            <ClockDisplay segments={c.segments} filled={c.filled} color={c.color} />

            <div className="flex-1 min-w-0">
              <p className="font-[Cinzel] text-xs font-medium text-foreground truncate">
                {c.name}
              </p>
              <p className="text-[9px] text-muted-foreground">
                {c.filled}/{c.segments}
                {isComplete && <span className="ml-1 text-blood font-semibold">COMPLETE</span>}
              </p>
              {c.description && (
                <p className="text-[9px] text-muted-foreground italic truncate">{c.description}</p>
              )}
            </div>

            {isDM && (
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => advance.mutate({ clockId: c.id, delta: 1 })}
                  disabled={isComplete}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Advance"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => advance.mutate({ clockId: c.id, delta: -1 })}
                  disabled={c.filled <= 0}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Reduce"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {isDM && (
              <button
                type="button"
                onClick={() => remove.mutate(c.id)}
                className="text-muted-foreground/40 hover:text-blood transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}

      {clocks.length === 0 && !adding && isDM && (
        <p className="text-[10px] text-muted-foreground italic font-['IM_Fell_English']">
          No countdown clocks. Click + to add one.
        </p>
      )}
    </div>
  );
}
