import { useState, type ReactNode } from 'react';
import {
  Blocks,
  CheckCircle2,
  Lock,
  Loader2,
  Package2,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ModuleSummary, PresetSummary } from '@/api/rules-engine';
import type {
  CustomModule,
  CreateCustomModulePayload,
  CustomResourceDef,
  CustomConditionDef,
  CustomCharacterFieldDef,
  CustomRollTypeDef,
  HouseRuleDef,
} from '@/types/custom-module';
import {
  useCreateCustomModule,
  useUpdateCustomModule,
  useDeleteCustomModule,
} from '@/hooks/useCustomModules';
import { shellPanelClass } from '@/lib/panel-styles';
import {
  useModulesContext,
  deriveStatus,
  categoryLabels,
  humanize,
} from './ModulesContext';
import type { DerivedStatus } from './ModulesContext';

// ── Shared constants ──────────────────────────────────────────────────────────

type CustomTab = 'resources' | 'conditions' | 'fields' | 'rolls' | 'rules';

const CUSTOM_TAB_LABELS: Record<CustomTab, string> = {
  resources: 'Resources',
  conditions: 'Conditions',
  fields: 'Character Fields',
  rolls: 'Roll Types',
  rules: 'House Rules',
};

function toKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

const fieldClass =
  'w-full rounded-[16px] border border-[hsla(32,24%,24%,0.68)] bg-[hsla(20,20%,8%,0.84)] px-3 py-2.5 text-sm text-[hsl(38,28%,86%)] outline-none transition focus:border-[hsla(42,60%,54%,0.45)]';

const rowCardClass =
  'rounded-[16px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,9%,0.8)] p-3';

const smallFieldClass =
  'rounded-[12px] border border-[hsla(32,24%,24%,0.68)] bg-[hsla(20,20%,8%,0.84)] px-2.5 py-1.5 text-xs text-[hsl(38,28%,86%)] outline-none transition focus:border-[hsla(42,60%,54%,0.45)]';

const selectClass =
  'rounded-[12px] border border-[hsla(32,24%,24%,0.68)] bg-[hsla(20,20%,8%,0.84)] px-2 py-1.5 text-xs text-[hsl(38,28%,86%)] outline-none transition focus:border-[hsla(42,60%,54%,0.45)]';

// ── Main Export ───────────────────────────────────────────────────────────────

export function ModuleBrowserDeskV2() {
  const ctx = useModulesContext();
  const {
    campaign,
    campaignId,
    enabledModules,
    enabledSet,
    lockedSet,
    activePreset,
    updateRulesConfig,
    summary,
    rulesData,
    selectedBuiltIn,
    selectedCustom,
    customModuleMode,
    startCreateCustomModule,
    startEditCustomModule,
    cancelCustomModule,
    setSelectedNode,
  } = ctx;

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
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(40,48%,24%,0.12),transparent_28%),linear-gradient(180deg,hsl(224,18%,8%)_0%,hsl(18,20%,7%)_100%)] p-4 text-[hsl(38,24%,88%)]">
      <section className={`${shellPanelClass} min-h-0 flex-1 flex flex-col overflow-hidden`}>
        {renderShellHeader()}
        {renderShellBody()}
      </section>
    </div>
  );

  function renderShellHeader() {
    const selectedName = customModuleMode === 'create'
      ? 'New Custom Module'
      : (selectedBuiltIn?.name ?? selectedCustom?.name ?? 'Module Browser');
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {renderShellHeaderLeft(selectedName)}
          {renderShellHeaderActions()}
        </div>
        {renderShellHeaderStats()}
      </div>
    );
  }

  function renderShellHeaderLeft(selectedName: string) {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(30,14%,54%)]">
          MODULE BROWSER
        </p>
        <h2 className="mt-0.5 font-['IM_Fell_English'] text-[26px] leading-none text-[hsl(38,42%,90%)]">
          {selectedName}
        </h2>
        <p className="mt-1 text-sm text-[hsl(30,14%,66%)]">{summary.line}</p>
      </div>
    );
  }

  function renderShellHeaderActions() {
    return (
      <div className="flex flex-wrap gap-2">
        <HeaderAction label="Create Custom Module" onClick={startCreateCustomModule} disabled={customModuleMode !== 'view'} />
        <HeaderAction label="Reset to Defaults" onClick={() => void handleResetToPreset()} disabled={!canResetToPreset} />
        {selectedBuiltIn ? (
          <HeaderAction
            label={
              enabledSet.has(selectedBuiltIn.id)
                ? 'Disable Module'
                : 'Enable Module'
            }
            onClick={() => void handleToggleModule(selectedBuiltIn)}
            disabled={
              lockedSet.has(selectedBuiltIn.id) ||
              updateRulesConfig.isPending
            }
          />
        ) : null}
      </div>
    );
  }

  function renderShellHeaderStats() {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <StatPill label="Active" value={String(summary.activeCount)} tone="text-emerald-300" />
        <StatPill label="Available" value={String(summary.availableCount)} tone="text-sky-300" />
        <StatPill label="Blocked" value={String(summary.blockedCount)} tone="text-rose-300" />
        {activePreset ? (
          <span className="rounded-full border border-[hsla(42,42%,46%,0.28)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(38,36%,70%)]">
            Profile: {activePreset.name}
          </span>
        ) : null}
      </div>
    );
  }

  function renderShellBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {renderShellBodyContent()}
      </div>
    );
  }

  function renderShellBodyContent() {
    if (customModuleMode === 'create') {
      return (
        <CustomModuleEditor
          campaignId={campaignId}
          mode="create"
          onDone={cancelCustomModule}
        />
      );
    }
    if (selectedBuiltIn) {
      return (
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
      );
    }
    if (selectedCustom) {
      return (
        <CustomModuleWorkspace
          key={selectedCustom._id}
          module={selectedCustom}
          campaignId={campaignId}
          mode={customModuleMode}
          onStartEdit={startEditCustomModule}
          onCancel={cancelCustomModule}
          onDeleted={() => { cancelCustomModule(); setSelectedNode(null); }}
        />
      );
    }
    return renderEmptyState();
  }

  function renderEmptyState() {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            No Module Selected
          </p>
          <h4 className="mt-3 font-['IM_Fell_English'] text-[32px] leading-none text-[hsl(38,42%,90%)]">
            Configure the rules stack
          </h4>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[hsl(30,14%,58%)]">
            Select a module from the panel to review its details, enable or disable it,
            and adjust its settings for this campaign.
          </p>
        </div>
      </div>
    );
  }
}

// ── BuiltInModuleWorkspace ────────────────────────────────────────────────────

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
      {renderWorkspaceHeader()}
      {renderWorkspaceContent()}
    </div>
  );

  function renderWorkspaceHeader() {
    return (
      <div className="border-b border-[hsla(32,24%,24%,0.4)] pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Blocks className="h-5 w-5 text-[hsl(42,72%,72%)]" />
          <h3 className="font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">{module.name}</h3>
          <StatusBadge status={status.kind} large />
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[hsl(30,14%,66%)]">{module.description}</p>
        {renderModuleBadges()}
        {renderModuleActions()}
      </div>
    );
  }

  function renderModuleBadges() {
    return (
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
    );
  }

  function renderModuleActions() {
    return (
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
    );
  }

  function renderWorkspaceContent() {
    return (
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.72fr)]">
        {renderLeftInsights()}
        {renderRightSettings()}
      </div>
    );
  }

  function renderLeftInsights() {
    return (
      <div className="space-y-5">
        <InsightSection title="What It Adds" body="This is derived from the real registry metadata already attached to the module.">
          {contributionLines.length ? (
            contributionLines.map((line) => <LedgerLine key={line.label} label={line.label} value={line.value} />)
          ) : (
            <p className="text-sm text-[hsl(30,14%,62%)]">This module is mostly behavioral and does not expose structured field contributions.</p>
          )}
        </InsightSection>
        <InsightSection title="Compatibility" body="These constraints come directly from the rules registry and campaign profile rules.">
          <LedgerLine label="Status" value={status.reasons.join(' \u2022 ') || 'Available to enable in the current stack.'} />
          <LedgerLine label="Requires" value={module.requires.length ? module.requires.join(', ') : 'No dependencies'} />
          <LedgerLine label="Conflicts" value={module.conflicts.length ? module.conflicts.join(', ') : 'No explicit conflicts'} />
          <LedgerLine label="Exclusive Group" value={module.exclusive ?? 'None'} />
        </InsightSection>
      </div>
    );
  }

  function renderRightSettings() {
    return (
      <div className="space-y-5">
        <InsightSection title="Module Settings" body="Current overrides are saved into the campaign's rules config.">
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
    );
  }
}

// ── CustomModuleWorkspace (view + edit) ───────────────────────────────────────

function CustomModuleWorkspace({
  module,
  campaignId,
  mode,
  onStartEdit,
  onCancel,
  onDeleted,
}: {
  module: CustomModule;
  campaignId: string;
  mode: 'view' | 'edit';
  onStartEdit: () => void;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  if (mode === 'edit') {
    return (
      <CustomModuleEditor
        campaignId={campaignId}
        mode="edit"
        existing={module}
        onDone={onCancel}
      />
    );
  }

  return (
    <CustomModuleViewMode
      module={module}
      campaignId={campaignId}
      onStartEdit={onStartEdit}
      onDeleted={onDeleted}
    />
  );
}

// ── CustomModuleViewMode ──────────────────────────────────────────────────────

function CustomModuleViewMode({
  module,
  campaignId,
  onStartEdit,
  onDeleted,
}: {
  module: CustomModule;
  campaignId: string;
  onStartEdit: () => void;
  onDeleted: () => void;
}) {
  const deleteMut = useDeleteCustomModule(campaignId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const summaryLines = buildCustomSummaryLines(module);

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteMut.mutate(module._id, {
      onSuccess: () => { toast.success('Custom module deleted'); onDeleted(); },
      onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Delete failed'),
    });
  }

  return (
    <div>
      {renderViewHeader()}
      {renderViewContent()}
    </div>
  );

  function renderViewHeader() {
    return (
      <div className="border-b border-[hsla(32,24%,24%,0.4)] pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Package2 className="h-5 w-5 text-[hsl(42,72%,72%)]" />
          <h3 className="font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">{module.name}</h3>
          <MiniBadge label="Campaign-authored" />
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[hsl(30,14%,66%)]">
          {module.description || 'This custom module carries campaign-authored rules blocks and AI context.'}
        </p>
        {renderViewActions()}
      </div>
    );
  }

  function renderViewActions() {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <WorkspaceAction label="Edit Module" onClick={onStartEdit} />
        <WorkspaceAction
          label={confirmDelete ? 'Confirm Delete' : 'Delete Module'}
          onClick={handleDelete}
          disabled={deleteMut.isPending}
          destructive={confirmDelete}
        />
        {confirmDelete ? (
          <WorkspaceAction label="Cancel" onClick={() => setConfirmDelete(false)} />
        ) : null}
      </div>
    );
  }

  function renderViewContent() {
    return (
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.72fr)]">
        <InsightSection title="Module Contents" body="Custom modules define campaign-specific blocks.">
          {summaryLines.length ? (
            summaryLines.map((line) => <LedgerLine key={line} label="Contains" value={line} />)
          ) : (
            <p className="text-sm text-[hsl(30,14%,62%)]">No custom blocks have been added yet.</p>
          )}
        </InsightSection>
        <InsightSection title="AI Context" body="This context is generated from the module's authored blocks for AI-awareness.">
          <p className="whitespace-pre-wrap text-sm leading-7 text-[hsl(38,28%,84%)]">{module.aiContext || 'No AI context has been generated yet.'}</p>
        </InsightSection>
      </div>
    );
  }
}

// ── CustomModuleEditor (create + edit) ────────────────────────────────────────

function CustomModuleEditor({
  campaignId,
  mode,
  existing,
  onDone,
}: {
  campaignId: string;
  mode: 'create' | 'edit';
  existing?: CustomModule;
  onDone: () => void;
}) {
  const createMut = useCreateCustomModule(campaignId);
  const updateMut = useUpdateCustomModule(campaignId);
  const isPending = createMut.isPending || updateMut.isPending;

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [activeTab, setActiveTab] = useState<CustomTab>('resources');

  const [resources, setResources] = useState<CustomResourceDef[]>(existing?.resources ?? []);
  const [conditions, setConditions] = useState<CustomConditionDef[]>(existing?.conditions ?? []);
  const [characterFields, setCharacterFields] = useState<CustomCharacterFieldDef[]>(existing?.characterFields ?? []);
  const [rollTypes, setRollTypes] = useState<CustomRollTypeDef[]>(existing?.rollTypes ?? []);
  const [houseRules, setHouseRules] = useState<HouseRuleDef[]>(existing?.houseRules ?? []);

  function handleSave() {
    if (!name.trim()) {
      toast.error('Module name is required');
      return;
    }

    const payload: CreateCustomModulePayload = {
      name: name.trim(),
      description: description.trim(),
      resources,
      conditions,
      characterFields,
      rollTypes,
      houseRules,
    };

    if (mode === 'edit' && existing) {
      updateMut.mutate(
        { id: existing._id, body: payload },
        {
          onSuccess: () => { toast.success('Module updated'); onDone(); },
          onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Update failed'),
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => { toast.success('Module created'); onDone(); },
        onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Create failed'),
      });
    }
  }

  return (
    <div>
      {renderEditorHeader()}
      {renderEditorTabs()}
      {renderEditorTabContent()}
      {renderEditorFooter()}
    </div>
  );

  function renderEditorHeader() {
    return (
      <div className="border-b border-[hsla(32,24%,24%,0.4)] pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Package2 className="h-5 w-5 text-[hsl(42,72%,72%)]" />
          <h3 className="font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">
            {mode === 'create' ? 'New Custom Module' : `Editing: ${existing?.name ?? ''}`}
          </h3>
        </div>
        <div className="mt-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Module name"
            maxLength={100}
            className={fieldClass}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            maxLength={2000}
            rows={2}
            className={fieldClass}
          />
        </div>
      </div>
    );
  }

  function renderEditorTabs() {
    return (
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(Object.keys(CUSTOM_TAB_LABELS) as CustomTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition ${
              activeTab === tab
                ? 'border-[hsla(42,62%,56%,0.44)] bg-[hsla(42,42%,24%,0.22)] text-[hsl(38,42%,90%)]'
                : 'border-[hsla(32,24%,22%,0.58)] text-[hsl(30,14%,62%)] hover:border-[hsla(42,42%,46%,0.28)] hover:text-[hsl(38,30%,78%)]'
            }`}
          >
            {CUSTOM_TAB_LABELS[tab]}
          </button>
        ))}
      </div>
    );
  }

  function renderEditorTabContent() {
    return (
      <div className="mt-5">
        {activeTab === 'resources' ? <ResourcesEditor resources={resources} onChange={setResources} /> : null}
        {activeTab === 'conditions' ? <ConditionsEditor conditions={conditions} onChange={setConditions} /> : null}
        {activeTab === 'fields' ? <CharacterFieldsEditor fields={characterFields} onChange={setCharacterFields} /> : null}
        {activeTab === 'rolls' ? <RollTypesEditor rollTypes={rollTypes} onChange={setRollTypes} /> : null}
        {activeTab === 'rules' ? <HouseRulesEditor houseRules={houseRules} onChange={setHouseRules} /> : null}
      </div>
    );
  }

  function renderEditorFooter() {
    return (
      <div className="mt-6 flex flex-wrap gap-2 border-t border-[hsla(32,24%,24%,0.4)] pt-4">
        <WorkspaceAction
          label={isPending ? 'Saving...' : (mode === 'create' ? 'Create Module' : 'Save Changes')}
          onClick={handleSave}
          disabled={isPending || !name.trim()}
        />
        <WorkspaceAction label="Cancel" onClick={onDone} disabled={isPending} />
        {isPending ? <Loader2 className="h-4 w-4 animate-spin text-[hsl(38,30%,60%)]" /> : null}
      </div>
    );
  }
}

// ── Resources Editor ──────────────────────────────────────────────────────────

function ResourcesEditor({
  resources,
  onChange,
}: {
  resources: CustomResourceDef[];
  onChange: (r: CustomResourceDef[]) => void;
}) {
  function addResource() {
    onChange([...resources, { key: '', label: '', max: 5 }]);
  }

  function updateResource(index: number, patch: Partial<CustomResourceDef>) {
    const next = [...resources];
    next[index] = { ...next[index], ...patch };
    if (patch.label !== undefined) next[index].key = toKey(patch.label);
    onChange(next);
  }

  function removeResource(index: number) {
    onChange(resources.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {renderResourcesTopBar()}
      {renderResourcesList()}
    </div>
  );

  function renderResourcesTopBar() {
    return (
      <div className="flex items-center justify-between">
        <p className="text-xs text-[hsl(30,14%,62%)]">
          Define resource pools characters can track (e.g. Sanity Points, Luck Tokens).
        </p>
        <AddRowButton label="Add Resource" onClick={addResource} />
      </div>
    );
  }

  function renderResourcesList() {
    if (!resources.length) {
      return <EmptyTabMessage message="No resources defined yet -- add one above." />;
    }
    return (
      <div className="space-y-2">
        {resources.map((r, i) => (
          <div key={i} className={rowCardClass}>
            {renderResourceRow(r, i)}
          </div>
        ))}
      </div>
    );
  }

  function renderResourceRow(r: CustomResourceDef, i: number) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={r.label}
          onChange={(e) => updateResource(i, { label: e.target.value })}
          placeholder="Label"
          className={`flex-1 min-w-[120px] ${smallFieldClass}`}
        />
        <input
          value={r.key}
          onChange={(e) => { const next = [...resources]; next[i] = { ...next[i], key: e.target.value }; onChange(next); }}
          placeholder="Key"
          className={`w-32 ${smallFieldClass}`}
        />
        <input
          type="number"
          value={r.max}
          onChange={(e) => updateResource(i, { max: parseInt(e.target.value, 10) || 1 })}
          min={1}
          max={100}
          className={`w-16 text-center ${smallFieldClass}`}
          title="Max value"
        />
        <select
          value={r.rechargeOn ?? 'manual'}
          onChange={(e) => updateResource(i, { rechargeOn: e.target.value as CustomResourceDef['rechargeOn'] })}
          className={selectClass}
        >
          <option value="manual">Manual</option>
          <option value="short-rest">Short Rest</option>
          <option value="long-rest">Long Rest</option>
        </select>
        <select
          value={r.display ?? 'dots'}
          onChange={(e) => updateResource(i, { display: e.target.value as CustomResourceDef['display'] })}
          className={selectClass}
        >
          <option value="dots">Dots</option>
          <option value="number">Number</option>
          <option value="bar">Bar</option>
        </select>
        <RemoveRowButton onClick={() => removeResource(i)} />
      </div>
    );
  }
}

// ── Conditions Editor ─────────────────────────────────────────────────────────

function ConditionsEditor({
  conditions,
  onChange,
}: {
  conditions: CustomConditionDef[];
  onChange: (c: CustomConditionDef[]) => void;
}) {
  function addCondition() {
    onChange([...conditions, { key: '', label: '', description: '' }]);
  }

  function updateCondition(index: number, patch: Partial<CustomConditionDef>) {
    const next = [...conditions];
    next[index] = { ...next[index], ...patch };
    if (patch.label !== undefined) next[index].key = toKey(patch.label);
    onChange(next);
  }

  function removeCondition(index: number) {
    onChange(conditions.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {renderConditionsTopBar()}
      {renderConditionsList()}
    </div>
  );

  function renderConditionsTopBar() {
    return (
      <div className="flex items-center justify-between">
        <p className="text-xs text-[hsl(30,14%,62%)]">
          Define custom conditions characters can receive (e.g. Corrupted, Hexed).
        </p>
        <AddRowButton label="Add Condition" onClick={addCondition} />
      </div>
    );
  }

  function renderConditionsList() {
    if (!conditions.length) {
      return <EmptyTabMessage message="No conditions defined yet -- add one above." />;
    }
    return (
      <div className="space-y-2">
        {conditions.map((c, i) => (
          <div key={i} className={rowCardClass}>
            {renderConditionRow(c, i)}
          </div>
        ))}
      </div>
    );
  }

  function renderConditionRow(c: CustomConditionDef, i: number) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={c.label}
            onChange={(e) => updateCondition(i, { label: e.target.value })}
            placeholder="Label"
            className={`flex-1 min-w-[120px] ${smallFieldClass}`}
          />
          <input
            value={c.key}
            onChange={(e) => { const next = [...conditions]; next[i] = { ...next[i], key: e.target.value }; onChange(next); }}
            placeholder="Key"
            className={`w-32 ${smallFieldClass}`}
          />
          <label className="flex items-center gap-1.5 text-[10px] text-[hsl(30,14%,62%)]">
            <input
              type="checkbox"
              checked={c.hasValue ?? false}
              onChange={(e) => updateCondition(i, { hasValue: e.target.checked })}
            />
            Has Value
          </label>
          <RemoveRowButton onClick={() => removeCondition(i)} />
        </div>
        <input
          value={c.description}
          onChange={(e) => updateCondition(i, { description: e.target.value })}
          placeholder="Description"
          className={`w-full ${smallFieldClass}`}
        />
      </div>
    );
  }
}

// ── Character Fields Editor ───────────────────────────────────────────────────

function CharacterFieldsEditor({
  fields,
  onChange,
}: {
  fields: CustomCharacterFieldDef[];
  onChange: (f: CustomCharacterFieldDef[]) => void;
}) {
  function addField() {
    onChange([...fields, { key: '', label: '', type: 'number' }]);
  }

  function updateField(index: number, patch: Partial<CustomCharacterFieldDef>) {
    const next = [...fields];
    next[index] = { ...next[index], ...patch };
    if (patch.label !== undefined) next[index].key = toKey(patch.label);
    onChange(next);
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {renderFieldsTopBar()}
      {renderFieldsList()}
    </div>
  );

  function renderFieldsTopBar() {
    return (
      <div className="flex items-center justify-between">
        <p className="text-xs text-[hsl(30,14%,62%)]">
          Add custom fields to character sheets (e.g. Sanity Score, Corruption Level).
        </p>
        <AddRowButton label="Add Field" onClick={addField} />
      </div>
    );
  }

  function renderFieldsList() {
    if (!fields.length) {
      return <EmptyTabMessage message="No character fields defined yet -- add one above." />;
    }
    return (
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={i} className={rowCardClass}>
            {renderFieldRow(f, i)}
          </div>
        ))}
      </div>
    );
  }

  function renderFieldRow(f: CustomCharacterFieldDef, i: number) {
    return (
      <div className="space-y-2">
        {renderFieldRowTop(f, i)}
        {renderFieldRowBottom(f, i)}
      </div>
    );
  }

  function renderFieldRowTop(f: CustomCharacterFieldDef, i: number) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={f.label}
          onChange={(e) => updateField(i, { label: e.target.value })}
          placeholder="Label"
          className={`flex-1 min-w-[120px] ${smallFieldClass}`}
        />
        <input
          value={f.key}
          onChange={(e) => { const next = [...fields]; next[i] = { ...next[i], key: e.target.value }; onChange(next); }}
          placeholder="Key"
          className={`w-32 ${smallFieldClass}`}
        />
        <select
          value={f.type}
          onChange={(e) => updateField(i, { type: e.target.value as CustomCharacterFieldDef['type'] })}
          className={selectClass}
        >
          <option value="number">Number</option>
          <option value="text">Text</option>
          <option value="toggle">Toggle</option>
          <option value="select">Select</option>
          <option value="string-array">Tags</option>
        </select>
        <RemoveRowButton onClick={() => removeField(i)} />
      </div>
    );
  }

  function renderFieldRowBottom(f: CustomCharacterFieldDef, i: number) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={f.group ?? ''}
          onChange={(e) => updateField(i, { group: e.target.value || undefined })}
          placeholder="Group (optional)"
          className={`w-32 ${smallFieldClass}`}
        />
        {f.type === 'number' ? (
          <>
            <input
              type="number"
              value={f.min ?? ''}
              onChange={(e) => updateField(i, { min: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Min"
              className={`w-16 text-center ${smallFieldClass}`}
            />
            <input
              type="number"
              value={f.max ?? ''}
              onChange={(e) => updateField(i, { max: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Max"
              className={`w-16 text-center ${smallFieldClass}`}
            />
          </>
        ) : null}
        {f.type === 'select' ? (
          <input
            value={(f.options ?? []).join(', ')}
            onChange={(e) => updateField(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            placeholder="Options (comma-separated)"
            className={`flex-1 min-w-[160px] ${smallFieldClass}`}
          />
        ) : null}
        <input
          value={String(f.defaultValue ?? '')}
          onChange={(e) => updateField(i, { defaultValue: f.type === 'number' ? Number(e.target.value) || 0 : e.target.value })}
          placeholder="Default value"
          className={`w-28 ${smallFieldClass}`}
        />
      </div>
    );
  }
}

// ── Roll Types Editor ─────────────────────────────────────────────────────────

function RollTypesEditor({
  rollTypes,
  onChange,
}: {
  rollTypes: CustomRollTypeDef[];
  onChange: (r: CustomRollTypeDef[]) => void;
}) {
  function addRollType() {
    onChange([...rollTypes, { key: '', label: '', dice: '1d20' }]);
  }

  function updateRollType(index: number, patch: Partial<CustomRollTypeDef>) {
    const next = [...rollTypes];
    next[index] = { ...next[index], ...patch };
    if (patch.label !== undefined) next[index].key = toKey(patch.label);
    onChange(next);
  }

  function removeRollType(index: number) {
    onChange(rollTypes.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {renderRollTypesTopBar()}
      {renderRollTypesList()}
    </div>
  );

  function renderRollTypesTopBar() {
    return (
      <div className="flex items-center justify-between">
        <p className="text-xs text-[hsl(30,14%,62%)]">
          Define custom roll types (e.g. Sanity Check: 1d20, Corruption Roll: 2d6).
        </p>
        <AddRowButton label="Add Roll Type" onClick={addRollType} />
      </div>
    );
  }

  function renderRollTypesList() {
    if (!rollTypes.length) {
      return <EmptyTabMessage message="No roll types defined yet -- add one above." />;
    }
    return (
      <div className="space-y-2">
        {rollTypes.map((r, i) => (
          <div key={i} className={rowCardClass}>
            {renderRollTypeRow(r, i)}
          </div>
        ))}
      </div>
    );
  }

  function renderRollTypeRow(r: CustomRollTypeDef, i: number) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={r.label}
            onChange={(e) => updateRollType(i, { label: e.target.value })}
            placeholder="Label"
            className={`flex-1 min-w-[120px] ${smallFieldClass}`}
          />
          <input
            value={r.key}
            onChange={(e) => { const next = [...rollTypes]; next[i] = { ...next[i], key: e.target.value }; onChange(next); }}
            placeholder="Key"
            className={`w-32 ${smallFieldClass}`}
          />
          <input
            value={r.dice}
            onChange={(e) => updateRollType(i, { dice: e.target.value })}
            placeholder="Dice (e.g. 1d20)"
            className={`w-24 ${smallFieldClass}`}
          />
          <input
            value={r.modifier ?? ''}
            onChange={(e) => updateRollType(i, { modifier: e.target.value || undefined })}
            placeholder="Modifier"
            className={`w-20 ${smallFieldClass}`}
          />
          <RemoveRowButton onClick={() => removeRollType(i)} />
        </div>
        <input
          value={r.description ?? ''}
          onChange={(e) => updateRollType(i, { description: e.target.value })}
          placeholder="Description (optional)"
          className={`w-full ${smallFieldClass}`}
        />
      </div>
    );
  }
}

// ── House Rules Editor ────────────────────────────────────────────────────────

function HouseRulesEditor({
  houseRules,
  onChange,
}: {
  houseRules: HouseRuleDef[];
  onChange: (r: HouseRuleDef[]) => void;
}) {
  function addRule() {
    onChange([...houseRules, { key: '', title: '', description: '' }]);
  }

  function updateRule(index: number, patch: Partial<HouseRuleDef>) {
    const next = [...houseRules];
    next[index] = { ...next[index], ...patch };
    if (patch.title !== undefined) next[index].key = toKey(patch.title);
    onChange(next);
  }

  function removeRule(index: number) {
    onChange(houseRules.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {renderHouseRulesTopBar()}
      {renderHouseRulesList()}
    </div>
  );

  function renderHouseRulesTopBar() {
    return (
      <div className="flex items-center justify-between">
        <p className="text-xs text-[hsl(30,14%,62%)]">
          Document house rules for your table. These are displayed in the session sidebar.
        </p>
        <AddRowButton label="Add House Rule" onClick={addRule} />
      </div>
    );
  }

  function renderHouseRulesList() {
    if (!houseRules.length) {
      return <EmptyTabMessage message="No house rules defined yet -- add one above." />;
    }
    return (
      <div className="space-y-2">
        {houseRules.map((r, i) => (
          <div key={i} className={rowCardClass}>
            {renderHouseRuleRow(r, i)}
          </div>
        ))}
      </div>
    );
  }

  function renderHouseRuleRow(r: HouseRuleDef, i: number) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={r.title}
            onChange={(e) => updateRule(i, { title: e.target.value })}
            placeholder="Rule Title"
            className={`flex-1 min-w-[120px] ${smallFieldClass}`}
          />
          <input
            value={r.key}
            onChange={(e) => { const next = [...houseRules]; next[i] = { ...next[i], key: e.target.value }; onChange(next); }}
            placeholder="Key"
            className={`w-32 ${smallFieldClass}`}
          />
          <input
            value={r.category ?? ''}
            onChange={(e) => updateRule(i, { category: e.target.value || undefined })}
            placeholder="Category"
            className={`w-24 ${smallFieldClass}`}
          />
          <RemoveRowButton onClick={() => removeRule(i)} />
        </div>
        <textarea
          value={r.description}
          onChange={(e) => updateRule(i, { description: e.target.value })}
          placeholder="Rule description"
          rows={2}
          className={`w-full ${smallFieldClass}`}
        />
      </div>
    );
  }
}

// ── Small shared sub-components ───────────────────────────────────────────────

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-1 rounded-full border border-[hsla(42,42%,46%,0.28)] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[hsl(38,30%,78%)] transition hover:border-[hsla(42,62%,56%,0.44)]"
    >
      <Plus className="h-3 w-3" />
      {label}
    </button>
  );
}

function RemoveRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-[hsl(30,14%,50%)] transition hover:text-rose-400"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function EmptyTabMessage({ message }: { message: string }) {
  return (
    <div className={`${rowCardClass} text-center`}>
      <p className="py-4 text-sm text-[hsl(30,14%,58%)]">{message}</p>
    </div>
  );
}

// ── InsightSection ────────────────────────────────────────────────────────────

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

// ── LedgerLine ────────────────────────────────────────────────────────────────

function LedgerLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,9%,0.8)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(34,18%,58%)]">{label}</p>
      <p className="mt-1 text-sm text-[hsl(38,28%,84%)]">{value}</p>
    </div>
  );
}

// ── ConfigField ───────────────────────────────────────────────────────────────

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

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status, large }: { status: DerivedStatus; large?: boolean }) {
  const sizeClass = large ? 'px-3 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]';
  const map = {
    active: { icon: CheckCircle2, label: 'Active', className: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200' },
    required: { icon: Lock, label: 'Required', className: 'border-amber-500/35 bg-amber-500/10 text-amber-200' },
    available: { icon: Sparkles, label: 'Available', className: 'border-sky-500/35 bg-sky-500/10 text-sky-200' },
    blocked: { icon: XCircle, label: 'Blocked', className: 'border-rose-500/35 bg-rose-500/10 text-rose-200' },
  } as const;
  const entry = map[status];
  const Icon = entry.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border uppercase tracking-[0.18em] ${sizeClass} ${entry.className}`}>
      <Icon className={large ? 'h-3.5 w-3.5' : 'h-3 w-3'} />
      {entry.label}
    </span>
  );
}

// ── MiniBadge ─────────────────────────────────────────────────────────────────

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

// ── HeaderAction ──────────────────────────────────────────────────────────────

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

// ── WorkspaceAction ───────────────────────────────────────────────────────────

function WorkspaceAction({
  label,
  onClick,
  disabled,
  destructive,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-45 ${
        destructive
          ? 'border-rose-500/40 text-rose-300 hover:border-rose-500/60'
          : 'border-[hsla(42,42%,46%,0.28)] text-[hsl(38,30%,78%)] hover:border-[hsla(42,62%,56%,0.44)]'
      }`}
    >
      {label}
    </button>
  );
}

// ── StatPill ──────────────────────────────────────────────────────────────────

function StatPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-full border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,9%,0.54)] px-2 py-1 text-center">
      <p className={`text-[11px] font-medium ${tone}`}>{value}</p>
      <p className="text-[9px] uppercase tracking-[0.14em] text-[hsl(30,12%,48%)]">{label}</p>
    </div>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function buildCustomSummaryLines(module: CustomModule) {
  return [
    module.resources.length ? `${module.resources.length} resource definitions` : null,
    module.conditions.length ? `${module.conditions.length} condition definitions` : null,
    module.characterFields.length ? `${module.characterFields.length} character fields` : null,
    module.rollTypes.length ? `${module.rollTypes.length} roll definitions` : null,
    module.houseRules.length ? `${module.houseRules.length} house rules` : null,
  ].filter((line): line is string => Boolean(line));
}

function buildContributionLines(module: ModuleSummary) {
  const lines: Array<{ label: string; value: string }> = [];
  if (module.characterFields.length) {
    lines.push({ label: 'Character Fields', value: module.characterFields.map((field) => field.label).join(', ') });
  }
  const initiativeKeys = Object.keys(module.initiativeFields);
  if (initiativeKeys.length) {
    lines.push({ label: 'Initiative Fields', value: initiativeKeys.join(', ') });
  }
  const sessionKeys = Object.keys(module.sessionFields);
  if (sessionKeys.length) {
    lines.push({ label: 'Session Fields', value: sessionKeys.join(', ') });
  }
  const campaignKeys = Object.keys(module.campaignFields);
  if (campaignKeys.length) {
    lines.push({ label: 'Campaign Fields', value: campaignKeys.join(', ') });
  }
  const componentKeys = Object.keys(module.components);
  if (componentKeys.length) {
    lines.push({ label: 'UI Hooks', value: componentKeys.map(humanize).join(', ') });
  }
  const hookKeys = Object.keys(module.hooks);
  if (hookKeys.length) {
    lines.push({ label: 'Lifecycle Hooks', value: hookKeys.map(humanize).join(', ') });
  }
  if (!lines.length && Object.keys(module.defaultConfig).length) {
    lines.push({ label: 'Default Settings', value: Object.keys(module.defaultConfig).map(humanize).join(', ') });
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

function isEnabledStatus(status: DerivedStatus) {
  return status === 'active' || status === 'required';
}
