import { Coins, Hammer, Package, Store } from 'lucide-react';
import { shellPanelClass } from '@/lib/panel-styles';
import { useEconomyContext } from './EconomyContext';
import {
  economyToneClass,
  economyToneLabel,
  formatCoinLine,
  startCase,
  buildWealthSummary,
  buildGoodsSummary,
  buildMarketSummary,
  buildFactionSummary,
  buildCraftingSummary,
} from './EconomyContext';
import type { TransactionDraft } from './EconomyContext';
import type { Shop } from '@/types/shop';

const fieldClass =
  'w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(24,18%,10%,0.92)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,10%,44%)] outline-none transition focus:border-[hsla(42,64%,58%,0.58)]';
const labelClass = 'text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]';
const sectionLabelClass = 'text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]';

export function EconomyDeskV2() {
  const {
    characters,
    entities,
    wealthSummary,
    goodsSummary,
    marketSummary,
    factionSummary,
    craftingSummary,
    selectedDomain,
    activeDomain,
    treasuryEnabled,
    showTransactionComposer,
    setShowTransactionComposer,
    showMerchantComposer,
    setShowMerchantComposer,
    transactionDraft,
    setTransactionDraft,
    merchantDraft,
    setMerchantDraft,
    submitTransaction,
    submitMerchant,
    onTabChange,
    treasury,
    shops,
    partyItems,
    downtime,
  } = useEconomyContext();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(42,40%,24%,0.12),transparent_28%),linear-gradient(180deg,hsl(224,18%,8%)_0%,hsl(20,20%,7%)_100%)] p-4 text-[hsl(38,24%,88%)]">
      <div className={`${shellPanelClass} min-h-0 flex-1 flex flex-col overflow-hidden`}>
        {renderHeader()}
        {renderBody()}
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <header className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Campaign Ledger</p>
        {renderHeaderContent()}
        {renderHeaderChips()}
      </header>
    );
  }

  function renderHeaderContent() {
    return (
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        {renderTitleRow()}
        {renderQuickActions()}
      </div>
    );
  }

  function renderTitleRow() {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,42%,90%)]">
          {activeDomain.label}
        </h2>
        <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${economyToneClass(activeDomain.tone)}`}>
          {economyToneLabel(activeDomain.tone)}
        </span>
      </div>
    );
  }

  function renderQuickActions() {
    return (
      <div className="flex flex-wrap gap-2 items-center">
        <QuickAction
          label="Add Transaction"
          disabled={!treasuryEnabled}
          onClick={() => {
            setShowTransactionComposer((current) => !current);
            setShowMerchantComposer(false);
          }}
        />
        <QuickAction
          label="Add Merchant"
          onClick={() => {
            setShowMerchantComposer((current) => !current);
            setShowTransactionComposer(false);
          }}
        />
        <QuickAction label="Log Trade" onClick={() => onTabChange('random-tables')} />
        <QuickAction label="Add Resource Tracker" onClick={() => onTabChange('trackers')} />
      </div>
    );
  }

  function renderHeaderChips() {
    const projectCount = downtime.filter((activity) =>
      ['crafting', 'business', 'working'].includes(activity.type),
    ).length;
    return (
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <HeaderChip icon={Coins} label="Treasury" value={treasuryEnabled ? formatCoinLine(treasury) : 'Not enabled'} />
        <HeaderChip icon={Store} label="Shops" value={`${shops.length}`} />
        <HeaderChip icon={Package} label="Party Items" value={`${partyItems.length}`} />
        <HeaderChip icon={Hammer} label="Projects" value={`${projectCount}`} />
      </div>
    );
  }

  function renderBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {showTransactionComposer && renderTransactionComposer()}
        {showMerchantComposer && renderMerchantComposer()}
        {renderWorkspace()}
      </div>
    );
  }

  function renderTransactionComposer() {
    return (
      <ComposerSection
        title="Treasury Transaction"
        body="Record coin moving into or out of the shared treasury ledger."
        onCancel={() => setShowTransactionComposer(false)}
        onSubmit={submitTransaction}
        submitLabel="Record Transaction"
      >
        {renderTransactionFields()}
      </ComposerSection>
    );
  }

  function renderTransactionFields() {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Direction">
          <select
            value={transactionDraft.type}
            onChange={(event) =>
              setTransactionDraft((current) => ({
                ...current,
                type: event.target.value as TransactionDraft['type'],
              }))
            }
            className={fieldClass}
          >
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
        </Field>
        <Field label="Currency">
          <select
            value={transactionDraft.currency}
            onChange={(event) =>
              setTransactionDraft((current) => ({
                ...current,
                currency: event.target.value as TransactionDraft['currency'],
              }))
            }
            className={fieldClass}
          >
            {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map((currency) => (
              <option key={currency} value={currency}>{currency.toUpperCase()}</option>
            ))}
          </select>
        </Field>
        <Field label="Amount">
          <input
            value={transactionDraft.amount}
            onChange={(event) =>
              setTransactionDraft((current) => ({ ...current, amount: event.target.value }))
            }
            className={fieldClass}
          />
        </Field>
        <Field label="Character">
          <select
            value={transactionDraft.characterId}
            onChange={(event) => {
              const nextId = event.target.value;
              const character = characters.find((entry) => entry._id === nextId);
              setTransactionDraft((current) => ({
                ...current,
                characterId: nextId,
                characterName: character?.name ?? '',
              }));
            }}
            className={fieldClass}
          >
            <option value="">Unassigned</option>
            {characters.map((character) => (
              <option key={character._id} value={character._id}>{character.name}</option>
            ))}
          </select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Note">
            <input
              value={transactionDraft.description}
              onChange={(event) =>
                setTransactionDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Dragon hoard recovered from the drowned vault"
              className={fieldClass}
            />
          </Field>
        </div>
      </div>
    );
  }

  function renderMerchantComposer() {
    return (
      <ComposerSection
        title="Merchant Record"
        body="Add a market presence that the campaign can browse and stock."
        onCancel={() => setShowMerchantComposer(false)}
        onSubmit={submitMerchant}
        submitLabel="Create Merchant"
      >
        {renderMerchantFields()}
      </ComposerSection>
    );
  }

  function renderMerchantFields() {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Shop Name">
          <input value={merchantDraft.name} onChange={(event) => setMerchantDraft((current) => ({ ...current, name: event.target.value }))} className={fieldClass} />
        </Field>
        <Field label="Shopkeeper">
          <input value={merchantDraft.shopkeeperName} onChange={(event) => setMerchantDraft((current) => ({ ...current, shopkeeperName: event.target.value }))} className={fieldClass} />
        </Field>
        <Field label="Shop Type">
          <select value={merchantDraft.shopType} onChange={(event) => setMerchantDraft((current) => ({ ...current, shopType: event.target.value as Shop['shopType'] }))} className={fieldClass}>
            {(['general', 'weapons', 'armor', 'magic', 'potions', 'tavern', 'temple', 'blacksmith', 'other'] as const).map((type) => (
              <option key={type} value={type}>{startCase(type)}</option>
            ))}
          </select>
        </Field>
        <Field label="Region">
          <input value={merchantDraft.region} onChange={(event) => setMerchantDraft((current) => ({ ...current, region: event.target.value }))} className={fieldClass} />
        </Field>
        {renderMerchantFieldsBottom()}
      </div>
    );
  }

  function renderMerchantFieldsBottom() {
    return (
      <>
        <Field label="Price Modifier">
          <input value={merchantDraft.priceModifier} onChange={(event) => setMerchantDraft((current) => ({ ...current, priceModifier: event.target.value }))} className={fieldClass} />
        </Field>
        <Field label="Shop Gold">
          <input value={merchantDraft.shopGold} onChange={(event) => setMerchantDraft((current) => ({ ...current, shopGold: event.target.value }))} className={fieldClass} />
        </Field>
        <Field label="Linked Location">
          <select value={merchantDraft.entityId} onChange={(event) => setMerchantDraft((current) => ({ ...current, entityId: event.target.value }))} className={fieldClass}>
            <option value="">No linked location</option>
            {entities.filter((entity) => entity.type === 'location' || entity.type === 'location_detail').map((entity) => (
              <option key={entity._id} value={entity._id}>{entity.name}</option>
            ))}
          </select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Description">
            <textarea value={merchantDraft.description} onChange={(event) => setMerchantDraft((current) => ({ ...current, description: event.target.value }))} rows={3} className={`${fieldClass} resize-none`} />
          </Field>
        </div>
      </>
    );
  }

  function renderWorkspace() {
    if (selectedDomain === 'party-wealth') {
      return (
        <PartyWealthWorkspace
          summary={wealthSummary}
          treasuryEnabled={treasuryEnabled}
          onOpenRules={() => onTabChange('rules')}
        />
      );
    }
    if (selectedDomain === 'goods-stock') {
      return <GoodsWorkspace summary={goodsSummary} />;
    }
    if (selectedDomain === 'markets-settlements') {
      return <MarketsWorkspace summary={marketSummary} />;
    }
    if (selectedDomain === 'factions-influence') {
      return <FactionsWorkspace summary={factionSummary} onOpenTrackers={() => onTabChange('trackers')} />;
    }
    if (selectedDomain === 'crafting-projects') {
      return <CraftingWorkspace summary={craftingSummary} onOpenDowntime={() => onTabChange('downtime')} />;
    }
    return null;
  }
}

// ── Workspace subcomponents ───────────────────────────────────────────────────

function PartyWealthWorkspace({
  summary,
  treasuryEnabled,
  onOpenRules,
}: {
  summary: ReturnType<typeof buildWealthSummary>;
  treasuryEnabled: boolean;
  onOpenRules: () => void;
}) {
  return (
    <div className="space-y-5">
      <MetricGrid
        cards={[
          { title: 'Shared Treasury', value: summary.treasuryLabel, body: treasuryEnabled ? 'Pulled from the real party treasury ledger.' : 'Treasury module is not enabled for this campaign.' },
          { title: 'Party Stock Value', value: `${summary.partyItemValue} gp`, body: `${summary.partyItemCount} shared item record(s).` },
          { title: 'Character Coin', value: `${summary.characterGpValue} gp`, body: 'Approximate total across tracked character purses.' },
        ]}
      />
      <SplitDetails
        left={{
          title: 'Recent Ledger',
          description: 'These entries come directly from the party treasury ledger.',
          items: summary.ledgerLines,
          empty: 'No treasury transactions have been logged yet.',
        }}
        right={{
          title: 'Coin Holders',
          description: 'Character currency exists per character, so this desk rolls them up for a campaign view.',
          items: summary.characterCurrencyLines,
          empty: 'No individual character currency is available yet.',
        }}
      />
      <Callout
        title="Current Model Boundary"
        body="There is no separate transaction history for individual character purses yet, so only the party treasury has a true ledger. Character coin totals are aggregated from current balances."
        actionLabel="Open Rules"
        onAction={onOpenRules}
      />
    </div>
  );
}

function GoodsWorkspace({ summary }: { summary: ReturnType<typeof buildGoodsSummary> }) {
  return (
    <div className="space-y-5">
      <MetricGrid
        cards={[
          { title: 'Shared Goods', value: String(summary.sharedGoodsCount), body: `${summary.containers} container item(s) among party stock.` },
          { title: 'Shop Inventory', value: String(summary.shopInventoryCount), body: `${summary.stockValue} gp of visible merchant stock.` },
          { title: 'Material Projects', value: String(summary.materialProjects), body: 'Downtime projects using tracked materials.' },
        ]}
      />
      <SplitDetails
        left={{
          title: 'Party Stock Ledger',
          description: 'Shared inventory records, especially containers and treasure, provide the cleanest goods signal.',
          items: summary.partyItemLines,
          empty: 'No party goods are recorded yet.',
        }}
        right={{
          title: 'Materials In Use',
          description: 'These come from downtime materials and outcomes rather than a separate crafting inventory.',
          items: summary.materialLines,
          empty: 'No material-heavy downtime projects are active.',
        }}
      />
    </div>
  );
}

function MarketsWorkspace({ summary }: { summary: ReturnType<typeof buildMarketSummary> }) {
  return (
    <div className="space-y-5">
      <MetricGrid
        cards={[
          { title: 'Markets', value: String(summary.shopCount), body: `${summary.closedShops} currently closed.` },
          { title: 'Settlements', value: String(summary.domainCount), body: `${summary.resourcePools} tracked resource pools across domains.` },
          { title: 'Market Temperature', value: summary.marketLabel, body: summary.marketNote },
        ]}
      />
      <SplitDetails
        left={{
          title: 'Merchant Presence',
          description: 'Campaign shops are real persisted merchant records with inventory, gold, and price modifiers.',
          items: summary.shopLines,
          empty: 'No campaign shops have been created yet.',
        }}
        right={{
          title: 'Settlement Resources',
          description: 'Domains add location-bound resources that read like local supply and capacity.',
          items: summary.domainLines,
          empty: 'No domain resources are configured yet.',
        }}
      />
    </div>
  );
}

function FactionsWorkspace({
  summary,
  onOpenTrackers,
}: {
  summary: ReturnType<typeof buildFactionSummary>;
  onOpenTrackers: () => void;
}) {
  return (
    <div className="space-y-5">
      <MetricGrid
        cards={[
          { title: 'Trade Factions', value: String(summary.factionCount), body: `${summary.reputationTracked} with explicit reputation scores.` },
          { title: 'Pressure Signals', value: String(summary.pressureCount), body: 'Trackers with economic or supply-adjacent language.' },
          { title: 'Influence Read', value: summary.influenceLabel, body: summary.influenceNote },
        ]}
      />
      <SplitDetails
        left={{
          title: 'Faction Leverage',
          description: 'Faction reputation is the strongest current server-side signal for economic influence.',
          items: summary.factionLines,
          empty: 'No faction leverage signals are on file yet.',
        }}
        right={{
          title: 'Economic Pressure',
          description: 'World-state trackers are reused here when their names or notes read like scarcity, unrest, smuggling, or supply pressure.',
          items: summary.pressureLines,
          empty: 'No economy-adjacent trackers are standing out right now.',
        }}
      />
      <Callout
        title="Why Factions Live Here"
        body="The backend does not have a dedicated trade-route or embargo system, but faction reputation and world-state trackers still give a meaningful picture of who holds leverage over commerce."
        actionLabel="Open Trackers"
        onAction={onOpenTrackers}
      />
    </div>
  );
}

function CraftingWorkspace({
  summary,
  onOpenDowntime,
}: {
  summary: ReturnType<typeof buildCraftingSummary>;
  onOpenDowntime: () => void;
}) {
  return (
    <div className="space-y-5">
      <MetricGrid
        cards={[
          { title: 'Crafting Projects', value: String(summary.craftingCount), body: `${summary.businessCount} business/work projects also active.` },
          { title: 'Committed Cost', value: `${summary.totalCost} gp`, body: 'Pulled from downtime cost fields.' },
          { title: 'Project Horizon', value: summary.horizonLabel, body: summary.horizonNote },
        ]}
      />
      <SplitDetails
        left={{
          title: 'Active Projects',
          description: 'These are the downtime records most directly tied to making, managing, or earning resources.',
          items: summary.projectLines,
          empty: 'No active crafting or business projects are being tracked.',
        }}
        right={{
          title: 'Resource Pressure',
          description: 'Domain resource pools and related trackers help show whether projects are happening in abundance or constraint.',
          items: summary.resourceLines,
          empty: 'No project-related resource pressure is being tracked yet.',
        }}
      />
      <Callout
        title="Current Model Boundary"
        body="Crafting exists through downtime records with materials, cost, duration, and outcome. There is not yet a deeper recipe or bill-of-materials subsystem behind it."
        actionLabel="Open Downtime"
        onAction={onOpenDowntime}
      />
    </div>
  );
}

// ── Shared UI components ──────────────────────────────────────────────────────

function ComposerSection({
  title,
  body,
  children,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <div className="mb-5 rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
      <p className={sectionLabelClass}>{title}</p>
      <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,68%)]">{body}</p>
      <div className="mt-4">{children}</div>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onSubmit} className="rounded-2xl border border-[hsla(42,54%,46%,0.48)] bg-[linear-gradient(180deg,hsla(40,72%,52%,0.26)_0%,hsla(36,68%,42%,0.18)_100%)] px-4 py-2 text-sm text-[hsl(40,82%,78%)]">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-2xl border border-[hsla(32,24%,26%,0.62)] px-4 py-2 text-sm text-[hsl(38,24%,80%)]">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function MetricGrid({
  cards,
}: {
  cards: Array<{ title: string; value: string; body: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div key={card.title} className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
          <p className={labelClass}>{card.title}</p>
          <p className="mt-3 font-[Cinzel] text-3xl text-[hsl(38,40%,90%)]">{card.value}</p>
          <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,68%)]">{card.body}</p>
        </div>
      ))}
    </div>
  );
}

function SplitDetails({
  left,
  right,
}: {
  left: { title: string; description: string; items: string[]; empty: string };
  right: { title: string; description: string; items: string[]; empty: string };
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <DetailColumn {...left} />
      <DetailColumn {...right} />
    </div>
  );
}

function DetailColumn({
  title,
  description,
  items,
  empty,
}: {
  title: string;
  description: string;
  items: string[];
  empty: string;
}) {
  return (
    <section className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
      <p className={sectionLabelClass}>{title}</p>
      <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,68%)]">{description}</p>
      {items.length > 0 ? (
        <div className="mt-4 divide-y divide-[hsla(32,24%,24%,0.4)]">
          {items.map((item) => (
            <div key={item} className="py-3 text-sm leading-7 text-[hsl(32,18%,76%)]">
              {item}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[hsl(30,12%,60%)]">{empty}</p>
      )}
    </section>
  );
}

function Callout({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
      <p className={sectionLabelClass}>{title}</p>
      <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,68%)]">{body}</p>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="mt-4 rounded-full border border-[hsla(32,24%,26%,0.62)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[hsl(38,24%,80%)]">
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

function QuickAction({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-[hsla(32,24%,26%,0.62)] bg-[hsla(24,18%,10%,0.72)] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[hsl(38,24%,80%)] transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-[hsla(42,52%,48%,0.42)]"
    >
      {label}
    </button>
  );
}

function HeaderChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[hsla(32,24%,24%,0.58)] bg-[hsla(24,18%,10%,0.72)] px-3 py-1.5">
      <Icon className="h-3.5 w-3.5 text-[hsl(42,72%,72%)]" />
      <span className="text-[10px] uppercase tracking-[0.18em] text-[hsl(30,12%,58%)]">{label}</span>
      <span className="font-[Cinzel] text-sm text-[hsl(38,34%,88%)]">{value}</span>
    </div>
  );
}
