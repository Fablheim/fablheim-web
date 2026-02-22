import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface CharacterDetailPageProps {
  characterId?: string;
}
import { useAuth } from '@/context/AuthContext';
import { useTabs } from '@/context/TabContext';
import { useCharacter, useUpdateCharacter, useDeleteCharacter } from '@/hooks/useCharacters';
import { resolveRouteContent } from '@/routes';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/layout/PageContainer';
import { EditableTextSection } from '@/components/characters/EditableTextSection';
import { CharacterFormModal } from '@/components/characters/CharacterFormModal';
import { DeleteCharacterModal } from '@/components/characters/DeleteCharacterModal';

// D&D 5e-specific ability score labels
// TODO: make system-aware when multi-system character sheets are implemented
const ABILITY_LABELS: Record<string, string> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
};

// D&D 5e modifier formula: (score - 10) / 2 rounded down
// TODO: other systems calculate modifiers differently
function getModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function CharacterDetailPage({ characterId }: CharacterDetailPageProps) {
  const params = useParams<{ id: string }>();
  const id = characterId ?? params.id;
  const { user } = useAuth();
  const { openTab } = useTabs();
  const { data: character, isLoading, error } = useCharacter(id!);
  const updateCharacter = useUpdateCharacter();
  const deleteCharacter = useDeleteCharacter();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isOwner = character?.userId === user?._id;

  function handleBack() {
    openTab({
      title: 'Characters',
      path: '/app/characters',
      content: resolveRouteContent('/app/characters', 'Characters'),
    });
  }

  function saveField(field: string, value: string) {
    if (!character) return;
    updateCharacter.mutate(
      {
        id: character._id,
        campaignId: character.campaignId,
        data: { [field]: value || undefined },
      },
      { onError: () => toast.error('Failed to save changes') },
    );
  }

  function saveMechanicField(field: string, value: string) {
    if (!character) return;
    updateCharacter.mutate(
      {
        id: character._id,
        campaignId: character.campaignId,
        data: {
          mechanicData: {
            ...character.mechanicData,
            [field]: value || undefined,
          },
        },
      },
      { onError: () => toast.error('Failed to save changes') },
    );
  }

  function confirmDelete() {
    if (!character) return;
    deleteCharacter.mutate(
      { id: character._id, campaignId: character.campaignId },
      {
        onSuccess: () => {
          setShowDeleteModal(false);
          handleBack();
        },
        onError: () => toast.error('Failed to delete character'),
      },
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error / not found
  if (error || !character) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-destructive/50 bg-card p-8 text-center">
          <p className="font-medium text-destructive">Failed to load character</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {(error as Error)?.message ?? 'Character not found'}
          </p>
          <Button variant="ghost" className="mt-4" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Characters
          </Button>
        </div>
      </PageContainer>
    );
  }

  const classRace = [character.race, character.class].filter(Boolean).join(' ') || 'Adventurer';
  const md = character.mechanicData ?? {};

  return (
    <PageContainer
      title={character.name}
      subtitle={classRace}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {isOwner && (
            <>
              <Button variant="secondary" onClick={() => setShowFormModal(true)}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit Stats
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-0 animate-unfurl">
        {/* ── Header Card ────────────────────────────────── */}
        <div className="rounded-lg border border-border bg-card p-6 tavern-card texture-parchment iron-brackets">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="font-['IM_Fell_English'] text-2xl text-card-foreground">
                {character.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{classRace}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-blood/60 bg-blood/90 font-[Cinzel] text-base font-bold text-parchment shadow-lg">
              {character.level}
            </div>
          </div>
        </div>

        {/* ── Ability Scores ─────────────────────────────── */}
        {character.stats && Object.keys(character.stats).length > 0 && (
          <>
            <div className="divider-ornate my-6" />
            <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
              Ability Scores
            </p>
            <div className="grid grid-cols-6 gap-3">
              {['str', 'dex', 'con', 'int', 'wis', 'cha'].map((stat) => {
                const val = character.stats?.[stat];
                if (val === undefined) return <div key={stat} />;
                return (
                  <div
                    key={stat}
                    className="flex flex-col items-center rounded-md bg-card p-3 texture-leather"
                  >
                    <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                      {ABILITY_LABELS[stat]}
                    </span>
                    <span className="mt-1 text-xl font-bold text-foreground">
                      {getModifier(val)}
                    </span>
                    <span className="text-xs text-muted-foreground">{val}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Passive Scores ─────────────────────────────── */}
        {character.passiveScores && (
          <>
            <div className="divider-ornate my-6" />
            <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
              Passive Scores
            </p>
            <div className="grid grid-cols-3 gap-3">
              {([
                ['Perception', character.passiveScores.perception],
                ['Insight', character.passiveScores.insight],
                ['Investigation', character.passiveScores.investigation],
              ] as const).map(([label, val]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-md bg-card px-4 py-3 texture-leather"
                >
                  <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                    {label}
                  </span>
                  <span className="text-base font-semibold text-foreground">{val}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Backstory ──────────────────────────────────── */}
        <div className="divider-ornate my-6" />
        <EditableTextSection
          label="Backstory"
          value={character.backstory ?? ''}
          onSave={(v) => saveField('backstory', v)}
          placeholder="Click to add backstory..."
          maxLength={20000}
          canEdit={isOwner}
        />

        {/* ── Personality & Traits ────────────────────────── */}
        <div className="divider-ornate my-6" />
        <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Personality & Traits
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <EditableTextSection
            label="Personality Traits"
            value={md.personalityTraits ?? ''}
            onSave={(v) => saveMechanicField('personalityTraits', v)}
            placeholder="Click to add personality traits..."
            maxLength={2000}
            canEdit={isOwner}
          />
          <EditableTextSection
            label="Ideals"
            value={md.ideals ?? ''}
            onSave={(v) => saveMechanicField('ideals', v)}
            placeholder="Click to add ideals..."
            maxLength={2000}
            canEdit={isOwner}
          />
          <EditableTextSection
            label="Bonds"
            value={md.bonds ?? ''}
            onSave={(v) => saveMechanicField('bonds', v)}
            placeholder="Click to add bonds..."
            maxLength={2000}
            canEdit={isOwner}
          />
          <EditableTextSection
            label="Flaws"
            value={md.flaws ?? ''}
            onSave={(v) => saveMechanicField('flaws', v)}
            placeholder="Click to add flaws..."
            maxLength={2000}
            canEdit={isOwner}
          />
        </div>

        {/* ── Appearance ─────────────────────────────────── */}
        <div className="divider-ornate my-6" />
        <EditableTextSection
          label="Appearance"
          value={md.appearance ?? ''}
          onSave={(v) => saveMechanicField('appearance', v)}
          placeholder="Click to describe appearance..."
          maxLength={5000}
          canEdit={isOwner}
        />

        {/* ── Notes ──────────────────────────────────────── */}
        <div className="divider-ornate my-6" />
        <EditableTextSection
          label="Notes"
          value={md.notes ?? ''}
          onSave={(v) => saveMechanicField('notes', v)}
          placeholder="Click to add notes..."
          maxLength={5000}
          canEdit={isOwner}
        />
      </div>

      {/* Modals */}
      <CharacterFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        campaignId={character.campaignId}
        character={character}
      />

      <DeleteCharacterModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        isPending={deleteCharacter.isPending}
        itemName={character.name}
        itemType="character"
      />
    </PageContainer>
  );
}
