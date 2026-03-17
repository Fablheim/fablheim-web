import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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

// ── Types ────────────────────────────────────────────────────────────────────

export type EconomyDomainId =
  | 'party-wealth'
  | 'goods-stock'
  | 'markets-settlements'
  | 'factions-influence'
  | 'crafting-projects';

export type EconomyTone = 'prosperous' | 'stable' | 'scarce' | 'building' | 'constrained';

export type EconomyDomain = {
  id: EconomyDomainId;
  label: string;
  tone: EconomyTone;
  summary: string;
  detail: string;
  signal?: string;
  icon: typeof Coins;
};

export type TransactionDraft = {
  amount: string;
  currency: 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
  type: 'deposit' | 'withdrawal';
  description: string;
  characterId: string;
  characterName: string;
};

export type MerchantDraft = {
  name: string;
  shopkeeperName: string;
  shopType: Shop['shopType'];
  region: string;
  priceModifier: string;
  shopGold: string;
  entityId: string;
  description: string;
};

// ── Context value ─────────────────────────────────────────────────────────────

interface EconomyContextValue {
  campaignId: string;
  onTabChange: (tab: string) => void;

  campaign: ReturnType<typeof useCampaign>['data'];
  characters: NonNullable<ReturnType<typeof useCharacters>['data']>;
  partyItems: Item[];
  treasury: ReturnType<typeof useTreasury>['data'];
  treasuryLedger: ReturnType<typeof useTreasuryLedger>['data'];
  shops: Shop[];
  domains: Domain[];
  downtime: DowntimeActivity[];
  entities: WorldEntity[];
  trackers: WorldStateTracker[];
  characterCurrencies: Array<{ character: NonNullable<ReturnType<typeof useCharacters>['data']>[number]; currency: CharacterCurrency }>;

  wealthSummary: ReturnType<typeof buildWealthSummary>;
  goodsSummary: ReturnType<typeof buildGoodsSummary>;
  marketSummary: ReturnType<typeof buildMarketSummary>;
  factionSummary: ReturnType<typeof buildFactionSummary>;
  craftingSummary: ReturnType<typeof buildCraftingSummary>;
  domainsList: EconomyDomain[];

  selectedDomain: EconomyDomainId;
  setSelectedDomain: (id: EconomyDomainId) => void;
  activeDomain: EconomyDomain;
  treasuryEnabled: boolean;

  addTransaction: ReturnType<typeof useAddTreasuryTransaction>;
  createShop: ReturnType<typeof useCreateShop>;

  showTransactionComposer: boolean;
  setShowTransactionComposer: (value: boolean | ((prev: boolean) => boolean)) => void;
  showMerchantComposer: boolean;
  setShowMerchantComposer: (value: boolean | ((prev: boolean) => boolean)) => void;
  transactionDraft: TransactionDraft;
  setTransactionDraft: (value: TransactionDraft | ((prev: TransactionDraft) => TransactionDraft)) => void;
  merchantDraft: MerchantDraft;
  setMerchantDraft: (value: MerchantDraft | ((prev: MerchantDraft) => MerchantDraft)) => void;

  submitTransaction: () => void;
  submitMerchant: () => void;
}

const EconomyContext = createContext<EconomyContextValue | null>(null);

export function useEconomyContext() {
  const ctx = useContext(EconomyContext);
  if (!ctx) throw new Error('useEconomyContext must be used within EconomyProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function EconomyProvider({
  campaignId,
  onTabChange,
  children,
}: {
  campaignId: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
}) {
  const { data: campaign } = useCampaign(campaignId);
  const { data: charactersData } = useCharacters(campaignId);
  const { data: partyItemsData } = usePartyItems(campaignId);
  const { data: treasury } = useTreasury(campaignId);
  const { data: treasuryLedger } = useTreasuryLedger(campaignId, 12);
  const { data: shopsData } = useShops(campaignId);
  const { data: domainsData } = useDomains(campaignId);
  const { data: downtimeData } = useDowntimeActivities(campaignId);
  const { data: entitiesData } = useWorldEntities(campaignId);
  const { data: trackersData } = useTrackers(campaignId);
  const addTransaction = useAddTreasuryTransaction(campaignId);
  const createShop = useCreateShop();

  const characters = useMemo(() => charactersData ?? [], [charactersData]);
  const partyItems = useMemo(() => partyItemsData ?? [], [partyItemsData]);
  const shops = useMemo(() => shopsData ?? [], [shopsData]);
  const domains = useMemo(() => domainsData ?? [], [domainsData]);
  const downtime = useMemo(() => downtimeData ?? [], [downtimeData]);
  const entities = useMemo(() => entitiesData ?? [], [entitiesData]);
  const trackers = useMemo(() => trackersData ?? [], [trackersData]);

  const currencyQueries = useQueries({
    queries: characters.map((character) => ({
      queryKey: ['currency', character._id],
      queryFn: () => itemsApi.getCurrency(character._id),
      enabled: !!character._id,
    })),
  });

  const characterCurrencies = useMemo(
    () =>
      currencyQueries
        .map((query, index) => ({
          character: characters[index],
          currency: query.data,
        }))
        .filter(
          (entry): entry is { character: NonNullable<typeof characters>[number]; currency: CharacterCurrency } =>
            Boolean(entry.character && entry.currency),
        ),
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
    () => buildWealthSummary(treasury, treasuryLedger?.entries ?? [], partyItems, characterCurrencies),
    [treasury, treasuryLedger?.entries, partyItems, characterCurrencies],
  );
  const goodsSummary = useMemo(
    () => buildGoodsSummary(partyItems, shops, downtime),
    [partyItems, shops, downtime],
  );
  const marketSummary = useMemo(
    () => buildMarketSummary(shops, domains, entities),
    [shops, domains, entities],
  );
  const factionSummary = useMemo(
    () => buildFactionSummary(entities, trackers),
    [entities, trackers],
  );
  const craftingSummary = useMemo(
    () => buildCraftingSummary(downtime, domains, trackers),
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

  const value: EconomyContextValue = {
    campaignId,
    onTabChange,
    campaign,
    characters,
    partyItems,
    treasury,
    treasuryLedger,
    shops,
    domains,
    downtime,
    entities,
    trackers,
    characterCurrencies,
    wealthSummary,
    goodsSummary,
    marketSummary,
    factionSummary,
    craftingSummary,
    domainsList,
    selectedDomain,
    setSelectedDomain,
    activeDomain,
    treasuryEnabled,
    addTransaction,
    createShop,
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
  };

  return <EconomyContext.Provider value={value}>{children}</EconomyContext.Provider>;
}

// ── Summary builders ─────────────────────────────────────────────────────────

export function buildWealthSummary(
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

export function buildGoodsSummary(items: Item[], shops: Shop[], downtime: DowntimeActivity[]) {
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

export function buildMarketSummary(shops: Shop[], domains: Domain[], entities: WorldEntity[]) {
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

export function buildFactionSummary(entities: WorldEntity[], trackers: WorldStateTracker[]) {
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

export function buildCraftingSummary(downtime: DowntimeActivity[], domains: Domain[], trackers: WorldStateTracker[]) {
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

// ── Pure helpers ─────────────────────────────────────────────────────────────

export function economyToneLabel(tone: EconomyTone) {
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

export function economyToneClass(tone: EconomyTone) {
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

export function toGoldValue(currency: { cp?: number; sp?: number; ep?: number; gp?: number; pp?: number }) {
  return (currency.cp ?? 0) / 100 + (currency.sp ?? 0) / 10 + (currency.ep ?? 0) / 2 + (currency.gp ?? 0) + (currency.pp ?? 0) * 10;
}

export function formatCoinLine(currency?: { cp?: number; sp?: number; ep?: number; gp?: number; pp?: number } | null) {
  if (!currency) return 'No ledger';
  return `${currency.gp ?? 0} gp · ${currency.sp ?? 0} sp · ${currency.cp ?? 0} cp`;
}

export function hasCurrencySystem(campaign: ReturnType<typeof useCampaign>['data']) {
  const enabled = campaign?.rulesConfig?.enabledModules ?? [];
  return enabled.some((moduleId) => ['party-treasury', 'coins-dnd', 'wealth-tiers', 'abstract-currency'].includes(moduleId));
}

export function startCase(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
