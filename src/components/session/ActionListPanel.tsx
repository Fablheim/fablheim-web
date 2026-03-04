import { useMemo, useState } from 'react';
import { Dice5, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useBattleMap } from '@/hooks/useBattleMap';
import { useCharacters } from '@/hooks/useCharacters';
import { useEncounters } from '@/hooks/useEncounters';
import { useEnemyTemplates } from '@/hooks/useEnemyTemplates';
import { useRollDice } from '@/hooks/useLiveSession';
import { getSystemAdapter } from '@/rules/systems/getSystemAdapter';
import type { SystemAction } from '@/rules/systems/types';
import type { EnemyAttack } from '@/types/enemy-template';
import type { InitiativeEntry } from '@/types/live-session';
import type { EnemyTemplate } from '@/types/enemy-template';

interface ActionListPanelProps {
  campaignId: string;
  systemKey?: string | null;
  entry: InitiativeEntry;
}

export function ActionListPanel({
  campaignId,
  systemKey,
  entry,
}: ActionListPanelProps) {
  const { data: characters } = useCharacters(campaignId);
  const { data: encounters } = useEncounters(campaignId);
  const { data: battleMap } = useBattleMap(campaignId);
  const { data: enemyTemplates } = useEnemyTemplates();
  const rollDice = useRollDice(campaignId);

  const [search, setSearch] = useState('');
  const [mapPenaltyByAction, setMapPenaltyByAction] = useState<Record<string, number>>({});
  const [fateModifierByAction, setFateModifierByAction] = useState<Record<string, number>>({});
  const [lastMessageByAction, setLastMessageByAction] = useState<Record<string, string>>({});

  const adapter = useMemo(() => getSystemAdapter(systemKey), [systemKey]);
  const character = useMemo(
    () => (entry.characterId ? characters?.find((item) => item._id === entry.characterId) ?? null : null),
    [characters, entry.characterId],
  );
  const template = useMemo(
    () => (!entry.characterId ? resolveEnemyTemplateForEntry(entry, battleMap?.sourceEncounterId, encounters, enemyTemplates) : null),
    [entry, battleMap?.sourceEncounterId, encounters, enemyTemplates],
  );
  const legacyNpcAttacks = useMemo(
    () => (!entry.characterId ? getLegacyCustomNpcAttacks(campaignId, entry.name) : []),
    [campaignId, entry.characterId, entry.name],
  );
  const actions = useMemo(
    () => adapter.toSystemActions({ entry, character, template, legacyNpcAttacks, systemKey }),
    [adapter, entry, character, template, legacyNpcAttacks, systemKey],
  );
  const filteredActions = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return actions;
    return actions.filter((action) => {
      const label = action.label.toLowerCase();
      const summary = action.summary?.toLowerCase() ?? '';
      return label.includes(needle) || summary.includes(needle);
    });
  }, [actions, search]);

  async function runAction(action: SystemAction, mode: 'roll' | 'damage' = 'roll') {
    if (rollDice.isPending || action.disabledReason) return;
    try {
      const result = await adapter.performActionRoll(action, {
        entry,
        character,
        template,
        systemKey,
        rollDice: (request) => rollDice.mutateAsync(request),
        isPrivate: !!entry.isHidden,
        options: {
          mode,
          mapPenalty: mapPenaltyByAction[action.id] ?? 0,
          modifier: fateModifierByAction[action.id] ?? 0,
        },
      });
      if (result.message) {
        setLastMessageByAction((prev) => ({ ...prev, [action.id]: result.message! }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to roll action.';
      toast.error(message);
    }
  }

  if (!systemKey) {
    return (
      <div className="rounded border border-border/60 bg-background/25 p-3 text-xs text-muted-foreground">
        System not set for this campaign.
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="rounded border border-border/60 bg-background/25 p-3 text-xs text-muted-foreground">
        No attacks/actions configured for this creature.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-7 w-full rounded border border-border/60 bg-background/35 pl-7 pr-2 text-[11px] text-foreground placeholder:text-muted-foreground"
          placeholder="Filter actions..."
        />
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
        {filteredActions.map((action) => {
          const mapPenalty = mapPenaltyByAction[action.id] ?? 0;
          const fateModifier = fateModifierByAction[action.id] ?? 0;
          const isPf2e = (systemKey ?? '').toLowerCase().includes('pathfinder') || (systemKey ?? '').toLowerCase() === 'pf2e';
          const isFate = (systemKey ?? '').toLowerCase() === 'fate';
          const canDamageRoll = hasDamageDice(action);
          return (
            <div key={action.id} className="rounded border border-border/60 bg-background/25 px-2 py-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{action.label}</p>
                  {action.summary && (
                    <p className="truncate text-[10px] text-muted-foreground">{action.summary}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {isPf2e && (
                    <select
                      value={mapPenalty}
                      onChange={(event) =>
                        setMapPenaltyByAction((prev) => ({
                          ...prev,
                          [action.id]: Number(event.target.value),
                        }))
                      }
                      className="h-6 rounded border border-border/60 bg-background px-1 text-[10px] text-foreground"
                      title="Multiple attack penalty"
                    >
                      <option value={0}>MAP 0</option>
                      <option value={-5}>MAP -5</option>
                      <option value={-10}>MAP -10</option>
                    </select>
                  )}
                  {isFate && (
                    <input
                      type="number"
                      value={fateModifier}
                      onChange={(event) =>
                        setFateModifierByAction((prev) => ({
                          ...prev,
                          [action.id]: Number(event.target.value) || 0,
                        }))
                      }
                      className="h-6 w-12 rounded border border-border/60 bg-background px-1 text-[10px] text-foreground"
                      title="Modifier"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => void runAction(action, 'roll')}
                    disabled={rollDice.isPending || !!action.disabledReason}
                    className="inline-flex h-6 items-center gap-1 rounded border border-brass/45 bg-brass/10 px-2 text-[10px] text-brass hover:bg-brass/20 disabled:opacity-50"
                    title={action.disabledReason ?? `Roll ${action.label}`}
                  >
                    {rollDice.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Dice5 className="h-3 w-3" />}
                    {action.rollLabel ?? 'Roll'}
                  </button>
                  {canDamageRoll && (
                    <button
                      type="button"
                      onClick={() => void runAction(action, 'damage')}
                      disabled={rollDice.isPending}
                      className="inline-flex h-6 items-center rounded border border-border/60 px-2 text-[10px] text-muted-foreground hover:bg-accent disabled:opacity-50"
                      title={`Roll ${action.label} damage`}
                    >
                      Dmg
                    </button>
                  )}
                </div>
              </div>
              {lastMessageByAction[action.id] && (
                <p className="mt-1 text-[10px] text-muted-foreground">{lastMessageByAction[action.id]}</p>
              )}
              {action.disabledReason && (
                <p className="mt-1 text-[10px] text-muted-foreground">{action.disabledReason}</p>
              )}
            </div>
          );
        })}
      </div>
      {filteredActions.length === 0 && (
        <p className="text-[11px] text-muted-foreground">No matching actions.</p>
      )}
    </div>
  );
}

function hasDamageDice(action: SystemAction): boolean {
  const payload = action.rollPayload as Record<string, unknown>;
  return typeof payload?.damageDice === 'string' && payload.damageDice.length > 0;
}

function normalizeCombatantName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+#?\d+$/g, '')
    .trim();
}

function getLegacyCustomNpcAttacks(campaignId: string, entryName: string): EnemyAttack[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('fablheim:npc-custom-attacks');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, EnemyAttack[]>;
    const key = `${campaignId}:${normalizeCombatantName(entryName)}`;
    return Array.isArray(parsed[key]) ? parsed[key] : [];
  } catch {
    return [];
  }
}

function resolveEnemyTemplateForEntry(
  entry: InitiativeEntry,
  sourceEncounterId: string | undefined,
  encounters: Array<{ _id: string; npcs?: Array<{ name: string }> }> | undefined,
  templates: EnemyTemplate[] | undefined,
): EnemyTemplate | null {
  if (!templates || templates.length === 0) return null;
  const sourceEncounter = sourceEncounterId
    ? encounters?.find((encounter) => encounter._id === sourceEncounterId)
    : undefined;
  const entryName = normalizeCombatantName(entry.name);
  const encounterNpcName = sourceEncounter?.npcs
    ?.map((npc) => npc.name)
    .find((npcName) => {
      const normalized = normalizeCombatantName(npcName);
      return entryName === normalized || entryName.startsWith(`${normalized} `);
    });
  const target = normalizeCombatantName(encounterNpcName ?? entry.name);
  return templates.find((template) => normalizeCombatantName(template.name) === target) ?? null;
}
