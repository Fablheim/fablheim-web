import { useEffect, useState } from 'react';
import {
  Copy,
  Dices,
  FilePlus2,
  Loader2,
  ScrollText,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDowntimeActivities } from '@/hooks/useDowntime';
import { useEncounters } from '@/hooks/useEncounters';
import {
  useCreateRandomTable,
  useDeleteRandomTable,
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
import { shellPanelClass, innerPanelClass } from '@/lib/panel-styles';
import { useRandomTablesContext } from './RandomTablesContext';

interface TableEditorState {
  name: string;
  category: string;
  description: string;
  diceExpression: string;
  sourceType: 'campaign' | 'custom';
  links: RandomTableLinks;
  rows: Array<{ id: string; min: string; max: string; text: string }>;
}

const shellClass = shellPanelClass;
const panelClass = innerPanelClass;
const fieldClass =
  'w-full rounded-[16px] border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(42,72%,52%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)]';

const sourceMeta: Record<RandomTableSourceType, { label: string; accent: string }> = {
  srd: { label: 'SRD', accent: 'text-[hsl(201,52%,76%)] border-[hsla(201,42%,58%,0.28)] bg-[hsla(201,42%,26%,0.12)]' },
  campaign: { label: 'Campaign', accent: 'text-[hsl(42,78%,76%)] border-[hsla(42,72%,52%,0.28)] bg-[hsla(42,72%,42%,0.12)]' },
  custom: { label: 'Custom', accent: 'text-[hsl(153,42%,72%)] border-[hsla(153,42%,52%,0.28)] bg-[hsla(153,42%,26%,0.12)]' },
};

interface RandomTablesDeskV2Props {
  campaignId: string;
}

export function RandomTablesDeskV2({ campaignId }: RandomTablesDeskV2Props) {
  const {
    setSelectedTableId,
    workspaceMode,
    setWorkspaceMode,
    selectedTable,
    startCreate,
  } = useRandomTablesContext();

  const { data: sessions } = useSessions(campaignId);
  const { data: locations } = useWorldEntities(campaignId, 'location');
  const { data: encounters } = useEncounters(campaignId);
  const { data: downtime } = useDowntimeActivities(campaignId);

  const rollTable = useRollTable();
  const createTable = useCreateRandomTable();
  const updateTable = useUpdateRandomTable();
  const deleteTable = useDeleteRandomTable();

  const [rollCount, setRollCount] = useState('3');
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [editor, setEditor] = useState<TableEditorState>(() => emptyEditor());

  useEffect(() => {
    if (!selectedTable) return;
    setEditor(tableToEditor(selectedTable));
  }, [selectedTable]);

  const canSave = editor.name.trim().length > 0 && editor.rows.some((row) => row.text.trim().length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] p-4 text-[hsl(38,24%,88%)]">
      <section className={`${shellClass} min-h-0 flex-1 flex flex-col overflow-hidden`}>
        {renderShellHeader()}
        {renderShellBody()}
      </section>
    </div>
  );

  function renderShellHeader() {
    const title =
      workspaceMode === 'create'
        ? 'New Table'
        : workspaceMode === 'edit'
          ? `Edit · ${selectedTable?.name ?? 'Table'}`
          : selectedTable?.name ?? 'Choose a Table';

    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {renderShellHeaderLeft(title)}
          {renderShellHeaderActions()}
        </div>
      </div>
    );
  }

  function renderShellHeaderLeft(title: string) {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(212,24%,66%)]">Random Tables</p>
        <h2 className="mt-0.5 font-['IM_Fell_English'] text-[26px] leading-none text-[hsl(38,42%,90%)]">
          {title}
        </h2>
        {workspaceMode === 'view' && selectedTable && (
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(30,14%,52%)]">
            {selectedTable.category || 'Unsorted'} · Roll {selectedTable.diceExpression}
          </p>
        )}
      </div>
    );
  }

  function renderShellHeaderActions() {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {workspaceMode !== 'create' && (
          <button type="button" onClick={startCreate} className={actionButtonClass()}>
            <FilePlus2 className="h-4 w-4" />
            New Table
          </button>
        )}
        {workspaceMode === 'view' && selectedTable?.sourceType === 'srd' && (
          <button
            type="button"
            onClick={() => handleDuplicate(selectedTable)}
            disabled={createTable.isPending}
            className={actionButtonClass()}
          >
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
    );
  }

  function renderShellBody() {
    return (
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
          <EmptyState onCreateClick={startCreate} />
        )}
      </div>
    );
  }

  async function handleRoll(table: RandomTable) {
    try {
      const result = await rollTable.mutateAsync({ campaignId, tableId: table._id });
      setRollHistory((current) => [result, ...current].slice(0, 12));
      toast.success(result.result, {
        description:
          result.rollTotal != null
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

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className={`${panelClass} flex min-h-[360px] items-center justify-center px-6 text-center`}>
      <div>
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(212,24%,66%)]">No Table Selected</p>
        <h4 className="mt-3 font-['IM_Fell_English'] text-[32px] leading-none text-[hsl(38,42%,90%)]">
          Open a shelf or start a fresh table
        </h4>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[hsl(30,14%,58%)]">
          SRD tables stay read-only, campaign tables are yours to shape, and any new table can be attached to sessions,
          locations, encounters, or downtime.
        </p>
        <button type="button" onClick={onCreateClick} className={`${actionButtonClass(true)} mt-6`}>
          <FilePlus2 className="h-4 w-4" />
          Create Campaign Table
        </button>
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
      {renderReaderMeta(table, source, rollCount, rollPending, onRollCountChange, onRoll, onRollMany)}
      {renderReaderGrid(table, links, rollHistory)}
    </div>
  );

  function renderReaderMeta(
    t: RandomTable,
    src: { label: string; accent: string },
    count: string,
    pending: boolean,
    onCountChange: (v: string) => void,
    onRollOne: (tbl: RandomTable) => void,
    onRollMulti: (tbl: RandomTable) => void,
  ) {
    return (
      <div className={`${panelClass} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          {renderReaderMetaLeft(t, src)}
          {renderReaderRollControls(t, count, pending, onCountChange, onRollOne, onRollMulti)}
        </div>
      </div>
    );
  }

  function renderReaderMetaLeft(t: RandomTable, src: { label: string; accent: string }) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${src.accent}`}>
            {t.sourceLabel}
          </span>
          <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(30,12%,60%)]">
            {t.category || 'Unsorted'}
          </span>
          <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(42,78%,78%)]">
            Roll {t.diceExpression}
          </span>
        </div>
        <p className="mt-4 text-sm leading-7 text-[hsl(30,14%,60%)]">
          {t.description || 'A ready-to-roll table for session prep and quick table-side prompts.'}
        </p>
      </div>
    );
  }

  function renderReaderRollControls(
    t: RandomTable,
    count: string,
    pending: boolean,
    onCountChange: (v: string) => void,
    onRollOne: (tbl: RandomTable) => void,
    onRollMulti: (tbl: RandomTable) => void,
  ) {
    return (
      <div className="rounded-[20px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.62)] p-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Roll Controls</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => onRollOne(t)} disabled={pending} className={actionButtonClass(true)}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Dices className="h-4 w-4" />}
            Roll
          </button>
          <label className="flex items-center gap-2 rounded-full border border-[hsla(32,24%,24%,0.42)] px-3 py-2 text-xs text-[hsl(30,12%,62%)]">
            <span>Multi</span>
            <input
              value={count}
              onChange={(event) => onCountChange(event.target.value)}
              className="w-10 bg-transparent text-right text-[hsl(38,24%,88%)] outline-none"
            />
          </label>
          <button type="button" onClick={() => onRollMulti(t)} disabled={pending} className={actionButtonClass()}>
            <Sparkles className="h-4 w-4" />
            Roll Multiple
          </button>
        </div>
      </div>
    );
  }

  function renderReaderGrid(
    t: RandomTable,
    resolvedLinks: Array<{ label: string; value: string }>,
    history: RollResult[],
  ) {
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        {renderResultsTable(t)}
        {renderReaderSidebar(t, resolvedLinks, history)}
      </div>
    );
  }

  function renderResultsTable(t: RandomTable) {
    return (
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
              {t.rows.map((row) => (
                <tr key={row.id} className="border-b border-[hsla(32,24%,24%,0.18)] align-top">
                  <td className="px-5 py-3 font-[Cinzel] text-sm text-[hsl(42,78%,78%)]">{formatRange(row)}</td>
                  <td className="px-5 py-3 text-sm leading-7 text-[hsl(30,14%,64%)]">{row.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderReaderSidebar(
    t: RandomTable,
    resolvedLinks: Array<{ label: string; value: string }>,
    history: RollResult[],
  ) {
    return (
      <div className="space-y-4">
        {renderLinksPanel(resolvedLinks)}
        {renderHistoryPanel(t, history)}
      </div>
    );
  }

  function renderLinksPanel(resolvedLinks: Array<{ label: string; value: string }>) {
    return (
      <div className={`${panelClass} p-4`}>
        <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Linked To</p>
        {resolvedLinks.length === 0 ? (
          <p className="mt-3 text-sm leading-7 text-[hsl(30,14%,58%)]">
            This table is not attached to a session, encounter, location, or downtime note yet.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {resolvedLinks.map((link) => (
              <div
                key={link.label}
                className="rounded-[16px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.58)] px-3 py-2"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">{link.label}</p>
                <p className="mt-1 text-sm text-[hsl(38,24%,88%)]">{link.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderHistoryPanel(t: RandomTable, history: RollResult[]) {
    const tableHistory = history.filter((item) => item.tableId === t._id).slice(0, 6);
    return (
      <div className={`${panelClass} p-4`}>
        <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Result History</p>
        {tableHistory.length === 0 ? (
          <p className="mt-3 text-sm leading-7 text-[hsl(30,14%,58%)]">
            Rolls from this desk will collect here so the latest outcomes stay in view during prep or play.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {tableHistory.map((item, index) => (
              <div
                key={`${item.tableId}-${index}`}
                className="rounded-[16px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.58)] px-3 py-2"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(42,78%,78%)]">
                  {item.rollTotal != null
                    ? `Rolled ${item.rollTotal}${item.matchedRange ? ` · ${item.matchedRange}` : ''}`
                    : 'Result'}
                </p>
                <p className="mt-1 text-sm leading-6 text-[hsl(38,24%,88%)]">{item.result}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
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
      {renderBuilderMeta(editor, sessions, locations, encounters, downtime, onChange)}
      {renderBuilderRows(editor, pending, onCancel, onChange, onSave)}
    </div>
  );

  function renderBuilderMeta(
    ed: TableEditorState,
    sess: Session[],
    locs: WorldEntity[],
    encs: Encounter[],
    dt: DowntimeActivity[],
    change: (v: TableEditorState) => void,
  ) {
    return (
      <div className={`${panelClass} p-5`}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          {renderBuilderFields(ed, change)}
          {renderBuilderLinks(ed, sess, locs, encs, dt, change)}
        </div>
      </div>
    );
  }

  function renderBuilderFields(ed: TableEditorState, change: (v: TableEditorState) => void) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Table Name">
            <input
              value={ed.name}
              onChange={(event) => change({ ...ed, name: event.target.value })}
              className={fieldClass}
              placeholder="Forest road complications"
            />
          </Field>
          <Field label="Category">
            <input
              value={ed.category}
              onChange={(event) => change({ ...ed, category: event.target.value })}
              className={fieldClass}
              placeholder="Travel"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Dice Expression">
            <input
              value={ed.diceExpression}
              onChange={(event) => change({ ...ed, diceExpression: event.target.value })}
              className={fieldClass}
              placeholder="d12"
            />
          </Field>
          <Field label="Source Label">
            <select
              value={ed.sourceType}
              onChange={(event) => change({ ...ed, sourceType: event.target.value as 'campaign' | 'custom' })}
              className={fieldClass}
            >
              <option value="campaign">Campaign</option>
              <option value="custom">Custom</option>
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea
            value={ed.description}
            onChange={(event) => change({ ...ed, description: event.target.value })}
            className={`${fieldClass} min-h-[110px] resize-y`}
            placeholder="Explain when this table is useful and what sort of result it should produce."
          />
        </Field>
      </div>
    );
  }

  function renderBuilderLinks(
    ed: TableEditorState,
    sess: Session[],
    locs: WorldEntity[],
    encs: Encounter[],
    dt: DowntimeActivity[],
    change: (v: TableEditorState) => void,
  ) {
    return (
      <div className={`${panelClass} p-4`}>
        <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Campaign Links</p>
        <div className="mt-4 space-y-3">
          <Field label="Session">
            <select
              value={ed.links.sessionId ?? ''}
              onChange={(event) =>
                change({ ...ed, links: { ...ed.links, sessionId: event.target.value || undefined } })
              }
              className={fieldClass}
            >
              <option value="">None</option>
              {sess.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.title ?? '(Untitled)'}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Encounter">
            <select
              value={ed.links.encounterId ?? ''}
              onChange={(event) =>
                change({ ...ed, links: { ...ed.links, encounterId: event.target.value || undefined } })
              }
              className={fieldClass}
            >
              <option value="">None</option>
              {encs.map((encounter) => (
                <option key={encounter._id} value={encounter._id}>
                  {encounter.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <select
              value={ed.links.worldEntityId ?? ''}
              onChange={(event) =>
                change({ ...ed, links: { ...ed.links, worldEntityId: event.target.value || undefined } })
              }
              className={fieldClass}
            >
              <option value="">None</option>
              {locs.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Downtime">
            <select
              value={ed.links.downtimeId ?? ''}
              onChange={(event) =>
                change({ ...ed, links: { ...ed.links, downtimeId: event.target.value || undefined } })
              }
              className={fieldClass}
            >
              <option value="">None</option>
              {dt.map((activity) => (
                <option key={activity._id} value={activity._id}>
                  {activity.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
    );
  }

  function renderBuilderRows(
    ed: TableEditorState,
    isPending: boolean,
    cancel: () => void,
    change: (v: TableEditorState) => void,
    save: () => void,
  ) {
    return (
      <div className={`${panelClass} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Table Rows</p>
            <p className="mt-2 text-sm text-[hsl(30,14%,58%)]">
              Use explicit ranges so the results read like a real GM table: `1-3`, `4-6`, `10`.
            </p>
          </div>
          <button
            type="button"
            onClick={() => change({ ...ed, rows: [...ed.rows, createEditorRow(ed.rows.length + 1)] })}
            className={actionButtonClass()}
          >
            <FilePlus2 className="h-4 w-4" />
            Add Row
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {ed.rows.map((row, index) => (
            <div
              key={row.id}
              className="grid gap-3 rounded-[18px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.56)] p-3 md:grid-cols-[88px_88px_minmax(0,1fr)_auto]"
            >
              <input
                value={row.min}
                onChange={(event) => change(updateEditorRow(ed, row.id, { min: event.target.value }))}
                className={fieldClass}
                placeholder="1"
              />
              <input
                value={row.max}
                onChange={(event) => change(updateEditorRow(ed, row.id, { max: event.target.value }))}
                className={fieldClass}
                placeholder="3"
              />
              <input
                value={row.text}
                onChange={(event) => change(updateEditorRow(ed, row.id, { text: event.target.value }))}
                className={fieldClass}
                placeholder="Ancient shrine half-buried in the brush"
              />
              <button
                type="button"
                onClick={() =>
                  change({
                    ...ed,
                    rows:
                      ed.rows.filter((item) => item.id !== row.id).length
                        ? ed.rows.filter((item) => item.id !== row.id)
                        : [createEditorRow(index + 1)],
                  })
                }
                className="rounded-full border border-[hsla(8,58%,52%,0.28)] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[hsl(8,58%,72%)] transition hover:bg-[hsla(8,58%,24%,0.14)]"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={cancel} className={actionButtonClass()}>
            Cancel
          </button>
          <button type="button" onClick={save} disabled={isPending} className={actionButtonClass(true)}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}
            Save Table
          </button>
        </div>
      </div>
    );
  }
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
    entries: rows.map((row) => ({ text: row.text, weight: row.max - row.min + 1 })),
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
    if (session) resolved.push({ label: 'Session', value: session.title ?? '(Untitled)' });
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
