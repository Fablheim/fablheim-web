import { useEffect, useMemo, useRef, useState } from 'react';
import { Pin, PinOff, Swords, Heart, SkipForward, Wand2, Crosshair, Timer, Pause } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCombatRules,
  useInitiative,
  useNextTurn,
  useUpdateInitiativeEntry,
  useWoundAdvance,
  useWoundReduce,
} from '@/hooks/useLiveSession';
import { useSessionWorkspaceState } from '@/components/session/SessionWorkspaceState';
import { ApplyDamageModal } from '@/components/session/ApplyDamageModal';
import { ActionEconomySlots } from '@/components/session/ActionEconomySlots';
import { ConcentrationBadge } from '@/components/session/ConcentrationBadge';
import { LegendaryActionsPanel } from '@/components/session/LegendaryActionsPanel';
import { DamageModTags } from '@/components/session/DamageModTags';
import { DeathSavesTracker } from '@/components/session/DeathSavesTracker';
import { DownedStatePanel } from '@/components/session/DownedStatePanel';
import { ActionListPanel } from '@/components/session/ActionListPanel';
import { HeroPointsTracker } from '@/components/session/HeroPointsTracker';
import { TabbedSection } from '@/components/ui/TabbedSection';
import {
  checkSystemDataSize,
  setConditionValue,
  toggleConditionValue,
} from '@/lib/system-data';
import { useCampaignModuleEnabled } from '@/hooks/useModuleEnabled';
import type { InitiativeEntry, ConditionEntry } from '@/types/live-session';

interface FocusCardProps {
  campaignId: string;
  isDM: boolean;
  entryOverride?: InitiativeEntry | null;
}

interface FocusActionEventDetail {
  action: 'damage' | 'heal' | 'conditions' | 'attack';
}

const TAB_KEY = 'vtt.rightPanel.activeTab';
const NOTES_KEY = 'vtt.rightPanel.notesByEntry';

type FocusTabId = 'effects' | 'mods' | 'notes' | 'abilities';

export function FocusCard({ campaignId, isDM, entryOverride }: FocusCardProps) {
  const { data: initiative } = useInitiative(campaignId);
  const { data: rules } = useCombatRules(campaignId);
  const nextTurn = useNextTurn(campaignId);
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const woundAdvance = useWoundAdvance(campaignId);
  const woundReduce = useWoundReduce(campaignId);
  const {
    focusedEntryId,
    selectedEntryId,
    isPinned,
    pinSelection,
    unpinSelection,
    currentTurnEntryId,
  } = useSessionWorkspaceState();

  const hasHeroPoints = useCampaignModuleEnabled(campaignId, 'hero-points');
  const hasConcentration = useCampaignModuleEnabled(campaignId, 'concentration-check');
  const hasLegendaryActions = useCampaignModuleEnabled(campaignId, 'legendary-actions');
  const hasSurprise = useCampaignModuleEnabled(campaignId, 'surprise-rounds');
  const hasDualHp = useCampaignModuleEnabled(campaignId, 'hp-dual');
  const hasArmorSlots = useCampaignModuleEnabled(campaignId, 'armor-slots');
  const hasReadiedActions = useCampaignModuleEnabled(campaignId, 'readied-actions');
  const hasWoundLevels = useCampaignModuleEnabled(campaignId, 'wound-levels');
  const [modalMode, setModalMode] = useState<'damage' | 'heal' | 'temp-hp' | null>(null);
  const [activeTab, setActiveTab] = useState<FocusTabId>(() => {
    const saved = window.localStorage.getItem(TAB_KEY);
    return saved === 'mods' || saved === 'notes' || saved === 'abilities' ? saved : 'effects';
  });
  const [notesByEntry, setNotesByEntry] = useState<Record<string, string>>(() => {
    try {
      const raw = window.localStorage.getItem(NOTES_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  });
  const [notesDraft, setNotesDraft] = useState('');
  const [configuringCondition, setConfiguringCondition] = useState<string | null>(null);
  const [condDraftRounds, setCondDraftRounds] = useState('');
  const [condDraftEndsOn, setCondDraftEndsOn] = useState<'start' | 'end'>('end');
  const [condDraftSource, setCondDraftSource] = useState('');
  const effectsConditionsRef = useRef<HTMLDivElement>(null);

  const stateFocusedEntry = useMemo(
    () => (focusedEntryId ? initiative?.entries.find((entry) => entry.id === focusedEntryId) ?? null : null),
    [focusedEntryId, initiative?.entries],
  );
  const turnFallbackEntry = useMemo(
    () => (currentTurnEntryId ? initiative?.entries.find((entry) => entry.id === currentTurnEntryId) ?? null : null),
    [currentTurnEntryId, initiative?.entries],
  );
  const focusedEntry = entryOverride ?? stateFocusedEntry ?? turnFallbackEntry;
  const isFollowingTurn = !isPinned && focusedEntry?.id === currentTurnEntryId;

  useEffect(() => {
    window.localStorage.setItem(TAB_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    window.localStorage.setItem(NOTES_KEY, JSON.stringify(notesByEntry));
  }, [notesByEntry]);

  useEffect(() => {
    if (!focusedEntry) return;
    setNotesDraft(notesByEntry[focusedEntry.id] ?? '');
  }, [focusedEntry, notesByEntry]);

  useEffect(() => {
    function handleFocusAction(event: Event) {
      const custom = event as CustomEvent<FocusActionEventDetail>;
      const action = custom.detail?.action;
      if (!action) return;
      if (action === 'damage') setModalMode('damage');
      if (action === 'heal') setModalMode('heal');
      if (action === 'conditions') {
        setActiveTab('effects');
        requestAnimationFrame(() => {
          effectsConditionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      if (action === 'attack') setActiveTab('abilities');
    }
    window.addEventListener('fablheim:focus-action', handleFocusAction as EventListener);
    return () => {
      window.removeEventListener('fablheim:focus-action', handleFocusAction as EventListener);
    };
  }, []);

  if (!focusedEntry) {
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        No focused entry available.
      </div>
    );
  }

  const entry = focusedEntry;
  const hpNow = entry.currentHp ?? 0;
  const hpMax = entry.maxHp ?? 0;
  const hpPct = hpMax > 0 ? Math.max(0, Math.min(100, (hpNow / hpMax) * 100)) : 0;
  const stressCurrent = (entry.systemData?.stress as number) ?? 0;
  const stressThreshold = (entry.systemData?.stressThreshold as number) ?? 0;
  const stressPct = stressThreshold > 0 ? Math.max(0, Math.min(100, (stressCurrent / stressThreshold) * 100)) : 0;
  const armorSlots = (entry.systemData?.armorSlots as { total: number; used: number }) ?? null;
  const normalizedConditions = entry.conditions ?? [];
  const conditionNames = new Set(normalizedConditions.map((c) => c.name));

  const tabs: Array<{ id: FocusTabId; label: string }> = [
    { id: 'effects', label: 'Effects' },
    { id: 'mods', label: 'Mods' },
    { id: 'notes', label: 'Notes' },
    { id: 'abilities', label: 'Abilities' },
  ];

  function makeConditionEntry(
    name: string,
    opts?: { durationRounds?: number; endsOn?: 'start' | 'end'; source?: string },
  ): ConditionEntry {
    // eslint-disable-next-line react-hooks/purity -- ID generation is intentionally unique per call
    const cond: ConditionEntry = { id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name };
    if (opts?.durationRounds) {
      cond.durationRounds = opts.durationRounds;
      cond.remainingRounds = opts.durationRounds;
      cond.endsOn = opts.endsOn ?? 'end';
      cond.appliedRound = initiative?.round;
    }
    if (opts?.source) cond.source = opts.source;
    return cond;
  }

  function handleToggleCondition(conditionKey: string) {
    const current = entry.conditions ?? [];
    const isActive = conditionNames.has(conditionKey);
    const nextConditions: ConditionEntry[] = isActive
      ? current.filter((c) => c.name !== conditionKey)
      : [...current, makeConditionEntry(conditionKey)];
    const nextSystemData = toggleConditionValue(entry.systemData, conditionKey, !isActive);
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
      body: {
        conditions: nextConditions,
        systemData: nextSystemData,
      },
    });
  }

  function handleSetConditionValue(conditionKey: string, value: number) {
    const normalizedValue = Math.max(1, Math.floor(value || 1));
    const nextSystemData = setConditionValue(entry.systemData, conditionKey, normalizedValue);
    const current = entry.conditions ?? [];
    const nextConditions: ConditionEntry[] = conditionNames.has(conditionKey)
      ? [...current]
      : [...current, makeConditionEntry(conditionKey)];
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
      body: {
        conditions: nextConditions,
        systemData: nextSystemData,
      },
    });
  }

  function handleConditionsQuickAction() {
    setActiveTab('effects');
    requestAnimationFrame(() => {
      effectsConditionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleConditionClick(conditionKey: string) {
    if (conditionNames.has(conditionKey)) {
      handleToggleCondition(conditionKey);
      return;
    }
    if (configuringCondition === conditionKey) {
      setConfiguringCondition(null);
    } else {
      setConfiguringCondition(conditionKey);
      setCondDraftRounds('');
      setCondDraftEndsOn('end');
      setCondDraftSource('');
    }
  }

  function handleApplyConditionWithDuration() {
    if (!configuringCondition) return;
    const rounds = parseInt(condDraftRounds, 10);
    const opts: { durationRounds?: number; endsOn?: 'start' | 'end'; source?: string } = {};
    if (rounds > 0) {
      opts.durationRounds = rounds;
      opts.endsOn = condDraftEndsOn;
    }
    if (condDraftSource.trim()) opts.source = condDraftSource.trim();
    const current = entry.conditions ?? [];
    const nextConditions: ConditionEntry[] = [...current, makeConditionEntry(configuringCondition, opts)];
    const nextSystemData = toggleConditionValue(entry.systemData, configuringCondition, true);
    const size = checkSystemDataSize(nextSystemData);
    if (!size.ok) {
      toast.error(size.error ?? 'systemData is too large to save');
      return;
    }
    if (size.warning) toast.warning(size.warning);
    updateEntry.mutate({
      entryId: entry.id,
      body: { conditions: nextConditions, systemData: nextSystemData },
    });
    setConfiguringCondition(null);
  }

  function handleQuickAddCondition() {
    if (!configuringCondition) return;
    const current = entry.conditions ?? [];
    const nextConditions: ConditionEntry[] = [...current, makeConditionEntry(configuringCondition)];
    const nextSystemData = toggleConditionValue(entry.systemData, configuringCondition, true);
    const size = checkSystemDataSize(nextSystemData);
    if (!size.ok) {
      toast.error(size.error ?? 'systemData is too large to save');
      return;
    }
    if (size.warning) toast.warning(size.warning);
    updateEntry.mutate({
      entryId: entry.id,
      body: { conditions: nextConditions, systemData: nextSystemData },
    });
    setConfiguringCondition(null);
  }

  function handleSaveNotes() {
    setNotesByEntry((prev) => ({
      ...prev,
      [entry.id]: notesDraft,
    }));
    toast.success('Notes saved locally');
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-y-auto p-2 pb-4 pr-1">
        <div className="shrink-0 space-y-3">
          <section className="rounded-md border border-[#2a2016] bg-primary/5 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Spotlight</p>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {isFollowingTurn ? 'Current Turn Spotlight' : 'Pinned Spotlight'}
              </p>
              <div className="flex items-center gap-1">
                {selectedEntryId && (
                  <button
                    type="button"
                    onClick={() => (isPinned ? unpinSelection() : pinSelection())}
                    className="inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-accent"
                    title={isPinned ? 'Unpin selection and follow turn' : 'Pin selection'}
                  >
                    {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    {isPinned ? 'Unpin' : 'Pin'}
                  </button>
                )}
                {isDM && (
                  <>
                    <button
                      type="button"
                      onClick={() => nextTurn.mutate()}
                      disabled={nextTurn.isPending}
                      className="inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-accent disabled:opacity-50"
                    >
                      <SkipForward className="h-3 w-3" />
                      End Turn
                    </button>
                    {hasReadiedActions && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = entry.turnState === 'readied' ? 'normal' : 'readied';
                          updateEntry.mutate({ entryId: entry.id, body: {
                            turnState: next,
                            readiedAction: next === 'normal' ? undefined : entry.readiedAction,
                          } });
                        }}
                        disabled={updateEntry.isPending}
                        className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] uppercase tracking-wider disabled:opacity-50 ${
                          entry.turnState === 'readied'
                            ? 'border-amber-500/50 bg-amber-500/15 text-amber-400'
                            : 'border-border/60 text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        <Timer className="h-3 w-3" />
                        {entry.turnState === 'readied' ? 'Readied' : 'Ready'}
                      </button>
                    )}
                    {hasReadiedActions && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = entry.turnState === 'delayed' ? 'normal' : 'delayed';
                          updateEntry.mutate({ entryId: entry.id, body: { turnState: next } });
                        }}
                        disabled={updateEntry.isPending}
                        className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] uppercase tracking-wider disabled:opacity-50 ${
                          entry.turnState === 'delayed'
                            ? 'border-blue-500/50 bg-blue-500/15 text-blue-400'
                            : 'border-border/60 text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        <Pause className="h-3 w-3" />
                        {entry.turnState === 'delayed' ? 'Delayed' : 'Delay'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Surprised indicator — gated on surprise-rounds module */}
            {hasSurprise && entry.isSurprised && (
              <div className="mb-2 rounded border border-gray-500/30 bg-gray-500/10 px-2 py-1.5 text-xs text-gray-400">
                <span className="font-[Cinzel] text-[10px] uppercase tracking-wider">Surprised</span>
                <p className="mt-0.5 italic text-gray-400/70">Cannot take actions or reactions this round</p>
              </div>
            )}

            {/* Readied action indicator */}
            {entry.turnState === 'readied' && (
              <div className="mb-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-300">
                <span className="font-[Cinzel] text-[10px] uppercase tracking-wider">Readied Action</span>
                {entry.readiedAction ? (
                  <p className="mt-0.5">{entry.readiedAction.action} — <span className="italic text-amber-400/70">Trigger: {entry.readiedAction.trigger}</span></p>
                ) : (
                  <p className="mt-0.5 italic text-amber-400/50">No action specified</p>
                )}
              </div>
            )}
            {entry.turnState === 'delayed' && (
              <div className="mb-2 rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1.5 text-xs text-blue-300">
                <span className="font-[Cinzel] text-[10px] uppercase tracking-wider">Turn Delayed</span>
              </div>
            )}

            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-sm font-bold text-primary">
                {entry.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{entry.name}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {entry.type} · Init {entry.initiativeRoll}
                </p>
              </div>
            </div>

            {entry.currentHp != null && entry.maxHp != null && (
              <div className="mb-2">
                <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>HP</span>
                  <span className="tabular-nums">{entry.currentHp}/{entry.maxHp}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${hpPct}%` }} />
                </div>
              </div>
            )}

            {hasDualHp && stressThreshold > 0 && (
              <div className="mb-2">
                <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Stress</span>
                  <span className="tabular-nums">{stressCurrent}/{stressThreshold}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${stressPct >= 100 ? 'bg-red-500' : stressPct >= 75 ? 'bg-amber-500' : 'bg-purple-500'}`}
                    style={{ width: `${stressPct}%` }}
                  />
                </div>
              </div>
            )}

            {hasArmorSlots && armorSlots && armorSlots.total > 0 && (
              <div className="mb-2">
                <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Armor Slots</span>
                  <span className="tabular-nums">{armorSlots.total - armorSlots.used}/{armorSlots.total}</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: armorSlots.total }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-full border ${
                        i < armorSlots.total - armorSlots.used
                          ? 'border-amber-500/60 bg-amber-500/40'
                          : 'border-muted-foreground/30 bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {hasWoundLevels && renderWoundLevel(entry, isDM, woundAdvance, woundReduce)}

            <div className="mb-2 flex flex-wrap gap-1">
              {normalizedConditions.length === 0 && (
                <span className="text-[10px] text-muted-foreground">No active conditions</span>
              )}
              {normalizedConditions.slice(0, 6).map((cond) => {
                const label = rules?.conditions.find((c) => c.key === cond.name)?.label ?? cond.name;
                const value = entry.systemData?.conditions?.[cond.name];
                const durationLabel = cond.remainingRounds != null ? ` (${cond.remainingRounds}r)` : '';
                return (
                  <span key={cond.id} className={`rounded-full px-2 py-0.5 text-[10px] ${cond.remainingRounds != null && cond.remainingRounds <= 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-arcane/20 text-arcane'}`}>
                    {label}{value != null ? ` ${value}` : ''}{durationLabel}
                  </span>
                );
              })}
              {normalizedConditions.length > 6 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  +{normalizedConditions.length - 6}
                </span>
              )}
            </div>

            {isDM && (
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setModalMode('damage')}
                  className="inline-flex items-center gap-1 rounded border border-destructive/35 bg-destructive/10 px-2 py-1 text-[10px] uppercase tracking-wider text-destructive hover:bg-destructive/20"
                >
                  <Swords className="h-3 w-3" />
                  Damage
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('heal')}
                  className="inline-flex items-center gap-1 rounded border border-emerald-500/35 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20"
                >
                  <Heart className="h-3 w-3" />
                  Heal
                </button>
                <button
                  type="button"
                  onClick={handleConditionsQuickAction}
                  className="inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-accent"
                >
                  <Wand2 className="h-3 w-3" />
                  Conditions
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('abilities')}
                  className="inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-accent"
                >
                  <Crosshair className="h-3 w-3" />
                  Attack
                </button>
                <button
                  type="button"
                  onClick={() => nextTurn.mutate()}
                  disabled={nextTurn.isPending}
                  className="inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-accent disabled:opacity-50"
                >
                  <SkipForward className="h-3 w-3" />
                  End Turn
                </button>
              </div>
            )}
          </section>

          <section className="rounded-md border border-[#2a2016] bg-background/30 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Stats</p>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded border border-border/60 bg-background/40 px-2 py-0.5">
                HP: {entry.currentHp ?? '-'} / {entry.maxHp ?? '-'}
              </span>
              <span className="rounded border border-border/60 bg-background/40 px-2 py-0.5">
                Temp: {entry.tempHp ?? 0}
              </span>
              {hasDualHp && stressThreshold > 0 && (
                <span className={`rounded border px-2 py-0.5 ${stressPct >= 100 ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-purple-500/40 bg-purple-500/10 text-purple-300'}`}>
                  Stress: {stressCurrent}/{stressThreshold}
                </span>
              )}
              {(isDM || entry.type === 'pc') && (
                <span className="rounded border border-border/60 bg-background/40 px-2 py-0.5">
                  AC: {entry.ac ?? '-'}
                </span>
              )}
            </div>
            {hasHeroPoints && entry.type === 'pc' && (
              <div className="mt-2">
                <HeroPointsTracker campaignId={campaignId} entry={entry} canEdit={isDM} />
              </div>
            )}
          </section>

          <section className="rounded-md border border-[#2a2016] bg-background/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Action Economy</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Movement Included</p>
            </div>
            <ActionEconomySlots
              campaignId={campaignId}
              entryId={entry.id}
              canEdit={isDM}
            />
          </section>
        </div>

        <section className="mt-3 rounded-md border border-[#2a2016] bg-background/20 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Details</p>
          <TabbedSection
            tabs={tabs}
            activeTabId={activeTab}
            onChange={(id) => setActiveTab(id as FocusTabId)}
          >
            {activeTab === 'effects' && (
              <div className="space-y-2">
                <div ref={effectsConditionsRef} className="rounded border border-border/60 bg-background/25 p-2">
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Conditions</p>
                  <div className="flex flex-wrap gap-1">
                    {(rules?.conditions ?? []).map((condition) => {
                      const active = conditionNames.has(condition.key);
                      const isConfiguring = configuringCondition === condition.key;
                      const value = entry.systemData?.conditions?.[condition.key];
                      return (
                        <div key={condition.key} className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => isDM ? handleConditionClick(condition.key) : handleToggleCondition(condition.key)}
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              active
                                ? 'bg-arcane/30 text-arcane ring-1 ring-arcane/50'
                                : isConfiguring
                                  ? 'bg-primary/20 text-primary ring-1 ring-primary/50'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            title={condition.description}
                          >
                            {condition.label}
                          </button>
                          {isDM && condition.hasValue && active && (
                            <input
                              type="number"
                              min={1}
                              value={Math.max(1, value ?? 1)}
                              onChange={(e) =>
                                handleSetConditionValue(condition.key, parseInt(e.target.value, 10) || 1)
                              }
                              className="w-12 rounded border border-border bg-background px-1 py-0.5 text-[10px]"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {isDM && configuringCondition && !conditionNames.has(configuringCondition) && (
                    <div className="mt-2 space-y-1.5 border-t border-border/60 pt-2">
                      <p className="text-[10px] font-medium text-foreground">{configuringCondition}</p>
                      <div className="flex items-center gap-2">
                        <label className="text-[9px] text-muted-foreground">Rounds</label>
                        <input
                          type="number"
                          min={1}
                          value={condDraftRounds}
                          onChange={(e) => setCondDraftRounds(e.target.value)}
                          placeholder="∞"
                          className="w-14 rounded border border-border bg-background px-1.5 py-0.5 text-[10px]"
                        />
                        <label className="text-[9px] text-muted-foreground">Ends on</label>
                        <select
                          value={condDraftEndsOn}
                          onChange={(e) => setCondDraftEndsOn(e.target.value as 'start' | 'end')}
                          className="rounded border border-border bg-background px-1 py-0.5 text-[10px]"
                        >
                          <option value="end">End</option>
                          <option value="start">Start</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[9px] text-muted-foreground">Source</label>
                        <input
                          type="text"
                          value={condDraftSource}
                          onChange={(e) => setCondDraftSource(e.target.value)}
                          placeholder="e.g. Hold Person"
                          className="flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px]"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={handleApplyConditionWithDuration}
                          className="rounded border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] text-primary hover:bg-primary/25"
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickAddCondition}
                          className="rounded border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent"
                        >
                          No Duration
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {hasConcentration && <ConcentrationBadge campaignId={campaignId} entry={entry} canEdit={isDM} />}
                {hasLegendaryActions && <LegendaryActionsPanel campaignId={campaignId} entry={entry} canEdit={isDM} />}
                <DeathSavesTracker
                  campaignId={campaignId}
                  entry={entry}
                  canEditPcDeathSaves={isDM}
                  canEditNpcDeathSaves={isDM}
                />
                <DownedStatePanel campaignId={campaignId} entry={entry} canEdit={isDM} />
              </div>
            )}

            {activeTab === 'mods' && (
              <div className="space-y-2">
                <DamageModTags campaignId={campaignId} entry={entry} canEdit={isDM} />
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Notes (Local only)</p>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="h-40 w-full rounded border border-border bg-background/40 px-2 py-1 text-xs text-foreground"
                  placeholder="Add notes for this creature..."
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="rounded border border-border/60 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-accent"
                >
                  Save Notes
                </button>
              </div>
            )}

            {activeTab === 'abilities' && (
              <div className="rounded border border-border/60 bg-background/25 p-2">
                <ActionListPanel
                  campaignId={campaignId}
                  systemKey={rules?.system ?? null}
                  entry={entry}
                />
              </div>
            )}
          </TabbedSection>
        </section>
      </div>

      {modalMode && (
        <ApplyDamageModal
          campaignId={campaignId}
          entry={entry}
          isOpen={modalMode != null}
          initialMode={modalMode}
          onClose={() => setModalMode(null)}
        />
      )}
    </>
  );
}

const WOUND_COLORS: Record<string, string> = {
  Healthy: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  Shaken: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  Hurt: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  Wounded: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  Incapacitated: 'text-red-400 border-red-500/40 bg-red-500/10',
  'Bleeding Out': 'text-red-500 border-red-600/40 bg-red-600/10',
  Dead: 'text-gray-400 border-gray-500/40 bg-gray-500/10',
};

function renderWoundLevel(
  entry: InitiativeEntry,
  isDM: boolean,
  woundAdvanceMutation: ReturnType<typeof useWoundAdvance>,
  woundReduceMutation: ReturnType<typeof useWoundReduce>,
) {
  const woundLevel = (entry.systemData?.woundLevel as string) ?? 'Healthy';
  const colorClass = WOUND_COLORS[woundLevel] ?? 'text-muted-foreground border-border bg-muted/20';

  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Wound Level</span>
        {isDM && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => woundAdvanceMutation.mutate(entry.id)}
              disabled={woundAdvanceMutation.isPending}
              className="rounded border border-border/60 px-1.5 py-0.5 text-[9px] hover:bg-accent disabled:opacity-50"
              title="Worsen wound level"
            >
              Worsen
            </button>
            <button
              type="button"
              onClick={() => woundReduceMutation.mutate(entry.id)}
              disabled={woundReduceMutation.isPending}
              className="rounded border border-border/60 px-1.5 py-0.5 text-[9px] hover:bg-accent disabled:opacity-50"
              title="Improve wound level"
            >
              Improve
            </button>
          </div>
        )}
      </div>
      <div className={`rounded border px-2 py-1 text-xs font-medium ${colorClass}`}>
        {woundLevel}
      </div>
    </div>
  );
}
