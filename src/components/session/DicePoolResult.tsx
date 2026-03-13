interface DicePoolResultProps {
  dice: number[];
  explodedDice: number[];
  allDice: number[];
  successes: number;
  isSuccess: boolean;
  threshold: number;
}

export function DicePoolResult({
  dice,
  explodedDice: _,
  allDice,
  successes,
  isSuccess,
  threshold,
}: DicePoolResultProps) {
  const explodedSet = new Set<number>();

  // Build an index set so we can mark which entries in allDice are exploded.
  // Exploded dice appear after the original dice in allDice.
  const originalCount = dice.length;
  for (let i = originalCount; i < allDice.length; i++) {
    explodedSet.add(i);
  }

  return (
    <div className="rounded-md border border-[#2a2016] bg-primary/5 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Dice Pool</p>

      <div className="mb-3 flex flex-wrap justify-center gap-1.5">
        {allDice.map((value, i) => {
          const isHit = value >= threshold;
          const isExploded = explodedSet.has(i);

          return (
            <div
              key={i}
              className={`relative flex h-9 w-9 items-center justify-center rounded border text-sm font-bold tabular-nums ${
                isHit
                  ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                  : 'border-border/40 bg-muted/30 text-muted-foreground'
              }`}
            >
              {value}
              {isExploded && (
                <span className="absolute -right-1 -top-1 text-[10px] leading-none" title="Exploded">
                  ⚡
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <p
          className={`font-[Cinzel] text-xl font-bold ${
            isSuccess ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {successes} {successes === 1 ? 'Success' : 'Successes'}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          Threshold: {threshold}+
        </p>
      </div>
    </div>
  );
}
