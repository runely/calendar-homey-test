import { DateTime } from "luxon";

import type { Valid } from "luxon/src/_util";
import type { Calendar, CalendarEvent, CalendarEventExtended } from "../../types/IcalCalendar";

import { getZonedDateTime } from "../luxon-fns.js";
import { sortCalendarEvents } from "./sort-events.js";

export const getEventsToday = (calendars: Calendar[], timezone: string | undefined): CalendarEventExtended[] => {
  const eventsToday: CalendarEventExtended[] = [];
  const now: DateTime<Valid> = getZonedDateTime(DateTime.local(), timezone || "UTC");

  calendars.forEach((calendar: Calendar) => {
    calendar.events.forEach((event: CalendarEvent) => {
      const startDiff: number = now.diff(event.start).milliseconds;
      const endDiff: number = now.diff(event.end).milliseconds;
      const startIsSameDay: boolean = event.start.hasSame(now, "day");

      const todayNotStartedYet: boolean = startDiff < 0 && startIsSameDay;
      const todayAlreadyStarted: boolean = startDiff > 0 && startIsSameDay && endDiff < 0;
      const startPastButNotStopped: boolean = startDiff > 0 && !startIsSameDay && endDiff < 0;
      if (todayNotStartedYet || todayAlreadyStarted || startPastButNotStopped) {
        eventsToday.push({ ...event, calendarName: calendar.calendarName });
      }
    });
  });

  sortCalendarEvents(eventsToday);
  return eventsToday;
};
