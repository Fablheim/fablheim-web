import { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { shellPanelClass, innerPanelClass } from '@/lib/panel-styles';
import {
  useHomebrewContext,
  CATEGORY_LABELS,
  CATEGORY_BADGE_CLASSES,
  editorToContentPayload,
} from './HomebrewContext';
import type {
  HomebrewCategory,
  HomebrewTrait,
  HomebrewFeature,
} from './HomebrewContext';

// ── Style helpers ────────────────────────────────────────────────────────────

const panelClass = innerPanelClass;

const fieldClass =
  'w-full rounded-[16px] border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(42,72%,52%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)]';

const sectionLabelClass = 'text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]';

function actionButtonClass(emphasis = false) {
  return `inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
    emphasis
      ? 'border-[hsla(42,72%,52%,0.38)] bg-[linear-gradient(180deg,hsla(42,72%,56%,0.18)_0%,hsla(42,72%,38%,0.16)_100%)] text-[hsl(42,78%,80%)] hover:border-[hsla(42,72%,60%,0.46)]'
      : 'border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] text-[hsl(30,12%,62%)] hover:text-[hsl(38,24%,88%)]'
  }`;
}

const ABILITY_NAMES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;

// ── Editor state ─────────────────────────────────────────────────────────────

interface EditorState {
  name: string;
  category: HomebrewCategory;
  description: string;
  traits: HomebrewTrait[];
  proficiencies: string;
  abilityBonuses: Record<string, number>;
  features: HomebrewFeature[];
  prerequisites: string;
  notes: string;
  tags: string;
  aiContext: string;
}

function emptyEditor(): EditorState {
  return {
    name: '',
    category: 'race',
    description: '',
    traits: [],
    proficiencies: '',
    abilityBonuses: {},
    features: [],
    prerequisites: '',
    notes: '',
    tags: '',
    aiContext: '',
  };
}

// ── Main component ───────────────────────────────────────────────────────────

export function HomebrewDeskV2() {
  const {
    campaignId,
    isLoading,
    isCreating,
    setIsCreating,
    workspaceMode,
    setWorkspaceMode,
    selectedTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    startCreate,
    setSelectedTemplateId,
  } = useHomebrewContext();

  const [editor, setEditor] = useState<EditorState>(() => emptyEditor());
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-[hsl(30,14%,62%)]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] p-4 text-[hsl(38,24%,88%)]">
      <section className={`${shellPanelClass} min-h-0 flex-1 flex flex-col overflow-hidden`}>
        {renderShellHeader()}
        {renderShellBody()}
      </section>
    </div>
  );

  // ── Header ─────────────────────────────────────────────────────────────────

  function renderShellHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {renderHeaderLeft()}
          {renderHeaderActions()}
        </div>
        {renderHeaderBadges()}
      </div>
    );
  }

  function renderHeaderLeft() {
    const title = isCreating
      ? 'New Template'
      : workspaceMode === 'edit'
      ? `Editing: ${selectedTemplate?.name ?? ''}`
      : selectedTemplate?.name ?? 'Homebrew Vault';
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(30,14%,54%)]">
          Homebrew
        </p>
        <h2 className="mt-0.5 font-['IM_Fell_English'] text-[26px] leading-none text-[hsl(38,42%,90%)]">
          {title}
        </h2>
      </div>
    );
  }

  function renderHeaderActions() {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {renderNewButton()}
        {selectedTemplate && workspaceMode === 'view' && !isCreating && renderViewActions()}
      </div>
    );
  }

  function renderNewButton() {
    return (
      <button type="button" onClick={handleStartCreate} className={actionButtonClass(true)}>
        <Plus className="h-4 w-4" />
        New Template
      </button>
    );
  }

  function renderViewActions() {
    return (
      <>
        <button type="button" onClick={handleStartEdit} className={actionButtonClass()}>
          <Pencil className="h-4 w-4" />
          Edit
        </button>
        {renderDeleteButton()}
      </>
    );
  }

  function renderDeleteButton() {
    return (
      <button
        type="button"
        disabled={deleteTemplate.isPending}
        onClick={() => {
          if (confirmingDelete) {
            handleDelete();
          } else {
            setConfirmingDelete(true);
          }
        }}
        onBlur={() => setConfirmingDelete(false)}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
          confirmingDelete
            ? 'border-[hsla(0,60%,50%,0.46)] bg-[hsla(0,60%,40%,0.18)] text-[hsl(0,72%,72%)]'
            : 'border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] text-[hsl(30,12%,62%)] hover:text-red-400'
        }`}
      >
        {deleteTemplate.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {confirmingDelete ? 'Confirm?' : 'Delete'}
      </button>
    );
  }

  function renderHeaderBadges() {
    if (!selectedTemplate || isCreating || workspaceMode !== 'view') return null;
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${CATEGORY_BADGE_CLASSES[selectedTemplate.category]}`}>
          {CATEGORY_LABELS[selectedTemplate.category]}
        </span>
        {(selectedTemplate.tags ?? []).map((tag) => (
          <span key={tag} className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(30,12%,58%)]">
            {tag}
          </span>
        ))}
      </div>
    );
  }

  // ── Body ───────────────────────────────────────────────────────────────────

  function renderShellBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {isCreating || workspaceMode === 'edit'
          ? renderEditorForm()
          : selectedTemplate
          ? renderViewContent()
          : renderEmptyState()}
      </div>
    );
  }

  // ── View content ───────────────────────────────────────────────────────────

  function renderViewContent() {
    if (!selectedTemplate) return null;
    return (
      <div className="space-y-4">
        {renderViewTopSection()}
        {renderViewBottomSection()}
      </div>
    );
  }

  function renderViewTopSection() {
    if (!selectedTemplate) return null;
    return (
      <div className={`${panelClass} p-5`}>
        {selectedTemplate.description && (
          <div className="mb-5">
            <p className={sectionLabelClass}>Description</p>
            <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,72%)]">{selectedTemplate.description}</p>
          </div>
        )}
        {renderTraitsList()}
        {renderProficienciesList()}
      </div>
    );
  }

  function renderTraitsList() {
    if (!selectedTemplate || !selectedTemplate.traits?.length) return null;
    return (
      <div className="mb-5">
        <p className={sectionLabelClass}>Traits</p>
        <div className="mt-3 space-y-3">
          {selectedTemplate.traits.map((trait) => (
            <div key={trait.name} className="rounded-[18px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,10%,0.56)] p-4">
              <p className="font-[Cinzel] text-sm text-[hsl(38,32%,86%)]">{trait.name}</p>
              <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,62%)]">{trait.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderProficienciesList() {
    if (!selectedTemplate || !selectedTemplate.proficiencies?.length) return null;
    return (
      <div className="mb-5">
        <p className={sectionLabelClass}>Proficiencies</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedTemplate.proficiencies.map((prof) => (
            <span key={prof} className="rounded-full border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.62)] px-3 py-1 text-xs text-[hsl(38,24%,88%)]">
              {prof}
            </span>
          ))}
        </div>
      </div>
    );
  }

  function renderViewBottomSection() {
    if (!selectedTemplate) return null;
    return (
      <div className={`${panelClass} p-5`}>
        {renderAbilityBonuses()}
        {renderFeaturesList()}
        {renderPrerequisites()}
        {renderNotes()}
      </div>
    );
  }

  function renderAbilityBonuses() {
    if (!selectedTemplate) return null;
    const entries = Object.entries(selectedTemplate.abilityBonuses ?? {}).filter(([, v]) => v !== 0);
    if (entries.length === 0) return null;
    const display = entries.map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.toUpperCase()}`).join(', ');
    return (
      <div className="mb-5">
        <p className={sectionLabelClass}>Ability Bonuses</p>
        <p className="mt-2 text-sm text-[hsl(42,78%,78%)]">{display}</p>
      </div>
    );
  }

  function renderFeaturesList() {
    if (!selectedTemplate || !selectedTemplate.features?.length) return null;
    const sorted = [...selectedTemplate.features].sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
    return (
      <div className="mb-5">
        <p className={sectionLabelClass}>Features</p>
        <div className="mt-3 space-y-3">
          {sorted.map((feature) => (
            <div key={`${feature.name}-${feature.level ?? 0}`} className="rounded-[18px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,10%,0.56)] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-[Cinzel] text-sm text-[hsl(38,32%,86%)]">{feature.name}</p>
                {feature.level != null && (
                  <span className="shrink-0 rounded-full border border-[hsla(32,24%,24%,0.42)] px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-[hsl(212,24%,66%)]">
                    Lvl {feature.level}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,62%)]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderPrerequisites() {
    if (!selectedTemplate?.prerequisites) return null;
    return (
      <div className="mb-5">
        <p className={sectionLabelClass}>Prerequisites</p>
        <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,72%)]">{selectedTemplate.prerequisites}</p>
      </div>
    );
  }

  function renderNotes() {
    if (!selectedTemplate?.notes) return null;
    return (
      <div>
        <p className={sectionLabelClass}>Notes</p>
        <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,72%)]">{selectedTemplate.notes}</p>
      </div>
    );
  }

  // ── Editor form ────────────────────────────────────────────────────────────

  function renderEditorForm() {
    return (
      <div className="space-y-4">
        {renderEditorTopPanel()}
        {renderEditorBottomPanel()}
        {renderEditorFooter()}
      </div>
    );
  }

  function renderEditorTopPanel() {
    return (
      <div className={`${panelClass} p-5`}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {renderEditorCoreFields()}
          {renderEditorTraitsSection()}
        </div>
      </div>
    );
  }

  function renderEditorCoreFields() {
    return (
      <div className="space-y-4">
        <Field label="Name">
          <input
            value={editor.name}
            onChange={(e) => setEditor({ ...editor, name: e.target.value })}
            placeholder="Moonweaver Elf"
            className={fieldClass}
          />
        </Field>
        <Field label="Category">
          <select
            value={editor.category}
            onChange={(e) => setEditor({ ...editor, category: e.target.value as HomebrewCategory })}
            className={fieldClass}
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <textarea
            value={editor.description}
            onChange={(e) => setEditor({ ...editor, description: e.target.value })}
            className={`${fieldClass} min-h-[120px] resize-y`}
            placeholder="A brief overview of this homebrew option..."
          />
        </Field>
        <Field label="Proficiencies (comma-separated)">
          <input
            value={editor.proficiencies}
            onChange={(e) => setEditor({ ...editor, proficiencies: e.target.value })}
            placeholder="Perception, Stealth, Herbalism Kit"
            className={fieldClass}
          />
        </Field>
      </div>
    );
  }

  function renderEditorTraitsSection() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className={sectionLabelClass}>Traits</p>
          <button
            type="button"
            onClick={() => setEditor({ ...editor, traits: [...editor.traits, { name: '', description: '' }] })}
            className="rounded-full border border-[hsla(42,54%,46%,0.48)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[hsl(42,82%,78%)]"
          >
            Add Trait
          </button>
        </div>
        {editor.traits.length === 0 && (
          <p className="text-sm text-[hsl(30,12%,60%)]">No traits yet.</p>
        )}
        {editor.traits.map((trait, i) => renderTraitRow(trait, i))}
      </div>
    );
  }

  function renderTraitRow(trait: HomebrewTrait, index: number) {
    return (
      <div key={index} className="rounded-[18px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,10%,0.56)] p-3 space-y-2">
        <input
          value={trait.name}
          onChange={(e) => {
            const next = [...editor.traits];
            next[index] = { ...next[index], name: e.target.value };
            setEditor({ ...editor, traits: next });
          }}
          placeholder="Trait name"
          className={fieldClass}
        />
        <textarea
          value={trait.description}
          onChange={(e) => {
            const next = [...editor.traits];
            next[index] = { ...next[index], description: e.target.value };
            setEditor({ ...editor, traits: next });
          }}
          placeholder="Trait description"
          className={`${fieldClass} min-h-[60px] resize-y`}
        />
        <button
          type="button"
          onClick={() => setEditor({ ...editor, traits: editor.traits.filter((_, j) => j !== index) })}
          className="rounded-2xl border border-[hsla(0,48%,38%,0.38)] px-3 py-1 text-xs text-[hsl(8,70%,76%)]"
        >
          Remove
        </button>
      </div>
    );
  }

  function renderEditorBottomPanel() {
    return (
      <div className={`${panelClass} p-5`}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {renderEditorAbilities()}
          {renderEditorFeaturesSection()}
        </div>
        {renderEditorExtras()}
      </div>
    );
  }

  function renderEditorAbilities() {
    return (
      <div>
        <p className={sectionLabelClass}>Ability Bonuses</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {ABILITY_NAMES.map((ability) => (
            <div key={ability}>
              <label className="text-[9px] uppercase tracking-[0.14em] text-[hsl(30,12%,58%)]">{ability}</label>
              <input
                type="number"
                value={editor.abilityBonuses[ability] ?? 0}
                onChange={(e) =>
                  setEditor({
                    ...editor,
                    abilityBonuses: {
                      ...editor.abilityBonuses,
                      [ability]: Number.parseInt(e.target.value, 10) || 0,
                    },
                  })
                }
                className={`${fieldClass} mt-1`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderEditorFeaturesSection() {
    return (
      <div>
        <div className="flex items-center justify-between">
          <p className={sectionLabelClass}>Features</p>
          <button
            type="button"
            onClick={() => setEditor({ ...editor, features: [...editor.features, { name: '', description: '' }] })}
            className="rounded-full border border-[hsla(42,54%,46%,0.48)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[hsl(42,82%,78%)]"
          >
            Add Feature
          </button>
        </div>
        {editor.features.length === 0 && (
          <p className="mt-2 text-sm text-[hsl(30,12%,60%)]">No features yet.</p>
        )}
        {editor.features.map((feature, i) => renderFeatureRow(feature, i))}
      </div>
    );
  }

  function renderFeatureRow(feature: HomebrewFeature, index: number) {
    return (
      <div key={index} className="mt-2 rounded-[18px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,10%,0.56)] p-3 space-y-2">
        <div className="grid gap-2 grid-cols-[minmax(0,1fr)_80px]">
          <input
            value={feature.name}
            onChange={(e) => {
              const next = [...editor.features];
              next[index] = { ...next[index], name: e.target.value };
              setEditor({ ...editor, features: next });
            }}
            placeholder="Feature name"
            className={fieldClass}
          />
          <input
            type="number"
            value={feature.level ?? ''}
            onChange={(e) => {
              const next = [...editor.features];
              const lvl = e.target.value ? Number.parseInt(e.target.value, 10) : undefined;
              next[index] = { ...next[index], level: lvl };
              setEditor({ ...editor, features: next });
            }}
            placeholder="Lvl"
            className={fieldClass}
          />
        </div>
        <textarea
          value={feature.description}
          onChange={(e) => {
            const next = [...editor.features];
            next[index] = { ...next[index], description: e.target.value };
            setEditor({ ...editor, features: next });
          }}
          placeholder="Feature description"
          className={`${fieldClass} min-h-[60px] resize-y`}
        />
        <button
          type="button"
          onClick={() => setEditor({ ...editor, features: editor.features.filter((_, j) => j !== index) })}
          className="rounded-2xl border border-[hsla(0,48%,38%,0.38)] px-3 py-1 text-xs text-[hsl(8,70%,76%)]"
        >
          Remove
        </button>
      </div>
    );
  }

  function renderEditorExtras() {
    return (
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Field label="Prerequisites">
          <textarea
            value={editor.prerequisites}
            onChange={(e) => setEditor({ ...editor, prerequisites: e.target.value })}
            className={`${fieldClass} min-h-[80px] resize-y`}
            placeholder="Any requirements for this option..."
          />
        </Field>
        <Field label="Notes">
          <textarea
            value={editor.notes}
            onChange={(e) => setEditor({ ...editor, notes: e.target.value })}
            className={`${fieldClass} min-h-[80px] resize-y`}
            placeholder="GM notes, design intent, balance notes..."
          />
        </Field>
        <Field label="Tags (comma-separated)">
          <input
            value={editor.tags}
            onChange={(e) => setEditor({ ...editor, tags: e.target.value })}
            placeholder="fey, homebrew, custom"
            className={fieldClass}
          />
        </Field>
      </div>
    );
  }

  function renderEditorFooter() {
    const isPending = createTemplate.isPending || updateTemplate.isPending;
    return (
      <div className={`${panelClass} p-5`}>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={handleCancel} className={actionButtonClass()}>
            Cancel
          </button>
          <button
            type="button"
            onClick={workspaceMode === 'edit' ? handleSave : handleCreate}
            disabled={isPending}
            className={actionButtonClass(true)}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {workspaceMode === 'edit' ? 'Save Template' : 'Create Template'}
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  function renderEmptyState() {
    return (
      <div className={`${panelClass} flex min-h-[360px] items-center justify-center px-6 text-center`}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            No Template Selected
          </p>
          <h4 className="mt-3 font-['IM_Fell_English'] text-[32px] leading-none text-[hsl(38,42%,90%)]">
            Forge your own rules
          </h4>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[hsl(30,14%,58%)]">
            No template selected — create or select one from the shelf to browse
            custom races, classes, backgrounds, feats, and subclasses.
          </p>
          <button
            type="button"
            onClick={handleStartCreate}
            className={`${actionButtonClass(true)} mt-6`}
          >
            <Plus className="h-4 w-4" />
            Create Template
          </button>
        </div>
      </div>
    );
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function buildPayload() {
    const proficiencies = editor.proficiencies
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const tags = editor.tags
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return editorToContentPayload(
      editor.name.trim(),
      editor.category,
      editor.description.trim(),
      editor.traits.filter((t) => t.name.trim()),
      proficiencies,
      editor.abilityBonuses,
      editor.features.filter((f) => f.name.trim()),
      editor.prerequisites.trim(),
      editor.notes.trim(),
      tags,
      editor.aiContext.trim() || undefined,
    );
  }

  function handleStartCreate() {
    setEditor(emptyEditor());
    startCreate();
  }

  function handleStartEdit() {
    if (!selectedTemplate) return;
    setEditor({
      name: selectedTemplate.name,
      category: selectedTemplate.category,
      description: selectedTemplate.description ?? '',
      traits: selectedTemplate.traits?.map((t) => ({ ...t })) ?? [],
      proficiencies: (selectedTemplate.proficiencies ?? []).join(', '),
      abilityBonuses: { ...(selectedTemplate.abilityBonuses ?? {}) },
      features: selectedTemplate.features?.map((f) => ({ ...f })) ?? [],
      prerequisites: selectedTemplate.prerequisites ?? '',
      notes: selectedTemplate.notes ?? '',
      tags: (selectedTemplate.tags ?? []).join(', '),
      aiContext: selectedTemplate.aiContext ?? '',
    });
    setWorkspaceMode('edit');
  }

  function handleCancel() {
    if (isCreating) {
      setIsCreating(false);
    }
    setWorkspaceMode('view');
  }

  async function handleCreate() {
    if (!editor.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    try {
      const created = await createTemplate.mutateAsync({
        campaignId,
        data: buildPayload(),
      });
      setIsCreating(false);
      setWorkspaceMode('view');
      setSelectedTemplateId(created._id);
      toast.success('Homebrew template created');
    } catch {
      toast.error('Failed to create template');
    }
  }

  async function handleSave() {
    if (!selectedTemplate || !editor.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    try {
      await updateTemplate.mutateAsync({
        campaignId,
        id: selectedTemplate._id,
        data: buildPayload(),
      });
      setWorkspaceMode('view');
      toast.success('Homebrew template updated');
    } catch {
      toast.error('Failed to update template');
    }
  }

  async function handleDelete() {
    if (!selectedTemplate) return;
    try {
      await deleteTemplate.mutateAsync({ campaignId, id: selectedTemplate._id });
      setSelectedTemplateId(null);
      setConfirmingDelete(false);
      toast.success(`Template "${selectedTemplate.name}" deleted`);
    } catch {
      toast.error('Failed to delete template');
    }
  }
}

// ── Field ────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
        {label}
      </span>
      {children}
    </label>
  );
}
