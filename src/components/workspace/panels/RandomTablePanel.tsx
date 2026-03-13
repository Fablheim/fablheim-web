import { useState } from 'react';
import {
  Dices,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import {
  useRandomTables,
  useRollTable,
  useCreateRandomTable,
  useDeleteRandomTable,
} from '@/hooks/useRandomTables';
import type { RandomTable, RollResult } from '@/types/random-table';

interface RandomTablePanelProps {
  campaignId: string;
}

const INPUT_CLS =
  'w-full rounded-sm border border-border bg-[hsl(24,15%,10%)] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40 transition-colors';
const LABEL_CLS = 'block text-xs font-medium text-muted-foreground mb-1';

export function RandomTablePanel({ campaignId }: RandomTablePanelProps) {
  const { data: tables, isLoading, error } = useRandomTables(campaignId);
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load tables" />;

  const allTables = tables ?? [];
  const categories = [...new Set(allTables.map((t) => t.category).filter(Boolean))].sort();
  const filtered = filterCategory
    ? allTables.filter((t) => t.category === filterCategory)
    : allTables;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {renderHeader()}
      <div className="flex-1 space-y-4 p-4">
        {renderRollHistory()}
        {renderCategoryFilter(categories)}
        {renderTableList(filtered)}
        {showCreate && <CreateTableForm campaignId={campaignId} onClose={() => setShowCreate(false)} />}
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center justify-between border-b border-[hsla(38,30%,25%,0.2)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Dices className="h-4 w-4 text-primary/70" />
          <h2 className="font-['IM_Fell_English'] text-base font-semibold text-foreground">
            Random Tables
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-3 w-3" />
          New Table
        </Button>
      </div>
    );
  }

  function renderRollHistory() {
    if (rollHistory.length === 0) return null;

    return (
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Recent Rolls
        </p>
        {rollHistory.map((r, i) => (
          <div
            key={i}
            className="rounded border border-primary/20 bg-primary/5 px-3 py-2"
          >
            <p className="text-[10px] text-primary/60">{r.tableName}</p>
            <p className="text-sm text-foreground">{r.result}</p>
          </div>
        ))}
      </div>
    );
  }

  function renderCategoryFilter(cats: string[]) {
    if (cats.length <= 1) return null;

    return (
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setFilterCategory(null)}
          className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
            filterCategory === null
              ? 'bg-primary/20 text-primary'
              : 'bg-[hsl(24,15%,12%)] text-muted-foreground hover:text-foreground'
          }`}
        >
          All
        </button>
        {cats.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
            className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
              filterCategory === cat
                ? 'bg-primary/20 text-primary'
                : 'bg-[hsl(24,15%,12%)] text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    );
  }

  function renderTableList(tbls: RandomTable[]) {
    if (tbls.length === 0) {
      return (
        <p className="text-center text-xs italic text-muted-foreground/60">
          No tables found
        </p>
      );
    }

    return (
      <div className="space-y-1">
        {tbls.map((table) => (
          <TableCard
            key={table._id}
            table={table}
            campaignId={campaignId}
            onRoll={(result) =>
              setRollHistory((prev) => [result, ...prev].slice(0, 10))
            }
          />
        ))}
      </div>
    );
  }
}

/* ── Table Card ──────────────────────────────────────────────── */

function TableCard({
  table,
  campaignId,
  onRoll,
}: {
  table: RandomTable;
  campaignId: string;
  onRoll: (result: RollResult) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rollTable = useRollTable();
  const deleteTable = useDeleteRandomTable();

  function handleRoll() {
    rollTable.mutate(
      { campaignId, tableId: table._id },
      {
        onSuccess: (result) => {
          onRoll(result);
          toast.success(result.result, { description: table.name });
        },
        onError: () => toast.error('Failed to roll'),
      },
    );
  }

  return (
    <div className="rounded border border-border/40 bg-[hsl(24,15%,11%)]">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground/50 hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">{table.name}</span>
            {table.isBuiltIn && (
              <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] uppercase tracking-wide text-primary/60">
                Built-in
              </span>
            )}
            {table.category && (
              <span className="text-[10px] text-muted-foreground/50">
                {table.category}
              </span>
            )}
          </div>
          {table.description && (
            <p className="text-[10px] text-muted-foreground/60">{table.description}</p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRoll}
          disabled={rollTable.isPending}
          className="shrink-0"
        >
          {rollTable.isPending ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Dices className="mr-1 h-3 w-3" />
          )}
          Roll
        </Button>

        {!table.isBuiltIn && (
          <button
            type="button"
            className="shrink-0 text-muted-foreground/40 transition-colors hover:text-blood"
            disabled={deleteTable.isPending}
            onClick={() =>
              deleteTable.mutate(
                { campaignId, tableId: table._id },
                {
                  onSuccess: () => toast.success('Table deleted'),
                  onError: () => toast.error('Failed to delete'),
                },
              )
            }
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border/20 px-3 py-2">
          <p className="mb-1 text-[10px] text-muted-foreground/50">
            {table.entries.length} entries
          </p>
          <div className="max-h-40 overflow-y-auto space-y-0.5">
            {table.entries.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px]">
                <span className="shrink-0 text-muted-foreground/40">
                  {entry.weight > 1 ? `×${entry.weight}` : '•'}
                </span>
                <span className="text-muted-foreground">{entry.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Create Table Form ───────────────────────────────────────── */

function CreateTableForm({
  campaignId,
  onClose,
}: {
  campaignId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [entriesText, setEntriesText] = useState('');
  const createTable = useCreateRandomTable();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !entriesText.trim()) return;

    const entries = entriesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text) => ({ text, weight: 1 }));

    if (entries.length === 0) return;

    createTable.mutate(
      {
        campaignId,
        data: {
          name: name.trim(),
          category: category.trim() || undefined,
          description: description.trim() || undefined,
          entries,
        },
      },
      {
        onSuccess: () => {
          toast.success('Table created');
          onClose();
        },
        onError: () => toast.error('Failed to create table'),
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded border border-border/40 bg-[hsl(24,15%,11%)] p-3"
    >
      <p className="text-xs font-medium text-muted-foreground">New Custom Table</p>

      <input
        className={INPUT_CLS}
        placeholder="Table name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          className={INPUT_CLS}
          placeholder="Category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          className={INPUT_CLS}
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className={LABEL_CLS}>Entries (one per line)</label>
        <textarea
          className={`${INPUT_CLS} min-h-[100px] resize-y`}
          placeholder="A mysterious stranger appears&#10;The ground trembles briefly&#10;A flock of birds takes flight..."
          value={entriesText}
          onChange={(e) => setEntriesText(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={createTable.isPending || !name.trim() || !entriesText.trim()}
        >
          {createTable.isPending ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : null}
          Create
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
