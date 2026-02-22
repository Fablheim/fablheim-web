import { ChevronDown } from 'lucide-react';

interface Campaign {
  _id: string;
  name: string;
}

interface CampaignSelectorProps {
  campaigns: Campaign[];
  value: string;
  onChange: (campaignId: string) => void;
  placeholder?: string;
}

export function CampaignSelector({
  campaigns,
  value,
  onChange,
  placeholder = 'Select Campaign',
}: CampaignSelectorProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-sm border border-input bg-input py-2 pl-3 pr-8 font-[Cinzel] text-xs uppercase tracking-wider text-foreground input-carved"
      >
        <option value="">{placeholder}</option>
        {campaigns.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
