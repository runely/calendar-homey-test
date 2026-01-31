import { DateTime } from "luxon";

import type { Valid } from "luxon/src/_util";
import type { Calendar, CalendarEvent, CalendarEventExtended } from "../../types/IcalCalendar";

import { getZonedDateTime } from "../luxon-fns.js";
import { sortCalendarEvents } from "./sort-events.js";

export const getEventsTomorrow = (calendars: Calendar[], timezone: string | undefined): CalendarEventExtended[] => {
  const eventsTomorrow: CalendarEventExtended[] = [];
  const tomorrowStart: DateTime<Valid> = getZonedDateTime(DateTime.local(), timezone || "UTC")
    .plus({ day: 1 })
    .startOf("day");

  calendars.forEach((calendar: Calendar) => {
    calendar.events.forEach((event: CalendarEvent) => {
      const startDiff: number = tomorrowStart.diff(event.start).milliseconds;
      const endDiff: number = tomorrowStart.diff(event.end).milliseconds;
      const startIsSameDay: boolean = event.start.hasSame(tomorrowStart, "day");

      const tomorrowNotStartedYet: boolean = startDiff < 0 && startIsSameDay;
      const startPastButNotStopped: boolean = startDiff > 0 && !startIsSameDay && endDiff < 0;
      if (tomorrowNotStartedYet || startPastButNotStopped) {
        eventsTomorrow.push({ ...event, calendarName: calendar.calendarName });
      }
    });
  });

  sortCalendarEvents(eventsTomorrow);
  return eventsTomorrow;
};
