import { Pencil, Trash2 } from 'lucide-react';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';
import { ItemContextMenu } from '@/components/ui/ItemContextMenu';
import { systemLabels, statusLabels } from '@/types/campaign';
import type { Campaign } from '@/types/campaign';

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
}

const statusColors: Record<Campaign['status'], string> = {
  active: 'bg-forest/20 text-[hsl(150,50%,55%)]',
  paused: 'bg-brass/20 text-brass',
  completed: 'bg-arcane/20 text-arcane',
  archived: 'bg-muted text-muted-foreground',
};

export function CampaignCard({ campaign, onEdit, onDelete }: CampaignCardProps) {
  const { openTab } = useTabs();

  function handleOpen() {
    const path = `/app/campaigns/${campaign._id}`;
    openTab({ title: campaign.name, path, content: resolveRouteContent(path, campaign.name) });
  }

  return (
    <ItemContextMenu
      item={{ title: campaign.name, path: `/app/campaigns/${campaign._id}`, icon: 'Book' }}
    >
      <div
        onClick={handleOpen}
        className="group cursor-pointer rounded-lg border border-border bg-card p-6 tavern-card texture-parchment transition-all duration-200 hover:border-gold hover:shadow-glow hover-lift"
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-card-foreground font-[Cinzel]">{campaign.name}</h3>
            {campaign.setting && (
              <p className="mt-0.5 text-xs text-muted-foreground">{campaign.setting}</p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(campaign);
              }}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-glow-sm"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(campaign);
              }}
              className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:shadow-glow-sm"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {campaign.description && (
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{campaign.description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusColors[campaign.status]}`}>
            {statusLabels[campaign.status]}
          </span>
          <span className="inline-flex items-center rounded-md bg-secondary/20 px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider font-medium text-secondary-foreground">
            {systemLabels[campaign.system]}
          </span>
          <span className="ml-auto font-[Cinzel] text-[10px] tracking-wider text-muted-foreground">
            {new Date(campaign.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </ItemContextMenu>
  );
}
