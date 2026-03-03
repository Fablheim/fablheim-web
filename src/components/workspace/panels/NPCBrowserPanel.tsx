import { useState, useMemo } from 'react';
import { Plus, Search, User } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/hooks/useCampaigns';
import { useWorldEntities, useDeleteWorldEntity } from '@/hooks/useWorldEntities';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { EntityCard } from '@/components/world/EntityCard';
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
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<WorldEntity | null>(null);
  const [viewingEntity, setViewingEntity] = useState<WorldEntity | null>(null);
  const [deletingEntity, setDeletingEntity] = useState<WorldEntity | null>(null);

  const npcs = useMemo(() => {
    if (!entities) return [];
    return entities.filter((e) => NPC_TYPES.includes(e.type as typeof NPC_TYPES[number]));
  }, [entities]);

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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search NPCs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-sm border border-input bg-input py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground input-carved focus:outline-none"
          />
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
