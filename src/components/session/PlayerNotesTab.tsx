import { useState } from 'react';
import { Save, Plus, Pin, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePlayerNotes } from '@/hooks/usePlayerNotes';
import type { PlayerNote } from '@/hooks/usePlayerNotes';

interface PlayerNotesTabProps {
  campaignId: string;
}

function NoteEditor({
  note,
  campaignId,
  onClose,
}: {
  note?: PlayerNote;
  campaignId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const { addNote, updateNote } = usePlayerNotes(campaignId);

  function handleSave() {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (note) {
      updateNote(note.id, { title: title.trim(), content });
      toast.success('Note updated');
    } else {
      addNote(title.trim(), content);
      toast.success('Note created');
    }
    onClose();
  }

  return (
    <div className="space-y-3">
      {renderInputs()}
      {renderActions()}
    </div>
  );

  function renderInputs() {
    return (
      <>
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
      </>
    );
  }

  function renderActions() {
    return (
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" onClick={handleSave}>
          <Save className="mr-1.5 h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    );
  }
}

function NoteCard({
  note,
  campaignId,
  onEdit,
}: {
  note: PlayerNote;
  campaignId: string;
  onEdit: () => void;
}) {
  const { togglePin, deleteNote } = usePlayerNotes(campaignId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Note?"
        description="This note will be permanently deleted."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          deleteNote(note.id);
          setShowDeleteConfirm(false);
          toast.success('Note deleted');
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <div
        className={`group rounded-md border cursor-pointer transition-all hover:border-gold/30 hover:shadow-glow-sm ${
          note.isPinned ? 'border-primary/30 bg-primary/5' : 'border-iron/30 bg-accent/20'
        }`}
      >
        {renderHeader()}
        {renderExpandedContent()}
      </div>
    </>
  );

  function renderHeader() {
    return (
      <div
        className="flex items-start justify-between gap-2 p-3"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="min-w-0 flex-1">
          {renderTitleRow()}
          {renderPreview()}
        </div>
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {renderCardActions()}
        </div>
      </div>
    );
  }

  function renderTitleRow() {
    return (
      <div className="flex items-center gap-1.5">
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        {note.isPinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
        <p className="font-[Cinzel] text-sm font-medium text-foreground truncate">{note.title}</p>
      </div>
    );
  }

  function renderPreview() {
    if (expanded || !note.content) return null;
    return (
      <p className="mt-1 ml-[18px] text-xs text-muted-foreground font-['IM_Fell_English'] italic line-clamp-2">
        {note.content.slice(0, 100)}
      </p>
    );
  }

  function renderCardActions() {
    return (
      <>
        <button
          type="button"
          onClick={() => onEdit()}
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent/60"
          title="Edit"
        >
          <Save className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => togglePin(note.id)}
          className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-primary/10"
          title={note.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </>
    );
  }

  function renderExpandedContent() {
    if (!expanded || !note.content) return null;
    return (
      <div className="border-t border-border/30 px-3 py-2 text-sm text-foreground font-['IM_Fell_English'] prose prose-sm prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
      </div>
    );
  }
}

export function PlayerNotesTab({ campaignId }: PlayerNotesTabProps) {
  const { notes } = usePlayerNotes(campaignId);
  const [editingNote, setEditingNote] = useState<PlayerNote | null>(null);
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
      {renderListHeader()}
      {renderNotesList()}
    </div>
  );

  function renderListHeader() {
    return (
      <div className="flex items-center justify-between">
        <h3 className="text-carved font-[Cinzel] tracking-wider text-xs font-semibold text-foreground uppercase">
          My Notes
        </h3>
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Note
        </Button>
      </div>
    );
  }

  function renderNotesList() {
    if (notes.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground font-['IM_Fell_English'] italic">
            No notes yet — click &apos;New Note&apos; to get started
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            campaignId={campaignId}
            onEdit={() => setEditingNote(note)}
          />
        ))}
      </div>
    );
  }
}
