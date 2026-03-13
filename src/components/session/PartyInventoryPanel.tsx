import { useState } from 'react';
import { Package, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { usePartyItems, useCreateItem, useUpdateItem, useDeleteItem } from '@/hooks/useItems';
import type { Item, ItemType, Rarity } from '@/types/item';

interface PartyInventoryPanelProps {
  campaignId: string;
}

const ITEM_TYPES: ItemType[] = ['gear', 'weapon', 'armor', 'shield', 'consumable', 'treasure', 'ammunition', 'tool'];
const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'very-rare', 'legendary', 'artifact'];

const RARITY_COLORS: Record<Rarity, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  'very-rare': 'text-purple-400',
  legendary: 'text-amber-400',
  artifact: 'text-red-400',
};

export function PartyInventoryPanel({ campaignId }: PartyInventoryPanelProps) {
  const { data: items, isLoading } = usePartyItems(campaignId);
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ItemType>('gear');
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(0);
  const [rarity, setRarity] = useState<Rarity>('common');
  const [notes, setNotes] = useState('');

  function resetForm() {
    setName('');
    setType('gear');
    setQuantity(1);
    setWeight(0);
    setRarity('common');
    setNotes('');
  }

  function handleAdd() {
    if (!name.trim()) return;
    createItem.mutate(
      {
        scope: 'party',
        campaignId,
        name: name.trim(),
        type,
        quantity,
        weight,
        rarity,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          setShowForm(false);
          toast.success('Item added to party loot');
        },
      },
    );
  }

  function handleDelete(item: Item) {
    deleteItem.mutate(
      { id: item._id, campaignId },
      { onSuccess: () => toast.success(`Removed ${item.name}`) },
    );
  }

  function handleQuantityChange(item: Item, delta: number) {
    const newQty = Math.max(1, item.quantity + delta);
    updateItem.mutate({ id: item._id, campaignId, data: { quantity: newQty } });
  }

  const totalWeight = (items ?? []).reduce((sum, item) => sum + item.weight * item.quantity, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-warm tavern-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h3 className="font-[Cinzel] text-sm font-semibold tracking-wider text-foreground">
            Party Loot
          </h3>
          {items && items.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {items.length} items · {totalWeight.toFixed(1)} lb
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : (
            <>
              <Plus className="mr-1 h-3 w-3" />
              Add
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <div className="mb-3 rounded-md border border-gold/20 bg-accent/30 p-3 space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              className="rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground"
            >
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={rarity}
              onChange={(e) => setRarity(e.target.value as Rarity)}
              className="rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground"
            >
              {RARITIES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                min={1}
                className="w-16 rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                placeholder="Qty"
              />
              <input
                type="number"
                value={weight || ''}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                min={0}
                step={0.1}
                className="w-16 rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                placeholder="lb"
              />
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="primary"
              disabled={!name.trim() || createItem.isPending}
              onClick={handleAdd}
            >
              {createItem.isPending ? 'Adding...' : 'Add to Party Loot'}
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (!items || items.length === 0) && (
        <p className="py-3 text-center text-xs text-muted-foreground italic">
          No party loot yet. Add shared items like bags of holding, carts, or unclaimed treasure.
        </p>
      )}

      {items && items.length > 0 && (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent/30"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm text-foreground">{item.name}</span>
                  <span className={`text-[10px] ${RARITY_COLORS[item.rarity]}`}>
                    {item.rarity}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{item.type}</span>
                </div>
                {item.notes && (
                  <p className="truncate text-[10px] text-muted-foreground">{item.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item, -1)}
                  disabled={item.quantity <= 1}
                  className="rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-6 text-center text-xs tabular-nums text-foreground">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item, 1)}
                  className="rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  +
                </button>
              </div>

              {item.weight > 0 && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {(item.weight * item.quantity).toFixed(1)} lb
                </span>
              )}

              <button
                type="button"
                onClick={() => handleDelete(item)}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                title="Remove item"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
