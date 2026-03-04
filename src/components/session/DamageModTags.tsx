import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCombatRules, useUpdateInitiativeEntry } from '@/hooks/useLiveSession';
import { checkSystemDataSize, mergeSystemData } from '@/lib/system-data';
import type { InitiativeEntry } from '@/types/live-session';

type DamageModKey = 'resistances' | 'vulnerabilities' | 'immunities';

type NumericDamageRow = { type: string; value: number };

interface NumericDamageData {
  resistances?: NumericDamageRow[];
  weaknesses?: NumericDamageRow[];
  immunities?: string[];
  vulnerabilities?: string[];
}

interface DamageModTagsProps {
  campaignId: string;
  entry: InitiativeEntry;
  canEdit: boolean;
}

export function DamageModTags({ campaignId, entry, canEdit }: DamageModTagsProps) {
  const { data: rules } = useCombatRules(campaignId);
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const [nextByGroup, setNextByGroup] = useState<Record<DamageModKey, string>>({
    resistances: '',
    vulnerabilities: '',
    immunities: '',
  });

  const model = rules?.damageModel;

  const damageOptions = useMemo(
    () => model?.type !== 'abstract' ? model?.config.categories ?? [] : [],
    [model],
  );

  const numericDamage = useMemo<NumericDamageData>(
    () => ((entry.systemData?.damage ?? {}) as NumericDamageData),
    [entry.systemData?.damage],
  );

  if (!model || model.type === 'abstract') {
    return null;
  }

  function listFor(group: DamageModKey): string[] {
    return (entry[group] as string[] | undefined) ?? [];
  }

  function updateCategoricalGroup(group: DamageModKey, values: string[]) {
    updateEntry.mutate({
      entryId: entry.id,
      body: { [group]: values },
    });
  }

  function addCategoricalTag(group: DamageModKey) {
    const selected = nextByGroup[group];
    if (!selected) return;
    const current = listFor(group);
    if (current.includes(selected)) return;
    updateCategoricalGroup(group, [...current, selected]);
  }

  function removeCategoricalTag(group: DamageModKey, value: string) {
    updateCategoricalGroup(group, listFor(group).filter((v) => v !== value));
  }

  function updateNumericDamage(patch: Partial<NumericDamageData>) {
    const nextSystemData = mergeSystemData(entry.systemData, {
      damage: {
        ...numericDamage,
        ...patch,
      },
    });
    const size = checkSystemDataSize(nextSystemData);
    if (!size.ok) {
      toast.error(size.error ?? 'systemData is too large to save');
      return;
    }
    if (size.warning) {
      toast.warning(size.warning);
    }

    updateEntry.mutate({
      entryId: entry.id,
      body: { systemData: nextSystemData },
    });
  }

  if (model.type === 'categorical') {
    return (
      <div className="rounded border border-border/60 bg-background/25 p-2">
        <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">Damage Mods</p>
        <DamageGroup
          title="Resist"
          values={listFor('resistances')}
          tone="text-blue-300 border-blue-500/35 bg-blue-500/10"
          canEdit={canEdit}
          pending={updateEntry.isPending}
          options={damageOptions}
          nextValue={nextByGroup.resistances}
          onNextValueChange={(value) => setNextByGroup((prev) => ({ ...prev, resistances: value }))}
          onAdd={() => addCategoricalTag('resistances')}
          onRemove={(value) => removeCategoricalTag('resistances', value)}
        />
        <DamageGroup
          title="Vulnerable"
          values={listFor('vulnerabilities')}
          tone="text-amber-300 border-amber-500/35 bg-amber-500/10"
          canEdit={canEdit}
          pending={updateEntry.isPending}
          options={damageOptions}
          nextValue={nextByGroup.vulnerabilities}
          onNextValueChange={(value) => setNextByGroup((prev) => ({ ...prev, vulnerabilities: value }))}
          onAdd={() => addCategoricalTag('vulnerabilities')}
          onRemove={(value) => removeCategoricalTag('vulnerabilities', value)}
        />
        <DamageGroup
          title="Immune"
          values={listFor('immunities')}
          tone="text-zinc-300 border-zinc-500/35 bg-zinc-500/10"
          canEdit={canEdit}
          pending={updateEntry.isPending}
          options={damageOptions}
          nextValue={nextByGroup.immunities}
          onNextValueChange={(value) => setNextByGroup((prev) => ({ ...prev, immunities: value }))}
          onAdd={() => addCategoricalTag('immunities')}
          onRemove={(value) => removeCategoricalTag('immunities', value)}
        />
      </div>
    );
  }

  return (
    <div className="rounded border border-border/60 bg-background/25 p-2">
      <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">Numeric Damage Mods</p>

      <NumericRowsEditor
        title="Resistances"
        rows={numericDamage.resistances ?? []}
        canEdit={canEdit}
        pending={updateEntry.isPending}
        options={damageOptions}
        onChange={(rows) => updateNumericDamage({ resistances: rows })}
      />

      <NumericRowsEditor
        title="Weaknesses"
        rows={numericDamage.weaknesses ?? []}
        canEdit={canEdit}
        pending={updateEntry.isPending}
        options={damageOptions}
        onChange={(rows) => updateNumericDamage({ weaknesses: rows })}
      />

      <StringListEditor
        title="Immunities"
        values={numericDamage.immunities ?? []}
        canEdit={canEdit}
        pending={updateEntry.isPending}
        options={damageOptions}
        onChange={(values) => updateNumericDamage({ immunities: values })}
      />
    </div>
  );
}

function DamageGroup({
  title,
  values,
  tone,
  canEdit,
  pending,
  options,
  nextValue,
  onNextValueChange,
  onAdd,
  onRemove,
}: {
  title: string;
  values: string[];
  tone: string;
  canEdit: boolean;
  pending: boolean;
  options: Array<{ key: string; label: string }>;
  nextValue: string;
  onNextValueChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (value: string) => void;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mb-1 flex flex-wrap gap-1">
        {values.length === 0 && <span className="text-[10px] text-muted-foreground">None</span>}
        {values.map((value) => (
          <span key={value} className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${tone}`}>
            {value}
            {canEdit && (
              <button type="button" onClick={() => onRemove(value)} className="text-current/80 hover:text-current">
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      {canEdit && (
        <div className="flex gap-1">
          <select
            value={nextValue}
            onChange={(e) => onNextValueChange(e.target.value)}
            className="min-w-0 flex-1 rounded border border-input bg-input px-1.5 py-1 text-[10px] text-foreground"
            disabled={pending}
          >
            <option value="">Add type...</option>
            {options.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAdd}
            disabled={!nextValue || pending}
            className="rounded border border-border/60 px-1.5 py-1 text-[10px] text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

function NumericRowsEditor({
  title,
  rows,
  canEdit,
  pending,
  options,
  onChange,
}: {
  title: string;
  rows: NumericDamageRow[];
  canEdit: boolean;
  pending: boolean;
  options: Array<{ key: string; label: string }>;
  onChange: (rows: NumericDamageRow[]) => void;
}) {
  const [draftType, setDraftType] = useState('');
  const [draftValue, setDraftValue] = useState(1);

  function addRow() {
    if (!draftType) return;
    if (rows.some((row) => row.type === draftType)) return;
    onChange([...rows, { type: draftType, value: Math.max(1, Math.floor(draftValue || 1)) }]);
    setDraftType('');
    setDraftValue(1);
  }

  return (
    <div className="mb-2 last:mb-0">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-1">
        {rows.length === 0 && <span className="text-[10px] text-muted-foreground">None</span>}
        {rows.map((row) => (
          <div key={row.type} className="flex items-center gap-1">
            <span className="min-w-0 flex-1 truncate rounded border border-border/60 bg-background/30 px-2 py-1 text-[10px] text-foreground">
              {options.find((option) => option.key === row.type)?.label ?? row.type}
            </span>
            <input
              type="number"
              min={1}
              value={row.value}
              disabled={!canEdit || pending}
              onChange={(e) => {
                const value = Math.max(1, parseInt(e.target.value, 10) || 1);
                onChange(rows.map((item) => (item.type === row.type ? { ...item, value } : item)));
              }}
              className="w-16 rounded border border-input bg-input px-1.5 py-1 text-[10px] text-foreground"
            />
            {canEdit && (
              <button
                type="button"
                disabled={pending}
                onClick={() => onChange(rows.filter((item) => item.type !== row.type))}
                className="rounded border border-destructive/35 bg-destructive/10 px-1.5 py-1 text-[10px] text-destructive disabled:opacity-50"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="mt-1 flex gap-1">
          <select
            value={draftType}
            onChange={(e) => setDraftType(e.target.value)}
            className="min-w-0 flex-1 rounded border border-input bg-input px-1.5 py-1 text-[10px] text-foreground"
            disabled={pending}
          >
            <option value="">Add type...</option>
            {options.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={draftValue}
            onChange={(e) => setDraftValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-16 rounded border border-input bg-input px-1.5 py-1 text-[10px] text-foreground"
            disabled={pending}
          />
          <button
            type="button"
            onClick={addRow}
            disabled={!draftType || pending}
            className="rounded border border-border/60 px-1.5 py-1 text-[10px] text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

function StringListEditor({
  title,
  values,
  canEdit,
  pending,
  options,
  onChange,
}: {
  title: string;
  values: string[];
  canEdit: boolean;
  pending: boolean;
  options: Array<{ key: string; label: string }>;
  onChange: (values: string[]) => void;
}) {
  const [draftType, setDraftType] = useState('');

  function addValue() {
    if (!draftType || values.includes(draftType)) return;
    onChange([...values, draftType]);
    setDraftType('');
  }

  return (
    <div className="mb-2 last:mb-0">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mb-1 flex flex-wrap gap-1">
        {values.length === 0 && <span className="text-[10px] text-muted-foreground">None</span>}
        {values.map((value) => (
          <span key={value} className="inline-flex items-center gap-1 rounded border border-zinc-500/35 bg-zinc-500/10 px-1.5 py-0.5 text-[10px] text-zinc-300">
            {options.find((option) => option.key === value)?.label ?? value}
            {canEdit && (
              <button type="button" onClick={() => onChange(values.filter((v) => v !== value))}>
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      {canEdit && (
        <div className="flex gap-1">
          <select
            value={draftType}
            onChange={(e) => setDraftType(e.target.value)}
            className="min-w-0 flex-1 rounded border border-input bg-input px-1.5 py-1 text-[10px] text-foreground"
            disabled={pending}
          >
            <option value="">Add type...</option>
            {options.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addValue}
            disabled={!draftType || pending}
            className="rounded border border-border/60 px-1.5 py-1 text-[10px] text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
