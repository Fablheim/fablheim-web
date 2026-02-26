import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, Trash2, Dice5 } from 'lucide-react';
import { toast } from 'sonner';

interface CharacterDetailPageProps {
  characterId?: string;
}
import { useAuth } from '@/context/AuthContext';
import { useTabs } from '@/context/TabContext';
import { useCharacter, useUpdateCharacter, useDeleteCharacter } from '@/hooks/useCharacters';
import { useCampaign } from '@/hooks/useCampaigns';
import { useSystemDefinition } from '@/hooks/useSystems';
import {
  useTakeDamage,
  useHeal,
  useAddTempHP,
  useRollDeathSave,
  useConsumeSpellSlot,
  useRestoreSpellSlot,
  useRollAttack,
  useRollAbility,
} from '@/hooks/useCharacterCombat';
import { resolveRouteContent } from '@/routes';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/layout/PageContainer';
import { EditableTextSection } from '@/components/characters/EditableTextSection';
import { CharacterFormModal } from '@/components/characters/CharacterFormModal';
import { DeleteCharacterModal } from '@/components/characters/DeleteCharacterModal';
import { HPTracker } from '@/components/characters/HPTracker';
import { CombatStats } from '@/components/characters/CombatStats';
import { SpellSlots } from '@/components/characters/SpellSlots';
import { XPTracker } from '@/components/character/progression/XPTracker';
import { InventoryPanel } from '@/components/character/inventory/InventoryPanel';
import { SpellBook } from '@/components/character/spells/SpellBook';
import type { Character, AbilityRollResult } from '@/types/campaign';

function computeModifier(value: number, formula: string | null): string | null {
  if (!formula) return null;
  if (formula === 'floor((value - 10) / 2)') {
    const mod = Math.floor((value - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
  return null;
}

export function CharacterDetailPage({ characterId }: CharacterDetailPageProps) {
  const params = useParams<{ id: string }>();
  const id = characterId ?? params.id;
  const { user } = useAuth();
  const { openTab } = useTabs();
  const { data: character, isLoading, error } = useCharacter(id!);
  const { data: campaign } = useCampaign(character?.campaignId ?? '');
  const { data: systemDef } = useSystemDefinition(campaign?.system ?? 'dnd5e');
  const updateCharacter = useUpdateCharacter();
  const deleteCharacter = useDeleteCharacter();

  // Combat mutations
  const takeDamage = useTakeDamage();
  const heal = useHeal();
  const addTempHP = useAddTempHP();
  const rollDeathSave = useRollDeathSave();
  const consumeSpellSlot = useConsumeSpellSlot();
  const restoreSpellSlot = useRestoreSpellSlot();
  const rollAttackMutation = useRollAttack();
  const rollAbilityMutation = useRollAbility();

  const [showFormModal, setShowFormModal] = useState(false);
  const [abilityRollResult, setAbilityRollResult] = useState<AbilityRollResult | null>(null);
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
        {renderHeaderAndCombat(character, isOwner)}
        {renderAbilityScores(character)}
        {renderCharacterDepth(character, isOwner)}
        {renderRPSections(character, isOwner, saveField, saveMechanicField)}
      </div>

      {/* Modals */}
      <CharacterFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        campaignId={character.campaignId}
        character={character}
        campaignSystem={campaign?.system}
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

  // ── Render helpers (avoid TS 5.9 JSX children inference bug) ──

  function renderHeaderAndCombat(char: Character, canEdit: boolean) {
    return (
      <>
        {/* ── Header Card ────────────────────────────────── */}
        <div className="rounded-lg border border-border bg-card p-6 tavern-card texture-parchment iron-brackets">
          <div className="flex items-start gap-4">
            {char.portrait?.url ? (
              <img
                src={char.portrait.url}
                alt={`${char.name} portrait`}
                className="h-20 w-20 shrink-0 rounded-lg border-2 border-brass/40 object-cover shadow-warm"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-border/60 bg-accent/30 font-[Cinzel] text-2xl text-muted-foreground/50">
                {char.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-['IM_Fell_English'] text-2xl text-card-foreground">
                {char.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {[char.race, char.class].filter(Boolean).join(' ') || 'Adventurer'}
              </p>
            </div>
            {char.level != null && (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-blood/60 bg-blood/90 font-[Cinzel] text-base font-bold text-parchment shadow-lg">
                {char.level}
              </div>
            )}
          </div>
        </div>

        {/* ── HP Tracker (only for systems with HP) ──────── */}
        {(!systemDef || systemDef.combat.hp) && (
          <>
            <div className="divider-ornate my-6" />
            <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
              Hit Points
            </p>
            <HPTracker
              character={char}
              onDamage={(amount) =>
                takeDamage.mutate(
                  { id: char._id, amount },
                  { onError: () => toast.error('Failed to apply damage') },
                )
              }
              onHeal={(amount) =>
                heal.mutate(
                  { id: char._id, amount },
                  { onError: () => toast.error('Failed to heal') },
                )
              }
              onTempHP={(amount) =>
                addTempHP.mutate(
                  { id: char._id, amount },
                  { onError: () => toast.error('Failed to add temp HP') },
                )
              }
              onDeathSave={(result) =>
                rollDeathSave.mutate(
                  { id: char._id, result },
                  { onError: () => toast.error('Failed to roll death save') },
                )
              }
              editable={canEdit}
              showDeathSaves={!systemDef || systemDef.combat.deathSaves}
            />
          </>
        )}

        {/* ── Combat Stats (conditional per system) ──────── */}
        {(!systemDef || systemDef.combat.ac || systemDef.combat.speed || systemDef.combat.initiative || systemDef.combat.attacks) && (
          <>
            <div className="divider-ornate my-6" />
            <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
              Combat
            </p>
            <CombatStats
              character={char}
              editable={canEdit}
              onRollAttack={(attackId) =>
                rollAttackMutation.mutateAsync({
                  id: char._id,
                  attackId,
                  campaignId: char.campaignId,
                })
              }
              combatConfig={systemDef?.combat}
            />
          </>
        )}

        {/* ── Spell Slots (only for systems with spell slots) ── */}
        {(!systemDef || systemDef.combat.spellSlots) && char.spellSlots && (
          <>
            <div className="divider-ornate my-6" />
            <SpellSlots
              spellSlots={char.spellSlots}
              onConsume={(level) =>
                consumeSpellSlot.mutate(
                  { id: char._id, level },
                  { onError: () => toast.error('Failed to use spell slot') },
                )
              }
              onRestore={(level) =>
                restoreSpellSlot.mutate(
                  { id: char._id, level },
                  { onError: () => toast.error('Failed to restore spell slot') },
                )
              }
              editable={canEdit}
            />
          </>
        )}
      </>
    );
  }

  function handleAbilityRoll(char: Character, ability: string, type: 'check' | 'save') {
    rollAbilityMutation.mutate(
      { id: char._id, ability, type, campaignId: char.campaignId },
      {
        onSuccess: (res) => setAbilityRollResult(res),
        onError: () => toast.error('Failed to roll'),
      },
    );
  }

  function renderAbilityScores(char: Character) {
    // Build stat keys and labels from system definition or fall back to character data
    const statKeys = systemDef ? systemDef.stats.map((s) => s.key) : Object.keys(char.stats ?? {});
    const statLabels: Record<string, string> = {};
    if (systemDef) {
      for (const s of systemDef.stats) statLabels[s.key] = s.abbreviation;
    }
    const formula = systemDef?.statModifierFormula ?? null;
    const cols = statKeys.length <= 6 ? 6 : statKeys.length <= 9 ? statKeys.length : 6;

    // Passive scores from system definition or fall back
    const hasPassives = systemDef ? systemDef.passiveScores.length > 0 : !!char.passiveScores;
    const passiveEntries = systemDef
      ? systemDef.passiveScores.map((p) => [p.label, (char.passiveScores as Record<string, number> | undefined)?.[p.key]] as const)
      : char.passiveScores
        ? Object.entries(char.passiveScores).map(([k, v]) => [k, v] as const)
        : [];

    return (
      <>
        {/* ── Stats ─────────────────────────────────────── */}
        {char.stats && Object.keys(char.stats).length > 0 && (
          <>
            <div className="divider-ornate my-6" />
            <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
              {systemDef ? 'Stats' : 'Ability Scores'}
            </p>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {statKeys.map((stat) => {
                const val = char.stats?.[stat];
                if (val === undefined) return <div key={stat} />;
                const mod = computeModifier(val, formula);
                const label = statLabels[stat] || stat.toUpperCase();
                return (
                  <div
                    key={stat}
                    className="flex flex-col items-center rounded-md bg-card p-3 texture-leather"
                  >
                    <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                      {label}
                    </span>
                    {mod ? (
                      <>
                        <span className="mt-1 text-xl font-bold text-foreground">{mod}</span>
                        <span className="text-xs text-muted-foreground">{val}</span>
                      </>
                    ) : (
                      <span className="mt-1 text-xl font-bold text-foreground">{val}</span>
                    )}
                    {isOwner && (
                      <div className="mt-1.5 flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleAbilityRoll(char, stat, 'check')}
                          disabled={rollAbilityMutation.isPending}
                          className="rounded px-1.5 py-0.5 text-[10px] border border-brass/30 bg-brass/10 text-brass hover:bg-brass/20 disabled:opacity-50 transition-colors"
                          title={`${label} Check`}
                        >
                          CHK
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAbilityRoll(char, stat, 'save')}
                          disabled={rollAbilityMutation.isPending}
                          className="rounded px-1.5 py-0.5 text-[10px] border border-brass/30 bg-brass/10 text-brass hover:bg-brass/20 disabled:opacity-50 transition-colors"
                          title={`${label} Save`}
                        >
                          SAV
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Ability Roll Result */}
            {abilityRollResult && (
              <div className="mt-3 rounded-md border border-border bg-card/50 px-4 py-2.5">
                <AbilityRollDisplay result={abilityRollResult} onDismiss={() => setAbilityRollResult(null)} />
              </div>
            )}
          </>
        )}

        {/* ── Passive Scores (only if system has them) ──── */}
        {hasPassives && passiveEntries.length > 0 && (
          <>
            <div className="divider-ornate my-6" />
            <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
              Passive Scores
            </p>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(passiveEntries.length, 3)}, minmax(0, 1fr))` }}>
              {passiveEntries.map(([label, val]) => (
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
      </>
    );
  }

  function renderCharacterDepth(char: Character, canEdit: boolean) {
    const isDM = campaign?.dmId === user?._id;
    return (
      <>
        {/* ── XP & Progression ──────────────────────────── */}
        <div className="divider-ornate my-6" />
        <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Progression
        </p>
        <XPTracker characterId={char._id} isDM={isDM || canEdit} />

        {/* ── Inventory ─────────────────────────────────── */}
        <div className="divider-ornate my-6" />
        <InventoryPanel character={char} campaignId={char.campaignId} />

        {renderSpellBookSection(char)}
      </>
    );
  }

  function renderSpellBookSection(char: Character) {
    if (systemDef && !systemDef.combat.spellSlots) return null;
    return (
      <>
        <div className="divider-ornate my-6" />
        <SpellBook character={char} campaignId={char.campaignId} />
      </>
    );
  }

  function renderRPSections(
    char: Character,
    canEdit: boolean,
    onSaveField: (field: string, value: string) => void,
    onSaveMechanicField: (field: string, value: string) => void,
  ) {
    const md = char.mechanicData ?? {};
    return (
      <>
        {/* ── Backstory ──────────────────────────────────── */}
        <div className="divider-ornate my-6" />
        <EditableTextSection
          label="Backstory"
          value={char.backstory ?? ''}
          onSave={(v) => onSaveField('backstory', v)}
          placeholder="Click to add backstory..."
          maxLength={20000}
          canEdit={canEdit}
        />

        {renderTraitsAndNotes(md, canEdit, onSaveMechanicField)}
      </>
    );
  }

  function renderTraitsAndNotes(
    md: Record<string, any>,
    canEdit: boolean,
    onSave: (field: string, value: string) => void,
  ) {
    return (
      <>
        {/* ── Personality & Traits ────────────────────────── */}
        <div className="divider-ornate my-6" />
        <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Personality & Traits
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <EditableTextSection
            label="Personality Traits"
            value={md.personalityTraits ?? ''}
            onSave={(v) => onSave('personalityTraits', v)}
            placeholder="Click to add personality traits..."
            maxLength={2000}
            canEdit={canEdit}
          />
          <EditableTextSection
            label="Ideals"
            value={md.ideals ?? ''}
            onSave={(v) => onSave('ideals', v)}
            placeholder="Click to add ideals..."
            maxLength={2000}
            canEdit={canEdit}
          />
          <EditableTextSection
            label="Bonds"
            value={md.bonds ?? ''}
            onSave={(v) => onSave('bonds', v)}
            placeholder="Click to add bonds..."
            maxLength={2000}
            canEdit={canEdit}
          />
          <EditableTextSection
            label="Flaws"
            value={md.flaws ?? ''}
            onSave={(v) => onSave('flaws', v)}
            placeholder="Click to add flaws..."
            maxLength={2000}
            canEdit={canEdit}
          />
        </div>

        {/* ── Appearance ─────────────────────────────────── */}
        <div className="divider-ornate my-6" />
        <EditableTextSection
          label="Appearance"
          value={md.appearance ?? ''}
          onSave={(v) => onSave('appearance', v)}
          placeholder="Click to describe appearance..."
          maxLength={5000}
          canEdit={canEdit}
        />

        {/* ── Notes ──────────────────────────────────────── */}
        <div className="divider-ornate my-6" />
        <EditableTextSection
          label="Notes"
          value={md.notes ?? ''}
          onSave={(v) => onSave('notes', v)}
          placeholder="Click to add notes..."
          maxLength={5000}
          canEdit={canEdit}
        />
      </>
    );
  }
}

function AbilityRollDisplay({
  result,
  onDismiss,
}: {
  result: AbilityRollResult;
  onDismiss: () => void;
}) {
  const label = result.type === 'save' ? 'Save' : 'Check';
  const critClass = result.isCritical
    ? 'text-emerald-400'
    : result.isCriticalFail
      ? 'text-red-400'
      : 'text-foreground';
  const modStr = result.modifier >= 0 ? `+${result.modifier}` : `${result.modifier}`;

  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <Dice5 className="h-3.5 w-3.5 text-brass" />
        <span className="font-medium text-muted-foreground">
          {result.ability.toUpperCase()} {label}:
        </span>
        <span className={`font-bold ${critClass}`}>
          [{result.roll}]{modStr} = {result.total}
        </span>
        {result.isCritical && (
          <span className="rounded-sm bg-emerald-900/40 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
            Crit!
          </span>
        )}
        {result.isCriticalFail && (
          <span className="rounded-sm bg-red-900/40 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400">
            Fail!
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors text-xs"
      >
        dismiss
      </button>
    </div>
  );
}
