import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Dices,
  FilePlus2,
  FolderTree,
  Loader2,
  ScrollText,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDowntimeActivities } from '@/hooks/useDowntime';
import { useEncounters } from '@/hooks/useEncounters';
import {
  useCreateRandomTable,
  useDeleteRandomTable,
  useRandomTables,
  useRollTable,
  useUpdateRandomTable,
} from '@/hooks/useRandomTables';
import { useSessions } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type { Encounter } from '@/types/encounter';
import type { DowntimeActivity } from '@/types/downtime';
import type { Session, WorldEntity } from '@/types/campaign';
import type {
  CreateRandomTablePayload,
  RandomTable,
  RandomTableLinks,
  RandomTableRow,
  RandomTableSourceType,
  RollResult,
} from '@/types/random-table';

interface RandomTablesDeskV2Props {
  campaignId: string;
}

interface TableEditorState {
  name: string;
  category: string;
  description: string;
  diceExpression: string;
  sourceType: 'campaign' | 'custom';
  links: RandomTableLinks;
  rows: Array<{ id: string; min: string; max: string; text: string }>;
}

type WorkspaceMode = 'view' | 'create' | 'edit';
type SourceFilter = 'all' | RandomTableSourceType;

const shellClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.64)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(22,24%,9%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]';
const panelClass =
  'rounded-[22px] border border-[hsla(32,24%,24%,0.46)] bg-[linear-gradient(180deg,hsla(26,22%,11%,0.95)_0%,hsla(20,20%,9%,0.96)_100%)]';
const fieldClass =
  'w-full rounded-[16px] border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(42,72%,52%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)]';

const sourceMeta: Record<RandomTableSourceType, { label: string; accent: string }> = {
  srd: { label: 'SRD', accent: 'text-[hsl(201,52%,76%)] border-[hsla(201,42%,58%,0.28)] bg-[hsla(201,42%,26%,0.12)]' },
  campaign: { label: 'Campaign', accent: 'text-[hsl(42,78%,76%)] border-[hsla(42,72%,52%,0.28)] bg-[hsla(42,72%,42%,0.12)]' },
  custom: { label: 'Custom', accent: 'text-[hsl(153,42%,72%)] border-[hsla(153,42%,52%,0.28)] bg-[hsla(153,42%,26%,0.12)]' },
};

export function RandomTablesDeskV2({ campaignId }: RandomTablesDeskV2Props) {
  const { data: tables, isLoading, error } = useRandomTables(campaignId);
  const { data: sessions } = useSessions(campaignId);
  const { data: locations } = useWorldEntities(campaignId, 'location');
  const { data: encounters } = useEncounters(campaignId);
  const { data: downtime } = useDowntimeActivities(campaignId);

  const rollTable = useRollTable();
  const createTable = useCreateRandomTable();
  const updateTable = useUpdateRandomTable();
  const deleteTable = useDeleteRandomTable();

  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('view');
  const [rollCount, setRollCount] = useState('3');
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [editor, setEditor] = useState<TableEditorState>(() => emptyEditor());

  const allTables = useMemo(() => tables ?? [], [tables]);

  const visibleTables = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allTables.filter((table) => {
      if (sourceFilter !== 'all' && table.sourceType !== sourceFilter) return false;
      if (!normalizedQuery) return true;
      const haystack = `${table.name} ${table.category} ${table.description} ${table.sourceLabel}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [allTables, query, sourceFilter]);

  const categories = useMemo(() => {
    const grouped = new Map<string, RandomTable[]>();
    for (const table of visibleTables) {
      const key = table.category || 'Unsorted';
      const current = grouped.get(key) ?? [];
      current.push(table);
      grouped.set(key, current);
    }
    return [...grouped.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([category, items]) => ({
        category,
        items: items.sort((left, right) => left.name.localeCompare(right.name)),
      }));
  }, [visibleTables]);

  const selectedTable = useMemo(
    () => allTables.find((table) => table._id === selectedTableId) ?? null,
    [allTables, selectedTableId],
  );

  useEffect(() => {
    if (workspaceMode !== 'view') return;
    if (selectedTableId && allTables.some((table) => table._id === selectedTableId)) return;
    setSelectedTableId(allTables[0]?._id ?? null);
  }, [allTables, selectedTableId, workspaceMode]);

  useEffect(() => {
    if (!selectedTable) return;
    setEditor(tableToEditor(selectedTable));
  }, [selectedTable]);

  useEffect(() => {
    if (categories.length === 0) return;
    setOpenCategories((current) => {
      const next = { ...current };
      for (const { category } of categories) {
        if (!(category in next)) next[category] = true;
      }
      return next;
    });
  }, [categories]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-[hsl(30,14%,62%)]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[hsl(8,58%,72%)]">
        Failed to load random tables.
      </div>
    );
  }

  const canSave = editor.name.trim().length > 0 && editor.rows.some((row) => row.text.trim().length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] text-[hsl(38,24%,88%)]">
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(212,24%,66%)]">Random Tables</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,42%,90%)]">
              Dice Toolbox
            </h2>
            <p className="mt-2 text-sm text-[hsl(30,14%,58%)]">
              Browse lawful SRD tables, duplicate them into the campaign, and keep your own prep tables ready for quick rolls.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <OverviewChip label="Tables" value={`${allTables.length}`} icon={FolderTree} />
            <OverviewChip label="SRD Shelf" value={`${allTables.filter((table) => table.sourceType === 'srd').length}`} icon={ScrollText} />
            <OverviewChip label="Campaign" value={`${allTables.filter((table) => table.sourceType !== 'srd').length}`} icon={Sparkles} />
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden px-4 py-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${shellClass} min-h-0 overflow-hidden`}>
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Table Library</p>
                  <h3 className="mt-2 font-[Cinzel] text-lg text-[hsl(38,34%,88%)]">Codex Tree</h3>
                </div>
                <button type="button" onClick={startCreate} className={actionButtonClass(true)}>
                  <FilePlus2 className="h-4 w-4" />
                  New
                </button>
              </div>

              <label className="mt-4 flex items-center gap-3 rounded-[16px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.68)] px-3 py-2.5">
                <Search className="h-4 w-4 text-[hsl(30,12%,50%)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search tables, shelves, and tags..."
                  className="w-full bg-transparent text-sm text-[hsl(38,24%,88%)] outline-none placeholder:text-[hsl(30,12%,42%)]"
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-2">
                {(['all', 'srd', 'campaign', 'custom'] as SourceFilter[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSourceFilter(value)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition ${
                      sourceFilter === value
                        ? 'border-[hsla(42,72%,52%,0.4)] bg-[hsla(42,72%,42%,0.14)] text-[hsl(42,78%,78%)]'
                        : 'border-[hsla(32,24%,24%,0.48)] bg-[hsla(24,18%,10%,0.56)] text-[hsl(30,12%,58%)] hover:text-[hsl(38,24%,88%)]'
                    }`}
                  >
                    {value === 'all' ? 'All Sources' : sourceMeta[value].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {categories.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[hsla(32,24%,24%,0.52)] px-4 py-6 text-sm text-[hsl(30,12%,58%)]">
                  No tables match that shelf search yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map(({ category, items }) => {
                    const isOpen = openCategories[category] ?? true;
                    return (
                      <div key={category} className="rounded-[18px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,9%,0.54)] px-2 py-2">
                        <button
                          type="button"
                          onClick={() => setOpenCategories((current) => ({ ...current, [category]: !isOpen }))}
                          className="flex w-full items-center gap-2 rounded-[14px] px-2 py-2 text-left hover:bg-[hsla(32,24%,18%,0.26)]"
                        >
                          {isOpen ? <ChevronDown className="h-4 w-4 text-[hsl(30,12%,58%)]" /> : <ChevronRight className="h-4 w-4 text-[hsl(30,12%,58%)]" />}
                          <span className="font-[Cinzel] text-sm text-[hsl(38,32%,86%)]">{category}</span>
                          <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-[hsl(212,24%,62%)]">
                            {items.length} table{items.length === 1 ? '' : 's'}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="mt-1 space-y-1 pl-5">
                            {items.map((table) => (
                              <button
                                key={table._id}
                                type="button"
                                onClick={() => {
                                  setWorkspaceMode('view');
                                  setSelectedTableId(table._id);
                                }}
                                className={`flex w-full items-start gap-2 rounded-[14px] px-3 py-2 text-left transition ${
                                  selectedTableId === table._id && workspaceMode === 'view'
                                    ? 'bg-[hsla(42,72%,42%,0.14)]'
                                    : 'hover:bg-[hsla(32,24%,18%,0.22)]'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm text-[hsl(38,24%,88%)]">{table.name}</p>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[hsl(30,12%,56%)]">
                                    <span className={`rounded-full border px-2 py-0.5 ${sourceMeta[table.sourceType].accent}`}>
                                      {table.sourceLabel}
                                    </span>
                                    <span>{table.diceExpression}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className={`${shellClass} min-h-0 overflow-hidden`}>
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Table Workspace</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-['IM_Fell_English'] text-[30px] leading-none text-[hsl(38,42%,90%)]">
                    {workspaceMode === 'create' ? 'Compose a New Table' : workspaceMode === 'edit' ? `Edit ${selectedTable?.name ?? 'Table'}` : selectedTable?.name ?? 'Choose a Table'}
                  </h3>
                  <p className="mt-2 text-sm text-[hsl(30,14%,58%)]">
                    {workspaceMode === 'view'
                      ? selectedTable?.description || 'Roll it on the spot, inspect the result bands, or copy an SRD table into the campaign.'
                      : 'Set the die, shape the result ranges, and attach the table to the parts of the campaign that will need it.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {workspaceMode !== 'create' && (
                    <button type="button" onClick={startCreate} className={actionButtonClass()}>
                      <FilePlus2 className="h-4 w-4" />
                      New Table
                    </button>
                  )}

                  {workspaceMode === 'view' && selectedTable?.sourceType === 'srd' && (
                    <button type="button" onClick={() => handleDuplicate(selectedTable)} className={actionButtonClass(true)} disabled={createTable.isPending}>
                      {createTable.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                      Duplicate to Campaign
                    </button>
                  )}

                  {workspaceMode === 'view' && selectedTable && !selectedTable.readOnly && (
                    <button type="button" onClick={() => setWorkspaceMode('edit')} className={actionButtonClass()}>
                      <ScrollText className="h-4 w-4" />
                      Edit
                    </button>
                  )}

                  {workspaceMode === 'edit' && selectedTable && !selectedTable.readOnly && (
                    <button type="button" onClick={() => handleDelete(selectedTable)} className={actionButtonClass()}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {workspaceMode === 'create' || (workspaceMode === 'edit' && selectedTable && !selectedTable.readOnly) ? (
                <TableBuilder
                  editor={editor}
                  sessions={sessions ?? []}
                  locations={locations ?? []}
                  encounters={encounters ?? []}
                  downtime={downtime ?? []}
                  pending={createTable.isPending || updateTable.isPending}
                  onCancel={() => {
                    setWorkspaceMode('view');
                    setEditor(selectedTable ? tableToEditor(selectedTable) : emptyEditor());
                  }}
                  onChange={setEditor}
                  onSave={() => handleSave(canSave)}
                />
              ) : selectedTable ? (
                <TableReader
                  table={selectedTable}
                  sessions={sessions ?? []}
                  locations={locations ?? []}
                  encounters={encounters ?? []}
                  downtime={downtime ?? []}
                  rollCount={rollCount}
                  rollHistory={rollHistory}
                  rollPending={rollTable.isPending}
                  onRollCountChange={setRollCount}
                  onRoll={handleRoll}
                  onRollMany={handleRollMany}
                />
              ) : (
                <div className={`${panelClass} flex min-h-[360px] items-center justify-center px-6 text-center`}>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(212,24%,66%)]">No Table Selected</p>
                    <h4 className="mt-3 font-['IM_Fell_English'] text-[32px] leading-none text-[hsl(38,42%,90%)]">
                      Open a shelf or start a fresh table
                    </h4>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[hsl(30,14%,58%)]">
                      SRD tables stay read-only, campaign tables are yours to shape, and any new table can be attached to sessions, locations, encounters, or downtime.
                    </p>
                    <button type="button" onClick={startCreate} className={`${actionButtonClass(true)} mt-6`}>
                      <FilePlus2 className="h-4 w-4" />
                      Create Campaign Table
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  function startCreate() {
    setWorkspaceMode('create');
    setSelectedTableId(null);
    setEditor(emptyEditor());
  }

  async function handleRoll(table: RandomTable) {
    try {
      const result = await rollTable.mutateAsync({ campaignId, tableId: table._id });
      setRollHistory((current) => [result, ...current].slice(0, 12));
      toast.success(result.result, {
        description: result.rollTotal != null
          ? `${table.name} · ${table.diceExpression} rolled ${result.rollTotal}${result.matchedRange ? ` (${result.matchedRange})` : ''}`
          : table.name,
      });
    } catch {
      toast.error('Failed to roll this table');
    }
  }

  async function handleRollMany(table: RandomTable) {
    const total = Math.max(2, Math.min(10, Number.parseInt(rollCount, 10) || 3));
    try {
      const results = await Promise.all(
        Array.from({ length: total }, () => rollTable.mutateAsync({ campaignId, tableId: table._id })),
      );
      setRollHistory((current) => [...results.reverse(), ...current].slice(0, 12));
      toast.success(`Rolled ${table.name} ${total} times`);
    } catch {
      toast.error('Failed to roll that table multiple times');
    }
  }

  async function handleDuplicate(table: RandomTable) {
    try {
      const created = await createTable.mutateAsync({
        campaignId,
        data: tableToPayload(table, 'campaign'),
      });
      setWorkspaceMode('view');
      setSelectedTableId(created._id);
      toast.success(`${table.name} copied into the campaign`);
    } catch {
      toast.error('Failed to duplicate SRD table');
    }
  }

  async function handleSave(isValid: boolean) {
    if (!isValid) {
      toast.error('Add a table name and at least one result row');
      return;
    }

    const payload = editorToPayload(editor);

    try {
      if (workspaceMode === 'edit' && selectedTable) {
        const updated = await updateTable.mutateAsync({
          campaignId,
          tableId: selectedTable._id,
          data: payload,
        });
        setSelectedTableId(updated._id);
        toast.success('Campaign table updated');
      } else {
        const created = await createTable.mutateAsync({
          campaignId,
          data: payload,
        });
        setSelectedTableId(created._id);
        toast.success('Campaign table created');
      }
      setWorkspaceMode('view');
    } catch {
      toast.error('Failed to save the table');
    }
  }

  async function handleDelete(table: RandomTable) {
    try {
      await deleteTable.mutateAsync({ campaignId, tableId: table._id });
      setWorkspaceMode('view');
      setSelectedTableId(null);
      toast.success('Campaign table removed');
    } catch {
      toast.error('Failed to delete the table');
    }
  }
}

function OverviewChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Dices;
}) {
  return (
    <div className="rounded-full border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.62)] px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[hsl(42,72%,68%)]" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">{label}</p>
          <p className="text-sm text-[hsl(38,24%,88%)]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TableReader({
  table,
  sessions,
  locations,
  encounters,
  downtime,
  rollCount,
  rollHistory,
  rollPending,
  onRollCountChange,
  onRoll,
  onRollMany,
}: {
  table: RandomTable;
  sessions: Session[];
  locations: WorldEntity[];
  encounters: Encounter[];
  downtime: DowntimeActivity[];
  rollCount: string;
  rollHistory: RollResult[];
  rollPending: boolean;
  onRollCountChange: (value: string) => void;
  onRoll: (table: RandomTable) => void;
  onRollMany: (table: RandomTable) => void;
}) {
  const source = sourceMeta[table.sourceType];
  const links = resolveLinks(table.links, sessions, locations, encounters, downtime);

  return (
    <div className="space-y-4">
      <div className={`${panelClass} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${source.accent}`}>
                {table.sourceLabel}
              </span>
              <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(30,12%,60%)]">
                {table.category || 'Unsorted'}
              </span>
              <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(42,78%,78%)]">
                Roll {table.diceExpression}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-[hsl(30,14%,60%)]">
              {table.description || 'A ready-to-roll table for session prep and quick table-side prompts.'}
            </p>
          </div>

          <div className="rounded-[20px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.62)] p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Roll Controls</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => onRoll(table)} disabled={rollPending} className={actionButtonClass(true)}>
                {rollPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Dices className="h-4 w-4" />}
                Roll
              </button>
              <label className="flex items-center gap-2 rounded-full border border-[hsla(32,24%,24%,0.42)] px-3 py-2 text-xs text-[hsl(30,12%,62%)]">
                <span>Multi</span>
                <input
                  value={rollCount}
                  onChange={(event) => onRollCountChange(event.target.value)}
                  className="w-10 bg-transparent text-right text-[hsl(38,24%,88%)] outline-none"
                />
              </label>
              <button type="button" onClick={() => onRollMany(table)} disabled={rollPending} className={actionButtonClass()}>
                <Sparkles className="h-4 w-4" />
                Roll Multiple
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className={`${panelClass} overflow-hidden`}>
          <div className="border-b border-[hsla(32,24%,24%,0.42)] px-5 py-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Table Results</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-[hsla(32,24%,24%,0.38)] text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">
                <tr>
                  <th className="px-5 py-3">Range</th>
                  <th className="px-5 py-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.id} className="border-b border-[hsla(32,24%,24%,0.18)] align-top">
                    <td className="px-5 py-3 font-[Cinzel] text-sm text-[hsl(42,78%,78%)]">{formatRange(row)}</td>
                    <td className="px-5 py-3 text-sm leading-7 text-[hsl(30,14%,64%)]">{row.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${panelClass} p-4`}>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Linked To</p>
            {links.length === 0 ? (
              <p className="mt-3 text-sm leading-7 text-[hsl(30,14%,58%)]">This table is not attached to a session, encounter, location, or downtime note yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {links.map((link) => (
                  <div key={link.label} className="rounded-[16px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.58)] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">{link.label}</p>
                    <p className="mt-1 text-sm text-[hsl(38,24%,88%)]">{link.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${panelClass} p-4`}>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Result History</p>
            {rollHistory.length === 0 ? (
              <p className="mt-3 text-sm leading-7 text-[hsl(30,14%,58%)]">Rolls from this desk will collect here so the latest outcomes stay in view during prep or play.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {rollHistory.filter((item) => item.tableId === table._id).slice(0, 6).map((item, index) => (
                  <div key={`${item.tableId}-${index}`} className="rounded-[16px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.58)] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(42,78%,78%)]">
                      {item.rollTotal != null ? `Rolled ${item.rollTotal}${item.matchedRange ? ` · ${item.matchedRange}` : ''}` : 'Result'}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[hsl(38,24%,88%)]">{item.result}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TableBuilder({
  editor,
  sessions,
  locations,
  encounters,
  downtime,
  pending,
  onCancel,
  onChange,
  onSave,
}: {
  editor: TableEditorState;
  sessions: Session[];
  locations: WorldEntity[];
  encounters: Encounter[];
  downtime: DowntimeActivity[];
  pending: boolean;
  onCancel: () => void;
  onChange: (value: TableEditorState) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className={`${panelClass} p-5`}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Table Name">
                <input value={editor.name} onChange={(event) => onChange({ ...editor, name: event.target.value })} className={fieldClass} placeholder="Forest road complications" />
              </Field>
              <Field label="Category">
                <input value={editor.category} onChange={(event) => onChange({ ...editor, category: event.target.value })} className={fieldClass} placeholder="Travel" />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Dice Expression">
                <input value={editor.diceExpression} onChange={(event) => onChange({ ...editor, diceExpression: event.target.value })} className={fieldClass} placeholder="d12" />
              </Field>
              <Field label="Source Label">
                <select value={editor.sourceType} onChange={(event) => onChange({ ...editor, sourceType: event.target.value as 'campaign' | 'custom' })} className={fieldClass}>
                  <option value="campaign">Campaign</option>
                  <option value="custom">Custom</option>
                </select>
              </Field>
            </div>

            <Field label="Description">
              <textarea
                value={editor.description}
                onChange={(event) => onChange({ ...editor, description: event.target.value })}
                className={`${fieldClass} min-h-[110px] resize-y`}
                placeholder="Explain when this table is useful and what sort of result it should produce."
              />
            </Field>
          </div>

          <div className={`${panelClass} p-4`}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Campaign Links</p>
            <div className="mt-4 space-y-3">
              <Field label="Session">
                <select value={editor.links.sessionId ?? ''} onChange={(event) => onChange({ ...editor, links: { ...editor.links, sessionId: event.target.value || undefined } })} className={fieldClass}>
                  <option value="">None</option>
                  {sessions.map((session) => (
                    <option key={session._id} value={session._id}>{session.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Encounter">
                <select value={editor.links.encounterId ?? ''} onChange={(event) => onChange({ ...editor, links: { ...editor.links, encounterId: event.target.value || undefined } })} className={fieldClass}>
                  <option value="">None</option>
                  {encounters.map((encounter) => (
                    <option key={encounter._id} value={encounter._id}>{encounter.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Location">
                <select value={editor.links.worldEntityId ?? ''} onChange={(event) => onChange({ ...editor, links: { ...editor.links, worldEntityId: event.target.value || undefined } })} className={fieldClass}>
                  <option value="">None</option>
                  {locations.map((location) => (
                    <option key={location._id} value={location._id}>{location.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Downtime">
                <select value={editor.links.downtimeId ?? ''} onChange={(event) => onChange({ ...editor, links: { ...editor.links, downtimeId: event.target.value || undefined } })} className={fieldClass}>
                  <option value="">None</option>
                  {downtime.map((activity) => (
                    <option key={activity._id} value={activity._id}>{activity.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className={`${panelClass} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Table Rows</p>
            <p className="mt-2 text-sm text-[hsl(30,14%,58%)]">Use explicit ranges so the results read like a real GM table: `1-3`, `4-6`, `10`.</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...editor, rows: [...editor.rows, createEditorRow(editor.rows.length + 1)] })}
            className={actionButtonClass()}
          >
            <FilePlus2 className="h-4 w-4" />
            Add Row
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {editor.rows.map((row, index) => (
            <div key={row.id} className="grid gap-3 rounded-[18px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.56)] p-3 md:grid-cols-[88px_88px_minmax(0,1fr)_auto]">
              <input
                value={row.min}
                onChange={(event) => onChange(updateEditorRow(editor, row.id, { min: event.target.value }))}
                className={fieldClass}
                placeholder="1"
              />
              <input
                value={row.max}
                onChange={(event) => onChange(updateEditorRow(editor, row.id, { max: event.target.value }))}
                className={fieldClass}
                placeholder="3"
              />
              <input
                value={row.text}
                onChange={(event) => onChange(updateEditorRow(editor, row.id, { text: event.target.value }))}
                className={fieldClass}
                placeholder="Ancient shrine half-buried in the brush"
              />
              <button
                type="button"
                onClick={() => onChange({ ...editor, rows: editor.rows.filter((item) => item.id !== row.id).length ? editor.rows.filter((item) => item.id !== row.id) : [createEditorRow(index + 1)] })}
                className="rounded-full border border-[hsla(8,58%,52%,0.28)] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[hsl(8,58%,72%)] transition hover:bg-[hsla(8,58%,24%,0.14)]"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} className={actionButtonClass()}>
            Cancel
          </button>
          <button type="button" onClick={onSave} disabled={pending} className={actionButtonClass(true)}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}
            Save Table
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">{label}</span>
      {children}
    </label>
  );
}

function actionButtonClass(emphasis = false) {
  return `inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
    emphasis
      ? 'border-[hsla(42,72%,52%,0.38)] bg-[linear-gradient(180deg,hsla(42,72%,56%,0.18)_0%,hsla(42,72%,38%,0.16)_100%)] text-[hsl(42,78%,80%)] hover:border-[hsla(42,72%,60%,0.46)]'
      : 'border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] text-[hsl(30,12%,62%)] hover:text-[hsl(38,24%,88%)]'
  }`;
}

function emptyEditor(): TableEditorState {
  return {
    name: '',
    category: '',
    description: '',
    diceExpression: 'd20',
    sourceType: 'campaign',
    links: {},
    rows: [createEditorRow(1)],
  };
}

function createEditorRow(seed: number) {
  return {
    id: `editor-row-${seed}-${Date.now()}`,
    min: '',
    max: '',
    text: '',
  };
}

function updateEditorRow(editor: TableEditorState, rowId: string, patch: Partial<TableEditorState['rows'][number]>) {
  return {
    ...editor,
    rows: editor.rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
  };
}

function tableToEditor(table: RandomTable): TableEditorState {
  return {
    name: table.name,
    category: table.category,
    description: table.description,
    diceExpression: table.diceExpression,
    sourceType: table.sourceType === 'custom' ? 'custom' : 'campaign',
    links: table.links ?? {},
    rows: table.rows.map((row) => ({
      id: row.id,
      min: `${row.min}`,
      max: row.min === row.max ? '' : `${row.max}`,
      text: row.text,
    })),
  };
}

function editorToPayload(editor: TableEditorState): CreateRandomTablePayload {
  const rows = editor.rows
    .map((row) => ({
      min: Number.parseInt(row.min, 10),
      max: Number.parseInt(row.max || row.min, 10),
      text: row.text.trim(),
    }))
    .filter((row) => Number.isFinite(row.min) && Number.isFinite(row.max) && row.text.length > 0)
    .sort((left, right) => left.min - right.min);

  return {
    name: editor.name.trim(),
    category: editor.category.trim(),
    description: editor.description.trim(),
    diceExpression: editor.diceExpression.trim() || 'd20',
    sourceType: editor.sourceType,
    links: cleanLinks(editor.links),
    rows,
    entries: rows.map((row) => ({ text: row.text, weight: (row.max - row.min) + 1 })),
  };
}

function tableToPayload(table: RandomTable, sourceType: 'campaign' | 'custom'): CreateRandomTablePayload {
  return {
    name: table.name,
    category: table.category,
    description: table.description,
    diceExpression: table.diceExpression,
    sourceType,
    links: cleanLinks(table.links ?? {}),
    rows: table.rows.map((row) => ({ min: row.min, max: row.max, text: row.text })),
    entries: table.entries,
  };
}

function cleanLinks(links: RandomTableLinks): RandomTableLinks | undefined {
  const next = Object.fromEntries(Object.entries(links).filter(([, value]) => value));
  return Object.keys(next).length ? next : undefined;
}

function resolveLinks(
  links: RandomTableLinks | undefined,
  sessions: Session[],
  locations: WorldEntity[],
  encounters: Encounter[],
  downtime: DowntimeActivity[],
) {
  if (!links) return [];
  const resolved: Array<{ label: string; value: string }> = [];
  if (links.sessionId) {
    const session = sessions.find((item) => item._id === links.sessionId);
    if (session) resolved.push({ label: 'Session', value: session.name });
  }
  if (links.encounterId) {
    const encounter = encounters.find((item) => item._id === links.encounterId);
    if (encounter) resolved.push({ label: 'Encounter', value: encounter.name });
  }
  if (links.worldEntityId) {
    const location = locations.find((item) => item._id === links.worldEntityId);
    if (location) resolved.push({ label: 'Location', value: location.name });
  }
  if (links.downtimeId) {
    const activity = downtime.find((item) => item._id === links.downtimeId);
    if (activity) resolved.push({ label: 'Downtime', value: activity.name });
  }
  return resolved;
}

function formatRange(row: RandomTableRow) {
  return row.min === row.max ? `${row.min}` : `${row.min}-${row.max}`;
}
