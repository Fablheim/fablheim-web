import { BookOpen, Clock3, Globe, ScrollText, Sparkles } from 'lucide-react';
import { useOverviewContext } from './OverviewContext';

export function OverviewRightPanel() {
  const {
    activeArcs,
    sortedSessions,
    escalatingTrackerCount,
    onTabChange,
  } = useOverviewContext();

  const sessionsPlayed = sortedSessions.filter((s) => s.status === 'completed').length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {renderStats()}
      {renderNav()}
    </div>
  );

  function renderStats() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-3">
        <p className="mb-2 text-[9px] uppercase tracking-[0.14em] text-[hsl(30,12%,48%)]">
          Campaign Pulse
        </p>
        {renderStatRow('Active Arcs', String(activeArcs.length), 'text-[hsl(42,78%,78%)]')}
        {renderStatRow('Sessions Played', String(sessionsPlayed), 'text-[hsl(150,62%,70%)]')}
        {renderStatRow('Rising Trackers', String(escalatingTrackerCount), escalatingTrackerCount > 0 ? 'text-[hsl(12,86%,72%)]' : 'text-[hsl(30,12%,58%)]')}
      </div>
    );
  }

  function renderStatRow(label: string, value: string, tone: string) {
    return (
      <div className="flex items-center justify-between py-1">
        <p className="text-[10px] text-[hsl(30,12%,58%)]">{label}</p>
        <p className={`text-[11px] font-medium ${tone}`}>{value}</p>
      </div>
    );
  }

  function renderNav() {
    const navItems = [
      { key: 'arcs', label: 'Story Arcs', icon: Sparkles, tab: 'arcs' },
      { key: 'sessions', label: 'Session Plans', icon: BookOpen, tab: 'sessions' },
      { key: 'trackers', label: 'Trackers', icon: Clock3, tab: 'trackers' },
      { key: 'world', label: 'World', icon: Globe, tab: 'world' },
      { key: 'downtime', label: 'Downtime', icon: ScrollText, tab: 'downtime' },
    ];

    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 text-[9px] uppercase tracking-[0.14em] text-[hsl(30,12%,48%)]">
          Quick Nav
        </p>
        <div className="space-y-1">
          {navItems.map((item) => renderNavButton(item))}
        </div>
      </div>
    );
  }

  function renderNavButton(item: { key: string; label: string; icon: typeof Sparkles; tab: string }) {
    const Icon = item.icon;
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => onTabChange(item.tab)}
        className="flex w-full items-center gap-2.5 rounded-[12px] border border-[hsla(32,26%,26%,0.35)] bg-[hsla(26,16%,12%,0.6)] px-2.5 py-2 text-left transition hover:border-[hsla(38,50%,58%,0.3)] hover:bg-[hsla(26,20%,16%,0.7)]"
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-[hsl(38,82%,63%)]" />
        <span className="text-[11px] text-[hsl(35,24%,88%)]">{item.label}</span>
      </button>
    );
  }
}
