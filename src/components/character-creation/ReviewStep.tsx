import { Pencil } from 'lucide-react';
import type { SystemDefinition, CustomFieldDefinition } from '@/types/system';
import type { CharacterDraft } from '@/pages/CharacterCreationWizardPage';

interface ReviewStepProps {
  draft: CharacterDraft;
  systemDef: SystemDefinition;
  onGoToStep: (stepId: string) => void;
  onUpdateCombat: (field: string, value: number) => void;
}

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

function computeModifier(formula: string | null, value: number): string | null {
  if (!formula) return null;
  if (formula === 'floor((value - 10) / 2)') {
    const mod = Math.floor((value - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
  return null;
}

function SectionHeader({ title, stepId, onEdit }: { title: string; stepId: string; onEdit: (id: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <p className={labelClass}>{title}</p>
      <button
        type="button"
        onClick={() => onEdit(stepId)}
        className="flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>
    </div>
  );
}

function renderIdentitySection(draft: CharacterDraft, systemDef: SystemDefinition, onEdit: (id: string) => void) {
  const { identity } = systemDef;
  return (
    <div className="space-y-2">
      <SectionHeader title="Identity" stepId="identity" onEdit={onEdit} />
      <div className="rounded-md border border-border bg-background/30 p-4">
        <p className="font-['IM_Fell_English'] text-lg text-foreground">{draft.name || 'Unnamed'}</p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {draft.ancestry && (
            <span>{identity.ancestry?.label}: {draft.ancestry}</span>
          )}
          {draft.charClass && (
            <span>{identity.class?.label}: {draft.charClass}</span>
          )}
          {draft.level != null && identity.level && (
            <span>Level {draft.level}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function renderStatsSection(draft: CharacterDraft, systemDef: SystemDefinition, onEdit: (id: string) => void) {
  if (systemDef.stats.length === 0) return null;

  const cols = systemDef.stats.length <= 6 ? 6 : systemDef.stats.length <= 9 ? 3 : 4;

  return (
    <div className="space-y-2">
      <SectionHeader
        title={systemDef.statModifierFormula ? 'Ability Scores' : 'Stats'}
        stepId="stats"
        onEdit={onEdit}
      />
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {systemDef.stats.map((stat) => {
          const val = draft.stats[stat.key] ?? stat.defaultValue;
          const mod = computeModifier(systemDef.statModifierFormula, val);
          return (
            <div
              key={stat.key}
              className="rounded-md border border-border bg-background/30 p-2 text-center"
            >
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                {stat.abbreviation}
              </span>
              <span className="block text-sm font-bold text-foreground">{val}</span>
              {mod && <span className="block text-xs text-primary">{mod}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderCustomFieldsSection(
  draft: CharacterDraft,
  systemDef: SystemDefinition,
  onEdit: (id: string) => void,
) {
  if (systemDef.customFields.length === 0) return null;

  const grouped = new Map<string, CustomFieldDefinition[]>();
  for (const field of systemDef.customFields) {
    if (!grouped.has(field.group)) grouped.set(field.group, []);
    grouped.get(field.group)!.push(field);
  }

  return (
    <div className="space-y-2">
      <SectionHeader title="System Details" stepId="custom" onEdit={onEdit} />
      <div className="rounded-md border border-border bg-background/30 p-4 space-y-3">
        {Array.from(grouped.entries()).map(([group, fields]) => (
          <div key={group}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{group}</p>
            <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
              {fields.map((field) => {
                const val = draft.systemData[field.key];
                let display: string;
                if (Array.isArray(val)) {
                  display = val.length > 0 ? val.join(', ') : '—';
                } else if (typeof val === 'boolean') {
                  display = val ? 'Yes' : 'No';
                } else if (val != null && val !== '') {
                  display = String(val);
                } else {
                  display = '—';
                }
                return (
                  <div key={field.key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{field.label}</span>
                    <span className="font-medium text-foreground">{display}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderDescriptionSection(draft: CharacterDraft, onEdit: (id: string) => void) {
  const hasContent = draft.appearance || draft.personality || draft.backstory;
  if (!hasContent) {
    return (
      <div className="space-y-2">
        <SectionHeader title="Description" stepId="description" onEdit={onEdit} />
        <p className="rounded-md border border-border bg-background/30 px-4 py-3 text-xs italic text-muted-foreground">
          No description provided
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <SectionHeader title="Description" stepId="description" onEdit={onEdit} />
      <div className="rounded-md border border-border bg-background/30 p-4 space-y-3">
        {draft.backstory && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Backstory</p>
            <p className="mt-0.5 text-xs text-foreground leading-relaxed">
              {draft.backstory.length > 300 ? draft.backstory.substring(0, 300) + '...' : draft.backstory}
            </p>
          </div>
        )}
        {draft.appearance && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Appearance</p>
            <p className="mt-0.5 text-xs text-foreground">{draft.appearance.substring(0, 150)}{draft.appearance.length > 150 ? '...' : ''}</p>
          </div>
        )}
        {draft.personality && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Personality</p>
            <p className="mt-0.5 text-xs text-foreground">{draft.personality.substring(0, 150)}{draft.personality.length > 150 ? '...' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function renderCombatDefaults(
  draft: CharacterDraft,
  systemDef: SystemDefinition,
  onUpdateCombat: (field: string, value: number) => void,
) {
  const { combat } = systemDef;
  const showAny = combat.hp || combat.ac || combat.speed;
  if (!showAny) return null;

  const acLabel =
    typeof combat.ac === 'object' ? combat.ac.label : 'Armor Class';

  return (
    <div className="space-y-2">
      <p className={labelClass}>Starting Combat Values</p>
      <div className="grid grid-cols-3 gap-3">
        {combat.hp && (
          <div>
            <label htmlFor="rev-hp" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Hit Points
            </label>
            <input
              id="rev-hp"
              type="number"
              min={1}
              value={draft.hpMax ?? 10}
              onChange={(e) => onUpdateCombat('hpMax', parseInt(e.target.value) || 1)}
              className={inputClass}
            />
          </div>
        )}
        {combat.ac && (
          <div>
            <label htmlFor="rev-ac" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              {acLabel}
            </label>
            <input
              id="rev-ac"
              type="number"
              min={0}
              value={draft.ac ?? 10}
              onChange={(e) => onUpdateCombat('ac', parseInt(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
        )}
        {combat.speed && (
          <div>
            <label htmlFor="rev-speed" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Speed
            </label>
            <input
              id="rev-speed"
              type="number"
              min={0}
              value={draft.speed ?? 30}
              onChange={(e) => onUpdateCombat('speed', parseInt(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function ReviewStep({ draft, systemDef, onGoToStep, onUpdateCombat }: ReviewStepProps) {
  return (
    <div className="space-y-5">
      {renderIdentitySection(draft, systemDef, onGoToStep)}
      <div className="divider-ornate" />
      {renderStatsSection(draft, systemDef, onGoToStep)}
      {systemDef.stats.length > 0 && <div className="divider-ornate" />}
      {renderCustomFieldsSection(draft, systemDef, onGoToStep)}
      {systemDef.customFields.length > 0 && <div className="divider-ornate" />}
      {renderDescriptionSection(draft, onGoToStep)}
      <div className="divider-ornate" />
      {renderCombatDefaults(draft, systemDef, onUpdateCombat)}
    </div>
  );
}
