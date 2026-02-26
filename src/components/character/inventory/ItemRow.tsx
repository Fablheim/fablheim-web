import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Sword,
  ShieldIcon,
  Shirt,
  Package,
  FlaskConical,
  GemIcon,
  Crosshair,
  Wrench,
  Trash2,
  Sparkles,
  Link,
} from 'lucide-react';
import type { Item, EquipmentSlot } from '@/types/item';

interface ItemRowProps {
  item: Item;
  onEquip: (id: string, slot: string) => void;
  onUnequip: (id: string) => void;
  onToggleAttunement: (id: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-emerald-400',
  rare: 'text-blue-400',
  'very-rare': 'text-purple-400',
  legendary: 'text-orange-400',
  artifact: 'text-red-400',
};

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-700/30',
  uncommon: 'border-emerald-800/30',
  rare: 'border-blue-800/30',
  'very-rare': 'border-purple-800/30',
  legendary: 'border-orange-800/30',
  artifact: 'border-red-800/30',
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  'very-rare': 'Very Rare',
  legendary: 'Legendary',
  artifact: 'Artifact',
};

const TYPE_ICONS: Record<string, typeof Sword> = {
  weapon: Sword,
  armor: Shirt,
  shield: ShieldIcon,
  gear: Package,
  consumable: FlaskConical,
  treasure: GemIcon,
  ammunition: Crosshair,
  tool: Wrench,
};

const SLOT_OPTIONS: { value: EquipmentSlot; label: string }[] = [
  { value: 'head', label: 'Head' },
  { value: 'neck', label: 'Neck' },
  { value: 'chest', label: 'Chest' },
  { value: 'hands', label: 'Hands' },
  { value: 'waist', label: 'Waist' },
  { value: 'feet', label: 'Feet' },
  { value: 'ring1', label: 'Ring 1' },
  { value: 'ring2', label: 'Ring 2' },
  { value: 'cloak', label: 'Cloak' },
  { value: 'mainHand', label: 'Main Hand' },
  { value: 'offHand', label: 'Off Hand' },
];

function formatValue(copper: number): string {
  if (copper >= 100) return `${(copper / 100).toFixed(copper % 100 === 0 ? 0 : 1)} gp`;
  if (copper >= 10) return `${(copper / 10).toFixed(copper % 10 === 0 ? 0 : 1)} sp`;
  return `${copper} cp`;
}

export function ItemRow({ item, onEquip, onUnequip, onToggleAttunement, onEdit, onDelete }: ItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TYPE_ICONS[item.type] || Package;
  const rarityColor = RARITY_COLORS[item.rarity] || 'text-gray-400';
  const borderColor = RARITY_BORDER[item.rarity] || 'border-gray-700/30';

  return (
    <div className={`rounded-sm border ${borderColor} bg-muted/20 transition-colors hover:bg-muted/40`}>
      {renderSummaryRow(item, Icon, rarityColor, expanded, setExpanded)}
      {expanded && renderDetails(item, onEquip, onUnequip, onToggleAttunement, onEdit, onDelete)}
    </div>
  );
}

function renderSummaryRow(
  item: Item,
  Icon: typeof Sword,
  rarityColor: string,
  expanded: boolean,
  setExpanded: (v: boolean) => void,
) {
  const canEquip =
    item.type !== 'consumable' &&
    item.type !== 'treasure' &&
    item.type !== 'ammunition';

  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="flex w-full items-center gap-2 px-3 py-2 text-left"
    >
      {expanded ? (
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}
      <Icon className={`h-4 w-4 shrink-0 ${rarityColor}`} />
      <span className={`flex-1 truncate text-sm font-medium ${rarityColor}`}>
        {item.name}
      </span>
      {renderBadges(item, canEquip)}
      {renderMetaInfo(item)}
    </button>
  );
}

function renderBadges(item: Item, canEquip: boolean) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {item.isEquipped && canEquip && (
        <span className="rounded-sm bg-emerald-900/40 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
          Equipped
        </span>
      )}
      {item.isAttuned && (
        <span className="rounded-sm bg-purple-900/40 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-400">
          Attuned
        </span>
      )}
      {item.isMagical && (
        <Sparkles className="h-3 w-3 text-amber-400" />
      )}
    </span>
  );
}

function renderMetaInfo(item: Item) {
  return (
    <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
      {item.quantity > 1 && <span>x{item.quantity}</span>}
      <span>{item.weight} lb</span>
    </span>
  );
}

function renderDetails(
  item: Item,
  onEquip: (id: string, slot: string) => void,
  onUnequip: (id: string) => void,
  onToggleAttunement: (id: string) => void,
  onEdit: (item: Item) => void,
  onDelete: (id: string) => void,
) {
  return (
    <div className="border-t border-border/40 px-3 py-3 space-y-3">
      {renderDescriptionBlock(item)}
      {renderWeaponBlock(item)}
      {renderArmorBlock(item)}
      {renderInfoRow(item)}
      {renderActionButtons(item, onEquip, onUnequip, onToggleAttunement, onEdit, onDelete)}
    </div>
  );
}

function renderDescriptionBlock(item: Item) {
  if (!item.description && !item.notes) return null;
  return (
    <div className="space-y-1">
      {item.description && (
        <p className="text-xs text-muted-foreground">{item.description}</p>
      )}
      {item.notes && (
        <p className="text-xs italic text-muted-foreground/70">{item.notes}</p>
      )}
    </div>
  );
}

function renderWeaponBlock(item: Item) {
  if (item.type !== 'weapon' || (!item.damageDice && !item.damageType)) return null;
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {item.damageDice && (
        <span className="rounded-sm bg-red-900/30 px-1.5 py-0.5 text-red-300">
          {item.damageDice} {item.damageType || ''}
        </span>
      )}
      {item.weaponProperties?.map((prop) => (
        <span
          key={prop}
          className="rounded-sm bg-muted/60 px-1.5 py-0.5 text-muted-foreground"
        >
          {prop}
        </span>
      ))}
    </div>
  );
}

function renderArmorBlock(item: Item) {
  if ((item.type !== 'armor' && item.type !== 'shield') || !item.armorClass) return null;
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="rounded-sm bg-blue-900/30 px-1.5 py-0.5 text-blue-300">
        AC {item.armorClass}
      </span>
      {item.armorType && (
        <span className="rounded-sm bg-muted/60 px-1.5 py-0.5 text-muted-foreground">
          {item.armorType}
        </span>
      )}
      {item.stealthDisadvantage && (
        <span className="rounded-sm bg-amber-900/30 px-1.5 py-0.5 text-amber-300">
          Stealth Disadvantage
        </span>
      )}
    </div>
  );
}

function renderInfoRow(item: Item) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span className={RARITY_COLORS[item.rarity]}>
        {RARITY_LABELS[item.rarity] || item.rarity}
      </span>
      {item.value > 0 && <span>{formatValue(item.value)}</span>}
      <span>{item.weight * item.quantity} lb total</span>
      {item.requiresAttunement && (
        <span className="flex items-center gap-1">
          <Link className="h-3 w-3" />
          Requires Attunement
        </span>
      )}
    </div>
  );
}

function renderActionButtons(
  item: Item,
  onEquip: (id: string, slot: string) => void,
  onUnequip: (id: string) => void,
  onToggleAttunement: (id: string) => void,
  onEdit: (item: Item) => void,
  onDelete: (id: string) => void,
) {
  const canEquip =
    item.type !== 'consumable' &&
    item.type !== 'treasure' &&
    item.type !== 'ammunition';

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {canEquip && renderEquipControls(item, onEquip, onUnequip)}
      {item.requiresAttunement && renderAttuneButton(item, onToggleAttunement)}
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(item._id)}
          className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/30"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function renderEquipControls(
  item: Item,
  onEquip: (id: string, slot: string) => void,
  onUnequip: (id: string) => void,
) {
  if (item.isEquipped) {
    return (
      <button
        type="button"
        onClick={() => onUnequip(item._id)}
        className="rounded-sm border border-emerald-800/40 bg-emerald-950/30 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-900/40"
      >
        Unequip
      </button>
    );
  }

  return (
    <select
      className="rounded-sm border border-input bg-input px-2 py-1 text-xs text-foreground"
      value=""
      onChange={(e) => {
        if (e.target.value) {
          onEquip(item._id, e.target.value);
        }
      }}
    >
      <option value="">Equip to...</option>
      {SLOT_OPTIONS.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

function renderAttuneButton(
  item: Item,
  onToggleAttunement: (id: string) => void,
) {
  return (
    <button
      type="button"
      onClick={() => onToggleAttunement(item._id)}
      className={`rounded-sm border px-2 py-1 text-xs ${
        item.isAttuned
          ? 'border-purple-800/40 bg-purple-950/30 text-purple-400 hover:bg-purple-900/40'
          : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
      }`}
    >
      {item.isAttuned ? 'Break Attunement' : 'Attune'}
    </button>
  );
}
