import { useState } from 'react';
import { MapPin, Loader2, Library } from 'lucide-react';
import { toast } from 'sonner';
import { useAddEncounterToken, useUpdateEncounter } from '@/hooks/useEncounters';
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
  const [showSpawnModal, setShowSpawnModal] = useState(false);

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

  function handleSpawn(enemies: SpawnedEnemy[]) {
    const newNpcs: EncounterNPC[] = enemies.map((e) => ({
      name: e.name,
      count: 1,
      cr: parseFloat(e.cr ?? '0') || 0,
      hp: e.hp,
      ac: e.ac,
      initiativeBonus: e.initiativeBonus,
      statBlock: '',
      tactics: '',
    }));

    updateEncounter.mutate(
      { npcs: [...encounter.npcs, ...newNpcs] },
      {
        onSuccess: () => toast.success(`Added ${enemies.length} creatures`),
        onError: () => toast.error('Failed to add creatures'),
      },
    );
  }

  return (
    <div className="space-y-3">
      {renderHeader()}
      {encounter.npcs.length === 0 ? renderEmpty() : renderNPCCards()}
      <SpawnEnemiesModal
        open={showSpawnModal}
        onClose={() => setShowSpawnModal(false)}
        onSpawn={handleSpawn}
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

  function renderNPCCards() {
    return (
      <div className="space-y-2">
        {encounter.npcs.map((npc, i) => (
          <div
            key={`${npc.name}-${i}`}
            className="flex items-center justify-between rounded-md border border-iron/30 bg-background/40 px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-['IM_Fell_English'] text-sm text-foreground">
                  {npc.name}
                </span>
                {npc.count > 1 && (
                  <span className="text-[10px] text-muted-foreground">x{npc.count}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                <span>CR {npc.cr}</span>
                <span>HP {npc.hp}</span>
                <span>AC {npc.ac}</span>
                <span>Init +{npc.initiativeBonus}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => placeNPC(npc, i)}
              disabled={addToken.isPending}
              className="rounded p-1.5 text-muted-foreground hover:text-brass hover:bg-brass/10 transition-colors disabled:opacity-50"
              title={`Place ${npc.name} on map`}
            >
              <MapPin className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    );
  }
}
