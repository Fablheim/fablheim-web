import { useState } from 'react';
import { Coins, Pencil, Check, X } from 'lucide-react';

interface WealthTierDisplayProps {
  currentTier: string;
  tiers: string[];
  onUpdate: (tier: string) => void;
  isPending?: boolean;
  canEdit?: boolean;
}

const TIER_STYLES: Record<string, { color: string; bg: string }> = {
  poverty: { color: 'text-red-400', bg: 'bg-red-500/15' },
  modest: { color: 'text-orange-300', bg: 'bg-orange-500/15' },
  comfortable: { color: 'text-amber-400', bg: 'bg-amber-500/15' },
  wealthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  opulent: { color: 'text-purple-300', bg: 'bg-purple-500/15' },
};

function tierLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function WealthTierDisplay({
  currentTier,
  tiers,
  onUpdate,
  isPending,
  canEdit = true,
}: WealthTierDisplayProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentTier);

  function startEdit() {
    setDraft(currentTier);
    setEditing(true);
  }

  function handleSave() {
    onUpdate(draft);
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  const style = TIER_STYLES[currentTier] ?? { color: 'text-foreground', bg: 'bg-muted/30' };

  return (
    <div className="rounded-md border border-border bg-card/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
            Wealth
          </span>
        </div>
        {canEdit && (
          editing ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="rounded p-1 text-emerald-400 hover:bg-emerald-900/30"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded p-1 text-muted-foreground hover:bg-muted/50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEdit}
              className="rounded p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )
        )}
      </div>

      {editing ? (
        <div className="flex gap-1.5">
          {tiers.map((tier) => {
            const s = TIER_STYLES[tier] ?? { color: 'text-foreground', bg: 'bg-muted/30' };
            const isSelected = tier === draft;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setDraft(tier)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? `${s.bg} ${s.color} ring-1 ring-current`
                    : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                {tierLabel(tier)}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 rounded-md px-3 py-1.5 ${style.bg}`}>
            <span className={`text-sm font-semibold ${style.color}`}>
              {tierLabel(currentTier)}
            </span>
          </div>
          <div className="flex gap-0.5">
            {tiers.map((tier, i) => (
              <div
                key={tier}
                className={`h-1.5 w-4 rounded-full ${
                  i <= tiers.indexOf(currentTier) ? style.bg.replace('/15', '/50') : 'bg-muted/30'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
