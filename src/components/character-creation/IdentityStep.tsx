import { useState } from 'react';
import { BookOpen, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { ContentBrowser } from '@/components/content/ContentBrowser';
import type { SystemDefinition } from '@/types/system';
import type { CharacterDraft } from '@/pages/CharacterCreationWizardPage';

interface IdentityStepProps {
  draft: CharacterDraft;
  systemDef: SystemDefinition;
  campaignId?: string;
  onUpdate: (field: string, value: unknown) => void;
  errors: Record<string, string>;
}

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

const errorClass = 'mt-1 text-xs text-red-400';

// Map content type names for the ContentBrowser
const ANCESTRY_CONTENT_TYPE: Record<string, string> = {
  dnd5e: 'race',
  daggerheart: 'race',
};

const CLASS_CONTENT_TYPE: Record<string, string> = {
  dnd5e: 'class',
  daggerheart: 'class',
};

export function IdentityStep({ draft, systemDef, campaignId, onUpdate, errors }: IdentityStepProps) {
  const [showAncestryLookup, setShowAncestryLookup] = useState(false);
  const [showClassLookup, setShowClassLookup] = useState(false);

  const { identity } = systemDef;
  const ancestryContentType = ANCESTRY_CONTENT_TYPE[systemDef.id];
  const classContentType = CLASS_CONTENT_TYPE[systemDef.id];

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

      {renderAncestryAndClass(
        identity, draft, systemDef, campaignId,
        ancestryContentType, classContentType,
        showAncestryLookup, setShowAncestryLookup,
        showClassLookup, setShowClassLookup,
        onUpdate,
      )}

      {renderLevelControl(identity, draft, onUpdate)}
    </div>
  );
}

function renderAncestryAndClass(
  identity: SystemDefinition['identity'],
  draft: CharacterDraft,
  systemDef: SystemDefinition,
  campaignId: string | undefined,
  ancestryContentType: string | undefined,
  classContentType: string | undefined,
  showAncestryLookup: boolean,
  setShowAncestryLookup: (v: boolean) => void,
  showClassLookup: boolean,
  setShowClassLookup: (v: boolean) => void,
  onUpdate: (field: string, value: unknown) => void,
) {
  if (!identity.ancestry && !identity.class) return null;

  return (
    <>
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
              {ancestryContentType && (
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
              {classContentType && (
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

      {ancestryContentType && identity.ancestry && (
        <ContentBrowser
          open={showAncestryLookup}
          onClose={() => setShowAncestryLookup(false)}
          onSelect={(entry) => {
            onUpdate('ancestry', entry.name);
            onUpdate('raceContentId', entry.contentId);
          }}
          contentType={ancestryContentType}
          system={systemDef.id}
          campaignId={campaignId}
          label={identity.ancestry.label + 's'}
        />
      )}
      {classContentType && identity.class && (
        <ContentBrowser
          open={showClassLookup}
          onClose={() => setShowClassLookup(false)}
          onSelect={(entry) => {
            onUpdate('charClass', entry.name);
            onUpdate('classContentId', entry.contentId);
          }}
          contentType={classContentType}
          system={systemDef.id}
          campaignId={campaignId}
          label={identity.class.label + 'es'}
        />
      )}
    </>
  );
}

function renderLevelControl(
  identity: SystemDefinition['identity'],
  draft: CharacterDraft,
  onUpdate: (field: string, value: unknown) => void,
) {
  if (!identity.level) return null;

  const levelDef = identity.level;

  return (
    <div>
      <label htmlFor="wiz-level" className={labelClass}>
        Level
      </label>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            onUpdate('level', Math.max(levelDef.min, (draft.level ?? levelDef.min) - 1))
          }
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-input bg-input text-foreground transition-colors hover:bg-accent/50"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          id="wiz-level"
          type="number"
          min={levelDef.min}
          max={levelDef.max}
          value={draft.level ?? levelDef.min}
          onChange={(e) => {
            const v = parseInt(e.target.value) || levelDef.min;
            onUpdate('level', Math.max(levelDef.min, Math.min(levelDef.max, v)));
          }}
          className="w-16 rounded-sm border border-input bg-input px-2 py-1 text-center text-sm text-foreground input-carved font-[Cinzel]"
        />
        <button
          type="button"
          onClick={() =>
            onUpdate('level', Math.min(levelDef.max, (draft.level ?? levelDef.min) + 1))
          }
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-input bg-input text-foreground transition-colors hover:bg-accent/50"
        >
          <Plus className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground">
          ({levelDef.min}–{levelDef.max})
        </span>
      </div>
    </div>
  );
}
