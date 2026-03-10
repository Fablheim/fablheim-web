import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Archive, RotateCcw, Trash2, ChevronDown, ChevronRight, Users, ArrowRight, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  useCampaigns,
  useDeleteCampaign,
  useArchivedCampaigns,
  useRestoreCampaign,
  useDeleteCampaignPermanently,
} from '@/hooks/useCampaigns';
import { useMyCampaignMemberships, useLeaveCampaign } from '@/hooks/useCampaignMembers';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/layout/PageContainer';
import { CampaignFormModal } from '@/components/campaigns/CreateCampaignModal';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import type { Campaign } from '@/types/campaign';

export function CampaignsPage() {
  const { data: campaigns, isLoading, error } = useCampaigns();
  const { data: memberships } = useMyCampaignMemberships();
  const { data: archivedCampaigns } = useArchivedCampaigns();
  const deleteCampaign = useDeleteCampaign();
  const restoreCampaign = useRestoreCampaign();
  const deletePermanently = useDeleteCampaignPermanently();
  const leaveCampaign = useLeaveCampaign();
  const navigate = useNavigate();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [archivingCampaign, setArchivingCampaign] = useState<Campaign | null>(null);
  const [permanentDeleteCampaign, setPermanentDeleteCampaign] = useState<Campaign | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [leaveCampaignId, setLeaveCampaignId] = useState<{ id: string; name: string } | null>(null);

  function handleEdit(campaign: Campaign) {
    setEditingCampaign(campaign);
    setShowFormModal(true);
  }

  function handleCloseForm() {
    setShowFormModal(false);
    setEditingCampaign(null);
  }

  function handleDelete(campaign: Campaign) {
    setArchivingCampaign(campaign);
  }

  function confirmArchive() {
    if (!archivingCampaign) return;
    deleteCampaign.mutate(archivingCampaign._id, {
      onSuccess: () => {
        setArchivingCampaign(null);
        toast.success('Campaign archived');
      },
      onError: (err) => {
        const message =
          (err as any)?.response?.data?.message || 'Failed to archive campaign';
        toast.error(message);
      },
    });
  }

  function handleRestore(campaign: Campaign) {
    restoreCampaign.mutate(campaign._id, {
      onSuccess: () => toast.success(`${campaign.name} restored`),
      onError: () => toast.error('Failed to restore campaign'),
    });
  }

  function handlePermanentDelete(campaign: Campaign) {
    setPermanentDeleteCampaign(campaign);
  }

  function confirmPermanentDelete() {
    if (!permanentDeleteCampaign) return;
    deletePermanently.mutate(permanentDeleteCampaign._id, {
      onSuccess: () => {
        setPermanentDeleteCampaign(null);
        toast.success('Campaign permanently deleted');
      },
      onError: () => toast.error('Failed to delete campaign'),
    });
  }

  return (
    <PageContainer
      title="Your Campaigns"
      subtitle="Manage your adventures"
      actions={
        <Button onClick={() => setShowFormModal(true)} className="shimmer-gold">
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      }
    >
      {renderLoadingState()}
      {renderErrorState()}
      {renderEmptyState()}
      {renderActiveCampaigns()}
      {renderJoinedCampaigns()}
      {renderArchivedSection()}

      {/* Create / Edit modal */}
      <CampaignFormModal
        open={showFormModal}
        onClose={handleCloseForm}
        campaign={editingCampaign}
      />

      {renderArchiveConfirmation()}
      {renderPermanentDeleteConfirmation()}
      <ConfirmDialog
        open={!!leaveCampaignId}
        title="Leave Campaign"
        description={`You will be removed from ${leaveCampaignId?.name ?? 'this campaign'}. You'll need a new invite to rejoin.`}
        confirmLabel="Leave"
        variant="destructive"
        onConfirm={() => {
          if (!leaveCampaignId) return;
          leaveCampaign.mutate(leaveCampaignId.id, {
            onSuccess: () => { toast.success(`Left ${leaveCampaignId.name}`); setLeaveCampaignId(null); },
            onError: () => toast.error('Failed to leave campaign'),
          });
        }}
        onCancel={() => setLeaveCampaignId(null)}
        isPending={leaveCampaign.isPending}
      />
    </PageContainer>
  );

  function renderLoadingState() {
    if (!isLoading) return null;
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {[1, 2, 3].map((i) => (
          <div key={i} className="app-card rounded-lg p-6 tavern-card texture-parchment">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-5/6 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderErrorState() {
    if (!error) return null;
    return (
      <div className="app-empty-state rounded-lg p-8 text-center">
        <p className="font-[Cinzel] text-xl text-destructive">Failed to load campaigns</p>
        <p className="mt-1 text-sm text-muted-foreground">The campaign roster could not be fetched.</p>
        <p className="mt-1 text-xs text-muted-foreground/80">{(error as Error).message}</p>
      </div>
    );
  }

  function renderEmptyState() {
    if (!campaigns || campaigns.length > 0) return null;
    const hasJoined = memberships && memberships.length > 0;
    if (hasJoined) return null; // Don't show "no quests" if they have joined campaigns
    return (
      <div className="app-empty-state rounded-lg p-12 text-center texture-parchment">
        <div className="mx-auto max-w-sm">
          <h3 className="mb-2 text-lg font-semibold text-foreground font-['IM_Fell_English']">No quests yet</h3>
          <p className="mb-2 text-muted-foreground">Begin your first adventure and forge a tale worthy of the ages.</p>
          <p className="mb-6 text-sm text-muted-foreground/80">You can also join an existing campaign via invite.</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button onClick={() => setShowFormModal(true)} className="shimmer-gold">
              <Plus className="mr-2 h-4 w-4" />
              Forge Your First Quest
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function renderActiveCampaigns() {
    if (!campaigns || campaigns.length === 0) return null;
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign._id}
            campaign={campaign}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  }

  function renderJoinedCampaigns() {
    // Filter out campaigns the user owns as DM
    const dmIds = new Set(campaigns?.map((c) => c._id) ?? []);
    const joined = memberships?.filter((m) => !dmIds.has(m.campaignId._id)) ?? [];
    if (joined.length === 0) return null;

    return (
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-[Cinzel] text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Joined Campaigns ({joined.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {joined.map((m) => (
            <div
              key={m._id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/app/campaigns/${m.campaignId._id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/app/campaigns/${m.campaignId._id}`); } }}
              className="app-card group h-full cursor-pointer rounded-lg p-6 tavern-card texture-parchment transition-all duration-200 hover:border-gold hover:shadow-glow hover-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-card-foreground font-[Cinzel]">{m.campaignId.name}</h3>
                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">{m.role.replace('_', '-')}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLeaveCampaignId({ id: m.campaignId._id, name: m.campaignId.name });
                  }}
                  className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-blood/10 hover:text-[hsl(0,60%,55%)] group-hover:opacity-100"
                  title="Leave campaign"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
              {m.campaignId.description && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{m.campaignId.description}</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                  m.campaignId.status === 'active' ? 'bg-forest/20 text-[hsl(150,50%,55%)]' : 'bg-muted text-muted-foreground'
                }`}>
                  {m.campaignId.status}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderArchivedSection() {
    if (!archivedCampaigns || archivedCampaigns.length === 0) return null;
    return (
      <div className="mt-10">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          {showArchived
            ? <ChevronDown className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />}
          <Archive className="h-4 w-4" />
          <span className="font-[Cinzel] text-sm font-medium uppercase tracking-wider">
            Archived Campaigns ({archivedCampaigns.length})
          </span>
        </button>

        {showArchived && (
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            {archivedCampaigns.map((campaign) => (
              <div
                key={campaign._id}
                className="app-card h-full rounded-lg p-6 opacity-70 tavern-card texture-parchment transition-opacity hover:opacity-90"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-muted-foreground font-[Cinzel]">
                      {campaign.name}
                    </h3>
                    {campaign.setting && (
                      <p className="mt-0.5 text-xs text-muted-foreground/70">{campaign.setting}</p>
                    )}
                  </div>
                </div>

                {campaign.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground/70">
                    {campaign.description}
                  </p>
                )}

                {campaign.archivedAt && (
                  <p className="mt-2 text-xs text-muted-foreground/60">
                    Archived {new Date(campaign.archivedAt).toLocaleDateString()}
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(campaign)}
                    disabled={restoreCampaign.isPending}
                  >
                    <RotateCcw className="mr-1.5 h-3 w-3" />
                    Restore
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handlePermanentDelete(campaign)}
                  >
                    <Trash2 className="mr-1.5 h-3 w-3" />
                    Delete Forever
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderArchiveConfirmation() {
    if (!archivingCampaign) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setArchivingCampaign(null)} />
        <div className="relative w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-warm-lg tavern-card texture-parchment iron-brackets border-t-2 border-t-brass/50">
          <h3 className="text-lg font-semibold text-foreground text-embossed">Archive Campaign</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This will archive <strong className="text-foreground">{archivingCampaign.name}</strong>.
            You can restore it later or permanently delete it from the archived section.
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setArchivingCampaign(null)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={confirmArchive}
              disabled={deleteCampaign.isPending}
            >
              <Archive className="mr-2 h-4 w-4" />
              {deleteCampaign.isPending ? 'Archiving...' : 'Archive'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function renderPermanentDeleteConfirmation() {
    if (!permanentDeleteCampaign) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPermanentDeleteCampaign(null)} />
        <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-warm-lg tavern-card texture-parchment iron-brackets border-t-2 border-t-blood/50">
          <h3 className="text-lg font-semibold text-destructive text-embossed">Permanently Delete Campaign</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This will permanently delete{' '}
            <strong className="text-foreground">{permanentDeleteCampaign.name}</strong>{' '}
            and ALL associated data (sessions, characters, world entities, notes).
            This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setPermanentDeleteCampaign(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmPermanentDelete}
              disabled={deletePermanently.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deletePermanently.isPending ? 'Deleting...' : 'Delete Forever'}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
