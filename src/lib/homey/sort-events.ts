import type { Calendar, CalendarEvent } from "../../types/IcalCalendar";

const sortEvents = (a: CalendarEvent, b: CalendarEvent) => {
  return a.start.diff(b.start).milliseconds;
};

export const sortCalendars = (calendars: Calendar[]): Calendar[] => {
  return calendars.map((calendar: Calendar) => {
    const sortedEvents: CalendarEvent[] = calendar.events.sort(sortEvents);

    return { ...calendar, events: sortedEvents };
  });
};

export const sortCalendarEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  return events.sort(sortEvents);
};
