import { useState } from 'react';
import { BarChart3, Cpu, DollarSign, Loader2, TrendingUp, Zap } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useClaudeAnalytics } from '@/hooks/useAdmin';

const PERIOD_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

const FEATURE_LABELS: Record<string, string> = {
  npc_generation: 'NPC Generation',
  session_summary: 'Session Summary',
  plot_hooks: 'Plot Hooks',
  backstory: 'Backstory',
  world_building: 'World Building',
  encounter_building: 'Encounter Building',
  character_creation: 'Character Creation',
  rule_questions: 'Rule Questions',
};

const MODEL_SHORT: Record<string, string> = {
  'claude-haiku-4-5-20251001': 'Haiku 4.5',
  'claude-sonnet-4-5-20250929': 'Sonnet 4.5',
  'claude-opus-4-20250514': 'Opus 4',
};

function formatCost(usd: number): string {
  if (usd < 0.01) return `$${(usd * 100).toFixed(3)}¢`;
  return `$${usd.toFixed(4)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function ClaudeAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useClaudeAnalytics(days);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Claude API Cost Analytics</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Token usage and cost breakdown across all AI features
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-border/50 bg-card/30 p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDays(opt.value)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  days === opt.value
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading analytics...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Failed to load analytics data.
          </div>
        )}

        {data && renderContent()}
      </div>
    </AdminLayout>
  );

  function renderContent() {
    if (!data) return null;

    return (
      <>
        {renderTopStats()}
        <div className="grid gap-6 lg:grid-cols-2">
          {renderByModel()}
          {renderByFeature()}
        </div>
        {renderDailyTrend()}
        {renderRunway()}
      </>
    );
  }

  function renderTopStats() {
    if (!data) return null;
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {renderStatCard(
          'Total Cost',
          formatCost(data.totalCost),
          DollarSign,
          'text-yellow-400',
        )}
        {renderStatCard(
          'Input Tokens',
          formatTokens(data.totalInputTokens),
          Zap,
          'text-blue-400',
        )}
        {renderStatCard(
          'Output Tokens',
          formatTokens(data.totalOutputTokens),
          Cpu,
          'text-purple-400',
        )}
        {renderStatCard(
          'Avg Daily Cost',
          formatCost(data.runwayProjection.avgDailyCost),
          TrendingUp,
          'text-green-400',
        )}
      </div>
    );
  }

  function renderStatCard(label: string, value: string, Icon: typeof DollarSign, iconColor: string) {
    return (
      <div className="rounded-lg border border-border/50 bg-card/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
      </div>
    );
  }

  function renderByModel() {
    if (!data?.byModel.length) return null;
    const maxCost = Math.max(...data.byModel.map((m) => m.cost), 0.0001);

    return (
      <div className="rounded-lg border border-border/50 bg-card/40 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Cpu className="h-4 w-4 text-primary" />
          Cost by Model
        </h3>
        <div className="space-y-3">
          {data.byModel.map((m) => (
            <div key={m.model} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {MODEL_SHORT[m.model] ?? m.model}
                </span>
                <span className="font-medium text-foreground">
                  {formatCost(m.cost)}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({m.calls} calls)
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                <div
                  className="h-full rounded-full bg-primary/60"
                  style={{ width: `${(m.cost / maxCost) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {formatTokens(m.inputTokens)} in / {formatTokens(m.outputTokens)} out
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderByFeature() {
    if (!data?.byFeature.length) return null;
    const maxCost = Math.max(...data.byFeature.map((f) => f.cost), 0.0001);

    return (
      <div className="rounded-lg border border-border/50 bg-card/40 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <BarChart3 className="h-4 w-4 text-primary" />
          Cost by Feature
        </h3>
        <div className="space-y-3">
          {data.byFeature.map((f) => (
            <div key={f.featureType} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {FEATURE_LABELS[f.featureType] ?? f.featureType}
                </span>
                <span className="font-medium text-foreground">
                  {formatCost(f.cost)}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({f.calls} calls)
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                <div
                  className="h-full rounded-full bg-blue-500/60"
                  style={{ width: `${(f.cost / maxCost) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderDailyTrend() {
    if (!data?.byDay.length) return null;
    const maxCost = Math.max(...data.byDay.map((d) => d.cost), 0.0001);

    return (
      <div className="rounded-lg border border-border/50 bg-card/40 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <TrendingUp className="h-4 w-4 text-primary" />
          Daily Cost Trend
        </h3>
        <div className="flex h-24 items-end gap-1">
          {data.byDay.map((d) => (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center"
              title={`${d.date}: ${formatCost(d.cost)} (${d.calls} calls)`}
            >
              <div
                className="w-full min-h-[2px] rounded-t bg-primary/50 transition-colors group-hover:bg-primary/80"
                style={{ height: `${Math.max((d.cost / maxCost) * 100, 2)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{data.byDay[0]?.date}</span>
          <span>{data.byDay[data.byDay.length - 1]?.date}</span>
        </div>
      </div>
    );
  }

  function renderRunway() {
    if (!data) return null;
    const { avgDailyCost, projectedMonthlyCost, daysWithData } = data.runwayProjection;

    return (
      <div className="rounded-lg border border-border/50 bg-card/40 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <DollarSign className="h-4 w-4 text-primary" />
          Cost Projection
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Avg Daily Cost</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{formatCost(avgDailyCost)}</p>
            <p className="text-[10px] text-muted-foreground">over {daysWithData} days w/ data</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Projected Monthly</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{formatCost(projectedMonthlyCost)}</p>
            <p className="text-[10px] text-muted-foreground">at current rate</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Projected Annual</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{formatCost(projectedMonthlyCost * 12)}</p>
            <p className="text-[10px] text-muted-foreground">at current rate</p>
          </div>
        </div>
      </div>
    );
  }
}
