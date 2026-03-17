import { useState, useMemo } from 'react';
import { X, Loader2, Search, Plus, Swords, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useSrdItems, useCloneSrdItem } from '@/hooks/useItems';
import type { SrdItemTemplate } from '@/types/item';

interface ItemBrowserProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  characterId?: string;
  scope?: 'character' | 'party';
}

type BrowserFilter = 'all' | 'weapons' | 'armor' | 'gear' | 'consumables' | 'magic' | 'ammunition';

const FILTER_PILLS: { key: BrowserFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'weapons', label: 'Weapons' },
  { key: 'armor', label: 'Armor' },
  { key: 'gear', label: 'Gear' },
  { key: 'consumables', label: 'Consumables' },
  { key: 'magic', label: 'Magic Items' },
  { key: 'ammunition', label: 'Ammunition' },
];

const FILTER_TYPE_MAP: Record<BrowserFilter, string[] | null> = {
  all: null,
  weapons: ['weapon'],
  armor: ['armor'],
  gear: ['gear', 'tool'],
  consumables: ['consumable'],
  magic: [], // special: filter by attunementRequired
  ammunition: ['gear'], // ammunition mapped to gear category in ItemTemplate
};

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-zinc-600/40 text-zinc-300 border-zinc-600/40',
  uncommon: 'bg-green-900/40 text-green-400 border-green-700/40',
  rare: 'bg-blue-900/40 text-blue-400 border-blue-700/40',
  'very-rare': 'bg-purple-900/40 text-purple-400 border-purple-700/40',
  legendary: 'bg-amber-900/40 text-amber-400 border-amber-600/40',
  artifact: 'bg-red-900/40 text-red-400 border-red-700/40',
};

const TYPE_COLORS: Record<string, string> = {
  weapon: 'bg-red-900/30 text-red-400 border-red-800/30',
  armor: 'bg-blue-900/30 text-blue-400 border-blue-800/30',
  shield: 'bg-blue-900/30 text-blue-400 border-blue-800/30',
  gear: 'bg-amber-900/30 text-amber-400 border-amber-800/30',
  tool: 'bg-amber-900/30 text-amber-400 border-amber-800/30',
  consumable: 'bg-green-900/30 text-green-400 border-green-800/30',
  treasure: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30',
  ammunition: 'bg-orange-900/30 text-orange-400 border-orange-800/30',
};

function formatGp(copperValue: number): string {
  if (copperValue >= 100) return `${(copperValue / 100).toLocaleString()} gp`;
  if (copperValue >= 10) return `${(copperValue / 10).toLocaleString()} sp`;
  return `${copperValue} cp`;
}

function rarityLabel(rarity: string): string {
  return rarity.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ItemBrowser({ open, onClose, campaignId, characterId, scope }: ItemBrowserProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<BrowserFilter>('all');
  const [selectedItem, setSelectedItem] = useState<SrdItemTemplate | null>(null);

  const { data: srdItems, isLoading } = useSrdItems();
  const cloneMutation = useCloneSrdItem();

  const filtered = useMemo(() => {
    if (!srdItems) return [];
    let list = srdItems;

    // Type filter
    if (filter === 'magic') {
      list = list.filter((item) => item.attunementRequired);
    } else {
      const types = FILTER_TYPE_MAP[filter];
      if (types) {
        list = list.filter((item) => types.includes(item.category));
      }
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    return list;
  }, [srdItems, filter, search]);

  function handleClone(item: SrdItemTemplate) {
    cloneMutation.mutate(
      {
        templateId: item._id,
        campaignId,
        characterId,
        scope: scope ?? (characterId ? 'character' : 'party'),
      },
      {
        onSuccess: () => {
          toast.success(`Added "${item.name}" to inventory`);
        },
        onError: () => {
          toast.error(`Failed to add "${item.name}"`);
        },
      },
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border border-t-2 border-t-brass/50 bg-card shadow-warm-lg tavern-card iron-brackets texture-parchment">
        {renderBrowserHeader(onClose)}
        {renderSearchAndFilters(search, setSearch, filter, setFilter)}
        <div className="flex flex-1 overflow-hidden">
          {renderItemList(filtered, isLoading, selectedItem, setSelectedItem)}
          {selectedItem && renderDetailPane(selectedItem, handleClone, cloneMutation.isPending)}
        </div>
      </div>
    </div>
  );
}

function renderBrowserHeader(onClose: () => void) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
      <h2 className="font-['IM_Fell_English'] text-xl text-card-foreground">
        SRD Item Browser
      </h2>
      <button
        onClick={onClose}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function renderSearchAndFilters(
  search: string,
  setSearch: (v: string) => void,
  filter: BrowserFilter,
  setFilter: (f: BrowserFilter) => void,
) {
  return (
    <div className="space-y-2 border-b border-border/40 px-5 py-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-sm border border-input bg-input py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]"
        />
      </div>
      {renderFilterPills(filter, setFilter)}
    </div>
  );
}

function renderFilterPills(filter: BrowserFilter, setFilter: (f: BrowserFilter) => void) {
  return (
    <div className="flex flex-wrap gap-1">
      {FILTER_PILLS.map((pill) => (
        <button
          key={pill.key}
          type="button"
          onClick={() => setFilter(pill.key)}
          className={`shrink-0 rounded-sm px-3 py-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider transition-colors ${
            filter === pill.key
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent'
          }`}
        >
          {pill.label}
        </button>
      ))}
    </div>
  );
}

function renderItemList(
  items: SrdItemTemplate[],
  isLoading: boolean,
  selectedItem: SrdItemTemplate | null,
  setSelectedItem: (item: SrdItemTemplate) => void,
) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">No items match your search.</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto ${selectedItem ? 'w-1/2 border-r border-border/30' : 'w-full'}`}>
      <div className="space-y-0.5 p-2">
        {items.map((item) => {
          const isSelected = selectedItem?._id === item._id;
          return renderItemRow(item, isSelected, setSelectedItem);
        })}
      </div>
    </div>
  );
}

function renderItemRow(
  item: SrdItemTemplate,
  isSelected: boolean,
  onSelect: (item: SrdItemTemplate) => void,
) {
  const rarityClass = RARITY_COLORS[item.rarity] ?? RARITY_COLORS.common;
  const typeClass = TYPE_COLORS[item.category] ?? TYPE_COLORS.gear;

  return (
    <button
      key={item._id}
      type="button"
      onClick={() => onSelect(item)}
      className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left transition-colors ${
        isSelected
          ? 'bg-primary/15 border border-primary/30'
          : 'hover:bg-muted/30 border border-transparent'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{item.name}</span>
          {item.attunementRequired && <Sparkles className="h-3 w-3 shrink-0 text-purple-400" />}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className={`inline-block rounded-sm border px-1.5 py-0.5 text-[10px] uppercase ${typeClass}`}>
            {item.category}
          </span>
          <span className={`inline-block rounded-sm border px-1.5 py-0.5 text-[10px] uppercase ${rarityClass}`}>
            {rarityLabel(item.rarity)}
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-xs text-muted-foreground">{formatGp(item.cost)}</div>
        <div className="text-[10px] text-muted-foreground">{item.weight} lb</div>
      </div>
    </button>
  );
}

function renderDetailPane(
  item: SrdItemTemplate,
  onClone: (item: SrdItemTemplate) => void,
  isPending: boolean,
) {
  const rarityClass = RARITY_COLORS[item.rarity] ?? RARITY_COLORS.common;
  const typeClass = TYPE_COLORS[item.category] ?? TYPE_COLORS.gear;

  return (
    <div className="flex w-1/2 flex-col overflow-y-auto p-4">
      {renderDetailHeader(item, rarityClass, typeClass)}
      {renderDetailStats(item)}
      {renderDetailDescription(item)}
      {renderDetailWeaponInfo(item)}
      {renderDetailArmorInfo(item)}
      {renderDetailMagicInfo(item)}
      <div className="mt-auto pt-4">
        <Button
          onClick={() => onClone(item)}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1 h-4 w-4" />
          )}
          {isPending ? 'Adding...' : 'Add to Inventory'}
        </Button>
      </div>
    </div>
  );
}

function renderDetailHeader(item: SrdItemTemplate, rarityClass: string, typeClass: string) {
  return (
    <div className="mb-3">
      <h3 className="font-['IM_Fell_English'] text-lg text-card-foreground">{item.name}</h3>
      <div className="mt-1 flex items-center gap-1.5">
        <span className={`inline-block rounded-sm border px-1.5 py-0.5 text-[10px] uppercase ${typeClass}`}>
          {item.category}
        </span>
        <span className={`inline-block rounded-sm border px-1.5 py-0.5 text-[10px] uppercase ${rarityClass}`}>
          {rarityLabel(item.rarity)}
        </span>
        {item.attunementRequired && (
          <span className="inline-block rounded-sm border border-purple-700/40 bg-purple-900/40 px-1.5 py-0.5 text-[10px] uppercase text-purple-400">
            Magical
          </span>
        )}
        {item.attunementRequired && (
          <span className="inline-block rounded-sm border border-indigo-700/40 bg-indigo-900/40 px-1.5 py-0.5 text-[10px] uppercase text-indigo-400">
            Attunement
          </span>
        )}
      </div>
    </div>
  );
}

function renderDetailStats(item: SrdItemTemplate) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-2 rounded-sm border border-border/40 bg-muted/20 p-2">
      <div className="text-center">
        <div className="text-[10px] uppercase text-muted-foreground">Value</div>
        <div className="text-sm font-medium text-foreground">{formatGp(item.cost)}</div>
      </div>
      <div className="text-center">
        <div className="text-[10px] uppercase text-muted-foreground">Weight</div>
        <div className="text-sm font-medium text-foreground">{item.weight} lb</div>
      </div>
    </div>
  );
}

function renderDetailDescription(item: SrdItemTemplate) {
  if (!item.description) return null;
  return (
    <div className="mb-3">
      <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
    </div>
  );
}

function renderDetailWeaponInfo(item: SrdItemTemplate) {
  if (item.category !== 'weapon' || (!item.damageFormula && !item.properties?.length)) return null;
  return (
    <div className="mb-3 space-y-1.5 rounded-sm border border-red-900/20 bg-red-950/10 p-2">
      <div className="flex items-center gap-1.5">
        <Swords className="h-3.5 w-3.5 text-red-400" />
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-red-400">
          Weapon Stats
        </span>
      </div>
      {item.damageFormula && (
        <div className="text-sm text-foreground">
          {item.damageFormula} {item.damageType ?? ''}
        </div>
      )}
      {item.properties && item.properties.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.properties.map((prop) => (
            <span
              key={prop}
              className="rounded-sm border border-red-800/30 bg-red-900/20 px-1.5 py-0.5 text-[10px] text-red-300"
            >
              {prop}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function renderDetailArmorInfo(item: SrdItemTemplate) {
  if ((item.category !== 'armor' && item.category !== 'shield') || !item.armorClass) return null;
  return (
    <div className="mb-3 space-y-1.5 rounded-sm border border-blue-900/20 bg-blue-950/10 p-2">
      <div className="flex items-center gap-1.5">
        <Shield className="h-3.5 w-3.5 text-blue-400" />
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-blue-400">
          Armor Stats
        </span>
      </div>
      <div className="text-sm text-foreground">
        AC {item.armorClass}
        {item.armorType && ` (${item.armorType})`}
      </div>
      {item.stealthDisadvantage && (
        <div className="text-xs text-amber-400">Stealth Disadvantage</div>
      )}
    </div>
  );
}

function renderDetailMagicInfo(item: SrdItemTemplate) {
  if (!item.attunementRequired) return null;
  return (
    <div className="mb-3 space-y-1.5 rounded-sm border border-purple-900/20 bg-purple-950/10 p-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-purple-400">
          Magic Properties
        </span>
      </div>
      {item.attunementRequired && (
        <div className="text-xs text-purple-300">Requires Attunement</div>
      )}
    </div>
  );
}
