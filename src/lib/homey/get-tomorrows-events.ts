import { DateTime } from "luxon";

import type { Valid } from "luxon/src/_util";
import type { IcalCalendar } from "../../types/IcalCalendar";
import type { IcalCalendarEvent, IcalCalendarEventWithName } from "../../types/IcalCalendarEvent";

import { luxGetZonedDateTime } from "../luxon-fns.js";
import { sortCalendarEvents } from "./sort-events.js";

export const getEventsTomorrow = (calendars: IcalCalendar[], timezone: string | undefined): IcalCalendarEventWithName[] => {
  const eventsTomorrow: IcalCalendarEventWithName[] = [];
  const tomorrowStart: DateTime<Valid> = luxGetZonedDateTime(DateTime.local(), timezone || "UTC")
    .plus({ day: 1 })
    .startOf("day"); // TODO: should timezone be local and not UTC?

  calendars.forEach((calendar: IcalCalendar) => {
    calendar.events.forEach((event: IcalCalendarEvent) => {
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
