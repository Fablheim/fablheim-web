import { Coins, Hammer, Package, Store } from 'lucide-react';
import { useEconomyContext } from './EconomyContext';
import { economyToneClass, economyToneLabel, formatCoinLine } from './EconomyContext';

export function EconomyRightPanel() {
  const {
    treasury,
    shops,
    partyItems,
    downtime,
    treasuryEnabled,
    domainsList,
    selectedDomain,
    setSelectedDomain,
    setShowTransactionComposer,
    setShowMerchantComposer,
  } = useEconomyContext();

  const projectCount = downtime.filter((activity) =>
    ['crafting', 'business', 'working'].includes(activity.type),
  ).length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {renderHeader()}
      {renderBody()}
    </div>
  );

  function renderHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-3 py-3">
        {renderChips()}
        {renderActions()}
      </div>
    );
  }

  function renderChips() {
    return (
      <div className="flex flex-wrap gap-1.5">
        <StatChip icon={Coins} label="Treasury" value={treasuryEnabled ? formatCoinLine(treasury) : 'Off'} />
        <StatChip icon={Store} label="Shops" value={String(shops.length)} />
        <StatChip icon={Package} label="Items" value={String(partyItems.length)} />
        <StatChip icon={Hammer} label="Projects" value={String(projectCount)} />
      </div>
    );
  }

  function renderActions() {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={!treasuryEnabled}
          onClick={() => {
            setShowTransactionComposer((current) => !current);
            setShowMerchantComposer(false);
          }}
          className="rounded-full border border-[hsla(42,72%,52%,0.38)] bg-[hsla(42,72%,42%,0.14)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[hsl(42,78%,80%)] transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-[hsla(42,72%,60%,0.46)]"
        >
          Add Transaction
        </button>
        <button
          type="button"
          onClick={() => {
            setShowMerchantComposer((current) => !current);
            setShowTransactionComposer(false);
          }}
          className="rounded-full border border-[hsla(32,24%,26%,0.62)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[hsl(38,24%,80%)] transition hover:border-[hsla(42,40%,42%,0.38)]"
        >
          Add Merchant
        </button>
      </div>
    );
  }

  function renderBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-1.5">
          {domainsList.map((domain) => renderDomainButton(domain))}
        </div>
      </div>
    );
  }

  function renderDomainButton(domain: (typeof domainsList)[number]) {
    const isSelected = selectedDomain === domain.id;
    return (
      <button
        key={domain.id}
        type="button"
        onClick={() => setSelectedDomain(domain.id)}
        className={`block w-full rounded-[12px] border px-3 py-2.5 text-left transition ${
          isSelected
            ? 'border-[hsla(42,64%,58%,0.58)] bg-[linear-gradient(180deg,hsla(40,64%,52%,0.16)_0%,hsla(24,22%,12%,0.9)_100%)]'
            : 'border-[hsla(32,26%,26%,0.45)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.96),hsla(24,14%,11%,0.98))] hover:border-[hsla(38,50%,58%,0.4)]'
        }`}
      >
        {renderDomainTop(domain)}
        {renderDomainSummary(domain)}
      </button>
    );
  }

  function renderDomainTop(domain: (typeof domainsList)[number]) {
    return (
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <domain.icon className="h-3.5 w-3.5 shrink-0 text-[hsl(42,72%,72%)]" />
          <p className="truncate font-[Cinzel] text-xs text-[hsl(35,24%,92%)]">{domain.label}</p>
        </div>
        <div className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] ${economyToneClass(domain.tone)}`}>
          {economyToneLabel(domain.tone)}
        </div>
      </div>
    );
  }

  function renderDomainSummary(domain: (typeof domainsList)[number]) {
    return (
      <div className="mt-1">
        <p className="text-[10px] text-[hsl(30,12%,58%)]">{domain.summary}</p>
        {domain.signal && (
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-[hsl(30,12%,48%)]">{domain.signal}</p>
        )}
      </div>
    );
  }
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.72)] px-2 py-1">
      <Icon className="h-3 w-3 text-[hsl(42,72%,72%)]" />
      <span className="text-[9px] uppercase tracking-[0.14em] text-[hsl(30,12%,52%)]">{label}</span>
      <span className="font-[Cinzel] text-[10px] text-[hsl(38,34%,88%)]">{value}</span>
    </div>
  );
}
