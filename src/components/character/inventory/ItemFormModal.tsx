import { type FormEvent, useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Item, ItemType, Rarity } from '@/types/item';

interface ItemFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ItemFormData) => void;
  item?: Item | null;
  isPending?: boolean;
}

export interface ItemFormData {
  name: string;
  type: ItemType;
  description: string;
  quantity: number;
  weight: number;
  value: number;
  rarity: Rarity;
  isMagical: boolean;
  requiresAttunement: boolean;
  damageDice: string;
  damageType: string;
  weaponProperties: string[];
  armorClass: number;
  armorType: string;
  stealthDisadvantage: boolean;
  notes: string;
}

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'weapon', label: 'Weapon' },
  { value: 'armor', label: 'Armor' },
  { value: 'shield', label: 'Shield' },
  { value: 'gear', label: 'Gear' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'treasure', label: 'Treasure' },
  { value: 'ammunition', label: 'Ammunition' },
  { value: 'tool', label: 'Tool' },
];

const RARITIES: { value: Rarity; label: string }[] = [
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'very-rare', label: 'Very Rare' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'artifact', label: 'Artifact' },
];

const DAMAGE_TYPES = [
  'slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'lightning',
  'thunder', 'poison', 'acid', 'necrotic', 'radiant', 'force', 'psychic',
];

const WEAPON_PROPERTIES = [
  'ammunition', 'finesse', 'heavy', 'light', 'loading', 'range',
  'reach', 'special', 'thrown', 'two-handed', 'versatile',
];

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

function createDefaultForm(): ItemFormData {
  return {
    name: '',
    type: 'gear',
    description: '',
    quantity: 1,
    weight: 0,
    value: 0,
    rarity: 'common',
    isMagical: false,
    requiresAttunement: false,
    damageDice: '',
    damageType: '',
    weaponProperties: [],
    armorClass: 0,
    armorType: '',
    stealthDisadvantage: false,
    notes: '',
  };
}

function formFromItem(item: Item): ItemFormData {
  return {
    name: item.name,
    type: item.type,
    description: item.description || '',
    quantity: item.quantity,
    weight: item.weight,
    value: item.value,
    rarity: item.rarity,
    isMagical: item.isMagical,
    requiresAttunement: item.requiresAttunement,
    damageDice: item.damageDice || '',
    damageType: item.damageType || '',
    weaponProperties: item.weaponProperties || [],
    armorClass: item.armorClass || 0,
    armorType: item.armorType || '',
    stealthDisadvantage: item.stealthDisadvantage || false,
    notes: item.notes || '',
  };
}

export function ItemFormModal({ open, onClose, onSubmit, item, isPending }: ItemFormModalProps) {
  const isEdit = !!item;
  const [form, setForm] = useState<ItemFormData>(createDefaultForm);

  useEffect(() => {
    if (item) {
      setForm(formFromItem(item));
    } else {
      setForm(createDefaultForm());
    }
  }, [item]);

  if (!open) return null;

  function handleClose() {
    setForm(createDefaultForm());
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  function update<K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleWeaponProperty(prop: string) {
    setForm((prev) => {
      const current = prev.weaponProperties;
      return {
        ...prev,
        weaponProperties: current.includes(prop)
          ? current.filter((p) => p !== prop)
          : [...current, prop],
      };
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border border-t-2 border-t-brass/50 bg-card p-6 shadow-warm-lg tavern-card iron-brackets texture-parchment">
        {renderHeader(isEdit, handleClose)}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {renderBasicFields(form, update)}
          {renderTypeAndRarity(form, update)}
          {renderQuantityWeightValue(form, update)}
          {renderMagicFields(form, update)}
          {form.type === 'weapon' && renderWeaponFields(form, update, toggleWeaponProperty)}
          {(form.type === 'armor' || form.type === 'shield') && renderArmorFields(form, update)}
          {renderNotesField(form, update)}
          {renderActions(isEdit, isPending, handleClose)}
        </form>
      </div>
    </div>
  );
}

function renderHeader(isEdit: boolean, handleClose: () => void) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-['IM_Fell_English'] text-xl text-card-foreground">
        {isEdit ? 'Edit Item' : 'Add Item'}
      </h2>
      <button
        onClick={handleClose}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function renderBasicFields(
  form: ItemFormData,
  update: <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => void,
) {
  return (
    <div>
      <label htmlFor="item-name" className={labelClass}>Name</label>
      <input
        id="item-name"
        type="text"
        required
        maxLength={200}
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder="Item name"
        className={inputClass}
      />
    </div>
  );
}

function renderTypeAndRarity(
  form: ItemFormData,
  update: <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => void,
) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="item-type" className={labelClass}>Type</label>
        <select
          id="item-type"
          value={form.type}
          onChange={(e) => update('type', e.target.value as ItemType)}
          className={inputClass}
        >
          {ITEM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="item-rarity" className={labelClass}>Rarity</label>
        <select
          id="item-rarity"
          value={form.rarity}
          onChange={(e) => update('rarity', e.target.value as Rarity)}
          className={inputClass}
        >
          {RARITIES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function renderQuantityWeightValue(
  form: ItemFormData,
  update: <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => void,
) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label htmlFor="item-qty" className={labelClass}>Qty</label>
        <input
          id="item-qty"
          type="number"
          min={1}
          value={form.quantity}
          onChange={(e) => update('quantity', parseInt(e.target.value) || 1)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="item-weight" className={labelClass}>Weight (lb)</label>
        <input
          id="item-weight"
          type="number"
          min={0}
          step={0.1}
          value={form.weight}
          onChange={(e) => update('weight', parseFloat(e.target.value) || 0)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="item-value" className={labelClass}>Value (cp)</label>
        <input
          id="item-value"
          type="number"
          min={0}
          value={form.value}
          onChange={(e) => update('value', parseInt(e.target.value) || 0)}
          className={inputClass}
        />
      </div>
    </div>
  );
}

function renderMagicFields(
  form: ItemFormData,
  update: <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => void,
) {
  return (
    <div className="flex items-center gap-6">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={form.isMagical}
          onChange={(e) => update('isMagical', e.target.checked)}
          className="rounded border-input"
        />
        Magical
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={form.requiresAttunement}
          onChange={(e) => update('requiresAttunement', e.target.checked)}
          className="rounded border-input"
        />
        Requires Attunement
      </label>
    </div>
  );
}

function renderWeaponFields(
  form: ItemFormData,
  update: <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => void,
  toggleWeaponProperty: (prop: string) => void,
) {
  return (
    <div className="space-y-3 rounded-md border border-red-900/20 bg-red-950/10 p-3">
      <p className={labelClass}>Weapon Properties</p>
      {renderWeaponDamageRow(form, update)}
      {renderWeaponPropertyTags(form, toggleWeaponProperty)}
    </div>
  );
}

function renderWeaponDamageRow(
  form: ItemFormData,
  update: <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => void,
) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label htmlFor="item-damage-dice" className={labelClass}>Damage Dice</label>
        <input
          id="item-damage-dice"
          type="text"
          value={form.damageDice}
          onChange={(e) => update('damageDice', e.target.value)}
          placeholder="1d8"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="item-damage-type" className={labelClass}>Damage Type</label>
        <select
          id="item-damage-type"
          value={form.damageType}
          onChange={(e) => update('damageType', e.target.value)}
          className={inputClass}
        >
          <option value="">Select...</option>
          {DAMAGE_TYPES.map((dt) => (
            <option key={dt} value={dt}>{dt}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function renderWeaponPropertyTags(
  form: ItemFormData,
  toggleWeaponProperty: (prop: string) => void,
) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">Properties</p>
      <div className="flex flex-wrap gap-1.5">
        {WEAPON_PROPERTIES.map((prop) => {
          const active = form.weaponProperties.includes(prop);
          return (
            <button
              key={prop}
              type="button"
              onClick={() => toggleWeaponProperty(prop)}
              className={`rounded-sm px-2 py-0.5 text-xs transition-colors ${
                active
                  ? 'bg-red-900/40 text-red-300 border border-red-800/40'
                  : 'bg-muted/40 text-muted-foreground border border-border hover:bg-muted/60'
              }`}
            >
              {prop}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function renderArmorFields(
  form: ItemFormData,
  update: <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => void,
) {
  return (
    <div className="space-y-3 rounded-md border border-blue-900/20 bg-blue-950/10 p-3">
      <p className={labelClass}>Armor Properties</p>
      {renderArmorInputs(form, update)}
    </div>
  );
}

function renderArmorInputs(
  form: ItemFormData,
  update: <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => void,
) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="item-ac" className={labelClass}>Armor Class</label>
          <input
            id="item-ac"
            type="number"
            min={0}
            value={form.armorClass}
            onChange={(e) => update('armorClass', parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="item-armor-type" className={labelClass}>Armor Type</label>
          <select
            id="item-armor-type"
            value={form.armorType}
            onChange={(e) => update('armorType', e.target.value)}
            className={inputClass}
          >
            <option value="">Select...</option>
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="heavy">Heavy</option>
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={form.stealthDisadvantage}
          onChange={(e) => update('stealthDisadvantage', e.target.checked)}
          className="rounded border-input"
        />
        Stealth Disadvantage
      </label>
    </>
  );
}

function renderNotesField(
  form: ItemFormData,
  update: <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => void,
) {
  return (
    <>
      <div>
        <label htmlFor="item-description" className={labelClass}>Description</label>
        <textarea
          id="item-description"
          rows={2}
          maxLength={5000}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Item description..."
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="item-notes" className={labelClass}>Notes</label>
        <textarea
          id="item-notes"
          rows={2}
          maxLength={5000}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Personal notes..."
          className={inputClass}
        />
      </div>
    </>
  );
}

function renderActions(
  isEdit: boolean,
  isPending: boolean | undefined,
  handleClose: () => void,
) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <Button type="button" variant="ghost" onClick={handleClose}>
        Cancel
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {isPending
          ? isEdit ? 'Saving...' : 'Adding...'
          : isEdit ? 'Save Changes' : 'Add Item'}
      </Button>
    </div>
  );
}
