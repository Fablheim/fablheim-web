import { useMemo, useState } from 'react';
import { Blocks, Check, Lock, AlertTriangle, Loader2, Search, Plus, Package, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useRulesModules, useRulesPresets, useCampaignRulesConfig, useUpdateCampaignRulesConfig } from '@/hooks/useRulesEngine';
import { useCustomModules, useDeleteCustomModule } from '@/hooks/useCustomModules';
import { CustomModuleCreatorModal } from './CustomModuleCreatorModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { ModuleSummary, PresetSummary } from '@/api/rules-engine';
import type { CustomModule } from '@/types/custom-module';

interface ModuleBrowserPanelProps {
  campaignId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'dice-engine': 'Dice Engine',
  'health-model': 'Health Model',
  'action-economy': 'Action Economy',
  'resource-tracking': 'Resource Tracking',
  'condition-system': 'Conditions',
  'death-and-incapacitation': 'Death & Incapacitation',
  'advancement': 'Advancement',
  'combat-structure': 'Combat Structure',
  'scene-elements': 'Scene Elements',
  'character-building': 'Character Building',
  'inventory-and-economy': 'Inventory & Economy',
  'social-and-narrative': 'Social & Narrative',
  'gm-tools': 'GM Tools',
};

export function ModuleBrowserPanel({ campaignId }: ModuleBrowserPanelProps) {
  const { data: allModules, isLoading: modulesLoading } = useRulesModules();
  const { data: presets } = useRulesPresets();
  const { data: rulesData, isLoading: configLoading } = useCampaignRulesConfig(campaignId);
  const updateConfig = useUpdateCampaignRulesConfig(campaignId);
  const { data: customModules } = useCustomModules(campaignId);
  const deleteCustom = useDeleteCustomModule(campaignId);
  const [search, setSearch] = useState('');
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CustomModule | null>(null);
  const [deletingModule, setDeletingModule] = useState<CustomModule | null>(null);

  const enabledSet = useMemo(
    () => new Set(rulesData?.rulesConfig?.enabledModules ?? []),
    [rulesData?.rulesConfig?.enabledModules],
  );

  const lockedSet = useMemo(() => {
    if (!rulesData?.rulesConfig?.presetId || !presets) return new Set<string>();
    const preset = presets.find((p) => p.id === rulesData.rulesConfig.presetId);
    return new Set(preset?.locked ?? []);
  }, [rulesData?.rulesConfig?.presetId, presets]);

  const modulesByCategory = useMemo(() => {
    if (!allModules) return new Map<string, ModuleSummary[]>();
    const map = new Map<string, ModuleSummary[]>();
    for (const mod of allModules) {
      const list = map.get(mod.category) ?? [];
      list.push(mod);
      map.set(mod.category, list);
    }
    return map;
  }, [allModules]);

  const filteredCategories = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return Array.from(modulesByCategory.entries());
    return Array.from(modulesByCategory.entries())
      .map(([cat, mods]) => [cat, mods.filter((m) =>
        m.name.toLowerCase().includes(needle) ||
        m.description.toLowerCase().includes(needle) ||
        m.id.includes(needle)
      )] as [string, ModuleSummary[]])
      .filter(([, mods]) => mods.length > 0);
  }, [modulesByCategory, search]);

  if (modulesLoading || configLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allModules || !rulesData) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Failed to load module data.
      </div>
    );
  }

  function handleToggleModule(moduleId: string) {
    if (!rulesData) return;
    const config = rulesData.rulesConfig;
    const current = new Set(config.enabledModules);

    if (current.has(moduleId)) {
      current.delete(moduleId);
    } else {
      current.add(moduleId);
    }

    updateConfig.mutate(
      {
        presetId: config.presetId,
        enabledModules: Array.from(current),
        moduleConfig: config.moduleConfig ?? {},
        customModules: config.customModules,
      },
      {
        onError: (err) => {
          const message = err instanceof Error ? err.message : 'Failed to update modules';
          toast.error(message);
        },
      },
    );
  }

  function handleApplyPreset(preset: PresetSummary) {
    if (!rulesData) return;
    updateConfig.mutate(
      {
        presetId: preset.id,
        enabledModules: preset.modules,
        moduleConfig: rulesData.rulesConfig.moduleConfig ?? {},
      },
      {
        onSuccess: () => toast.success(`Applied "${preset.name}" preset`),
        onError: (err) => {
          const message = err instanceof Error ? err.message : 'Failed to apply preset';
          toast.error(message);
        },
      },
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {renderHeader()}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {renderPresetBar()}
        {renderCustomModulesSection()}
        {renderModuleList()}
      </div>
      <CustomModuleCreatorModal
        open={creatorOpen || !!editingModule}
        onClose={() => { setCreatorOpen(false); setEditingModule(null); }}
        campaignId={campaignId}
        existing={editingModule}
      />
      <ConfirmDialog
        open={!!deletingModule}
        title="Delete Custom Module"
        description={`Delete "${deletingModule?.name}"? This cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        isPending={deleteCustom.isPending}
        onConfirm={() => {
          if (!deletingModule) return;
          deleteCustom.mutate(deletingModule._id, {
            onSuccess: () => { toast.success('Module deleted'); setDeletingModule(null); },
            onError: () => toast.error('Failed to delete module'),
          });
        }}
        onCancel={() => setDeletingModule(null)}
      />
    </div>
  );

  function renderCustomModulesSection() {
    return (
      <div className="mb-4 mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="flex items-center gap-1 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
            <Package className="h-3 w-3" />
            Custom Modules
          </p>
          <button
            type="button"
            onClick={() => setCreatorOpen(true)}
            className="flex items-center gap-1 text-[10px] text-arcane hover:text-arcane/80"
          >
            <Plus className="h-3 w-3" /> New
          </button>
        </div>
        {customModules && customModules.length > 0 ? (
          <div className="space-y-0.5">
            {customModules.map((mod) => (
              <div
                key={mod._id}
                className="flex items-center gap-2 rounded bg-arcane/5 px-2 py-1.5"
              >
                <Package className="h-3 w-3 shrink-0 text-arcane/60" />
                <div className="min-w-0 flex-1">
                  <span className="truncate text-xs font-medium text-foreground">{mod.name}</span>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {[
                      mod.resources.length && `${mod.resources.length} resources`,
                      mod.conditions.length && `${mod.conditions.length} conditions`,
                      mod.rollTypes.length && `${mod.rollTypes.length} rolls`,
                      mod.houseRules.length && `${mod.houseRules.length} rules`,
                    ].filter(Boolean).join(', ') || 'Empty module'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingModule(mod)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Edit module"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingModule(mod)}
                  className="text-muted-foreground/40 hover:text-blood"
                  title="Delete module"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-2 text-center text-[10px] italic text-muted-foreground">
            No custom modules yet. Click + New to create one.
          </p>
        )}
      </div>
    );
  }

  function renderHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(38,30%,25%,0.2)] px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <Blocks className="h-4 w-4 text-primary/70" />
          <h2 className="font-['IM_Fell_English'] text-base font-semibold text-foreground">
            Rules Modules
          </h2>
          <span className="text-[10px] text-muted-foreground">
            {enabledSet.size} enabled
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules..."
            className="w-full rounded border border-input bg-input py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground input-carved"
          />
        </div>
      </div>
    );
  }

  function renderPresetBar() {
    if (!presets) return null;
    return (
      <div className="mb-3 mt-3">
        <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          Quick Presets
        </p>
        <div className="flex flex-wrap gap-1">
          {presets.map((preset) => {
            const isActive = rulesData?.rulesConfig?.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                disabled={updateConfig.isPending}
                className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors disabled:opacity-50 ${
                  isActive
                    ? 'border-primary/50 bg-primary/15 text-primary'
                    : 'border-border/60 text-muted-foreground hover:bg-accent'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderModuleList() {
    return (
      <div className="space-y-4">
        {filteredCategories.map(([category, modules]) => (
          <div key={category}>
            <p className="mb-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
              {CATEGORY_LABELS[category] ?? category}
            </p>
            <div className="space-y-0.5">
              {modules.map((mod) => renderModuleRow(mod))}
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">No matching modules.</p>
        )}
      </div>
    );
  }

  function renderModuleRow(mod: ModuleSummary) {
    const enabled = enabledSet.has(mod.id);
    const locked = lockedSet.has(mod.id);
    const hasConflict = mod.exclusive
      ? Array.from(enabledSet).some(
          (id) => id !== mod.id && allModules!.find((m) => m.id === id)?.exclusive === mod.exclusive,
        )
      : false;

    return (
      <div
        key={mod.id}
        className={`flex items-center gap-2 rounded px-2 py-1.5 transition-colors ${
          enabled ? 'bg-primary/5' : 'hover:bg-accent/50'
        }`}
      >
        <button
          type="button"
          onClick={() => handleToggleModule(mod.id)}
          disabled={locked || updateConfig.isPending}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
            enabled
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/40 hover:border-primary/60'
          } ${locked ? 'cursor-not-allowed opacity-50' : ''}`}
          title={locked ? 'Locked by preset' : enabled ? 'Disable module' : 'Enable module'}
        >
          {enabled && <Check className="h-3 w-3" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-xs font-medium text-foreground">{mod.name}</span>
            {locked && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
            {!enabled && hasConflict && (
              <span title="Conflicts with an enabled module in the same group"><AlertTriangle className="h-2.5 w-2.5 text-amber-400" /></span>
            )}
          </div>
          <p className="truncate text-[10px] text-muted-foreground">{mod.description}</p>
        </div>
      </div>
    );
  }
}
