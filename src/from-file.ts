import { debug, error, getCalendars, info, warn } from "./config.js";

import { getEvents } from "./lib/homey/get-events.js";
import { getNextEvent } from "./lib/homey/get-next-event.js";
import { getEventsToday } from "./lib/homey/get-todays-events.js";
import { getEventsTomorrow } from "./lib/homey/get-tomorrows-events.js";
import { sortCalendars } from "./lib/homey/sort-events.js";
import type { Calendar, CalendarEvent, CalendarEventExtended, NextEvent } from "./types/IcalCalendar";
import type { IcalCalendarImport } from "./types/IcalCalendarImport";

const valInArr = (val: string, arr: string[]): boolean => {
  return arr.indexOf(val) > -1;
};

(async (): Promise<void> => {
  const args: string[] = process.argv.slice(2);

  const scriptStart: number = Date.now();

  const calendars: IcalCalendarImport[] = await getCalendars();

  if (calendars.length === 0) {
    info("getEvents: Add at least one calendar in calendar.json");
    process.exit(1);
  }
  info(`fromFile: Getting ${calendars.length} calendars\n`);

  let timezone: string = "";
  const calendarsEvents: Calendar[] = [];

  for await (const calendar of calendars) {
    const calendarEvents: Calendar | null = await getEvents(calendar);
    if (calendarEvents === null) {
      warn(`No calendar events found for '${calendar.name}'`);
      continue;
    }

    if (calendarEvents.events.length === 0) {
      warn(`No events found in calendar events found for '${calendar.name}'`);
      continue;
    }

    if (timezone === "") {
      timezone = calendar.tz;
    }

    calendarsEvents.push(calendarEvents);
    if (calendar.options.showMeetingUrls) {
      calendarEvents.events.forEach((event: CalendarEvent) => {
        if (event.meetingUrl) {
          debug(`\nMeeting URL: '${calendarEvents.calendarName}' -- '${event.summary}' -- '${event.meetingUrl}'\n`);
        }
      });
    }
  }

  if (calendarsEvents.length === 0) {
    error("No calendars returned... Aborting...");
    process.exit(-1);
  }

  sortCalendars(calendarsEvents);

  try {
    const totalCalendarsEvents: number = calendarsEvents.reduce((previousValue: number, currentValue: Calendar): number => {
      return previousValue + currentValue.events.length;
    }, 0);
    debug(`Total calendar events: ${totalCalendarsEvents}`);

    const scriptGetEvents: number = Date.now();
    debug(`\tSpent '${(scriptGetEvents - scriptStart) / 1000}' seconds to retrieve calendars`);

    // get next event
    if (valInArr("nextEvent", args)) {
      const nextEvent: NextEvent | null = getNextEvent(calendarsEvents, timezone);
      if (nextEvent === null) {
        info("\nNext event: null");
      } else {
        info("\nNext event:", JSON.stringify(nextEvent, null, 2));
      }
    }

    // get todays events
    if (valInArr("eventsToday", args)) {
      const eventsToday: CalendarEventExtended[] = getEventsToday(calendarsEvents, timezone);
      info("\nEvents today:", JSON.stringify(eventsToday, null, 2));
    }

    // get tomorrows events
    if (valInArr("eventsTomorrow", args)) {
      const eventsTomorrow: CalendarEventExtended[] = getEventsTomorrow(calendarsEvents, timezone);
      info("\nEvents tomorrow:", JSON.stringify(eventsTomorrow, null, 2));
    }

    // scriptEnd
    if (valInArr("nextEvent", args) || valInArr("eventsToday", args) || valInArr("eventsTomorrow", args)) {
      const scriptEnd: number = Date.now();
      debug(`\nApp ran for '${(scriptEnd - scriptStart) / 1000}' seconds`);
    }
  } catch (_error) {
    error("ERROR: ", _error);

    // scriptEnd
    const scriptEnd: number = Date.now();
    debug(`\tApp ran for '${(scriptEnd - scriptStart) / 1000}' seconds`);
  }
})();
