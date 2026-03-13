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

  if (isLoading) {
    return renderLoading();
  }

  if (error) {
    return renderError();
  }

  if (totalCount === 0) {
    return renderEmpty();
  }

  if (totalCount === 1 && sortedDM.length === 1) {
    return renderHero();
  }

  return renderGrid();

  function renderLoading() {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-[hsla(32,26%,26%,0.4)] bg-[hsl(24,14%,11%)]"
          />
        ))}
      </div>
    );
  }

  function renderError() {
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

  function renderEmpty() {
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

  function renderHero() {
    const c = sortedDM[0];
    return (
      <div className="mx-auto max-w-2xl">
        <CampaignCard
          campaign={c}
          role="dm"
          isHero
          onClick={() => onNavigate(`/app/campaigns/${c._id}`)}
          onResume={
            c.stage === 'live'
              ? () => onNavigate(`/app/campaigns/${c._id}/session`)
              : undefined
          }
        />
      </div>
    );
  }

  function renderGrid() {
    return (
      <div className="space-y-5">
        {sortedDM.length > 0 && renderDMSection()}
        {playerMemberships.length > 0 && renderPlayerSection()}
      </div>
    );
  }

  function renderDMSection() {
    return (
      <div>
        {playerMemberships.length > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)]">
              Running
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('/app/campaigns')}
              className="flex items-center gap-1 text-[11px] text-[hsl(38,82%,63%)] hover:text-[hsl(38,90%,70%)]"
            >
              <Plus className="h-3 w-3" />
              New
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedDM.map((c) => (
            <CampaignCard
              key={c._id}
              campaign={c}
              role="dm"
              onClick={() => onNavigate(`/app/campaigns/${c._id}`)}
              onResume={
                c.stage === 'live'
                  ? () => onNavigate(`/app/campaigns/${c._id}/session`)
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    );
  }

  function renderPlayerSection() {
    return (
      <div>
        <h3 className="mb-2 text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)]">
          Playing In
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                onResume={
                  isLive
                    ? () => onNavigate(`/app/campaigns/${m.campaignId._id}/session`)
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>
    );
  }
}
