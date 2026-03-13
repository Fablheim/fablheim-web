import { useState } from 'react';
import { Plus, X, ShieldAlert } from 'lucide-react';
import { useCampaign, useUpdateSafetyTools } from '@/hooks/useCampaigns';

interface SafetyToolsPanelProps {
  campaignId: string;
}

export function SafetyToolsPanel({ campaignId }: SafetyToolsPanelProps) {
  const { data: campaign } = useCampaign(campaignId);
  const updateSafety = useUpdateSafetyTools();

  const safetyTools = campaign?.safetyTools ?? { lines: [], veils: [], xCardEnabled: false };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-primary/70" />
        <h2 className="font-['IM_Fell_English'] text-lg font-semibold text-foreground">
          Safety Tools
        </h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Set boundaries for your table. These apply to all sessions in this campaign.
      </p>

      <ListSection
        title="Lines"
        subtitle="Topics that will never appear in this campaign"
        items={safetyTools.lines}
        placeholder="e.g. Character death of children, sexual violence..."
        onUpdate={(lines) =>
          updateSafety.mutate({ campaignId, data: { lines } })
        }
      />

      <ListSection
        title="Veils"
        subtitle="Topics that may occur but won't be described in detail"
        items={safetyTools.veils}
        placeholder="e.g. Torture, romantic scenes..."
        onUpdate={(veils) =>
          updateSafety.mutate({ campaignId, data: { veils } })
        }
      />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">X-Card</h3>
        <p className="text-xs text-muted-foreground">
          Allows any player to anonymously signal discomfort and skip content immediately
        </p>
        <label className="flex items-center gap-3 cursor-pointer">
          <button
            type="button"
            role="switch"
            aria-checked={safetyTools.xCardEnabled}
            onClick={() =>
              updateSafety.mutate({
                campaignId,
                data: { xCardEnabled: !safetyTools.xCardEnabled },
              })
            }
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              safetyTools.xCardEnabled ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                safetyTools.xCardEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-sm text-foreground">
            {safetyTools.xCardEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
        {safetyTools.xCardEnabled && (
          <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            When enabled, all players see an X-Card button during live sessions.
            Pressing it anonymously pauses the scene so the table can check in.
            No player is identified.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable list editor for lines / veils ──────────────────

interface ListSectionProps {
  title: string;
  subtitle: string;
  items: string[];
  placeholder: string;
  onUpdate: (items: string[]) => void;
}

function ListSection({ title, subtitle, items, placeholder, onUpdate }: ListSectionProps) {
  const [draft, setDraft] = useState('');

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed || items.includes(trimmed)) return;
    onUpdate([...items, trimmed]);
    setDraft('');
  }

  function handleRemove(index: number) {
    onUpdate(items.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>

      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="flex items-center gap-2 rounded-md border border-border/50 bg-background/40 px-3 py-1.5 text-sm text-foreground"
            >
              <span className="flex-1">{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Remove "${item}"`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={200}
          className="flex-1 rounded-md border border-border/60 bg-background/60 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="flex items-center gap-1 rounded-md border border-border/60 bg-background/60 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-background/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}
