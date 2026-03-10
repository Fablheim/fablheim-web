import { useEffect, useMemo, useRef, useState } from 'react';
import { Pin, PinOff, Swords, Heart, SkipForward, Wand2, Crosshair } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCombatRules,
  useInitiative,
  useNextTurn,
  useUpdateInitiativeEntry,
} from '@/hooks/useLiveSession';
import { useSessionWorkspaceState } from '@/components/session/SessionWorkspaceState';
import { ApplyDamageModal } from '@/components/session/ApplyDamageModal';
import { ActionEconomySlots } from '@/components/session/ActionEconomySlots';
import { ConcentrationBadge } from '@/components/session/ConcentrationBadge';
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
import type { InitiativeEntry } from '@/types/live-session';

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
  const {
    focusedEntryId,
    selectedEntryId,
    isPinned,
    pinSelection,
    unpinSelection,
    currentTurnEntryId,
  } = useSessionWorkspaceState();

  const isPf2eSystem = (rules?.system ?? '').toLowerCase().includes('pathfinder') || (rules?.system ?? '').toLowerCase() === 'pf2e';
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
  const normalizedConditions = entry.conditions ?? [];

  const tabs: Array<{ id: FocusTabId; label: string }> = [
    { id: 'effects', label: 'Effects' },
    { id: 'mods', label: 'Mods' },
    { id: 'notes', label: 'Notes' },
    { id: 'abilities', label: 'Abilities' },
  ];

  function handleToggleCondition(conditionKey: string) {
    const current = entry.conditions ?? [];
    const isActive = current.includes(conditionKey);
    const nextConditions = isActive
      ? current.filter((c) => c !== conditionKey)
      : [...current, conditionKey];
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
    const nextConditions = entry.conditions?.includes(conditionKey)
      ? [...(entry.conditions ?? [])]
      : [...(entry.conditions ?? []), conditionKey];
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
                  <button
                    type="button"
                    onClick={() => nextTurn.mutate()}
                    disabled={nextTurn.isPending}
                    className="inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-accent disabled:opacity-50"
                  >
                    <SkipForward className="h-3 w-3" />
                    End Turn
                  </button>
                )}
              </div>
            </div>

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

            <div className="mb-2 flex flex-wrap gap-1">
              {normalizedConditions.length === 0 && (
                <span className="text-[10px] text-muted-foreground">No active conditions</span>
              )}
              {normalizedConditions.slice(0, 6).map((conditionKey) => {
                const label = rules?.conditions.find((c) => c.key === conditionKey)?.label ?? conditionKey;
                const value = entry.systemData?.conditions?.[conditionKey];
                return (
                  <span key={conditionKey} className="rounded-full bg-arcane/20 px-2 py-0.5 text-[10px] text-arcane">
                    {label}{value != null ? ` ${value}` : ''}
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
              {(isDM || entry.type === 'pc') && (
                <span className="rounded border border-border/60 bg-background/40 px-2 py-0.5">
                  AC: {entry.ac ?? '-'}
                </span>
              )}
            </div>
            {isPf2eSystem && entry.type === 'pc' && (
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
                      const active = normalizedConditions.includes(condition.key);
                      const value = entry.systemData?.conditions?.[condition.key];
                      return (
                        <div key={condition.key} className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleCondition(condition.key)}
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              active
                                ? 'bg-arcane/30 text-arcane ring-1 ring-arcane/50'
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
                </div>

                <ConcentrationBadge campaignId={campaignId} entry={entry} canEdit={isDM} />
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
