import { useState } from 'react';
import { BookOpen, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { SRDLookupModal } from './SRDLookupModal';
import type { SystemDefinition } from '@/types/system';
import type { CharacterDraft } from '@/pages/CharacterCreationWizardPage';

interface IdentityStepProps {
  draft: CharacterDraft;
  systemDef: SystemDefinition;
  onUpdate: (field: string, value: unknown) => void;
  errors: Record<string, string>;
}

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

const errorClass = 'mt-1 text-xs text-red-400';

// Map system IDs to SRD category names for ancestry/race lookup
const ANCESTRY_CATEGORIES: Record<string, string> = {
  dnd5e: 'Races',
  daggerheart: 'ancestries',
};

const CLASS_CATEGORIES: Record<string, string> = {
  dnd5e: 'Classes',
  daggerheart: 'classes',
};

export function IdentityStep({ draft, systemDef, onUpdate, errors }: IdentityStepProps) {
  const [showAncestryLookup, setShowAncestryLookup] = useState(false);
  const [showClassLookup, setShowClassLookup] = useState(false);

  const { identity } = systemDef;
  const ancestryCategory = ANCESTRY_CATEGORIES[systemDef.id];
  const classCategory = CLASS_CATEGORIES[systemDef.id];

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="wiz-name" className={labelClass}>
          Character Name <span className="text-red-400">*</span>
        </label>
        <input
          id="wiz-name"
          type="text"
          required
          maxLength={50}
          value={draft.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder="Enter your character's name"
          className={`${inputClass} ${errors.name ? 'border-red-400' : ''}`}
        />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      <ImageUpload
        onFileSelect={(file) => onUpdate('portraitFile', file)}
        maxSizeMB={2}
        label="Portrait (Optional)"
        compact
      />

      {(identity.ancestry || identity.class) && (
        <div className={`grid gap-4 ${identity.ancestry && identity.class ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {identity.ancestry && (
            <div>
              <label htmlFor="wiz-ancestry" className={labelClass}>
                {identity.ancestry.label}
              </label>
              <div className="flex gap-2">
                <input
                  id="wiz-ancestry"
                  type="text"
                  maxLength={50}
                  value={draft.ancestry ?? ''}
                  onChange={(e) => onUpdate('ancestry', e.target.value)}
                  placeholder={identity.ancestry.placeholder}
                  className={`${inputClass} flex-1`}
                />
                {ancestryCategory && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAncestryLookup(true)}
                    className="mt-1 shrink-0"
                    title={`Browse ${identity.ancestry.label}`}
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
          {identity.class && (
            <div>
              <label htmlFor="wiz-class" className={labelClass}>
                {identity.class.label}
              </label>
              <div className="flex gap-2">
                <input
                  id="wiz-class"
                  type="text"
                  maxLength={50}
                  value={draft.charClass ?? ''}
                  onChange={(e) => onUpdate('charClass', e.target.value)}
                  placeholder={identity.class.placeholder}
                  className={`${inputClass} flex-1`}
                />
                {classCategory && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClassLookup(true)}
                    className="mt-1 shrink-0"
                    title={`Browse ${identity.class.label}`}
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {identity.level && (
        <div>
          <label htmlFor="wiz-level" className={labelClass}>
            Level
          </label>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdate('level', Math.max(identity.level!.min, (draft.level ?? identity.level!.min) - 1))
              }
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-input bg-input text-foreground transition-colors hover:bg-accent/50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              id="wiz-level"
              type="number"
              min={identity.level.min}
              max={identity.level.max}
              value={draft.level ?? identity.level.min}
              onChange={(e) => {
                const v = parseInt(e.target.value) || identity.level!.min;
                onUpdate('level', Math.max(identity.level!.min, Math.min(identity.level!.max, v)));
              }}
              className="w-16 rounded-sm border border-input bg-input px-2 py-1 text-center text-sm text-foreground input-carved font-[Cinzel]"
            />
            <button
              type="button"
              onClick={() =>
                onUpdate('level', Math.min(identity.level!.max, (draft.level ?? identity.level!.min) + 1))
              }
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-input bg-input text-foreground transition-colors hover:bg-accent/50"
            >
              <Plus className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground">
              ({identity.level.min}–{identity.level.max})
            </span>
          </div>
        </div>
      )}

      {ancestryCategory && identity.ancestry && (
        <SRDLookupModal
          open={showAncestryLookup}
          onClose={() => setShowAncestryLookup(false)}
          onSelect={(entry) => onUpdate('ancestry', entry)}
          system={systemDef.id}
          category={ancestryCategory}
          label={identity.ancestry.label + 's'}
        />
      )}
      {classCategory && identity.class && (
        <SRDLookupModal
          open={showClassLookup}
          onClose={() => setShowClassLookup(false)}
          onSelect={(entry) => onUpdate('charClass', entry)}
          system={systemDef.id}
          category={classCategory}
          label={identity.class.label + 'es'}
        />
      )}
    </div>
  );
}
