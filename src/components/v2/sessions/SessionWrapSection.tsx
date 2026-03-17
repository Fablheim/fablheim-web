import { useState, useCallback } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useArcs, useAddArcDevelopment } from '@/hooks/useCampaigns';
import { innerPanelClass } from '@/lib/panel-styles';
import type { Session, CampaignArc, ArcStatus } from '@/types/campaign';

const badgeBase = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium';

const ARC_STATUS_STYLES: Record<string, string> = {
  active: 'border-[hsla(210,52%,45%,0.32)] bg-[hsla(210,52%,45%,0.12)] text-[hsl(205,80%,72%)]',
  advancing: 'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]',
  threatened: 'border-[hsla(0,60%,50%,0.32)] bg-[hsla(0,60%,50%,0.12)] text-[hsl(0,72%,72%)]',
  dormant: 'border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]',
};

const TAGGABLE_STATUSES: Set<ArcStatus> = new Set(['active', 'advancing', 'threatened']);

const inputClass =
  'w-full rounded-lg border border-[hsla(32,26%,26%,0.48)] bg-[hsl(24,16%,10%)] px-3 py-2 text-[12px] text-[hsl(35,24%,92%)] outline-none transition-colors placeholder:text-[hsl(30,10%,42%)] focus:border-[hsla(38,60%,52%,0.45)]';

interface ArcRowState {
  checked: boolean;
  note: string;
}

export function SessionWrapSection({
  campaignId,
  session,
}: {
  campaignId: string;
  session: Session;
}) {
  const { data: arcs, isLoading } = useArcs(campaignId);
  const addDevelopment = useAddArcDevelopment();

  const taggableArcs = (arcs ?? []).filter((a: CampaignArc) => TAGGABLE_STATUSES.has(a.status));

  const [rowStates, setRowStates] = useState<Record<string, ArcRowState>>({});
  const [saving, setSaving] = useState(false);

  const toggle = useCallback((arcId: string) => {
    setRowStates((prev) => ({
      ...prev,
      [arcId]: { checked: !prev[arcId]?.checked, note: prev[arcId]?.note ?? '' },
    }));
  }, []);

  const setNote = useCallback((arcId: string, note: string) => {
    setRowStates((prev) => ({
      ...prev,
      [arcId]: { checked: prev[arcId]?.checked ?? false, note },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    const entries = Object.entries(rowStates).filter(([, v]) => v.checked);
    if (entries.length === 0) return;

    setSaving(true);
    try {
      await Promise.all(
        entries.map(([arcId, row]) =>
          addDevelopment.mutateAsync({
            campaignId,
            arcId,
            data: {
              title: row.note || `Advanced in Session ${session.sessionNumber}`,
              sessionId: session._id,
            },
          }),
        ),
      );
      toast.success(`Tagged ${entries.length} arc${entries.length > 1 ? 's' : ''} as advanced`);
      // Reset checked state after save
      setRowStates({});
    } catch {
      toast.error('Failed to save arc developments');
    } finally {
      setSaving(false);
    }
  }, [rowStates, addDevelopment, campaignId, session]);

  const checkedCount = Object.values(rowStates).filter((v) => v.checked).length;

  return (
    <div className={innerPanelClass}>
      {renderHeader()}
      {renderBody()}
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(38,82%,63%)]" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-[hsl(30,14%,54%)]">
          Session Wrap
        </span>
      </div>
    );
  }

  function renderBody() {
    if (isLoading) {
      return (
        <p className="mt-2 text-[11px] text-[hsl(30,12%,58%)]">Loading arcs...</p>
      );
    }

    if (taggableArcs.length === 0) {
      return (
        <p className="mt-2 text-[11px] text-[hsl(30,12%,58%)]">No active arcs to tag</p>
      );
    }

    return (
      <div className="mt-3 space-y-2">
        {renderArcRows()}
        {renderSaveButton()}
      </div>
    );
  }

  function renderArcRows() {
    return (
      <ul className="space-y-2">
        {taggableArcs.map((arc: CampaignArc) => (
          <ArcRow
            key={arc._id}
            arc={arc}
            state={rowStates[arc._id] ?? { checked: false, note: '' }}
            onToggle={() => toggle(arc._id)}
            onNote={(note) => setNote(arc._id, note)}
          />
        ))}
      </ul>
    );
  }

  function renderSaveButton() {
    return (
      <div className="flex justify-end pt-1">
        <button
          type="button"
          disabled={checkedCount === 0 || saving}
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-full border border-[hsla(38,60%,52%,0.35)] bg-[hsla(38,60%,52%,0.12)] px-4 py-1.5 text-[11px] font-medium text-[hsl(38,82%,63%)] transition-colors hover:bg-[hsla(38,60%,52%,0.22)] disabled:opacity-40 disabled:pointer-events-none"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save arc tags
        </button>
      </div>
    );
  }
}

// ── Single arc row ──────────────────────────────────────────────────────────

function ArcRow({
  arc,
  state,
  onToggle,
  onNote,
}: {
  arc: CampaignArc;
  state: ArcRowState;
  onToggle: () => void;
  onNote: (note: string) => void;
}) {
  return (
    <li className="flex items-start gap-2.5">
      {renderCheckAndLabel()}
      {renderNoteInput()}
    </li>
  );

  function renderCheckAndLabel() {
    return (
      <label className="flex shrink-0 cursor-pointer items-center gap-2 pt-1.5">
        <input
          type="checkbox"
          checked={state.checked}
          onChange={onToggle}
          className="h-3.5 w-3.5 accent-[hsl(38,82%,63%)]"
        />
        <span className="text-[12px] text-[hsl(35,24%,92%)]">{arc.name}</span>
        <span
          className={`${badgeBase} border ${ARC_STATUS_STYLES[arc.status] ?? ARC_STATUS_STYLES.dormant}`}
        >
          {arc.status}
        </span>
      </label>
    );
  }

  function renderNoteInput() {
    if (!state.checked) return null;
    return (
      <input
        type="text"
        value={state.note}
        onChange={(e) => onNote(e.target.value)}
        placeholder={`Advanced in Session ${arc.name}...`}
        className={`${inputClass} min-w-0 flex-1`}
      />
    );
  }
}
