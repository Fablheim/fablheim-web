import { useState, useMemo } from 'react';
import { X, Search, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSRDCategoryEntries, useSRDEntry } from '@/hooks/useSRD';

interface SRDLookupModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (entry: string) => void;
  system: string;
  category: string;
  label: string;
}

const inputClass =
  'block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

function EntryPreview({ system, category, entry }: { system: string; category: string; entry: string }) {
  const entryPath = category === 'General' ? entry : `${category}/${entry}`;
  const { data, isLoading } = useSRDEntry(system, entryPath);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading preview...
      </div>
    );
  }

  if (!data?.content) return null;

  const snippet = data.content.replace(/^#.*\n/gm, '').trim().substring(0, 200);

  return (
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
      {snippet}{snippet.length >= 200 ? '...' : ''}
    </p>
  );
}

export function SRDLookupModal({
  open,
  onClose,
  onSelect,
  system,
  category,
  label,
}: SRDLookupModalProps) {
  const [filter, setFilter] = useState('');
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);
  const { data, isLoading } = useSRDCategoryEntries(system, category);

  const entries = useMemo(() => {
    const all = data?.entries ?? [];
    if (!filter) return all;
    const lower = filter.toLowerCase();
    return all.filter((e) => e.toLowerCase().includes(lower));
  }, [data?.entries, filter]);

  if (!open) return null;

  function handleSelect(entry: string) {
    onSelect(entry);
    setFilter('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-lg border border-border border-t-2 border-t-brass/50 bg-card shadow-warm-lg tavern-card iron-brackets texture-parchment">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-['IM_Fell_English'] text-lg text-card-foreground">
              Browse {label}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className={`${inputClass} pl-9`}
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {filter ? `No ${label.toLowerCase()} matching "${filter}"` : `No ${label.toLowerCase()} found in SRD`}
            </p>
          ) : (
            <div className="grid gap-2">
              {entries.map((entry) => (
                <button
                  key={entry}
                  onClick={() => handleSelect(entry)}
                  onMouseEnter={() => setHoveredEntry(entry)}
                  onMouseLeave={() => setHoveredEntry(null)}
                  className="rounded-md border border-border bg-background/40 px-4 py-3 text-left transition-all hover:border-brass/50 hover:bg-background/70"
                >
                  <span className="font-[Cinzel] text-sm font-medium text-foreground">
                    {entry.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim()}
                  </span>
                  {hoveredEntry === entry && (
                    <EntryPreview system={system} category={category} entry={entry} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
