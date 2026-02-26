import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { SystemDefinition, CustomFieldDefinition } from '@/types/system';
import type { CharacterDraft } from '@/pages/CharacterCreationWizardPage';

interface CustomFieldsStepProps {
  draft: CharacterDraft;
  systemDef: SystemDefinition;
  onUpdateSystemData: (key: string, value: unknown) => void;
}

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput('');
    }
  }

  function removeTag(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="mt-1 space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, i) => (
            <span
              key={i}
              className="flex items-center gap-1 rounded-full border border-border bg-background/50 px-2.5 py-0.5 text-xs text-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder ?? 'Type and press Enter'}
          className={inputClass}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!input.trim()}
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-input bg-input text-foreground transition-colors hover:bg-accent/50 disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function renderField(
  field: CustomFieldDefinition,
  value: unknown,
  onChange: (key: string, value: unknown) => void,
) {
  if (field.type === 'number') {
    return (
      <input
        id={`cf-${field.key}`}
        type="number"
        value={(value as number) ?? 0}
        onChange={(e) => onChange(field.key, parseInt(e.target.value) || 0)}
        className={inputClass}
      />
    );
  }
  if (field.type === 'textarea') {
    return (
      <textarea
        id={`cf-${field.key}`}
        rows={3}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={inputClass}
      />
    );
  }
  if (field.type === 'boolean') {
    return (
      <label className="mt-1 flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(field.key, e.target.checked)}
          className="rounded border-input"
        />
        {field.label}
      </label>
    );
  }
  if (field.type === 'string-array') {
    const items = Array.isArray(value) ? (value as string[]) : [];
    return (
      <TagInput
        value={items}
        onChange={(v) => onChange(field.key, v)}
        placeholder={`Add ${field.label.toLowerCase()}...`}
      />
    );
  }
  // text
  return (
    <input
      id={`cf-${field.key}`}
      type="text"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      className={inputClass}
    />
  );
}

export function CustomFieldsStep({ draft, systemDef, onUpdateSystemData }: CustomFieldsStepProps) {
  const grouped = new Map<string, CustomFieldDefinition[]>();
  for (const field of systemDef.customFields) {
    if (!grouped.has(field.group)) grouped.set(field.group, []);
    grouped.get(field.group)!.push(field);
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([group, fields]) => (
        <div key={group}>
          <div className="divider-ornate mb-3" />
          <p className={`${labelClass} mb-3`}>{group}</p>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                {field.type !== 'boolean' && (
                  <label htmlFor={`cf-${field.key}`} className={labelClass}>
                    {field.label}
                  </label>
                )}
                {renderField(field, draft.systemData[field.key], onUpdateSystemData)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
