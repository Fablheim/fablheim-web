import {
  MapPin,
  Castle,
  Users,
  User,
  Gem,
  Swords,
  Calendar,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';
import type { WorldEntityType } from '@/types/campaign';

export type WorldTab = 'all' | 'locations' | 'factions' | 'npcs' | 'items' | 'quests' | 'lore' | 'events';

export interface WorldTabDef {
  key: WorldTab;
  label: string;
  types: WorldEntityType[];
  icon: LucideIcon;
}

export const WORLD_TABS: WorldTabDef[] = [
  { key: 'all', label: 'All', types: [], icon: ScrollText },
  { key: 'locations', label: 'Locations', types: ['location', 'location_detail'], icon: MapPin },
  { key: 'factions', label: 'Factions', types: ['faction'], icon: Users },
  { key: 'npcs', label: 'NPCs', types: ['npc', 'npc_minor'], icon: User },
  { key: 'items', label: 'Items', types: ['item'], icon: Gem },
  { key: 'quests', label: 'Quests', types: ['quest'], icon: Swords },
  { key: 'lore', label: 'Lore', types: ['lore'], icon: ScrollText },
  { key: 'events', label: 'Events', types: ['event'], icon: Calendar },
];

export const TYPE_ACCENTS: Record<WorldEntityType, { bg: string; text: string; border: string }> = {
  location:        { bg: 'bg-forest/20',  text: 'text-[hsl(150,50%,55%)]', border: 'border-l-forest/60' },
  location_detail: { bg: 'bg-forest/15',  text: 'text-[hsl(150,40%,50%)]', border: 'border-l-forest/40' },
  faction:         { bg: 'bg-blood/20',   text: 'text-blood',              border: 'border-l-blood/60' },
  npc:             { bg: 'bg-brass/20',   text: 'text-brass',              border: 'border-l-brass/60' },
  npc_minor:       { bg: 'bg-brass/15',   text: 'text-brass/80',           border: 'border-l-brass/40' },
  item:            { bg: 'bg-arcane/20',  text: 'text-arcane',             border: 'border-l-arcane/60' },
  quest:           { bg: 'bg-gold/20',    text: 'text-gold',               border: 'border-l-gold/60' },
  event:           { bg: 'bg-primary/20', text: 'text-primary',            border: 'border-l-primary/60' },
  lore:            { bg: 'bg-muted',      text: 'text-muted-foreground',   border: 'border-l-muted-foreground/40' },
};

export const TYPE_LABELS: Record<WorldEntityType, string> = {
  location: 'Location',
  location_detail: 'Location Detail',
  faction: 'Faction',
  npc: 'NPC',
  npc_minor: 'Minor NPC',
  item: 'Item',
  quest: 'Quest',
  event: 'Event',
  lore: 'Lore',
};

export const TYPE_ICONS: Record<WorldEntityType, LucideIcon> = {
  location: MapPin,
  location_detail: Castle,
  faction: Users,
  npc: User,
  npc_minor: User,
  item: Gem,
  quest: Swords,
  event: Calendar,
  lore: ScrollText,
};

export interface TypeDataField {
  key: string;
  label: string;
  inputType: 'text' | 'textarea';
  placeholder: string;
}

export const TYPE_DATA_FIELDS: Record<WorldEntityType, TypeDataField[]> = {
  location: [
    { key: 'terrain', label: 'Terrain', inputType: 'text', placeholder: 'Forest, mountain, coastal...' },
    { key: 'climate', label: 'Climate', inputType: 'text', placeholder: 'Temperate, arid, arctic...' },
    { key: 'population', label: 'Population', inputType: 'text', placeholder: 'Large city, small village...' },
  ],
  location_detail: [
    { key: 'terrain', label: 'Terrain', inputType: 'text', placeholder: 'Interior, subterranean...' },
    { key: 'climate', label: 'Climate', inputType: 'text', placeholder: 'Damp, warm, magical...' },
    { key: 'population', label: 'Population', inputType: 'text', placeholder: 'Inhabitants, occupants...' },
  ],
  faction: [
    { key: 'leader', label: 'Leader', inputType: 'text', placeholder: 'Name of the faction leader...' },
    { key: 'size', label: 'Size', inputType: 'text', placeholder: 'Small cabal, large army...' },
    { key: 'goals', label: 'Goals', inputType: 'textarea', placeholder: 'What does this faction seek to achieve?' },
  ],
  npc: [
    { key: 'role', label: 'Role', inputType: 'text', placeholder: 'Merchant, guard captain, sage...' },
    { key: 'personality', label: 'Personality', inputType: 'textarea', placeholder: 'Gruff but kind, suspicious of strangers...' },
    { key: 'secrets', label: 'Secrets', inputType: 'textarea', placeholder: 'Hidden knowledge or motives...' },
  ],
  npc_minor: [
    { key: 'role', label: 'Role', inputType: 'text', placeholder: 'Townsperson, servant, messenger...' },
    { key: 'personality', label: 'Personality', inputType: 'text', placeholder: 'A brief trait or quirk...' },
  ],
  item: [
    { key: 'properties', label: 'Properties', inputType: 'textarea', placeholder: '+1 to hit, deals fire damage...' },
    { key: 'rarity', label: 'Rarity', inputType: 'text', placeholder: 'Common, uncommon, rare, legendary...' },
    { key: 'magicalEffects', label: 'Magical Effects', inputType: 'textarea', placeholder: 'Glows in the presence of undead...' },
  ],
  quest: [
    { key: 'objectives', label: 'Objectives', inputType: 'textarea', placeholder: 'Retrieve the artifact, defeat the dragon...' },
    { key: 'rewards', label: 'Rewards', inputType: 'text', placeholder: '500gp, magic sword, faction reputation...' },
    { key: 'status', label: 'Status', inputType: 'text', placeholder: 'Available, in progress, completed...' },
  ],
  event: [
    { key: 'date', label: 'Date', inputType: 'text', placeholder: 'Third moon of the harvest year...' },
    { key: 'participants', label: 'Participants', inputType: 'text', placeholder: 'Key figures involved...' },
    { key: 'consequences', label: 'Consequences', inputType: 'textarea', placeholder: 'What resulted from this event...' },
  ],
  lore: [
    { key: 'era', label: 'Era', inputType: 'text', placeholder: 'Age of Dragons, First Era...' },
    { key: 'significance', label: 'Significance', inputType: 'textarea', placeholder: 'Why this matters to the world...' },
  ],
};

export const CREATE_LABELS: Record<WorldTab, string> = {
  all: 'Entity',
  locations: 'Location',
  factions: 'Faction',
  npcs: 'NPC',
  items: 'Item',
  quests: 'Quest',
  lore: 'Lore Entry',
  events: 'Event',
};

export const EMPTY_MESSAGES: Record<WorldTab, { title: string; description: string }> = {
  all: { title: 'Your world awaits', description: 'Create your first entity to begin building your world' },
  locations: { title: 'No lands charted', description: 'Add locations to map out your world' },
  factions: { title: 'No factions formed', description: 'Create factions to populate your world with intrigue' },
  npcs: { title: 'No souls encountered', description: 'Add NPCs to bring your world to life' },
  items: { title: 'No treasures catalogued', description: 'Create items for your adventurers to discover' },
  quests: { title: 'No quests posted', description: 'Add quests to drive your story forward' },
  lore: { title: 'No lore recorded', description: 'Write the history and legends of your world' },
  events: { title: 'No events chronicled', description: 'Record the events that shape your world' },
};
