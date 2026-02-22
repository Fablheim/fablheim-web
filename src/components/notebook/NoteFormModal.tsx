import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { NotebookEntry, NoteCategory } from '@/types/notebook';
import { categoryLabels } from '@/types/notebook';

const CATEGORIES: NoteCategory[] = [
  'session_notes',
  'plot_threads',
  'world_lore',
  'npc_notes',
  'player_tracking',
  'general',
];

interface NoteFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    category: NoteCategory;
    tags: string[];
    sessionNumber?: number;
  }) => void;
  isPending: boolean;
  note?: NotebookEntry | null;
}

export function NoteFormModal({
  open,
  onClose,
  onSubmit,
  isPending,
  note,
}: NoteFormModalProps) {
  const isEdit = !!note;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('general');
  const [tagsInput, setTagsInput] = useState('');
  const [sessionNumber, setSessionNumber] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
      setTagsInput(note.tags.join(', '));
      setSessionNumber(note.sessionNumber?.toString() ?? '');
    } else {
      setTitle('');
      setContent('');
      setCategory('general');
      setTagsInput('');
      setSessionNumber('');
    }
  }, [note, open]);

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
    });
  }

  const inputClasses =
    'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';
  const labelClasses =
    'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border p-6 tavern-card iron-brackets texture-parchment">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground font-['IM_Fell_English']">
            {isEdit ? 'Edit Note' : 'New Note'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Tags */}
          <div>
            <label className={labelClasses}>Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. important, boss fight, clue"
              className={inputClasses}
            />
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

          {/* Content */}
          <div>
            <label className={labelClasses}>Content (Markdown supported)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes here... Markdown formatting is supported."
              rows={12}
              maxLength={50000}
              className={`${inputClasses} resize-y font-['IM_Fell_English'] text-base leading-relaxed`}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save Changes' : 'Create Note'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
