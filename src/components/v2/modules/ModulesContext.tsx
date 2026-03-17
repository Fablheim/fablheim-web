import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useCampaign } from '@/hooks/useCampaigns';
import {
  useCampaignRulesConfig,
  useRulesModules,
  useRulesPresets,
  useUpdateCampaignRulesConfig,
} from '@/hooks/useRulesEngine';
import { useCustomModules } from '@/hooks/useCustomModules';
import type { ModuleSummary, PresetSummary } from '@/api/rules-engine';
import type { CustomModule } from '@/types/custom-module';
import type { Campaign } from '@/types/campaign';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BrowserFilter = 'all' | 'active' | 'available' | 'blocked';
export type SelectedNode =
  | { kind: 'module'; id: string }
  | { kind: 'custom'; id: string };

export type DerivedStatus = 'active' | 'required' | 'available' | 'blocked';

export const categoryLabels: Record<string, string> = {
  'dice-engine': 'Dice Engine',
  'health-model': 'Health Model',
  'action-economy': 'Action Economy',
  'resource-tracking': 'Resource Tracking',
  'condition-system': 'Condition System',
  'death-and-incapacitation': 'Death & Incapacitation',
  advancement: 'Advancement',
  'combat-structure': 'Combat Structure',
  'scene-elements': 'Scene Elements',
  'character-building': 'Character Building',
  'inventory-and-economy': 'Inventory & Economy',
  'social-and-narrative': 'Social & Narrative',
  'gm-tools': 'GM Tools',
};

// ── Status derivation (shared between context and right panel) ────────────────

export function deriveStatus(
  module: ModuleSummary,
  enabledSet: Set<string>,
  lockedSet: Set<string>,
  campaignSystem?: string,
) {
  if (enabledSet.has(module.id)) {
    return {
      kind: lockedSet.has(module.id) ? 'required' : 'active',
      reasons: lockedSet.has(module.id)
        ? ['Included by the active rules profile.']
        : ['Currently enabled in this campaign.'],
    } as const;
  }

  const reasons: string[] = [];
  const missingRequirements = module.requires.filter((id) => !enabledSet.has(id));
  if (missingRequirements.length) {
    reasons.push(`Requires ${missingRequirements.join(', ')}`);
  }

  const conflictingModules = module.conflicts.filter((id) => enabledSet.has(id));
  if (conflictingModules.length) {
    reasons.push(`Conflicts with ${conflictingModules.join(', ')}`);
  }

  if (module.exclusive) {
    const exclusiveGroup = module.exclusive;
    const exclusiveMatch = Array.from(enabledSet).find(
      (id) => id !== module.id && idInExclusiveGroup(id, exclusiveGroup),
    );
    if (exclusiveMatch) {
      reasons.push(`Blocked by ${exclusiveMatch} in ${humanize(exclusiveGroup)}.`);
    }
  }

  if (campaignSystem && module.systems.length > 0 && !module.systems.includes(campaignSystem)) {
    reasons.push(`Off-profile for ${campaignSystem}.`);
  }

  if (reasons.length) {
    return { kind: 'blocked', reasons } as const;
  }

  return {
    kind: 'available',
    reasons: [
      module.systems.length
        ? `Supports ${module.systems.join(', ')}`
        : 'Available as a general module.',
    ],
  } as const;
}

function idInExclusiveGroup(moduleId: string, exclusive: string) {
  const groups: Record<string, string[]> = {
    'health-model': ['hp-simple', 'stress-consequences', 'wound-levels'],
    'death-model': ['dnd5e-death-saves', 'pf2e-dying', 'fate-taken-out', 'daggerheart-last-breath', 'simple-incapacitation'],
    'action-economy': ['free-action', 'action-reaction-bonus', 'three-action', 'fate-actions', 'daggerheart-turns'],
    'dice-engine': ['standard-d20', 'fate-dice', 'hope-fear-dice', 'dice-pool'],
    'primary-stats': ['ability-scores-dnd', 'approaches-fate', 'attributes-daggerheart', 'skills-fate-core', 'custom-stats'],
    'currency-model': ['coins-dnd', 'wealth-tiers', 'abstract-currency'],
    'encumbrance-model': ['weight-pounds', 'bulk-pf2e', 'no-encumbrance'],
    'attunement-model': ['attunement-dnd', 'investment-pf2e', 'no-attunement'],
  };
  return groups[exclusive]?.includes(moduleId) ?? false;
}

export function humanize(value: string) {
  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// ── Context value ─────────────────────────────────────────────────────────────

export type CustomModuleMode = 'view' | 'create' | 'edit';

interface ModulesContextValue {
  campaignId: string;

  // raw data
  campaign: Campaign | undefined;
  moduleCatalog: ModuleSummary[] | undefined;
  presets: PresetSummary[] | undefined;
  customModules: CustomModule[] | undefined;
  enabledModules: string[];
  enabledSet: Set<string>;
  lockedSet: Set<string>;
  activePreset: PresetSummary | null;

  // mutation
  updateRulesConfig: ReturnType<typeof useUpdateCampaignRulesConfig>;

  // derived
  derivedModules: Array<{ module: ModuleSummary; status: ReturnType<typeof deriveStatus> }>;
  filteredModules: Array<{ module: ModuleSummary; status: ReturnType<typeof deriveStatus> }>;
  librarySections: Array<{ id: DerivedStatus; label: string; items: Array<{ module: ModuleSummary; status: ReturnType<typeof deriveStatus> }> }>;
  summary: { activeCount: number; blockedCount: number; availableCount: number; line: string };
  rulesData: ReturnType<typeof useCampaignRulesConfig>['data'];

  // selected node
  selectedNode: SelectedNode | null;
  setSelectedNode: (node: SelectedNode | null) => void;
  effectiveSelectedNode: SelectedNode | null;
  selectedBuiltIn: ModuleSummary | null;
  selectedCustom: CustomModule | null;

  // custom module editing
  customModuleMode: CustomModuleMode;
  startCreateCustomModule: () => void;
  startEditCustomModule: () => void;
  cancelCustomModule: () => void;

  // filter / search UI
  search: string;
  setSearch: (v: string) => void;
  filter: BrowserFilter;
  setFilter: (v: BrowserFilter) => void;
}

const ModulesContext = createContext<ModulesContextValue | null>(null);

export function useModulesContext() {
  const ctx = useContext(ModulesContext);
  if (!ctx) throw new Error('useModulesContext must be used within ModulesProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ModulesProvider({ campaignId, children }: { campaignId: string; children: ReactNode }) {
  const { data: campaign } = useCampaign(campaignId);
  const { data: moduleCatalog } = useRulesModules();
  const { data: presets } = useRulesPresets();
  const { data: rulesData } = useCampaignRulesConfig(campaignId);
  const { data: customModules } = useCustomModules(campaignId);
  const updateRulesConfig = useUpdateCampaignRulesConfig(campaignId);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<BrowserFilter>('all');
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [customModuleMode, setCustomModuleMode] = useState<CustomModuleMode>('view');

  function startCreateCustomModule() {
    setSelectedNode(null);
    setCustomModuleMode('create');
  }

  function startEditCustomModule() {
    setCustomModuleMode('edit');
  }

  function cancelCustomModule() {
    setCustomModuleMode('view');
  }

  const enabledModules = useMemo(
    () => rulesData?.rulesConfig.enabledModules ?? [],
    [rulesData?.rulesConfig.enabledModules],
  );
  const enabledSet = useMemo(() => new Set(enabledModules), [enabledModules]);

  const activePreset = useMemo(
    () => presets?.find((preset) => preset.id === rulesData?.rulesConfig.presetId) ?? null,
    [presets, rulesData?.rulesConfig.presetId],
  );
  const lockedSet = useMemo(() => new Set(activePreset?.locked ?? []), [activePreset]);

  const derivedModules = useMemo(
    () =>
      (moduleCatalog ?? []).map((module) => ({
        module,
        status: deriveStatus(module, enabledSet, lockedSet, campaign?.system),
      })),
    [moduleCatalog, enabledSet, lockedSet, campaign?.system],
  );

  const filteredModules = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return derivedModules.filter(({ module, status }) => {
      if (filter !== 'all' && status.kind !== filter) return false;
      if (!needle) return true;
      return (
        module.name.toLowerCase().includes(needle) ||
        module.description.toLowerCase().includes(needle) ||
        module.id.toLowerCase().includes(needle) ||
        module.category.toLowerCase().includes(needle) ||
        module.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
  }, [derivedModules, filter, search]);

  const librarySections = useMemo(() => {
    const groups: Array<{ id: DerivedStatus; label: string }> = [
      { id: 'active', label: 'Active in This Campaign' },
      { id: 'required', label: 'Required by Rules Profile' },
      { id: 'available', label: 'Available to Add' },
      { id: 'blocked', label: 'Blocked by Current Stack' },
    ];
    return groups
      .map((group) => ({
        ...group,
        items: filteredModules.filter((entry) => entry.status.kind === group.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredModules]);

  const effectiveSelectedNode = useMemo(
    () =>
      selectedNode ??
      (derivedModules[0]
        ? ({ kind: 'module', id: derivedModules[0].module.id } as const)
        : null),
    [derivedModules, selectedNode],
  );

  const selectedBuiltIn =
    effectiveSelectedNode?.kind === 'module'
      ? moduleCatalog?.find((module) => module.id === effectiveSelectedNode.id) ?? null
      : null;

  const selectedCustom =
    effectiveSelectedNode?.kind === 'custom'
      ? customModules?.find((module) => module._id === effectiveSelectedNode.id) ?? null
      : null;

  const summary = useMemo(() => {
    const activeCount = derivedModules.filter(
      (entry) => entry.status.kind === 'active' || entry.status.kind === 'required',
    ).length;
    const blockedCount = derivedModules.filter((entry) => entry.status.kind === 'blocked').length;
    const availableCount = derivedModules.filter((entry) => entry.status.kind === 'available').length;
    return {
      activeCount,
      blockedCount,
      availableCount,
      line: `${activeCount} active modules, ${availableCount} additional modules available, ${blockedCount} currently blocked by the active stack.`,
    };
  }, [derivedModules]);

  const value: ModulesContextValue = {
    campaignId,
    campaign,
    moduleCatalog,
    presets,
    customModules,
    enabledModules,
    enabledSet,
    lockedSet,
    activePreset,
    updateRulesConfig,
    derivedModules,
    filteredModules,
    librarySections,
    summary,
    rulesData,
    selectedNode,
    setSelectedNode,
    effectiveSelectedNode,
    selectedBuiltIn,
    selectedCustom,
    customModuleMode,
    startCreateCustomModule,
    startEditCustomModule,
    cancelCustomModule,
    search,
    setSearch,
    filter,
    setFilter,
  };

  return <ModulesContext.Provider value={value}>{children}</ModulesContext.Provider>;
}
