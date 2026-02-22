import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import { useWorldEntities, useDeleteWorldEntity } from '@/hooks/useWorldEntities';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/layout/PageContainer';
import { CampaignSelector } from '@/components/ui/CampaignSelector';
import { EntityCard } from '@/components/world/EntityCard';
import { CreateEntityModal } from '@/components/world/CreateEntityModal';
import { EntityDetailModal } from '@/components/world/EntityDetailModal';
import { DeleteEntityModal } from '@/components/world/DeleteEntityModal';
import { LinkEntityModal } from '@/components/world/LinkEntityModal';
import { WORLD_TABS, EMPTY_MESSAGES, TYPE_LABELS, type WorldTab } from '@/components/world/world-constants';
import type { WorldEntity, WorldEntityType } from '@/types/campaign';

const TAB_DEFAULT_TYPES: Partial<Record<WorldTab, WorldEntityType>> = {
  locations: 'location',
  factions: 'faction',
  npcs: 'npc',
  items: 'item',
  quests: 'quest',
  lore: 'lore',
  events: 'event',
};

export function WorldPage() {
  const { data: campaigns, isLoading: campaignsLoading } = useAccessibleCampaigns();

  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [activeTab, setActiveTab] = useState<WorldTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<WorldEntity | null>(null);
  const [viewingEntity, setViewingEntity] = useState<WorldEntity | null>(null);
  const [deletingEntity, setDeletingEntity] = useState<WorldEntity | null>(null);
  const [linkingEntity, setLinkingEntity] = useState<WorldEntity | null>(null);

  // Data
  const {
    data: entities,
    isLoading: entitiesLoading,
    error: entitiesError,
  } = useWorldEntities(selectedCampaignId);

  const deleteEntity = useDeleteWorldEntity();

  // Derived
  const selectedCampaign = campaigns?.find((c) => c._id === selectedCampaignId);
  const isDM = selectedCampaign?.role === 'dm';

  // Step 1: visibility filter
  const visibleEntities = useMemo(() => {
    if (!entities) return [];
    if (isDM) return entities;
    return entities.filter((e) => e.visibility === 'public');
  }, [entities, isDM]);

  // Compute tab counts from visible entities
  const tabCounts = useMemo(() => {
    const counts: Record<WorldTab, number> = {
      all: visibleEntities.length,
      locations: 0,
      factions: 0,
      npcs: 0,
      items: 0,
      quests: 0,
      lore: 0,
      events: 0,
    };
    for (const e of visibleEntities) {
      for (const tab of WORLD_TABS) {
        if (tab.key !== 'all' && tab.types.includes(e.type)) {
          counts[tab.key]++;
        }
      }
    }
    return counts;
  }, [visibleEntities]);

  // Step 2: tab filter
  const tabFiltered = useMemo(() => {
    if (activeTab === 'all') return visibleEntities;
    const tabDef = WORLD_TABS.find((t) => t.key === activeTab);
    if (!tabDef) return visibleEntities;
    return visibleEntities.filter((e) => tabDef.types.includes(e.type));
  }, [visibleEntities, activeTab]);

  // Step 3: search filter
  const filteredEntities = useMemo(() => {
    if (!searchQuery.trim()) return tabFiltered;
    const q = searchQuery.toLowerCase();
    return tabFiltered.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [tabFiltered, searchQuery]);

  // Handlers
  function handleCreate() {
    setEditingEntity(null);
    setShowCreateModal(true);
  }

  function handleEdit(entity: WorldEntity) {
    setEditingEntity(entity);
    setShowCreateModal(true);
  }

  function handleCloseCreateModal() {
    setShowCreateModal(false);
    setEditingEntity(null);
  }

  function handleView(entity: WorldEntity) {
    setViewingEntity(entity);
  }

  function handleEditFromDetail() {
    if (!viewingEntity) return;
    const entity = viewingEntity;
    setViewingEntity(null);
    handleEdit(entity);
  }

  function handleDeleteFromDetail() {
    if (!viewingEntity) return;
    const entity = viewingEntity;
    setViewingEntity(null);
    setDeletingEntity(entity);
  }

  function handleLinkFromDetail() {
    if (!viewingEntity) return;
    setLinkingEntity(viewingEntity);
  }

  function handleViewLinkedEntity(entity: WorldEntity) {
    setViewingEntity(entity);
  }

  function confirmDelete() {
    if (!deletingEntity) return;
    deleteEntity.mutate(
      { campaignId: selectedCampaignId, id: deletingEntity._id },
      {
        onSuccess: () => setDeletingEntity(null),
        onError: () => toast.error('Failed to delete entity'),
      },
    );
  }

  const emptyState = EMPTY_MESSAGES[activeTab];

  return (
    <PageContainer
      title="World"
      subtitle="Your campaign encyclopedia"
      actions={
        <div className="flex items-center gap-3">
          {/* Campaign Selector */}
          <CampaignSelector
            campaigns={campaigns ?? []}
            value={selectedCampaignId}
            onChange={(id) => {
              setSelectedCampaignId(id);
              setActiveTab('all');
              setSearchQuery('');
            }}
          />

          {/* Search */}
          {selectedCampaignId && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-48 rounded-sm border border-input bg-input py-2 pl-9 pr-3 font-[Cinzel] text-xs text-foreground placeholder:text-muted-foreground input-carved"
              />
            </div>
          )}

          {/* Create button */}
          {selectedCampaignId && isDM && (
            <Button onClick={handleCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create
            </Button>
          )}
        </div>
      }
    >
      {/* No campaign selected */}
      {!selectedCampaignId && !campaignsLoading && (
        <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
          <div className="mx-auto max-w-sm">
            <h3 className="mb-2 text-lg font-semibold text-foreground font-['IM_Fell_English']">
              Choose a Campaign
            </h3>
            <p className="text-muted-foreground">
              Select a campaign above to explore its world
            </p>
          </div>
        </div>
      )}

      {/* Campaign selected */}
      {selectedCampaignId && (
        <>
          {/* Tabs */}
          <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
            {WORLD_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2 font-[Cinzel] text-xs uppercase tracking-wider transition-colors ${
                    activeTab === tab.key
                      ? 'border-brass text-brass'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    activeTab === tab.key ? 'bg-brass/20 text-brass' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tabCounts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Loading */}
          {entitiesLoading && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-5 tavern-card texture-leather">
                  <div className="animate-pulse space-y-4">
                    <div className="h-5 w-3/4 rounded bg-muted" />
                    <div className="flex gap-2">
                      <div className="h-4 w-16 rounded bg-muted" />
                      <div className="h-4 w-14 rounded bg-muted" />
                    </div>
                    <div className="h-10 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {entitiesError && (
            <div className="rounded-lg border border-destructive/50 bg-card p-8 text-center">
              <p className="font-medium text-destructive">Failed to load world entities</p>
              <p className="mt-1 text-sm text-muted-foreground">{(entitiesError as Error).message}</p>
            </div>
          )}

          {/* Empty */}
          {!entitiesLoading && !entitiesError && filteredEntities.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
              <div className="mx-auto max-w-sm">
                <h3 className="mb-2 text-lg font-semibold text-foreground font-['IM_Fell_English']">
                  {searchQuery ? 'No results found' : emptyState.title}
                </h3>
                <p className="mb-6 text-muted-foreground">
                  {searchQuery ? `No entities matching "${searchQuery}"` : emptyState.description}
                </p>
                {!searchQuery && isDM && (
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create {activeTab !== 'all' ? EMPTY_MESSAGES[activeTab].title.split(' ').pop() : 'Entity'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Card grid */}
          {!entitiesLoading && !entitiesError && filteredEntities.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEntities.map((entity) => (
                <EntityCard
                  key={entity._id}
                  entity={entity}
                  canEdit={isDM}
                  onEdit={() => handleEdit(entity)}
                  onDelete={() => setDeletingEntity(entity)}
                  onClick={() => handleView(entity)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateEntityModal
        open={showCreateModal}
        onClose={handleCloseCreateModal}
        campaignId={selectedCampaignId}
        entity={editingEntity}
        defaultType={TAB_DEFAULT_TYPES[activeTab]}
      />

      <EntityDetailModal
        open={!!viewingEntity}
        onClose={() => setViewingEntity(null)}
        entity={viewingEntity}
        canEdit={isDM}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
        allEntities={visibleEntities}
        onViewEntity={handleViewLinkedEntity}
        onLinkEntity={handleLinkFromDetail}
      />

      <DeleteEntityModal
        open={!!deletingEntity}
        onClose={() => setDeletingEntity(null)}
        onConfirm={confirmDelete}
        isPending={deleteEntity.isPending}
        entityName={deletingEntity?.name ?? ''}
        entityType={deletingEntity ? TYPE_LABELS[deletingEntity.type] : ''}
      />

      {linkingEntity && (
        <LinkEntityModal
          open={!!linkingEntity}
          onClose={() => setLinkingEntity(null)}
          campaignId={selectedCampaignId}
          entity={linkingEntity}
          allEntities={visibleEntities}
        />
      )}
    </PageContainer>
  );
}
