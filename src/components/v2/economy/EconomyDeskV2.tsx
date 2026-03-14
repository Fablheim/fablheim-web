import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  Coins,
  Flag,
  Hammer,
  Package,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { itemsApi } from '@/api/items';
import { useCampaign, useTrackers } from '@/hooks/useCampaigns';
import { useCharacters } from '@/hooks/useCharacters';
import { usePartyItems } from '@/hooks/useItems';
import { useTreasury, useTreasuryLedger, useAddTreasuryTransaction } from '@/hooks/useTreasury';
import { useShops, useCreateShop } from '@/hooks/useShops';
import { useDomains } from '@/hooks/useDomains';
import { useDowntimeActivities } from '@/hooks/useDowntime';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type { CharacterCurrency, Item } from '@/types/item';
import type { Shop } from '@/types/shop';
import type { Domain, WorldEntity, WorldStateTracker } from '@/types/campaign';
import type { DowntimeActivity } from '@/types/downtime';

interface EconomyDeskV2Props {
  campaignId: string;
  onTabChange: (tab: string) => void;
}

type EconomyDomainId =
  | 'party-wealth'
  | 'goods-stock'
  | 'markets-settlements'
  | 'factions-influence'
  | 'crafting-projects';

type EconomyTone = 'prosperous' | 'stable' | 'scarce' | 'building' | 'constrained';

type EconomyDomain = {
  id: EconomyDomainId;
  label: string;
  tone: EconomyTone;
  summary: string;
  detail: string;
  signal?: string;
  icon: typeof Coins;
};

type TransactionDraft = {
  amount: string;
  currency: 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
  type: 'deposit' | 'withdrawal';
  description: string;
  characterId: string;
  characterName: string;
};

type MerchantDraft = {
  name: string;
  shopkeeperName: string;
  shopType: Shop['shopType'];
  region: string;
  priceModifier: string;
  shopGold: string;
  entityId: string;
  description: string;
};

const panelClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.68)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(20,24%,8%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]';
const fieldClass =
  'w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(24,18%,10%,0.92)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,10%,44%)] outline-none transition focus:border-[hsla(42,64%,58%,0.58)]';
const labelClass = 'text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]';

export function EconomyDeskV2({ campaignId, onTabChange }: EconomyDeskV2Props) {
  const { data: campaign } = useCampaign(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const { data: partyItems } = usePartyItems(campaignId);
  const { data: treasury } = useTreasury(campaignId);
  const { data: treasuryLedger } = useTreasuryLedger(campaignId, 12);
  const { data: shops } = useShops(campaignId);
  const { data: domains } = useDomains(campaignId);
  const { data: downtime } = useDowntimeActivities(campaignId);
  const { data: entities } = useWorldEntities(campaignId);
  const { data: trackers } = useTrackers(campaignId);
  const addTransaction = useAddTreasuryTransaction(campaignId);
  const createShop = useCreateShop();

  const currencyQueries = useQueries({
    queries: (characters ?? []).map((character) => ({
      queryKey: ['currency', character._id],
      queryFn: () => itemsApi.getCurrency(character._id),
      enabled: !!character._id,
    })),
  });

  const characterCurrencies = useMemo(
    () =>
      currencyQueries
        .map((query, index) => ({
          character: characters?.[index],
          currency: query.data,
        }))
        .filter((entry): entry is { character: NonNullable<typeof characters>[number]; currency: CharacterCurrency } => Boolean(entry.character && entry.currency)),
    [characters, currencyQueries],
  );

  const [selectedDomain, setSelectedDomain] = useState<EconomyDomainId>('party-wealth');
  const [showTransactionComposer, setShowTransactionComposer] = useState(false);
  const [showMerchantComposer, setShowMerchantComposer] = useState(false);
  const [transactionDraft, setTransactionDraft] = useState<TransactionDraft>({
    amount: '',
    currency: 'gp',
    type: 'deposit',
    description: '',
    characterId: '',
    characterName: '',
  });
  const [merchantDraft, setMerchantDraft] = useState<MerchantDraft>({
    name: '',
    shopkeeperName: '',
    shopType: 'general',
    region: '',
    priceModifier: '1',
    shopGold: '0',
    entityId: '',
    description: '',
  });

  const treasuryEnabled = hasCurrencySystem(campaign);

  const wealthSummary = useMemo(
    () => buildWealthSummary(treasury, treasuryLedger?.entries ?? [], partyItems ?? [], characterCurrencies),
    [treasury, treasuryLedger?.entries, partyItems, characterCurrencies],
  );
  const goodsSummary = useMemo(
    () => buildGoodsSummary(partyItems ?? [], shops ?? [], downtime ?? []),
    [partyItems, shops, downtime],
  );
  const marketSummary = useMemo(
    () => buildMarketSummary(shops ?? [], domains ?? [], entities ?? []),
    [shops, domains, entities],
  );
  const factionSummary = useMemo(
    () => buildFactionSummary(entities ?? [], trackers ?? []),
    [entities, trackers],
  );
  const craftingSummary = useMemo(
    () => buildCraftingSummary(downtime ?? [], domains ?? [], trackers ?? []),
    [downtime, domains, trackers],
  );

  const domainsList: EconomyDomain[] = [
    {
      id: 'party-wealth',
      label: 'Party Wealth',
      tone: wealthSummary.tone,
      summary: wealthSummary.summary,
      detail: wealthSummary.detail,
      signal: wealthSummary.signal,
      icon: Coins,
    },
    {
      id: 'goods-stock',
      label: 'Goods & Stock',
      tone: goodsSummary.tone,
      summary: goodsSummary.summary,
      detail: goodsSummary.detail,
      signal: goodsSummary.signal,
      icon: Package,
    },
    {
      id: 'markets-settlements',
      label: 'Markets & Settlements',
      tone: marketSummary.tone,
      summary: marketSummary.summary,
      detail: marketSummary.detail,
      signal: marketSummary.signal,
      icon: Store,
    },
    {
      id: 'factions-influence',
      label: 'Factions & Influence',
      tone: factionSummary.tone,
      summary: factionSummary.summary,
      detail: factionSummary.detail,
      signal: factionSummary.signal,
      icon: Flag,
    },
    {
      id: 'crafting-projects',
      label: 'Crafting & Projects',
      tone: craftingSummary.tone,
      summary: craftingSummary.summary,
      detail: craftingSummary.detail,
      signal: craftingSummary.signal,
      icon: Hammer,
    },
  ];

  const activeDomain = domainsList.find((domain) => domain.id === selectedDomain) ?? domainsList[0];

  function submitTransaction() {
    const amount = Number.parseInt(transactionDraft.amount, 10);
    if (!treasuryEnabled) {
      toast.error('Party treasury is not enabled for this campaign.');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Enter a transaction amount greater than 0.');
      return;
    }
    if (!transactionDraft.description.trim()) {
      toast.error('Add a note so the ledger has context.');
      return;
    }
    addTransaction.mutate(
      {
        amount,
        currency: transactionDraft.currency,
        type: transactionDraft.type,
        description: transactionDraft.description.trim(),
        characterId: transactionDraft.characterId || undefined,
        characterName: transactionDraft.characterName || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Treasury ledger updated.');
          setShowTransactionComposer(false);
          setTransactionDraft({
            amount: '',
            currency: 'gp',
            type: 'deposit',
            description: '',
            characterId: '',
            characterName: '',
          });
        },
        onError: () => toast.error('Could not record the transaction.'),
      },
    );
  }

  function submitMerchant() {
    if (!merchantDraft.name.trim()) {
      toast.error('Merchant name is required.');
      return;
    }
    createShop.mutate(
      {
        campaignId,
        data: {
          name: merchantDraft.name.trim(),
          shopkeeperName: merchantDraft.shopkeeperName.trim() || undefined,
          shopType: merchantDraft.shopType,
          region: merchantDraft.region.trim() || undefined,
          priceModifier: Number.parseFloat(merchantDraft.priceModifier) || 1,
          shopGold: Number.parseInt(merchantDraft.shopGold, 10) || 0,
          entityId: merchantDraft.entityId || undefined,
          description: merchantDraft.description.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Merchant added to the campaign.');
          setShowMerchantComposer(false);
          setMerchantDraft({
            name: '',
            shopkeeperName: '',
            shopType: 'general',
            region: '',
            priceModifier: '1',
            shopGold: '0',
            entityId: '',
            description: '',
          });
        },
        onError: () => toast.error('Could not create the merchant.'),
      },
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsla(42,40%,24%,0.12),transparent_28%),linear-gradient(180deg,hsl(224,18%,8%)_0%,hsl(20,20%,7%)_100%)] text-[hsl(38,24%,88%)]">
      <header className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(38,30%,60%)]">Trade Desk</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,42%,90%)]">Economy</h2>
            <p className="mt-2 max-w-3xl text-sm text-[hsl(30,14%,66%)]">
              Track wealth, goods, markets, and the projects that turn resources into change across the campaign world.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <HeaderChip icon={Coins} label="Treasury" value={treasuryEnabled ? formatCoinLine(treasury) : 'Not enabled'} />
          <HeaderChip icon={Store} label="Shops" value={`${shops?.length ?? 0}`} />
          <HeaderChip icon={Package} label="Party Items" value={`${partyItems?.length ?? 0}`} />
          <HeaderChip icon={Hammer} label="Projects" value={`${(downtime ?? []).filter((activity) => ['crafting', 'business', 'working'].includes(activity.type)).length}`} />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">
        <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={`${panelClass} min-h-0 overflow-hidden`}>
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-4">
                <p className={labelClass}>Economy Navigator</p>
                <h3 className="mt-1 font-[Cinzel] text-2xl text-[hsl(38,34%,88%)]">Resource Flow</h3>
                <p className="mt-3 text-sm leading-7 text-[hsl(30,14%,66%)]">
                  These domains are built from the actual wealth, inventory, market, domain, and downtime systems already in the campaign.
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                <div className="space-y-2">
                  {domainsList.map((domain) => (
                    <button
                      key={domain.id}
                      type="button"
                      onClick={() => setSelectedDomain(domain.id)}
                      className={`w-full rounded-[20px] border px-4 py-3 text-left transition ${
                        selectedDomain === domain.id
                          ? 'border-[hsla(42,64%,58%,0.58)] bg-[linear-gradient(180deg,hsla(40,64%,52%,0.16)_0%,hsla(24,22%,12%,0.9)_100%)]'
                          : 'border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] hover:border-[hsla(42,42%,46%,0.38)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <domain.icon className="h-4 w-4 text-[hsl(42,72%,72%)]" />
                            <p className="font-[Cinzel] text-base text-[hsl(38,32%,88%)]">{domain.label}</p>
                          </div>
                          <p className="mt-2 text-sm text-[hsl(38,26%,78%)]">{domain.summary}</p>
                          <p className="mt-1 text-xs leading-6 text-[hsl(30,12%,56%)]">{domain.detail}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${toneClass(domain.tone)}`}>
                            {toneLabel(domain.tone)}
                          </div>
                          {domain.signal && (
                            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[hsl(30,12%,52%)]">{domain.signal}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className={`${panelClass} min-h-0 overflow-y-auto`}>
            <div className="px-5 py-5">
              <div className="border-b border-[hsla(32,24%,24%,0.4)] pb-4">
                <p className={labelClass}>Economy Workspace</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <activeDomain.icon className="h-5 w-5 text-[hsl(42,72%,72%)]" />
                  <h3 className="font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">
                    {activeDomain.label}
                  </h3>
                  <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${toneClass(activeDomain.tone)}`}>
                    {toneLabel(activeDomain.tone)}
                  </span>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[hsl(30,14%,66%)]">{activeDomain.detail}</p>
              </div>

              {showTransactionComposer && (
                <ComposerSection
                  title="Treasury Transaction"
                  body="Record coin moving into or out of the shared treasury ledger."
                  onCancel={() => setShowTransactionComposer(false)}
                  onSubmit={submitTransaction}
                  submitLabel="Record Transaction"
                >
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
                          const character = characters?.find((entry) => entry._id === nextId);
                          setTransactionDraft((current) => ({
                            ...current,
                            characterId: nextId,
                            characterName: character?.name ?? '',
                          }));
                        }}
                        className={fieldClass}
                      >
                        <option value="">Unassigned</option>
                        {(characters ?? []).map((character) => (
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
                </ComposerSection>
              )}

              {showMerchantComposer && (
                <ComposerSection
                  title="Merchant Record"
                  body="Add a market presence that the campaign can browse and stock."
                  onCancel={() => setShowMerchantComposer(false)}
                  onSubmit={submitMerchant}
                  submitLabel="Create Merchant"
                >
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
                    <Field label="Price Modifier">
                      <input value={merchantDraft.priceModifier} onChange={(event) => setMerchantDraft((current) => ({ ...current, priceModifier: event.target.value }))} className={fieldClass} />
                    </Field>
                    <Field label="Shop Gold">
                      <input value={merchantDraft.shopGold} onChange={(event) => setMerchantDraft((current) => ({ ...current, shopGold: event.target.value }))} className={fieldClass} />
                    </Field>
                    <Field label="Linked Location">
                      <select value={merchantDraft.entityId} onChange={(event) => setMerchantDraft((current) => ({ ...current, entityId: event.target.value }))} className={fieldClass}>
                        <option value="">No linked location</option>
                        {(entities ?? []).filter((entity) => entity.type === 'location' || entity.type === 'location_detail').map((entity) => (
                          <option key={entity._id} value={entity._id}>{entity.name}</option>
                        ))}
                      </select>
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Description">
                        <textarea value={merchantDraft.description} onChange={(event) => setMerchantDraft((current) => ({ ...current, description: event.target.value }))} rows={3} className={`${fieldClass} resize-none`} />
                      </Field>
                    </div>
                  </div>
                </ComposerSection>
              )}

              {selectedDomain === 'party-wealth' && (
                <PartyWealthWorkspace
                  summary={wealthSummary}
                  treasuryEnabled={treasuryEnabled}
                  onOpenRules={() => onTabChange('rules')}
                />
              )}
              {selectedDomain === 'goods-stock' && (
                <GoodsWorkspace summary={goodsSummary} />
              )}
              {selectedDomain === 'markets-settlements' && (
                <MarketsWorkspace summary={marketSummary} />
              )}
              {selectedDomain === 'factions-influence' && (
                <FactionsWorkspace summary={factionSummary} onOpenTrackers={() => onTabChange('trackers')} />
              )}
              {selectedDomain === 'crafting-projects' && (
                <CraftingWorkspace summary={craftingSummary} onOpenDowntime={() => onTabChange('downtime')} />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

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
    <div className="mt-5 space-y-5">
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
    <div className="mt-5 space-y-5">
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
    <div className="mt-5 space-y-5">
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
    <div className="mt-5 space-y-5">
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
    <div className="mt-5 space-y-5">
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
    <div className="mt-5 rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.56)] p-4">
      <p className={labelClass}>{title}</p>
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
      <p className={labelClass}>{title}</p>
      <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,68%)]">{description}</p>
      {items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item} className="rounded-[18px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,10%,0.8)] px-4 py-3 text-sm leading-7 text-[hsl(32,18%,76%)]">
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
      <p className={labelClass}>{title}</p>
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

function buildWealthSummary(
  treasury: ReturnType<typeof useTreasury>['data'],
  ledger: Array<{ type: string; amount: number; currency: string; description: string; characterName?: string }>,
  partyItems: Item[],
  characterCurrencies: Array<{ character: { name: string }; currency: CharacterCurrency }>,
) {
  const partyItemValue = Math.round(
    partyItems.reduce((sum, item) => sum + (item.value || 0) * (item.quantity || 0), 0),
  );
  const characterGpValue = characterCurrencies.reduce(
    (sum, entry) => sum + toGoldValue(entry.currency),
    0,
  );
  const treasuryGoldValue = treasury ? toGoldValue(treasury) : 0;
  const tone: EconomyTone =
    treasuryGoldValue + partyItemValue > 1000 ? 'prosperous' : treasuryGoldValue + partyItemValue > 200 ? 'stable' : 'building';

  return {
    tone,
    summary:
      treasury
        ? treasuryGoldValue > 0
          ? 'The party has real shared wealth in circulation'
          : 'The shared treasury exists, but coin is still thin'
        : 'Shared wealth is being tracked lightly or not at all',
    detail:
      treasury
        ? 'Treasury, party loot, and character purses give this domain its footing.'
        : 'Treasury support exists, but it may not be enabled for this campaign rules configuration.',
    signal: `${Math.round(treasuryGoldValue)} gp in treasury`,
    treasuryLabel: treasury ? `${treasury.gp} gp` : 'Unavailable',
    partyItemValue,
    partyItemCount: partyItems.length,
    characterGpValue: Math.round(characterGpValue),
    ledgerLines: ledger.slice(0, 6).map((entry) => `${entry.type === 'deposit' ? '+' : '-'}${entry.amount} ${entry.currency.toUpperCase()} — ${entry.description}${entry.characterName ? ` · ${entry.characterName}` : ''}`),
    characterCurrencyLines: characterCurrencies.map((entry) => `${entry.character.name} — ${formatCoinLine(entry.currency)} (~${Math.round(toGoldValue(entry.currency))} gp)`),
  };
}

function buildGoodsSummary(items: Item[], shops: Shop[], downtime: DowntimeActivity[]) {
  const sharedGoodsCount = items.length;
  const containers = items.filter((item) => item.isContainer).length;
  const shopInventoryCount = shops.reduce((sum, shop) => sum + shop.inventory.length, 0);
  const stockValue = Math.round(
    shops.reduce(
      (sum, shop) => sum + shop.inventory.reduce((shopSum, item) => shopSum + item.basePrice * item.quantity * shop.priceModifier, 0),
      0,
    ),
  );
  const materialProjects = downtime.filter((activity) => Boolean(activity.materials?.trim())).length;
  const tone: EconomyTone = stockValue > 500 || sharedGoodsCount > 8 ? 'stable' : materialProjects > 0 ? 'building' : 'scarce';

  return {
    tone,
    summary:
      sharedGoodsCount > 0 || shopInventoryCount > 0
        ? 'Goods and stock are visibly moving through the campaign'
        : 'Very little inventory is currently being tracked',
    detail:
      materialProjects > 0
        ? 'Shared items, merchant stock, and downtime materials all contribute to this picture.'
        : 'The current model reads goods from party loot and merchant inventory first.',
    signal: `${stockValue} gp stock`,
    sharedGoodsCount,
    containers,
    shopInventoryCount,
    stockValue,
    materialProjects,
    partyItemLines: items.slice(0, 6).map((item) => `${item.name} — ${item.quantity} × ${item.value} gp${item.isContainer ? ' · container' : ''}`),
    materialLines: downtime
      .filter((activity) => Boolean(activity.materials?.trim()))
      .slice(0, 6)
      .map((activity) => `${activity.name} — ${activity.materials}${activity.cost ? ` · ${activity.cost} gp committed` : ''}`),
  };
}

function buildMarketSummary(shops: Shop[], domains: Domain[], entities: WorldEntity[]) {
  const locations = new Map(entities.map((entity) => [entity._id, entity]));
  const resourcePools = domains.reduce((sum, domain) => sum + domain.resources.length, 0);
  const closedShops = shops.filter((shop) => shop.isClosed).length;
  const inflatedMarkets = shops.filter((shop) => shop.priceModifier > 1.1).length;
  const cheapMarkets = shops.filter((shop) => shop.priceModifier < 0.95).length;
  const tone: EconomyTone =
    inflatedMarkets > 0 || closedShops > 0 ? 'scarce' : shops.length > 0 || domains.length > 0 ? 'stable' : 'building';

  return {
    tone,
    summary:
      shops.length > 0
        ? 'The campaign has real market records to browse'
        : domains.length > 0
          ? 'Settlements have resource pools, but merchants are still sparse'
          : 'Market structure is only lightly tracked so far',
    detail:
      'Shops provide merchant-level stock and pricing, while domains provide settlement-scale resources.',
    signal: `${shops.length} shops`,
    shopCount: shops.length,
    closedShops,
    domainCount: domains.length,
    resourcePools,
    marketLabel: inflatedMarkets > 0 ? 'Scarcity pockets' : cheapMarkets > 0 ? 'Abundant pockets' : 'Mostly even',
    marketNote:
      inflatedMarkets > 0
        ? `${inflatedMarkets} shop(s) are pricing above normal.`
        : cheapMarkets > 0
          ? `${cheapMarkets} shop(s) are pricing below normal.`
          : 'No strong pricing distortion is being tracked in shop records.',
    shopLines: shops.slice(0, 6).map((shop) => `${shop.name} — ${startCase(shop.shopType)}${shop.region ? ` · ${shop.region}` : ''}${shop.priceModifier !== 1 ? ` · ${Math.round((shop.priceModifier - 1) * 100)}% price shift` : ''}`),
    domainLines: domains.slice(0, 6).map((domain) => `${domain.name} — ${domain.resources.map((resource) => `${resource.name}: ${resource.current}${resource.max ? `/${resource.max}` : ''}`).join(', ')}${locations.get(domain.locationEntityId)?.name ? ` · ${locations.get(domain.locationEntityId)?.name}` : ''}`),
  };
}

function buildFactionSummary(entities: WorldEntity[], trackers: WorldStateTracker[]) {
  const factions = entities.filter((entity) => entity.type === 'faction');
  const reputationTracked = factions.filter((faction) => typeof faction.reputation === 'number').length;
  const pressureTrackers = trackers.filter((tracker) => /\btrade|market|coin|supply|scarcity|smuggl|unrest|price|guild\b/i.test(`${tracker.name} ${tracker.description ?? ''}`));
  const tone: EconomyTone =
    pressureTrackers.some((tracker) => tracker.value >= tracker.max * 0.7) ? 'constrained' : factions.length > 0 ? 'stable' : 'building';

  return {
    tone,
    summary:
      factions.length > 0
        ? 'Faction influence is part of the campaign economy picture'
        : 'No major faction leverage is being tracked yet',
    detail:
      'Faction reputation and economy-adjacent world trackers are the strongest current signals for trade influence.',
    signal: `${factions.length} factions`,
    factionCount: factions.length,
    reputationTracked,
    pressureCount: pressureTrackers.length,
    influenceLabel: pressureTrackers.length > 0 ? 'Pressured' : factions.length > 0 ? 'Present' : 'Light',
    influenceNote:
      pressureTrackers.length > 0
        ? 'Trade pressure is showing up in the world-state tracker layer.'
        : 'Faction reputation exists, but deeper trade-route leverage is not modeled yet.',
    factionLines: factions.slice(0, 6).map((faction) => `${faction.name} — ${faction.disposition ?? 'neutral'}${typeof faction.reputation === 'number' ? ` · rep ${faction.reputation}` : ''}`),
    pressureLines: pressureTrackers.slice(0, 6).map((tracker) => `${tracker.name} — ${tracker.value}/${tracker.max}`),
  };
}

function buildCraftingSummary(downtime: DowntimeActivity[], domains: Domain[], trackers: WorldStateTracker[]) {
  const activeProjects = downtime.filter((activity) => ['planned', 'active'].includes(activity.status));
  const crafting = activeProjects.filter((activity) => activity.type === 'crafting');
  const business = activeProjects.filter((activity) => ['business', 'working'].includes(activity.type));
  const totalCost = activeProjects.reduce((sum, activity) => sum + (activity.cost || 0), 0);
  const domainResources = domains.flatMap((domain) => domain.resources.map((resource) => `${domain.name} — ${resource.name}: ${resource.current}${resource.max ? `/${resource.max}` : ''}`));
  const relevantTrackers = trackers.filter((tracker) => /\bcraft|forge|repair|supply|project|trade\b/i.test(`${tracker.name} ${tracker.description ?? ''}`));
  const tone: EconomyTone = crafting.length > 0 || business.length > 0 ? 'building' : domainResources.length > 0 ? 'stable' : 'scarce';

  return {
    tone,
    summary:
      crafting.length > 0 || business.length > 0
        ? 'Economic projects are actively moving between adventures'
        : 'There are no major crafting or business projects in motion',
    detail:
      'Downtime records provide the actual cost, materials, and duration data for projects right now.',
    signal: `${crafting.length + business.length} active`,
    craftingCount: crafting.length,
    businessCount: business.length,
    totalCost,
    horizonLabel:
      activeProjects.length > 0
        ? `${Math.max(...activeProjects.map((activity) => Math.max(0, activity.durationDays - activity.progressDays)))} day(s)`
        : 'No horizon',
    horizonNote:
      activeProjects.length > 0
        ? 'Longest remaining project time among active economic downtime.'
        : 'No long-horizon economic projects are currently logged.',
    projectLines: activeProjects
      .filter((activity) => ['crafting', 'business', 'working', 'faction_work'].includes(activity.type))
      .slice(0, 6)
      .map((activity) => `${activity.participantName || 'Unassigned'} — ${activity.name}${activity.materials ? ` · ${activity.materials}` : ''}${activity.cost ? ` · ${activity.cost} gp` : ''}`),
    resourceLines: [...domainResources.slice(0, 4), ...relevantTrackers.slice(0, 3).map((tracker) => `${tracker.name} — ${tracker.value}/${tracker.max}`)],
  };
}

function toneLabel(tone: EconomyTone) {
  switch (tone) {
    case 'prosperous':
      return 'Prosperous';
    case 'stable':
      return 'Stable';
    case 'scarce':
      return 'Scarce';
    case 'building':
      return 'Building';
    case 'constrained':
      return 'Constrained';
  }
}

function toneClass(tone: EconomyTone) {
  switch (tone) {
    case 'prosperous':
      return 'border-[hsla(145,42%,42%,0.42)] bg-[hsla(145,42%,18%,0.22)] text-[hsl(145,58%,74%)]';
    case 'stable':
      return 'border-[hsla(210,28%,42%,0.42)] bg-[hsla(210,28%,18%,0.22)] text-[hsl(210,48%,76%)]';
    case 'scarce':
      return 'border-[hsla(12,58%,42%,0.42)] bg-[hsla(12,48%,18%,0.22)] text-[hsl(12,72%,78%)]';
    case 'building':
      return 'border-[hsla(42,52%,42%,0.42)] bg-[hsla(42,52%,18%,0.22)] text-[hsl(42,72%,78%)]';
    case 'constrained':
      return 'border-[hsla(0,58%,42%,0.42)] bg-[hsla(0,48%,18%,0.22)] text-[hsl(6,72%,78%)]';
  }
}

function toGoldValue(currency: { cp?: number; sp?: number; ep?: number; gp?: number; pp?: number }) {
  return (currency.cp ?? 0) / 100 + (currency.sp ?? 0) / 10 + (currency.ep ?? 0) / 2 + (currency.gp ?? 0) + (currency.pp ?? 0) * 10;
}

function formatCoinLine(currency?: { cp?: number; sp?: number; ep?: number; gp?: number; pp?: number } | null) {
  if (!currency) return 'No ledger';
  return `${currency.gp ?? 0} gp · ${currency.sp ?? 0} sp · ${currency.cp ?? 0} cp`;
}

function hasCurrencySystem(campaign: ReturnType<typeof useCampaign>['data']) {
  const enabled = campaign?.rulesConfig?.enabledModules ?? [];
  return enabled.some((moduleId) => ['party-treasury', 'coins-dnd', 'wealth-tiers', 'abstract-currency'].includes(moduleId));
}

function startCase(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
