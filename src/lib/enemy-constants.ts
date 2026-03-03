import type { EnemyCategory } from '@/types/enemy-template';

export const CATEGORY_LABELS: Record<EnemyCategory, string> = {
  humanoid: 'Humanoid',
  beast: 'Beast',
  undead: 'Undead',
  dragon: 'Dragon',
  aberration: 'Aberration',
  construct: 'Construct',
  elemental: 'Elemental',
  fey: 'Fey',
  fiend: 'Fiend',
  giant: 'Giant',
  monstrosity: 'Monstrosity',
  ooze: 'Ooze',
  plant: 'Plant',
  custom: 'Custom',
};

export const CATEGORY_COLORS: Record<EnemyCategory, string> = {
  humanoid: 'bg-brass/20 text-brass',
  beast: 'bg-forest/20 text-[hsl(150,50%,55%)]',
  undead: 'bg-[hsl(270,30%,20%)] text-[hsl(270,40%,70%)]',
  dragon: 'bg-blood/20 text-blood',
  aberration: 'bg-[hsl(300,30%,20%)] text-[hsl(300,40%,65%)]',
  construct: 'bg-iron/30 text-muted-foreground',
  elemental: 'bg-[hsl(200,40%,20%)] text-[hsl(200,50%,65%)]',
  fey: 'bg-[hsl(140,30%,20%)] text-[hsl(140,50%,65%)]',
  fiend: 'bg-blood/30 text-[hsl(0,60%,55%)]',
  giant: 'bg-brass/15 text-brass',
  monstrosity: 'bg-primary/15 text-primary',
  ooze: 'bg-forest/15 text-[hsl(120,40%,55%)]',
  plant: 'bg-forest/20 text-[hsl(100,50%,55%)]',
  custom: 'bg-muted text-muted-foreground',
};

export const SYSTEM_LABELS: Record<string, string> = {
  dnd5e: 'D&D 5e',
  pathfinder2e: 'PF2e',
  daggerheart: 'Daggerheart',
  fate: 'Fate',
  custom: 'Custom',
};

export const SYSTEM_COLORS: Record<string, string> = {
  dnd5e: 'bg-blood/20 text-blood',
  pathfinder2e: 'bg-[hsl(200,40%,20%)] text-[hsl(200,50%,65%)]',
  daggerheart: 'bg-primary/15 text-primary',
  fate: 'bg-[hsl(270,30%,20%)] text-[hsl(270,40%,70%)]',
  custom: 'bg-iron/20 text-muted-foreground',
};

export const SCOPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'global', label: 'SRD' },
  { value: 'user', label: 'My Templates' },
] as const;

export const SYSTEM_STATS: Record<string, { key: string; label: string }[]> = {
  dnd5e: [
    { key: 'str', label: 'STR' }, { key: 'dex', label: 'DEX' }, { key: 'con', label: 'CON' },
    { key: 'int', label: 'INT' }, { key: 'wis', label: 'WIS' }, { key: 'cha', label: 'CHA' },
  ],
  pathfinder2e: [
    { key: 'str', label: 'STR' }, { key: 'dex', label: 'DEX' }, { key: 'con', label: 'CON' },
    { key: 'int', label: 'INT' }, { key: 'wis', label: 'WIS' }, { key: 'cha', label: 'CHA' },
  ],
  daggerheart: [
    { key: 'agility', label: 'AGI' }, { key: 'strength', label: 'STR' }, { key: 'finesse', label: 'FIN' },
    { key: 'instinct', label: 'INS' }, { key: 'presence', label: 'PRE' }, { key: 'knowledge', label: 'KNO' },
  ],
  custom: [
    { key: 'str', label: 'STR' }, { key: 'dex', label: 'DEX' }, { key: 'con', label: 'CON' },
    { key: 'int', label: 'INT' }, { key: 'wis', label: 'WIS' }, { key: 'cha', label: 'CHA' },
  ],
  // fate: intentionally absent — no ability scores
};
