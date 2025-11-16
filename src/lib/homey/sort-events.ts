import type { IcalCalendar } from "../../types/IcalCalendar";
import type { IcalCalendarEvent } from "../../types/IcalCalendarEvent";

const sortEvents = (a: IcalCalendarEvent, b: IcalCalendarEvent) => {
  return a.start.diff(b.start);
  //return a.start - b.start
}

export const sortCalendars = (calendars: IcalCalendar[]): IcalCalendar[] => {
  return calendars.map((calendar: IcalCalendar) => {
    const sortedEvents: IcalCalendarEvent[] = calendar.events.sort(sortEvents);

    return { ...calendar, events: sortedEvents };
  });
}

export const sortCalendarEvents = (events: IcalCalendarEvent[]): IcalCalendarEvent[] => {
  return events.sort(sortEvents);
}
