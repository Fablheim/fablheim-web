import { useMemo, useState, type ReactNode } from 'react';
import {
  Blocks,
  CheckCircle2,
  ChevronRight,
  Lock,
  Package2,
  Search,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { systemLabels } from '@/types/campaign';

interface ModuleBrowserDeskV2Props {
  campaignId: string;
}

type BrowserFilter = 'all' | 'active' | 'available' | 'blocked';
type SelectedNode =
  | { kind: 'module'; id: string }
  | { kind: 'custom'; id: string };

type DerivedStatus = 'active' | 'required' | 'available' | 'blocked';

const panelClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.68)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(20,24%,8%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]';

const categoryLabels: Record<string, string> = {
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

export function ModuleBrowserDeskV2({ campaignId }: ModuleBrowserDeskV2Props) {
  const { data: campaign } = useCampaign(campaignId);
  const { data: moduleCatalog } = useRulesModules();
  const { data: presets } = useRulesPresets();
  const { data: rulesData } = useCampaignRulesConfig(campaignId);
  const { data: customModules } = useCustomModules(campaignId);
  const updateRulesConfig = useUpdateCampaignRulesConfig(campaignId);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<BrowserFilter>('all');
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const enabledModules = useMemo(
    () => rulesData?.rulesConfig.enabledModules ?? [],
    [rulesData?.rulesConfig.enabledModules],
  );
  const enabledSet = useMemo(() => new Set(enabledModules), [enabledModules]);

  const activePreset = useMemo(
    () => presets?.find((preset) => preset.id === rulesData?.rulesConfig.presetId) ?? null,
    [presets, rulesData?.rulesConfig.presetId],
  );
  const lockedSet = useMemo(
    () => new Set(activePreset?.locked ?? []),
    [activePreset],
  );

  const derivedModules = useMemo(
    () =>
      (moduleCatalog ?? []).map((module) => {
        const status = deriveStatus(module, enabledSet, lockedSet, campaign?.system);
        return {
          module,
          status,
        };
      }),
    [moduleCatalog, enabledSet, lockedSet, campaign?.system],
  );

  const filteredModules = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return derivedModules.filter(({ module, status }) => {
      if (filter !== 'all' && status.kind !== filter) {
        return false;
      }
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
    () => selectedNode ?? (derivedModules[0] ? ({ kind: 'module', id: derivedModules[0].module.id } as const) : null),
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
    const activeCount = derivedModules.filter((entry) => entry.status.kind === 'active' || entry.status.kind === 'required').length;
    const blockedCount = derivedModules.filter((entry) => entry.status.kind === 'blocked').length;
    const availableCount = derivedModules.filter((entry) => entry.status.kind === 'available').length;
    return {
      activeCount,
      blockedCount,
      availableCount,
      line: `${activeCount} active modules, ${availableCount} additional modules available, ${blockedCount} currently blocked by the active stack.`,
    };
  }, [derivedModules]);

  async function handleToggleModule(module: ModuleSummary) {
    const currentlyEnabled = enabledSet.has(module.id);
    if (!rulesData) return;
    if (lockedSet.has(module.id)) return;

    const nextEnabled = currentlyEnabled
      ? enabledModules.filter((id) => id !== module.id)
      : [...enabledModules, module.id];

    try {
      await updateRulesConfig.mutateAsync({
        presetId: rulesData.rulesConfig.presetId,
        enabledModules: nextEnabled,
        moduleConfig: rulesData.rulesConfig.moduleConfig ?? {},
        customModules: rulesData.rulesConfig.customModules ?? [],
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update modules');
    }
  }

  async function handleResetToPreset() {
    if (!activePreset || !rulesData) return;
    try {
      await updateRulesConfig.mutateAsync({
        presetId: activePreset.id,
        enabledModules: activePreset.modules,
        moduleConfig: activePreset.config,
        customModules: rulesData.rulesConfig.customModules ?? [],
      });
      toast.success('Reset to preset defaults');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset modules');
    }
  }

  async function handleSaveConfig(module: ModuleSummary, parsedConfig: Record<string, unknown>) {
    if (!rulesData) return;
    try {
      await updateRulesConfig.mutateAsync({
        presetId: rulesData.rulesConfig.presetId,
        enabledModules,
        moduleConfig: {
          ...(rulesData.rulesConfig.moduleConfig ?? {}),
          [module.id]: parsedConfig,
        },
        customModules: rulesData.rulesConfig.customModules ?? [],
      });
      toast.success('Module settings saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save module settings');
    }
  }

  const canResetToPreset = Boolean(activePreset);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsla(40,48%,24%,0.12),transparent_28%),linear-gradient(180deg,hsl(224,18%,8%)_0%,hsl(18,20%,7%)_100%)] text-[hsl(38,24%,88%)]">
      <header className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(38,30%,60%)]">Campaign Loadout Desk</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,42%,90%)]">Module Browser</h2>
            <p className="mt-2 max-w-3xl text-sm text-[hsl(30,14%,66%)]">
              {summary.line}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <HeaderAction label="Add Module" onClick={() => setFilter('available')} />
            <HeaderAction label="Review Active Stack" onClick={() => setFilter('active')} />
            <HeaderAction label="Reset to Defaults" onClick={() => void handleResetToPreset()} disabled={!canResetToPreset} />
            <HeaderAction label="Open Rules Profile" onClick={() => setFilter('all')} />
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">
        <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={`${panelClass} min-h-0 overflow-hidden`}>
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Module Library</p>
                <h3 className="mt-1 font-[Cinzel] text-2xl text-[hsl(38,34%,88%)]">Rules Stack</h3>
                <div className="mt-4 rounded-[18px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(30,12%,56%)]">Current Profile</p>
                  <p className="mt-2 font-[Cinzel] text-lg text-[hsl(38,34%,88%)]">
                    {activePreset?.name ?? systemLabels[campaign?.system ?? 'custom']}
                  </p>
                  <p className="mt-1 text-sm text-[hsl(30,14%,62%)]">
                    {campaign ? `Built on ${systemLabels[campaign.system]}.` : 'Campaign rules profile loading.'}
                  </p>
                </div>
                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(30,12%,52%)]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search modules, categories, tags..."
                    className="w-full rounded-[16px] border border-[hsla(32,24%,24%,0.68)] bg-[hsla(20,20%,8%,0.84)] py-2.5 pl-10 pr-3 text-sm text-[hsl(38,28%,86%)] outline-none transition focus:border-[hsla(42,60%,54%,0.45)]"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['all', 'active', 'available', 'blocked'] as const).map((value) => (
                    <FilterChip
                      key={value}
                      label={humanize(value)}
                      active={filter === value}
                      onClick={() => setFilter(value)}
                    />
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                <div className="space-y-4">
                  {librarySections.map((section) => (
                    <div key={section.id}>
                      <p className="px-2 text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">{section.label}</p>
                      <div className="mt-2 space-y-2">
                        {section.items.map(({ module, status }) => (
                          <button
                            key={module.id}
                            type="button"
                            onClick={() => setSelectedNode({ kind: 'module', id: module.id })}
                            className={`w-full rounded-[18px] border px-3 py-3 text-left transition ${
                              effectiveSelectedNode?.kind === 'module' && effectiveSelectedNode.id === module.id
                                ? 'border-[hsla(42,64%,58%,0.58)] bg-[linear-gradient(180deg,hsla(40,64%,52%,0.16)_0%,hsla(24,22%,12%,0.9)_100%)]'
                                : 'border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] hover:border-[hsla(42,42%,46%,0.38)]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-[Cinzel] text-base text-[hsl(38,32%,88%)]">{module.name}</p>
                                  <StatusBadge status={status.kind} />
                                </div>
                                <p className="mt-1 line-clamp-2 text-sm text-[hsl(38,26%,78%)]">{module.description}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <MiniBadge label={categoryLabels[module.category] ?? module.category} />
                                  {status.reasons[0] ? <MiniBadge label={status.reasons[0]} subtle /> : null}
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(30,12%,56%)]" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {customModules?.length ? (
                    <div>
                      <p className="px-2 text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Campaign Add-ons</p>
                      <div className="mt-2 space-y-2">
                        {customModules.map((module) => (
                          <button
                            key={module._id}
                            type="button"
                            onClick={() => setSelectedNode({ kind: 'custom', id: module._id })}
                            className={`w-full rounded-[18px] border px-3 py-3 text-left transition ${
                              effectiveSelectedNode?.kind === 'custom' && effectiveSelectedNode.id === module._id
                                ? 'border-[hsla(42,64%,58%,0.58)] bg-[linear-gradient(180deg,hsla(40,64%,52%,0.16)_0%,hsla(24,22%,12%,0.9)_100%)]'
                                : 'border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] hover:border-[hsla(42,42%,46%,0.38)]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-[Cinzel] text-base text-[hsl(38,32%,88%)]">{module.name}</p>
                                  <MiniBadge label="Campaign-authored" />
                                </div>
                                <p className="mt-1 line-clamp-2 text-sm text-[hsl(38,26%,78%)]">{module.description || 'Custom module with house rules and building blocks.'}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(30,12%,56%)]" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>

          <section className={`${panelClass} min-h-0 overflow-y-auto`}>
            <div className="px-5 py-5">
              {selectedBuiltIn ? (
                <BuiltInModuleWorkspace
                  key={`${selectedBuiltIn.id}:${JSON.stringify(rulesData?.rulesConfig.moduleConfig?.[selectedBuiltIn.id] ?? {})}`}
                  module={selectedBuiltIn}
                  status={deriveStatus(selectedBuiltIn, enabledSet, lockedSet, campaign?.system)}
                  activePreset={activePreset}
                  currentConfig={rulesData?.rulesConfig.moduleConfig?.[selectedBuiltIn.id] ?? {}}
                  isPending={updateRulesConfig.isPending}
                  onToggle={() => void handleToggleModule(selectedBuiltIn)}
                  onSaveConfig={(parsedConfig) => void handleSaveConfig(selectedBuiltIn, parsedConfig)}
                />
              ) : null}

              {selectedCustom ? <CustomModuleWorkspace module={selectedCustom} /> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function BuiltInModuleWorkspace({
  module,
  status,
  activePreset,
  currentConfig,
  isPending,
  onToggle,
  onSaveConfig,
}: {
  module: ModuleSummary;
  status: ReturnType<typeof deriveStatus>;
  activePreset: PresetSummary | null;
  currentConfig: Record<string, unknown>;
  isPending: boolean;
  onToggle: () => void;
  onSaveConfig: (parsedConfig: Record<string, unknown>) => void;
}) {
  const [draftConfig, setDraftConfig] = useState<Record<string, unknown>>({
    ...module.defaultConfig,
    ...currentConfig,
  });
  const [draftText, setDraftText] = useState<Record<string, string>>(
    buildConfigTextDraft({ ...module.defaultConfig, ...currentConfig }),
  );
  const configEntries = Object.entries(draftConfig);
  const contributionLines = buildContributionLines(module);

  return (
    <div>
      <div className="border-b border-[hsla(32,24%,24%,0.4)] pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Blocks className="h-5 w-5 text-[hsl(42,72%,72%)]" />
          <h3 className="font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">{module.name}</h3>
          <StatusBadge status={status.kind} large />
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[hsl(30,14%,66%)]">{module.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <MiniBadge label={categoryLabels[module.category] ?? module.category} />
          {module.official ? <MiniBadge label="Official" /> : null}
          {module.systems.map((system) => (
            <MiniBadge key={system} label={system} subtle />
          ))}
          {module.tags.map((tag) => (
            <MiniBadge key={tag} label={tag} subtle />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <WorkspaceAction
            label={status.kind === 'active' || status.kind === 'required' ? 'Disable Module' : 'Enable Module'}
            onClick={onToggle}
            disabled={status.kind === 'required' || isPending || (status.kind === 'blocked' && !isEnabledStatus(status.kind))}
          />
          <WorkspaceAction
            label="Save Settings"
            onClick={() => onSaveConfig(parseConfigDraft(draftConfig, draftText))}
            disabled={isPending || configEntries.length === 0}
          />
          <WorkspaceAction
            label="Reset Settings"
            onClick={() => {
              setDraftConfig(module.defaultConfig);
              setDraftText(buildConfigTextDraft(module.defaultConfig));
            }}
            disabled={configEntries.length === 0}
          />
          {activePreset ? <MiniBadge label={`Preset: ${activePreset.name}`} /> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.72fr)]">
        <div className="space-y-5">
          <InsightSection title="What It Adds" body="This is derived from the real registry metadata already attached to the module.">
            {contributionLines.length ? (
              contributionLines.map((line) => <LedgerLine key={line.label} label={line.label} value={line.value} />)
            ) : (
              <p className="text-sm text-[hsl(30,14%,62%)]">This module is mostly behavioral and does not expose structured field contributions.</p>
            )}
          </InsightSection>

          <InsightSection title="Compatibility" body="These constraints come directly from the rules registry and campaign profile rules.">
            <LedgerLine
              label="Status"
              value={status.reasons.join(' • ') || 'Available to enable in the current stack.'}
            />
            <LedgerLine
              label="Requires"
              value={module.requires.length ? module.requires.join(', ') : 'No dependencies'}
            />
            <LedgerLine
              label="Conflicts"
              value={module.conflicts.length ? module.conflicts.join(', ') : 'No explicit conflicts'}
            />
            <LedgerLine
              label="Exclusive Group"
              value={module.exclusive ?? 'None'}
            />
          </InsightSection>
        </div>

        <div className="space-y-5">
          <InsightSection title="Module Settings" body="Current overrides are saved into the campaign’s rules config.">
            {configEntries.length ? (
              <div className="space-y-4">
                {configEntries.map(([key, value]) => (
                  <ConfigField
                    key={key}
                    label={humanize(key)}
                    value={value}
                    textValue={draftText[key] ?? ''}
                    onChange={(next) => {
                      setDraftConfig((current) => ({ ...current, [key]: next }));
                    }}
                    onTextChange={(next) => {
                      setDraftText((current) => ({ ...current, [key]: next }));
                    }}
                  />
                ))}
                {Object.keys(currentConfig).length > 0 ? (
                  <p className="text-xs text-[hsl(30,12%,56%)]">This module already has saved campaign overrides.</p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-[hsl(30,14%,62%)]">This module does not expose editable settings yet.</p>
            )}
          </InsightSection>
        </div>
      </div>
    </div>
  );
}

function CustomModuleWorkspace({ module }: { module: CustomModule }) {
  const summaryLines = [
    module.resources.length ? `${module.resources.length} resource definitions` : null,
    module.conditions.length ? `${module.conditions.length} condition definitions` : null,
    module.rollTypes.length ? `${module.rollTypes.length} roll definitions` : null,
    module.houseRules.length ? `${module.houseRules.length} house rules` : null,
  ].filter(Boolean);

  return (
    <div>
      <div className="border-b border-[hsla(32,24%,24%,0.4)] pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Package2 className="h-5 w-5 text-[hsl(42,72%,72%)]" />
          <h3 className="font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">{module.name}</h3>
          <MiniBadge label="Campaign-authored" />
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[hsl(30,14%,66%)]">
          {module.description || 'This custom module carries campaign-authored rules blocks and AI context, but is still lighter-weight than a built-in registry module.'}
        </p>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.72fr)]">
        <InsightSection title="Module Contents" body="Custom modules define campaign-specific blocks rather than participating fully in the built-in exclusivity registry.">
          {summaryLines.length ? (
            summaryLines.map((line) => <LedgerLine key={line} label="Contains" value={line} />)
          ) : (
            <p className="text-sm text-[hsl(30,14%,62%)]">No custom blocks have been added yet.</p>
          )}
        </InsightSection>

        <InsightSection title="AI Context" body="This context is generated from the module’s authored blocks for AI-awareness.">
          <p className="whitespace-pre-wrap text-sm leading-7 text-[hsl(38,28%,84%)]">{module.aiContext || 'No AI context has been generated yet.'}</p>
        </InsightSection>
      </div>
    </div>
  );
}

function InsightSection({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,66%)]">{body}</p>
      <div className="mt-4 space-y-2">{children}</div>
    </div>
  );
}

function LedgerLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,9%,0.8)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(34,18%,58%)]">{label}</p>
      <p className="mt-1 text-sm text-[hsl(38,28%,84%)]">{value}</p>
    </div>
  );
}

function ConfigField({
  label,
  value,
  textValue,
  onChange,
  onTextChange,
}: {
  label: string;
  value: unknown;
  textValue: string;
  onChange: (value: unknown) => void;
  onTextChange: (value: string) => void;
}) {
  const primitiveArray = Array.isArray(value) && value.every((item) => typeof item !== 'object');
  const objectLike = typeof value === 'object' && value !== null;
  const complexArray = Array.isArray(value) && !primitiveArray;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(34,18%,58%)]">{label}</p>
      <div className="mt-2">
        {typeof value === 'boolean' ? (
          <label className="flex items-center gap-3 rounded-[16px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,9%,0.8)] px-3 py-2">
            <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
            <span className="text-sm text-[hsl(38,28%,84%)]">{value ? 'Enabled' : 'Disabled'}</span>
          </label>
        ) : typeof value === 'number' ? (
          <input
            type="number"
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className={fieldClass}
          />
        ) : typeof value === 'string' ? (
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={fieldClass}
          />
        ) : primitiveArray ? (
          <textarea
            value={textValue}
            onChange={(event) => onTextChange(event.target.value)}
            rows={4}
            className={fieldClass}
          />
        ) : objectLike || complexArray ? (
          <textarea
            value={textValue}
            onChange={(event) => onTextChange(event.target.value)}
            rows={6}
            className={`${fieldClass} font-mono text-xs`}
          />
        ) : (
          <input value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.16em] transition ${
        active
          ? 'border-[hsla(42,62%,56%,0.44)] bg-[hsla(40,48%,22%,0.32)] text-[hsl(42,76%,84%)]'
          : 'border-[hsla(32,24%,22%,0.68)] text-[hsl(30,12%,58%)] hover:border-[hsla(42,42%,46%,0.38)]'
      }`}
    >
      {label}
    </button>
  );
}

function HeaderAction({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-[hsla(42,42%,46%,0.28)] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[hsl(38,30%,78%)] transition hover:border-[hsla(42,62%,56%,0.44)] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {label}
    </button>
  );
}

function WorkspaceAction({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-[hsla(42,42%,46%,0.28)] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[hsl(38,30%,78%)] transition hover:border-[hsla(42,62%,56%,0.44)] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {label}
    </button>
  );
}

function StatusBadge({ status, large }: { status: DerivedStatus; large?: boolean }) {
  const className = large ? 'px-3 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]';
  const map = {
    active: {
      icon: CheckCircle2,
      label: 'Active',
      className: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200',
    },
    required: {
      icon: Lock,
      label: 'Required',
      className: 'border-amber-500/35 bg-amber-500/10 text-amber-200',
    },
    available: {
      icon: Sparkles,
      label: 'Available',
      className: 'border-sky-500/35 bg-sky-500/10 text-sky-200',
    },
    blocked: {
      icon: XCircle,
      label: 'Blocked',
      className: 'border-rose-500/35 bg-rose-500/10 text-rose-200',
    },
  } as const;
  const entry = map[status];
  const Icon = entry.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border uppercase tracking-[0.18em] ${className} ${entry.className}`}>
      <Icon className={large ? 'h-3.5 w-3.5' : 'h-3 w-3'} />
      {entry.label}
    </span>
  );
}

function MiniBadge({ label, subtle }: { label: string; subtle?: boolean }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
        subtle
          ? 'border-[hsla(32,24%,22%,0.68)] text-[hsl(30,12%,56%)]'
          : 'border-[hsla(42,42%,46%,0.28)] text-[hsl(38,36%,70%)]'
      }`}
    >
      {label}
    </span>
  );
}

function deriveStatus(
  module: ModuleSummary,
  enabledSet: Set<string>,
  lockedSet: Set<string>,
  campaignSystem?: string,
) {
  if (enabledSet.has(module.id)) {
    return { kind: lockedSet.has(module.id) ? 'required' : 'active', reasons: lockedSet.has(module.id) ? ['Included by the active rules profile.'] : ['Currently enabled in this campaign.'] } as const;
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
    const exclusiveMatch = Array.from(enabledSet).find((id) => id !== module.id && idInExclusiveGroup(id, module.exclusive));
    if (exclusiveMatch) {
      reasons.push(`Blocked by ${exclusiveMatch} in ${humanize(module.exclusive)}.`);
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
    reasons: [module.systems.length ? `Supports ${module.systems.join(', ')}` : 'Available as a general module.'],
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

function buildContributionLines(module: ModuleSummary) {
  const lines: Array<{ label: string; value: string }> = [];
  if (module.characterFields.length) {
    lines.push({
      label: 'Character Fields',
      value: module.characterFields.map((field) => field.label).join(', '),
    });
  }
  const initiativeKeys = Object.keys(module.initiativeFields);
  if (initiativeKeys.length) {
    lines.push({
      label: 'Initiative Fields',
      value: initiativeKeys.join(', '),
    });
  }
  const sessionKeys = Object.keys(module.sessionFields);
  if (sessionKeys.length) {
    lines.push({
      label: 'Session Fields',
      value: sessionKeys.join(', '),
    });
  }
  const campaignKeys = Object.keys(module.campaignFields);
  if (campaignKeys.length) {
    lines.push({
      label: 'Campaign Fields',
      value: campaignKeys.join(', '),
    });
  }
  const componentKeys = Object.keys(module.components);
  if (componentKeys.length) {
    lines.push({
      label: 'UI Hooks',
      value: componentKeys.map(humanize).join(', '),
    });
  }
  const hookKeys = Object.keys(module.hooks);
  if (hookKeys.length) {
    lines.push({
      label: 'Lifecycle Hooks',
      value: hookKeys.map(humanize).join(', '),
    });
  }
  if (!lines.length && Object.keys(module.defaultConfig).length) {
    lines.push({
      label: 'Default Settings',
      value: Object.keys(module.defaultConfig).map(humanize).join(', '),
    });
  }
  return lines;
}

function buildConfigTextDraft(config: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      if (Array.isArray(value) && value.every((item) => typeof item !== 'object')) {
        return [key, value.map((item) => String(item)).join('\n')];
      }
      if (typeof value === 'object' && value !== null) {
        return [key, JSON.stringify(value, null, 2)];
      }
      return [key, String(value ?? '')];
    }),
  );
}

function parseConfigDraft(
  draft: Record<string, unknown>,
  textDraft: Record<string, string>,
) {
  const parsed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft)) {
    if (Array.isArray(value) && value.every((item) => typeof item !== 'object')) {
      parsed[key] = (textDraft[key] ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      continue;
    }
    if (typeof value === 'object' && value !== null) {
      parsed[key] = JSON.parse(textDraft[key] ?? '{}') as unknown;
      continue;
    }
    parsed[key] = value;
  }
  return parsed;
}

function humanize(value: string) {
  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isEnabledStatus(status: DerivedStatus) {
  return status === 'active' || status === 'required';
}

const fieldClass =
  'w-full rounded-[16px] border border-[hsla(32,24%,24%,0.68)] bg-[hsla(20,20%,8%,0.84)] px-3 py-2.5 text-sm text-[hsl(38,28%,86%)] outline-none transition focus:border-[hsla(42,60%,54%,0.45)]';
