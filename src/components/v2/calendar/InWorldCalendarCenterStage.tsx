import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  CalendarDays,
  Clock3,
  Loader2,
  Mountain,
  Plus,
  ScrollText,
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
import { shellPanelClass } from '@/lib/panel-styles';
import { ArcLinker } from '../shared/ArcLinker';
import type {
  CalendarEvent,
  CalendarEventStatus,
  CalendarEventType,
  CalendarPresetType,
  CampaignCalendar,
} from '@/types/campaign';
import type { DowntimeParticipantType } from '@/types/downtime';
import { useCalendarPrepContext } from './CalendarPrepContext';

interface InWorldCalendarCenterStageProps {
  campaignId: string;
}

const panelClass = shellPanelClass;

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

  const {
    visibleDate,
    dayEvents,
    selectedEvent,
    setSelectedDate,
    setSelectedEventId,
    setViewCursor,
  } = useCalendarPrepContext();

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAdvanceTime, setShowAdvanceTime] = useState(false);
  const [showDowntimeForm, setShowDowntimeForm] = useState(false);
  const [showCalendarSwap, setShowCalendarSwap] = useState(false);
  const [advanceDays, setAdvanceDays] = useState('3');

  // Use campaign's calendar for the setup check (context may not have it yet)
  const maybeCalendar = campaign?.calendar ?? null;

  if (!maybeCalendar) {
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

  // maybeCalendar is narrowed to CampaignCalendar after the early return, but hoisted
  // inner functions can't see that narrowing — use an explicitly typed alias instead.
  const cal: CampaignCalendar = maybeCalendar;

  const displayDate = visibleDate ?? cal.currentDate;
  const seasonLabel = deriveSeason(displayDate.month, cal.months.length);

  const filteredSessions = (sessions ?? []).filter(
    (s): s is typeof s & { title: string } => !!s.title,
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] p-4 text-[hsl(38,24%,88%)]">
      <section className={`${panelClass} min-h-0 flex-1 flex flex-col overflow-hidden`}>
        {renderShellHeader()}
        {renderShellBody()}
      </section>
    </div>
  );

  function renderShellHeader() {
    const dowIndex = getDayOfWeek(cal, displayDate.year, displayDate.month, displayDate.day);
    const dowLabel = cal.weekdays.length ? `${ordinalSuffix(dowIndex + 1)} Day of Week` : '';
    const isCurrentDay =
      displayDate.year === cal.currentDate.year &&
      displayDate.month === cal.currentDate.month &&
      displayDate.day === cal.currentDate.day;
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(212,24%,66%)]">In-World Calendar</p>
            <h2 className="mt-0.5 font-['IM_Fell_English'] text-[26px] leading-none text-[hsl(38,42%,90%)]">
              {formatDateMain(cal, displayDate)}
            </h2>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(30,14%,52%)]">
              {[dowLabel, seasonLabel, PRESET_LABELS[cal.preset]].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isCurrentDay && (
              <button
                type="button"
                onClick={() => setDate.mutate({ campaignId, date: displayDate }, { onError: () => toast.error('Failed to set date') })}
                className={actionButtonClass(true)}
              >
                <Clock3 className="h-4 w-4" />
                Make Current Day
              </button>
            )}
            <button type="button" onClick={() => setShowCalendarSwap((v) => !v)} className={actionButtonClass()}>
              <CalendarDays className="h-4 w-4" />
              Change Calendar
            </button>
            <button type="button" onClick={() => setShowAddEvent((v) => !v)} className={actionButtonClass()}>
              <Plus className="h-4 w-4" />
              Add Event
            </button>
            <button type="button" onClick={() => setShowAdvanceTime((v) => !v)} className={actionButtonClass()}>
              <Clock3 className="h-4 w-4" />
              Advance Time
            </button>
            <button type="button" onClick={() => setShowDowntimeForm((v) => !v)} className={actionButtonClass(true)}>
              <ScrollText className="h-4 w-4" />
              Log Downtime
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderShellBody() {
    const anyForm = showCalendarSwap || showAddEvent || showAdvanceTime || showDowntimeForm;
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {anyForm && (
          <div className="mb-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {showCalendarSwap && renderCalendarSwap()}
            {showAddEvent && renderAddEvent()}
            {showAdvanceTime && renderAdvanceTime()}
            {showDowntimeForm && renderDowntimeForm()}
          </div>
        )}
        {selectedEvent ? renderEventWorkspace() : renderDayWorkspace()}
      </div>
    );
  }

  function renderCalendarSwap() {
    return (
      <CalendarSwapCard
        currentPreset={cal.preset}
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
    );
  }

  function renderAddEvent() {
    return (
      <AddEventComposer
        calendar={cal}
        selectedDate={visibleDate ?? cal.currentDate}
        sessions={filteredSessions}
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
    );
  }

  function renderAdvanceTime() {
    return (
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
    );
  }

  function renderDowntimeForm() {
    return (
      <DowntimeComposer
        characters={characters ?? []}
        sessions={filteredSessions}
        selectedDate={visibleDate ?? cal.currentDate}
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
    );
  }

  function renderDayWorkspace() {
    return (
      <DayWorkspace
        dayEvents={dayEvents}
        sessions={filteredSessions}
        worldEntities={worldEntities ?? []}
        downtime={downtime ?? []}
        onSelectEvent={setSelectedEventId}
      />
    );
  }

  function renderEventWorkspace() {
    if (!selectedEvent) return null;
    return (
      <EventWorkspace
        campaignId={campaignId}
        calendar={cal}
        event={selectedEvent}
        sessions={filteredSessions}
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
    );
  }
}

// ── CalendarSetupState ────────────────────────────────────────

function CalendarSetupState({
  pending,
  onInit,
}: {
  pending: boolean;
  onInit: (preset: CalendarPresetType) => void;
}) {
  return (
    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] px-6">
      <div className={`${shellPanelClass} max-w-3xl p-8 text-center`}>
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

// ── CalendarSwapCard ──────────────────────────────────────────

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
        Swap to a different preset. This resets the calendar structure and in-world date.
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

// ── DayWorkspace ──────────────────────────────────────────────

function DayWorkspace({
  dayEvents,
  sessions,
  worldEntities,
  downtime,
  onSelectEvent,
}: {
  dayEvents: CalendarEvent[];
  sessions: Array<{ _id: string; title: string }>;
  worldEntities: Array<{ _id: string; name: string; type: string }>;
  downtime: Array<{ _id: string; name: string; durationDays: number; createdAt: string; status: string }>;
  onSelectEvent: (eventId: string) => void;
}) {
  const matchingDowntime = downtime.slice(0, 5);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      {renderEvents()}
      {renderContextShelf()}
    </div>
  );

  function renderEvents() {
    return (
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
    );
  }

  function renderContextShelf() {
    return (
      <div className="space-y-4">
        <ContextShelf
          title="World Context"
          body={
            dayEvents.length
              ? 'This day has active world movement attached to it.'
              : 'No direct world events are attached yet, so this can serve as downtime, travel, or a quiet span between sessions.'
          }
        />
        <ContextShelf title="Linked Sessions" body={resolveLinkedSessions(dayEvents, sessions)} />
        <ContextShelf title="Linked Places & People" body={resolveLinkedEntities(dayEvents, worldEntities)} />
        <ContextShelf
          title="Downtime Ledger"
          body={
            matchingDowntime.length
              ? matchingDowntime.map((item) => `${item.name} · ${item.durationDays} day${item.durationDays === 1 ? '' : 's'} · ${item.status}`).join('\n')
              : 'No downtime activities have been logged yet.'
          }
        />
      </div>
    );
  }
}

// ── EventWorkspace ────────────────────────────────────────────

function EventWorkspace({
  campaignId,
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
  campaignId: string;
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
  const linkedSession = sessions.find((s) => s._id === event.sessionId);
  const linkedEntity = worldEntities.find((e) => e._id === event.entityId);
  const matchingDowntime = event.eventType === 'downtime' ? downtime.filter((item) => item.name === event.name).slice(0, 1) : [];

  return (
    <div className="space-y-4">
      {renderEventHeader()}
      {renderEventContent()}
    </div>
  );

  function renderEventHeader() {
    return (
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
    );
  }

  function renderEventContent() {
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        {renderChronicleEntry()}
        {renderEventShelf()}
      </div>
    );
  }

  function renderChronicleEntry() {
    return (
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
    );
  }

  function renderEventShelf() {
    return (
      <div className="space-y-4">
        <ContextShelf title="Linked Session" body={linkedSession ? linkedSession.title : 'No session linked.'} />
        <ContextShelf
          title="Linked Entity"
          body={linkedEntity ? `${linkedEntity.type} — ${linkedEntity.name}` : 'No campaign entity linked.'}
        />
        <div className="rounded-[20px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
          <ArcLinker
            campaignId={campaignId}
            linkField="calendarEventIds"
            entityId={event.id}
            label="Related Arc"
          />
        </div>
        <ContextShelf
          title="Downtime Context"
          body={
            matchingDowntime.length
              ? matchingDowntime.map((item) => `${item.name} · ${item.durationDays} days · ${item.status}`).join('\n')
              : event.eventType === 'downtime'
                ? 'No matching downtime record was found for this calendar entry.'
                : 'This event is not marked as downtime.'
          }
        />
      </div>
    );
  }
}

// ── AddEventComposer ──────────────────────────────────────────

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
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Festival of Ashes" className={inputClass} />
        <div className="grid grid-cols-3 gap-3">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputClass}>
            {calendar.months.map((m, i) => (
              <option key={m.name} value={i}>{m.name}</option>
            ))}
          </select>
          <input value={day} onChange={(e) => setDay(Number(e.target.value))} inputMode="numeric" className={inputClass} />
          <input value={year} onChange={(e) => setYear(Number(e.target.value))} inputMode="numeric" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select value={eventType} onChange={(e) => setEventType(e.target.value as CalendarEventType)} className={inputClass}>
            {Object.entries(EVENT_TYPE_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as CalendarEventStatus)} className={inputClass}>
            {Object.entries(EVENT_STATUS_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input value={durationDays} onChange={(e) => setDurationDays(e.target.value)} inputMode="numeric" placeholder="Duration" className={inputClass} />
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className={inputClass}>
            <option value="">Link session</option>
            {sessions.map((s) => <option key={s._id} value={s._id}>{s.title}</option>)}
          </select>
          <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className={inputClass}>
            <option value="">Link entity</option>
            {worldEntities.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What is happening in the world on this date?" className={`${inputClass} resize-y`} />
        <label className="flex items-center gap-2 text-xs text-[hsl(30,14%,58%)]">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="accent-[hsl(42,72%,52%)]" />
          Repeats yearly
        </label>
        <button
          type="button"
          disabled={!name.trim() || pending}
          onClick={() =>
            onSubmit({
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
            })
          }
          className={actionButtonClass(true)}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Save Event
        </button>
      </div>
    </div>
  );
}

// ── QuickAdvanceCard ──────────────────────────────────────────

function QuickAdvanceCard({
  value,
  pending,
  onValueChange,
  onSubmit,
}: {
  value: string;
  pending: boolean;
  onValueChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-[20px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Advance Time</p>
      <div className="mt-3 space-y-3">
        <input value={value} onChange={(e) => onValueChange(e.target.value)} inputMode="numeric" placeholder="Days to pass" className={inputClass} />
        <button type="button" onClick={onSubmit} disabled={pending} className={actionButtonClass(true)}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}
          Advance by {value || '0'} day{value === '1' ? '' : 's'}
        </button>
      </div>
    </div>
  );
}

// ── DowntimeComposer ──────────────────────────────────────────

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
      participantId: string;
      participantType: DowntimeParticipantType;
      name: string;
      type?: 'crafting' | 'training' | 'carousing' | 'research' | 'working' | 'recuperating' | 'other';
      description?: string;
      durationDays?: number;
      links?: { sessionId?: string };
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
        <select value={characterId} onChange={(e) => setCharacterId(e.target.value)} className={inputClass}>
          <option value="">Choose character</option>
          {characters.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Research at the Athenaeum" className={inputClass} />
        <div className="grid grid-cols-2 gap-3">
          <input value={durationDays} onChange={(e) => setDurationDays(e.target.value)} inputMode="numeric" placeholder="Days" className={inputClass} />
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className={inputClass}>
            <option value="">Link session</option>
            {sessions.map((s) => <option key={s._id} value={s._id}>{s.title}</option>)}
          </select>
        </div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What is the party doing during this downtime block?" className={`${inputClass} resize-y`} />
        <button
          type="button"
          disabled={!characterId || !name.trim() || pending}
          onClick={() =>
            onSubmit({
              downtimeData: {
                participantId: characterId,
                participantType: 'character',
                name: name.trim(),
                type: 'other',
                description: description.trim() || undefined,
                durationDays: Number.parseInt(durationDays, 10) || 1,
                links: sessionId ? { sessionId } : undefined,
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

// ── Small components ──────────────────────────────────────────

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
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${tone}`}>
      {EVENT_STATUS_LABELS[event.status ?? 'upcoming']}
    </span>
  );
}


function DetailBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-1 text-xs text-[hsl(212,34%,74%)]">
      {children}
    </span>
  );
}

// ── Pure helpers ──────────────────────────────────────────────

function actionButtonClass(accent = false) {
  return `inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
    accent
      ? 'border-[hsla(42,72%,52%,0.34)] bg-[hsla(42,72%,42%,0.16)] text-[hsl(42,82%,78%)] hover:bg-[hsla(42,72%,42%,0.22)]'
      : 'border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] text-[hsl(212,34%,74%)] hover:bg-[hsla(220,18%,16%,0.9)]'
  }`;
}

function formatDateMain(calendar: CampaignCalendar, date: { year: number; month: number; day: number }) {
  const month = calendar.months[date.month]?.name ?? `Month ${date.month + 1}`;
  return `Day ${date.day}, ${month}, Year ${date.year}`;
}

function ordinalSuffix(n: number) {
  const v = n % 100;
  const s = v >= 11 && v <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${s}`;
}


function formatDateShort(calendar: CampaignCalendar, date: { year: number; month: number; day: number }) {
  const month = calendar.months[date.month]?.name ?? `Month ${date.month + 1}`;
  return `${date.day} ${month}, ${date.year}`;
}

function getDayOfWeek(calendar: CampaignCalendar, year: number, month: number, day: number) {
  let total = 0;
  const daysPerYear = calendar.months.reduce((sum, m) => sum + m.days, 0);
  // Year 1 is the epoch — Year 1, Month 1, Day 1 → weekday 0
  total += (year - 1) * daysPerYear;
  for (let i = 0; i < month; i += 1) total += calendar.months[i].days;
  total += day - 1;
  return calendar.weekdays.length ? ((total % calendar.weekdays.length) + calendar.weekdays.length) % calendar.weekdays.length : 0;
}

function deriveSeason(monthIndex: number, totalMonths: number) {
  const quarter = Math.floor((monthIndex / Math.max(totalMonths, 1)) * 4);
  return ['Deep Winter', 'Springrise', 'High Summer', 'Harvestfall'][quarter] ?? 'Turning Season';
}


function resolveLinkedSessions(events: CalendarEvent[], sessions: Array<{ _id: string; title: string }>) {
  const titles = events
    .map((e) => sessions.find((s) => s._id === e.sessionId)?.title)
    .filter((v): v is string => Boolean(v));
  return titles.length ? titles.join('\n') : 'No sessions are linked to this date.';
}

function resolveLinkedEntities(events: CalendarEvent[], worldEntities: Array<{ _id: string; name: string; type: string }>) {
  const labels = events
    .map((e) => worldEntities.find((w) => w._id === e.entityId))
    .filter((v): v is { _id: string; name: string; type: string } => Boolean(v))
    .map((w) => `${w.type} — ${w.name}`);
  return labels.length ? labels.join('\n') : 'No locations, NPCs, factions, or quests are linked to this date.';
}
