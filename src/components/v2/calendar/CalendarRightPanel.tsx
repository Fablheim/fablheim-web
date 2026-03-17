import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAdvanceDate } from '@/hooks/useCampaigns';
import { shellPanelClass } from '@/lib/panel-styles';
import type { CalendarEvent, CampaignCalendar } from '@/types/campaign';
import {
  diffInDays,
  getEventsForDate,
  stepMonth,
  useCalendarPrepContext,
} from './CalendarPrepContext';

const EVENT_TYPE_LABELS: Record<string, string> = {
  session: 'Session',
  travel: 'Travel',
  downtime: 'Downtime',
  deadline: 'Deadline',
  faction: 'Faction Event',
  festival: 'Festival',
  reminder: 'Reminder',
};

const EVENT_STATUS_LABELS: Record<string, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
};

export function CalendarRightPanel({ campaignId }: { campaignId: string }) {
  const {
    calendar,
    visibleMonth,
    visibleYear,
    visibleDate,
    selectedEventId,
    currentMonthEvents,
    nextMajorEvent,
    setSelectedDate,
    setSelectedEventId,
    setViewCursor,
  } = useCalendarPrepContext();

  const advanceDate = useAdvanceDate();

  if (!calendar) return null;

  const displayDate = visibleDate ?? calendar.currentDate;
  const moonPhase = deriveMoonPhase(displayDate.day);
  const seasonLabel = deriveSeason(displayDate.month, calendar.months.length);
  const daysUntilNext = nextMajorEvent
    ? diffInDays(calendar, calendar.currentDate, {
        year: nextMajorEvent.year,
        month: nextMajorEvent.month,
        day: nextMajorEvent.day,
      })
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {renderChronicleHeader(calendar)}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {renderWorldState()}
        {renderMonthGrid(calendar)}
        {renderThisMonth(calendar)}
      </div>
    </div>
  );

  function renderWorldState() {
    return (
      <div className="mb-3 rounded-[14px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(22,18%,10%,0.72)] px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">World State</p>
        <div className="mt-2 space-y-1.5">
          <WorldStateRow label="Moon" value={moonPhase} />
          <WorldStateRow label="Season" value={seasonLabel} />
          <WorldStateRow
            label="Next Major"
            value={daysUntilNext != null && daysUntilNext >= 0 ? `${daysUntilNext} days` : 'None'}
          />
        </div>
        <div className="mt-3 border-t border-[hsla(32,24%,24%,0.36)] pt-2.5">
          <button
            type="button"
            onClick={() =>
              advanceDate.mutate(
                { campaignId, days: 1 },
                { onError: () => toast.error('Failed to advance the day') },
              )
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[hsl(212,34%,74%)] transition hover:bg-[hsla(220,18%,16%,0.9)]"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Advance Day
          </button>
        </div>
      </div>
    );
  }

  function renderChronicleHeader(cal: CampaignCalendar) {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Chronicle</p>
            <h3 className="mt-0.5 font-['IM_Fell_English'] text-[22px] leading-none text-[hsl(38,40%,90%)]">
              {cal.months[visibleMonth]?.name ?? `Month ${visibleMonth + 1}`}
              <span className="ml-2 font-['Cinzel'] text-[13px] text-[hsl(30,12%,52%)]">{visibleYear}</span>
            </h3>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setViewCursor(stepMonth(cal, visibleYear, visibleMonth, -1))}
              className={iconButtonClass()}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewCursor(stepMonth(cal, visibleYear, visibleMonth, 1))}
              className={iconButtonClass()}
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderMonthGrid(cal: CampaignCalendar) {
    return (
      <MonthGrid
        calendar={cal}
        visibleYear={visibleYear}
        visibleMonth={visibleMonth}
        selectedDate={visibleDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setSelectedEventId(null);
          setViewCursor({ year: date.year, month: date.month });
        }}
      />
    );
  }

  function renderThisMonth(cal: CampaignCalendar) {
    return (
      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">This Month</p>
        <div className="mt-2 space-y-1.5">
          {currentMonthEvents.length ? (
            currentMonthEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => {
                  setSelectedDate({ year: event.year, month: event.month, day: event.day });
                  setSelectedEventId(event.id);
                  // Navigate the grid to this event's month (may differ from current view)
                  setViewCursor({ year: event.year, month: event.month });
                }}
                className={`w-full rounded-[14px] border px-3 py-2.5 text-left transition ${
                  selectedEventId === event.id
                    ? 'border-[hsla(212,42%,58%,0.36)] bg-[hsla(212,42%,58%,0.1)]'
                    : 'border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] hover:border-[hsla(212,24%,34%,0.42)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-[Cinzel] text-xs text-[hsl(38,34%,86%)]">{event.name}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-[hsl(212,24%,66%)]">
                      {EVENT_TYPE_LABELS[event.eventType ?? 'reminder']} · {event.day} {cal.months[event.month]?.name}
                    </p>
                  </div>
                  <EventBadge event={event} />
                </div>
              </button>
            ))
          ) : (
            <p className="rounded-[14px] border border-[hsla(32,24%,24%,0.36)] bg-[hsla(22,18%,10%,0.5)] px-3 py-2.5 text-xs text-[hsl(30,14%,52%)]">
              No events this month.
            </p>
          )}
        </div>
      </div>
    );
  }
}

// ── MonthGrid ─────────────────────────────────────────────────

function MonthGrid({
  calendar,
  visibleYear,
  visibleMonth,
  selectedDate,
  onSelectDate,
}: {
  calendar: CampaignCalendar;
  visibleYear: number;
  visibleMonth: number;
  selectedDate: { year: number; month: number; day: number } | null;
  onSelectDate: (date: { year: number; month: number; day: number }) => void;
}) {
  const monthData = calendar.months[visibleMonth];

  // No weekday offset — day 1 always starts at column 0.
  // Each month is self-contained; weekday continuity across months is not enforced
  // because custom calendars don't have a reliable epoch weekday reference.
  const dayCells = Array.from({ length: monthData?.days ?? 0 }, (_, index) => {
    const dayNumber = index + 1;
    const isCurrent =
      calendar.currentDate.year === visibleYear &&
      calendar.currentDate.month === visibleMonth &&
      calendar.currentDate.day === dayNumber;
    const isSelected =
      selectedDate?.year === visibleYear &&
      selectedDate.month === visibleMonth &&
      selectedDate.day === dayNumber;
    const events = getEventsForDate(calendar, visibleYear, visibleMonth, dayNumber);

    return (
      <button
        key={dayNumber}
        type="button"
        onClick={() => onSelectDate({ year: visibleYear, month: visibleMonth, day: dayNumber })}
        className={`relative min-h-[44px] rounded-[10px] border p-1.5 text-left transition ${
          isSelected
            ? 'border-[hsla(42,72%,52%,0.34)] bg-[hsla(42,72%,42%,0.14)]'
            : isCurrent
              ? 'border-[hsla(212,42%,58%,0.36)] bg-[hsla(212,42%,58%,0.1)]'
              : 'border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] hover:border-[hsla(212,24%,34%,0.42)]'
        }`}
      >
        <div className="flex items-start justify-between gap-1">
          <span className="font-[Cinzel] text-[11px] text-[hsl(38,34%,86%)]">{dayNumber}</span>
          {events.length > 0 && (
            <span className="rounded-full bg-[hsl(42,72%,52%)] px-1.5 py-0.5 text-[9px] leading-none text-[hsl(20,25%,10%)]">
              {events.length}
            </span>
          )}
        </div>
        {events.slice(0, 1).map((event) => (
          <div key={event.id} className="mt-1 truncate text-[9px] leading-none text-[hsl(30,14%,62%)]">
            {event.name}
          </div>
        ))}
      </button>
    );
  });

  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {calendar.weekdays.slice(0, 7).map((weekday) => (
          <div key={weekday} className="px-1 text-center text-[9px] uppercase tracking-[0.2em] text-[hsl(212,24%,66%)]">
            {weekday.slice(0, 2)}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {dayCells}
      </div>
    </div>
  );
}

// ── EventBadge ────────────────────────────────────────────────

function EventBadge({ event }: { event: CalendarEvent }) {
  const tone =
    event.status === 'completed'
      ? 'border-[hsla(145,42%,38%,0.34)] bg-[hsla(145,42%,12%,0.54)] text-[hsl(145,62%,78%)]'
      : event.eventType === 'deadline'
        ? 'border-[hsla(2,52%,42%,0.34)] bg-[hsla(2,42%,12%,0.54)] text-[hsl(2,62%,78%)]'
        : 'border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] text-[hsl(212,34%,74%)]';
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] leading-none ${tone}`}>
      {EVENT_STATUS_LABELS[event.status ?? 'upcoming']}
    </span>
  );
}

function WorldStateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] uppercase tracking-[0.18em] text-[hsl(212,24%,56%)]">{label}</span>
      <span className="font-[Cinzel] text-[11px] text-[hsl(38,34%,82%)]">{value}</span>
    </div>
  );
}

function iconButtonClass() {
  return 'inline-flex items-center justify-center rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] p-1.5 text-[hsl(212,34%,74%)] transition hover:bg-[hsla(220,18%,16%,0.9)]';
}

function deriveSeason(monthIndex: number, totalMonths: number) {
  const quarter = Math.floor((monthIndex / Math.max(totalMonths, 1)) * 4);
  return ['Deep Winter', 'Springrise', 'High Summer', 'Harvestfall'][quarter] ?? 'Turning Season';
}

function deriveMoonPhase(day: number) {
  const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  return phases[(day - 1) % phases.length] ?? 'New Moon';
}

// re-export so RightPanelV2 doesn't need to know about the panel class
export { shellPanelClass };
