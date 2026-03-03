import { useMemo } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { AppEmptyState } from '@/components/app/AppEmptyState';
import { Button } from '@/components/ui/Button';
import { CampaignCard } from './CampaignCard';
import type { Campaign, Character } from '@/types/campaign';
import type { CampaignMembership } from '@/api/campaign-members';

interface CampaignCardGridProps {
  dmCampaigns: Campaign[] | undefined;
  playerMemberships: CampaignMembership[];
  characters: Character[];
  isLoading: boolean;
  error: boolean;
  onNavigate: (path: string) => void;
}

export function CampaignCardGrid({
  dmCampaigns,
  playerMemberships,
  characters,
  isLoading,
  error,
  onNavigate,
}: CampaignCardGridProps) {
  const sortedDM = useMemo(() => {
    if (!dmCampaigns) return [];
    return [...dmCampaigns].sort((a, b) => {
      const stageWeight = { live: 0, prep: 1, recap: 2 } as const;
      const diff = (stageWeight[a.stage] ?? 1) - (stageWeight[b.stage] ?? 1);
      if (diff !== 0) return diff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [dmCampaigns]);

  const characterByCampaign = useMemo(() => {
    const map = new Map<string, Character>();
    for (const c of characters) {
      if (!map.has(c.campaignId)) map.set(c.campaignId, c);
    }
    return map;
  }, [characters]);

  const totalCount = sortedDM.length + playerMemberships.length;

  function getSessionPath(campaign: Campaign): string {
    return `/app/campaigns/${campaign._id}/session`;
  }

  // ── Loading state ────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="app-card h-32 animate-pulse rounded-xl border border-[color:var(--mkt-border)]" />
        ))}
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────

  if (error) {
    return (
      <AppEmptyState
        title="Failed to load campaigns"
        reason="Something went wrong. Please try again."
        primaryAction={
          <Button onClick={() => window.location.reload()}>Retry</Button>
        }
      />
    );
  }

  // ── Empty state ──────────────────────────────────────────

  if (totalCount === 0) {
    return (
      <AppEmptyState
        icon={BookOpen}
        title="No campaigns yet"
        reason="Create your first campaign to begin your adventure."
        primaryAction={
          <Button onClick={() => onNavigate('/app/campaigns')} className="shimmer-gold">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        }
      />
    );
  }

  // ── Hero layout (1 campaign) ─────────────────────────────

  if (totalCount === 1 && sortedDM.length === 1) {
    const c = sortedDM[0];
    return (
      <div className="mx-auto max-w-2xl">
        <CampaignCard
          campaign={c}
          role="dm"
          isHero
          onClick={() => onNavigate(`/app/campaigns/${c._id}`)}
          onResume={c.stage === 'live' ? () => onNavigate(getSessionPath(c)) : undefined}
        />
      </div>
    );
  }

  // ── Grid layout (2+) ────────────────────────────────────

  return (
    <div className="space-y-6">
      {sortedDM.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[Cinzel] text-sm font-semibold uppercase tracking-widest text-[color:var(--mkt-muted)]">
              Your Campaigns
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('/app/campaigns')}
              className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              <Plus className="h-3 w-3" />
              New
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedDM.map((c) => (
              <CampaignCard
                key={c._id}
                campaign={c}
                role="dm"
                onClick={() => onNavigate(`/app/campaigns/${c._id}`)}
                onResume={c.stage === 'live' ? () => onNavigate(getSessionPath(c)) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {playerMemberships.length > 0 && (
        <div>
          {sortedDM.length > 0 && <div className="divider-ornate mb-6" />}
          <h2 className="mb-3 font-[Cinzel] text-sm font-semibold uppercase tracking-widest text-[color:var(--mkt-muted)]">
            Playing In
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {playerMemberships.map((m) => {
              const char = characterByCampaign.get(m.campaignId._id);
              const isLive = m.campaignId.stage === 'live';
              return (
                <CampaignCard
                  key={m._id}
                  campaign={{
                    _id: m.campaignId._id,
                    name: m.campaignId.name,
                    description: m.campaignId.description ?? '',
                    status: m.campaignId.status as Campaign['status'],
                    stage: (m.campaignId.stage ?? 'prep') as Campaign['stage'],
                    system: (m.campaignId.system ?? 'custom') as Campaign['system'],
                    setting: '',
                    dmId: '',
                    inviteEnabled: false,
                    createdAt: m.createdAt,
                    updatedAt: m.updatedAt,
                  }}
                  role={m.role}
                  character={char}
                  onClick={() => onNavigate(`/app/campaigns/${m.campaignId._id}`)}
                  onResume={isLive ? () => onNavigate(`/app/campaigns/${m.campaignId._id}/session`) : undefined}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
