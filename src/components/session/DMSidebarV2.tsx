import { useEffect, useState } from 'react';
import { Dice5, Eye, FileText, Globe, Loader2, MapPin, Plus, ScrollText, Sparkles, Swords, Target, Users } from 'lucide-react';
import { RequestRollModal } from '@/components/session/RequestRollModal';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useWorldEntities, useCreateWorldEntity } from '@/hooks/useWorldEntities';
import { useEncounters } from '@/hooks/useEncounters';
import { useNotebook, useCreateNote } from '@/hooks/useNotebook';
import { useCharacters, useUpdateCharacter } from '@/hooks/useCharacters';
import { useBattleMap } from '@/hooks/useBattleMap';
import { useEnemyTemplates } from '@/hooks/useEnemyTemplates';
import { useInitiative, useRollDice, useUpdateInitiativeEntry } from '@/hooks/useLiveSession';
import { AIToolsTab } from '@/components/session/AIToolsTab';
import { HouseRulesPanel } from '@/components/session/HouseRulesPanel';
import { useRoundLabel } from '@/hooks/useModuleEnabled';
import { InitiativeTracker } from '@/components/session/InitiativeTracker';
import { ApplyDamageModal } from '@/components/session/ApplyDamageModal';
import { ConcentrationBadge } from '@/components/session/ConcentrationBadge';
import { DamageModTags } from '@/components/session/DamageModTags';
import { DeathSavesTracker } from '@/components/session/DeathSavesTracker';
import { DownedStatePanel } from '@/components/session/DownedStatePanel';
import InlineEncounterBuilder from '@/components/session/InlineEncounterBuilder';
import { PartyStatusPanel } from '@/components/session/PartyStatusPanel';
import { PassiveChecksTab } from '@/components/session/PassiveChecksTab';
import { HandoutsTab } from '@/components/session/HandoutsTab';
import type { WorldEntityType } from '@/types/campaign';
import type { InitiativeEntry } from '@/types/live-session';
import type { EnemyAttack, EnemyTemplate } from '@/types/enemy-template';
import type { CharacterAttack } from '@/types/campaign';
import {
  type ActionBudgetState,
  type ActionCostType,
  DEFAULT_MOVEMENT_MAX,
  applyDamage,
  applyHeal,
  buildCharacterDamageDice,
  clamp,
  extractDamageDice,
  formatActionCostLabel,
  getBudgetForEntry,
  normalizeCombatantName,
  resolveEnemyTemplateForEntry,
} from '@/lib/combat-math';

type DMTab = 'world' | 'encounters' | 'notes' | 'party' | 'initiative' | 'passive' | 'handouts' | 'ai';
type AIFocusTool = 'npc' | 'encounter' | 'quest' | 'lore' | 'location';

interface DMSidebarV2Props {
  campaignId: string;
  isDM: boolean;
  selectedEntry?: InitiativeEntry | null;
  onSelectEntryId?: (entryId: string) => void;
  onClearSelectedEntry?: () => void;
}

export default function DMSidebarV2({
  campaignId,
  isDM,
  selectedEntry,
  onSelectEntryId,
  onClearSelectedEntry,
}: DMSidebarV2Props) {
  const [activeTab, setActiveTab] = useState<DMTab>(() => {
    const saved = localStorage.getItem('fablheim:session-v2-dm-tab');
    return (saved as DMTab) || 'world';
  });
  const [showRequestRoll, setShowRequestRoll] = useState(false);
  const [showQuickAIEverywhere, setShowQuickAIEverywhere] = useState(() => {
    const saved = localStorage.getItem('fablheim:session-v2-show-quick-ai');
    return saved !== '0';
  });
  const [aiFocusSeed, setAiFocusSeed] = useState(0);

  useEffect(() => {
    localStorage.setItem('fablheim:session-v2-dm-tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('fablheim:session-v2-show-quick-ai', showQuickAIEverywhere ? '1' : '0');
  }, [showQuickAIEverywhere]);

  function openAITool(tool: AIFocusTool) {
    localStorage.setItem('fablheim:session-v2-ai-focus', tool);
    setAiFocusSeed((v) => v + 1);
    setActiveTab('ai');
  }

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-8 gap-1 border-b border-border/70 p-2">
        <button type="button" onClick={() => setActiveTab('world')} className={tabClass(activeTab === 'world')} aria-label="World">
          <Globe className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('encounters')} className={tabClass(activeTab === 'encounters')} aria-label="Encounters">
          <Swords className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('initiative')} className={tabClass(activeTab === 'initiative')} aria-label="Initiative">
          <Target className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('passive')} className={tabClass(activeTab === 'passive')} aria-label="Passive Checks">
          <Eye className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('notes')} className={tabClass(activeTab === 'notes')} aria-label="Notes">
          <ScrollText className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('handouts')} className={tabClass(activeTab === 'handouts')} aria-label="Handouts">
          <FileText className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('party')} className={tabClass(activeTab === 'party')} aria-label="Party">
          <Users className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('ai')} className={tabClass(activeTab === 'ai')} aria-label="AI Tools">
          <Sparkles className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-border/50 px-2 py-1.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Quick AI buttons</span>
        <button
          type="button"
          onClick={() => setShowQuickAIEverywhere((v) => !v)}
          className={`relative inline-flex h-5 w-10 items-center rounded-full p-0.5 transition-colors ${
            showQuickAIEverywhere ? 'bg-primary/60' : 'bg-muted'
          }`}
          aria-label="Toggle quick AI actions on non-AI tabs"
          aria-pressed={showQuickAIEverywhere}
        >
          <span
            className={`h-4 w-4 rounded-full bg-background transition-transform ${
              showQuickAIEverywhere ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center border-b border-border/50 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setShowRequestRoll(true)}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-[Cinzel] uppercase tracking-wider text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
        >
          <Dice5 className="h-3.5 w-3.5" />
          Request Roll
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {showQuickAIEverywhere && activeTab !== 'ai' && (
          <QuickAIActions activeTab={activeTab} onOpenTool={openAITool} />
        )}

        {activeTab === 'world' && <CompactWorldPanel campaignId={campaignId} />}
        {activeTab === 'encounters' && (
          <CompactEncountersPanel
            campaignId={campaignId}
            selectedEntry={selectedEntry}
            onClearSelectedEntry={onClearSelectedEntry}
          />
        )}
        {activeTab === 'initiative' && (
          <InitiativeCommandPanel
            campaignId={campaignId}
            isDM={isDM}
            selectedEntry={selectedEntry}
            onSelectEntryId={onSelectEntryId}
            onClearSelectedEntry={onClearSelectedEntry}
          />
        )}
        {activeTab === 'passive' && <PassiveChecksTab campaignId={campaignId} />}
        {activeTab === 'notes' && (
          <>
            <CompactNotesPanel campaignId={campaignId} />
            <div className="mt-4 px-1">
              <HouseRulesPanel campaignId={campaignId} />
            </div>
          </>
        )}
        {activeTab === 'handouts' && <HandoutsTab campaignId={campaignId} isDM={isDM} />}
        {activeTab === 'party' && <PartyStatusPanel campaignId={campaignId} />}
        {activeTab === 'ai' && <AIToolsTab campaignId={campaignId} focusSeed={aiFocusSeed} />}
      </div>

      {showRequestRoll && (
        <RequestRollModal campaignId={campaignId} onClose={() => setShowRequestRoll(false)} />
      )}
    </div>
  );
}

function InitiativeCommandPanel({
  campaignId,
  isDM,
  selectedEntry,
  onSelectEntryId,
  onClearSelectedEntry,
}: {
  campaignId: string;
  isDM: boolean;
  selectedEntry?: InitiativeEntry | null;
  onSelectEntryId?: (entryId: string) => void;
  onClearSelectedEntry?: () => void;
}) {
  const { user } = useAuth();
  const { data: initiative } = useInitiative(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const { data: battleMap } = useBattleMap(campaignId);
  const { data: encounters } = useEncounters(campaignId);
  const { data: enemyTemplates } = useEnemyTemplates();
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const updateCharacter = useUpdateCharacter();
  const rollDice = useRollDice(campaignId);
  const roundLabel = useRoundLabel(campaignId);
  const [actionBudgets, setActionBudgets] = useState<Record<string, ActionBudgetState>>({});
  const [showApplyDamageModal, setShowApplyDamageModal] = useState(false);
  const [lastSpend, setLastSpend] = useState<{
    entryId: string;
    costType: ActionCostType;
    label: string;
  } | null>(null);

  const entries = initiative?.entries ?? [];
  const currentTurnEntry =
    initiative?.isActive && entries[initiative.currentTurn]
      ? entries[initiative.currentTurn]
      : null;
  const upNextEntry =
    initiative?.isActive && entries.length > 1
      ? entries[(initiative.currentTurn + 1) % entries.length]
      : null;
  const focusEntry = selectedEntry ?? currentTurnEntry ?? null;
  const sourceEncounter = battleMap?.sourceEncounterId
    ? encounters?.find((encounter) => encounter._id === battleMap.sourceEncounterId)
    : undefined;
  const focusTemplate =
    focusEntry && !focusEntry.characterId
      ? resolveEnemyTemplateForEntry(focusEntry, sourceEncounter?.npcs, enemyTemplates)
      : undefined;
  const focusCharacter = focusEntry?.characterId
    ? characters?.find((character) => character._id === focusEntry.characterId)
    : undefined;
  const canEditFocusHp = !!focusEntry && (
    isDM || (focusCharacter?.userId != null && focusCharacter.userId === user?._id)
  );
  const canEditFocusInitiativeFields = !!focusEntry && (
    isDM || (focusCharacter?.userId != null && focusCharacter.userId === user?._id)
  );
  const focusTempHp = focusCharacter
    ? (focusCharacter.hp?.temp ?? 0)
    : focusEntry
      ? (focusEntry.tempHp ?? 0)
      : 0;
  const focusBudget = focusEntry
    ? getBudgetForEntry(
        actionBudgets[focusEntry.id],
        focusCharacter?.speed ?? DEFAULT_MOVEMENT_MAX,
      )
    : null;

  useEffect(() => {
    if (!currentTurnEntry?.id) return;
    const currentSpeed =
      currentTurnEntry.characterId
        ? (characters?.find((character) => character._id === currentTurnEntry.characterId)?.speed ?? DEFAULT_MOVEMENT_MAX)
        : DEFAULT_MOVEMENT_MAX;
    setActionBudgets((prev) => ({
      ...prev,
      [currentTurnEntry.id]: {
        actionUsed: false,
        bonusUsed: false,
        reactionUsed: false,
        movementUsed: 0,
        movementMax: currentSpeed,
      },
    }));
  }, [currentTurnEntry?.id, currentTurnEntry?.characterId, characters]);

  useEffect(() => {
    if (initiative?.isActive) return;
    setActionBudgets({});
  }, [initiative?.isActive]);

  useEffect(() => {
    if (!focusEntry || !lastSpend) return;
    if (lastSpend.entryId !== focusEntry.id) {
      setLastSpend(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only reacts to focusEntry ID changes
  }, [focusEntry?.id, lastSpend]);

  useEffect(() => {
    setShowApplyDamageModal(false);
  }, [focusEntry?.id]);

  function updateFocusBudget(
    patch:
      | Partial<ActionBudgetState>
      | ((current: ActionBudgetState) => ActionBudgetState),
  ) {
    if (!focusEntry || !focusBudget) return;
    setActionBudgets((prev) => {
      const current = getBudgetForEntry(prev[focusEntry.id], focusBudget.movementMax);
      const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
      return { ...prev, [focusEntry.id]: next };
    });
  }

  function canUseCost(cost: ActionCostType, budget: ActionBudgetState): boolean {
    if (cost === 'free') return true;
    if (cost === 'action') return !budget.actionUsed;
    if (cost === 'bonus') return !budget.bonusUsed;
    return !budget.reactionUsed;
  }

  function spendBlockedReason(cost: ActionCostType, budget: ActionBudgetState): string | null {
    if (canUseCost(cost, budget)) return null;
    return `${formatActionCostLabel(cost)} already spent`;
  }

  function consumeCost(cost: ActionCostType, sourceLabel: string): boolean {
    if (!focusEntry || !focusBudget) return true;
    if (!canUseCost(cost, focusBudget)) {
      const costLabel =
        cost === 'bonus' ? 'Bonus Action' : cost === 'reaction' ? 'Reaction' : 'Action';
      toast.error(`No ${costLabel} remaining for this turn`);
      return false;
    }
    if (cost === 'free') return true;
    updateFocusBudget((current) => ({
      ...current,
      actionUsed: cost === 'action' ? true : current.actionUsed,
      bonusUsed: cost === 'bonus' ? true : current.bonusUsed,
      reactionUsed: cost === 'reaction' ? true : current.reactionUsed,
    }));
    const spend = {
      entryId: focusEntry.id,
      costType: cost,
      label: sourceLabel,
    };
    setLastSpend(spend);
    toast.message(`Spent ${formatActionCostLabel(cost)} — ${sourceLabel}`, {
      action: {
        label: 'Undo',
        onClick: () => {
          setActionBudgets((prev) => {
            const current = prev[spend.entryId];
            if (!current) return prev;
            return {
              ...prev,
              [spend.entryId]: {
                ...current,
                actionUsed: spend.costType === 'action' ? false : current.actionUsed,
                bonusUsed: spend.costType === 'bonus' ? false : current.bonusUsed,
                reactionUsed: spend.costType === 'reaction' ? false : current.reactionUsed,
              },
            };
          });
          setLastSpend(null);
        },
      },
    });
    return true;
  }

  async function applyDamageToFocus(amount: number) {
    if (!focusEntry || amount <= 0 || !canEditFocusHp) return;
    if (focusCharacter) {
      const hp = focusCharacter.hp ?? { current: 0, max: 0, temp: 0 };
      const next = applyDamage(hp.current, hp.temp ?? 0, amount);
      await updateCharacter.mutateAsync({
        id: focusCharacter._id,
        campaignId,
        data: { hp: { ...hp, current: next.currentHp, temp: next.tempHp } },
      });
      return;
    }
    const next = applyDamage(focusEntry.currentHp ?? 0, focusTempHp, amount);
    await updateEntry.mutateAsync({
      entryId: focusEntry.id,
      body: { currentHp: next.currentHp, tempHp: next.tempHp },
    });
  }

  async function applyHealToFocus(amount: number) {
    if (!focusEntry || amount <= 0 || !canEditFocusHp) return;
    if (focusCharacter) {
      const hp = focusCharacter.hp ?? { current: 0, max: 0, temp: 0 };
      const next = applyHeal(hp.current, hp.max, amount);
      await updateCharacter.mutateAsync({
        id: focusCharacter._id,
        campaignId,
        data: { hp: { ...hp, current: next.currentHp } },
      });
      return;
    }
    const next = applyHeal(focusEntry.currentHp ?? 0, focusEntry.maxHp ?? 0, amount);
    await updateEntry.mutateAsync({ entryId: focusEntry.id, body: { currentHp: next.currentHp } });
  }

  async function setFocusTempHp(value: number) {
    if (!focusEntry || value < 0 || !canEditFocusHp) return;
    if (focusCharacter) {
      const hp = focusCharacter.hp ?? { current: 0, max: 0, temp: 0 };
      await updateCharacter.mutateAsync({
        id: focusCharacter._id,
        campaignId,
        data: { hp: { ...hp, temp: value } },
      });
      return;
    }
    await updateEntry.mutateAsync({ entryId: focusEntry.id, body: { tempHp: value } });
  }

  return (
    <div className="space-y-2">
      <div className="sticky top-0 z-10 rounded border border-border/60 bg-background/95 px-2 py-1 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {roundLabel} {initiative?.round ?? '-'}
          </span>
          <span className="truncate text-[10px] text-muted-foreground">
            Current: <span className="font-medium text-foreground">{currentTurnEntry?.name ?? 'None'}</span>
          </span>
          <span className="text-[10px] text-muted-foreground">
            {selectedEntry ? 'Pinned' : 'Following turn'}
          </span>
        </div>
      </div>

      <InitiativeTracker
        campaignId={campaignId}
        isDM={isDM}
        selectedEntryId={selectedEntry?.id ?? null}
        onSelectEntryId={onSelectEntryId}
      />

      {!initiative?.isActive ? (
        <div className="rounded border border-dashed border-border/60 bg-background/30 p-2 text-xs text-muted-foreground">
          Start combat to show current turn, up next, and the live participant sheet.
        </div>
      ) : (
        <div className="space-y-2 rounded border border-border/60 bg-background/30 p-2">
          <div className="grid grid-cols-2 gap-1">
            <TurnCard label="Current Turn" entry={currentTurnEntry} emphasize />
            <TurnCard label="Up Next" entry={upNextEntry} />
          </div>

          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {selectedEntry ? 'Pinned Participant' : 'Active Participant'}
              </p>
              {selectedEntry && (
                <span className="rounded border border-primary/35 bg-primary/10 px-1 py-0.5 text-[9px] uppercase tracking-wide text-primary">
                  Pinned
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!selectedEntry && currentTurnEntry && onSelectEntryId && (
                <button
                  type="button"
                  onClick={() => onSelectEntryId(currentTurnEntry.id)}
                  className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Pin Current
                </button>
              )}
              {selectedEntry && onClearSelectedEntry && (
                <button
                  type="button"
                  onClick={onClearSelectedEntry}
                  className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {!focusEntry ? (
            <div className="rounded border border-dashed border-border/60 p-2 text-xs text-muted-foreground">
              No active participant.
            </div>
          ) : (
            <>
              {!isDM && focusEntry.isHidden ? (
                <div className="rounded border border-dashed border-border/60 p-2 text-xs text-muted-foreground">
                  Hidden participant
                </div>
              ) : (
                <>
              {focusBudget && (
                <ActionEconomyPanel
                  budget={focusBudget}
                  onToggleAction={() => updateFocusBudget((current) => ({ ...current, actionUsed: !current.actionUsed }))}
                  onToggleBonus={() => updateFocusBudget((current) => ({ ...current, bonusUsed: !current.bonusUsed }))}
                  onToggleReaction={() => updateFocusBudget((current) => ({ ...current, reactionUsed: !current.reactionUsed }))}
                  onSetMovement={(value) =>
                    updateFocusBudget((current) => ({
                      ...current,
                      movementUsed: clamp(value, 0, current.movementMax),
                    }))
                  }
                  onResetTurn={() =>
                    updateFocusBudget((current) => ({
                      ...current,
                      actionUsed: false,
                      bonusUsed: false,
                      reactionUsed: false,
                      movementUsed: 0,
                    }))
                  }
                />
              )}
              <HpControlsCard
                currentHp={focusCharacter?.hp.current ?? focusEntry.currentHp ?? 0}
                maxHp={focusCharacter?.hp.max ?? focusEntry.maxHp ?? 0}
                tempHp={focusTempHp}
                tempHpIsLocal={false}
                canEdit={canEditFocusHp}
                onApplyDamage={applyDamageToFocus}
                onApplyHeal={applyHealToFocus}
                onSetTempHp={setFocusTempHp}
              />
              {renderApplyDamageAction()}
              {renderConcentration()}
              {renderDamageMods()}
              {renderDeathSaves()}
              {renderDownedState()}
              {focusEntry.characterId ? (
                <PcFocusCard
                  characterName={focusCharacter?.name ?? focusEntry.name}
                  attacks={focusCharacter?.attacks ?? []}
                  isRolling={rollDice.isPending}
                  canSpendCost={(cost) => (focusBudget ? canUseCost(cost, focusBudget) : true)}
                  spendBlockedReason={(cost) => (focusBudget ? spendBlockedReason(cost, focusBudget) : null)}
                  onRollAttack={async (attack, mode) => {
                    const actionCost = attack.actionCost ?? 'action';
                    if (mode !== 'damageOnly' && !consumeCost(actionCost, attack.name)) {
                      return { attackRoll: null, damageRoll: null };
                    }

                    const attackDice = `1d20${attack.attackBonus >= 0 ? '+' : ''}${attack.attackBonus}`;
                    const damageDice = buildCharacterDamageDice(attack);
                    const attackRoll = mode !== 'damageOnly'
                      ? await rollDice.mutateAsync({
                          dice: attackDice,
                          purpose: `${focusEntry.name}: ${attack.name} attack`,
                          isPrivate: !!focusEntry.isHidden,
                        })
                      : null;
                    const damageRoll = mode !== 'attackOnly'
                      ? await rollDice.mutateAsync({
                          dice: damageDice,
                          purpose: `${focusEntry.name}: ${attack.name} damage`,
                          isPrivate: !!focusEntry.isHidden,
                        })
                      : null;
                    return { attackRoll, damageRoll };
                  }}
                />
              ) : (
                <NpcFocusCard
                  key={focusEntry.id}
                  campaignId={campaignId}
                  entry={focusEntry}
                  template={focusTemplate}
                  isRolling={rollDice.isPending}
                  canSpendCost={(cost) => (focusBudget ? canUseCost(cost, focusBudget) : true)}
                  spendBlockedReason={(cost) => (focusBudget ? spendBlockedReason(cost, focusBudget) : null)}
                  onRollAttack={async (attack, mode) => {
                    const actionCost = attack.actionCost ?? 'action';
                    if (mode !== 'damageOnly' && !consumeCost(actionCost, attack.name)) {
                      return { attackRoll: null, damageRoll: null };
                    }

                    const isHidden = !!focusEntry.isHidden;
                    const attackDice = `1d20${attack.bonus >= 0 ? '+' : ''}${attack.bonus}`;
                    const damageDice = extractDamageDice(attack.damage);
                    const attackRoll = mode !== 'damageOnly'
                      ? await rollDice.mutateAsync({
                          dice: attackDice,
                          purpose: `${focusEntry.name}: ${attack.name} attack`,
                          isPrivate: isHidden,
                        })
                      : null;
                    const damageRoll = mode !== 'attackOnly' && damageDice
                      ? await rollDice.mutateAsync({
                          dice: damageDice,
                          purpose: `${focusEntry.name}: ${attack.name} damage`,
                          isPrivate: isHidden,
                        })
                      : null;
                    return { attackRoll, damageRoll };
                  }}
                />
              )}
              {renderApplyDamageModal()}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  function renderApplyDamageAction() {
    if (!focusEntry || !canEditFocusHp) return null;
    return (
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setShowApplyDamageModal(true)}
          className="rounded border border-destructive/40 bg-destructive/10 px-2 py-1 text-[10px] uppercase tracking-wider text-destructive hover:bg-destructive/20"
        >
          Apply Damage...
        </button>
      </div>
    );
  }

  function renderConcentration() {
    if (!focusEntry) return null;
    return (
      <ConcentrationBadge
        campaignId={campaignId}
        entry={focusEntry}
        canEdit={canEditFocusInitiativeFields}
      />
    );
  }

  function renderDamageMods() {
    if (!focusEntry) return null;
    return (
      <DamageModTags
        campaignId={campaignId}
        entry={focusEntry}
        canEdit={isDM}
      />
    );
  }

  function renderDeathSaves() {
    if (!focusEntry?.deathSaves) return null;
    return (
      <DeathSavesTracker
        campaignId={campaignId}
        entry={focusEntry}
        canEditPcDeathSaves={isDM || focusCharacter?.userId === user?._id}
        canEditNpcDeathSaves={isDM && !focusEntry.characterId}
      />
    );
  }

  function renderDownedState() {
    if (!focusEntry) return null;
    return (
      <DownedStatePanel
        campaignId={campaignId}
        entry={focusEntry}
        canEdit={isDM}
      />
    );
  }

  function renderApplyDamageModal() {
    if (!focusEntry || !showApplyDamageModal) return null;
    return (
      <ApplyDamageModal
        campaignId={campaignId}
        entry={focusEntry}
        isOpen={showApplyDamageModal}
        onClose={() => setShowApplyDamageModal(false)}
      />
    );
  }
}

function TurnCard({
  label,
  entry,
  emphasize = false,
}: {
  label: string;
  entry: InitiativeEntry | null;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded border px-2 py-1.5 ${
        emphasize
          ? 'border-primary/45 bg-primary/10'
          : 'border-border/60 bg-card/40'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      {entry ? (
        <>
          <p className="truncate text-xs font-medium text-foreground">{entry.name}</p>
          <p className="text-[10px] text-muted-foreground">
            Init {entry.initiativeRoll} · {entry.type.toUpperCase()}
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">None</p>
      )}
    </div>
  );
}

function NpcFocusCard({
  campaignId,
  entry,
  template,
  isRolling,
  canSpendCost,
  spendBlockedReason,
  onRollAttack,
}: {
  campaignId: string;
  entry: InitiativeEntry;
  template?: EnemyTemplate;
  isRolling: boolean;
  canSpendCost: (cost: ActionCostType) => boolean;
  spendBlockedReason: (cost: ActionCostType) => string | null;
  onRollAttack: (
    attack: EnemyAttack,
    mode: 'attackOnly' | 'attackAndDamage' | 'damageOnly',
  ) => Promise<{ attackRoll: { total: number } | null; damageRoll: { total: number } | null }>;
}) {
  const [rollResult, setRollResult] = useState<{
    name: string;
    attack?: number;
    damage?: number;
    mode: 'attackOnly' | 'attackAndDamage' | 'damageOnly';
  } | null>(null);
  const [customAttacks, setCustomAttacks] = useState<EnemyAttack[]>([]);
  const [newAttackName, setNewAttackName] = useState('');
  const [newAttackBonus, setNewAttackBonus] = useState(0);
  const [newAttackDamage, setNewAttackDamage] = useState('1d6');
  const [newAttackActionCost, setNewAttackActionCost] = useState<ActionCostType>('action');
  const [showAddAttackForm, setShowAddAttackForm] = useState(false);
  const customAttackKey = `${campaignId}:${normalizeCombatantName(entry.name)}`;
  const resolvedAttacks = [...(template?.attacks ?? []), ...customAttacks];

  useEffect(() => {
    setCustomAttacks(getCustomNpcAttacks(customAttackKey));
  }, [customAttackKey]);

  async function handleRoll(
    attack: EnemyAttack,
    mode: 'attackOnly' | 'attackAndDamage' | 'damageOnly',
  ) {
    if (isRolling) return;
    const result = await onRollAttack(attack, mode);
    if (!result.attackRoll && !result.damageRoll) return;
    setRollResult({
      name: attack.name,
      attack: result.attackRoll?.total,
      damage: result.damageRoll?.total,
      mode,
    });
  }

  function addCustomAttack() {
    if (!newAttackName.trim() || !newAttackDamage.trim()) return;
    const next = [
      ...customAttacks,
      {
        name: newAttackName.trim(),
        bonus: newAttackBonus,
        damage: newAttackDamage.trim(),
        actionCost: newAttackActionCost,
      },
    ];
    setCustomAttacks(next);
    setCustomNpcAttacks(customAttackKey, next);
    setNewAttackName('');
    setNewAttackBonus(0);
    setNewAttackDamage('1d6');
    setNewAttackActionCost('action');
  }

  function removeCustomAttack(index: number) {
    const next = customAttacks.filter((_, i) => i !== index);
    setCustomAttacks(next);
    setCustomNpcAttacks(customAttackKey, next);
  }

  return (
    <div className="rounded border border-border/60 bg-card/40 p-2">
      <p className="text-xs font-medium text-foreground">{entry.name}</p>
      <p className="text-[10px] text-muted-foreground">
        {entry.type.toUpperCase()} combatant
      </p>
      <div className="mt-2 rounded border border-border/60 bg-background/25 p-2">
        <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Vitals</p>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="rounded border border-border/60 bg-background/40 px-2 py-0.5 text-muted-foreground">
            HP: <span className="font-medium text-foreground">{entry.currentHp ?? '-'}</span>
          </span>
          <span className="rounded border border-border/60 bg-background/40 px-2 py-0.5 text-muted-foreground">
            AC: <span className="font-medium text-foreground">{entry.ac ?? '-'}</span>
          </span>
        </div>
      </div>
      <div className="mt-2 rounded border border-border/60 bg-background/25 p-2">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Conditions</p>
          <span className="text-[10px] text-muted-foreground">
            {entry.conditions?.length ?? 0}
          </span>
        </div>
        {entry.conditions?.length ? (
          <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto pr-1">
            {entry.conditions.map((condition) => (
              <span
                key={condition.id}
                className="rounded border border-border/60 bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {condition.name}{condition.remainingRounds != null ? ` (${condition.remainingRounds}r)` : ''}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">None</p>
        )}
      </div>
      {entry.notes && (
        <div className="mt-2 rounded border border-border/60 bg-background/25 p-2">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Notes</p>
          <div className="max-h-20 overflow-y-auto rounded border border-border/60 bg-background/30 px-2 py-1 text-xs text-muted-foreground">
            {entry.notes}
          </div>
        </div>
      )}
      <div className="mt-2 rounded border border-border/60 bg-background/25 p-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Attacks</p>
          <button
            type="button"
            onClick={() => setShowAddAttackForm((v) => !v)}
            className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20"
            title={showAddAttackForm ? 'Hide add attack form' : 'Show add attack form'}
          >
            {showAddAttackForm ? 'Hide Form' : 'Add Attack'}
          </button>
        </div>
        {showAddAttackForm && (
          <div className="mt-1 space-y-1">
            <input
              type="text"
              value={newAttackName}
              onChange={(e) => setNewAttackName(e.target.value)}
              placeholder="Attack name"
              className="w-full rounded border border-input bg-input px-1.5 py-1 text-[10px] text-foreground"
            />
            <input
              type="number"
              value={newAttackBonus}
              onChange={(e) => setNewAttackBonus(parseInt(e.target.value, 10) || 0)}
              className="w-full rounded border border-input bg-input px-1.5 py-1 text-[10px] text-foreground"
              placeholder="To-hit bonus"
              title="To-hit bonus"
            />
            <input
              type="text"
              value={newAttackDamage}
              onChange={(e) => setNewAttackDamage(e.target.value)}
              placeholder="Damage (e.g. 1d8+3)"
              className="w-full rounded border border-input bg-input px-1.5 py-1 text-[10px] text-foreground"
            />
            <select
              value={newAttackActionCost}
              onChange={(e) => setNewAttackActionCost(e.target.value as ActionCostType)}
              className="w-full rounded border border-input bg-input px-1.5 py-1 text-[10px] text-foreground"
            >
              <option value="action">Action</option>
              <option value="bonus">Bonus Action</option>
              <option value="reaction">Reaction</option>
              <option value="free">Free</option>
            </select>
            <button
              type="button"
              onClick={addCustomAttack}
              className="w-full rounded border border-primary/40 bg-primary/10 px-1.5 py-1 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20"
              title="Add custom attack"
            >
              Save Attack
            </button>
          </div>
        )}
        {resolvedAttacks.length ? (
          <div className="mt-1 max-h-44 space-y-1 overflow-y-auto pr-0.5">
            {resolvedAttacks.map((attack, i) => {
              const blockedReason = spendBlockedReason(attack.actionCost ?? 'action');
              return (
              <div key={`${attack.name}-${i}`} className="rounded border border-border/60 bg-background/30 px-2 py-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{attack.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {attack.bonus >= 0 ? '+' : ''}{attack.bonus} to hit · {attack.damage} · {formatActionCostLabel(attack.actionCost ?? 'action')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => void handleRoll(attack, 'attackOnly')}
                      disabled={isRolling || !canSpendCost(attack.actionCost ?? 'action')}
                      className="inline-flex items-center gap-1 rounded border border-brass/40 bg-brass/10 px-1.5 py-0.5 text-[10px] text-brass hover:bg-brass/20 disabled:opacity-50"
                      title={blockedReason ?? `Roll ${attack.name} attack only`}
                    >
                      {isRolling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Dice5 className="h-3 w-3" />}
                      Roll Attack Only
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRoll(attack, 'attackAndDamage')}
                      disabled={isRolling || !canSpendCost(attack.actionCost ?? 'action')}
                      className="inline-flex items-center gap-1 rounded border border-brass/40 bg-brass/10 px-1.5 py-0.5 text-[10px] text-brass hover:bg-brass/20 disabled:opacity-50"
                      title={blockedReason ?? `Roll ${attack.name} attack and damage`}
                    >
                      {isRolling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Dice5 className="h-3 w-3" />}
                      Roll Attack + Damage
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRoll(attack, 'damageOnly')}
                      disabled={isRolling}
                      className="inline-flex items-center gap-1 rounded border border-brass/40 bg-brass/10 px-1.5 py-0.5 text-[10px] text-brass hover:bg-brass/20 disabled:opacity-50"
                      title={`Roll ${attack.name} damage only`}
                    >
                      {isRolling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Dice5 className="h-3 w-3" />}
                      Roll Damage Only
                    </button>
                    {i >= (template?.attacks.length ?? 0) && (
                      <button
                        type="button"
                        onClick={() => removeCustomAttack(i - (template?.attacks.length ?? 0))}
                        className="rounded border border-destructive/30 bg-destructive/10 px-1 py-0.5 text-[10px] text-destructive hover:bg-destructive/20"
                        title="Remove custom attack"
                      >
                        X
                      </button>
                    )}
                  </div>
                </div>
                {blockedReason && (
                  <p className="mt-1 text-[10px] text-muted-foreground">{blockedReason}</p>
                )}
                {rollResult?.name === attack.name && (
                  <div className="mt-1 rounded border border-border/60 bg-card/50 px-2 py-1 text-[10px] text-muted-foreground">
                    {rollResult.attack != null ? `Attack ${rollResult.attack}` : ''}
                    {rollResult.attack != null && rollResult.damage != null ? ' · ' : ''}
                    {rollResult.damage != null ? `Damage ${rollResult.damage}` : ''}
                    {rollResult.mode === 'damageOnly' && rollResult.damage == null ? 'No damage dice found' : ''}
                  </div>
                )}
              </div>
            )})}
          </div>
        ) : (
          <p className="mt-1 text-[10px] text-muted-foreground">
            No mapped enemy attacks for this participant yet.
          </p>
        )}
      </div>
    </div>
  );
}

function ActionEconomyPanel({
  budget,
  onToggleAction,
  onToggleBonus,
  onToggleReaction,
  onSetMovement,
  onResetTurn,
}: {
  budget: ActionBudgetState;
  onToggleAction: () => void;
  onToggleBonus: () => void;
  onToggleReaction: () => void;
  onSetMovement: (value: number) => void;
  onResetTurn: () => void;
}) {
  return (
    <div className="rounded border border-border/60 bg-background/25 p-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Action Economy</p>
        <button
          type="button"
          onClick={onResetTurn}
          className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Reset Turn
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={onToggleAction}
          className={`rounded border px-2 py-0.5 text-[10px] ${
            budget.actionUsed
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          }`}
        >
          Action: {budget.actionUsed ? 'Used' : 'Ready'}
        </button>
        <button
          type="button"
          onClick={onToggleBonus}
          className={`rounded border px-2 py-0.5 text-[10px] ${
            budget.bonusUsed
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          }`}
        >
          Bonus: {budget.bonusUsed ? 'Used' : 'Ready'}
        </button>
        <button
          type="button"
          onClick={onToggleReaction}
          className={`rounded border px-2 py-0.5 text-[10px] ${
            budget.reactionUsed
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          }`}
        >
          Reaction: {budget.reactionUsed ? 'Used' : 'Ready'}
        </button>
      </div>
      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Movement</span>
          <span>{budget.movementUsed}/{budget.movementMax}</span>
        </div>
        <input
          type="range"
          min={0}
          max={budget.movementMax}
          value={budget.movementUsed}
          onChange={(e) => onSetMovement(parseInt(e.target.value, 10) || 0)}
          className="w-full"
        />
      </div>
    </div>
  );
}

function HpControlsCard({
  currentHp,
  maxHp,
  tempHp,
  tempHpIsLocal,
  canEdit,
  onApplyDamage,
  onApplyHeal,
  onSetTempHp,
}: {
  currentHp: number;
  maxHp: number;
  tempHp: number;
  tempHpIsLocal: boolean;
  canEdit: boolean;
  onApplyDamage: (amount: number) => Promise<void> | void;
  onApplyHeal: (amount: number) => Promise<void> | void;
  onSetTempHp: (value: number) => Promise<void> | void;
}) {
  const [damageInput, setDamageInput] = useState(0);
  const [healInput, setHealInput] = useState(0);
  const [tempInput, setTempInput] = useState(tempHp);

  useEffect(() => {
    setTempInput(tempHp);
  }, [tempHp]);

  return (
    <div className="rounded border border-border/60 bg-background/25 p-2">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">HP Controls</p>
      <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded border border-border/60 bg-background/40 px-2 py-0.5 text-muted-foreground">
          HP: <span className="font-medium text-foreground">{currentHp}/{maxHp}</span>
        </span>
        <span className="rounded border border-border/60 bg-background/40 px-2 py-0.5 text-muted-foreground">
          Temp HP{tempHpIsLocal ? ' (local)' : ''}: <span className="font-medium text-foreground">{tempHp}</span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <div className="space-y-1">
          <input
            type="number"
            min={0}
            value={damageInput}
            onChange={(e) => setDamageInput(parseInt(e.target.value, 10) || 0)}
            className="w-full rounded border border-input bg-input px-1.5 py-1 text-[10px] text-foreground"
            placeholder="Damage"
            disabled={!canEdit}
          />
          <button
            type="button"
            onClick={() => void onApplyDamage(damageInput)}
            disabled={!canEdit || damageInput <= 0}
            className="w-full rounded border border-destructive/35 bg-destructive/10 px-1.5 py-1 text-[10px] uppercase tracking-wider text-destructive hover:bg-destructive/20 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
        <div className="space-y-1">
          <input
            type="number"
            min={0}
            value={healInput}
            onChange={(e) => setHealInput(parseInt(e.target.value, 10) || 0)}
            className="w-full rounded border border-input bg-input px-1.5 py-1 text-[10px] text-foreground"
            placeholder="Heal"
            disabled={!canEdit}
          />
          <button
            type="button"
            onClick={() => void onApplyHeal(healInput)}
            disabled={!canEdit || healInput <= 0}
            className="w-full rounded border border-emerald-500/35 bg-emerald-500/10 px-1.5 py-1 text-[10px] uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
        <div className="space-y-1">
          <input
            type="number"
            min={0}
            value={tempInput}
            onChange={(e) => setTempInput(parseInt(e.target.value, 10) || 0)}
            className="w-full rounded border border-input bg-input px-1.5 py-1 text-[10px] text-foreground"
            placeholder="Temp HP"
            disabled={!canEdit}
          />
          <button
            type="button"
            onClick={() => void onSetTempHp(tempInput)}
            disabled={!canEdit || tempInput < 0}
            className="w-full rounded border border-primary/35 bg-primary/10 px-1.5 py-1 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20 disabled:opacity-50"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
}

function PcFocusCard({
  characterName,
  attacks,
  isRolling,
  canSpendCost,
  spendBlockedReason,
  onRollAttack,
}: {
  characterName: string;
  attacks: CharacterAttack[];
  isRolling: boolean;
  canSpendCost: (cost: ActionCostType) => boolean;
  spendBlockedReason: (cost: ActionCostType) => string | null;
  onRollAttack: (
    attack: CharacterAttack,
    mode: 'attackOnly' | 'attackAndDamage' | 'damageOnly',
  ) => Promise<{ attackRoll: { total: number } | null; damageRoll: { total: number } | null }>;
}) {
  const [rollResult, setRollResult] = useState<{
    id: string;
    attack?: number;
    damage?: number;
  } | null>(null);

  async function handleRoll(
    attack: CharacterAttack,
    mode: 'attackOnly' | 'attackAndDamage' | 'damageOnly',
  ) {
    if (isRolling) return;
    const result = await onRollAttack(attack, mode);
    if (!result.attackRoll && !result.damageRoll) return;
    setRollResult({
      id: attack.id,
      attack: result.attackRoll?.total,
      damage: result.damageRoll?.total,
    });
  }

  return (
    <div className="rounded border border-border/60 bg-card/40 p-2">
      <p className="text-xs font-medium text-foreground">{characterName}</p>
      <p className="text-[10px] text-muted-foreground">PC combat actions</p>
      <div className="mt-2 max-h-52 space-y-1 overflow-y-auto pr-0.5">
        {attacks.length === 0 && (
          <p className="text-[10px] text-muted-foreground">No attacks configured for this character.</p>
        )}
        {attacks.map((attack) => {
          const blockedReason = spendBlockedReason(attack.actionCost ?? 'action');
          return (
          <div key={attack.id} className="rounded border border-border/60 bg-background/30 px-2 py-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{attack.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {attack.attackBonus >= 0 ? '+' : ''}{attack.attackBonus} to hit · {attack.damageDice}{attack.damageBonus !== 0 ? `${attack.damageBonus >= 0 ? '+' : ''}${attack.damageBonus}` : ''} · {formatActionCostLabel(attack.actionCost ?? 'action')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => void handleRoll(attack, 'attackOnly')}
                  disabled={isRolling || !canSpendCost(attack.actionCost ?? 'action')}
                  className="inline-flex items-center gap-1 rounded border border-brass/40 bg-brass/10 px-1.5 py-0.5 text-[10px] text-brass hover:bg-brass/20 disabled:opacity-50"
                  title={blockedReason ?? `Roll ${attack.name} attack only`}
                >
                  {isRolling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Dice5 className="h-3 w-3" />}
                  Roll Attack Only
                </button>
                <button
                  type="button"
                  onClick={() => void handleRoll(attack, 'attackAndDamage')}
                  disabled={isRolling || !canSpendCost(attack.actionCost ?? 'action')}
                  className="inline-flex items-center gap-1 rounded border border-brass/40 bg-brass/10 px-1.5 py-0.5 text-[10px] text-brass hover:bg-brass/20 disabled:opacity-50"
                  title={blockedReason ?? `Roll ${attack.name} attack and damage`}
                >
                  {isRolling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Dice5 className="h-3 w-3" />}
                  Roll Attack + Damage
                </button>
                <button
                  type="button"
                  onClick={() => void handleRoll(attack, 'damageOnly')}
                  disabled={isRolling}
                  className="inline-flex items-center gap-1 rounded border border-brass/40 bg-brass/10 px-1.5 py-0.5 text-[10px] text-brass hover:bg-brass/20 disabled:opacity-50"
                  title={`Roll ${attack.name} damage only`}
                >
                  {isRolling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Dice5 className="h-3 w-3" />}
                  Roll Damage Only
                </button>
              </div>
            </div>
            {blockedReason && (
              <p className="mt-1 text-[10px] text-muted-foreground">{blockedReason}</p>
            )}
            {rollResult?.id === attack.id && (
              <div className="mt-1 rounded border border-border/60 bg-card/50 px-2 py-1 text-[10px] text-muted-foreground">
                {rollResult.attack != null ? `Attack ${rollResult.attack}` : ''}
                {rollResult.attack != null && rollResult.damage != null ? ' · ' : ''}
                {rollResult.damage != null ? `Damage ${rollResult.damage}` : ''}
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}

function getCustomNpcAttacks(key: string): EnemyAttack[] {
  try {
    const raw = localStorage.getItem('fablheim:npc-custom-attacks');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, EnemyAttack[]>;
    return (parsed[key] ?? []).map((attack) => ({
      ...attack,
      actionCost: attack.actionCost ?? 'action',
    }));
  } catch {
    return [];
  }
}

function setCustomNpcAttacks(key: string, attacks: EnemyAttack[]): void {
  try {
    const raw = localStorage.getItem('fablheim:npc-custom-attacks');
    const parsed = raw ? (JSON.parse(raw) as Record<string, EnemyAttack[]>) : {};
    parsed[key] = attacks.map((attack) => ({
      name: attack.name.trim(),
      bonus: Number.isFinite(attack.bonus) ? attack.bonus : 0,
      damage: attack.damage.trim(),
      actionCost: attack.actionCost ?? 'action',
      range: attack.range?.trim() || undefined,
      description: attack.description?.trim() || undefined,
    }));
    localStorage.setItem('fablheim:npc-custom-attacks', JSON.stringify(parsed));
  } catch {
    // Ignore local storage failures
  }
}

function tabClass(active: boolean): string {
  return `inline-flex h-9 items-center justify-center rounded-md border text-muted-foreground transition-colors ${
    active
      ? 'border-primary/40 bg-primary/15 text-primary'
      : 'border-border/60 bg-background/40 hover:text-foreground'
  }`;
}

function QuickAIActions({
  activeTab,
  onOpenTool,
}: {
  activeTab: DMTab;
  onOpenTool: (tool: AIFocusTool) => void;
}) {
  if (activeTab !== 'world' && activeTab !== 'encounters') {
    return null;
  }

  return (
    <div className="mb-2 rounded border border-primary/30 bg-primary/5 p-2">
      <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Quick AI actions</div>
      {activeTab === 'world' ? (
        <div className="grid grid-cols-3 gap-1">
          <button type="button" className="rounded bg-background/60 px-2 py-1 text-xs hover:bg-background" onClick={() => onOpenTool('npc')}>
            NPC
          </button>
          <button type="button" className="rounded bg-background/60 px-2 py-1 text-xs hover:bg-background" onClick={() => onOpenTool('location')}>
            Location
          </button>
          <button type="button" className="rounded bg-background/60 px-2 py-1 text-xs hover:bg-background" onClick={() => onOpenTool('quest')}>
            Quest
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1">
          <button type="button" className="rounded bg-background/60 px-2 py-1 text-xs hover:bg-background" onClick={() => onOpenTool('encounter')}>
            Encounter
          </button>
        </div>
      )}
    </div>
  );
}

function CompactWorldPanel({ campaignId }: { campaignId: string }) {
  const { data, isLoading } = useWorldEntities(campaignId);
  const createEntity = useCreateWorldEntity();
  const [quickType, setQuickType] = useState<'npc' | 'location' | 'quest' | null>(null);
  const [quickName, setQuickName] = useState('');
  const entities = data ?? [];

  const counts = entities.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  function handleQuickCreate() {
    if (!quickType || !quickName.trim() || createEntity.isPending) return;
    createEntity.mutate(
      {
        campaignId,
        data: {
          name: quickName.trim(),
          type: quickType === 'npc' ? 'npc' : quickType === 'quest' ? 'quest' : 'location',
        },
      },
      {
        onSuccess: () => {
          toast.success(`${quickType === 'npc' ? 'NPC' : quickType === 'quest' ? 'Quest' : 'Location'} created`);
          setQuickType(null);
          setQuickName('');
        },
        onError: () => toast.error('Failed to create world entry'),
      },
    );
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1 rounded border border-border/60 bg-background/30 p-2">
        <div className="flex gap-1">
          <button type="button" className={miniSelect(quickType === 'npc')} onClick={() => setQuickType('npc')}>
            + NPC
          </button>
          <button type="button" className={miniSelect(quickType === 'location')} onClick={() => setQuickType('location')}>
            + Location
          </button>
          <button type="button" className={miniSelect(quickType === 'quest')} onClick={() => setQuickType('quest')}>
            + Quest
          </button>
        </div>
        {quickType ? (
          <div className="flex gap-1">
            <input
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder={quickType === 'npc' ? 'NPC name...' : quickType === 'quest' ? 'Quest name...' : 'Location name...'}
              className="min-w-0 flex-1 rounded border border-input bg-input px-2 py-1 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate()}
            />
            <button
              type="button"
              className="rounded bg-primary/20 px-2 py-1 text-xs text-primary disabled:opacity-50"
              disabled={!quickName.trim() || createEntity.isPending}
              onClick={handleQuickCreate}
            >
              Add
            </button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <CompactLoadingRows />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1">
            <CountPill label="NPCs" value={countByTypes(counts, ['npc', 'npc_minor'])} />
            <CountPill label="Locations" value={countByTypes(counts, ['location', 'location_detail'])} />
            <CountPill label="Quests" value={countByTypes(counts, ['quest'])} />
            <CountPill label="Lore" value={countByTypes(counts, ['lore'])} />
          </div>
          <div className="space-y-1">
            {entities.length === 0 ? (
              <CompactEmptyState text="No world entries yet." />
            ) : (
              entities.slice(0, 10).map((entity) => (
                <CompactListRow key={entity._id} name={entity.name} meta={labelForType(entity.type)} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CompactEncountersPanel({
  campaignId,
  selectedEntry,
  onClearSelectedEntry,
}: {
  campaignId: string;
  selectedEntry?: InitiativeEntry | null;
  onClearSelectedEntry?: () => void;
}) {
  const { data, isLoading } = useEncounters(campaignId);
  const [creating, setCreating] = useState(false);
  const encounters = data ?? [];

  const ready = encounters.filter((e) => e.status === 'ready').length;
  const used = encounters.filter((e) => e.status === 'used').length;

  if (creating) {
    return (
      <InlineEncounterBuilder
        campaignId={campaignId}
        compact
        onDone={() => setCreating(false)}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded border border-border/60 bg-background/30 p-2">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Selected Participant</span>
          {selectedEntry && onClearSelectedEntry && (
            <button
              type="button"
              onClick={onClearSelectedEntry}
              className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        {selectedEntry ? (
          <div className="rounded border border-primary/30 bg-primary/10 px-2 py-1.5">
            <p className="truncate text-xs font-medium text-foreground">{selectedEntry.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {selectedEntry.type.toUpperCase()} · Init {selectedEntry.initiativeRoll}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Select a token or initiative entry to pin it.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setCreating(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-2 py-1.5 text-xs text-primary hover:bg-primary/15 transition-colors font-[Cinzel] uppercase tracking-wider"
      >
        <Plus className="h-3.5 w-3.5" />
        Create Encounter
      </button>

      {isLoading ? (
        <CompactLoadingRows />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1">
            <CountPill label="Ready" value={ready} />
            <CountPill label="Draft" value={encounters.length - ready - used} />
            <CountPill label="Used" value={used} />
          </div>
          <div className="space-y-1">
            {encounters.length === 0 ? (
              <CompactEmptyState text="No encounters created." />
            ) : (
              encounters.slice(0, 10).map((encounter) => (
                <CompactListRow
                  key={encounter._id}
                  name={encounter.name}
                  meta={`${encounter.difficulty} · ${encounter.estimatedXP ?? 0} XP`}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CompactNotesPanel({ campaignId }: { campaignId: string }) {
  const { data, isLoading } = useNotebook(campaignId, { limit: 12 });
  const createNote = useCreateNote();
  const [newTitle, setNewTitle] = useState('');
  const notes = data?.notes ?? [];

  function handleAddNote() {
    if (!newTitle.trim() || createNote.isPending) return;
    createNote.mutate(
      { campaignId, title: newTitle.trim(), category: 'session_notes' },
      {
        onSuccess: () => {
          toast.success('Note created');
          setNewTitle('');
        },
        onError: () => toast.error('Failed to create note'),
      },
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded border border-border/60 bg-background/30 p-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Quick note title..."
          className="min-w-0 flex-1 rounded border border-input bg-input px-2 py-1 text-xs"
          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
        />
        <button
          type="button"
          className="rounded bg-primary/20 px-2 py-1 text-xs text-primary disabled:opacity-50"
          disabled={!newTitle.trim() || createNote.isPending}
          onClick={handleAddNote}
        >
          Add
        </button>
      </div>

      {isLoading ? (
        <CompactLoadingRows />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1">
            <CountPill label="Pinned" value={notes.filter((n) => n.isPinned).length} />
            <CountPill label="General" value={notes.filter((n) => n.category === 'general').length} />
          </div>
          <div className="space-y-1">
            {notes.length === 0 ? (
              <CompactEmptyState text="No notes created." />
            ) : (
              notes.slice(0, 10).map((note) => (
                <CompactListRow
                  key={note._id}
                  name={note.title}
                  meta={note.category.replace('_', ' ')}
                  accent={note.isPinned}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}



function miniSelect(active: boolean): string {
  return `rounded px-2 py-1 text-xs ${active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`;
}

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border/60 bg-background/40 px-2 py-1">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function CompactListRow({
  name,
  meta,
  accent,
}: {
  name: string;
  meta?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 rounded border border-border/60 bg-background/30 px-2 py-1.5">
      <MapPin className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">{name}</p>
        {meta ? <p className="truncate text-xs text-muted-foreground">{meta}</p> : null}
      </div>
    </div>
  );
}

function CompactLoadingRows() {
  return (
    <div className="space-y-1.5 animate-pulse">
      <div className="h-10 rounded bg-muted/60" />
      <div className="h-10 rounded bg-muted/60" />
      <div className="h-10 rounded bg-muted/60" />
    </div>
  );
}

function CompactEmptyState({ text }: { text: string }) {
  return <p className="rounded border border-dashed border-border/60 p-2 text-center text-xs text-muted-foreground">{text}</p>;
}

function countByTypes(counts: Record<string, number>, types: WorldEntityType[]): number {
  return types.reduce((sum, type) => sum + (counts[type] ?? 0), 0);
}

function labelForType(type: WorldEntityType): string {
  switch (type) {
    case 'npc':
    case 'npc_minor':
      return 'NPC';
    case 'location':
    case 'location_detail':
      return 'Location';
    case 'quest':
      return 'Quest';
    case 'lore':
      return 'Lore';
    case 'item':
      return 'Item';
    case 'faction':
      return 'Faction';
    case 'event':
      return 'Event';
    default:
      return 'Entry';
  }
}
