import { Users, ScrollText, Calendar } from 'lucide-react';
import { useCharacters } from '@/hooks/useCharacters';
import { useSessions } from '@/hooks/useSessions';
import { systemLabels, statusLabels } from '@/types/campaign';
import type { Campaign } from '@/types/campaign';

interface CampaignOverviewProps {
  campaign: Campaign;
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-iron/30 bg-accent/20 px-4 py-3 texture-parchment">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="font-[Cinzel] text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-[Cinzel] text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function CampaignOverview({ campaign }: CampaignOverviewProps) {
  const { data: characters } = useCharacters(campaign._id);
  const { data: sessions } = useSessions(campaign._id);

  const pcCount = characters?.length ?? 0;
  const totalSessions = sessions?.length ?? 0;
  const completedSessions = sessions?.filter((s) => s.status === 'completed').length ?? 0;

  return (
    <div className="space-y-4">
      {/* Description & tags */}
      <div className="rounded-lg border border-border bg-card p-5 tavern-card texture-parchment iron-brackets">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-md bg-brass/20 px-2 py-0.5 text-xs font-medium text-brass">
            {systemLabels[campaign.system]}
          </span>
          <span className="inline-flex items-center rounded-md bg-forest/20 px-2 py-0.5 text-xs font-medium text-forest">
            {statusLabels[campaign.status]}
          </span>
          {campaign.setting && (
            <span className="inline-flex items-center rounded-md bg-arcane/15 px-2 py-0.5 text-xs text-arcane">
              {campaign.setting}
            </span>
          )}
        </div>
        {campaign.description && (
          <p className="text-base text-muted-foreground font-['IM_Fell_English'] italic leading-relaxed">
            {campaign.description}
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard icon={Users} label="Characters" value={pcCount} />
        <StatCard icon={ScrollText} label="Sessions" value={`${completedSessions}/${totalSessions}`} />
        <StatCard icon={Calendar} label="Created" value={new Date(campaign.createdAt).toLocaleDateString()} />
      </div>
    </div>
  );
}
