import { useEffect, useState } from 'react';
import { Dice5, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCharacters } from '@/hooks/useCharacters';
import {
  useRollAttack,
  useRollAbility,
  useTakeDamage,
  useHeal,
  useAddTempHP,
  useRollDeathSave,
  useConsumeSpellSlot,
  useRestoreSpellSlot,
  useUpdateAttacks,
} from '@/hooks/useCharacterCombat';
import { HPTracker } from '@/components/characters/HPTracker';
import { CombatStats } from '@/components/characters/CombatStats';
import { SpellSlots } from '@/components/characters/SpellSlots';
import { useCampaignModuleEnabled } from '@/hooks/useModuleEnabled';
import { formatCharacterClass } from '@/lib/character-utils';
import type { Character, AbilityRollResult, CharacterAttack } from '@/types/campaign';

interface LiveCharacterSheetProps {
  campaignId: string;
  isDM: boolean;
  characterId?: string;
}

// ── Standard D&D 5e ability scores ───────────────────────

const ABILITIES = [
  { key: 'str', label: 'Strength', abbr: 'STR' },
  { key: 'dex', label: 'Dexterity', abbr: 'DEX' },
  { key: 'con', label: 'Constitution', abbr: 'CON' },
  { key: 'int', label: 'Intelligence', abbr: 'INT' },
  { key: 'wis', label: 'Wisdom', abbr: 'WIS' },
  { key: 'cha', label: 'Charisma', abbr: 'CHA' },
] as const;

function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ── Component ────────────────────────────────────────────

export function LiveCharacterSheet({ campaignId, isDM, characterId }: LiveCharacterSheetProps) {
  const { user } = useAuth();
  const { data: characters, isLoading } = useCharacters(campaignId);

  const selectedCharacter = characterId
    ? characters?.find((c) => c._id === characterId)
    : characters?.find((c) => c.userId === user?._id);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedCharacter) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-['IM_Fell_English'] text-sm text-muted-foreground">
          {characterId ? 'Selected character not found in this campaign.' : 'No character found in this campaign.'}
        </p>
        <p className="text-xs text-muted-foreground">
          {characterId
            ? 'This participant may have been removed or is no longer available.'
            : 'Ask your DM to create a character for you, or create one in the campaign prep phase.'}
        </p>
      </div>
    );
  }

  return (
    <CharacterSheetContent
      character={selectedCharacter}
      campaignId={campaignId}
      isDM={isDM}
      currentUserId={user?._id}
    />
  );
}

// ── Sheet Content (extracted to keep parent children count low for TS 5.9) ──

function CharacterSheetContent({
  character,
  campaignId,
  isDM,
  currentUserId,
}: {
  character: Character;
  campaignId: string;
  isDM: boolean;
  currentUserId?: string;
}) {
  const rollAttack = useRollAttack();
  const rollAbility = useRollAbility();
  const takeDamage = useTakeDamage();
  const heal = useHeal();
  const addTempHP = useAddTempHP();
  const rollDeathSave = useRollDeathSave();
  const consumeSlot = useConsumeSpellSlot();
  const restoreSlot = useRestoreSpellSlot();
  const updateAttacks = useUpdateAttacks();
  const hasSpellSlots = useCampaignModuleEnabled(campaignId, 'spell-slots-dnd');

  const [abilityResult, setAbilityResult] = useState<AbilityRollResult | null>(null);
  const [rollingAbility, setRollingAbility] = useState<string | null>(null);
  const [attacksDraft, setAttacksDraft] = useState<CharacterAttack[]>(character.attacks ?? []);
  const canEditAttacks = isDM || character.userId === currentUserId;

  useEffect(() => {
    setAttacksDraft(character.attacks ?? []);
  }, [character._id, character.attacks]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {renderHeader(character)}
      <div className="space-y-4 p-4">
        {renderHPSection(character)}
        {renderAbilityScores(character)}
        {renderCombatSection(character)}
        {canEditAttacks && renderAttackEditor()}
        {hasSpellSlots && renderSpellSlotSection(character)}
      </div>
    </div>
  );

  // ── Render helpers ───────────────────────────────────

  function renderHeader(char: Character) {
    return (
      <div className="border-b border-border bg-card/50 p-4">
        <div className="flex items-center gap-3">
          {char.portrait?.url && (
            <img
              src={char.portrait.url}
              alt={char.name}
              className="h-12 w-12 rounded-full border border-border object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-[Cinzel] text-sm font-semibold text-foreground">
              {char.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {[char.race, formatCharacterClass(char), char.level ? `Level ${char.level}` : null]
                .filter(Boolean)
                .join(' \u2022 ')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderHPSection(char: Character) {
    return (
      <HPTracker
        character={char}
        onDamage={(amount) => takeDamage.mutate({ id: char._id, amount })}
        onHeal={(amount) => heal.mutate({ id: char._id, amount })}
        onTempHP={(amount) => addTempHP.mutate({ id: char._id, amount })}
        onDeathSave={(result) => rollDeathSave.mutate({ id: char._id, result })}
        editable
        showDeathSaves
      />
    );
  }

  function renderAbilityScores(char: Character) {
    if (!char.stats || Object.keys(char.stats).length === 0) return null;

    return (
      <div>
        <p className="mb-2 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          Ability Scores
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {ABILITIES.map((ability) => {
            const score = char.stats?.[ability.key] ?? 10;
            const mod = abilityModifier(score);
            return (
              <AbilityScoreCard
                key={ability.key}
                abbr={ability.abbr}
                label={ability.label}
                score={score}
                mod={mod}
                isRolling={rollingAbility === ability.key}
                onRollCheck={() => handleAbilityRoll(char._id, ability.key, 'check')}
                onRollSave={() => handleAbilityRoll(char._id, ability.key, 'save')}
              />
            );
          })}
        </div>
        {renderAbilityResult()}
      </div>
    );
  }

  function renderAbilityResult() {
    if (!abilityResult) return null;
    const critClass = abilityResult.isCritical
      ? 'text-emerald-400'
      : abilityResult.isCriticalFail
        ? 'text-red-400'
        : 'text-foreground';

    const abilityDef = ABILITIES.find((a) => a.key === abilityResult.ability);
    const label = abilityDef?.abbr ?? abilityResult.ability.toUpperCase();
    const typeLabel = abilityResult.type === 'save' ? 'Save' : 'Check';

    return (
      <div className="mt-2 rounded-sm border border-border bg-card/50 px-3 py-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            {label} {typeLabel}:
          </span>
          <span className={`font-bold ${critClass}`}>
            [{abilityResult.roll}]{formatMod(abilityResult.modifier)} = {abilityResult.total}
          </span>
          {abilityResult.isCritical && (
            <span className="rounded-sm bg-emerald-900/40 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
              NAT 20!
            </span>
          )}
          {abilityResult.isCriticalFail && (
            <span className="rounded-sm bg-red-900/40 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400">
              NAT 1
            </span>
          )}
        </div>
      </div>
    );
  }

  function renderCombatSection(char: Character) {
    return (
      <CombatStats
        character={char}
        editable
        onRollAttack={(attackId) =>
          rollAttack.mutateAsync({ id: char._id, attackId, campaignId })
        }
      />
    );
  }

  function renderSpellSlotSection(char: Character) {
    return (
      <SpellSlots
        spellSlots={char.spellSlots}
        editable
        onConsume={(level) => consumeSlot.mutate({ id: char._id, level })}
        onRestore={(level) => restoreSlot.mutate({ id: char._id, level })}
      />
    );
  }

  function renderAttackEditor() {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Manage Attacks</p>
          <button
            type="button"
            onClick={() =>
              setAttacksDraft([
                ...attacksDraft,
                {
                  id: makeAttackId(),
                  name: '',
                  attackBonus: 0,
                  damageBonus: 0,
                  damageDice: '1d6',
                  damageType: 'slashing',
                  actionCost: 'action',
                },
              ])
            }
            className="rounded border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20"
          >
            Add Attack
          </button>
        </div>
        <div className="space-y-2">
          {attacksDraft.map((attack, i) => (
            <div key={attack.id || `${attack.name}-${i}`} className="rounded border border-border/60 bg-card/40 p-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={attack.name}
                  onChange={(e) => updateAttack(i, { name: e.target.value })}
                  placeholder="Name"
                  className="rounded border border-input bg-input px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  value={attack.damageDice}
                  onChange={(e) => updateAttack(i, { damageDice: e.target.value })}
                  placeholder="Damage dice"
                  className="rounded border border-input bg-input px-2 py-1 text-xs"
                />
                <input
                  type="number"
                  value={attack.attackBonus}
                  onChange={(e) => updateAttack(i, { attackBonus: parseInt(e.target.value, 10) || 0 })}
                  placeholder="To-hit"
                  className="rounded border border-input bg-input px-2 py-1 text-xs"
                />
                <input
                  type="number"
                  value={attack.damageBonus}
                  onChange={(e) => updateAttack(i, { damageBonus: parseInt(e.target.value, 10) || 0 })}
                  placeholder="Damage bonus"
                  className="rounded border border-input bg-input px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  value={attack.damageType}
                  onChange={(e) => updateAttack(i, { damageType: e.target.value })}
                  placeholder="Damage type"
                  className="rounded border border-input bg-input px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  value={attack.range ?? ''}
                  onChange={(e) => updateAttack(i, { range: e.target.value })}
                  placeholder="Range"
                  className="rounded border border-input bg-input px-2 py-1 text-xs"
                />
                <select
                  value={attack.actionCost ?? 'action'}
                  onChange={(e) => updateAttack(i, { actionCost: e.target.value as CharacterAttack['actionCost'] })}
                  className="rounded border border-input bg-input px-2 py-1 text-xs"
                >
                  <option value="action">Action</option>
                  <option value="bonus">Bonus Action</option>
                  <option value="reaction">Reaction</option>
                  <option value="free">Free</option>
                </select>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAttacksDraft(attacksDraft.filter((_, idx) => idx !== i))}
                  className="rounded border border-destructive/40 bg-destructive/10 px-2 py-1 text-[10px] uppercase tracking-wider text-destructive hover:bg-destructive/20"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() =>
              updateAttacks.mutate({
                id: character._id,
                attacks: sanitizeAttacks(attacksDraft),
              })
            }
            className="rounded border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20"
          >
            Save Attacks
          </button>
        </div>
      </div>
    );
  }

  function updateAttack(index: number, patch: Partial<CharacterAttack>) {
    setAttacksDraft(
      attacksDraft.map((attack, i) => (i === index ? { ...attack, ...patch } : attack)),
    );
  }

  async function handleAbilityRoll(
    characterId: string,
    ability: string,
    type: 'check' | 'save',
  ) {
    if (rollingAbility) return;
    setRollingAbility(ability);
    setAbilityResult(null);
    try {
      const result = await rollAbility.mutateAsync({
        id: characterId,
        ability,
        type,
        campaignId,
      });
      setAbilityResult(result);
    } finally {
      setRollingAbility(null);
    }
  }
}

function sanitizeAttacks(attacks: CharacterAttack[]): CharacterAttack[] {
  return attacks
    .map((attack, i) => ({
      ...attack,
      id: attack.id || makeAttackId(i),
      name: attack.name.trim(),
      damageDice: attack.damageDice.trim(),
      damageType: attack.damageType.trim(),
      attackBonus: Number.isFinite(attack.attackBonus) ? attack.attackBonus : 0,
      damageBonus: Number.isFinite(attack.damageBonus) ? attack.damageBonus : 0,
      actionCost: attack.actionCost ?? 'action',
      range: attack.range?.trim() || undefined,
      description: attack.description?.trim() || undefined,
    }))
    .filter((attack) => attack.name.length > 0 && attack.damageDice.length > 0);
}

function makeAttackId(seed?: number): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `atk-${Date.now()}-${seed ?? Math.floor(Math.random() * 10000)}`;
}

// ── Ability Score Card ────────────────────────────────────

function AbilityScoreCard({
  abbr,
  label,
  score,
  mod,
  isRolling,
  onRollCheck,
  onRollSave,
}: {
  abbr: string;
  label: string;
  score: number;
  mod: number;
  isRolling: boolean;
  onRollCheck: () => void;
  onRollSave: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-md border border-border bg-card/50 p-2">
      <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">
        {abbr}
      </span>
      <span className="text-lg font-bold text-foreground">{score}</span>
      <span className="text-xs text-muted-foreground">{formatMod(mod)}</span>
      <div className="mt-1.5 flex gap-1">
        <button
          type="button"
          onClick={onRollCheck}
          disabled={isRolling}
          className="flex items-center gap-0.5 rounded-sm border border-brass/30 bg-brass/10 px-1.5 py-0.5 text-[9px] font-medium text-brass transition-colors hover:bg-brass/20 disabled:opacity-50"
          title={`Roll ${label} Check`}
        >
          {isRolling ? (
            <Dice5 className="h-2.5 w-2.5 animate-spin" />
          ) : (
            <Dice5 className="h-2.5 w-2.5" />
          )}
          CHK
        </button>
        <button
          type="button"
          onClick={onRollSave}
          disabled={isRolling}
          className="flex items-center gap-0.5 rounded-sm border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
          title={`Roll ${label} Save`}
        >
          SAV
        </button>
      </div>
    </div>
  );
}
