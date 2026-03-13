import { useMemo, useState } from 'react';
import { Eye, EyeOff, Heart, Minus, Pencil, Plus, Shield, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import { useCampaign } from '@/hooks/useCampaigns';
import {
  useAddAlly,
  useAllies,
  useAllySync,
  useRemoveAlly,
  useUpdateAlly,
  useUpdateAllyHp,
} from '@/hooks/useAllies';
import type { Ally, AllyVisibility, CreateAllyPayload, UpdateAllyPayload } from '@/types/campaign';
import { AllyFormModal } from './AllyFormModal';

interface AllyPanelProps {
  campaignId: string;
}

export function AllyPanel({ campaignId }: AllyPanelProps) {
  const { user } = useAuth();
  const { data: campaign } = useCampaign(campaignId);
  const { data: accessibleCampaigns } = useAccessibleCampaigns();
  const { data: allies, isLoading } = useAllies(campaignId);
  const addAlly = useAddAlly();
  const updateAlly = useUpdateAlly();
  const updateHp = useUpdateAllyHp();
  const removeAlly = useRemoveAlly();
  const [editingAlly, setEditingAlly] = useState<Ally | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingVisibility, setEditingVisibility] = useState<string | null>(null);

  useAllySync(campaignId);

  const campaignRole = accessibleCampaigns?.find((entry) => entry._id === campaignId)?.role;
  const isDM = campaignRole === 'dm' || campaignRole === 'co_dm' || campaign?.dmId === user?._id;

  const activeAllies = useMemo(
    () => (allies ?? []).filter((ally) => !ally.dismissedAt),
    [allies],
  );

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Loading allies...</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Allies ({activeAllies.length})
        </h2>
        {isDM && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Ally
          </Button>
        )}
      </div>

      {activeAllies.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <User className="h-10 w-10 text-muted-foreground/45" />
          <p className="font-[Cinzel] text-lg text-muted-foreground">No allies yet</p>
          <p className="text-sm text-muted-foreground/80">
            {isDM
              ? 'Recruit a world NPC or create a custom familiar, summon, pet, or mount.'
              : 'Your GM has not added any allies yet.'}
          </p>
        </div>
      ) : (
        activeAllies.map((ally) => <AllyCard key={ally._id} ally={ally} isDM={isDM} />)
      )}

      <AllyFormModal
        open={createOpen || !!editingAlly}
        onClose={() => {
          setCreateOpen(false);
          setEditingAlly(null);
        }}
        campaignId={campaignId}
        ally={editingAlly}
        isPending={addAlly.isPending || updateAlly.isPending}
        onSubmit={(payload) => {
          if (editingAlly) {
            updateAlly.mutate(
              { campaignId, id: editingAlly._id, data: payload as UpdateAllyPayload },
              {
                onSuccess: () => {
                  toast.success('Ally updated');
                  setEditingAlly(null);
                },
                onError: () => toast.error('Failed to update ally'),
              },
            );
            return;
          }

          addAlly.mutate(
            { campaignId, data: payload as CreateAllyPayload },
            {
              onSuccess: () => {
                toast.success('Ally created');
                setCreateOpen(false);
              },
              onError: () => toast.error('Failed to create ally'),
            },
          );
        }}
      />

      <ConfirmDialog
        open={deletingId !== null}
        title="Remove Ally"
        description="Remove this ally from the party?"
        confirmLabel="Remove"
        variant="destructive"
        isPending={removeAlly.isPending}
        onCancel={() => setDeletingId(null)}
        onConfirm={() => {
          if (!deletingId) return;
          removeAlly.mutate(
            { campaignId, id: deletingId },
            {
              onSuccess: () => {
                toast.success('Ally removed');
                setDeletingId(null);
              },
              onError: () => toast.error('Failed to remove ally'),
            },
          );
        }}
      />
    </div>
  );

  function AllyCard({ ally, isDM }: { ally: Ally; isDM: boolean }) {
    const hp = ally.statBlock.hp;
    const hpPercent =
      hp?.current !== undefined && hp?.max
        ? Math.max(0, Math.min(100, (hp.current / hp.max) * 100))
        : null;

    return (
      <div className="rounded-lg border border-iron/30 bg-background/30 p-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-['IM_Fell_English'] text-sm text-foreground truncate">{ally.name}</p>
              <span className="rounded-md bg-brass/15 px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider text-brass">
                {ally.kind}
              </span>
              {ally.sourceType === 'world_entity' && (
                <span className="rounded-md bg-forest/15 px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider text-forest">
                  Recruited
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {[ally.role, ally.ownerCharacter?.name ? `Owner: ${ally.ownerCharacter.name}` : null, ally.durationType]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          {isDM && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setEditingAlly(ally)}
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                title="Edit ally"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditingVisibility(editingVisibility === ally._id ? null : ally._id)}
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                title="Toggle visibility"
              >
                {editingVisibility === ally._id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setDeletingId(ally._id)}
                className="rounded p-1 text-muted-foreground hover:text-red-400 hover:bg-red-900/20 transition-colors"
                title="Remove ally"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {ally.description && <p className="text-xs text-muted-foreground/80 italic">{ally.description}</p>}

        <div className="space-y-1.5">
          {hpPercent !== null && (
            <div>
              <div className="mb-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-blood" />
                  <span>{hp?.current} / {hp?.max}</span>
                </div>
                {isDM && (
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const current = hp?.current ?? 0;
                        const max = hp?.max ?? current;
                        updateHp.mutate(
                          { campaignId, id: ally._id, hp: { current: Math.max(0, current - 1), max } },
                          { onError: () => toast.error('Failed to update HP') },
                        );
                      }}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = hp?.current ?? 0;
                        const max = hp?.max ?? current;
                        updateHp.mutate(
                          { campaignId, id: ally._id, hp: { current: Math.min(max, current + 1), max } },
                          { onError: () => toast.error('Failed to update HP') },
                        );
                      }}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full ${hpPercent > 50 ? 'bg-forest' : hpPercent > 25 ? 'bg-gold' : 'bg-blood'}`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>
          )}

          {ally.statBlock.ac !== undefined && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Shield className="h-3 w-3 text-brass" />
              <span>AC {ally.statBlock.ac}</span>
            </div>
          )}

          {ally.statBlock.rawText && (
            <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md border border-iron/20 bg-background/40 p-2 text-[10px] text-muted-foreground">
              {ally.statBlock.rawText}
            </pre>
          )}
        </div>

        {isDM && editingVisibility === ally._id && (
          <div className="border-t border-iron/20 pt-2">
            <p className="mb-1.5 font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">
              Player Visibility
            </p>
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(ally.visibility) as Array<keyof AllyVisibility>).map((key) => (
                <label key={key} className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent/20">
                  <input
                    type="checkbox"
                    checked={ally.visibility[key]}
                    onChange={() =>
                      updateAlly.mutate(
                        {
                          campaignId,
                          id: ally._id,
                          data: { visibility: { [key]: !ally.visibility[key] } },
                        },
                        { onError: () => toast.error('Failed to update visibility') },
                      )
                    }
                    className="accent-primary h-3 w-3"
                  />
                  {key}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}
