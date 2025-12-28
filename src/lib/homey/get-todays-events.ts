import { DateTime } from "luxon";

import type { Valid } from "luxon/src/_util";
import type { IcalCalendar } from "../../types/IcalCalendar";
import type { IcalCalendarEvent, IcalCalendarEventWithName } from "../../types/IcalCalendarEvent";

import { luxGetZonedDateTime } from "../luxon-fns.js";
import { sortCalendarEvents } from "./sort-events.js";

export const getEventsToday = (calendars: IcalCalendar[], timezone: string | undefined): IcalCalendarEventWithName[] => {
  const eventsToday: IcalCalendarEventWithName[] = [];
  const now: DateTime<Valid> = luxGetZonedDateTime(DateTime.local(), timezone || "UTC"); // TODO: should timezone be local and not UTC?

  calendars.forEach((calendar: IcalCalendar) => {
    calendar.events.forEach((event: IcalCalendarEvent) => {
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
