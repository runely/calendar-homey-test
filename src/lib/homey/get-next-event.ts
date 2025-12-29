import { DateTime } from "luxon";

import type { Valid } from "luxon/src/_util";
import type { IcalCalendar } from "../../types/IcalCalendar";
import type { IcalCalendarEvent } from "../../types/IcalCalendarEvent";
import type { IcalCalendarNextEvent } from "../../types/IcalCalendarNextEvent";

import { luxGetZonedDateTime } from "../luxon-fns.js";

export const getNextEvent = (calendars: IcalCalendar[], timezone: string | undefined): IcalCalendarNextEvent | null => {
  let minutesUntilStart: number = 1057885015800000;
  let nextEvent: IcalCalendarNextEvent | null = null;
  const now: DateTime<Valid> = luxGetZonedDateTime(DateTime.local(), timezone || "UTC");

  calendars.forEach((calendar: IcalCalendar) => {
    calendar.events.forEach((event: IcalCalendarEvent) => {
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
