import { dnd5eAdapter } from '@/rules/systems/dnd5e/adapter';
import { pathfinder2eAdapter } from '@/rules/systems/pathfinder2e/adapter';
import { fateAdapter } from '@/rules/systems/fate/adapter';
import { daggerheartAdapter } from '@/rules/systems/daggerheart/adapter';
import type { SystemActionAdapter } from '@/rules/systems/types';

const emptyAdapter: SystemActionAdapter = {
  toSystemActions: () => [],
  performActionRoll: async () => ({ message: 'No action adapter available for this system.' }),
};

export function getSystemAdapter(systemKey: string | null | undefined): SystemActionAdapter {
  if (!systemKey) return emptyAdapter;
  const normalized = systemKey.toLowerCase();
  if (normalized === 'dnd5e' || normalized === 'dnd' || normalized === '5e') {
    return dnd5eAdapter;
  }
  if (normalized === 'pathfinder2e' || normalized === 'pf2e' || normalized === 'pathfinder') {
    return pathfinder2eAdapter;
  }
  if (normalized === 'fate') {
    return fateAdapter;
  }
  if (normalized === 'daggerheart') {
    return daggerheartAdapter;
  }
  return emptyAdapter;
}
