import type { CharacterDraft } from '@/pages/CharacterCreationWizardPage';

interface DescriptionStepProps {
  draft: CharacterDraft;
  onUpdate: (field: string, value: unknown) => void;
}

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

export function DescriptionStep({ draft, onUpdate }: DescriptionStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="wiz-appearance" className={labelClass}>
          Appearance
        </label>
        <textarea
          id="wiz-appearance"
          rows={3}
          maxLength={2000}
          value={draft.appearance ?? ''}
          onChange={(e) => onUpdate('appearance', e.target.value)}
          placeholder="Describe your character's physical appearance..."
          className={inputClass}
        />
        <p className="mt-1 text-right text-[10px] text-muted-foreground">
          {(draft.appearance?.length ?? 0)} / 2000
        </p>
      </div>

      <div>
        <label htmlFor="wiz-personality" className={labelClass}>
          Personality
        </label>
        <textarea
          id="wiz-personality"
          rows={3}
          maxLength={2000}
          value={draft.personality ?? ''}
          onChange={(e) => onUpdate('personality', e.target.value)}
          placeholder="Describe your character's personality traits, ideals, bonds, and flaws..."
          className={inputClass}
        />
        <p className="mt-1 text-right text-[10px] text-muted-foreground">
          {(draft.personality?.length ?? 0)} / 2000
        </p>
      </div>

      <div>
        <label htmlFor="wiz-backstory" className={labelClass}>
          Backstory
        </label>
        <textarea
          id="wiz-backstory"
          rows={5}
          maxLength={5000}
          value={draft.backstory ?? ''}
          onChange={(e) => onUpdate('backstory', e.target.value)}
          placeholder="Tell your character's story..."
          className={inputClass}
        />
        <p className="mt-1 text-right text-[10px] text-muted-foreground">
          {(draft.backstory?.length ?? 0)} / 5000
        </p>
      </div>
    </div>
  );
}
