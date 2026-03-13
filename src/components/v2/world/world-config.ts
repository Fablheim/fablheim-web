import {
  Globe,
  MapPin,
  Users,
  UserPlus,
  Swords,
  Flag,
  Gem,
  CalendarDays,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { WorldEntityType } from '@/types/campaign';

export interface EntityTypeConfig {
  label: string;
  pluralLabel: string;
  icon: LucideIcon;
  color: string; // HSL accent color for badges/highlights
}

export const ENTITY_TYPE_CONFIG: Record<WorldEntityType, EntityTypeConfig> = {
  location: {
    label: 'Location',
    pluralLabel: 'Locations',
    icon: Globe,
    color: 'hsl(180,50%,52%)',
  },
  location_detail: {
    label: 'Location Detail',
    pluralLabel: 'Location Details',
    icon: MapPin,
    color: 'hsl(180,40%,45%)',
  },
  faction: {
    label: 'Faction',
    pluralLabel: 'Factions',
    icon: Flag,
    color: 'hsl(280,50%,60%)',
  },
  npc: {
    label: 'NPC',
    pluralLabel: 'NPCs',
    icon: Users,
    color: 'hsl(38,90%,55%)',
  },
  npc_minor: {
    label: 'Minor NPC',
    pluralLabel: 'Minor NPCs',
    icon: UserPlus,
    color: 'hsl(38,60%,50%)',
  },
  item: {
    label: 'Item',
    pluralLabel: 'Items',
    icon: Gem,
    color: 'hsl(42,56%,64%)',
  },
  quest: {
    label: 'Quest',
    pluralLabel: 'Quests',
    icon: Swords,
    color: 'hsl(0,62%,58%)',
  },
  event: {
    label: 'Event',
    pluralLabel: 'Events',
    icon: CalendarDays,
    color: 'hsl(200,50%,55%)',
  },
  lore: {
    label: 'Lore',
    pluralLabel: 'Lore',
    icon: BookOpen,
    color: 'hsl(30,50%,55%)',
  },
  trap: {
    label: 'Trap',
    pluralLabel: 'Traps',
    icon: AlertTriangle,
    color: 'hsl(15,70%,50%)',
  },
};

/** The entity types shown as top-level browsable categories */
export const BROWSABLE_TYPES: WorldEntityType[] = [
  'location',
  'npc',
  'faction',
  'quest',
  'item',
  'lore',
  'event',
];
