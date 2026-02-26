import { useState, useMemo } from 'react';
import { Plus, Users, Scroll } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useTabs } from '@/context/TabContext';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import { useCharacters, useDeleteCharacter } from '@/hooks/useCharacters';
import { useWorldNPCs, useDeleteWorldEntity } from '@/hooks/useWorldEntities';
import { resolveRouteContent } from '@/routes';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/layout/PageContainer';
import { CampaignSelector } from '@/components/ui/CampaignSelector';
import { CharacterCard, type CharacterListItem } from '@/components/characters/CharacterCard';
import { CharacterFormModal } from '@/components/characters/CharacterFormModal';
import { NPCFormModal } from '@/components/characters/NPCFormModal';
import { CharacterDetailModal } from '@/components/characters/CharacterDetailModal';
import { DeleteCharacterModal } from '@/components/characters/DeleteCharacterModal';
import type { Character, WorldEntity, CampaignSystem } from '@/types/campaign';

type FilterTab = 'all' | 'pc' | 'npc';

export function CharactersPage() {
  const { user } = useAuth();
  const { openTab } = useTabs();
  const { data: campaigns, isLoading: campaignsLoading } = useAccessibleCampaigns();

  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  // Modals
  const [showPCModal, setShowPCModal] = useState(false);
  const [showNPCModal, setShowNPCModal] = useState(false);
  const [editingPC, setEditingPC] = useState<Character | null>(null);
  const [editingNPC, setEditingNPC] = useState<WorldEntity | null>(null);
  const [viewingItem, setViewingItem] = useState<CharacterListItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<CharacterListItem | null>(null);

  // Data
  const {
    data: characters,
    isLoading: charsLoading,
    error: charsError,
  } = useCharacters(selectedCampaignId);

  const {
    data: npcs,
    isLoading: npcsLoading,
    error: npcsError,
  } = useWorldNPCs(selectedCampaignId);

  const deleteCharacter = useDeleteCharacter();
  const deleteWorldEntity = useDeleteWorldEntity();

  // Derived
  const selectedCampaign = campaigns?.find((c) => c._id === selectedCampaignId);
  const isDM = selectedCampaign?.role === 'dm' || selectedCampaign?.role === 'co_dm';
  const isLoading = charsLoading || npcsLoading;
  const error = charsError || npcsError;

  // Build unified list with permission filtering
  const items = useMemo(() => {
    const result: CharacterListItem[] = [];

    // PCs: DM sees all, players see only their own
    if (characters) {
      for (const char of characters) {
        if (isDM || char.userId === user?._id) {
          result.push({ kind: 'pc', data: char });
        }
      }
    }

    // NPCs: DM sees all, players see only public
    if (npcs) {
      for (const npc of npcs) {
        if (isDM || npc.visibility === 'public') {
          result.push({ kind: 'npc', data: npc });
        }
      }
    }

    return result;
  }, [characters, npcs, isDM, user?._id]);

  // Apply filter
  const filteredItems = useMemo(() => {
    if (filter === 'pc') return items.filter((i) => i.kind === 'pc');
    if (filter === 'npc') return items.filter((i) => i.kind === 'npc');
    return items;
  }, [items, filter]);

  const pcCount = items.filter((i) => i.kind === 'pc').length;
  const npcCount = items.filter((i) => i.kind === 'npc').length;

  // Handlers
  function canEditItem(item: CharacterListItem): boolean {
    if (item.kind === 'pc') return item.data.userId === user?._id;
    if (item.kind === 'npc') return isDM;
    return false;
  }

  function handleEdit(item: CharacterListItem) {
    if (item.kind === 'pc') {
      setEditingPC(item.data);
      setShowPCModal(true);
    } else {
      setEditingNPC(item.data);
      setShowNPCModal(true);
    }
  }

  function handleClosePCModal() {
    setShowPCModal(false);
    setEditingPC(null);
  }

  function handleCloseNPCModal() {
    setShowNPCModal(false);
    setEditingNPC(null);
  }

  function handleDelete(item: CharacterListItem) {
    setDeletingItem(item);
  }

  function confirmDelete() {
    if (!deletingItem) return;

    if (deletingItem.kind === 'pc') {
      deleteCharacter.mutate(
        { id: deletingItem.data._id, campaignId: selectedCampaignId },
        {
          onSuccess: () => setDeletingItem(null),
          onError: () => toast.error('Failed to delete character'),
        },
      );
    } else {
      deleteWorldEntity.mutate(
        { campaignId: selectedCampaignId, id: deletingItem.data._id },
        {
          onSuccess: () => setDeletingItem(null),
          onError: () => toast.error('Failed to delete NPC'),
        },
      );
    }
  }

  function handleViewDetail(item: CharacterListItem) {
    if (item.kind === 'pc') {
      const path = `/app/characters/${item.data._id}`;
      openTab({
        title: item.data.name,
        path,
        content: resolveRouteContent(path, item.data.name),
      });
    } else {
      setViewingItem(item);
    }
  }

  function handleEditFromDetail() {
    if (!viewingItem) return;
    setViewingItem(null);
    handleEdit(viewingItem);
  }

  function handleDeleteFromDetail() {
    if (!viewingItem) return;
    setViewingItem(null);
    handleDelete(viewingItem);
  }

  // Filter tabs
  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: items.length },
    { key: 'pc', label: 'Player Characters', count: pcCount },
    { key: 'npc', label: 'NPCs', count: npcCount },
  ];

  return (
    <PageContainer
      title="Characters"
      subtitle="Manage your party and NPCs"
      actions={
        <div className="flex items-center gap-3">
          {/* Campaign Selector */}
          <CampaignSelector
            campaigns={campaigns ?? []}
            value={selectedCampaignId}
            onChange={(id) => {
              setSelectedCampaignId(id);
              setFilter('all');
            }}
          />

          {selectedCampaignId && (
            <>
              <Button onClick={() => {
                const path = `/app/campaigns/${selectedCampaignId}/characters/create`;
                openTab({
                  title: 'Create Character',
                  path,
                  content: resolveRouteContent(path, 'Create Character'),
                });
              }}>
                <Plus className="mr-1.5 h-4 w-4" />
                Character
              </Button>
              {isDM && (
                <Button variant="secondary" onClick={() => setShowNPCModal(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  NPC
                </Button>
              )}
            </>
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
              Select a campaign above to view its characters and NPCs
            </p>
          </div>
        </div>
      )}

      {/* Campaign selected — show content */}
      {selectedCampaignId && (
        <>
          {/* Filter tabs */}
          <div className="mb-6 flex gap-1 border-b border-border">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 font-[Cinzel] text-xs uppercase tracking-wider transition-colors ${
                  filter === tab.key
                    ? 'border-brass text-brass'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {tab.key === 'pc' && <Users className="h-3.5 w-3.5" />}
                {tab.key === 'npc' && <Scroll className="h-3.5 w-3.5" />}
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  filter === tab.key ? 'bg-brass/20 text-brass' : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-5 tavern-card texture-leather">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 w-3/4 rounded bg-muted" />
                    <div className="h-4 w-1/2 rounded bg-muted" />
                    <div className="flex gap-2">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="h-8 w-10 rounded bg-muted" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-card p-8 text-center">
              <p className="font-medium text-destructive">Failed to load characters</p>
              <p className="mt-1 text-sm text-muted-foreground">{(error as Error).message}</p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && filteredItems.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
              <div className="mx-auto max-w-sm">
                <h3 className="mb-2 text-lg font-semibold text-foreground font-['IM_Fell_English']">
                  {filter === 'npc'
                    ? 'No NPCs yet'
                    : filter === 'pc'
                      ? 'No adventurers yet'
                      : 'No souls have gathered here'}
                </h3>
                <p className="mb-6 text-muted-foreground">
                  {filter === 'npc'
                    ? 'Populate your world with memorable characters'
                    : filter === 'pc'
                      ? 'Create a character to join the adventure'
                      : 'Create a character or NPC to begin'}
                </p>
                {filter !== 'npc' && selectedCampaignId && (
                  <Button onClick={() => {
                    const path = `/app/campaigns/${selectedCampaignId}/characters/create`;
                    openTab({
                      title: 'Create Character',
                      path,
                      content: resolveRouteContent(path, 'Create Character'),
                    });
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Character
                  </Button>
                )}
                {filter === 'npc' && isDM && (
                  <Button onClick={() => setShowNPCModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create NPC
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Card grid */}
          {!isLoading && !error && filteredItems.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <CharacterCard
                  key={`${item.kind}-${item.data._id}`}
                  item={item}
                  canEdit={canEditItem(item)}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item)}
                  onClick={() => handleViewDetail(item)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CharacterFormModal
        open={showPCModal}
        onClose={handleClosePCModal}
        campaignId={selectedCampaignId}
        character={editingPC}
        campaignSystem={(selectedCampaign?.system as CampaignSystem) || 'dnd5e'}
      />

      <NPCFormModal
        open={showNPCModal}
        onClose={handleCloseNPCModal}
        campaignId={selectedCampaignId}
        entity={editingNPC}
      />

      <CharacterDetailModal
        open={!!viewingItem}
        onClose={() => setViewingItem(null)}
        item={viewingItem}
        canEdit={viewingItem ? canEditItem(viewingItem) : false}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
        campaignSystem={selectedCampaign?.system}
      />

      <DeleteCharacterModal
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={confirmDelete}
        isPending={deleteCharacter.isPending || deleteWorldEntity.isPending}
        itemName={deletingItem?.data.name ?? ''}
        itemType={deletingItem?.kind === 'npc' ? 'NPC' : 'character'}
      />
    </PageContainer>
  );
}
