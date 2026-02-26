import { Dice5, Swords, Flame, Heart, Sparkles, Target, Skull } from 'lucide-react';
import type { SessionStatistics as SessionStats } from '@/types/campaign';

interface SessionStatisticsProps {
  statistics: SessionStats;
}

const STAT_ITEMS = [
  { key: 'diceRolls', label: 'Dice Rolled', icon: Dice5 },
  { key: 'combatRounds', label: 'Combat Rounds', icon: Swords },
  { key: 'damageDealt', label: 'Damage Dealt', icon: Flame },
  { key: 'healingDone', label: 'Healing Done', icon: Heart },
  { key: 'spellsCast', label: 'Spells Cast', icon: Sparkles },
  { key: 'criticalHits', label: 'Critical Hits', icon: Target },
  { key: 'criticalMisses', label: 'Critical Misses', icon: Skull },
] as const;

export function SessionStatistics({ statistics }: SessionStatisticsProps) {
  return (
    <div className="space-y-3">
      <p className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
        Session Statistics
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAT_ITEMS.map((item) => {
          const Icon = item.icon;
          const value = statistics[item.key] ?? 0;
          return (
            <div
              key={item.key}
              className="flex flex-col items-center rounded-md bg-card p-3 texture-leather"
            >
              <Icon className="mb-1 h-4 w-4 text-brass/70" />
              <span className="text-lg font-bold text-foreground">{value}</span>
              <span className="text-center font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
