import { useCampaignHealthContext } from './CampaignHealthContext';
import { healthToneBadgeClass, healthToneLabel } from './CampaignHealthContext';

export function CampaignHealthRightPanel() {
  const { health, selectedDomain, setSelectedDomain } = useCampaignHealthContext();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {renderHeader()}
      {renderBody()}
    </div>
  );

  function renderHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Campaign Pulse</p>
        <div className="mt-3 rounded-[18px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.62)] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(30,12%,56%)]">Current Read</p>
          <p className="mt-2 font-[Cinzel] text-base text-[hsl(38,38%,88%)]">{health.headline}</p>
        </div>
      </div>
    );
  }

  function renderBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-1.5">
          {health.domains.map((domain) => renderDomainButton(domain))}
        </div>
      </div>
    );
  }

  function renderDomainButton(domain: (typeof health.domains)[number]) {
    const isSelected = selectedDomain === domain.id;
    return (
      <button
        key={domain.id}
        type="button"
        onClick={() => setSelectedDomain(domain.id)}
        className={`block w-full rounded-[12px] border px-3 py-2.5 text-left transition ${
          isSelected
            ? 'border-[hsla(42,64%,58%,0.58)] bg-[linear-gradient(180deg,hsla(40,64%,52%,0.16)_0%,hsla(24,22%,12%,0.9)_100%)]'
            : 'border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] hover:border-[hsla(42,42%,46%,0.38)]'
        }`}
      >
        {renderDomainTop(domain)}
        {renderDomainNote(domain)}
      </button>
    );
  }

  function renderDomainTop(domain: (typeof health.domains)[number]) {
    return (
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <domain.icon className="h-3.5 w-3.5 shrink-0 text-[hsl(42,72%,72%)]" />
          <p className="truncate font-[Cinzel] text-xs text-[hsl(38,32%,88%)]">{domain.label}</p>
        </div>
        <div className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] ${healthToneBadgeClass(domain.tone)}`}>
          {healthToneLabel(domain.tone)}
        </div>
      </div>
    );
  }

  function renderDomainNote(domain: (typeof health.domains)[number]) {
    return (
      <p className="mt-1 text-[10px] leading-5 text-[hsl(30,12%,56%)]">{domain.note}</p>
    );
  }
}
