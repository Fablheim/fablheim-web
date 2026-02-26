import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Shield,
  Crown,
  Swords,
  Sparkles,
  Users,
  Compass,
  Target,
  ScrollText,
  Wand2,
} from 'lucide-react';

export interface QuickStartLink {
  label: string;
  type: 'entry' | 'category';
  category: string;
  entry?: string;
  badge?: string;
}

export interface QuickStartSection {
  title: string;
  icon: LucideIcon;
  description: string;
  links: QuickStartLink[];
}

export interface QuickStartConfig {
  displayName: string;
  tagline: string;
  sections: QuickStartSection[];
}

export const quickStartConfigs: Record<string, QuickStartConfig> = {
  dnd5e: {
    displayName: 'Dungeons & Dragons 5th Edition',
    tagline: 'The world\'s most popular tabletop RPG -- swords, sorcery, and dungeon crawling.',
    sections: [
      {
        title: 'Getting Started',
        icon: BookOpen,
        description: 'The core rules you need to play your first session.',
        links: [
          { label: 'Abilities & Ability Checks', type: 'entry', category: 'Gameplay', entry: 'Abilities' },
          { label: 'Adventuring Rules', type: 'entry', category: 'Gameplay', entry: 'Adventuring' },
          { label: 'Combat', type: 'entry', category: 'Gameplay', entry: 'Combat' },
          { label: 'Backgrounds', type: 'entry', category: 'Characterizations', entry: 'Backgrounds' },
        ],
      },
      {
        title: 'Character Options',
        icon: Shield,
        description: 'Choose your race, class, and gear.',
        links: [
          { label: 'Races', type: 'category', category: 'Races', badge: '10 races' },
          { label: 'Classes', type: 'category', category: 'Classes', badge: '12 classes' },
          { label: 'Equipment', type: 'category', category: 'Equipment', badge: 'Weapons, armor & gear' },
          { label: 'Feats', type: 'entry', category: 'Characterizations', entry: 'Feats' },
        ],
      },
      {
        title: 'For Dungeon Masters',
        icon: Crown,
        description: 'Rules and references for running the game.',
        links: [
          { label: 'Conditions', type: 'entry', category: 'Gamemastering', entry: 'Conditions' },
          { label: 'Traps', type: 'entry', category: 'Gamemastering', entry: 'Traps' },
          { label: 'Monsters', type: 'category', category: 'Monsters', badge: '319 monsters' },
          { label: 'Magic Items', type: 'category', category: 'Treasure', badge: 'Browse all' },
          { label: 'Spells', type: 'category', category: 'Spells', badge: '322 spells' },
        ],
      },
    ],
  },

  daggerheart: {
    displayName: 'Daggerheart',
    tagline: 'Critical Role\'s cinematic fantasy RPG -- hope and fear in every roll.',
    sections: [
      {
        title: 'Character Building',
        icon: Users,
        description: 'Pick an ancestry, class, and domain to shape your hero.',
        links: [
          { label: 'Ancestries', type: 'category', category: 'ancestries', badge: '18 ancestries' },
          { label: 'Classes', type: 'category', category: 'classes', badge: '9 classes' },
          { label: 'Subclasses', type: 'category', category: 'subclasses', badge: 'Browse all' },
          { label: 'Domains', type: 'category', category: 'domains', badge: '9 domains' },
        ],
      },
      {
        title: 'Gear & Abilities',
        icon: Swords,
        description: 'Weapons, armor, and special abilities for your character.',
        links: [
          { label: 'Weapons', type: 'category', category: 'weapons', badge: 'Browse all' },
          { label: 'Armor', type: 'category', category: 'armor', badge: 'Browse all' },
          { label: 'Items & Consumables', type: 'category', category: 'items', badge: 'Browse all' },
          { label: 'Abilities', type: 'category', category: 'abilities', badge: 'Browse all' },
        ],
      },
      {
        title: 'The World',
        icon: Compass,
        description: 'Adversaries, environments, and communities to populate your game.',
        links: [
          { label: 'Adversaries', type: 'category', category: 'adversaries', badge: 'Browse all' },
          { label: 'Environments', type: 'category', category: 'environments', badge: 'Browse all' },
          { label: 'Communities', type: 'category', category: 'communities', badge: 'Browse all' },
        ],
      },
    ],
  },

  pathfinder2e: {
    displayName: 'Pathfinder 2nd Edition',
    tagline: 'Deep tactics, infinite character builds, and tightly balanced encounters.',
    sections: [
      {
        title: 'Character Creation',
        icon: Target,
        description: 'Backgrounds, skills, and options for building your character.',
        links: [
          { label: 'Backgrounds', type: 'entry', category: 'General', entry: 'background' },
          { label: 'Skills', type: 'entry', category: 'General', entry: 'skill' },
          { label: 'Familiar Abilities', type: 'entry', category: 'General', entry: 'familiarAbility' },
        ],
      },
      {
        title: 'Rules Reference',
        icon: ScrollText,
        description: 'Conditions, sources, and game mechanics.',
        links: [
          { label: 'Conditions', type: 'entry', category: 'General', entry: 'condition' },
          { label: 'Divine Intercessions', type: 'entry', category: 'General', entry: 'divineIntercession' },
          { label: 'Sources', type: 'entry', category: 'General', entry: 'source' },
        ],
      },
    ],
  },

  fate: {
    displayName: 'Fate Core',
    tagline: 'Fiction-first, genre-agnostic storytelling -- aspects and fate points drive everything.',
    sections: [
      {
        title: 'Core Systems',
        icon: Sparkles,
        description: 'The essential Fate rulebooks. Start with Core or Condensed.',
        links: [
          { label: 'Fate Core', type: 'entry', category: 'General', entry: 'fate-core' },
          { label: 'Fate Condensed', type: 'entry', category: 'General', entry: 'Fate-Condensed-SRD-CC-BY' },
          { label: 'Fate Accelerated', type: 'entry', category: 'General', entry: 'fate-accelerated-SRD' },
        ],
      },
      {
        title: 'Toolkits & Settings',
        icon: Wand2,
        description: 'Expand Fate with genre toolkits and ready-made settings.',
        links: [
          { label: 'System Toolkit', type: 'entry', category: 'General', entry: 'fate-system-toolkit-SRD' },
          { label: 'Horror Toolkit', type: 'entry', category: 'General', entry: 'fate-horror-toolkit' },
          { label: 'Venture City (Supers)', type: 'entry', category: 'General', entry: 'venture-city' },
          { label: 'Atomic Robo', type: 'entry', category: 'General', entry: 'atomic-robo-SRD' },
        ],
      },
    ],
  },
};
