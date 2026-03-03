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
    <div className="mkt-card flex items-center gap-3 rounded-md border border-iron/30 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--mkt-border)] bg-black/25">
        <Icon className="h-4.5 w-4.5 text-[color:var(--mkt-accent)]" />
      </div>
      <div>
        <p className="font-[Cinzel] text-[10px] uppercase tracking-widest text-[color:var(--mkt-muted)]">{label}</p>
        <p className="font-[Cinzel] text-base font-semibold text-[color:var(--mkt-text)]">{value}</p>
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
      <div className="mkt-card mkt-card-mounted rounded-xl border border-border p-5 iron-brackets">
        <p className="mkt-chip mb-3 inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
          Campaign Snapshot
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-md border border-brass/35 bg-brass/22 px-2 py-0.5 text-xs font-medium text-brass">
            {systemLabels[campaign.system]}
          </span>
          <span className="inline-flex items-center rounded-md border border-forest/35 bg-forest/20 px-2 py-0.5 text-xs font-medium text-[hsl(150,50%,60%)]">
            {statusLabels[campaign.status]}
          </span>
          {campaign.setting && (
            <span className="inline-flex items-center rounded-md border border-arcane/30 bg-arcane/15 px-2 py-0.5 text-xs text-arcane">
              {campaign.setting}
            </span>
          )}
        </div>
        {campaign.description && (
          <p className="text-base text-[color:var(--mkt-muted)] font-['IM_Fell_English'] italic leading-relaxed">
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
