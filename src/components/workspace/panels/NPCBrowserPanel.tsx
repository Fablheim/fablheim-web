import { useState, useMemo } from 'react';
import { Plus, Search, User, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/hooks/useCampaigns';
import { useWorldEntities, useDeleteWorldEntity } from '@/hooks/useWorldEntities';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { EntityCard } from '@/components/world/EntityCard';
import { ExplorerSection } from '@/components/world/ExplorerSection';
import { EntityRow } from '@/components/world/EntityRow';
import { CreateEntityModal } from '@/components/world/CreateEntityModal';
import { EntityDetailModal } from '@/components/world/EntityDetailModal';
import { DeleteEntityModal } from '@/components/world/DeleteEntityModal';
import { TYPE_LABELS } from '@/components/world/world-constants';
import type { WorldEntity } from '@/types/campaign';

interface NPCBrowserPanelProps {
  campaignId: string;
}

const NPC_TYPES = ['npc', 'npc_minor'] as const;

export function NPCBrowserPanel({ campaignId }: NPCBrowserPanelProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: campaign } = useCampaign(campaignId);
  const { data: entities, isLoading, isError } = useWorldEntities(campaignId);
  const deleteMutation = useDeleteWorldEntity();

  const isDM = campaign?.dmId === user?._id;

  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'location' | 'faction'>('none');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<WorldEntity | null>(null);
  const [viewingEntity, setViewingEntity] = useState<WorldEntity | null>(null);
  const [deletingEntity, setDeletingEntity] = useState<WorldEntity | null>(null);

  const npcs = useMemo(() => {
    if (!entities) return [];
    return entities.filter((e) => NPC_TYPES.includes(e.type as typeof NPC_TYPES[number]));
  }, [entities]);

  const allEntities = entities ?? [];

  // Build entity lookup for resolving parent locations and faction names
  const entityMap = useMemo(
    () => new Map(allEntities.map((e) => [e._id, e])),
    [allEntities],
  );

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return npcs;
    const q = searchQuery.toLowerCase();
    return npcs.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [npcs, searchQuery]);

  // Grouped data
  const groupedByLocation = useMemo(() => {
    if (groupBy !== 'location') return null;
    const groups = new Map<string, { label: string; npcs: WorldEntity[] }>();
    const unplaced: WorldEntity[] = [];
    for (const npc of filtered) {
      const pid = npc.parentEntityId;
      const parentId = pid ? (typeof pid === 'string' ? pid : pid._id) : null;
      if (parentId) {
        const parent = entityMap.get(parentId);
        const label = parent?.name ?? 'Unknown Location';
        if (!groups.has(parentId)) groups.set(parentId, { label, npcs: [] });
        groups.get(parentId)!.npcs.push(npc);
      } else {
        unplaced.push(npc);
      }
    }
    return { groups: [...groups.values()].sort((a, b) => a.label.localeCompare(b.label)), unplaced };
  }, [filtered, groupBy, entityMap]);

  const groupedByFaction = useMemo(() => {
    if (groupBy !== 'faction') return null;
    const groups = new Map<string, { label: string; npcs: WorldEntity[] }>();
    const noFaction: WorldEntity[] = [];
    for (const npc of filtered) {
      const factionRel = npc.relatedEntities?.find((r) => {
        const linked = entityMap.get(r.entityId);
        return linked?.type === 'faction';
      });
      if (factionRel) {
        const faction = entityMap.get(factionRel.entityId);
        const label = faction?.name ?? 'Unknown Faction';
        const key = factionRel.entityId;
        if (!groups.has(key)) groups.set(key, { label, npcs: [] });
        groups.get(key)!.npcs.push(npc);
      } else {
        noFaction.push(npc);
      }
    }
    return { groups: [...groups.values()].sort((a, b) => a.label.localeCompare(b.label)), ungrouped: noFaction };
  }, [filtered, groupBy, entityMap]);

  function handleDelete() {
    if (!deletingEntity) return;
    deleteMutation.mutate(
      { campaignId, id: deletingEntity._id },
      {
        onSuccess: () => {
          toast.success(`${deletingEntity.name} deleted`);
          setDeletingEntity(null);
          queryClient.invalidateQueries({ queryKey: ['world-entities', campaignId] });
        },
        onError: () => toast.error('Failed to delete NPC'),
      },
    );
  }

  return (
    <PageContainer
      title="NPCs"
      subtitle={`${npcs.length} character${npcs.length !== 1 ? 's' : ''} in your world`}
      actions={
        isDM ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create NPC
          </Button>
        ) : undefined
      }
    >
      {renderSearchBar()}
      {renderContent()}
      {renderModals()}
    </PageContainer>
  );

  function renderSearchBar() {
    return (
      <div className="mkt-card mb-5 rounded-xl p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search NPCs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-sm border border-input bg-input py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground input-carved focus:outline-none"
            />
          </div>
          <div className="flex shrink-0 gap-0.5 rounded-md border border-border/60 bg-background/40 p-0.5">
            {(['none', 'location', 'faction'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setGroupBy(mode)}
                className={`rounded px-2 py-1 font-[Cinzel] text-[10px] uppercase tracking-wider transition-colors ${
                  groupBy === mode
                    ? 'bg-brass/15 text-brass'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === 'none' ? 'All' : mode === 'location' ? 'By Location' : 'By Faction'}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderContent() {
    if (isLoading) {
      return (
        <div className="mkt-card rounded-xl py-12 text-center text-muted-foreground">
          Loading NPCs...
        </div>
      );
    }
    if (isError) {
      return (
        <div className="mkt-card rounded-xl py-12 text-center text-muted-foreground">
          Failed to load NPCs
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="mkt-card mkt-card-mounted flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gold/25 py-16 text-center">
          <User className="h-10 w-10 text-muted-foreground/45" />
          <p className="font-[Cinzel] text-xl text-muted-foreground">
            {searchQuery ? 'No NPCs match your search' : 'No souls encountered'}
          </p>
          <p className="text-base text-muted-foreground/80">
            {searchQuery ? 'Try a different search term' : 'Add NPCs to bring your world to life'}
          </p>
          {!searchQuery && isDM && (
            <Button onClick={() => setCreateOpen(true)} className="mt-1">
              <Plus className="mr-1.5 h-4 w-4" />
              Create NPC
            </Button>
          )}
        </div>
      );
    }
    if (groupBy === 'location' && groupedByLocation) {
      return renderGroupedByLocation();
    }
    if (groupBy === 'faction' && groupedByFaction) {
      return renderGroupedByFaction();
    }
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entity) => (
          <EntityCard
            key={entity._id}
            entity={entity}
            canEdit={isDM}
            onEdit={() => setEditingEntity(entity)}
            onDelete={() => setDeletingEntity(entity)}
            onClick={() => setViewingEntity(entity)}
          />
        ))}
      </div>
    );
  }

  function renderGroupedByLocation() {
    if (!groupedByLocation) return null;
    return (
      <div className="space-y-2">
        {groupedByLocation.groups.map((group) => (
          <ExplorerSection key={group.label} title={group.label} icon={MapPin} count={group.npcs.length}>
            <div className="space-y-1">
              {group.npcs.map((npc) => (
                <EntityRow key={npc._id} entity={npc} onClick={() => setViewingEntity(npc)} />
              ))}
            </div>
          </ExplorerSection>
        ))}
        {groupedByLocation.unplaced.length > 0 && (
          <ExplorerSection title="Unplaced" icon={User} count={groupedByLocation.unplaced.length}>
            <div className="space-y-1">
              {groupedByLocation.unplaced.map((npc) => (
                <EntityRow key={npc._id} entity={npc} onClick={() => setViewingEntity(npc)} />
              ))}
            </div>
          </ExplorerSection>
        )}
      </div>
    );
  }

  function renderGroupedByFaction() {
    if (!groupedByFaction) return null;
    return (
      <div className="space-y-2">
        {groupedByFaction.groups.map((group) => (
          <ExplorerSection key={group.label} title={group.label} icon={Users} count={group.npcs.length}>
            <div className="space-y-1">
              {group.npcs.map((npc) => (
                <EntityRow key={npc._id} entity={npc} onClick={() => setViewingEntity(npc)} />
              ))}
            </div>
          </ExplorerSection>
        ))}
        {groupedByFaction.ungrouped.length > 0 && (
          <ExplorerSection title="No Faction" icon={User} count={groupedByFaction.ungrouped.length}>
            <div className="space-y-1">
              {groupedByFaction.ungrouped.map((npc) => (
                <EntityRow key={npc._id} entity={npc} onClick={() => setViewingEntity(npc)} />
              ))}
            </div>
          </ExplorerSection>
        )}
      </div>
    );
  }

  function renderModals() {
    return (
      <>
        <CreateEntityModal
          open={createOpen || !!editingEntity}
          onClose={() => {
            setCreateOpen(false);
            setEditingEntity(null);
          }}
          campaignId={campaignId}
          entity={editingEntity}
          defaultType="npc"
        />
        <EntityDetailModal
          open={!!viewingEntity}
          onClose={() => setViewingEntity(null)}
          entity={viewingEntity}
          canEdit={isDM}
          onEdit={() => {
            setEditingEntity(viewingEntity);
            setViewingEntity(null);
          }}
          onDelete={() => {
            setDeletingEntity(viewingEntity);
            setViewingEntity(null);
          }}
          allEntities={npcs}
          onViewEntity={(e) => setViewingEntity(e)}
          onLinkEntity={() => {}}
          domainFeatureEnabled={!!campaign?.features?.domains}
        />
        <DeleteEntityModal
          open={!!deletingEntity}
          onClose={() => setDeletingEntity(null)}
          onConfirm={handleDelete}
          isPending={deleteMutation.isPending}
          entityName={deletingEntity?.name ?? ''}
          entityType={TYPE_LABELS[deletingEntity?.type ?? 'npc'] ?? 'NPC'}
        />
      </>
    );
  }
}
