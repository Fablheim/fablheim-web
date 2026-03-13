import { ScrollText } from 'lucide-react';
import { useResolvedCustomBlocks } from '@/hooks/useCustomModules';

interface HouseRulesPanelProps {
  campaignId: string;
}

export function HouseRulesPanel({ campaignId }: HouseRulesPanelProps) {
  const { data: blocks } = useResolvedCustomBlocks(campaignId);
  const houseRules = blocks?.houseRules ?? [];

  if (houseRules.length === 0) return null;

  // Group by category (or by module name if no category)
  const groups = new Map<string, typeof houseRules>();
  for (const rule of houseRules) {
    const group = rule.category || rule.moduleName;
    const list = groups.get(group) ?? [];
    list.push(rule);
    groups.set(group, list);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <ScrollText className="h-3.5 w-3.5 text-primary/60" />
        <h4 className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          House Rules
        </h4>
      </div>
      {Array.from(groups.entries()).map(([group, rules]) => (
        <div key={group} className="space-y-1">
          <p className="text-[9px] font-[Cinzel] uppercase tracking-wider text-muted-foreground/70">
            {group}
          </p>
          {rules.map((rule) => (
            <div
              key={rule.key}
              className="rounded-sm border border-border bg-muted/20 px-2.5 py-1.5"
            >
              <p className="text-xs font-medium text-foreground">{rule.title}</p>
              <p className="text-[10px] text-muted-foreground">{rule.description}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
