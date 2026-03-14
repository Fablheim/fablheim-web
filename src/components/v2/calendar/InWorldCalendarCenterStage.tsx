import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MoonStar,
  Mountain,
  Plus,
  ScrollText,
  SunMedium,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAddCalendarEvent,
  useAdvanceDate,
  useCampaign,
  useInitCalendar,
  useRemoveCalendarEvent,
  useSetDate,
  useUpdateCalendarEvent,
} from '@/hooks/useCampaigns';
import { useCharacters } from '@/hooks/useCharacters';
import { useSessions } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import { useCreateDowntime, useDowntimeActivities } from '@/hooks/useDowntime';
import type {
  CalendarEvent,
  CalendarEventStatus,
  CalendarEventType,
  CalendarPresetType,
  CampaignCalendar,
} from '@/types/campaign';

interface InWorldCalendarCenterStageProps {
  campaignId: string;
}

const panelClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.68)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(22,24%,9%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]';

const inputClass =
  'w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(212,42%,58%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)]';

const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  session: 'Session',
  travel: 'Travel',
  downtime: 'Downtime',
  deadline: 'Deadline',
  faction: 'Faction Event',
  festival: 'Festival',
  reminder: 'Reminder',
};

const EVENT_STATUS_LABELS: Record<CalendarEventStatus, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
};

const PRESET_LABELS: Record<CalendarPresetType, string> = {
  forgotten_realms: 'Harptos Almanac',
  greyhawk: 'Greyhawk Reckoning',
  custom: 'Custom Chronicle',
};

export function InWorldCalendarCenterStage({ campaignId }: InWorldCalendarCenterStageProps) {
  const { data: campaign } = useCampaign(campaignId);
  const { data: sessions } = useSessions(campaignId);
  const { data: worldEntities } = useWorldEntities(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const { data: downtime } = useDowntimeActivities(campaignId);

  const initCalendar = useInitCalendar();
  const advanceDate = useAdvanceDate();
  const setDate = useSetDate();
  const addEvent = useAddCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const removeEvent = useRemoveCalendarEvent();
  const createDowntime = useCreateDowntime();

  const calendar = campaign?.calendar ?? null;
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAdvanceTime, setShowAdvanceTime] = useState(false);
  const [showDowntimeForm, setShowDowntimeForm] = useState(false);
  const [showCalendarSwap, setShowCalendarSwap] = useState(false);
  const [advanceDays, setAdvanceDays] = useState('3');

  const visibleDate = useMemo(() => {
    if (!calendar) return null;
    return selectedDate ?? calendar.currentDate;
  }, [calendar, selectedDate]);

  const [viewCursor, setViewCursor] = useState<{ year: number; month: number } | null>(null);
  const visibleMonth = viewCursor?.month ?? calendar?.currentDate.month ?? 0;
  const visibleYear = viewCursor?.year ?? calendar?.currentDate.year ?? 0;

  const dayEvents = useMemo(() => {
    if (!calendar || !visibleDate) return [];
    return getEventsForDate(calendar, visibleDate.year, visibleDate.month, visibleDate.day);
  }, [calendar, visibleDate]);

  const selectedEvent = useMemo(() => {
    if (!calendar || !selectedEventId) return null;
    return calendar.events.find((event) => event.id === selectedEventId) ?? null;
  }, [calendar, selectedEventId]);

  const nextMajorEvent = useMemo(() => {
    if (!calendar) return null;
    return getUpcomingEvents(calendar)
      .find((event) => event.eventType === 'deadline' || event.eventType === 'festival' || event.eventType === 'session')
      ?? null;
  }, [calendar]);

  const currentMonthEvents = useMemo(() => {
    if (!calendar) return [];
    return calendar.events
      .filter((event) => event.month === visibleMonth && (event.year === visibleYear || event.recurring))
      .sort(compareCalendarEvents);
  }, [calendar, visibleMonth, visibleYear]);

  if (!calendar) {
    return (
      <CalendarSetupState
        pending={initCalendar.isPending}
        onInit={(preset) =>
          initCalendar.mutate(
            { campaignId, preset },
            { onError: () => toast.error('Failed to initialize calendar') },
          )
        }
      />
    );
  }

  const monthLabel = calendar.months[calendar.currentDate.month]?.name ?? `Month ${calendar.currentDate.month + 1}`;
  const seasonLabel = deriveSeason(calendar.currentDate.month, calendar.months.length);
  const moonPhase = deriveMoonPhase(calendar.currentDate.day);
  const daysUntilNext = nextMajorEvent
    ? diffInDays(calendar, calendar.currentDate, {
        year: nextMajorEvent.year,
        month: nextMajorEvent.month,
        day: nextMajorEvent.day,
      })
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] text-[hsl(38,24%,88%)]">
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(212,24%,66%)]">In-World Calendar</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,42%,90%)]">
              {formatDateLong(calendar, calendar.currentDate)}
            </h2>
            <p className="mt-2 text-xs text-[hsl(30,14%,62%)]">
              {monthLabel} · {seasonLabel} · {PRESET_LABELS[calendar.preset]}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <MetaPill icon={MoonStar} label="Moon" value={moonPhase} />
            <MetaPill icon={SunMedium} label="Season" value={seasonLabel} />
            <MetaPill icon={Clock3} label="Next Major" value={daysUntilNext != null && daysUntilNext >= 0 ? `${daysUntilNext} days` : 'None'} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setShowCalendarSwap((value) => !value)} className={actionButtonClass()}>
            <CalendarDays className="h-4 w-4" />
            Change Calendar
          </button>
          <button type="button" onClick={() => setShowAddEvent((value) => !value)} className={actionButtonClass()}>
            <Plus className="h-4 w-4" />
            Add Event
          </button>
          <button
            type="button"
            onClick={() =>
              advanceDate.mutate(
                { campaignId, days: 1 },
                { onError: () => toast.error('Failed to advance the day') },
              )
            }
            className={actionButtonClass()}
          >
            <CalendarDays className="h-4 w-4" />
            Advance Day
          </button>
          <button type="button" onClick={() => setShowAdvanceTime((value) => !value)} className={actionButtonClass()}>
            <Clock3 className="h-4 w-4" />
            Advance Time
          </button>
          <button type="button" onClick={() => setShowDowntimeForm((value) => !value)} className={actionButtonClass(true)}>
            <ScrollText className="h-4 w-4" />
            Log Downtime
          </button>
        </div>

        {(showCalendarSwap || showAddEvent || showAdvanceTime || showDowntimeForm) && (
          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {showCalendarSwap && (
              <CalendarSwapCard
                currentPreset={calendar.preset}
                pending={initCalendar.isPending}
                onChoose={(preset) =>
                  initCalendar.mutate(
                    { campaignId, preset },
                    {
                      onSuccess: () => {
                        setShowCalendarSwap(false);
                        setSelectedDate(null);
                        setSelectedEventId(null);
                        setViewCursor(null);
                        toast.success(`Calendar changed to ${PRESET_LABELS[preset]}`);
                      },
                      onError: () => toast.error('Failed to change calendar'),
                    },
                  )
                }
              />
            )}

            {showAddEvent && (
              <AddEventComposer
                calendar={calendar}
                selectedDate={visibleDate ?? calendar.currentDate}
                sessions={sessions ?? []}
                worldEntities={worldEntities ?? []}
                pending={addEvent.isPending}
                onSubmit={(data) =>
                  addEvent.mutate(
                    { campaignId, data },
                    {
                      onSuccess: () => {
                        setShowAddEvent(false);
                        toast.success('Calendar event added');
                      },
                      onError: () => toast.error('Failed to add event'),
                    },
                  )
                }
              />
            )}

            {showAdvanceTime && (
              <QuickAdvanceCard
                value={advanceDays}
                pending={advanceDate.isPending}
                onValueChange={setAdvanceDays}
                onSubmit={() =>
                  advanceDate.mutate(
                    { campaignId, days: Number.parseInt(advanceDays, 10) || 0 },
                    {
                      onSuccess: () => setShowAdvanceTime(false),
                      onError: () => toast.error('Failed to advance time'),
                    },
                  )
                }
              />
            )}

            {showDowntimeForm && (
              <DowntimeComposer
                characters={characters ?? []}
                sessions={sessions ?? []}
                selectedDate={visibleDate ?? calendar.currentDate}
                pending={createDowntime.isPending}
                onSubmit={({ downtimeData, calendarData }) =>
                  createDowntime.mutate(
                    { campaignId, data: downtimeData },
                    {
                      onSuccess: () => {
                        addEvent.mutate(
                          { campaignId, data: calendarData },
                          {
                            onSuccess: () => {
                              setShowDowntimeForm(false);
                              toast.success('Downtime logged');
                            },
                            onError: () => toast.error('Downtime saved, but calendar event failed'),
                          },
                        );
                      },
                      onError: () => toast.error('Failed to log downtime'),
                    },
                  )
                }
              />
            )}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">
        <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className={`${panelClass} min-h-0 overflow-hidden`}>
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Chronicle View</p>
                    <h3 className="mt-1 font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,40%,90%)]">
                      {calendar.months[visibleMonth]?.name ?? `Month ${visibleMonth + 1}`}
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setViewCursor(stepMonth(calendar, visibleYear, visibleMonth, -1))} className={iconButtonClass()}>
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setViewCursor(stepMonth(calendar, visibleYear, visibleMonth, 1))} className={iconButtonClass()}>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <MonthGrid
                  calendar={calendar}
                  visibleYear={visibleYear}
                  visibleMonth={visibleMonth}
                  selectedDate={visibleDate}
                  onSelectDate={(date) => {
                    setSelectedDate(date);
                    setSelectedEventId(null);
                  }}
                />

                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">This Month</p>
                  <div className="mt-3 space-y-2">
                    {currentMonthEvents.length ? currentMonthEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => {
                          setSelectedDate({ year: event.year, month: event.month, day: event.day });
                          setSelectedEventId(event.id);
                        }}
                        className={`w-full rounded-[16px] border px-3 py-3 text-left transition ${
                          selectedEventId === event.id
                            ? 'border-[hsla(212,42%,58%,0.36)] bg-[hsla(212,42%,58%,0.1)]'
                            : 'border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] hover:border-[hsla(212,24%,34%,0.42)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">{event.name}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">
                              {EVENT_TYPE_LABELS[event.eventType ?? 'reminder']} · {event.day} {calendar.months[event.month]?.name}
                            </p>
                          </div>
                          <EventBadge event={event} />
                        </div>
                      </button>
                    )) : (
                      <p className="rounded-[16px] border border-[hsla(32,24%,24%,0.36)] bg-[hsla(22,18%,10%,0.5)] px-3 py-3 text-sm text-[hsl(30,14%,52%)]">
                        No world events recorded for this month yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className={`${panelClass} min-h-0 overflow-hidden`}>
            <div className="h-full min-h-0 overflow-y-auto p-4">
              {selectedEvent ? (
                <EventWorkspace
                  calendar={calendar}
                  event={selectedEvent}
                  sessions={sessions ?? []}
                  worldEntities={worldEntities ?? []}
                  downtime={downtime ?? []}
                  updatePending={updateEvent.isPending}
                  removePending={removeEvent.isPending}
                  onMarkCompleted={() =>
                    updateEvent.mutate(
                      { campaignId, eventId: selectedEvent.id, data: { status: 'completed' } },
                      { onError: () => toast.error('Failed to update event') },
                    )
                  }
                  onRemove={() =>
                    removeEvent.mutate(
                      { campaignId, eventId: selectedEvent.id },
                      {
                        onSuccess: () => setSelectedEventId(null),
                        onError: () => toast.error('Failed to remove event'),
                      },
                    )
                  }
                />
              ) : (
                <DayWorkspace
                  calendar={calendar}
                  date={visibleDate ?? calendar.currentDate}
                  dayEvents={dayEvents}
                  sessions={sessions ?? []}
                  worldEntities={worldEntities ?? []}
                  downtime={downtime ?? []}
                  onSelectEvent={setSelectedEventId}
                  onSetCurrentDay={(date) =>
                    setDate.mutate(
                      { campaignId, date },
                      { onError: () => toast.error('Failed to set campaign date') },
                    )
                  }
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CalendarSetupState({
  pending,
  onInit,
}: {
  pending: boolean;
  onInit: (preset: CalendarPresetType) => void;
}) {
  return (
    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] px-6">
      <div className={`${panelClass} max-w-3xl p-8 text-center`}>
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(212,24%,66%)]">World Time Desk</p>
        <h2 className="mt-2 font-['IM_Fell_English'] text-[44px] leading-none text-[hsl(38,42%,90%)]">
          Start the campaign chronicle
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[hsl(30,14%,58%)]">
          Choose a calendar structure so the campaign can track world dates, festivals, deadlines, travel, and downtime as part of the world itself.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {(Object.keys(PRESET_LABELS) as CalendarPresetType[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onInit(preset)}
              disabled={pending}
              className={actionButtonClass(true)}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
              {PRESET_LABELS[preset]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarSwapCard({
  currentPreset,
  pending,
  onChoose,
}: {
  currentPreset: CalendarPresetType;
  pending: boolean;
  onChoose: (preset: CalendarPresetType) => void;
}) {
  return (
    <div className="rounded-[20px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Change Calendar</p>
      <p className="mt-3 text-sm leading-7 text-[hsl(30,14%,58%)]">
        If the campaign is using the wrong calendar, you can swap to a different preset here. This resets the calendar structure and current in-world date.
      </p>
      <div className="mt-4 space-y-2">
        {(Object.keys(PRESET_LABELS) as CalendarPresetType[]).map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={pending}
            onClick={() => onChoose(preset)}
            className={`flex w-full items-center justify-between rounded-[16px] border px-3 py-3 text-left transition ${
              preset === currentPreset
                ? 'border-[hsla(42,72%,52%,0.34)] bg-[hsla(42,72%,42%,0.14)]'
                : 'border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.68)] hover:border-[hsla(212,24%,34%,0.42)]'
            }`}
          >
            <span className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">{PRESET_LABELS[preset]}</span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">
              {preset === currentPreset ? 'Current' : pending ? 'Switching…' : 'Use'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

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
  const firstDayWeekday = getDayOfWeek(calendar, visibleYear, visibleMonth, 1);
  const cells: ReactNode[] = [];

  for (let i = 0; i < firstDayWeekday; i += 1) {
    cells.push(<div key={`empty-${i}`} />);
  }

  cells.push(
    ...Array.from({ length: monthData?.days ?? 0 }, (_, index) => {
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
          className={`relative min-h-[74px] rounded-[16px] border p-2 text-left transition ${
            isSelected
              ? 'border-[hsla(42,72%,52%,0.34)] bg-[hsla(42,72%,42%,0.14)]'
              : isCurrent
                ? 'border-[hsla(212,42%,58%,0.36)] bg-[hsla(212,42%,58%,0.1)]'
                : 'border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] hover:border-[hsla(212,24%,34%,0.42)]'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">{dayNumber}</span>
            {events.length > 0 && (
              <span className="rounded-full bg-[hsl(42,72%,52%)] px-2 py-0.5 text-[10px] text-[hsl(20,25%,10%)]">
                {events.length}
              </span>
            )}
          </div>
          <div className="mt-2 space-y-1">
            {events.slice(0, 2).map((event) => (
              <div key={event.id} className="truncate text-[10px] text-[hsl(30,14%,62%)]">
                {event.name}
              </div>
            ))}
          </div>
        </button>
      );
    }),
  );

  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
        {calendar.weekdays.slice(0, 7).map((weekday) => (
          <div key={weekday} className="px-2 text-center text-[10px] uppercase tracking-[0.2em] text-[hsl(212,24%,66%)]">
            {weekday.slice(0, 3)}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">{cells}</div>
    </div>
  );
}

function DayWorkspace({
  calendar,
  date,
  dayEvents,
  sessions,
  worldEntities,
  downtime,
  onSelectEvent,
  onSetCurrentDay,
}: {
  calendar: CampaignCalendar;
  date: { year: number; month: number; day: number };
  dayEvents: CalendarEvent[];
  sessions: Array<{ _id: string; title: string; scheduledDate?: string; status?: string }>;
  worldEntities: Array<{ _id: string; name: string; type: string }>;
  downtime: Array<{ _id: string; name: string; durationDays: number; createdAt: string; status: string }>;
  onSelectEvent: (eventId: string) => void;
  onSetCurrentDay: (date: { year: number; month: number; day: number }) => void;
}) {
  const matchingDowntime = downtime.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Selected Day</p>
            <h3 className="mt-1 font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,40%,90%)]">
              {formatDateLong(calendar, date)}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[hsl(30,14%,58%)]">
              Read the state of the world on this day, see what is approaching, and decide whether the campaign should rest, travel, or advance.
            </p>
          </div>
          <button type="button" onClick={() => onSetCurrentDay(date)} className={actionButtonClass(true)}>
            <Clock3 className="h-4 w-4" />
            Make Current Day
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Events on This Day</p>
            <div className="mt-3 space-y-3">
              {dayEvents.length ? dayEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onSelectEvent(event.id)}
                  className="w-full rounded-[16px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.68)] px-4 py-3 text-left transition hover:border-[hsla(212,24%,34%,0.42)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">{event.name}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">
                        {EVENT_TYPE_LABELS[event.eventType ?? 'reminder']} · {EVENT_STATUS_LABELS[event.status ?? 'upcoming']}
                      </p>
                    </div>
                    <EventBadge event={event} />
                  </div>
                  {event.notes && (
                    <p className="mt-2 text-sm leading-6 text-[hsl(30,14%,58%)]">{event.notes}</p>
                  )}
                </button>
              )) : (
                <p className="rounded-[16px] border border-[hsla(32,24%,24%,0.36)] bg-[hsla(22,18%,10%,0.5)] px-3 py-3 text-sm text-[hsl(30,14%,52%)]">
                  No events are recorded on this day yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ContextShelf
            title="World Context"
            body={
              dayEvents.length
                ? 'This day has active world movement attached to it.'
                : 'No direct world events are attached yet, so this can serve as downtime, travel, or a quiet span between sessions.'
            }
          />
          <ContextShelf
            title="Linked Sessions"
            body={resolveLinkedSessions(dayEvents, sessions)}
          />
          <ContextShelf
            title="Linked Places & People"
            body={resolveLinkedEntities(dayEvents, worldEntities)}
          />
          <ContextShelf
            title="Downtime Ledger"
            body={matchingDowntime.length
              ? matchingDowntime.map((item) => `${item.name} · ${item.durationDays} day${item.durationDays === 1 ? '' : 's'} · ${item.status}`).join('\n')
              : 'No downtime activities have been logged yet.'}
          />
        </div>
      </div>
    </div>
  );
}

function EventWorkspace({
  calendar,
  event,
  sessions,
  worldEntities,
  downtime,
  updatePending,
  removePending,
  onMarkCompleted,
  onRemove,
}: {
  calendar: CampaignCalendar;
  event: CalendarEvent;
  sessions: Array<{ _id: string; title: string }>;
  worldEntities: Array<{ _id: string; name: string; type: string }>;
  downtime: Array<{ name: string; durationDays: number; status: string }>;
  updatePending: boolean;
  removePending: boolean;
  onMarkCompleted: () => void;
  onRemove: () => void;
}) {
  const linkedSession = sessions.find((session) => session._id === event.sessionId);
  const linkedEntity = worldEntities.find((entity) => entity._id === event.entityId);
  const matchingDowntime = event.eventType === 'downtime' ? downtime.filter((item) => item.name === event.name).slice(0, 1) : [];

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Event Detail</p>
            <h3 className="mt-1 font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,40%,90%)]">
              {event.name}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <DetailBadge>{EVENT_TYPE_LABELS[event.eventType ?? 'reminder']}</DetailBadge>
              <DetailBadge>{EVENT_STATUS_LABELS[event.status ?? 'upcoming']}</DetailBadge>
              <DetailBadge>{formatDateShort(calendar, event)}</DetailBadge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onMarkCompleted} disabled={updatePending} className={actionButtonClass()}>
              {updatePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}
              Mark Completed
            </button>
            <button type="button" onClick={onRemove} disabled={removePending} className={actionButtonClass()}>
              Remove
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Chronicle Entry</p>
          <div className="mt-3 space-y-3 text-sm leading-7 text-[hsl(30,14%,58%)]">
            <p>{event.notes?.trim() || 'No detail has been written for this event yet.'}</p>
            {event.durationDays ? (
              <p><span className="font-[Cinzel] text-[hsl(38,34%,86%)]">Duration:</span> {event.durationDays} day{event.durationDays === 1 ? '' : 's'}</p>
            ) : null}
            {event.recurring ? (
              <p><span className="font-[Cinzel] text-[hsl(38,34%,86%)]">Recurs:</span> yearly</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <ContextShelf
            title="Linked Session"
            body={linkedSession ? linkedSession.title : 'No session linked.'}
          />
          <ContextShelf
            title="Linked Entity"
            body={linkedEntity ? `${linkedEntity.type} — ${linkedEntity.name}` : 'No campaign entity linked.'}
          />
          <ContextShelf
            title="Downtime Context"
            body={matchingDowntime.length
              ? matchingDowntime.map((item) => `${item.name} · ${item.durationDays} days · ${item.status}`).join('\n')
              : event.eventType === 'downtime'
                ? 'No matching downtime record was found for this calendar entry.'
                : 'This event is not marked as downtime.'}
          />
        </div>
      </div>
    </div>
  );
}

function AddEventComposer({
  calendar,
  selectedDate,
  sessions,
  worldEntities,
  pending,
  onSubmit,
}: {
  calendar: CampaignCalendar;
  selectedDate: { year: number; month: number; day: number };
  sessions: Array<{ _id: string; title: string }>;
  worldEntities: Array<{ _id: string; name: string; type: string }>;
  pending: boolean;
  onSubmit: (data: {
    name: string;
    year: number;
    month: number;
    day: number;
    eventType: CalendarEventType;
    status: CalendarEventStatus;
    recurring?: boolean;
    durationDays?: number;
    entityId?: string;
    sessionId?: string;
    notes?: string;
  }) => void;
}) {
  const [name, setName] = useState('');
  const [month, setMonth] = useState(selectedDate.month);
  const [day, setDay] = useState(selectedDate.day);
  const [year, setYear] = useState(selectedDate.year);
  const [eventType, setEventType] = useState<CalendarEventType>('reminder');
  const [status, setStatus] = useState<CalendarEventStatus>('upcoming');
  const [durationDays, setDurationDays] = useState('1');
  const [sessionId, setSessionId] = useState('');
  const [entityId, setEntityId] = useState('');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(false);

  return (
    <div className="rounded-[20px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Add Event</p>
      <div className="mt-3 space-y-3">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Festival of Ashes" className={inputClass} />
        <div className="grid grid-cols-3 gap-3">
          <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className={inputClass}>
            {calendar.months.map((item, index) => (
              <option key={item.name} value={index}>{item.name}</option>
            ))}
          </select>
          <input value={day} onChange={(event) => setDay(Number(event.target.value))} inputMode="numeric" className={inputClass} />
          <input value={year} onChange={(event) => setYear(Number(event.target.value))} inputMode="numeric" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select value={eventType} onChange={(event) => setEventType(event.target.value as CalendarEventType)} className={inputClass}>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as CalendarEventStatus)} className={inputClass}>
            {Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input value={durationDays} onChange={(event) => setDurationDays(event.target.value)} inputMode="numeric" placeholder="Duration" className={inputClass} />
          <select value={sessionId} onChange={(event) => setSessionId(event.target.value)} className={inputClass}>
            <option value="">Link session</option>
            {sessions.map((session) => <option key={session._id} value={session._id}>{session.title}</option>)}
          </select>
          <select value={entityId} onChange={(event) => setEntityId(event.target.value)} className={inputClass}>
            <option value="">Link entity</option>
            {worldEntities.map((entity) => <option key={entity._id} value={entity._id}>{entity.name}</option>)}
          </select>
        </div>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="What is happening in the world on this date?" className={`${inputClass} resize-y`} />
        <label className="flex items-center gap-2 text-xs text-[hsl(30,14%,58%)]">
          <input type="checkbox" checked={recurring} onChange={(event) => setRecurring(event.target.checked)} className="accent-[hsl(42,72%,52%)]" />
          Repeats yearly
        </label>
        <button
          type="button"
          disabled={!name.trim() || pending}
          onClick={() => onSubmit({
            name: name.trim(),
            year,
            month,
            day,
            eventType,
            status,
            recurring,
            durationDays: Number.parseInt(durationDays, 10) || undefined,
            sessionId: sessionId || undefined,
            entityId: entityId || undefined,
            notes: notes.trim() || undefined,
          })}
          className={actionButtonClass(true)}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Save Event
        </button>
      </div>
    </div>
  );
}

function QuickAdvanceCard({
  value,
  pending,
  onValueChange,
  onSubmit,
}: {
  value: string;
  pending: boolean;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-[20px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Advance Time</p>
      <div className="mt-3 space-y-3">
        <input value={value} onChange={(event) => onValueChange(event.target.value)} inputMode="numeric" placeholder="Days to pass" className={inputClass} />
        <button type="button" onClick={onSubmit} disabled={pending} className={actionButtonClass(true)}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}
          Advance by {value || '0'} day{value === '1' ? '' : 's'}
        </button>
      </div>
    </div>
  );
}

function DowntimeComposer({
  characters,
  sessions,
  selectedDate,
  pending,
  onSubmit,
}: {
  characters: Array<{ _id: string; name: string }>;
  sessions: Array<{ _id: string; title: string }>;
  selectedDate: { year: number; month: number; day: number };
  pending: boolean;
  onSubmit: (payload: {
    downtimeData: {
      characterId: string;
      name: string;
      type: 'crafting' | 'training' | 'carousing' | 'research' | 'working' | 'recuperating' | 'other';
      description?: string;
      durationDays?: number;
      sessionId?: string;
    };
    calendarData: {
      name: string;
      year: number;
      month: number;
      day: number;
      eventType: 'downtime';
      status: 'upcoming';
      durationDays?: number;
      sessionId?: string;
      notes?: string;
    };
  }) => void;
}) {
  const [characterId, setCharacterId] = useState(characters[0]?._id ?? '');
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState('3');
  const [sessionId, setSessionId] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="rounded-[20px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Log Downtime</p>
      <div className="mt-3 space-y-3">
        <select value={characterId} onChange={(event) => setCharacterId(event.target.value)} className={inputClass}>
          <option value="">Choose character</option>
          {characters.map((character) => <option key={character._id} value={character._id}>{character.name}</option>)}
        </select>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Research at the Athenaeum" className={inputClass} />
        <div className="grid grid-cols-2 gap-3">
          <input value={durationDays} onChange={(event) => setDurationDays(event.target.value)} inputMode="numeric" placeholder="Days" className={inputClass} />
          <select value={sessionId} onChange={(event) => setSessionId(event.target.value)} className={inputClass}>
            <option value="">Link session</option>
            {sessions.map((session) => <option key={session._id} value={session._id}>{session.title}</option>)}
          </select>
        </div>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="What is the party doing during this downtime block?" className={`${inputClass} resize-y`} />
        <button
          type="button"
          disabled={!characterId || !name.trim() || pending}
          onClick={() =>
            onSubmit({
              downtimeData: {
                characterId,
                name: name.trim(),
                type: 'other',
                description: description.trim() || undefined,
                durationDays: Number.parseInt(durationDays, 10) || 1,
                sessionId: sessionId || undefined,
              },
              calendarData: {
                name: name.trim(),
                year: selectedDate.year,
                month: selectedDate.month,
                day: selectedDate.day,
                eventType: 'downtime',
                status: 'upcoming',
                durationDays: Number.parseInt(durationDays, 10) || 1,
                sessionId: sessionId || undefined,
                notes: description.trim() || undefined,
              },
            })
          }
          className={actionButtonClass(true)}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mountain className="h-4 w-4" />}
          Save Downtime
        </button>
      </div>
    </div>
  );
}

function ContextShelf({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[20px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">{title}</p>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[hsl(30,14%,58%)]">{body}</p>
    </div>
  );
}

function EventBadge({ event }: { event: CalendarEvent }) {
  const tone =
    event.status === 'completed'
      ? 'border-[hsla(145,42%,38%,0.34)] bg-[hsla(145,42%,12%,0.54)] text-[hsl(145,62%,78%)]'
      : event.eventType === 'deadline'
        ? 'border-[hsla(2,52%,42%,0.34)] bg-[hsla(2,42%,12%,0.54)] text-[hsl(2,62%,78%)]'
        : 'border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] text-[hsl(212,34%,74%)]';
  return <span className={`rounded-full border px-3 py-1 text-xs ${tone}`}>{EVENT_STATUS_LABELS[event.status ?? 'upcoming']}</span>;
}

function MetaPill({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-1.5">
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[hsl(212,24%,66%)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="ml-2 font-[Cinzel] text-sm text-[hsl(38,40%,88%)]">{value}</span>
    </div>
  );
}

function actionButtonClass(accent = false) {
  return `inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
    accent
      ? 'border-[hsla(42,72%,52%,0.34)] bg-[hsla(42,72%,42%,0.16)] text-[hsl(42,82%,78%)] hover:bg-[hsla(42,72%,42%,0.22)]'
      : 'border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] text-[hsl(212,34%,74%)] hover:bg-[hsla(220,18%,16%,0.9)]'
  }`;
}

function iconButtonClass() {
  return 'inline-flex items-center justify-center rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] p-2 text-[hsl(212,34%,74%)] transition hover:bg-[hsla(220,18%,16%,0.9)]';
}

function DetailBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-1 text-xs text-[hsl(212,34%,74%)]">
      {children}
    </span>
  );
}

function formatDateLong(calendar: CampaignCalendar, date: { year: number; month: number; day: number }) {
  const weekday = calendar.weekdays[getDayOfWeek(calendar, date.year, date.month, date.day)] ?? '';
  const month = calendar.months[date.month]?.name ?? `Month ${date.month + 1}`;
  return `${weekday ? `${weekday}, ` : ''}${date.day} ${month}, Year ${date.year}`;
}

function formatDateShort(calendar: CampaignCalendar, date: { year: number; month: number; day: number }) {
  const month = calendar.months[date.month]?.name ?? `Month ${date.month + 1}`;
  return `${date.day} ${month}, ${date.year}`;
}

function getDayOfWeek(calendar: CampaignCalendar, year: number, month: number, day: number) {
  let totalDays = 0;
  const daysPerYear = calendar.months.reduce((sum, item) => sum + item.days, 0);
  totalDays += year * daysPerYear;
  for (let index = 0; index < month; index += 1) {
    totalDays += calendar.months[index].days;
  }
  totalDays += day - 1;
  return calendar.weekdays.length ? ((totalDays % calendar.weekdays.length) + calendar.weekdays.length) % calendar.weekdays.length : 0;
}

function getEventsForDate(calendar: CampaignCalendar, year: number, month: number, day: number) {
  return calendar.events
    .filter((event) => event.month === month && event.day === day && (event.year === year || event.recurring))
    .sort(compareCalendarEvents);
}

function compareCalendarEvents(a: CalendarEvent, b: CalendarEvent) {
  if (a.day !== b.day) return a.day - b.day;
  return a.name.localeCompare(b.name);
}

function getUpcomingEvents(calendar: CampaignCalendar) {
  return [...calendar.events].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  });
}

function deriveSeason(monthIndex: number, totalMonths: number) {
  const quarter = Math.floor((monthIndex / Math.max(totalMonths, 1)) * 4);
  return ['Deep Winter', 'Springrise', 'High Summer', 'Harvestfall'][quarter] ?? 'Turning Season';
}

function deriveMoonPhase(day: number) {
  const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  return phases[(day - 1) % phases.length] ?? 'New Moon';
}

function stepMonth(calendar: CampaignCalendar, year: number, month: number, delta: number) {
  let nextYear = year;
  let nextMonth = month + delta;
  if (nextMonth < 0) {
    nextMonth = calendar.months.length - 1;
    nextYear -= 1;
  } else if (nextMonth >= calendar.months.length) {
    nextMonth = 0;
    nextYear += 1;
  }
  return { year: nextYear, month: nextMonth };
}

function toAbsoluteDay(calendar: CampaignCalendar, date: { year: number; month: number; day: number }) {
  const daysPerYear = calendar.months.reduce((sum, item) => sum + item.days, 0);
  let total = date.year * daysPerYear;
  for (let index = 0; index < date.month; index += 1) {
    total += calendar.months[index].days;
  }
  return total + date.day;
}

function diffInDays(calendar: CampaignCalendar, from: { year: number; month: number; day: number }, to: { year: number; month: number; day: number }) {
  return toAbsoluteDay(calendar, to) - toAbsoluteDay(calendar, from);
}

function resolveLinkedSessions(events: CalendarEvent[], sessions: Array<{ _id: string; title: string }>) {
  const titles = events
    .map((event) => sessions.find((session) => session._id === event.sessionId)?.title)
    .filter((value): value is string => Boolean(value));
  return titles.length ? titles.join('\n') : 'No sessions are linked to this date.';
}

function resolveLinkedEntities(events: CalendarEvent[], worldEntities: Array<{ _id: string; name: string; type: string }>) {
  const labels = events
    .map((event) => worldEntities.find((entity) => entity._id === event.entityId))
    .filter((value): value is { _id: string; name: string; type: string } => Boolean(value))
    .map((entity) => `${entity.type} — ${entity.name}`);
  return labels.length ? labels.join('\n') : 'No locations, NPCs, factions, or quests are linked to this date.';
}
