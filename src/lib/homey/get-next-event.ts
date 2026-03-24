import { DateTime } from "luxon";

import type { Calendar, CalendarEvent, NextEvent } from "../../types/IcalCalendar.js";

import { getZonedDateTime } from "../luxon-fns.js";

export const getNextEvent = (calendars: Calendar[], timezone: string | undefined): NextEvent | null => {
  let minutesUntilStart: number = 1057885015800000;
  let nextEvent: NextEvent | null = null;
  const now: DateTime<true> = getZonedDateTime(DateTime.local(), timezone || "UTC");

  calendars.forEach((calendar: Calendar) => {
    calendar.events.forEach((event: CalendarEvent) => {
      const startDiff: number = Math.round(event.start.diff(now, "minutes").minutes);
      const endDiff: number = Math.round(event.end.diff(now, "minutes").minutes);

      if (startDiff >= 0 && startDiff < minutesUntilStart) {
        minutesUntilStart = startDiff;

        nextEvent = {
          calendarName: calendar.calendarName,
          endsIn: endDiff,
          event,
          startsIn: startDiff
        };
      }
    });
  });

  return nextEvent;
};
