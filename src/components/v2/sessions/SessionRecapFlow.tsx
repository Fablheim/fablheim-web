import { useState, useCallback, useMemo } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Minus, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useArcs, useAddArcDevelopment, useTrackers, useAdjustTracker, useAdvanceDate, useCampaign } from '@/hooks/useCampaigns';
import { useUpdateSession } from '@/hooks/useSessions';
import { useCampaignStage } from '@/hooks/useCampaignStage';
import { innerPanelClass } from '@/lib/panel-styles';
import type { Session, CampaignArc, ArcStatus, WorldStateTracker } from '@/types/campaign';

// ── Style constants ─────────────────────────────────────────────────────────

const eyebrowClass = 'text-[10px] uppercase tracking-[0.18em] text-[hsl(30,14%,54%)]';
const stepIndicatorClass = 'text-[11px] text-[hsl(30,12%,58%)]';

const inputClass =
  'w-full rounded-lg border border-[hsla(32,26%,26%,0.48)] bg-[hsl(24,16%,10%)] px-3 py-2 text-[12px] text-[hsl(35,24%,92%)] outline-none transition-colors placeholder:text-[hsl(30,10%,42%)] focus:border-[hsla(38,60%,52%,0.45)]';

const goldPillClass =
  'inline-flex items-center gap-1.5 rounded-full border border-[hsla(42,72%,52%,0.38)] bg-[linear-gradient(180deg,hsla(42,72%,56%,0.18)_0%,hsla(42,72%,38%,0.16)_100%)] px-4 py-1.5 text-[11px] font-medium text-[hsl(42,78%,80%)] transition-colors hover:bg-[linear-gradient(180deg,hsla(42,72%,56%,0.28)_0%,hsla(42,72%,38%,0.26)_100%)] disabled:opacity-40 disabled:pointer-events-none';

const subtlePillClass =
  'inline-flex items-center gap-1 rounded-full border border-[hsla(32,24%,24%,0.46)] bg-transparent px-3 py-1.5 text-[11px] font-medium text-[hsl(30,14%,66%)] transition-colors hover:bg-[hsla(32,24%,24%,0.22)] disabled:opacity-40 disabled:pointer-events-none';

const badgeBase = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium';

const ARC_STATUS_STYLES: Record<string, string> = {
  active: 'border-[hsla(210,52%,45%,0.32)] bg-[hsla(210,52%,45%,0.12)] text-[hsl(205,80%,72%)]',
  advancing: 'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]',
  threatened: 'border-[hsla(0,60%,50%,0.32)] bg-[hsla(0,60%,50%,0.12)] text-[hsl(0,72%,72%)]',
  dormant: 'border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]',
};

const TAGGABLE_STATUSES: Set<ArcStatus> = new Set(['active', 'advancing', 'threatened']);

// ── Types ───────────────────────────────────────────────────────────────────

interface SessionRecapFlowProps {
  campaignId: string;
  session: Session;
  onComplete: () => void;
}

interface ArcRowState {
  checked: boolean;
  note: string;
}

interface RecapSummary {
  keyMoments: number;
  arcsTagged: number;
  trackerShifts: number;
  daysAdvanced: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseKeyMoments(notes: string | undefined): string[] {
  if (!notes) return [];
  const marker = '## Key Moments';
  const idx = notes.indexOf(marker);
  if (idx === -1) return [];
  const section = notes.slice(idx + marker.length);
  const nextSection = section.indexOf('\n## ');
  const block = nextSection === -1 ? section : section.slice(0, nextSection);
  return block
    .split('\n')
    .map((l) => l.replace(/^[\s-]*/, '').trim())
    .filter(Boolean);
}

function buildKeyMomentsBlock(moments: string[]): string {
  const items = moments.filter(Boolean);
  if (items.length === 0) return '';
  return `\n\n## Key Moments\n${items.map((m) => `- ${m}`).join('\n')}`;
}

function replaceKeyMomentsInNotes(notes: string | undefined, moments: string[]): string {
  const base = notes ?? '';
  const marker = '## Key Moments';
  const idx = base.indexOf(marker);
  let before: string;
  let after: string;
  if (idx === -1) {
    before = base;
    after = '';
  } else {
    before = base.slice(0, idx).replace(/\n+$/, '');
    const rest = base.slice(idx + marker.length);
    const nextSection = rest.indexOf('\n## ');
    after = nextSection === -1 ? '' : rest.slice(nextSection);
  }
  return before + buildKeyMomentsBlock(moments) + after;
}

function getActiveThresholdLabel(tracker: WorldStateTracker): string | null {
  const sorted = [...tracker.thresholds].sort((a, b) => a.value - b.value);
  let label: string | null = null;
  for (const t of sorted) {
    if (tracker.value >= t.value) label = t.label;
  }
  return label;
}

// ── Component ───────────────────────────────────────────────────────────────

export function SessionRecapFlow({ campaignId, session, onComplete }: SessionRecapFlowProps) {
  const { data: campaign } = useCampaign(campaignId);
  const hasCalendar = !!campaign?.calendar;
  const totalSteps = hasCalendar ? 5 : 4;

  const [step, setStep] = useState(1);
  const [savedKeyMoments, setSavedKeyMoments] = useState<string[]>([]);
  const [summary, setSummary] = useState<RecapSummary>({
    keyMoments: 0,
    arcsTagged: 0,
    trackerShifts: 0,
    daysAdvanced: 0,
  });

  const effectiveStep = useMemo(() => {
    // If no calendar, skip step 4 — so effective step 4 becomes 5
    if (!hasCalendar && step >= 4) return step + 1;
    return step;
  }, [hasCalendar, step]);

  const displayTotalSteps = 5; // Always show "of 5" for consistency

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, totalSteps)), [totalSteps]);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  return (
    <div className={`${innerPanelClass} p-5 space-y-4`}>
      {renderStepIndicator()}
      {renderCurrentStep()}
    </div>
  );

  function renderStepIndicator() {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(38,82%,63%)]" />
          <span className={eyebrowClass}>Session Recap</span>
        </div>
        <span className={stepIndicatorClass}>
          Step {effectiveStep} of {displayTotalSteps}
        </span>
      </div>
    );
  }

  function renderCurrentStep() {
    switch (effectiveStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  }

  // ── Step 1: Key Moments ─────────────────────────────────────────────────

  function renderStep1() {
    return (
      <KeyMomentsStep
        session={session}
        campaignId={campaignId}
        onSaved={(count, moments) => {
          setSavedKeyMoments(moments);
          setSummary((s) => ({ ...s, keyMoments: count }));
          goNext();
        }}
        onSkip={goNext}
      />
    );
  }

  // ── Step 2: Arc Tags ────────────────────────────────────────────────────

  function renderStep2() {
    return (
      <ArcTagsStep
        campaignId={campaignId}
        session={session}
        onSaved={(count) => {
          setSummary((s) => ({ ...s, arcsTagged: count }));
          goNext();
        }}
        onSkip={goNext}
        onBack={goBack}
      />
    );
  }

  // ── Step 3: Tracker Shifts ──────────────────────────────────────────────

  function renderStep3() {
    return (
      <TrackerShiftsStep
        campaignId={campaignId}
        sessionNumber={session.sessionNumber}
        onSaved={(count) => {
          setSummary((s) => ({ ...s, trackerShifts: count }));
          goNext();
        }}
        onSkip={goNext}
        onBack={goBack}
      />
    );
  }

  // ── Step 4: Calendar Advance ────────────────────────────────────────────

  function renderStep4() {
    return (
      <CalendarAdvanceStep
        campaignId={campaignId}
        onSaved={(days) => {
          setSummary((s) => ({ ...s, daysAdvanced: days }));
          goNext();
        }}
        onSkip={goNext}
        onBack={goBack}
      />
    );
  }

  // ── Step 5: Complete ────────────────────────────────────────────────────

  function renderStep5() {
    return (
      <CompleteStep
        campaignId={campaignId}
        session={session}
        summary={summary}
        savedKeyMoments={savedKeyMoments}
        onComplete={onComplete}
        onBack={goBack}
      />
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Step sub-components
// ══════════════════════════════════════════════════════════════════════════════

// ── Step 1: Key Moments ─────────────────────────────────────────────────────

function KeyMomentsStep({
  session,
  campaignId,
  onSaved,
  onSkip,
}: {
  session: Session;
  campaignId: string;
  onSaved: (count: number, moments: string[]) => void;
  onSkip: () => void;
}) {
  const existing = useMemo(() => parseKeyMoments(session.notes), [session.notes]);
  const [moments, setMoments] = useState<string[]>(() =>
    existing.length > 0 ? existing : [''],
  );
  const [saving, setSaving] = useState(false);
  const updateSession = useUpdateSession();

  const setMoment = useCallback((idx: number, value: string) => {
    setMoments((prev) => prev.map((m, i) => (i === idx ? value : m)));
  }, []);

  const addMoment = useCallback(() => {
    setMoments((prev) => (prev.length < 5 ? [...prev, ''] : prev));
  }, []);

  const removeMoment = useCallback((idx: number) => {
    setMoments((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }, []);

  const handleSave = useCallback(async () => {
    const filled = moments.filter(Boolean);
    if (filled.length === 0) {
      onSkip();
      return;
    }
    setSaving(true);
    try {
      const updatedNotes = replaceKeyMomentsInNotes(session.notes, filled);
      await updateSession.mutateAsync({
        campaignId,
        id: session._id,
        data: {
          notes: updatedNotes,
          statistics: { keyMoments: moments.filter((m) => m.trim()) },
        },
      });
      toast.success(`Saved ${filled.length} key moment${filled.length > 1 ? 's' : ''}`);
      onSaved(filled.length, filled);
    } catch {
      toast.error('Failed to save key moments');
    } finally {
      setSaving(false);
    }
  }, [moments, session, campaignId, updateSession, onSaved, onSkip]);

  return (
    <div className="space-y-3">
      {renderHeader()}
      {renderInputs()}
      {renderActions()}
    </div>
  );

  function renderHeader() {
    return (
      <h3 className="font-['IM_Fell_English'] text-[18px] text-[hsl(35,24%,92%)]">
        What Happened?
      </h3>
    );
  }

  function renderInputs() {
    return (
      <div className="space-y-2">
        {moments.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={m}
              onChange={(e) => setMoment(i, e.target.value)}
              placeholder={`Key moment ${i + 1}...`}
              className={`${inputClass} flex-1`}
            />
            {moments.length > 1 && (
              <button type="button" onClick={() => removeMoment(i)} className={subtlePillClass}>
                <Minus className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {moments.length < 5 && (
          <button type="button" onClick={addMoment} className={`${subtlePillClass} mt-1`}>
            <Plus className="h-3 w-3" /> Add another
          </button>
        )}
      </div>
    );
  }

  function renderActions() {
    return (
      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onSkip} className={subtlePillClass}>Skip</button>
        <button type="button" onClick={handleSave} disabled={saving} className={goldPillClass}>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Next <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    );
  }
}

// ── Step 2: Arc Tags ────────────────────────────────────────────────────────

function ArcTagsStep({
  campaignId,
  session,
  onSaved,
  onSkip,
  onBack,
}: {
  campaignId: string;
  session: Session;
  onSaved: (count: number) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const { data: arcs, isLoading } = useArcs(campaignId);
  const addDevelopment = useAddArcDevelopment();
  const taggableArcs = useMemo(
    () => (arcs ?? []).filter((a: CampaignArc) => TAGGABLE_STATUSES.has(a.status)),
    [arcs],
  );

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

  const checkedCount = Object.values(rowStates).filter((v) => v.checked).length;

  const handleSave = useCallback(async () => {
    const entries = Object.entries(rowStates).filter(([, v]) => v.checked);
    if (entries.length === 0) {
      onSkip();
      return;
    }
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
      toast.success(`Tagged ${entries.length} arc${entries.length > 1 ? 's' : ''}`);
      onSaved(entries.length);
    } catch {
      toast.error('Failed to save arc developments');
    } finally {
      setSaving(false);
    }
  }, [rowStates, addDevelopment, campaignId, session, onSaved, onSkip]);

  return (
    <div className="space-y-3">
      {renderHeader()}
      {renderBody()}
      {renderActions()}
    </div>
  );

  function renderHeader() {
    return (
      <h3 className="font-['IM_Fell_English'] text-[18px] text-[hsl(35,24%,92%)]">
        Which Arcs Advanced?
      </h3>
    );
  }

  function renderBody() {
    if (isLoading) {
      return <p className="text-[11px] text-[hsl(30,12%,58%)]">Loading arcs...</p>;
    }
    if (taggableArcs.length === 0) {
      return <p className="text-[11px] text-[hsl(30,12%,58%)]">No active arcs to tag</p>;
    }
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

  function renderActions() {
    return (
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className={subtlePillClass}>
          <ChevronLeft className="h-3 w-3" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onSkip} className={subtlePillClass}>Skip</button>
          <button
            type="button"
            onClick={handleSave}
            disabled={checkedCount === 0 || saving}
            className={goldPillClass}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Next <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }
}

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
        <span className={`${badgeBase} border ${ARC_STATUS_STYLES[arc.status] ?? ARC_STATUS_STYLES.dormant}`}>
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
        placeholder="What happened with this arc..."
        className={`${inputClass} min-w-0 flex-1`}
      />
    );
  }
}

// ── Step 3: Tracker Shifts ──────────────────────────────────────────────────

function TrackerShiftsStep({
  campaignId,
  sessionNumber,
  onSaved,
  onSkip,
  onBack,
}: {
  campaignId: string;
  sessionNumber: number;
  onSaved: (count: number) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const { data: trackers, isLoading } = useTrackers(campaignId);
  const adjustTracker = useAdjustTracker();
  const [shifts, setShifts] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const adjust = useCallback((trackerId: string, delta: number) => {
    setShifts((prev) => {
      const current = prev[trackerId] ?? 0;
      return { ...prev, [trackerId]: current + delta };
    });
  }, []);

  const shiftCount = Object.values(shifts).filter((d) => d !== 0).length;

  const handleSave = useCallback(async () => {
    const entries = Object.entries(shifts).filter(([, d]) => d !== 0);
    if (entries.length === 0) {
      onSkip();
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        entries.map(([trackerId, delta]) =>
          adjustTracker.mutateAsync({ campaignId, trackerId, delta, sessionNumber, reason: `Session ${sessionNumber} recap` }),
        ),
      );
      toast.success(`Adjusted ${entries.length} tracker${entries.length > 1 ? 's' : ''}`);
      onSaved(entries.length);
    } catch {
      toast.error('Failed to save tracker adjustments');
    } finally {
      setSaving(false);
    }
  }, [shifts, adjustTracker, campaignId, onSaved, onSkip]);

  return (
    <div className="space-y-3">
      {renderHeader()}
      {renderBody()}
      {renderActions()}
    </div>
  );

  function renderHeader() {
    return (
      <h3 className="font-['IM_Fell_English'] text-[18px] text-[hsl(35,24%,92%)]">
        World State Changes
      </h3>
    );
  }

  function renderBody() {
    if (isLoading) {
      return <p className="text-[11px] text-[hsl(30,12%,58%)]">Loading trackers...</p>;
    }
    if (!trackers || trackers.length === 0) {
      return <p className="text-[11px] text-[hsl(30,12%,58%)]">No trackers configured</p>;
    }
    return (
      <div className="space-y-2">
        {trackers.map((tracker: WorldStateTracker) => (
          <TrackerRow
            key={tracker._id}
            tracker={tracker}
            pendingDelta={shifts[tracker._id] ?? 0}
            onAdjust={(delta) => adjust(tracker._id, delta)}
          />
        ))}
      </div>
    );
  }

  function renderActions() {
    return (
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className={subtlePillClass}>
          <ChevronLeft className="h-3 w-3" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onSkip} className={subtlePillClass}>Skip</button>
          <button
            type="button"
            onClick={handleSave}
            disabled={shiftCount === 0 || saving}
            className={goldPillClass}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Next <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }
}

function TrackerRow({
  tracker,
  pendingDelta,
  onAdjust,
}: {
  tracker: WorldStateTracker;
  pendingDelta: number;
  onAdjust: (delta: number) => void;
}) {
  const effectiveValue = tracker.value + pendingDelta;
  const range = tracker.max - tracker.min;
  const pct = range > 0 ? ((effectiveValue - tracker.min) / range) * 100 : 0;
  const isNearThreshold = pct > 60;
  const activeLabel = getActiveThresholdLabel(tracker);

  return (
    <div
      className={`rounded-lg border p-3 ${
        isNearThreshold
          ? 'border-[hsla(38,60%,50%,0.35)] bg-[hsla(38,60%,52%,0.06)]'
          : 'border-[hsla(32,26%,26%,0.48)] bg-[hsla(24,16%,10%,0.5)]'
      }`}
    >
      {renderTrackerHeader()}
      {renderTrackerControls()}
    </div>
  );

  function renderTrackerHeader() {
    return (
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[hsl(35,24%,92%)]">{tracker.name}</span>
          {isNearThreshold && (
            <AlertTriangle className="h-3 w-3 text-[hsl(38,82%,63%)]" />
          )}
        </div>
        {activeLabel && (
          <span className="text-[10px] text-[hsl(30,14%,54%)]">{activeLabel}</span>
        )}
      </div>
    );
  }

  function renderTrackerControls() {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onAdjust(-1)}
          disabled={effectiveValue <= tracker.min}
          className={subtlePillClass}
        >
          <Minus className="h-3 w-3" />
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-medium text-[hsl(35,24%,92%)] tabular-nums w-8 text-center">
            {effectiveValue}
          </span>
          {pendingDelta !== 0 && (
            <span
              className={`text-[11px] font-medium ${
                pendingDelta > 0 ? 'text-[hsl(150,62%,70%)]' : 'text-[hsl(0,72%,72%)]'
              }`}
            >
              ({pendingDelta > 0 ? '+' : ''}{pendingDelta})
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onAdjust(1)}
          disabled={effectiveValue >= tracker.max}
          className={subtlePillClass}
        >
          <Plus className="h-3 w-3" />
        </button>
        <span className="text-[10px] text-[hsl(30,12%,58%)] ml-auto">
          {tracker.min}–{tracker.max}
        </span>
      </div>
    );
  }
}

// ── Step 4: Calendar Advance ────────────────────────────────────────────────

function CalendarAdvanceStep({
  campaignId,
  onSaved,
  onSkip,
  onBack,
}: {
  campaignId: string;
  onSaved: (days: number) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [days, setDays] = useState(1);
  const [saving, setSaving] = useState(false);
  const advanceDate = useAdvanceDate();

  const handleAdvance = useCallback(async () => {
    if (days <= 0) {
      onSkip();
      return;
    }
    setSaving(true);
    try {
      await advanceDate.mutateAsync({ campaignId, days });
      toast.success(`Advanced calendar by ${days} day${days > 1 ? 's' : ''}`);
      onSaved(days);
    } catch {
      toast.error('Failed to advance calendar');
    } finally {
      setSaving(false);
    }
  }, [days, advanceDate, campaignId, onSaved, onSkip]);

  return (
    <div className="space-y-3">
      {renderHeader()}
      {renderInput()}
      {renderActions()}
    </div>
  );

  function renderHeader() {
    return (
      <h3 className="font-['IM_Fell_English'] text-[18px] text-[hsl(35,24%,92%)]">
        How Much Time Passed?
      </h3>
    );
  }

  function renderInput() {
    return (
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={0}
          value={days}
          onChange={(e) => setDays(Math.max(0, parseInt(e.target.value) || 0))}
          className={`${inputClass} w-24 text-center`}
        />
        <span className="text-[12px] text-[hsl(30,14%,66%)]">days</span>
      </div>
    );
  }

  function renderActions() {
    return (
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className={subtlePillClass}>
          <ChevronLeft className="h-3 w-3" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onSkip} className={subtlePillClass}>Skip</button>
          <button
            type="button"
            onClick={handleAdvance}
            disabled={saving}
            className={goldPillClass}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Next <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }
}

// ── Step 5: Complete ────────────────────────────────────────────────────────

function CompleteStep({
  campaignId,
  session,
  summary,
  savedKeyMoments,
  onComplete,
  onBack,
}: {
  campaignId: string;
  session: Session;
  summary: RecapSummary;
  savedKeyMoments: string[];
  onComplete: () => void;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const { endSession } = useCampaignStage(campaignId);
  const [saving, setSaving] = useState(false);
  const alreadyCompleted = session.status === 'completed';

  const handleComplete = useCallback(async () => {
    if (alreadyCompleted) {
      onComplete();
      return;
    }
    setSaving(true);
    try {
      // Use the lifecycle endpoint so completedAt, durationMinutes, and
      // statistics are set by the server (not a plain status PATCH).
      // Pass key moments from local recap state (not session prop which may be stale).
      const keyMoments = savedKeyMoments.length > 0
        ? savedKeyMoments
        : (session.statistics?.keyMoments ?? []);
      await endSession.mutateAsync(keyMoments.length > 0 ? keyMoments : undefined);
      // Invalidate session queries so the UI picks up completedAt + recalculated statistics
      queryClient.invalidateQueries({ queryKey: ['sessions', campaignId] });
      toast.success('Session marked as completed');
      onComplete();
    } catch {
      toast.error('Failed to complete session');
    } finally {
      setSaving(false);
    }
  }, [alreadyCompleted, endSession, savedKeyMoments, session.statistics?.keyMoments, queryClient, campaignId, onComplete]);

  return (
    <div className="space-y-3">
      {renderHeader()}
      {renderSummary()}
      {renderActions()}
    </div>
  );

  function renderHeader() {
    return (
      <h3 className="font-['IM_Fell_English'] text-[18px] text-[hsl(35,24%,92%)]">
        Session Wrap Complete
      </h3>
    );
  }

  function renderSummary() {
    const lines = buildSummaryLines();
    return (
      <div className="space-y-1">
        {alreadyCompleted && (
          <p className="text-[11px] text-[hsl(150,62%,70%)] mb-2">
            Session already completed
          </p>
        )}
        {lines.map((line, i) => (
          <p key={i} className="text-[12px] text-[hsl(30,14%,66%)]">{line}</p>
        ))}
        {lines.length === 0 && (
          <p className="text-[12px] text-[hsl(30,14%,66%)]">No changes recorded</p>
        )}
      </div>
    );
  }

  function buildSummaryLines(): string[] {
    const lines: string[] = [];
    if (summary.keyMoments > 0) {
      lines.push(`${summary.keyMoments} key moment${summary.keyMoments > 1 ? 's' : ''} recorded`);
    }
    if (summary.arcsTagged > 0) {
      lines.push(`${summary.arcsTagged} arc${summary.arcsTagged > 1 ? 's' : ''} tagged`);
    }
    if (summary.trackerShifts > 0) {
      lines.push(`${summary.trackerShifts} tracker${summary.trackerShifts > 1 ? 's' : ''} adjusted`);
    }
    if (summary.daysAdvanced > 0) {
      lines.push(`${summary.daysAdvanced} day${summary.daysAdvanced > 1 ? 's' : ''} advanced`);
    }
    return lines;
  }

  function renderActions() {
    return (
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className={subtlePillClass}>
          <ChevronLeft className="h-3 w-3" /> Back
        </button>
        <button
          type="button"
          onClick={handleComplete}
          disabled={saving}
          className={goldPillClass}
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {alreadyCompleted ? 'Done' : 'Mark Session Complete'}
        </button>
      </div>
    );
  }
}
