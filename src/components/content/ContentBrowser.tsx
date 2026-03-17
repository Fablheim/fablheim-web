import { useState, useMemo } from 'react';
import { X, Search, Loader2, BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useContentSearch } from '@/hooks/useContentRegistry';
import type { ContentEntry } from '@/types/content-entry';

interface ContentBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelect: (entry: { name: string; contentId: string }) => void;
  contentType: string;
  system: string;
  campaignId?: string;
  label: string;
}

type SourceFilter = 'all' | 'srd' | 'homebrew';

const inputClass =
  'block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const TAB_BASE =
  'px-3 py-1.5 text-xs font-[Cinzel] uppercase tracking-wider rounded-sm transition-colors';
const TAB_ACTIVE =
  'bg-primary/20 text-primary border border-primary/30';
const TAB_INACTIVE =
  'text-muted-foreground hover:text-foreground hover:bg-accent/40';

function SourceBadge({ sourceType }: { sourceType: string }) {
  const isSrd = sourceType === 'srd';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
        isSrd
          ? 'bg-[hsl(150,50%,55%)]/15 text-[hsl(150,50%,55%)]'
          : 'bg-gold/15 text-gold'
      }`}
    >
      {isSrd ? 'SRD' : 'Homebrew'}
    </span>
  );
}

function renderRaceDetails(data: NonNullable<ContentEntry['raceData']>) {
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      <div><span className="text-foreground/70">Size:</span> {data.size}</div>
      <div><span className="text-foreground/70">Speed:</span> {data.speed} ft.</div>
      {data.languages.length > 0 && (
        <div><span className="text-foreground/70">Languages:</span> {data.languages.join(', ')}</div>
      )}
      {data.traits.length > 0 && (
        <div className="space-y-1">
          <span className="text-foreground/70">Traits:</span>
          {data.traits.map((t) => (
            <div key={t.name} className="ml-2">
              <span className="font-medium text-foreground/80">{t.name}.</span> {t.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderClassDetails(data: NonNullable<ContentEntry['classData']>) {
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      <div><span className="text-foreground/70">Hit Die:</span> {data.hitDie}</div>
      <div><span className="text-foreground/70">Primary Ability:</span> {data.primaryAbility.join(', ')}</div>
      <div><span className="text-foreground/70">Saving Throws:</span> {data.savingThrows.join(', ')}</div>
      {data.armorProficiencies.length > 0 && (
        <div><span className="text-foreground/70">Armor:</span> {data.armorProficiencies.join(', ')}</div>
      )}
      {data.weaponProficiencies.length > 0 && (
        <div><span className="text-foreground/70">Weapons:</span> {data.weaponProficiencies.join(', ')}</div>
      )}
    </div>
  );
}

function EntryDetail({ entry, onSelect, onBack }: {
  entry: ContentEntry;
  onSelect: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to results
      </button>

      <div className="flex items-center gap-3">
        <h4 className="font-['IM_Fell_English'] text-lg text-card-foreground">
          {entry.name}
        </h4>
        <SourceBadge sourceType={entry.sourceType} />
      </div>

      {entry.summary && (
        <p className="text-sm text-muted-foreground leading-relaxed">{entry.summary}</p>
      )}

      {entry.body && (
        <div className="rounded-md border border-border bg-background/30 p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
          {entry.body}
        </div>
      )}

      {entry.raceData && renderRaceDetails(entry.raceData)}
      {entry.classData && renderClassDetails(entry.classData)}

      <Button type="button" onClick={onSelect} className="w-full">
        Select {entry.name}
      </Button>
    </div>
  );
}

export function ContentBrowser({
  open,
  onClose,
  onSelect,
  contentType,
  system,
  campaignId,
  label,
}: ContentBrowserProps) {
  const [filter, setFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedEntry, setSelectedEntry] = useState<ContentEntry | null>(null);

  // Query with contentType always set so we get results even without text search
  const searchQuery = useMemo(() => ({
    q: filter || undefined,
    contentType,
    system,
    campaignId,
    sourceType: sourceFilter === 'all' ? undefined : sourceFilter,
    limit: 50,
  }), [filter, contentType, system, campaignId, sourceFilter]);

  const { data: entries, isLoading } = useContentSearch(searchQuery);

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    return entries;
  }, [entries]);

  if (!open) return null;

  function handleSelect(entry: ContentEntry) {
    onSelect({ name: entry.name, contentId: entry._id });
    setFilter('');
    setSelectedEntry(null);
    onClose();
  }

  function handleClose() {
    setFilter('');
    setSelectedEntry(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-lg border border-border border-t-2 border-t-brass/50 bg-card shadow-warm-lg tavern-card iron-brackets texture-parchment">
        {renderHeader(label, handleClose)}
        {renderSearchAndFilters(filter, setFilter, sourceFilter, setSourceFilter, label, campaignId)}
        {renderBody(selectedEntry, filteredEntries, isLoading, filter, label, handleSelect, setSelectedEntry)}
        {renderFooter(handleClose)}
      </div>
    </div>
  );
}

function renderHeader(label: string, onClose: () => void) {
  return (
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
  );
}

function renderSearchAndFilters(
  filter: string,
  setFilter: (v: string) => void,
  sourceFilter: SourceFilter,
  setSourceFilter: (v: SourceFilter) => void,
  label: string,
  campaignId?: string,
) {
  return (
    <div className="border-b border-border p-4 space-y-3">
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
      <div className="flex gap-1.5">
        {(['all', 'srd', ...(campaignId ? ['homebrew' as const] : [])] as SourceFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSourceFilter(tab)}
            className={`${TAB_BASE} ${sourceFilter === tab ? TAB_ACTIVE : TAB_INACTIVE}`}
          >
            {tab === 'all' ? 'All' : tab === 'srd' ? 'SRD' : 'Homebrew'}
          </button>
        ))}
      </div>
    </div>
  );
}

function renderBody(
  selectedEntry: ContentEntry | null,
  entries: ContentEntry[],
  isLoading: boolean,
  filter: string,
  label: string,
  handleSelect: (entry: ContentEntry) => void,
  setSelectedEntry: (entry: ContentEntry | null) => void,
) {
  return (
    <div className="max-h-[60vh] overflow-y-auto p-4">
      {selectedEntry ? (
        <EntryDetail
          entry={selectedEntry}
          onSelect={() => handleSelect(selectedEntry)}
          onBack={() => setSelectedEntry(null)}
        />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {filter
            ? `No ${label.toLowerCase()} matching "${filter}"`
            : `No ${label.toLowerCase()} found`}
        </p>
      ) : (
        <div className="grid gap-2">
          {entries.map((entry) => (
            <button
              key={entry._id}
              onClick={() => setSelectedEntry(entry)}
              className="rounded-md border border-border bg-background/40 px-4 py-3 text-left transition-all hover:border-brass/50 hover:bg-background/70"
            >
              <div className="flex items-center gap-2">
                <span className="font-[Cinzel] text-sm font-medium text-foreground">
                  {entry.name}
                </span>
                <SourceBadge sourceType={entry.sourceType} />
              </div>
              {entry.summary && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {entry.summary}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function renderFooter(onClose: () => void) {
  return (
    <div className="border-t border-border p-4">
      <Button variant="ghost" onClick={onClose} className="w-full">
        Cancel
      </Button>
    </div>
  );
}
