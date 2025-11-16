import type { Dayjs } from "dayjs";

import { dayjsIfy } from "../dayjs-fns";

import type { IcalCalendar } from "../../types/IcalCalendar";
import type { IcalCalendarEvent, IcalCalendarEventWithName } from "../../types/IcalCalendarEvent";

import { sortCalendarEvents } from './sort-events';

export const getEventsToday = (calendars: IcalCalendar[], timezone: string | undefined): IcalCalendarEventWithName[] => {
  const eventsToday: IcalCalendarEventWithName[] = [];
  const now: Dayjs = dayjsIfy(new Date(), timezone);

  calendars.forEach((calendar: IcalCalendar) => {
    calendar.events.forEach((event: IcalCalendarEvent) => {
      const startDiff: number = now.diff(event.start);
      const endDiff: number = now.diff(event.end);
      const startIsSameDay: boolean = event.start.isSame(now, 'day');

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
}
