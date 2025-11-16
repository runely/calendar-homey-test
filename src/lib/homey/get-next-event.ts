import type { Dayjs } from "dayjs";

import { dayjsIfy } from "../dayjs-fns";

import type { IcalCalendar } from "../../types/IcalCalendar";
import type { IcalCalendarEvent } from "../../types/IcalCalendarEvent";
import type { IcalCalendarNextEvent } from "../../types/IcalCalendarNextEvent";

export const getNextEvent = (calendars: IcalCalendar[], timezone: string | undefined): IcalCalendarNextEvent | null => {
  let minutesUntilStart: number = 1057885015800000;
  let nextEvent: IcalCalendarNextEvent | null = null;
  const now: Dayjs = dayjsIfy(new Date(), timezone);

  calendars.forEach((calendar: IcalCalendar) => {
    calendar.events.forEach((event: IcalCalendarEvent) => {
      const startDiff: number = Math.round(event.start.diff(now, 'minutes', true));
      const endDiff: number = Math.round(event.end.diff(now, 'minutes', true));

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
}
