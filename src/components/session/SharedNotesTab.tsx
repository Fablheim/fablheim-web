import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSharedNotes } from '@/hooks/useNotebook';
import { useSocketEvent } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { categoryLabels } from '@/types/notebook';
import type { NotebookEntry, NoteCategory } from '@/types/notebook';

interface SharedNotesTabProps {
  campaignId: string;
}

export function SharedNotesTab({ campaignId }: SharedNotesTabProps) {
  const { data: notes, isLoading } = useSharedNotes(campaignId);
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useSocketEvent('note:shared', (data: { noteId?: string; title?: string }) => {
    queryClient.invalidateQueries({ queryKey: ['notebook', campaignId, 'shared'] });
    toast(
      `DM shared a note: ${data?.title ?? 'Untitled'}`,
      { duration: 4000 },
    );
  });

  useSocketEvent('note:unshared', (data: { noteId?: string }) => {
    queryClient.invalidateQueries({ queryKey: ['notebook', campaignId, 'shared'] });
    if (data?.noteId && expandedId === data.noteId) {
      setExpandedId(null);
      toast('A shared note was removed', { duration: 3000 });
    }
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-2 animate-pulse">
        <div className="h-12 rounded bg-muted/60" />
        <div className="h-12 rounded bg-muted/60" />
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground font-['IM_Fell_English'] italic">
          No shared notes yet. The DM can share notes for you to read here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-carved font-[Cinzel] tracking-wider text-xs font-semibold text-foreground uppercase">
        Shared Notes
      </h3>
      <div className="space-y-2">
        {notes.map((note) => renderNote(note))}
      </div>
    </div>
  );

  function renderNote(note: NotebookEntry) {
    const isExpanded = expandedId === note._id;
    const catLabel = categoryLabels[note.category as NoteCategory] ?? note.category;

    return (
      <div
        key={note._id}
        className="rounded-md border border-brass/30 bg-brass/5"
      >
        <button
          type="button"
          className="flex w-full items-center gap-2 p-3 text-left"
          onClick={() => setExpandedId(isExpanded ? null : note._id)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="font-[Cinzel] text-sm font-medium text-foreground truncate flex-1">
            {note.title}
          </span>
          <span className="shrink-0 rounded-full bg-brass/15 px-2 py-0.5 text-[9px] font-medium text-brass font-[Cinzel] uppercase tracking-wider">
            {catLabel}
          </span>
        </button>
        {isExpanded && note.content && (
          <div className="border-t border-brass/20 px-3 py-2 text-sm text-foreground font-['IM_Fell_English'] prose prose-sm prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {note.content}
            </ReactMarkdown>
          </div>
        )}
        {isExpanded && !note.content && (
          <div className="border-t border-brass/20 px-3 py-2">
            <p className="text-xs text-muted-foreground italic">No content</p>
          </div>
        )}
      </div>
    );
  }
}
