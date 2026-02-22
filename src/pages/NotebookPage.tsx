import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  BookOpen,
  ScrollText,
  Compass,
  Globe,
  Users,
  Target,
  FileText,
} from 'lucide-react';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import {
  useNotebook,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useTogglePin,
} from '@/hooks/useNotebook';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/layout/PageContainer';
import { CampaignSelector } from '@/components/ui/CampaignSelector';
import { NoteFormModal } from '@/components/notebook/NoteFormModal';
import { DeleteNoteModal } from '@/components/notebook/DeleteNoteModal';
import type { NotebookEntry, NoteCategory } from '@/types/notebook';
import { categoryLabels } from '@/types/notebook';

type NotebookTab = 'all' | NoteCategory;

const TABS: { key: NotebookTab; label: string; icon: typeof BookOpen }[] = [
  { key: 'all', label: 'All', icon: BookOpen },
  { key: 'session_notes', label: 'Sessions', icon: ScrollText },
  { key: 'plot_threads', label: 'Plot', icon: Compass },
  { key: 'world_lore', label: 'World', icon: Globe },
  { key: 'npc_notes', label: 'NPCs', icon: Users },
  { key: 'player_tracking', label: 'Players', icon: Target },
  { key: 'general', label: 'General', icon: FileText },
];

const CATEGORY_ICONS: Record<NoteCategory, typeof BookOpen> = {
  session_notes: ScrollText,
  plot_threads: Compass,
  world_lore: Globe,
  npc_notes: Users,
  player_tracking: Target,
  general: FileText,
};

export function NotebookPage() {
  const { data: campaigns, isLoading: campaignsLoading } = useAccessibleCampaigns();

  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [activeTab, setActiveTab] = useState<NotebookTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingNote, setEditingNote] = useState<NotebookEntry | null>(null);
  const [deletingNote, setDeletingNote] = useState<NotebookEntry | null>(null);

  // Only show campaigns where user is DM or Co-DM
  const dmCampaigns = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.filter((c) => c.role === 'dm' || c.role === 'co_dm');
  }, [campaigns]);

  // Data
  const categoryFilter = activeTab === 'all' ? undefined : activeTab;
  const {
    data: notebookData,
    isLoading: notesLoading,
    error: notesError,
  } = useNotebook(selectedCampaignId, { category: categoryFilter });

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const togglePin = useTogglePin();

  // Tab counts from full list (fetch all for counts, filter client-side)
  const { data: allNotesData } = useNotebook(selectedCampaignId);

  const tabCounts = useMemo(() => {
    const counts: Record<NotebookTab, number> = {
      all: 0,
      session_notes: 0,
      plot_threads: 0,
      world_lore: 0,
      npc_notes: 0,
      player_tracking: 0,
      general: 0,
    };
    if (!allNotesData?.notes) return counts;
    counts.all = allNotesData.notes.length;
    for (const note of allNotesData.notes) {
      counts[note.category]++;
    }
    return counts;
  }, [allNotesData]);

  // Search filter (client-side on current tab results)
  const filteredNotes = useMemo(() => {
    if (!notebookData?.notes) return [];
    if (!searchQuery.trim()) return notebookData.notes;
    const q = searchQuery.toLowerCase();
    return notebookData.notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [notebookData, searchQuery]);

  // Handlers
  function handleCreate() {
    setEditingNote(null);
    setShowFormModal(true);
  }

  function handleEdit(note: NotebookEntry) {
    setEditingNote(note);
    setShowFormModal(true);
  }

  function handleCloseFormModal() {
    setShowFormModal(false);
    setEditingNote(null);
  }

  function handleFormSubmit(data: {
    title: string;
    content: string;
    category: NoteCategory;
    tags: string[];
    sessionNumber?: number;
  }) {
    if (editingNote) {
      updateNote.mutate(
        {
          campaignId: selectedCampaignId,
          noteId: editingNote._id,
          payload: data,
        },
        {
          onSuccess: handleCloseFormModal,
          onError: () => toast.error('Failed to update note'),
        },
      );
    } else {
      createNote.mutate(
        { ...data, campaignId: selectedCampaignId },
        {
          onSuccess: handleCloseFormModal,
          onError: () => toast.error('Failed to create note'),
        },
      );
    }
  }

  function confirmDelete() {
    if (!deletingNote) return;
    deleteNote.mutate(
      { campaignId: selectedCampaignId, noteId: deletingNote._id },
      {
        onSuccess: () => setDeletingNote(null),
        onError: () => toast.error('Failed to delete note'),
      },
    );
  }

  function handleTogglePin(note: NotebookEntry) {
    togglePin.mutate({
      campaignId: selectedCampaignId,
      noteId: note._id,
    });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <PageContainer
      title="Notebook"
      subtitle="Your campaign journal and GM notes"
      actions={
        <div className="flex items-center gap-3">
          {/* Campaign Selector */}
          <CampaignSelector
            campaigns={dmCampaigns}
            value={selectedCampaignId}
            onChange={(id) => {
              setSelectedCampaignId(id);
              setActiveTab('all');
              setSearchQuery('');
              setExpandedNoteId(null);
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
                placeholder="Search notes..."
                className="w-48 rounded-sm border border-input bg-input py-2 pl-9 pr-3 font-[Cinzel] text-xs text-foreground placeholder:text-muted-foreground input-carved"
              />
            </div>
          )}

          {/* Create button */}
          {selectedCampaignId && (
            <Button onClick={handleCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Note
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
              {dmCampaigns.length === 0
                ? 'You need to be a GM or Co-GM of a campaign to use the notebook'
                : 'Select a campaign above to open your notebook'}
            </p>
          </div>
        </div>
      )}

      {/* Campaign selected */}
      {selectedCampaignId && (
        <>
          {/* Tabs */}
          <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
            {TABS.map((tab) => {
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
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      activeTab === tab.key
                        ? 'bg-brass/20 text-brass'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {tabCounts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Loading */}
          {notesLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card p-5 tavern-card texture-leather"
                >
                  <div className="animate-pulse space-y-3">
                    <div className="h-5 w-1/3 rounded bg-muted" />
                    <div className="h-4 w-1/4 rounded bg-muted" />
                    <div className="h-12 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {notesError && (
            <div className="rounded-lg border border-destructive/50 bg-card p-8 text-center">
              <p className="font-medium text-destructive">Failed to load notes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(notesError as Error).message}
              </p>
            </div>
          )}

          {/* Empty */}
          {!notesLoading && !notesError && filteredNotes.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
              <div className="mx-auto max-w-sm">
                <h3 className="mb-2 text-lg font-semibold text-foreground font-['IM_Fell_English']">
                  {searchQuery ? 'No results found' : 'No Notes Yet'}
                </h3>
                <p className="mb-6 text-muted-foreground">
                  {searchQuery
                    ? `No notes matching "${searchQuery}"`
                    : 'Start capturing your campaign story. Session notes, plot threads, NPC details — keep it all in one place.'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Note
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Notes list */}
          {!notesLoading && !notesError && filteredNotes.length > 0 && (
            <div className="space-y-3">
              {filteredNotes.map((note) => {
                const isExpanded = expandedNoteId === note._id;
                const CategoryIcon = CATEGORY_ICONS[note.category];

                return (
                  <div
                    key={note._id}
                    className={`rounded-lg border bg-card tavern-card texture-leather transition-all ${
                      note.isPinned
                        ? 'border-brass/40 shadow-[0_0_12px_hsla(38,80%,50%,0.08)]'
                        : 'border-border'
                    }`}
                  >
                    {/* Note header */}
                    <div
                      className="flex cursor-pointer items-start gap-3 p-4"
                      onClick={() =>
                        setExpandedNoteId(isExpanded ? null : note._id)
                      }
                    >
                      {/* Pin indicator */}
                      {note.isPinned && (
                        <Pin className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
                      )}

                      <div className="min-w-0 flex-1">
                        {/* Title row */}
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-foreground font-['IM_Fell_English'] text-base">
                            {note.title}
                          </h3>
                          {note.sessionNumber && (
                            <span className="shrink-0 rounded-full bg-arcane/15 px-2 py-0.5 text-[10px] font-medium text-arcane font-[Cinzel] uppercase tracking-wider">
                              Session {note.sessionNumber}
                            </span>
                          )}
                        </div>

                        {/* Meta row */}
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-[Cinzel] uppercase tracking-wider">
                            <CategoryIcon className="h-3 w-3" />
                            {categoryLabels[note.category]}
                          </span>
                          <span>{formatDate(note.updatedAt)}</span>
                        </div>

                        {/* Tags */}
                        {note.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {note.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-brass/15 px-2 py-0.5 text-[10px] font-medium text-brass font-[Cinzel] uppercase tracking-wider"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Preview (collapsed) */}
                        {!isExpanded && note.content && (
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {note.content}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div
                        className="flex shrink-0 items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleTogglePin(note)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title={note.isPinned ? 'Unpin' : 'Pin'}
                        >
                          {note.isPinned ? (
                            <PinOff className="h-4 w-4" />
                          ) : (
                            <Pin className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(note)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingNote(note)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-blood/15 hover:text-[hsl(0,60%,55%)]"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && note.content && (
                      <div className="border-t border-border px-4 py-4">
                        <div className="prose prose-sm max-w-none text-foreground font-['IM_Fell_English'] text-base leading-relaxed whitespace-pre-wrap">
                          {note.content}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <NoteFormModal
        open={showFormModal}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        isPending={createNote.isPending || updateNote.isPending}
        note={editingNote}
      />

      <DeleteNoteModal
        open={!!deletingNote}
        onClose={() => setDeletingNote(null)}
        onConfirm={confirmDelete}
        isPending={deleteNote.isPending}
        noteTitle={deletingNote?.title ?? ''}
      />
    </PageContainer>
  );
}
