interface LevelBadgeProps {
  level: number;
  proficiencyBonus?: number;
  size?: 'sm' | 'default';
}

function getTierColor(level: number): string {
  if (level >= 17) return 'border-amber-500/50 text-amber-300 bg-amber-950/30';
  if (level >= 11) return 'border-blue-500/50 text-blue-300 bg-blue-950/30';
  if (level >= 5) return 'border-emerald-500/50 text-emerald-300 bg-emerald-950/30';
  return 'border-zinc-500/50 text-zinc-300 bg-zinc-800/30';
}

export function LevelBadge({ level, proficiencyBonus, size = 'default' }: LevelBadgeProps) {
  const tierColor = getTierColor(level);
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-3 py-1 text-sm gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-sm border font-[Cinzel] font-semibold ${tierColor} ${sizeClasses}`}
    >
      <span>Lv {level}</span>
      {proficiencyBonus != null && (
        <span className="text-muted-foreground">
          (+{proficiencyBonus})
        </span>
      )}
    </span>
  );
}
