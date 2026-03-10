import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Eye, EyeOff, Link2, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/Button';
import type { NotebookEntry, NoteCategory, NoteLink, NoteLinkEntityType, LinkSearchResult } from '@/types/notebook';
import { categoryLabels } from '@/types/notebook';
import { useLinkSearch } from '@/hooks/useNotebook';

const CATEGORIES: NoteCategory[] = [
  'session_notes',
  'plot_threads',
  'world_lore',
  'npc_notes',
  'player_tracking',
  'general',
];

const ENTITY_TYPE_LABELS: Record<NoteLinkEntityType, string> = {
  world_entity: 'Entity',
  encounter: 'Encounter',
  session: 'Session',
};

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
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">{children}</code>
  ),
  hr: () => <hr className="my-4 border-border" />,
};

interface NoteFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    category: NoteCategory;
    tags: string[];
    sessionNumber?: number;
    parentNoteId?: string;
    folderId?: string;
    links?: NoteLink[];
  }) => void;
  isPending: boolean;
  note?: NotebookEntry | null;
  parentNoteId?: string;
  allTags?: string[];
  campaignId?: string;
  folders?: Array<{ _id: string; name: string; parentFolderId?: string }>;
}

export function NoteFormModal({
  open,
  onClose,
  onSubmit,
  isPending,
  note,
  parentNoteId,
  allTags = [],
  campaignId,
  folders = [],
}: NoteFormModalProps) {
  const isEdit = !!note;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('general');
  const [tagsInput, setTagsInput] = useState('');
  const [sessionNumber, setSessionNumber] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [links, setLinks] = useState<NoteLink[]>([]);
  const [linkQuery, setLinkQuery] = useState('');
  const [linkEntityTypeFilter, setLinkEntityTypeFilter] = useState<NoteLinkEntityType | undefined>(undefined);
  const [showLinkSearch, setShowLinkSearch] = useState(false);
  const [folderId, setFolderId] = useState('');

  const { data: linkSearchResults } = useLinkSearch(campaignId ?? '', linkQuery, linkEntityTypeFilter);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
      setTagsInput(note.tags.join(', '));
      setSessionNumber(note.sessionNumber?.toString() ?? '');
      setLinks(note.links ?? []);
      setFolderId(note.folderId ?? '');
    } else {
      setTitle('');
      setContent('');
      setCategory('general');
      setTagsInput('');
      setSessionNumber('');
      setLinks([]);
      setFolderId('');
    }
    setShowPreview(false);
    setLinkQuery('');
    setShowLinkSearch(false);
    setLinkEntityTypeFilter(undefined);
  }, [note, open]);

  // Tag suggestions: filter allTags by what's being typed after the last comma
  const tagSuggestions = useMemo(() => {
    if (!showTagSuggestions || allTags.length === 0) return [];
    const currentTags = tagsInput.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const lastPart = tagsInput.split(',').pop()?.trim().toLowerCase() ?? '';
    return allTags.filter(
      (t) => !currentTags.includes(t.toLowerCase()) && (lastPart === '' || t.toLowerCase().includes(lastPart)),
    ).slice(0, 8);
  }, [tagsInput, allTags, showTagSuggestions]);

  function addSuggestedTag(tag: string) {
    const parts = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    // Replace the last partial entry with the selected tag
    const lastPart = tagsInput.split(',').pop()?.trim() ?? '';
    if (lastPart && tag.toLowerCase().includes(lastPart.toLowerCase())) {
      parts.pop();
    }
    parts.push(tag);
    setTagsInput(parts.join(', ') + ', ');
    setShowTagSuggestions(false);
    tagInputRef.current?.focus();
  }

  function addLink(result: LinkSearchResult) {
    const alreadyLinked = links.some(
      (l) => l.entityType === result.entityType && l.entityId === result.entityId,
    );
    if (!alreadyLinked) {
      setLinks((prev) => [
        ...prev,
        { entityType: result.entityType, entityId: result.entityId, label: result.name },
      ]);
    }
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      title: title.trim(),
      content,
      category,
      tags,
      sessionNumber: sessionNumber ? parseInt(sessionNumber, 10) : undefined,
      parentNoteId,
      folderId: folderId || undefined,
      links,
    });
  }

  const inputClasses =
    'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';
  const labelClasses =
    'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border p-6 mkt-card mkt-card-mounted iron-brackets">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground font-['IM_Fell_English'] text-carved">
            {isEdit ? 'Edit Note' : parentNoteId ? 'New Sub-Note' : 'New Note'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderTopFields()}
          {renderTagsField()}
          {renderLinkedEntities()}
          {renderContentField()}
          {renderActions()}
        </form>
      </div>
    </div>
  );

  function renderTopFields() {
    return (
      <>
        {/* Title */}
        <div>
          <label className={labelClasses}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            maxLength={200}
            required
            className={inputClasses}
          />
        </div>

        {/* Category + Session Number */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NoteCategory)}
                className={inputClasses}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClasses}>Session # (optional)</label>
            <input
              type="number"
              value={sessionNumber}
              onChange={(e) => setSessionNumber(e.target.value)}
              placeholder="e.g. 5"
              min={1}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Folder */}
        {folders.length > 0 && (
          <div>
            <label className={labelClasses}>Folder</label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className={inputClasses}
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </>
    );
  }

  function renderTagsField() {
    return (
      <div className="relative">
        <label className={labelClasses}>Tags (comma separated)</label>
        <input
          ref={tagInputRef}
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          onFocus={() => setShowTagSuggestions(true)}
          onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
          placeholder="e.g. important, boss fight, clue"
          className={inputClasses}
        />
        {/* Tag suggestions dropdown */}
        {showTagSuggestions && tagSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-32 overflow-y-auto rounded-md border border-border bg-card p-1.5 shadow-warm-lg">
            <div className="flex flex-wrap gap-1">
              {tagSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addSuggestedTag(tag)}
                  className="rounded-full bg-brass/15 px-2 py-0.5 text-[10px] font-medium text-brass font-[Cinzel] uppercase tracking-wider hover:bg-brass/30 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
        {tagsInput && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tagsInput
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-brass/15 px-2 py-0.5 text-[10px] font-medium text-brass font-[Cinzel] uppercase tracking-wider"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}
      </div>
    );
  }

  function renderLinkedEntities() {
    const filterButtons: Array<{ label: string; value: NoteLinkEntityType | undefined }> = [
      { label: 'All', value: undefined },
      { label: 'World', value: 'world_entity' },
      { label: 'Encounters', value: 'encounter' },
      { label: 'Sessions', value: 'session' },
    ];

    const results: LinkSearchResult[] = linkSearchResults ?? [];

    return (
      <div className="relative">
        <label className={labelClasses}>
          <span className="inline-flex items-center gap-1.5">
            <Link2 className="h-3 w-3" />
            Linked To
          </span>
        </label>

        {/* Search input */}
        <div className="relative mt-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={linkQuery}
            onChange={(e) => {
              setLinkQuery(e.target.value);
              setShowLinkSearch(true);
            }}
            onFocus={() => setShowLinkSearch(true)}
            onBlur={() => setTimeout(() => setShowLinkSearch(false), 200)}
            placeholder="Search entities, encounters, sessions..."
            className={`${inputClasses} pl-8`}
          />
        </div>

        {/* Entity type filter buttons */}
        <div className="mt-2 flex gap-1.5">
          {filterButtons.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={() => setLinkEntityTypeFilter(btn.value)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium font-[Cinzel] uppercase tracking-wider transition-colors ${
                linkEntityTypeFilter === btn.value
                  ? 'bg-arcane/15 text-arcane'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Search results dropdown */}
        {showLinkSearch && linkQuery.length >= 2 && results.length > 0 && (
          <div className="absolute left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-card shadow-warm-lg">
            {results.map((result) => {
              const alreadyLinked = links.some(
                (l) => l.entityType === result.entityType && l.entityId === result.entityId,
              );
              return (
                <button
                  key={`${result.entityType}-${result.entityId}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addLink(result)}
                  disabled={alreadyLinked}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    alreadyLinked
                      ? 'cursor-default opacity-50'
                      : 'hover:bg-muted cursor-pointer'
                  }`}
                >
                  <span className="font-[Cinzel] text-foreground">{result.name}</span>
                  <span className="ml-auto rounded-full bg-arcane/15 px-2 py-0.5 text-[10px] font-medium text-arcane font-[Cinzel] uppercase tracking-wider">
                    {ENTITY_TYPE_LABELS[result.entityType]}
                  </span>
                  {result.subType && (
                    <span className="text-[10px] text-muted-foreground">{result.subType}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Current linked entities as chips */}
        {links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {links.map((link, index) => (
              <span
                key={`${link.entityType}-${link.entityId}`}
                className="inline-flex items-center gap-1 rounded-full bg-arcane/15 px-2.5 py-0.5 text-[10px] font-medium text-arcane font-[Cinzel] uppercase tracking-wider"
              >
                <span className="opacity-70">{ENTITY_TYPE_LABELS[link.entityType]}</span>
                <span className="mx-0.5 opacity-40">|</span>
                {link.label ?? `${ENTITY_TYPE_LABELS[link.entityType]}...`}
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-arcane/20 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderContentField() {
    return (
      <div>
        <div className="flex items-center justify-between">
          <label className={labelClasses}>Content</label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-[Cinzel] uppercase tracking-wider transition-colors ${
              showPreview ? 'bg-brass/15 text-brass' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
        {showPreview ? (
          <div className="mt-1 min-h-[200px] rounded-sm border border-input bg-input px-3 py-2 text-sm">
            {content ? (
              <div className="prose prose-sm max-w-none font-['IM_Fell_English'] text-base leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground italic">Nothing to preview</p>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your notes here... Markdown formatting is supported."
            rows={12}
            maxLength={50000}
            className={`${inputClasses} resize-y font-['IM_Fell_English'] text-base leading-relaxed`}
          />
        )}
      </div>
    );
  }

  function renderActions() {
    return (
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !title.trim()}>
          {isPending ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save Changes' : 'Create Note'}
        </Button>
      </div>
    );
  }
}
