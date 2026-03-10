import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  CornerDownRight,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Tag,
  X,
  Folder,
  FolderOpen,
  FolderPlus,
} from 'lucide-react';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import {
  useNotebook,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useTogglePin,
  useNotebookFolders,
  useCreateFolder,
  useDeleteFolder,
} from '@/hooks/useNotebook';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/layout/PageContainer';
import { CampaignSelector } from '@/components/ui/CampaignSelector';
import { NoteFormModal } from '@/components/notebook/NoteFormModal';
import { DeleteNoteModal } from '@/components/notebook/DeleteNoteModal';
import type { NotebookEntry, NoteCategory, NotebookFolder } from '@/types/notebook';
import { categoryLabels } from '@/types/notebook';

type NotebookTab = 'all' | NoteCategory;

const mdComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="mb-3 font-[Cinzel] text-xl text-foreground">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="mb-2 mt-4 font-[Cinzel] text-lg text-foreground">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="mb-1.5 mt-3 font-[Cinzel] text-base text-foreground">{children}</h3>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 leading-relaxed text-muted-foreground">{children}</p>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-foreground">{children}</strong>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="mb-3 list-disc space-y-0.5 pl-5 text-muted-foreground">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="mb-3 list-decimal space-y-0.5 pl-5 text-muted-foreground">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-3 border-l-2 border-primary/40 pl-3 italic text-muted-foreground">{children}</blockquote>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-3 overflow-x-auto rounded border border-border"><table className="w-full border-collapse">{children}</table></div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border border-border bg-muted/40 px-2 py-1.5 text-left font-[Cinzel] text-xs text-foreground">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-border px-2 py-1.5 text-sm text-muted-foreground">{children}</td>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">{children}</code>
  ),
  hr: () => <hr className="my-4 border-border" />,
};

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

interface NotebookPageProps {
  campaignId?: string;
}

export function NotebookPage({ campaignId: propCampaignId }: NotebookPageProps) {
  const { data: campaigns, isLoading: campaignsLoading } = useAccessibleCampaigns();
  const [searchParams] = useSearchParams();
  const effectiveCampaignId = propCampaignId ?? (searchParams.get('campaign') ?? '');

  const [selectedCampaignId, setSelectedCampaignId] = useState(effectiveCampaignId);
  const [activeTab, setActiveTab] = useState<NotebookTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Folder sidebar
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  // Bulk selection
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingNote, setEditingNote] = useState<NotebookEntry | null>(null);
  const [deletingNote, setDeletingNote] = useState<NotebookEntry | null>(null);
  const [parentNoteIdForNew, setParentNoteIdForNew] = useState<string | undefined>();
  const [collapsedChildren, setCollapsedChildren] = useState<Set<string>>(new Set());

  // Only show campaigns where user is DM or Co-DM
  const dmCampaigns = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.filter((c) => c.role === 'dm' || c.role === 'co_dm');
  }, [campaigns]);

  // Folder hooks
  const { data: folders } = useNotebookFolders(selectedCampaignId);
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();

  // Data
  const categoryFilter = activeTab === 'all' ? undefined : activeTab;
  const {
    data: notebookData,
    isLoading: notesLoading,
    error: notesError,
  } = useNotebook(selectedCampaignId, {
    category: categoryFilter,
    folderId: activeFolderId ?? undefined,
  });

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

  // Collect all unique tags across notes for autocomplete
  const allTags = useMemo(() => {
    if (!allNotesData?.notes) return [];
    const tagSet = new Set<string>();
    for (const n of allNotesData.notes) {
      for (const t of n.tags) tagSet.add(t);
    }
    return [...tagSet].sort();
  }, [allNotesData]);

  // Folder tree: root folders and children grouped by parentFolderId
  const { rootFolders, folderChildrenMap } = useMemo(() => {
    if (!folders) return { rootFolders: [] as NotebookFolder[], folderChildrenMap: new Map<string, NotebookFolder[]>() };
    const sorted = [...folders].sort((a, b) => a.sortOrder - b.sortOrder);
    const cMap = new Map<string, NotebookFolder[]>();
    const roots: NotebookFolder[] = [];
    for (const folder of sorted) {
      if (folder.parentFolderId) {
        const siblings = cMap.get(folder.parentFolderId) ?? [];
        siblings.push(folder);
        cMap.set(folder.parentFolderId, siblings);
      } else {
        roots.push(folder);
      }
    }
    return { rootFolders: roots, folderChildrenMap: cMap };
  }, [folders]);

  // Search + tag filter (client-side on current tab results)
  const filteredNotes = useMemo(() => {
    if (!notebookData?.notes) return [];
    let notes = notebookData.notes;
    if (filterTag) {
      notes = notes.filter((n) => n.tags.includes(filterTag));
    }
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [notebookData, searchQuery, filterTag]);

  // Tree structure: root notes and children grouped by parentNoteId
  const { rootNotes, childrenMap } = useMemo(() => {
    const cMap = new Map<string, NotebookEntry[]>();
    const roots: NotebookEntry[] = [];
    for (const note of filteredNotes) {
      if (note.parentNoteId) {
        const siblings = cMap.get(note.parentNoteId) ?? [];
        siblings.push(note);
        cMap.set(note.parentNoteId, siblings);
      } else {
        roots.push(note);
      }
    }
    return { rootNotes: roots, childrenMap: cMap };
  }, [filteredNotes]);

  // Handlers
  function handleCreate() {
    setEditingNote(null);
    setParentNoteIdForNew(undefined);
    setShowFormModal(true);
  }

  function handleCreateSubNote(parentId: string) {
    setEditingNote(null);
    setParentNoteIdForNew(parentId);
    setShowFormModal(true);
  }

  function toggleChildren(noteId: string) {
    setCollapsedChildren((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  }

  function handleEdit(note: NotebookEntry) {
    setEditingNote(note);
    setShowFormModal(true);
  }

  function handleCloseFormModal() {
    setShowFormModal(false);
    setEditingNote(null);
    setParentNoteIdForNew(undefined);
  }

  function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    createFolder.mutate(
      { campaignId: selectedCampaignId, payload: { name: newFolderName.trim() } },
      { onSuccess: () => { setNewFolderName(''); setShowNewFolder(false); } },
    );
  }

  function handleFormSubmit(data: {
    title: string;
    content: string;
    category: NoteCategory;
    tags: string[];
    sessionNumber?: number;
    parentNoteId?: string;
    folderId?: string;
    links?: import('@/types/notebook').NoteLink[];
  }) {
    if (editingNote) {
      updateNote.mutate(
        {
          campaignId: selectedCampaignId,
          noteId: editingNote._id,
          payload: { ...data, links: data.links },
        },
        {
          onSuccess: handleCloseFormModal,
          onError: () => toast.error('Failed to update note'),
        },
      );
    } else {
      const folderId = data.folderId || (activeFolderId !== 'unfiled' ? activeFolderId ?? undefined : undefined);
      createNote.mutate(
        { ...data, campaignId: selectedCampaignId, parentNoteId: data.parentNoteId, folderId, links: data.links },
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

  function toggleBulkSelect(noteId: string) {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (bulkSelected.size === 0) return;
    for (const noteId of bulkSelected) {
      await deleteNote.mutateAsync({ campaignId: selectedCampaignId, noteId });
    }
    setBulkSelected(new Set());
    setBulkMode(false);
    toast.success(`Deleted ${bulkSelected.size} note${bulkSelected.size > 1 ? 's' : ''}`);
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

  function renderNoteCard(note: NotebookEntry, isChild: boolean) {
    const isExpanded = expandedNoteId === note._id;
    const CategoryIcon = CATEGORY_ICONS[note.category];
    const children = childrenMap.get(note._id);
    const hasChildren = !!children && children.length > 0;
    const isChildrenCollapsed = collapsedChildren.has(note._id);

    return (
      <div key={note._id}>
        <div
          className={`mkt-card mkt-card-mounted rounded-lg border transition-all ${
            note.isPinned
              ? 'border-brass/45 shadow-[0_0_16px_hsla(38,80%,50%,0.12)]'
              : 'border-border hover:border-[color:var(--mkt-accent)]/35'
          }`}
        >
          {renderNoteHeader(note, isExpanded, isChild, CategoryIcon, hasChildren, isChildrenCollapsed)}
          {renderNoteContent(note, isExpanded)}
        </div>
        {hasChildren && !isChildrenCollapsed && (
          <div className="ml-6 mt-2 space-y-2 border-l-2 border-brass/20 pl-3">
            {children.map((child) => renderNoteCard(child, true))}
          </div>
        )}
      </div>
    );
  }

  function renderNoteHeader(
    note: NotebookEntry,
    isExpanded: boolean,
    isChild: boolean,
    CategoryIcon: typeof BookOpen,
    hasChildren: boolean,
    isChildrenCollapsed: boolean,
  ) {
    return (
      <div
        className="flex cursor-pointer items-start gap-3 p-4"
        onClick={() => setExpandedNoteId(isExpanded ? null : note._id)}
      >
        {bulkMode && (
          <input
            type="checkbox"
            checked={bulkSelected.has(note._id)}
            onClick={(e) => e.stopPropagation()}
            onChange={() => toggleBulkSelect(note._id)}
            className="mt-1 h-3.5 w-3.5 shrink-0 rounded border-border accent-brass"
          />
        )}
        {!bulkMode && isChild && (
          <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-brass/50" />
        )}
        {!bulkMode && !isChild && note.isPinned && (
          <Pin className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground font-['IM_Fell_English'] text-carved">
              {note.title}
            </h3>
            {note.sessionNumber && (
              <span className="shrink-0 rounded-full bg-arcane/15 px-2 py-0.5 text-[10px] font-medium text-arcane font-[Cinzel] uppercase tracking-wider">
                Session {note.sessionNumber}
              </span>
            )}
            {hasChildren && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleChildren(note._id); }}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title={isChildrenCollapsed ? 'Show sub-notes' : 'Hide sub-notes'}
              >
                {isChildrenCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                <span className="text-[10px] font-[Cinzel] uppercase tracking-wider">
                  {childrenMap.get(note._id)!.length}
                </span>
              </button>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 font-[Cinzel] uppercase tracking-wider">
              <CategoryIcon className="h-3 w-3" />
              {categoryLabels[note.category]}
            </span>
            <span>{formatDate(note.updatedAt)}</span>
          </div>
          {note.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFilterTag(filterTag === tag ? null : tag); }}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium font-[Cinzel] uppercase tracking-wider transition-colors ${
                    filterTag === tag
                      ? 'bg-brass/35 text-brass ring-1 ring-brass/50'
                      : 'bg-brass/15 text-brass hover:bg-brass/25'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          {!isExpanded && note.content && (
            <p className="mt-2 line-clamp-2 text-base text-muted-foreground">
              {note.content}
            </p>
          )}
        </div>
        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleCreateSubNote(note._id)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-brass/15 hover:text-brass"
            title="Add sub-note"
          >
            <CornerDownRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleTogglePin(note)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            {note.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
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
    );
  }

  function renderNoteContent(note: NotebookEntry, isExpanded: boolean) {
    if (!isExpanded || !note.content) return null;
    return (
      <div className="border-t border-border px-4 py-4">
        <div className="prose prose-sm max-w-none text-foreground font-['IM_Fell_English'] text-base leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {note.content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  function renderFolderItem(folder: NotebookFolder, depth: number) {
    const isActive = activeFolderId === folder._id;
    const children = folderChildrenMap.get(folder._id);
    const FolderIcon = isActive ? FolderOpen : Folder;

    return (
      <div key={folder._id}>
        <button
          type="button"
          onClick={() => setActiveFolderId(isActive ? null : folder._id)}
          className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
            isActive
              ? 'bg-brass/15 text-brass'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {folder.color && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: folder.color }}
            />
          )}
          <FolderIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-['IM_Fell_English'] text-sm">{folder.name}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteFolder.mutate({ campaignId: selectedCampaignId, folderId: folder._id });
            }}
            className="ml-auto hidden shrink-0 rounded p-0.5 text-muted-foreground hover:bg-blood/15 hover:text-[hsl(0,60%,55%)] group-hover:block"
            title="Delete folder"
          >
            <X className="h-3 w-3" />
          </button>
        </button>
        {children && children.map((child) => renderFolderItem(child, depth + 1))}
      </div>
    );
  }

  function renderFolderSidebar() {
    return (
      <div className="w-56 shrink-0">
        <div className="mkt-card rounded-xl border border-border p-3">
          {renderFolderSidebarHeader()}
          {renderFolderSidebarList()}
        </div>
      </div>
    );
  }

  function renderFolderSidebarHeader() {
    return (
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-[Cinzel] text-xs uppercase tracking-wider text-carved">
          Folders
        </h3>
        <button
          type="button"
          onClick={() => setShowNewFolder(!showNewFolder)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-brass/15 hover:text-brass"
          title="New folder"
        >
          <FolderPlus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  function renderFolderSidebarList() {
    return (
      <div className="space-y-0.5">
        {/* New folder inline form */}
        {showNewFolder && (
          <div className="mb-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); }
              }}
              placeholder="Folder name..."
              autoFocus
              className="w-full rounded-md border border-input bg-input px-2 py-1 font-['IM_Fell_English'] text-sm text-foreground placeholder:text-muted-foreground input-carved"
            />
          </div>
        )}

        {/* All Notes */}
        <button
          type="button"
          onClick={() => setActiveFolderId(null)}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
            activeFolderId === null
              ? 'bg-brass/15 text-brass'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="font-['IM_Fell_English'] text-sm">All Notes</span>
        </button>

        {/* Unfiled */}
        <button
          type="button"
          onClick={() => setActiveFolderId(activeFolderId === 'unfiled' ? null : 'unfiled')}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
            activeFolderId === 'unfiled'
              ? 'bg-brass/15 text-brass'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="font-['IM_Fell_English'] text-sm">Unfiled</span>
        </button>

        {/* Divider */}
        {rootFolders.length > 0 && <hr className="my-2 border-border" />}

        {/* Folder list */}
        {rootFolders.map((folder) => renderFolderItem(folder, 0))}
      </div>
    );
  }

  return (
    <PageContainer
      title="Notebook"
      subtitle="Your campaign journal and GM notes"
      actions={
        <div className="flex items-center gap-3">
          {/* Campaign Selector */}
          {!effectiveCampaignId && (
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
          )}

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
        <div className="mkt-card mkt-card-mounted rounded-xl border-2 border-dashed border-gold/30 p-12 text-center">
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
        <div className="flex gap-6">
          {/* Folder sidebar */}
          {renderFolderSidebar()}

          {/* Main content */}
          <div className="min-w-0 flex-1">
            {/* Tabs */}
            <div className="mkt-card mb-6 flex gap-1 overflow-x-auto rounded-xl border-b border-border px-2 py-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex shrink-0 items-center gap-2 rounded-md border-b-2 px-4 py-2 font-[Cinzel] text-xs uppercase tracking-wider transition-colors ${
                      activeTab === tab.key
                        ? 'border-brass bg-brass/10 text-brass'
                        : 'border-transparent text-muted-foreground hover:border-border hover:bg-accent/35 hover:text-foreground'
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

            {/* Active tag filter + bulk mode controls */}
            {(filterTag || bulkMode || filteredNotes.length > 0) && (
              <div className="mb-4 flex items-center gap-2">
                {filterTag && (
                  <div className="flex items-center gap-1.5 rounded-md border border-brass/30 bg-brass/10 px-2.5 py-1.5">
                    <Tag className="h-3 w-3 text-brass" />
                    <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-brass">
                      {filterTag}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFilterTag(null)}
                      className="ml-1 rounded-full p-0.5 text-brass hover:bg-brass/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {bulkMode && bulkSelected.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
                      {bulkSelected.size} selected
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBulkDelete}
                      disabled={deleteNote.isPending}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                )}
                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }}
                    className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                      bulkMode
                        ? 'bg-brass/15 text-brass'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {bulkMode ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                    Bulk
                  </button>
                </div>
              </div>
            )}

            {/* Loading */}
            {notesLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="mkt-card mkt-card-mounted rounded-lg p-5"
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
              <div className="mkt-card rounded-lg border border-destructive/50 p-8 text-center">
                <p className="font-medium text-destructive">Failed to load notes</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {(notesError as Error).message}
                </p>
              </div>
            )}

            {/* Empty */}
            {!notesLoading && !notesError && filteredNotes.length === 0 && (
              <div className="mkt-card mkt-card-mounted rounded-xl border-2 border-dashed border-gold/30 p-12 text-center">
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
                {rootNotes.map((note) => renderNoteCard(note, false))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <NoteFormModal
        open={showFormModal}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        isPending={createNote.isPending || updateNote.isPending}
        note={editingNote}
        parentNoteId={parentNoteIdForNew}
        allTags={allTags}
        campaignId={selectedCampaignId}
        folders={folders ?? []}
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
