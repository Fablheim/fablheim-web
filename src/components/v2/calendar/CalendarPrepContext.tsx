import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useCampaign } from '@/hooks/useCampaigns';
import { useNavigationBus } from '../NavigationBusContext';
import type { CalendarEvent, CampaignCalendar } from '@/types/campaign';

// ── Helpers (pure, shared with right panel and center stage) ──

export function getEventsForDate(calendar: CampaignCalendar, year: number, month: number, day: number) {
  return calendar.events
    .filter((e) => e.month === month && e.day === day && (e.year === year || e.recurring))
    .sort(compareCalendarEvents);
}

export function compareCalendarEvents(a: CalendarEvent, b: CalendarEvent) {
  if (a.day !== b.day) return a.day - b.day;
  return a.name.localeCompare(b.name);
}

export function getUpcomingEvents(calendar: CampaignCalendar) {
  return [...calendar.events].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  });
}

export function stepMonth(calendar: CampaignCalendar, year: number, month: number, delta: number) {
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

export function toAbsoluteDay(calendar: CampaignCalendar, date: { year: number; month: number; day: number }) {
  const daysPerYear = calendar.months.reduce((sum, m) => sum + m.days, 0);
  let total = date.year * daysPerYear;
  for (let i = 0; i < date.month; i += 1) total += calendar.months[i].days;
  return total + date.day;
}

export function diffInDays(
  calendar: CampaignCalendar,
  from: { year: number; month: number; day: number },
  to: { year: number; month: number; day: number },
) {
  return toAbsoluteDay(calendar, to) - toAbsoluteDay(calendar, from);
}

export function getDayOfWeek(calendar: CampaignCalendar, year: number, month: number, day: number) {
  let total = 0;
  const daysPerYear = calendar.months.reduce((sum, m) => sum + m.days, 0);
  // Year 1 is the epoch — Year 1, Month 1, Day 1 → weekday 0
  total += (year - 1) * daysPerYear;
  for (let i = 0; i < month; i += 1) total += calendar.months[i].days;
  total += day - 1;
  return calendar.weekdays.length ? ((total % calendar.weekdays.length) + calendar.weekdays.length) % calendar.weekdays.length : 0;
}

// ── Context shape ─────────────────────────────────────────────

interface CalendarPrepContextValue {
  calendar: CampaignCalendar | null;

  selectedDate: { year: number; month: number; day: number } | null;
  setSelectedDate: (date: { year: number; month: number; day: number } | null) => void;

  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;

  viewCursor: { year: number; month: number } | null;
  setViewCursor: (cursor: { year: number; month: number } | null) => void;

  // derived
  visibleDate: { year: number; month: number; day: number } | null;
  visibleMonth: number;
  visibleYear: number;
  dayEvents: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
  currentMonthEvents: CalendarEvent[];
  nextMajorEvent: CalendarEvent | null;
}

const CalendarPrepContext = createContext<CalendarPrepContextValue | null>(null);

export function useCalendarPrepContext() {
  const ctx = useContext(CalendarPrepContext);
  if (!ctx) throw new Error('useCalendarPrepContext must be used within CalendarPrepProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────

interface CalendarPrepProviderProps {
  campaignId: string;
  children: ReactNode;
}

export function CalendarPrepProvider({ campaignId, children }: CalendarPrepProviderProps) {
  const { data: campaign } = useCampaign(campaignId);
  const calendar = campaign?.calendar ?? null;

  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [viewCursor, setViewCursor] = useState<{ year: number; month: number } | null>(null);

  // Consume pending navigation from the bus
  const { pending: pendingNav, consumeNavigation } = useNavigationBus();
  useEffect(() => {
    const targetId = consumeNavigation('calendar');
    if (targetId) setSelectedEventId(targetId);
  }, [pendingNav, consumeNavigation]);

  const visibleDate = useMemo(() => {
    if (!calendar) return null;
    return selectedDate ?? calendar.currentDate;
  }, [calendar, selectedDate]);

  const visibleMonth = viewCursor?.month ?? visibleDate?.month ?? 0;
  const visibleYear = viewCursor?.year ?? visibleDate?.year ?? 0;

  const dayEvents = useMemo(() => {
    if (!calendar || !visibleDate) return [];
    return getEventsForDate(calendar, visibleDate.year, visibleDate.month, visibleDate.day);
  }, [calendar, visibleDate]);

  const selectedEvent = useMemo(() => {
    if (!calendar || !selectedEventId) return null;
    return calendar.events.find((e) => e.id === selectedEventId) ?? null;
  }, [calendar, selectedEventId]);

  const currentMonthEvents = useMemo(() => {
    if (!calendar) return [];
    return calendar.events
      .filter((e) => e.month === visibleMonth && (e.year === visibleYear || e.recurring))
      .sort(compareCalendarEvents);
  }, [calendar, visibleMonth, visibleYear]);

  const nextMajorEvent = useMemo(() => {
    if (!calendar) return null;
    return (
      getUpcomingEvents(calendar).find(
        (e) => e.eventType === 'deadline' || e.eventType === 'festival' || e.eventType === 'session',
      ) ?? null
    );
  }, [calendar]);

  const value: CalendarPrepContextValue = {
    calendar,
    selectedDate,
    setSelectedDate,
    selectedEventId,
    setSelectedEventId,
    viewCursor,
    setViewCursor,
    visibleDate,
    visibleMonth,
    visibleYear,
    dayEvents,
    selectedEvent,
    currentMonthEvents,
    nextMajorEvent,
  };

  return <CalendarPrepContext.Provider value={value}>{children}</CalendarPrepContext.Provider>;
}
