import { useState, useMemo } from 'react';
import { MapPin, Loader2, Library, Globe, ChevronDown, ChevronRight, Tags, Trash2, ArrowUp, ArrowDown, Minus, Plus, ArrowDownAZ, ArrowDown10 } from 'lucide-react';
import { toast } from 'sonner';
import { useAddEncounterToken, useUpdateEncounter } from '@/hooks/useEncounters';
import { useCreateWorldEntity } from '@/hooks/useWorldEntities';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SpawnEnemiesModal } from '@/components/enemies/SpawnEnemiesModal';
import type { Encounter, EncounterNPC } from '@/types/encounter';
import type { SpawnedEnemy } from '@/types/enemy-template';

interface EncounterNPCListProps {
  campaignId: string;
  encounter: Encounter;
}

const TOKEN_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#f59e0b',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

export function EncounterNPCList({ campaignId, encounter }: EncounterNPCListProps) {
  const addToken = useAddEncounterToken(campaignId, encounter._id);
  const updateEncounter = useUpdateEncounter(campaignId, encounter._id);
  const createWorldEntity = useCreateWorldEntity();
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [savedNPCs, setSavedNPCs] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
  const [editingGroupValue, setEditingGroupValue] = useState('');
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  // Group NPCs by their group field
  const groupedNPCs = useMemo(() => {
    const groups = new Map<string, { npcs: EncounterNPC[]; indices: number[] }>();
    encounter.npcs.forEach((npc, i) => {
      const key = npc.group || '';
      if (!groups.has(key)) groups.set(key, { npcs: [], indices: [] });
      groups.get(key)!.npcs.push(npc);
      groups.get(key)!.indices.push(i);
    });
    return groups;
  }, [encounter.npcs]);

  const hasGroups = groupedNPCs.size > 1 || (groupedNPCs.size === 1 && !groupedNPCs.has(''));

  const existingGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const npc of encounter.npcs) {
      if (npc.group) groups.add(npc.group);
    }
    return [...groups];
  }, [encounter.npcs]);

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  function placeNPC(npc: EncounterNPC, index: number) {
    const startX = 1 + (index * 2) % (encounter.gridWidth - 2);
    const startY = 1 + Math.floor((index * 2) / (encounter.gridWidth - 2));

    for (let i = 0; i < npc.count; i++) {
      const x = startX + i;
      const y = startY;
      addToken.mutate(
        {
          name: npc.count > 1 ? `${npc.name} ${i + 1}` : npc.name,
          type: 'monster',
          x: Math.min(x, encounter.gridWidth - 1),
          y: Math.min(y, encounter.gridHeight - 1),
          color: TOKEN_COLORS[(encounter.tokens.length + i) % TOKEN_COLORS.length],
        },
        {
          onError: () => toast.error(`Failed to place ${npc.name}`),
        },
      );
    }
    toast.success(`Placed ${npc.name} on map`);
  }

  function placeAll() {
    let tokenIndex = 0;
    for (const npc of encounter.npcs) {
      const startX = 1 + (tokenIndex * 2) % (encounter.gridWidth - 2);
      const startY = 1 + Math.floor((tokenIndex * 2) / (encounter.gridWidth - 2));

      for (let i = 0; i < npc.count; i++) {
        const x = startX + i;
        const y = startY;
        addToken.mutate(
          {
            name: npc.count > 1 ? `${npc.name} ${i + 1}` : npc.name,
            type: 'monster',
            x: Math.min(x, encounter.gridWidth - 1),
            y: Math.min(y, encounter.gridHeight - 1),
            color: TOKEN_COLORS[(encounter.tokens.length + tokenIndex + i) % TOKEN_COLORS.length],
          },
          { onError: () => toast.error(`Failed to place ${npc.name}`) },
        );
      }
      tokenIndex += npc.count;
    }
    toast.success('All creatures placed on map');
  }

  function handleSpawn(enemies: SpawnedEnemy[], group?: string) {
    const newNpcs: EncounterNPC[] = enemies.map((e) => ({
      name: e.name,
      count: 1,
      cr: parseFloat(e.cr ?? '0') || 0,
      hp: e.hp,
      ac: e.ac,
      initiativeBonus: e.initiativeBonus,
      statBlock: '',
      tactics: '',
      ...(group ? { group } : {}),
    }));

    updateEncounter.mutate(
      { npcs: [...encounter.npcs, ...newNpcs] },
      {
        onSuccess: () => toast.success(`Added ${enemies.length} creatures`),
        onError: () => toast.error('Failed to add creatures'),
      },
    );
  }

  function startEditGroup(index: number, currentGroup: string) {
    setEditingGroupIndex(index);
    setEditingGroupValue(currentGroup || '');
  }

  function saveGroup(index: number) {
    const updated = [...encounter.npcs];
    updated[index] = { ...updated[index], group: editingGroupValue.trim() || undefined };
    updateEncounter.mutate(
      { npcs: updated },
      {
        onSuccess: () => setEditingGroupIndex(null),
        onError: () => toast.error('Failed to update group'),
      },
    );
  }

  function confirmDeleteNPC() {
    if (deleteConfirmIndex === null) return;
    const npc = encounter.npcs[deleteConfirmIndex];
    const updated = encounter.npcs.filter((_, i) => i !== deleteConfirmIndex);
    updateEncounter.mutate(
      { npcs: updated },
      {
        onSuccess: () => { toast.success(`Removed ${npc.name}`); setDeleteConfirmIndex(null); },
        onError: () => toast.error('Failed to remove creature'),
      },
    );
  }

  function updateNPCCount(index: number, delta: number) {
    const npc = encounter.npcs[index];
    const newCount = Math.max(1, npc.count + delta);
    if (newCount === npc.count) return;
    const updated = [...encounter.npcs];
    updated[index] = { ...updated[index], count: newCount };
    updateEncounter.mutate(
      { npcs: updated },
      { onError: () => toast.error('Failed to update count') },
    );
  }

  function moveNPC(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= encounter.npcs.length) return;
    const updated = [...encounter.npcs];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    updateEncounter.mutate(
      { npcs: updated },
      { onError: () => toast.error('Failed to reorder') },
    );
  }

  function sortNPCs(by: 'cr' | 'name') {
    const sorted = [...encounter.npcs].sort((a, b) =>
      by === 'cr' ? b.cr - a.cr : a.name.localeCompare(b.name),
    );
    updateEncounter.mutate(
      { npcs: sorted },
      { onError: () => toast.error('Failed to sort') },
    );
  }

  function placeGroup(npcs: EncounterNPC[]) {
    let tokenOffset = 0;
    for (let gi = 0; gi < npcs.length; gi++) {
      const npc = npcs[gi];
      const startX = 1 + (tokenOffset * 2) % (encounter.gridWidth - 2);
      const startY = 1 + Math.floor((tokenOffset * 2) / (encounter.gridWidth - 2));

      for (let i = 0; i < npc.count; i++) {
        const x = startX + i;
        const y = startY;
        addToken.mutate(
          {
            name: npc.count > 1 ? `${npc.name} ${i + 1}` : npc.name,
            type: 'monster',
            x: Math.min(x, encounter.gridWidth - 1),
            y: Math.min(y, encounter.gridHeight - 1),
            color: TOKEN_COLORS[(encounter.tokens.length + tokenOffset + i) % TOKEN_COLORS.length],
          },
          { onError: () => toast.error(`Failed to place ${npc.name}`) },
        );
      }
      tokenOffset += npc.count;
    }
    toast.success(`Placed group on map`);
  }

  function saveToWorld(npc: EncounterNPC) {
    createWorldEntity.mutate(
      {
        campaignId,
        data: {
          name: npc.name,
          type: 'npc_minor',
          description: npc.tactics ? `Tactics: ${npc.tactics}` : undefined,
          tags: ['encounter-npc'],
          typeData: {
            hp: npc.hp,
            ac: npc.ac,
            cr: npc.cr,
            initiativeBonus: npc.initiativeBonus,
            statBlock: npc.statBlock,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success(`${npc.name} saved to world`);
          setSavedNPCs((prev) => new Set(prev).add(npc.name));
        },
        onError: () => toast.error(`Failed to save ${npc.name}`),
      },
    );
  }

  return (
    <div className="mkt-card mkt-card-mounted space-y-3 rounded-xl p-3">
      {renderHeader()}
      {encounter.npcs.length === 0 ? renderEmpty() : renderNPCCards()}
      <SpawnEnemiesModal
        open={showSpawnModal}
        onClose={() => setShowSpawnModal(false)}
        onSpawn={handleSpawn}
        existingGroups={existingGroups}
      />
      <ConfirmDialog
        open={deleteConfirmIndex !== null}
        title="Remove Creature"
        description={deleteConfirmIndex !== null ? `Remove ${encounter.npcs[deleteConfirmIndex]?.name} from this encounter?` : ''}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={confirmDeleteNPC}
        onCancel={() => setDeleteConfirmIndex(null)}
        isPending={updateEncounter.isPending}
      />
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center justify-between">
        <p className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          {encounter.npcs.length > 0
            ? `${encounter.npcs.reduce((s, n) => s + n.count, 0)} Creatures`
            : 'Creatures'}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSpawnModal(true)}
            className="flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] text-primary hover:bg-primary/20 transition-colors font-[Cinzel] uppercase tracking-wider"
          >
            <Library className="h-3 w-3" />
            Library
          </button>
          {encounter.npcs.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => sortNPCs('cr')}
                disabled={updateEncounter.isPending}
                className="rounded-md border border-iron/30 p-1 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors disabled:opacity-50"
                title="Sort by CR (highest first)"
              >
                <ArrowDown10 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => sortNPCs('name')}
                disabled={updateEncounter.isPending}
                className="rounded-md border border-iron/30 p-1 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors disabled:opacity-50"
                title="Sort alphabetically"
              >
                <ArrowDownAZ className="h-3 w-3" />
              </button>
            </>
          )}
          {encounter.npcs.length > 0 && (
            <button
              type="button"
              onClick={placeAll}
              disabled={addToken.isPending}
              className="flex items-center gap-1 rounded-md border border-brass/40 bg-brass/10 px-2 py-1 text-[10px] text-brass hover:bg-brass/20 transition-colors font-[Cinzel] uppercase tracking-wider disabled:opacity-50"
            >
              {addToken.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <MapPin className="h-3 w-3" />
              )}
              Place All
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderEmpty() {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground font-['IM_Fell_English'] italic">
          No creatures yet. Add from your library or use AI Tools to generate.
        </p>
      </div>
    );
  }

  function renderNPCCard(npc: EncounterNPC, index: number) {
    const isEditingGroup = editingGroupIndex === index;

    return (
      <div
        key={`${npc.name}-${index}`}
        className="flex items-center justify-between rounded-md border border-iron/30 bg-background/30 px-3 py-2"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-['IM_Fell_English'] text-sm text-foreground">
              {npc.name}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => updateNPCCount(index, -1)}
                disabled={npc.count <= 1 || updateEncounter.isPending}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors disabled:opacity-30"
                title="Decrease count"
              >
                <Minus className="h-2.5 w-2.5" />
              </button>
              <span className="text-[10px] text-muted-foreground tabular-nums min-w-[1.2rem] text-center">x{npc.count}</span>
              <button
                type="button"
                onClick={() => updateNPCCount(index, 1)}
                disabled={updateEncounter.isPending}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors disabled:opacity-30"
                title="Increase count"
              >
                <Plus className="h-2.5 w-2.5" />
              </button>
            </span>
            {npc.group && !hasGroups && (
              <span className="rounded-full bg-brass/15 px-1.5 py-0.5 text-[8px] font-[Cinzel] uppercase tracking-wider text-brass">
                {npc.group}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
            <span>CR {npc.cr}</span>
            <span>HP {npc.hp}</span>
            <span>AC {npc.ac}</span>
            <span>Init +{npc.initiativeBonus}</span>
          </div>
          {isEditingGroup && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <input
                type="text"
                value={editingGroupValue}
                onChange={(e) => setEditingGroupValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveGroup(index);
                  if (e.key === 'Escape') setEditingGroupIndex(null);
                }}
                placeholder="Group name..."
                maxLength={50}
                list="npc-groups"
                autoFocus
                className="w-32 rounded-sm border border-input bg-input px-2 py-0.5 text-[10px] text-foreground input-carved"
              />
              <datalist id="npc-groups">
                {existingGroups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => saveGroup(index)}
                disabled={updateEncounter.isPending}
                className="rounded px-1.5 py-0.5 text-[10px] text-primary hover:bg-primary/10 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingGroupIndex(null)}
                className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => moveNPC(index, -1)}
              disabled={index === 0 || updateEncounter.isPending}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors disabled:opacity-30"
              title="Move up"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => moveNPC(index, 1)}
              disabled={index === encounter.npcs.length - 1 || updateEncounter.isPending}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors disabled:opacity-30"
              title="Move down"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => startEditGroup(index, npc.group || '')}
            className="rounded p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Set group"
          >
            <Tags className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => saveToWorld(npc)}
            disabled={createWorldEntity.isPending || savedNPCs.has(npc.name)}
            className="rounded p-1.5 text-muted-foreground hover:text-forest hover:bg-forest/10 transition-colors disabled:opacity-50"
            title={savedNPCs.has(npc.name) ? `${npc.name} saved` : `Save ${npc.name} to world`}
          >
            <Globe className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => placeNPC(npc, index)}
            disabled={addToken.isPending}
            className="rounded p-1.5 text-muted-foreground hover:text-brass hover:bg-brass/10 transition-colors disabled:opacity-50"
            title={`Place ${npc.name} on map`}
          >
            <MapPin className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteConfirmIndex(index)}
            disabled={updateEncounter.isPending}
            className="rounded p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
            title={`Remove ${npc.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  function renderNPCCards() {
    if (!hasGroups) {
      return (
        <div className="space-y-2">
          {encounter.npcs.map((npc, i) => renderNPCCard(npc, i))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {[...groupedNPCs.entries()].map(([group, { npcs, indices }]) => {
          const label = group || 'Ungrouped';
          const isCollapsed = collapsedGroups.has(group);
          const groupCount = npcs.reduce((s, n) => s + n.count, 0);

          return (
            <div key={group} className="rounded-md border border-border/50">
              <div className="flex items-center justify-between px-3 py-2 rounded-t-md">
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="flex items-center gap-2 text-left hover:bg-accent/30 transition-colors rounded-md px-1 py-0.5"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-brass">
                    {label}
                  </span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    {groupCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => placeGroup(npcs)}
                  disabled={addToken.isPending}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-brass hover:bg-brass/10 transition-colors disabled:opacity-50"
                  title={`Place ${label} on map`}
                >
                  <MapPin className="h-3 w-3" />
                </button>
              </div>
              {!isCollapsed && (
                <div className="space-y-1 px-2 pb-2">
                  {npcs.map((npc, gi) => renderNPCCard(npc, indices[gi]))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}
