import { useMemo } from 'react';
import {
  BarChart3,
  Clock,
  CalendarDays,
  Swords,
  Dices,
  Zap,
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useSessions } from '@/hooks/useSessions';
import type { Session } from '@/types/campaign';

interface CampaignHealthPanelProps {
  campaignId: string;
}

export function CampaignHealthPanel({ campaignId }: CampaignHealthPanelProps) {
  const { data: sessions, isLoading, error } = useSessions(campaignId);

  const stats = useMemo(() => {
    if (!sessions?.length) return null;
    return computeStats(sessions);
  }, [sessions]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load session data" />;

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm italic text-muted-foreground/60">
          No completed sessions yet — stats will appear after your first session.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {renderHeader()}
      <div className="flex-1 space-y-4 p-4">
        {renderPulseCards()}
        {renderSessionFrequency()}
        {renderCombatStats()}
        {renderRecentSessions()}
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center gap-2 border-b border-[hsla(38,30%,25%,0.2)] px-4 py-3">
        <BarChart3 className="h-4 w-4 text-primary/70" />
        <h2 className="font-['IM_Fell_English'] text-base font-semibold text-foreground">
          Campaign Pulse
        </h2>
        <span className="ml-auto text-[10px] text-muted-foreground/50">
          {stats!.completedCount} session{stats!.completedCount !== 1 ? 's' : ''} completed
        </span>
      </div>
    );
  }

  function renderPulseCards() {
    const s = stats!;
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Avg Duration" value={`${s.avgDuration}m`} icon={Clock} />
        <StatCard label="Total Hours" value={s.totalHours.toFixed(1)} icon={CalendarDays} />
        <StatCard
          label="Frequency"
          value={s.avgDaysBetween ? `${s.avgDaysBetween}d` : '—'}
          sub="avg between sessions"
          icon={CalendarDays}
        />
        <StatCard
          label="Trend"
          value={s.frequencyTrend}
          icon={s.frequencyTrend === 'faster' ? TrendingUp : s.frequencyTrend === 'slower' ? TrendingDown : Minus}
          color={s.frequencyTrend === 'faster' ? 'text-emerald-400' : s.frequencyTrend === 'slower' ? 'text-amber-400' : 'text-muted-foreground'}
        />
      </div>
    );
  }

  function renderSessionFrequency() {
    const s = stats!;
    if (s.durationBars.length < 2) return null;

    const maxDur = Math.max(...s.durationBars.map((b) => b.duration), 1);

    return (
      <div className="rounded border border-border/30 bg-[hsl(24,15%,11%)] p-3">
        <p className="mb-2 text-[10px] font-medium text-muted-foreground/60">
          Session Duration (last {s.durationBars.length})
        </p>
        <div className="flex items-end gap-1" style={{ height: 64 }}>
          {s.durationBars.map((bar) => (
            <div
              key={bar.number}
              className="group relative flex-1"
              style={{ height: '100%' }}
            >
              <div
                className="absolute bottom-0 w-full rounded-t bg-primary/40 transition-colors group-hover:bg-primary/60"
                style={{ height: `${(bar.duration / maxDur) * 100}%`, minHeight: 2 }}
              />
              <div className="absolute -top-4 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[hsl(24,15%,8%)] px-1.5 py-0.5 text-[9px] text-foreground shadow group-hover:block">
                S{bar.number}: {bar.duration}m
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[8px] text-muted-foreground/40">
          <span>S{s.durationBars[0].number}</span>
          <span>S{s.durationBars[s.durationBars.length - 1].number}</span>
        </div>
      </div>
    );
  }

  function renderCombatStats() {
    const s = stats!;
    return (
      <div className="rounded border border-border/30 bg-[hsl(24,15%,11%)] p-3">
        <p className="mb-2 text-[10px] font-medium text-muted-foreground/60">Aggregate Stats</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <MiniStat icon={Dices} label="Dice Rolls" value={s.totalDiceRolls} />
          <MiniStat icon={Swords} label="Combat Rnds" value={s.totalCombatRounds} />
          <MiniStat icon={Zap} label="Damage" value={s.totalDamage} />
          <MiniStat icon={Heart} label="Healing" value={s.totalHealing} />
          <MiniStat icon={Swords} label="Enemies" value={s.totalEnemiesDefeated} />
        </div>
      </div>
    );
  }

  function renderRecentSessions() {
    const s = stats!;
    return (
      <div className="rounded border border-border/30 bg-[hsl(24,15%,11%)] p-3">
        <p className="mb-2 text-[10px] font-medium text-muted-foreground/60">Recent Sessions</p>
        <div className="space-y-1">
          {s.recentSessions.map((sess) => (
            <div
              key={sess._id}
              className="flex items-center gap-2 rounded bg-[hsl(24,15%,9%)] px-2 py-1.5 text-[10px]"
            >
              <span className="font-medium text-foreground">S{sess.sessionNumber}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {sess.title || 'Untitled'}
              </span>
              {sess.durationMinutes > 0 && (
                <span className="text-muted-foreground/50">{sess.durationMinutes}m</span>
              )}
              <span className="text-muted-foreground/40">
                {sess.completedAt ? formatDate(sess.completedAt) : sess.scheduledDate ? formatDate(sess.scheduledDate) : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

/* ── Sub-components ────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Clock;
  color?: string;
}) {
  return (
    <div className="rounded border border-border/30 bg-[hsl(24,15%,11%)] px-3 py-2 text-center">
      <Icon className={`mx-auto mb-1 h-3.5 w-3.5 ${color ?? 'text-primary/50'}`} />
      <p className={`text-sm font-medium ${color ?? 'text-foreground'}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground/50">{label}</p>
      {sub && <p className="text-[8px] text-muted-foreground/30">{sub}</p>}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Dices;
  label: string;
  value: number;
}) {
  return (
    <div className="text-center">
      <Icon className="mx-auto mb-0.5 h-3 w-3 text-muted-foreground/40" />
      <p className="text-xs font-medium text-foreground">{value.toLocaleString()}</p>
      <p className="text-[8px] text-muted-foreground/50">{label}</p>
    </div>
  );
}

/* ── Stats computation ─────────────────────────────────────── */

interface DurationBar {
  number: number;
  duration: number;
}

interface CampaignStats {
  completedCount: number;
  avgDuration: number;
  totalHours: number;
  avgDaysBetween: number | null;
  frequencyTrend: 'faster' | 'slower' | 'steady';
  durationBars: DurationBar[];
  totalDiceRolls: number;
  totalCombatRounds: number;
  totalDamage: number;
  totalHealing: number;
  totalEnemiesDefeated: number;
  recentSessions: Session[];
}

function computeStats(sessions: Session[]): CampaignStats | null {
  const completed = sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => a.sessionNumber - b.sessionNumber);

  if (completed.length === 0) return null;

  const totalMinutes = completed.reduce((sum, s) => sum + s.durationMinutes, 0);
  const avgDuration = Math.round(totalMinutes / completed.length);
  const totalHours = totalMinutes / 60;

  // Frequency: avg days between sessions
  const gaps = computeGaps(completed);
  const avgDaysBetween = gaps.length > 0 ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : null;

  // Trend: compare first half gaps to second half
  let frequencyTrend: 'faster' | 'slower' | 'steady' = 'steady';
  if (gaps.length >= 4) {
    const mid = Math.floor(gaps.length / 2);
    const firstHalf = gaps.slice(0, mid).reduce((s, g) => s + g, 0) / mid;
    const secondHalf = gaps.slice(mid).reduce((s, g) => s + g, 0) / (gaps.length - mid);
    if (secondHalf < firstHalf * 0.8) frequencyTrend = 'faster';
    else if (secondHalf > firstHalf * 1.2) frequencyTrend = 'slower';
  }

  // Duration bars (last 20)
  const barsSource = completed.slice(-20);
  const durationBars: DurationBar[] = barsSource.map((s) => ({
    number: s.sessionNumber,
    duration: s.durationMinutes,
  }));

  // Aggregate combat stats
  let totalDiceRolls = 0;
  let totalCombatRounds = 0;
  let totalDamage = 0;
  let totalHealing = 0;
  let totalEnemiesDefeated = 0;
  for (const s of completed) {
    const st = s.statistics;
    if (!st) continue;
    totalDiceRolls += st.diceRolls ?? 0;
    totalCombatRounds += st.combatRounds ?? 0;
    totalDamage += st.damageDealt ?? 0;
    totalHealing += st.healingDone ?? 0;
    totalEnemiesDefeated += st.enemiesDefeated ?? 0;
  }

  // Recent sessions (last 5)
  const recentSessions = [...completed].reverse().slice(0, 5);

  return {
    completedCount: completed.length,
    avgDuration,
    totalHours,
    avgDaysBetween,
    frequencyTrend,
    durationBars,
    totalDiceRolls,
    totalCombatRounds,
    totalDamage,
    totalHealing,
    totalEnemiesDefeated,
    recentSessions,
  };
}

function computeGaps(sorted: Session[]): number[] {
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].completedAt ?? sorted[i - 1].scheduledDate;
    const curr = sorted[i].startedAt ?? sorted[i].scheduledDate;
    if (prev && curr) {
      const diffMs = new Date(curr).getTime() - new Date(prev).getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) gaps.push(diffDays);
    }
  }
  return gaps;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
