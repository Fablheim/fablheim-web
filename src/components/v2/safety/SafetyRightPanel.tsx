import {
  BadgeHelp,
  DoorOpen,
  HeartHandshake,
  LayoutDashboard,
  MessagesSquare,
  ShieldAlert,
} from 'lucide-react';
import { useSafetyContext, type SafetyToolId } from './SafetyContext';

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOL_DEFS: Array<{
  id: SafetyToolId;
  label: string;
  blurb: string;
  icon: typeof ShieldAlert;
}> = [
  {
    id: 'overview',
    label: 'Overview',
    blurb: 'Summary of all safety tools and current status.',
    icon: LayoutDashboard,
  },
  {
    id: 'lines-veils',
    label: 'Lines & Veils',
    blurb: 'Set hard boundaries and fade-to-black topics.',
    icon: ShieldAlert,
  },
  {
    id: 'x-card',
    label: 'X-Card',
    blurb: 'Let anyone signal discomfort and pause the scene.',
    icon: BadgeHelp,
  },
  {
    id: 'open-door',
    label: 'Open Door',
    blurb: 'Support stepping away or pausing without pressure.',
    icon: DoorOpen,
  },
  {
    id: 'check-ins',
    label: 'Check-Ins',
    blurb: 'Keep gentle reminders ready for moments of care.',
    icon: MessagesSquare,
  },
  {
    id: 'player-notes',
    label: 'Player Notes',
    blurb: 'Private comfort notes to help facilitate with care.',
    icon: HeartHandshake,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SafetyRightPanel() {
  const { activeTool, setActiveTool, reviewedAt, draft } = useSafetyContext();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {renderHeader()}
      {renderToolList()}
    </div>
  );

  function renderHeader() {
    const linesCount = draft.lines.length + draft.veils.length;
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(145,18%,62%)]">
          Table Safety
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-xs text-[hsl(38,24%,82%)]">
            {linesCount > 0 ? `${linesCount} bounds recorded` : 'No bounds set yet'}
          </p>
        </div>
        {reviewedAt && (
          <p className="mt-1.5 text-[10px] text-[hsl(30,12%,48%)]">
            Reviewed {formatReviewedDate(reviewedAt)}
          </p>
        )}
      </div>
    );
  }

  function renderToolList() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-1">
          {TOOL_DEFS.map((tool) => renderToolButton(tool))}
        </div>
      </div>
    );
  }

  function renderToolButton(tool: (typeof TOOL_DEFS)[number]) {
    const isSelected = activeTool === tool.id;
    return (
      <button
        key={tool.id}
        type="button"
        onClick={() => setActiveTool(tool.id)}
        className={`block w-full rounded-[12px] border px-2.5 py-2.5 text-left transition ${
          isSelected
            ? 'border-[hsla(42,72%,52%,0.36)] bg-[hsla(42,72%,42%,0.14)]'
            : 'border-[hsla(32,26%,26%,0.35)] bg-[hsla(26,16%,12%,0.6)] hover:border-[hsla(145,18%,34%,0.42)]'
        }`}
      >
        {renderToolButtonInner(tool, isSelected)}
      </button>
    );
  }

  function renderToolButtonInner(tool: (typeof TOOL_DEFS)[number], isSelected: boolean) {
    return (
      <div className="flex items-start gap-2">
        <span
          className={`mt-0.5 shrink-0 rounded-xl border p-1.5 ${
            isSelected
              ? 'border-[hsla(145,42%,58%,0.28)] bg-[hsla(145,42%,58%,0.12)] text-[hsl(145,48%,78%)]'
              : 'border-[hsla(32,24%,28%,0.74)] bg-[hsla(24,18%,8%,0.72)] text-[hsl(145,18%,62%)]'
          }`}
        >
          <tool.icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-[hsl(35,24%,90%)]">{tool.label}</p>
          <p className="mt-0.5 text-[10px] text-[hsl(30,12%,52%)]">{tool.blurb}</p>
        </div>
      </div>
    );
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function formatReviewedDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'recently';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
