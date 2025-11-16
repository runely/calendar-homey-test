import type { Dayjs } from "dayjs";

import { dayjsIfy } from "../dayjs-fns";

import type { IcalCalendar } from "../../types/IcalCalendar";
import type { IcalCalendarEvent, IcalCalendarEventWithName } from "../../types/IcalCalendarEvent";

import { sortCalendarEvents } from './sort-events';

export const getEventsTomorrow = (calendars: IcalCalendar[], timezone: string | undefined): IcalCalendarEventWithName[] => {
  const eventsTomorrow: IcalCalendarEventWithName[] = [];
  const tomorrowStart: Dayjs = dayjsIfy(new Date(), timezone)
    .add(1, 'day')
    .startOf('day');

  calendars.forEach((calendar: IcalCalendar) => {
    calendar.events.forEach((event: IcalCalendarEvent) => {
      const startDiff: number = tomorrowStart.diff(event.start);
      const endDiff: number = tomorrowStart.diff(event.end);
      const startIsSameDay: boolean = event.start.isSame(tomorrowStart, 'day');

      const tomorrowNotStartedYet: boolean = startDiff < 0 && startIsSameDay;
      const startPastButNotStopped: boolean = startDiff > 0 && !startIsSameDay && endDiff < 0;
      if (tomorrowNotStartedYet || startPastButNotStopped) {
        eventsTomorrow.push({ ...event, calendarName: calendar.calendarName });
      }
    });
  });

  sortCalendarEvents(eventsTomorrow);
  return eventsTomorrow;
}
