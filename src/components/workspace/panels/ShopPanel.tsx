import { useState } from 'react';
import {
  Store,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  PackagePlus,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import {
  useShops,
  useCreateShop,
  useUpdateShop,
  useDeleteShop,
  useAddShopItem,
  useRemoveShopItem,
  useRestockShop,
} from '@/hooks/useShops';
import type { Shop, ShopCategory, ShopItem } from '@/types/shop';

interface ShopPanelProps {
  campaignId: string;
}

const INPUT_CLS =
  'w-full rounded-sm border border-border bg-[hsl(24,15%,10%)] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40 transition-colors';
const LABEL_CLS = 'block text-xs font-medium text-muted-foreground mb-1';

const SHOP_TYPE_LABELS: Record<ShopCategory, string> = {
  general: 'General',
  weapons: 'Weapons',
  armor: 'Armor',
  magic: 'Magic',
  potions: 'Potions',
  tavern: 'Tavern',
  temple: 'Temple',
  blacksmith: 'Blacksmith',
  other: 'Other',
};

export function ShopPanel({ campaignId }: ShopPanelProps) {
  const { data: shops, isLoading, error } = useShops(campaignId);
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load shops" />;

  const all = shops ?? [];

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {renderHeader()}
      <div className="flex-1 space-y-3 p-4">
        {renderShopList()}
        {showCreate && (
          <CreateShopForm campaignId={campaignId} onClose={() => setShowCreate(false)} />
        )}
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center justify-between border-b border-[hsla(38,30%,25%,0.2)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-primary/70" />
          <h2 className="font-['IM_Fell_English'] text-base font-semibold text-foreground">
            Economy
          </h2>
          <span className="text-[10px] text-muted-foreground/50">{all.length} shops</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-3 w-3" />
          New Shop
        </Button>
      </div>
    );
  }

  function renderShopList() {
    if (all.length === 0) {
      return (
        <p className="text-center text-xs italic text-muted-foreground/60">
          No shops yet — create one to start tracking inventory
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {all.map((shop) => (
          <ShopCard key={shop._id} shop={shop} campaignId={campaignId} />
        ))}
      </div>
    );
  }
}

/* ── Shop Card ─────────────────────────────────────────────── */

function ShopCard({ shop, campaignId }: { shop: Shop; campaignId: string }) {
  const [expanded, setExpanded] = useState(false);
  const deleteShop = useDeleteShop();
  const restockShop = useRestockShop();

  const itemCount = shop.inventory.length;
  const totalValue = shop.inventory.reduce((s, i) => s + i.basePrice * i.quantity, 0);

  return (
    <div className="rounded border border-border/40 bg-[hsl(24,15%,11%)]">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground/50 hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>

        <ShoppingBag className={`h-3.5 w-3.5 shrink-0 ${shop.isClosed ? 'text-red-400/50' : 'text-primary/50'}`} />

        <div className="min-w-0 flex-1">
          {renderShopTitle()}
          <p className="text-[10px] text-muted-foreground/60">
            {itemCount} item{itemCount !== 1 ? 's' : ''}
            {totalValue > 0 ? ` · ${Math.round(totalValue * shop.priceModifier)} gp stock` : ''}
            {shop.shopkeeperName ? ` · ${shop.shopkeeperName}` : ''}
          </p>
        </div>

        {renderActions()}
      </div>

      {expanded && <ShopExpanded shop={shop} campaignId={campaignId} />}
    </div>
  );

  function renderShopTitle() {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground">{shop.name}</span>
        <span className="rounded bg-[hsl(24,15%,14%)] px-1.5 py-0.5 text-[9px] text-muted-foreground">
          {SHOP_TYPE_LABELS[shop.shopType]}
        </span>
        {shop.isClosed && (
          <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] text-red-400">
            Closed
          </span>
        )}
        {shop.priceModifier !== 1 && (
          <span className={`text-[9px] ${shop.priceModifier > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {shop.priceModifier > 1 ? '+' : ''}{Math.round((shop.priceModifier - 1) * 100)}%
          </span>
        )}
      </div>
    );
  }

  function renderActions() {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="text-muted-foreground/40 transition-colors hover:text-primary"
          disabled={restockShop.isPending}
          title="Restock all items to max"
          onClick={() =>
            restockShop.mutate(
              { campaignId, shopId: shop._id },
              {
                onSuccess: () => toast.success('Shop restocked'),
                onError: () => toast.error('Failed to restock'),
              },
            )
          }
        >
          <RefreshCw className={`h-3 w-3 ${restockShop.isPending ? 'animate-spin' : ''}`} />
        </button>
        <button
          type="button"
          className="text-muted-foreground/40 transition-colors hover:text-blood"
          disabled={deleteShop.isPending}
          onClick={() =>
            deleteShop.mutate(
              { campaignId, shopId: shop._id },
              {
                onSuccess: () => toast.success('Shop deleted'),
                onError: () => toast.error('Failed to delete'),
              },
            )
          }
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    );
  }
}

/* ── Expanded Shop Details ─────────────────────────────────── */

function ShopExpanded({ shop, campaignId }: { shop: Shop; campaignId: string }) {
  const [showAddItem, setShowAddItem] = useState(false);
  const updateShop = useUpdateShop();

  return (
    <div className="space-y-2 border-t border-border/20 px-3 py-2">
      {renderShopDetails()}
      {renderInventory()}
      {showAddItem && (
        <AddItemForm campaignId={campaignId} shopId={shop._id} onClose={() => setShowAddItem(false)} />
      )}
    </div>
  );

  function renderShopDetails() {
    return (
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div>
          <span className="text-muted-foreground/50">Region: </span>
          <span className="text-muted-foreground">{shop.region || '—'}</span>
        </div>
        <div>
          <span className="text-muted-foreground/50">Shop Gold: </span>
          <span className="text-muted-foreground">{shop.shopGold} gp</span>
        </div>
        <div>
          <span className="text-muted-foreground/50">Restock: </span>
          <span className="text-muted-foreground">{shop.restock.frequency}</span>
        </div>
        {shop.description && (
          <div className="col-span-3">
            <span className="text-muted-foreground/50">Description: </span>
            <span className="text-muted-foreground">{shop.description}</span>
          </div>
        )}
        <div className="col-span-3 flex gap-2">
          <PriceModifierSlider
            value={shop.priceModifier}
            onChange={(val) =>
              updateShop.mutate(
                { campaignId, shopId: shop._id, data: { priceModifier: val } },
                { onError: () => toast.error('Failed to update') },
              )
            }
          />
          <button
            type="button"
            className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
              shop.isClosed
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            }`}
            onClick={() =>
              updateShop.mutate(
                { campaignId, shopId: shop._id, data: { isClosed: !shop.isClosed } },
                { onError: () => toast.error('Failed to update') },
              )
            }
          >
            {shop.isClosed ? 'Reopen' : 'Close Shop'}
          </button>
        </div>
      </div>
    );
  }

  function renderInventory() {
    return (
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground/60">Inventory</span>
          <button
            type="button"
            onClick={() => setShowAddItem(true)}
            className="flex items-center gap-0.5 text-[10px] text-primary/60 hover:text-primary"
          >
            <PackagePlus className="h-3 w-3" />
            Add
          </button>
        </div>
        {shop.inventory.length === 0 ? (
          <p className="text-[10px] italic text-muted-foreground/40">No items in stock</p>
        ) : (
          <div className="space-y-0.5">
            {shop.inventory.map((item) => (
              <InventoryRow
                key={item.id}
                item={item}
                priceModifier={shop.priceModifier}
                campaignId={campaignId}
                shopId={shop._id}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
}

/* ── Inventory Row ─────────────────────────────────────────── */

function InventoryRow({
  item,
  priceModifier,
  campaignId,
  shopId,
}: {
  item: ShopItem;
  priceModifier: number;
  campaignId: string;
  shopId: string;
}) {
  const removeItem = useRemoveShopItem();
  const adjustedPrice = Math.round(item.basePrice * priceModifier * 100) / 100;

  return (
    <div className="flex items-center gap-2 rounded bg-[hsl(24,15%,9%)] px-2 py-1 text-[10px]">
      <span className="min-w-0 flex-1 text-muted-foreground">{item.name}</span>
      <span className="text-muted-foreground/40">x{item.quantity}</span>
      {adjustedPrice > 0 && (
        <span className="tabular-nums text-muted-foreground/60">{adjustedPrice} gp</span>
      )}
      <span className="text-[8px] text-muted-foreground/30">{item.rarity}</span>
      <button
        type="button"
        className="text-muted-foreground/30 hover:text-blood"
        disabled={removeItem.isPending}
        onClick={() =>
          removeItem.mutate(
            { campaignId, shopId, itemId: item.id },
            { onError: () => toast.error('Failed to remove item') },
          )
        }
      >
        <Trash2 className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

/* ── Price Modifier Slider ─────────────────────────────────── */

function PriceModifierSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [local, setLocal] = useState(value);
  const pct = Math.round((local - 1) * 100);

  return (
    <div className="flex flex-1 items-center gap-2">
      <span className="text-[9px] text-muted-foreground/50">Price Modifier:</span>
      <input
        type="range"
        min={0.5}
        max={2.0}
        step={0.05}
        value={local}
        onChange={(e) => setLocal(Number(e.target.value))}
        onMouseUp={() => { if (local !== value) onChange(local); }}
        onTouchEnd={() => { if (local !== value) onChange(local); }}
        className="w-20 accent-primary"
      />
      <span className={`text-[9px] tabular-nums ${pct > 0 ? 'text-amber-400' : pct < 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
        {pct > 0 ? '+' : ''}{pct}%
      </span>
    </div>
  );
}

/* ── Add Item Form ─────────────────────────────────────────── */

function AddItemForm({
  campaignId,
  shopId,
  onClose,
}: {
  campaignId: string;
  shopId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [maxQuantity, setMaxQuantity] = useState(-1);
  const [rarity, setRarity] = useState('common');
  const addItem = useAddShopItem();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    addItem.mutate(
      {
        campaignId,
        shopId,
        data: {
          name: name.trim(),
          basePrice: basePrice || undefined,
          quantity,
          maxQuantity,
          rarity,
        },
      },
      {
        onSuccess: () => {
          toast.success('Item added');
          setName('');
          setBasePrice(0);
          setQuantity(1);
        },
        onError: () => toast.error('Failed to add item'),
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded border border-border/40 bg-[hsl(24,15%,9%)] p-2"
    >
      <p className="text-[10px] font-medium text-muted-foreground">Add Item</p>
      <input
        className={INPUT_CLS}
        placeholder="Item name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className={LABEL_CLS}>Price (gp)</label>
          <input
            type="number"
            className={INPUT_CLS}
            min={0}
            value={basePrice}
            onChange={(e) => setBasePrice(Number(e.target.value))}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Qty</label>
          <input
            type="number"
            className={INPUT_CLS}
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Max Qty</label>
          <input
            type="number"
            className={INPUT_CLS}
            min={-1}
            value={maxQuantity}
            onChange={(e) => setMaxQuantity(Number(e.target.value))}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Rarity</label>
          <select className={INPUT_CLS} value={rarity} onChange={(e) => setRarity(e.target.value)}>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="very-rare">Very Rare</option>
            <option value="legendary">Legendary</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={addItem.isPending || !name.trim()}>
          {addItem.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Add
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </form>
  );
}

/* ── Create Shop Form ──────────────────────────────────────── */

function CreateShopForm({
  campaignId,
  onClose,
}: {
  campaignId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [shopType, setShopType] = useState<ShopCategory>('general');
  const [shopkeeperName, setShopkeeperName] = useState('');
  const [region, setRegion] = useState('');
  const [description, setDescription] = useState('');
  const createShop = useCreateShop();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    createShop.mutate(
      {
        campaignId,
        data: {
          name: name.trim(),
          shopType,
          shopkeeperName: shopkeeperName.trim() || undefined,
          region: region.trim() || undefined,
          description: description.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Shop created');
          onClose();
        },
        onError: () => toast.error('Failed to create shop'),
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded border border-border/40 bg-[hsl(24,15%,11%)] p-3"
    >
      <p className="text-xs font-medium text-muted-foreground">New Shop</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={LABEL_CLS}>Name</label>
          <input
            className={INPUT_CLS}
            placeholder="The Rusty Anvil"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Type</label>
          <select
            className={INPUT_CLS}
            value={shopType}
            onChange={(e) => setShopType(e.target.value as ShopCategory)}
          >
            {(Object.keys(SHOP_TYPE_LABELS) as ShopCategory[]).map((t) => (
              <option key={t} value={t}>
                {SHOP_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={LABEL_CLS}>Shopkeeper</label>
          <input
            className={INPUT_CLS}
            placeholder="NPC name (optional)"
            value={shopkeeperName}
            onChange={(e) => setShopkeeperName(e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Region</label>
          <input
            className={INPUT_CLS}
            placeholder="Waterdeep, Neverwinter..."
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </div>
      </div>
      <input
        className={INPUT_CLS}
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={createShop.isPending || !name.trim()}>
          {createShop.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Create
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
