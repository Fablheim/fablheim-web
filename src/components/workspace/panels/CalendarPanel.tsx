import { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  Sun,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import {
  useCampaign,
  useInitCalendar,
  useAdvanceDate,
  useAddCalendarEvent,
  useRemoveCalendarEvent,
} from '@/hooks/useCampaigns';
import type { CalendarPresetType, CalendarEvent, CampaignCalendar } from '@/types/campaign';

interface CalendarPanelProps {
  campaignId: string;
}

const INPUT_CLS =
  'w-full rounded-sm border border-border bg-[hsl(24,15%,10%)] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40 transition-colors';
const LABEL_CLS = 'block text-xs font-medium text-muted-foreground mb-1';

const PRESET_LABELS: Record<CalendarPresetType, string> = {
  forgotten_realms: 'Forgotten Realms (Harptos)',
  greyhawk: 'Greyhawk',
  custom: 'Custom (12 × 30)',
};

export function CalendarPanel({ campaignId }: CalendarPanelProps) {
  const { data: campaign } = useCampaign(campaignId);
  const calendar = campaign?.calendar ?? null;

  if (!calendar) {
    return renderSetup();
  }

  return renderCalendar(calendar);

  /* ── Setup (no calendar yet) ────────────────────────────── */

  function renderSetup() {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <CalendarDays className="h-12 w-12 text-muted-foreground/40" />
        <h3 className="font-['IM_Fell_English'] text-lg text-foreground">
          In-World Calendar
        </h3>
        <p className="max-w-sm text-xs text-muted-foreground">
          Track the passage of time in your campaign world. Choose a calendar
          preset to get started.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {(Object.keys(PRESET_LABELS) as CalendarPresetType[]).map((preset) => (
            <PresetButton key={preset} campaignId={campaignId} preset={preset} />
          ))}
        </div>
      </div>
    );
  }

  /* ── Main calendar view ─────────────────────────────────── */

  function renderCalendar(cal: CampaignCalendar) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        {renderHeader(cal)}
        <div className="flex-1 space-y-4 p-4">
          {renderCurrentDate(cal)}
          {renderAdvanceControls(cal)}
          {renderMonthGrid(cal)}
          {renderEvents(cal)}
          {renderAddEvent(cal)}
        </div>
      </div>
    );
  }

  function renderHeader(cal: CampaignCalendar) {
    return (
      <div className="flex items-center justify-between border-b border-[hsla(38,30%,25%,0.2)] px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary/70" />
          <h2 className="font-['IM_Fell_English'] text-base font-semibold text-foreground">
            Calendar
          </h2>
          <span className="text-[10px] text-muted-foreground/60">
            {PRESET_LABELS[cal.preset]}
          </span>
        </div>
      </div>
    );
  }

  function renderCurrentDate(cal: CampaignCalendar) {
    const { year, month, day } = cal.currentDate;
    const monthName = cal.months[month]?.name ?? `Month ${month + 1}`;
    const weekdayIndex = getDayOfWeek(cal, year, month, day);
    const weekdayName = cal.weekdays[weekdayIndex] ?? '';

    return (
      <div className="rounded border border-primary/20 bg-primary/5 p-4 text-center">
        <p className="text-[10px] uppercase tracking-wider text-primary/60">
          Current Date
        </p>
        <p className="mt-1 font-['IM_Fell_English'] text-xl text-foreground">
          {weekdayName && <span className="text-muted-foreground">{weekdayName}, </span>}
          {day} {monthName}, Year {year}
        </p>
      </div>
    );
  }

  function renderAdvanceControls(_cal: CampaignCalendar) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <AdvanceButton campaignId={campaignId} days={-1} label="−1 Day" />
        <AdvanceButton campaignId={campaignId} days={1} label="+1 Day" />
        <AdvanceButton campaignId={campaignId} days={7} label="+1 Week" />
        <AdvanceButton campaignId={campaignId} days={30} label="+30 Days" />
      </div>
    );
  }

  function renderMonthGrid(cal: CampaignCalendar) {
    const { month, day } = cal.currentDate;

    return (
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {cal.months[month]?.name} — {cal.months[month]?.days} days
        </p>
        <div
          className="grid gap-px"
          style={{ gridTemplateColumns: `repeat(${Math.min(cal.weekdays.length, 10)}, 1fr)` }}
        >
          {cal.weekdays.map((wd) => (
            <div
              key={wd}
              className="bg-[hsl(24,15%,12%)] px-1 py-0.5 text-center text-[9px] text-muted-foreground/60"
            >
              {wd.slice(0, 3)}
            </div>
          ))}
          {renderDayCells(cal, month, day)}
        </div>
      </div>
    );
  }

  function renderDayCells(cal: CampaignCalendar, currentMonth: number, currentDay: number) {
    const monthData = cal.months[currentMonth];
    if (!monthData) return null;

    const firstDayWeekday = getDayOfWeek(cal, cal.currentDate.year, currentMonth, 1);
    const cells = [];

    // Empty cells before first day
    for (let i = 0; i < firstDayWeekday; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }

    for (let d = 1; d <= monthData.days; d++) {
      const isToday = d === currentDay;
      const dayEvents = cal.events.filter(
        (e) =>
          e.month === currentMonth &&
          e.day === d &&
          (e.year === cal.currentDate.year || e.recurring),
      );

      cells.push(
        <div
          key={d}
          className={`relative px-1 py-0.5 text-center text-[10px] transition-colors ${
            isToday
              ? 'bg-primary/20 font-bold text-primary'
              : 'text-muted-foreground hover:bg-[hsl(24,15%,14%)]'
          }`}
        >
          {d}
          {dayEvents.length > 0 && (
            <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary/70" />
          )}
        </div>,
      );
    }

    return cells;
  }

  function renderEvents(cal: CampaignCalendar) {
    const { year, month, day } = cal.currentDate;
    const todayEvents = cal.events.filter(
      (e) =>
        e.month === month &&
        e.day === day &&
        (e.year === year || e.recurring),
    );
    const upcomingEvents = cal.events
      .filter((e) => {
        if (e.recurring) return true;
        if (e.year > year) return true;
        if (e.year === year && e.month > month) return true;
        if (e.year === year && e.month === month && e.day > day) return true;
        return false;
      })
      .slice(0, 5);

    return (
      <div className="space-y-3">
        {todayEvents.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-primary/80">
              <Sun className="mr-1 inline h-3 w-3" />
              Today
            </p>
            {todayEvents.map((e) => (
              <EventCard key={e.id} event={e} cal={cal} campaignId={campaignId} />
            ))}
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Upcoming Events
            </p>
            {upcomingEvents.map((e) => (
              <EventCard key={e.id} event={e} cal={cal} campaignId={campaignId} />
            ))}
          </div>
        )}

        {cal.events.length === 0 && (
          <p className="text-center text-xs italic text-muted-foreground/60">
            No events scheduled
          </p>
        )}
      </div>
    );
  }

  function renderAddEvent(cal: CampaignCalendar) {
    return <AddEventForm campaignId={campaignId} cal={cal} />;
  }
}

/* ── Sub-components ─────────────────────────────────────────── */

function PresetButton({
  campaignId,
  preset,
}: {
  campaignId: string;
  preset: CalendarPresetType;
}) {
  const initCalendar = useInitCalendar();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={initCalendar.isPending}
      onClick={() =>
        initCalendar.mutate(
          { campaignId, preset },
          {
            onSuccess: () => toast.success(`Calendar initialized (${PRESET_LABELS[preset]})`),
            onError: () => toast.error('Failed to initialize calendar'),
          },
        )
      }
    >
      {initCalendar.isPending ? (
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
      ) : null}
      {PRESET_LABELS[preset]}
    </Button>
  );
}

function AdvanceButton({
  campaignId,
  days,
  label,
}: {
  campaignId: string;
  days: number;
  label: string;
}) {
  const advanceDate = useAdvanceDate();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={advanceDate.isPending}
      onClick={() =>
        advanceDate.mutate(
          { campaignId, days },
          { onError: () => toast.error('Failed to advance date') },
        )
      }
    >
      {label}
    </Button>
  );
}

function EventCard({
  event,
  cal,
  campaignId,
}: {
  event: CalendarEvent;
  cal: CampaignCalendar;
  campaignId: string;
}) {
  const removeEvent = useRemoveCalendarEvent();
  const monthName = cal.months[event.month]?.name ?? `Month ${event.month + 1}`;

  return (
    <div className="mb-1 flex items-start justify-between rounded border border-border/40 bg-[hsl(24,15%,11%)] px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">{event.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {event.day} {monthName}
          {event.recurring ? ' (recurring)' : `, Year ${event.year}`}
        </p>
        {event.notes && (
          <p className="mt-0.5 text-[10px] italic text-muted-foreground/70">{event.notes}</p>
        )}
      </div>
      <button
        type="button"
        className="ml-2 shrink-0 text-muted-foreground/40 transition-colors hover:text-blood"
        disabled={removeEvent.isPending}
        onClick={() =>
          removeEvent.mutate(
            { campaignId, eventId: event.id },
            { onError: () => toast.error('Failed to remove event') },
          )
        }
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function AddEventForm({
  campaignId,
  cal,
}: {
  campaignId: string;
  cal: CampaignCalendar;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [month, setMonth] = useState(cal.currentDate.month);
  const [day, setDay] = useState(cal.currentDate.day);
  const [year, setYear] = useState(cal.currentDate.year);
  const [recurring, setRecurring] = useState(false);
  const [notes, setNotes] = useState('');
  const addEvent = useAddCalendarEvent();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-border/40 py-2 text-xs text-muted-foreground/60 transition-colors hover:border-primary/30 hover:text-primary/70"
      >
        <Plus className="h-3 w-3" />
        Add Event
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    addEvent.mutate(
      {
        campaignId,
        data: {
          name: name.trim(),
          year,
          month,
          day,
          recurring,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Event added');
          setName('');
          setNotes('');
          setRecurring(false);
          setOpen(false);
        },
        onError: () => toast.error('Failed to add event'),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded border border-border/40 bg-[hsl(24,15%,11%)] p-3">
      <p className="text-xs font-medium text-muted-foreground">New Event</p>

      <input
        className={INPUT_CLS}
        placeholder="Event name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={LABEL_CLS}>Month</label>
          <select
            className={INPUT_CLS}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {cal.months.map((m, i) => (
              <option key={i} value={i}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Day</label>
          <input
            type="number"
            className={INPUT_CLS}
            min={1}
            max={cal.months[month]?.days ?? 30}
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Year</label>
          <input
            type="number"
            className={INPUT_CLS}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
      </div>

      <input
        className={INPUT_CLS}
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="accent-primary"
        />
        Recurring yearly
      </label>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={addEvent.isPending || !name.trim()}>
          {addEvent.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Add
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ── Helpers ───────────────────────────────────────────────── */

function getDayOfWeek(
  cal: CampaignCalendar,
  year: number,
  month: number,
  day: number,
): number {
  // Calculate total days from epoch (year 0, month 0, day 1) to get weekday
  let totalDays = 0;

  // Days from previous years (simplified: assume same calendar every year)
  const daysPerYear = cal.months.reduce((sum, m) => sum + m.days, 0);
  totalDays += year * daysPerYear;

  // Days from previous months in current year
  for (let m = 0; m < month; m++) {
    totalDays += cal.months[m].days;
  }

  totalDays += day - 1;

  const weekLength = cal.weekdays.length;
  return weekLength > 0 ? ((totalDays % weekLength) + weekLength) % weekLength : 0;
}
