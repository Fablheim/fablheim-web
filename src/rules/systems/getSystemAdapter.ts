import { dnd5eAdapter } from '@/rules/systems/dnd5e/adapter';
import { pathfinder2eAdapter } from '@/rules/systems/pathfinder2e/adapter';
import { fateAdapter } from '@/rules/systems/fate/adapter';
import { daggerheartAdapter } from '@/rules/systems/daggerheart/adapter';
import type { SystemActionAdapter } from '@/rules/systems/types';

const emptyAdapter: SystemActionAdapter = {
  toSystemActions: () => [],
  performActionRoll: async () => ({ message: 'No action adapter available for this system.' }),
};

/**
 * Module-to-adapter mapping. The dice engine module determines which
 * action adapter to use. Checked in specificity order.
 */
const MODULE_ADAPTER_MAP: Array<{ module: string; adapter: SystemActionAdapter }> = [
  { module: 'hope-fear-dice', adapter: daggerheartAdapter },
  { module: 'fate-dice', adapter: fateAdapter },
  { module: 'degrees-of-success', adapter: pathfinder2eAdapter },
  { module: 'advantage-disadvantage', adapter: dnd5eAdapter },
  { module: 'standard-d20', adapter: dnd5eAdapter },
];

/**
 * Resolves a system action adapter from a set of enabled modules.
 * Falls back to systemKey-based lookup for legacy compatibility.
 */
export function getSystemAdapterFromModules(enabledModules: Set<string>): SystemActionAdapter {
  for (const { module, adapter } of MODULE_ADAPTER_MAP) {
    if (enabledModules.has(module)) return adapter;
  }
  return emptyAdapter;
}

/**
 * Legacy adapter resolution by system key. Prefer getSystemAdapterFromModules
 * when module data is available.
 */
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
