import { useReducer, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCampaign } from '@/hooks/useCampaigns';
import { useSystemDefinition } from '@/hooks/useSystems';
import { useCreateCharacter } from '@/hooks/useCharacters';
import { useFileUpload } from '@/hooks/useFileUpload';
import { IdentityStep } from '@/components/character-creation/IdentityStep';
import { StatsStep } from '@/components/character-creation/StatsStep';
import { CustomFieldsStep } from '@/components/character-creation/CustomFieldsStep';
import { DescriptionStep } from '@/components/character-creation/DescriptionStep';
import { ReviewStep } from '@/components/character-creation/ReviewStep';
import type { SystemDefinition } from '@/types/system';
import type { Campaign } from '@/types/campaign';

// ── Types ─────────────────────────────────────────────────────────

export interface CharacterDraft {
  name: string;
  portraitFile: File | null;
  ancestry?: string;
  charClass?: string;
  level?: number;
  stats: Record<string, number>;
  systemData: Record<string, unknown>;
  appearance?: string;
  personality?: string;
  backstory?: string;
  hpMax?: number;
  ac?: number;
  speed?: number;
}

interface WizardState {
  draft: CharacterDraft;
  currentStepIndex: number;
  errors: Record<string, string>;
}

type WizardAction =
  | { type: 'UPDATE_FIELD'; field: string; value: unknown }
  | { type: 'UPDATE_STATS'; stats: Record<string, number> }
  | { type: 'UPDATE_SYSTEM_DATA'; key: string; value: unknown }
  | { type: 'UPDATE_COMBAT'; field: string; value: number }
  | { type: 'SET_STEP'; index: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'CLEAR_ERRORS' };

// ── Reducer ───────────────────────────────────────────────────────

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        draft: { ...state.draft, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: '' },
      };
    case 'UPDATE_STATS':
      return {
        ...state,
        draft: { ...state.draft, stats: action.stats },
        errors: { ...state.errors, stats: '' },
      };
    case 'UPDATE_SYSTEM_DATA':
      return {
        ...state,
        draft: {
          ...state.draft,
          systemData: { ...state.draft.systemData, [action.key]: action.value },
        },
      };
    case 'UPDATE_COMBAT':
      return {
        ...state,
        draft: { ...state.draft, [action.field]: action.value },
      };
    case 'SET_STEP':
      return { ...state, currentStepIndex: action.index, errors: {} };
    case 'NEXT_STEP':
      return { ...state, currentStepIndex: state.currentStepIndex + 1, errors: {} };
    case 'PREV_STEP':
      return { ...state, currentStepIndex: Math.max(0, state.currentStepIndex - 1), errors: {} };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'CLEAR_ERRORS':
      return { ...state, errors: {} };
    default:
      return state;
  }
}

// ── Helpers ───────────────────────────────────────────────────────

interface StepDef {
  id: string;
  title: string;
}

function buildSteps(systemDef: SystemDefinition): StepDef[] {
  const steps: StepDef[] = [{ id: 'identity', title: 'Identity' }];

  if (systemDef.stats.length > 0) {
    steps.push({ id: 'stats', title: 'Stats' });
  }

  if (systemDef.customFields.length > 0) {
    steps.push({ id: 'custom', title: 'Details' });
  }

  steps.push({ id: 'description', title: 'Description' });
  steps.push({ id: 'review', title: 'Review' });

  return steps;
}

function buildInitialDraft(systemDef: SystemDefinition): CharacterDraft {
  const stats: Record<string, number> = {};
  for (const stat of systemDef.stats) {
    stats[stat.key] = stat.defaultValue;
  }

  const systemData: Record<string, unknown> = {};
  for (const field of systemDef.customFields) {
    systemData[field.key] = field.defaultValue ?? (field.type === 'string-array' ? [] : '');
  }

  return {
    name: '',
    portraitFile: null,
    level: systemDef.identity.level?.min,
    stats,
    systemData,
    hpMax: 10,
    ac: 10,
    speed: 30,
  };
}

function validateStep(stepId: string, draft: CharacterDraft): Record<string, string> {
  const errors: Record<string, string> = {};

  if (stepId === 'identity') {
    if (!draft.name.trim()) {
      errors.name = 'Character name is required';
    } else if (draft.name.trim().length > 50) {
      errors.name = 'Name must be 50 characters or less';
    }
  }

  return errors;
}

// ── Progress Bar ──────────────────────────────────────────────────

function renderProgressBar(steps: StepDef[], currentIndex: number) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    isComplete
                      ? 'border-primary bg-primary/20 text-primary'
                      : isCurrent
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background/30 text-muted-foreground'
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`mt-1 hidden font-[Cinzel] text-[10px] uppercase tracking-wider sm:block ${
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-6 sm:w-12 ${
                    isComplete ? 'bg-primary/50' : 'bg-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step Renderer ─────────────────────────────────────────────────

function renderCurrentStep(
  stepId: string | undefined,
  draft: CharacterDraft,
  systemDef: SystemDefinition,
  errors: Record<string, string>,
  onUpdate: (field: string, value: unknown) => void,
  onUpdateStats: (stats: Record<string, number>) => void,
  onUpdateSystemData: (key: string, value: unknown) => void,
  onGoToStep: (stepId: string) => void,
  onUpdateCombat: (field: string, value: number) => void,
) {
  switch (stepId) {
    case 'identity':
      return <IdentityStep draft={draft} systemDef={systemDef} onUpdate={onUpdate} errors={errors} />;
    case 'stats':
      return <StatsStep draft={draft} systemDef={systemDef} onUpdateStats={onUpdateStats} errors={errors} />;
    case 'custom':
      return <CustomFieldsStep draft={draft} systemDef={systemDef} onUpdateSystemData={onUpdateSystemData} />;
    case 'description':
      return <DescriptionStep draft={draft} onUpdate={onUpdate} />;
    case 'review':
      return <ReviewStep draft={draft} systemDef={systemDef} onGoToStep={onGoToStep} onUpdateCombat={onUpdateCombat} />;
    default:
      return null;
  }
}

// ── Inner Wizard (mounted only when data is ready) ────────────────

function WizardContent({
  campaign,
  campaignId,
  systemDef,
}: {
  campaign: Campaign;
  campaignId: string;
  systemDef: SystemDefinition;
}) {
  const navigate = useNavigate();
  const createCharacter = useCreateCharacter();
  const { uploadPortrait } = useFileUpload();

  const steps = useMemo(() => buildSteps(systemDef), [systemDef]);

  const [state, dispatch] = useReducer(wizardReducer, null, () => ({
    draft: buildInitialDraft(systemDef),
    currentStepIndex: 0,
    errors: {},
  }));

  const { draft, currentStepIndex, errors } = state;
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleUpdate = useCallback((field: string, value: unknown) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  }, []);

  const handleUpdateStats = useCallback((stats: Record<string, number>) => {
    dispatch({ type: 'UPDATE_STATS', stats });
  }, []);

  const handleUpdateSystemData = useCallback((key: string, value: unknown) => {
    dispatch({ type: 'UPDATE_SYSTEM_DATA', key, value });
  }, []);

  const handleUpdateCombat = useCallback((field: string, value: number) => {
    dispatch({ type: 'UPDATE_COMBAT', field, value });
  }, []);

  const handleGoToStep = useCallback(
    (stepId: string) => {
      const idx = steps.findIndex((s) => s.id === stepId);
      if (idx >= 0) dispatch({ type: 'SET_STEP', index: idx });
    },
    [steps],
  );

  function handleNext() {
    if (!currentStep) return;
    const stepErrors = validateStep(currentStep.id, draft);
    if (Object.values(stepErrors).some(Boolean)) {
      dispatch({ type: 'SET_ERRORS', errors: stepErrors });
      return;
    }
    dispatch({ type: 'NEXT_STEP' });
  }

  function handleBack() {
    dispatch({ type: 'PREV_STEP' });
  }

  async function handleCreate() {
    const stepErrors = validateStep('identity', draft);
    if (Object.values(stepErrors).some(Boolean)) {
      toast.error('Please fix validation errors before creating');
      return;
    }

    let portrait: { url: string; key: string; filename: string; width: number; height: number } | undefined;
    if (draft.portraitFile) {
      try {
        const result = await uploadPortrait.mutateAsync(draft.portraitFile);
        portrait = {
          url: result.url,
          key: result.key,
          filename: result.filename,
          width: result.width ?? 0,
          height: result.height ?? 0,
        };
      } catch {
        toast.error('Portrait upload failed');
        return;
      }
    }

    const passiveScores =
      systemDef.passiveScores.length > 0
        ? { perception: 10, insight: 10, investigation: 10 }
        : undefined;

    const backstoryParts: string[] = [];
    if (draft.appearance) backstoryParts.push(`**Appearance:** ${draft.appearance}`);
    if (draft.personality) backstoryParts.push(`**Personality:** ${draft.personality}`);
    if (draft.backstory) backstoryParts.push(draft.backstory);
    const fullBackstory = backstoryParts.join('\n\n') || undefined;

    const payload = {
      campaignId,
      name: draft.name.trim(),
      race: draft.ancestry || undefined,
      class: draft.charClass || undefined,
      ...(systemDef.identity.level && draft.level != null ? { level: draft.level } : {}),
      stats: Object.keys(draft.stats).length > 0 ? draft.stats : undefined,
      ...(passiveScores ? { passiveScores } : {}),
      ...(Object.keys(draft.systemData).length > 0 ? { systemData: draft.systemData } : {}),
      backstory: fullBackstory,
      ...(portrait ? { portrait } : {}),
    };

    try {
      const created = await createCharacter.mutateAsync(payload);
      toast.success(`${draft.name} has been created!`);
      navigate(`/app/characters/${created._id}`);
    } catch {
      toast.error('Failed to create character');
    }
  }

  const isPending = createCharacter.isPending || uploadPortrait.isPending;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/app/campaigns/${campaignId}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {campaign.name}
        </button>
      </div>

      <div className="tavern-card iron-brackets texture-parchment rounded-lg border border-border border-t-2 border-t-brass/50 bg-card p-6 shadow-warm-lg sm:p-8">
        {renderWizardHeader(systemDef)}
        {renderProgressBar(steps, currentStepIndex)}

        <div className="mb-2 font-[Cinzel] text-xs uppercase tracking-wider text-primary">
          Step {currentStepIndex + 1} of {steps.length}: {currentStep?.title}
        </div>

        <div className="divider-ornate mb-5" />

        {renderCurrentStep(
          currentStep?.id, draft, systemDef, errors,
          handleUpdate, handleUpdateStats, handleUpdateSystemData,
          handleGoToStep, handleUpdateCombat,
        )}

        <div className="divider-ornate mt-6 mb-4" />

        {renderNavButtons(
          isFirstStep, isLastStep, isPending, draft.name,
          campaignId, handleBack, handleNext, handleCreate, navigate,
        )}
      </div>
    </div>
  );
}

function renderWizardHeader(systemDef: SystemDefinition) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Sparkles className="h-5 w-5 text-primary" />
      <h1 className="font-['IM_Fell_English'] text-2xl text-card-foreground">
        Create Character
      </h1>
      <span className="rounded-full border border-border bg-background/50 px-2.5 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
        {systemDef.name}
      </span>
    </div>
  );
}

function renderNavButtons(
  isFirstStep: boolean,
  isLastStep: boolean,
  isPending: boolean,
  name: string,
  campaignId: string,
  handleBack: () => void,
  handleNext: () => void,
  handleCreate: () => void,
  navigate: ReturnType<typeof useNavigate>,
) {
  return (
    <div className="flex justify-between">
      <Button
        type="button"
        variant="ghost"
        onClick={isFirstStep ? () => navigate(`/app/campaigns/${campaignId}`) : handleBack}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        {isFirstStep ? 'Cancel' : 'Back'}
      </Button>

      {isLastStep ? (
        <Button type="button" onClick={handleCreate} disabled={isPending || !name.trim()}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Check className="mr-1 h-4 w-4" />
              Create Character
            </>
          )}
        </Button>
      ) : (
        <Button type="button" onClick={handleNext}>
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// ── Outer Wrapper (handles loading) ───────────────────────────────

export function CharacterCreationWizardPage({ campaignId: propCampaignId }: { campaignId?: string }) {
  const params = useParams<{ campaignId: string }>();
  const campaignId = propCampaignId || params.campaignId || '';
  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId);
  const systemId = campaign?.system ?? 'dnd5e';
  const { data: systemDef, isLoading: systemLoading } = useSystemDefinition(systemId);

  if (campaignLoading || systemLoading || !systemDef) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-[Cinzel] text-sm text-muted-foreground">
            Loading character creation...
          </p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    );
  }

  return (
    <WizardContent
      key={systemId}
      campaign={campaign}
      campaignId={campaignId}
      systemDef={systemDef}
    />
  );
}

export default CharacterCreationWizardPage;
