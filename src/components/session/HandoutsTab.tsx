import { useState } from 'react';
import {
  Plus,
  Share2,
  EyeOff,
  Image,
  FileText,
  Map,
  Trash2,
  Pencil,
  X,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import {
  useHandouts,
  useCreateHandout,
  useShareHandout,
  useUnshareHandout,
  useUpdateHandout,
  useDeleteHandout,
} from '@/hooks/useHandouts';
import { useSocketEvent } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import type { Handout } from '@/types/campaign';

interface HandoutsTabProps {
  campaignId: string;
  isDM: boolean;
}

const TYPE_ICONS = {
  image: Image,
  text: FileText,
  map: Map,
};

const inputClass =
  'block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

export function HandoutsTab({ campaignId, isDM }: HandoutsTabProps) {
  const role = isDM ? 'dm' : 'player';
  const { data: handouts, isLoading } = useHandouts(campaignId, role);
  const createHandout = useCreateHandout();
  const shareHandout = useShareHandout();
  const unshareHandout = useUnshareHandout();
  const updateHandout = useUpdateHandout();
  const deleteHandout = useDeleteHandout();
  const queryClient = useQueryClient();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHandout, setEditingHandout] = useState<Handout | null>(null);
  const [viewingHandout, setViewingHandout] = useState<Handout | null>(null);

  // Create form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'text' | 'image' | 'map'>('text');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Real-time: invalidate handouts when shared/unshared
  useSocketEvent('handout:shared', () => {
    queryClient.invalidateQueries({ queryKey: ['handouts', campaignId] });
  });
  useSocketEvent('handout:unshared', () => {
    queryClient.invalidateQueries({ queryKey: ['handouts', campaignId] });
  });

  // Track new handouts for "New!" badge
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  function resetForm() {
    setTitle('');
    setType('text');
    setContent('');
    setImageUrl('');
    setShowCreateForm(false);
    setEditingHandout(null);
  }

  function handleCreate() {
    if (!title.trim()) return;
    createHandout.mutate(
      {
        campaignId,
        data: {
          title: title.trim(),
          type,
          content: content || undefined,
          imageUrl: imageUrl || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Handout created');
          resetForm();
        },
        onError: () => toast.error('Failed to create handout'),
      },
    );
  }

  function handleUpdate() {
    if (!editingHandout || !title.trim()) return;
    updateHandout.mutate(
      {
        campaignId,
        handoutId: editingHandout._id,
        data: {
          title: title.trim(),
          content: content || undefined,
          imageUrl: imageUrl || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Handout updated');
          resetForm();
        },
        onError: () => toast.error('Failed to update handout'),
      },
    );
  }

  function handleShare(handoutId: string) {
    shareHandout.mutate(
      { campaignId, handoutId },
      {
        onSuccess: () => toast.success('Handout shared with players'),
        onError: () => toast.error('Failed to share handout'),
      },
    );
  }

  function handleUnshare(handoutId: string) {
    unshareHandout.mutate(
      { campaignId, handoutId },
      {
        onSuccess: () => toast.success('Handout hidden from players'),
        onError: () => toast.error('Failed to unshare handout'),
      },
    );
  }

  function handleDelete(handoutId: string) {
    if (!confirm('Delete this handout?')) return;
    deleteHandout.mutate(
      { campaignId, handoutId },
      {
        onSuccess: () => toast.success('Handout deleted'),
        onError: () => toast.error('Failed to delete handout'),
      },
    );
  }

  function startEdit(h: Handout) {
    setEditingHandout(h);
    setTitle(h.title);
    setType(h.type as 'text' | 'image' | 'map');
    setContent(h.content);
    setImageUrl(h.imageUrl ?? '');
    setShowCreateForm(true);
  }

  function markSeen(id: string) {
    setSeenIds((prev) => new Set(prev).add(id));
  }

  const isFormOpen = showCreateForm || !!editingHandout;
  const isPending = createHandout.isPending || updateHandout.isPending;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-['IM_Fell_English'] text-lg text-foreground">Handouts</h2>
        {isDM && !isFormOpen && (
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Handout
          </Button>
        )}
      </div>

      {/* Create/Edit form */}
      {isFormOpen && isDM && (
        <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3 tavern-card">
          <div className="flex items-center justify-between">
            <p className="font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
              {editingHandout ? 'Edit Handout' : 'New Handout'}
            </p>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Handout title..."
              maxLength={200}
              className={inputClass}
            />
          </div>
          {!editingHandout && (
            <div>
              <label className={labelClass}>Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'text' | 'image' | 'map')}
                className={inputClass}
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="map">Map</option>
              </select>
            </div>
          )}
          {(type === 'image' || type === 'map') && (
            <div>
              <label className={labelClass}>Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label className={labelClass}>Content</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Handout content or description..."
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
            <Button
              size="sm"
              disabled={!title.trim() || isPending}
              onClick={editingHandout ? handleUpdate : handleCreate}
            >
              {isPending ? 'Saving...' : editingHandout ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-4">
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="mt-2 h-3 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!handouts || handouts.length === 0) && (
        <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-8 text-center texture-parchment">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 font-['IM_Fell_English'] text-muted-foreground">
            {isDM ? 'No handouts yet. Create one to share with players.' : 'No handouts shared yet.'}
          </p>
        </div>
      )}

      {/* Handout list */}
      {handouts && handouts.length > 0 && (
        <div className="space-y-3">
          {handouts.map((h) => {
            const Icon = TYPE_ICONS[h.type as keyof typeof TYPE_ICONS] ?? FileText;
            const isShared = h.visibleTo === 'all';
            const isNew = !isDM && h.sharedAt && !seenIds.has(h._id);

            return (
              <div
                key={h._id}
                className="group rounded-lg border border-border bg-card p-4 tavern-card texture-leather transition-all hover:border-gold/40"
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brass" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setViewingHandout(viewingHandout?._id === h._id ? null : h);
                          if (isNew) markSeen(h._id);
                        }}
                        className="truncate font-[Cinzel] font-semibold text-card-foreground hover:text-brass transition-colors"
                      >
                        {h.title}
                      </button>
                      {isNew && (
                        <span className="flex items-center gap-1 rounded-md bg-gold/20 px-1.5 py-0.5 text-[10px] text-gold">
                          <Sparkles className="h-3 w-3" />
                          New!
                        </span>
                      )}
                      {isDM && (
                        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] ${
                          isShared ? 'bg-forest/15 text-[hsl(150,50%,55%)]' : 'bg-arcane/15 text-arcane'
                        }`}>
                          {isShared ? <Share2 className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {isShared ? 'Shared' : 'DM Only'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* DM actions */}
                  {isDM && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isShared ? (
                        <button
                          onClick={() => handleUnshare(h._id)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Hide from players"
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleShare(h._id)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-forest/20 hover:text-[hsl(150,50%,55%)]"
                          title="Share with players"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(h)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(h._id)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded content */}
                {viewingHandout?._id === h._id && (
                  <div className="mt-3 border-t border-border/50 pt-3">
                    {h.imageUrl && (
                      <img
                        src={h.imageUrl}
                        alt={h.title}
                        className="mb-3 max-h-64 rounded-md border border-border object-contain"
                      />
                    )}
                    {h.content && (
                      <p className="whitespace-pre-wrap font-['IM_Fell_English'] text-sm italic leading-relaxed text-muted-foreground">
                        {h.content}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
