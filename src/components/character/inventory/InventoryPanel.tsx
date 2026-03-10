import { useState, useMemo, useCallback } from 'react';
import { Plus, Weight, Sparkles, Loader2, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from './CurrencyDisplay';
import { ItemRow } from './ItemRow';
import { ItemFormModal, type ItemFormData } from './ItemFormModal';
import {
  useItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useEquipItem,
  useUnequipItem,
  useToggleAttunement,
  useCurrency,
  useUpdateCurrency,
} from '@/hooks/useItems';
import type { Character } from '@/types/campaign';
import type { Item, ItemType, CharacterCurrency } from '@/types/item';

interface InventoryPanelProps {
  character: Character;
  campaignId: string;
}

type TabFilter = 'all' | 'weapons' | 'armor' | 'gear' | 'consumables' | 'treasure';

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'weapons', label: 'Weapons' },
  { key: 'armor', label: 'Armor' },
  { key: 'gear', label: 'Gear' },
  { key: 'consumables', label: 'Consumables' },
  { key: 'treasure', label: 'Treasure' },
];

const TAB_TYPE_MAP: Record<TabFilter, ItemType[] | null> = {
  all: null,
  weapons: ['weapon'],
  armor: ['armor', 'shield'],
  gear: ['gear', 'tool', 'ammunition'],
  consumables: ['consumable'],
  treasure: ['treasure'],
};

function computeCarryCapacity(character: Character): number {
  const str = character.stats?.str ?? character.stats?.strength ?? 10;
  return str * 15;
}

function computeTotalWeight(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
}

function countAttuned(items: Item[]): number {
  return items.filter((i) => i.isAttuned).length;
}

export function InventoryPanel({ character, campaignId }: InventoryPanelProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const { data: items, isLoading: itemsLoading } = useItems(character._id);
  const { data: currency } = useCurrency(character._id);

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const equipItem = useEquipItem();
  const unequipItem = useUnequipItem();
  const toggleAttunement = useToggleAttunement();
  const updateCurrency = useUpdateCurrency();

  const allItems = items ?? [];
  const capacity = computeCarryCapacity(character);
  const totalWeight = computeTotalWeight(allItems);
  const attunedCount = countAttuned(allItems);
  const weightPct = capacity > 0 ? Math.min(100, (totalWeight / capacity) * 100) : 0;
  const isEncumbered = totalWeight > capacity;

  const [collapsedContainers, setCollapsedContainers] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    const types = TAB_TYPE_MAP[activeTab];
    if (!types) return allItems;
    return allItems.filter((i) => types.includes(i.type));
  }, [allItems, activeTab]);

  // Group items: loose items (no parentItemId), containers, and contained items
  const { looseItems, containers, containedItemsMap } = useMemo(() => {
    const cMap = new Map<string, Item[]>();
    const containerList: Item[] = [];
    const loose: Item[] = [];

    // First pass: identify containers
    const containerIds = new Set(filteredItems.filter((i) => i.isContainer).map((i) => i._id));

    for (const item of filteredItems) {
      if (item.isContainer) {
        containerList.push(item);
      } else if (item.parentItemId && containerIds.has(item.parentItemId)) {
        const siblings = cMap.get(item.parentItemId) ?? [];
        siblings.push(item);
        cMap.set(item.parentItemId, siblings);
      } else {
        loose.push(item);
      }
    }
    return { looseItems: loose, containers: containerList, containedItemsMap: cMap };
  }, [filteredItems]);

  const toggleContainer = useCallback((id: string) => {
    setCollapsedContainers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleEquip = useCallback(
    (id: string, slot: string) => {
      equipItem.mutate(
        { id, characterId: character._id, slot },
        { onError: () => toast.error('Failed to equip item') },
      );
    },
    [equipItem, character._id],
  );

  const handleUnequip = useCallback(
    (id: string) => {
      unequipItem.mutate(
        { id, characterId: character._id },
        { onError: () => toast.error('Failed to unequip item') },
      );
    },
    [unequipItem, character._id],
  );

  const handleToggleAttunement = useCallback(
    (id: string) => {
      toggleAttunement.mutate(
        { id, characterId: character._id },
        { onError: (err: Error) => toast.error(err.message || 'Failed to toggle attunement') },
      );
    },
    [toggleAttunement, character._id],
  );

  const handleEdit = useCallback((item: Item) => {
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteItem.mutate(
        { id, characterId: character._id },
        { onError: () => toast.error('Failed to delete item') },
      );
    },
    [deleteItem, character._id],
  );

  const handleCurrencyUpdate = useCallback(
    (data: Partial<CharacterCurrency>) => {
      updateCurrency.mutate(
        { characterId: character._id, data },
        { onError: () => toast.error('Failed to update currency') },
      );
    },
    [updateCurrency, character._id],
  );

  function handleFormSubmit(formData: ItemFormData) {
    if (editingItem) {
      updateItem.mutate(
        { id: editingItem._id, characterId: character._id, data: formData },
        {
          onSuccess: () => {
            setModalOpen(false);
            setEditingItem(null);
          },
          onError: () => toast.error('Failed to update item'),
        },
      );
    } else {
      createItem.mutate(
        { ...formData, characterId: character._id, campaignId },
        {
          onSuccess: () => {
            setModalOpen(false);
          },
          onError: () => toast.error('Failed to create item'),
        },
      );
    }
  }

  function openAddModal() {
    setEditingItem(null);
    setModalOpen(true);
  }

  return (
    <div className="flex h-full flex-col bg-[hsl(24,18%,9%)]">
      {renderPanelHeader(openAddModal)}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderCurrencySection(currency, handleCurrencyUpdate, updateCurrency.isPending)}
        {renderWeightBar(totalWeight, capacity, weightPct, isEncumbered)}
        {renderAttunementIndicator(attunedCount)}
        {renderTabs(activeTab, setActiveTab)}
        {renderItemList(
          looseItems,
          containers,
          containedItemsMap,
          collapsedContainers,
          toggleContainer,
          itemsLoading,
          handleEquip,
          handleUnequip,
          handleToggleAttunement,
          handleEdit,
          handleDelete,
        )}
      </div>
      <ItemFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        onSubmit={handleFormSubmit}
        item={editingItem}
        isPending={createItem.isPending || updateItem.isPending}
        containers={allItems.filter((i) => i.isContainer)}
      />
    </div>
  );
}

function renderPanelHeader(openAddModal: () => void) {
  return (
    <div className="flex items-center justify-between border-b border-[hsla(38,50%,30%,0.15)] px-4 py-3">
      <h2 className="font-[Cinzel] text-sm font-semibold uppercase tracking-wider text-foreground">
        Inventory
      </h2>
      <Button size="sm" onClick={openAddModal}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add Item
      </Button>
    </div>
  );
}

function renderCurrencySection(
  currency: CharacterCurrency | undefined,
  onUpdate: (data: Partial<CharacterCurrency>) => void,
  isPending: boolean,
) {
  return (
    <CurrencyDisplay
      currency={currency}
      onUpdate={onUpdate}
      isPending={isPending}
    />
  );
}

function renderWeightBar(
  totalWeight: number,
  capacity: number,
  weightPct: number,
  isEncumbered: boolean,
) {
  const barColor = isEncumbered ? 'bg-red-500' : weightPct > 75 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="rounded-md border border-border bg-card/50 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Weight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
            Encumbrance
          </span>
        </div>
        <span className={`text-xs font-medium ${isEncumbered ? 'text-red-400' : 'text-foreground'}`}>
          {totalWeight.toFixed(1)} / {capacity} lb
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, weightPct)}%` }}
        />
      </div>
    </div>
  );
}

function renderAttunementIndicator(attunedCount: number) {
  if (attunedCount === 0) return null;
  return (
    <div className="flex items-center gap-1.5 px-1">
      <Sparkles className="h-3.5 w-3.5 text-purple-400" />
      <span className="text-xs text-muted-foreground">
        Attuned: {attunedCount} / 3
      </span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full ${
              i < attunedCount ? 'bg-purple-400' : 'bg-muted/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function renderTabs(
  activeTab: TabFilter,
  setActiveTab: (tab: TabFilter) => void,
) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border/40 pb-1">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => setActiveTab(tab.key)}
          className={`shrink-0 rounded-sm px-3 py-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider transition-colors ${
            activeTab === tab.key
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function renderItemList(
  looseItems: Item[],
  containers: Item[],
  containedItemsMap: Map<string, Item[]>,
  collapsedContainers: Set<string>,
  toggleContainer: (id: string) => void,
  isLoading: boolean,
  onEquip: (id: string, slot: string) => void,
  onUnequip: (id: string) => void,
  onToggleAttunement: (id: string) => void,
  onEdit: (item: Item) => void,
  onDelete: (id: string) => void,
) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalItems = looseItems.length + containers.length;
  if (totalItems === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No items found. Add items using the button above.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {containers.map((container) => {
        const contents = containedItemsMap.get(container._id) ?? [];
        const isCollapsed = collapsedContainers.has(container._id);
        const contentsWeight = contents.reduce((s, i) => s + i.weight * i.quantity, 0);

        return (
          <div key={container._id} className="rounded-sm border border-amber-800/30 bg-amber-950/10">
            <button
              type="button"
              onClick={() => toggleContainer(container._id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-amber-950/20 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <Package className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="flex-1 truncate text-sm font-medium text-amber-400">
                {container.name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {contents.length} item{contents.length !== 1 ? 's' : ''}
                {container.containerCapacity > 0 && ` / ${container.containerCapacity}`}
              </span>
              <span className="text-xs text-muted-foreground">
                {contentsWeight.toFixed(1)} lb
              </span>
            </button>
            {!isCollapsed && (
              <div className="space-y-1 border-t border-amber-800/20 px-2 pb-2 pt-1">
                <ItemRow
                  item={container}
                  onEquip={onEquip}
                  onUnequip={onUnequip}
                  onToggleAttunement={onToggleAttunement}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
                {contents.map((item) => (
                  <div key={item._id} className="ml-4">
                    <ItemRow
                      item={item}
                      onEquip={onEquip}
                      onUnequip={onUnequip}
                      onToggleAttunement={onToggleAttunement}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                ))}
                {contents.length === 0 && (
                  <p className="py-2 text-center text-xs text-muted-foreground italic">
                    Empty container
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
      {looseItems.map((item) => (
        <ItemRow
          key={item._id}
          item={item}
          onEquip={onEquip}
          onUnequip={onUnequip}
          onToggleAttunement={onToggleAttunement}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
