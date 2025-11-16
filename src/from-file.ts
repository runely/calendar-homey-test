import { getCalendars, debug, info, error, warn } from "./config";

import { getEvents } from "./lib/homey/get-events";
import { getNextEvent } from "./lib/homey/get-next-event";
import { getEventsToday } from "./lib/homey/get-todays-events";
import { getEventsTomorrow } from "./lib/homey/get-tomorrows-events";
import { sortCalendars } from "./lib/homey/sort-events";

import type { IcalCalendarImport } from "./types/IcalCalendarImport";
import type { IcalCalendar } from "./types/IcalCalendar";
import type { IcalCalendarEvent, IcalCalendarEventWithName } from "./types/IcalCalendarEvent";
import type { IcalCalendarNextEvent } from "./types/IcalCalendarNextEvent";

(async (): Promise<void> => {
  const args: string[] = process.argv.slice(2);

  const scriptStart: number = new Date().getTime()
  
  const calendars: IcalCalendarImport[] = getCalendars()

  if (calendars.length === 0) {
    info('getEvents: Add at least one calendar in calendar.json');
    process.exit(1);
  }
  info(`fromFile: Getting ${calendars.length} calendars\n`);

  let timezone: string | undefined = undefined;
  const calendarsEvents: IcalCalendar[] = [];

  for await (const calendar of calendars) {
    const calendarEvents: IcalCalendar | null = await getEvents(calendar);
    if (calendarEvents === null) {
      warn(`No calendar events found for '${calendar.name}'`);
      continue;
    }

    if (calendarEvents.events.length === 0) {
      warn(`No events found in calendar events found for '${calendar.name}'`);
      continue;
    }

    timezone ??= calendar.tz;

    calendarsEvents.push(calendarEvents);
    if (calendar.options.showMeetingUrls) {
      calendarEvents.events.forEach((event: IcalCalendarEvent) => {
        if (event.meetingUrl) {
          debug(`\nMeeting URL: '${calendarEvents.calendarName}' -- '${event.summary}' -- '${event.meetingUrl}'\n`);
        }
      });
    }
  }

  if (calendarsEvents.length === 0) {
    error('No calendars returned... Aborting...');
    process.exit(-1);
  }

  sortCalendars(calendarsEvents);

  try {
    const totalCalendarsEvents: number = calendarsEvents.reduce((previousValue: number, currentValue: IcalCalendar): number => {
      return previousValue + currentValue.events.length;
    }, 0);
    debug(`Total calendar events: ${totalCalendarsEvents}`);

    const scriptGetEvents: number = new Date().getTime();
    debug(`\tSpent '${(scriptGetEvents - scriptStart) / 1000}' seconds to retrieve calendars`);

    // get next event
    if ('nextEvent' in args) {
      const nextEvent: IcalCalendarNextEvent | null = getNextEvent(calendarsEvents, timezone);
      if (nextEvent === null) {
        info('\nNext event: null');
      } else {
        info('\nNext event:', JSON.stringify(nextEvent, null, 2));
      }
    }

    // get todays events
    if ('eventsToday' in args) {
      const eventsToday: IcalCalendarEventWithName[] = getEventsToday(calendarsEvents, timezone);
      info('\nEvents today:', JSON.stringify(eventsToday, null, 2));
    }

    // get tomorrows events
    if ('eventsTomorrow' in args) {
      const eventsTomorrow: IcalCalendarEventWithName[] = getEventsTomorrow(calendarsEvents, timezone);
      info('\nEvents tomorrow:', JSON.stringify(eventsTomorrow, null, 2));
    }

    // scriptEnd
    if ('nextEvent' in args || 'eventsToday' in args || 'eventsTomorrow' in args) {
      const scriptEnd: number = new Date().getTime();
      debug(`\nApp ran for '${(scriptEnd - scriptStart) / 1000}' seconds`);
    }
  } catch (_error) {
    error('ERROR: ', _error);

    // scriptEnd
    const scriptEnd: number = new Date().getTime();
    debug(`\tApp ran for '${(scriptEnd - scriptStart) / 1000}' seconds`);
  }
})();
