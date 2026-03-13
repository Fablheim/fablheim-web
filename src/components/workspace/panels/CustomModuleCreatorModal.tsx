import { useState } from 'react';
import { X, Plus, Trash2, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useCreateCustomModule, useUpdateCustomModule } from '@/hooks/useCustomModules';
import type {
  CustomModule,
  CreateCustomModulePayload,
  CustomResourceDef,
  CustomConditionDef,
  CustomCharacterFieldDef,
  CustomRollTypeDef,
  HouseRuleDef,
} from '@/types/custom-module';

interface CustomModuleCreatorModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  existing?: CustomModule | null;
}

type Tab = 'resources' | 'conditions' | 'fields' | 'rolls' | 'rules';

const TAB_LABELS: Record<Tab, string> = {
  resources: 'Resources',
  conditions: 'Conditions',
  fields: 'Fields',
  rolls: 'Roll Types',
  rules: 'House Rules',
};

export function CustomModuleCreatorModal({
  open,
  onClose,
  campaignId,
  existing,
}: CustomModuleCreatorModalProps) {
  const create = useCreateCustomModule(campaignId);
  const update = useUpdateCustomModule(campaignId);

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [activeTab, setActiveTab] = useState<Tab>('resources');

  const [resources, setResources] = useState<CustomResourceDef[]>(existing?.resources ?? []);
  const [conditions, setConditions] = useState<CustomConditionDef[]>(existing?.conditions ?? []);
  const [characterFields, setCharacterFields] = useState<CustomCharacterFieldDef[]>(existing?.characterFields ?? []);
  const [rollTypes, setRollTypes] = useState<CustomRollTypeDef[]>(existing?.rollTypes ?? []);
  const [houseRules, setHouseRules] = useState<HouseRuleDef[]>(existing?.houseRules ?? []);

  if (!open) return null;

  const isPending = create.isPending || update.isPending;

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

    if (existing) {
      update.mutate(
        { id: existing._id, body: payload },
        {
          onSuccess: () => { toast.success('Module updated'); onClose(); },
          onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Update failed'),
        },
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => { toast.success('Module created'); onClose(); },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Create failed'),
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-border border-t-2 border-t-primary/50 bg-card shadow-warm-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-arcane" />
            <h2 className="font-[Cinzel] text-sm font-semibold uppercase tracking-wider text-foreground">
              {existing ? 'Edit Module' : 'Create Custom Module'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Name + Description */}
        <div className="space-y-2 border-b border-border px-5 py-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Module name"
            maxLength={100}
            className="w-full rounded border border-border bg-muted/30 px-3 py-1.5 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            maxLength={2000}
            rows={2}
            className="w-full rounded border border-border bg-muted/30 px-3 py-1.5 text-xs"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5">
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-[10px] font-[Cinzel] uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {activeTab === 'resources' && (
            <ResourcesForm resources={resources} onChange={setResources} />
          )}
          {activeTab === 'conditions' && (
            <ConditionsForm conditions={conditions} onChange={setConditions} />
          )}
          {activeTab === 'fields' && (
            <CharacterFieldsForm fields={characterFields} onChange={setCharacterFields} />
          )}
          {activeTab === 'rolls' && (
            <RollTypesForm rollTypes={rollTypes} onChange={setRollTypes} />
          )}
          {activeTab === 'rules' && (
            <HouseRulesForm houseRules={houseRules} onChange={setHouseRules} />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending || !name.trim()}>
            {isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            {existing ? 'Save Changes' : 'Create Module'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-form helper: auto-key from label ────────────────────

function toKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// ── Resources Sub-form ──────────────────────────────────────

function ResourcesForm({
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
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground">
        Define resource pools characters can track (e.g. Sanity Points, Luck Tokens).
      </p>
      {resources.map((r, i) => (
        <div key={i} className="flex items-center gap-2 rounded border border-border bg-muted/20 p-2">
          <input
            value={r.label}
            onChange={(e) => updateResource(i, { label: e.target.value })}
            placeholder="Label"
            className="flex-1 rounded border border-border bg-muted/30 px-2 py-1 text-xs"
          />
          <input
            type="number"
            value={r.max}
            onChange={(e) => updateResource(i, { max: parseInt(e.target.value, 10) || 1 })}
            min={1}
            max={100}
            className="w-14 rounded border border-border bg-muted/30 px-1.5 py-1 text-xs text-center"
          />
          <select
            value={r.rechargeOn ?? 'manual'}
            onChange={(e) => updateResource(i, { rechargeOn: e.target.value as CustomResourceDef['rechargeOn'] })}
            className="rounded border border-border bg-muted/30 px-1.5 py-1 text-xs"
          >
            <option value="manual">Manual</option>
            <option value="short-rest">Short Rest</option>
            <option value="long-rest">Long Rest</option>
          </select>
          <select
            value={r.display ?? 'dots'}
            onChange={(e) => updateResource(i, { display: e.target.value as CustomResourceDef['display'] })}
            className="rounded border border-border bg-muted/30 px-1.5 py-1 text-xs"
          >
            <option value="dots">Dots</option>
            <option value="number">Number</option>
            <option value="bar">Bar</option>
          </select>
          <button type="button" onClick={() => removeResource(i)} className="text-muted-foreground hover:text-blood">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addResource}
        className="flex items-center gap-1 text-[10px] text-arcane hover:text-arcane/80"
      >
        <Plus className="h-3 w-3" /> Add Resource
      </button>
    </div>
  );
}

// ── Conditions Sub-form ─────────────────────────────────────

function ConditionsForm({
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
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground">
        Define custom conditions characters can receive (e.g. Corrupted, Hexed).
      </p>
      {conditions.map((c, i) => (
        <div key={i} className="space-y-1 rounded border border-border bg-muted/20 p-2">
          <div className="flex items-center gap-2">
            <input
              value={c.label}
              onChange={(e) => updateCondition(i, { label: e.target.value })}
              placeholder="Label"
              className="flex-1 rounded border border-border bg-muted/30 px-2 py-1 text-xs"
            />
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <input
                type="checkbox"
                checked={c.hasValue ?? false}
                onChange={(e) => updateCondition(i, { hasValue: e.target.checked })}
              />
              Has Value
            </label>
            <button type="button" onClick={() => removeCondition(i)} className="text-muted-foreground hover:text-blood">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <input
            value={c.description}
            onChange={(e) => updateCondition(i, { description: e.target.value })}
            placeholder="Description"
            className="w-full rounded border border-border bg-muted/30 px-2 py-1 text-xs"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addCondition}
        className="flex items-center gap-1 text-[10px] text-arcane hover:text-arcane/80"
      >
        <Plus className="h-3 w-3" /> Add Condition
      </button>
    </div>
  );
}

// ── Character Fields Sub-form ───────────────────────────────

function CharacterFieldsForm({
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
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground">
        Add custom fields to character sheets (e.g. Sanity Score, Corruption Level).
      </p>
      {fields.map((f, i) => (
        <div key={i} className="flex items-center gap-2 rounded border border-border bg-muted/20 p-2">
          <input
            value={f.label}
            onChange={(e) => updateField(i, { label: e.target.value })}
            placeholder="Label"
            className="flex-1 rounded border border-border bg-muted/30 px-2 py-1 text-xs"
          />
          <select
            value={f.type}
            onChange={(e) => updateField(i, { type: e.target.value as CustomCharacterFieldDef['type'] })}
            className="rounded border border-border bg-muted/30 px-1.5 py-1 text-xs"
          >
            <option value="number">Number</option>
            <option value="text">Text</option>
            <option value="toggle">Toggle</option>
            <option value="select">Select</option>
            <option value="string-array">Tags</option>
          </select>
          <input
            value={f.group ?? ''}
            onChange={(e) => updateField(i, { group: e.target.value })}
            placeholder="Group"
            className="w-20 rounded border border-border bg-muted/30 px-1.5 py-1 text-xs"
          />
          <button type="button" onClick={() => removeField(i)} className="text-muted-foreground hover:text-blood">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addField}
        className="flex items-center gap-1 text-[10px] text-arcane hover:text-arcane/80"
      >
        <Plus className="h-3 w-3" /> Add Field
      </button>
    </div>
  );
}

// ── Roll Types Sub-form ─────────────────────────────────────

function RollTypesForm({
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
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground">
        Define custom roll types (e.g. Sanity Check: 1d20, Corruption Roll: 2d6).
      </p>
      {rollTypes.map((r, i) => (
        <div key={i} className="space-y-1 rounded border border-border bg-muted/20 p-2">
          <div className="flex items-center gap-2">
            <input
              value={r.label}
              onChange={(e) => updateRollType(i, { label: e.target.value })}
              placeholder="Label"
              className="flex-1 rounded border border-border bg-muted/30 px-2 py-1 text-xs"
            />
            <input
              value={r.dice}
              onChange={(e) => updateRollType(i, { dice: e.target.value })}
              placeholder="Dice (e.g. 1d20)"
              className="w-24 rounded border border-border bg-muted/30 px-1.5 py-1 text-xs"
            />
            <button type="button" onClick={() => removeRollType(i)} className="text-muted-foreground hover:text-blood">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <input
            value={r.description ?? ''}
            onChange={(e) => updateRollType(i, { description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full rounded border border-border bg-muted/30 px-2 py-1 text-xs"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addRollType}
        className="flex items-center gap-1 text-[10px] text-arcane hover:text-arcane/80"
      >
        <Plus className="h-3 w-3" /> Add Roll Type
      </button>
    </div>
  );
}

// ── House Rules Sub-form ────────────────────────────────────

function HouseRulesForm({
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
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground">
        Document house rules for your table. These are displayed in the session sidebar.
      </p>
      {houseRules.map((r, i) => (
        <div key={i} className="space-y-1 rounded border border-border bg-muted/20 p-2">
          <div className="flex items-center gap-2">
            <input
              value={r.title}
              onChange={(e) => updateRule(i, { title: e.target.value })}
              placeholder="Rule Title"
              className="flex-1 rounded border border-border bg-muted/30 px-2 py-1 text-xs"
            />
            <input
              value={r.category ?? ''}
              onChange={(e) => updateRule(i, { category: e.target.value })}
              placeholder="Category"
              className="w-24 rounded border border-border bg-muted/30 px-1.5 py-1 text-xs"
            />
            <button type="button" onClick={() => removeRule(i)} className="text-muted-foreground hover:text-blood">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <textarea
            value={r.description}
            onChange={(e) => updateRule(i, { description: e.target.value })}
            placeholder="Rule description"
            rows={2}
            className="w-full rounded border border-border bg-muted/30 px-2 py-1 text-xs"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addRule}
        className="flex items-center gap-1 text-[10px] text-arcane hover:text-arcane/80"
      >
        <Plus className="h-3 w-3" /> Add House Rule
      </button>
    </div>
  );
}
