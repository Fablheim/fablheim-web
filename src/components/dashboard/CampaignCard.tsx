import { ArrowRight, Flame, Shield, Users } from 'lucide-react';
import { stageConfig } from '@/config/stage-config';
import { systemLabels } from '@/types/campaign';
import type { Campaign, Character } from '@/types/campaign';

interface CampaignCardProps {
  campaign: Campaign;
  role: 'dm' | 'player' | 'co_dm';
  character?: Character;
  isHero?: boolean;
  onClick: () => void;
  onResume?: () => void;
}

export function CampaignCard({
  campaign,
  role,
  character,
  isHero,
  onClick,
  onResume,
}: CampaignCardProps) {
  const stage = stageConfig[campaign.stage];
  const StageIcon = stage.Icon;
  const isLive = campaign.stage === 'live';

  const systemLabel = systemLabels[campaign.system] ?? 'Custom System';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 ${
        isLive
          ? 'border-[hsl(0,55%,40%)]/30 hover:border-[hsl(0,55%,40%)]/50'
          : 'border-[hsla(32,26%,26%,0.5)] hover:border-[hsla(38,50%,58%,0.4)]'
      } bg-[linear-gradient(180deg,hsla(26,16%,15%,0.96),hsla(24,14%,11%,0.98))] ${isHero ? 'p-5' : 'p-4'}`}
      title={campaign.name}
    >
      {renderHeader()}
      {renderMeta()}
      {renderFooter()}
      {renderLiveCTA()}
    </button>
  );

  function renderHeader() {
    return (
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stage.bg} ${isLive ? 'animate-pulse' : ''}`}
        >
          <StageIcon className={`h-4 w-4 ${stage.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3
              className={`line-clamp-2 text-[hsl(35,24%,92%)] ${isHero ? 'text-lg' : 'text-[14px]'}`}
              style={{ fontFamily: "'IM Fell English', 'Cinzel', serif" }}
            >
              {campaign.name}
            </h3>
            {renderRoleBadge()}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-[hsl(30,12%,58%)]">
            {buildSubtitle()}
          </p>
        </div>
      </div>
    );
  }

  function renderRoleBadge() {
    if (role === 'dm') {
      return (
        <Shield
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(38,90%,55%)]"
          aria-label="DM"
        />
      );
    }
    return (
      <Users
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(148,40%,52%)]"
        aria-label={role === 'co_dm' ? 'Co-DM' : 'Player'}
      />
    );
  }

  function renderMeta() {
    if (!isHero || !campaign.description) return null;
    return (
      <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-[hsl(30,12%,58%)]">
        {campaign.description}
      </p>
    );
  }

  function renderFooter() {
    const lastPlayed = campaign.lastSessionDate
      ? new Date(campaign.lastSessionDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })
      : null;

    return (
      <div className="mt-3 flex items-center gap-2">
        {renderStageBadge()}
        {character && (
          <span className="truncate text-[11px] text-[hsl(30,12%,58%)]">
            Playing as {character.name}
          </span>
        )}
        {lastPlayed && !character && (
          <span className="text-[11px] text-[hsl(30,12%,58%)]">
            Last played {lastPlayed}
          </span>
        )}
        <span className="ml-auto text-[10px] text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100">
          Enter →
        </span>
      </div>
    );
  }

  function renderStageBadge() {
    if (isLive) {
      return (
        <span className="flex items-center gap-1 rounded-full border border-[hsl(0,55%,28%)]/30 bg-[hsl(0,55%,28%)]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(0,62%,58%)]">
          <Flame className="h-3 w-3" />
          Live
        </span>
      );
    }
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${stage.bg} ${stage.color}`}
      >
        {stage.label}
      </span>
    );
  }

  function renderLiveCTA() {
    if (!isLive || !onResume) return null;
    return (
      <div className="mt-3 border-t border-[hsla(32,26%,26%,0.3)] pt-3">
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onResume();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onResume();
            }
          }}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[hsl(38,92%,50%)] px-3 py-1.5 text-[11px] font-medium text-[hsl(24,22%,6%)] transition-colors hover:bg-[hsl(38,92%,55%)]"
        >
          <Flame className="h-3 w-3" />
          Resume Session
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    );
  }

  function buildSubtitle(): string {
    const parts = [systemLabel];
    if (campaign.setting) parts.push(campaign.setting);
    return parts.join(' · ');
  }
}
