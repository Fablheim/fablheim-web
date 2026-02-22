import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCampaigns, useDeleteCampaign } from '@/hooks/useCampaigns';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/layout/PageContainer';
import { CampaignFormModal } from '@/components/campaigns/CreateCampaignModal';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import type { Campaign } from '@/types/campaign';

export function CampaignsPage() {
  const { data: campaigns, isLoading, error } = useCampaigns();
  const deleteCampaign = useDeleteCampaign();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

  function handleEdit(campaign: Campaign) {
    setEditingCampaign(campaign);
    setShowFormModal(true);
  }

  function handleCloseForm() {
    setShowFormModal(false);
    setEditingCampaign(null);
  }

  function handleDelete(campaign: Campaign) {
    setDeletingCampaign(campaign);
  }

  function confirmDelete() {
    if (!deletingCampaign) return;
    deleteCampaign.mutate(deletingCampaign._id, {
      onSuccess: () => setDeletingCampaign(null),
      onError: () => toast.error('Failed to delete campaign'),
    });
  }

  return (
    <PageContainer
      title="Your Campaigns"
      subtitle="Manage your adventures"
      actions={
        <Button onClick={() => setShowFormModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      }
    >
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-6 tavern-card texture-parchment">
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
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-card p-8 text-center">
          <p className="font-medium text-destructive">Failed to load campaigns</p>
          <p className="mt-1 text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      )}

      {campaigns && campaigns.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
          <div className="mx-auto max-w-sm">
            <h3 className="mb-2 text-lg font-semibold text-foreground font-['IM_Fell_English']">No quests yet</h3>
            <p className="mb-6 text-muted-foreground">Begin your first adventure and forge a tale worthy of the ages</p>
            <Button onClick={() => setShowFormModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Forge Your First Quest
            </Button>
          </div>
        </div>
      )}

      {campaigns && campaigns.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign._id}
              campaign={campaign}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <CampaignFormModal
        open={showFormModal}
        onClose={handleCloseForm}
        campaign={editingCampaign}
      />

      {/* Delete confirmation */}
      {deletingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeletingCampaign(null)} />
          <div className="relative w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-warm-lg tavern-card texture-parchment iron-brackets border-t-2 border-t-blood/50">
            <h3 className="text-lg font-semibold text-foreground text-embossed">Delete Campaign</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{deletingCampaign.name}</strong>? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeletingCampaign(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteCampaign.isPending}
              >
                {deleteCampaign.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
