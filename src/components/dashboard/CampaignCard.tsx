import { Flame, Shield, Users } from 'lucide-react';
import { stageConfig } from '@/config/stage-config';
import { systemLabels } from '@/types/campaign';
import { Button } from '@/components/ui/Button';
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
  const subtitle = campaign.setting ? `${systemLabel} · ${campaign.setting}` : systemLabel;

  const lastPlayed = campaign.lastSessionDate
    ? new Date(campaign.lastSessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`mkt-card mkt-card-mounted group relative w-full rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 ${
        isLive
          ? 'campaign-card-live border-[hsl(5,84%,58%)]/30'
          : 'border-[color:var(--mkt-border)] hover:border-[color:var(--mkt-accent)]/40'
      } ${isHero ? 'p-6' : 'p-4'}`}
    >
      {/* Header: Stage icon + Name + Role badge */}
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stage.bg} ${isLive ? 'animate-pulse' : ''}`}>
          <StageIcon className={`h-5 w-5 ${stage.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`truncate font-[Cinzel] font-semibold text-[color:var(--mkt-text)] ${isHero ? 'text-xl' : 'text-base'}`}>
              {campaign.name}
            </h3>
            {role === 'dm' ? (
              <Shield className="h-3.5 w-3.5 shrink-0 text-[color:var(--mkt-accent)]" aria-label="DM" />
            ) : (
              <Users className="h-3.5 w-3.5 shrink-0 text-forest" aria-label={role === 'co_dm' ? 'Co-DM' : 'Player'} />
            )}
          </div>
          <p className="truncate text-sm text-[color:var(--mkt-muted)]">{subtitle}</p>
        </div>
      </div>

      {/* Hero: Description + meta */}
      {isHero && campaign.description && (
        <p className="mt-3 line-clamp-2 text-base text-[color:var(--mkt-muted)]">{campaign.description}</p>
      )}

      {/* Footer: Stage badge + last played + character */}
      <div className="mt-3 flex items-center gap-2">
        {isLive ? (
          <span className="flex items-center gap-1 rounded-full bg-[hsl(5,84%,58%)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(5,84%,58%)]">
            <Flame className="h-3 w-3" />
            Live
          </span>
        ) : (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${stage.bg} ${stage.color}`}>
            {stage.label}
          </span>
        )}

        {character && (
            <span className="truncate text-xs text-[color:var(--mkt-muted)]">
              Playing as {character.name}
            </span>
          )}

        {lastPlayed && !character && (
          <span className="text-xs text-[color:var(--mkt-muted)]">Last played {lastPlayed}</span>
        )}
      </div>

      {/* Live CTA */}
      {isLive && onResume && (
        <div className="mt-3">
          <Button
            size="sm"
            className="shimmer-gold w-full"
            onClick={(e) => { e.stopPropagation(); onResume(); }}
          >
            <Flame className="mr-1.5 h-3.5 w-3.5" />
            Resume Session
          </Button>
        </div>
      )}
    </button>
  );
}
