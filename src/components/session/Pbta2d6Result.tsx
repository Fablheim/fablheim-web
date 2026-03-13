interface Pbta2d6ResultProps {
  die1: number;
  die2: number;
  modifier: number;
  finalTotal: number;
  band: { label: string; description: string };
}

function bandColors(label: string) {
  const lower = label.toLowerCase();
  if (lower === 'hit' || lower === 'strong hit')
    return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40' };
  if (lower.includes('partial') || lower === 'weak hit')
    return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40' };
  return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40' };
}

export function Pbta2d6Result({ die1, die2, modifier, finalTotal, band }: Pbta2d6ResultProps) {
  const colors = bandColors(band.label);
  const modSign = modifier >= 0 ? '+' : '';

  return (
    <div className={`rounded-md border ${colors.border} ${colors.bg} p-3`}>
      <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Roll Result</p>

      <div className="mb-3 flex items-center justify-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded border border-border/60 bg-background/40 text-sm font-bold tabular-nums text-foreground">
          {die1}
        </div>
        <span className="text-xs text-muted-foreground">+</span>
        <div className="flex h-9 w-9 items-center justify-center rounded border border-border/60 bg-background/40 text-sm font-bold tabular-nums text-foreground">
          {die2}
        </div>
        <span className="text-xs text-muted-foreground">{modSign}{modifier}</span>
        <span className="text-xs text-muted-foreground">=</span>
        <div className="flex h-9 w-9 items-center justify-center rounded border border-primary/40 bg-primary/15 text-sm font-bold tabular-nums text-primary">
          {finalTotal}
        </div>
      </div>

      <div className="text-center">
        <p className={`font-[Cinzel] text-xl font-bold ${colors.text}`}>
          {band.label}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {band.description}
        </p>
      </div>
    </div>
  );
}
