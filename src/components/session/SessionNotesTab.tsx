import { useState } from 'react';
import { Save, Plus, Pin, PinOff, Trash2, ChevronDown, ChevronRight, Share2, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useNotebook, useCreateNote, useUpdateNote, useDeleteNote, useTogglePin, usePinnedNotes, useUnpinFromSession, useShareNote, useUnshareNote } from '@/hooks/useNotebook';
import type { NotebookEntry } from '@/types/notebook';

interface SessionNotesTabProps {
  campaignId: string;
  sessionId?: string;
  sessionNumber?: number;
}

function NoteEditor({
  note,
  campaignId,
  onClose,
}: {
  note?: NotebookEntry;
  campaignId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const saving = createNote.isPending || updateNote.isPending;

  function handleSave() {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (note) {
      updateNote.mutate(
        { campaignId, noteId: note._id, payload: { title: title.trim(), content } },
        {
          onSuccess: () => {
            toast.success('Note updated');
            onClose();
          },
        },
      );
    } else {
      createNote.mutate(
        { campaignId, title: title.trim(), content, category: 'session_notes' },
        {
          onSuccess: () => {
            toast.success('Note created');
            onClose();
          },
        },
      );
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title..."
        className="w-full input-carved rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground font-[Cinzel] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your notes here..."
        rows={10}
        className="w-full input-carved rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground font-['IM_Fell_English'] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" disabled={saving} onClick={handleSave}>
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

function NoteCard({
  note,
  campaignId,
  onEdit,
}: {
  note: NotebookEntry;
  campaignId: string;
  onEdit: () => void;
}) {
  const togglePin = useTogglePin();
  const deleteNote = useDeleteNote();
  const shareNote = useShareNote();
  const unshareNote = useUnshareNote();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isShared = note.visibleTo === 'all';

  return (
    <>
    <ConfirmDialog
      open={showDeleteConfirm}
      title="Delete Note?"
      description="This note will be permanently deleted."
      confirmLabel="Delete"
      variant="destructive"
      isPending={deleteNote.isPending}
      onConfirm={() => {
        deleteNote.mutate({ campaignId, noteId: note._id });
        setShowDeleteConfirm(false);
      }}
      onCancel={() => setShowDeleteConfirm(false)}
    />
    <div
      className={`group rounded-md border p-3 cursor-pointer transition-all hover:border-gold/30 hover:shadow-glow-sm ${
        note.isPinned ? 'border-primary/30 bg-primary/5' : 'border-iron/30 bg-accent/20'
      }`}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {note.isPinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
            <p className="font-[Cinzel] text-sm font-medium text-foreground truncate">{note.title}</p>
            {isShared && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-forest/15 px-1.5 py-0.5 text-[9px] text-[hsl(150,50%,55%)]">
                <Share2 className="h-2.5 w-2.5" />
                Shared
              </span>
            )}
          </div>
          {note.content && (
            <p className="mt-1 text-xs text-muted-foreground font-['IM_Fell_English'] italic line-clamp-2">
              {note.content}
            </p>
          )}
          <p className="mt-1 text-[10px] text-muted-foreground">
            {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
          {isShared ? (
            <button
              onClick={() => unshareNote.mutate({ campaignId, noteId: note._id })}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Hide from players"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => shareNote.mutate({ campaignId, noteId: note._id })}
              className="rounded p-1 text-muted-foreground hover:bg-forest/20 hover:text-[hsl(150,50%,55%)]"
              title="Share with players"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => togglePin.mutate({ campaignId, noteId: note._id })}
            className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-primary/10"
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

export function SessionNotesTab({ campaignId, sessionId }: SessionNotesTabProps) {
  const { data, isLoading } = useNotebook(campaignId, { category: 'session_notes' });
  const { data: pinnedNotes } = usePinnedNotes(campaignId, sessionId ?? '');
  const unpinFromSession = useUnpinFromSession();
  const [expandedPinnedId, setExpandedPinnedId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<NotebookEntry | null>(null);
  const [creating, setCreating] = useState(false);

  if (creating || editingNote) {
    return (
      <div className="p-4">
        <NoteEditor
          note={editingNote ?? undefined}
          campaignId={campaignId}
          onClose={() => {
            setEditingNote(null);
            setCreating(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {pinnedNotes && pinnedNotes.length > 0 && (
        <>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Pin className="h-3.5 w-3.5 text-brass" />
              <h3 className="text-carved font-[Cinzel] tracking-wider text-xs font-semibold text-foreground uppercase">
                Pinned to Session
              </h3>
            </div>
            <div className="space-y-2">
              {pinnedNotes.map((note) => {
                const isExpanded = expandedPinnedId === note._id;
                return (
                  <div
                    key={note._id}
                    className="rounded-md border border-brass/30 bg-brass/5"
                  >
                    <div className="flex items-center justify-between gap-2 p-3">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                        onClick={() =>
                          setExpandedPinnedId(isExpanded ? null : note._id)
                        }
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="font-[Cinzel] text-sm font-medium text-foreground truncate">
                          {note.title}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          unpinFromSession.mutate({
                            campaignId,
                            noteId: note._id,
                          })
                        }
                        className="shrink-0 rounded p-1 text-muted-foreground hover:text-brass hover:bg-brass/10"
                        title="Unpin from session"
                      >
                        <PinOff className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {isExpanded && note.content && (
                      <div className="border-t border-brass/20 px-3 py-2 text-sm text-foreground font-['IM_Fell_English'] prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {note.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <hr className="border-border/50" />
        </>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-carved font-[Cinzel] tracking-wider text-xs font-semibold text-foreground uppercase">
          Session Notes
        </h3>
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Note
        </Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-16 rounded-md bg-muted" />
          <div className="h-16 rounded-md bg-muted" />
        </div>
      ) : !data?.notes?.length ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground font-['IM_Fell_English'] italic">
            No session notes yet. Create one to start tracking your adventure.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.notes
            .sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1))
            .map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                campaignId={campaignId}
                onEdit={() => setEditingNote(note)}
              />
            ))}
        </div>
      )}
    </div>
  );
}
