/**
 * Homey (SDK3) always runs in UTC. So to run this as close to Homey as possible, launch this with "env TZ=UTC node raw.js" or call the raw script "npm run raw"
 *
 * Remember that "Customized Time Zone" is converted to local timezone which for Homey (SDK3) will be UTC and Africa/Abidjan
 *
 * IcalCalendar will apply the timezone where the Homey is located (chosen in Homey app -> More -> Settings -> Position) to get the correct time for the event
 *
 * However, if an event uses Customized Time Zone, node-ical will treat this as UTC, and IcalCalendar will apply the timezone from the Homey. This will probably not be correct
 *
 * Therefore, when IcalCalendar finds Africa/Abidjan as start tz and Etc/UTC as DTStamp tz, the event will be flagged as not to have the Homey timezone applied. Meaning that the raw time shown in the ics file is what will be used
 *
 */
import nodeIcal, { type CalendarComponent, type CalendarResponse } from "node-ical";
import { debug, error, getCalendars, warn } from "./config.js";
import { getActiveEvents } from "./lib/homey/get-active-events.js";
import type { IcalCalendarEvent } from "./types/IcalCalendarEvent";
import type { IcalCalendarImport } from "./types/IcalCalendarImport";

(async () => {
  /*const nodeIcal = require('node-ical')
  const getActiveEvents = require('./lib/calendarHomey/get-active-events')

  const { warn, error, debug, getCalendars: getCalendars } = require('./config')*/

  const calendars: IcalCalendarImport[] = getCalendars();
  if (calendars.length === 0) {
    error("getEvents: Add at least one calendar in calendar.json");
    process.exit(1);
  }
  debug(`raw: Printing ${calendars.length} raw calendars\n`);

  // OPTIONAL to fill out. If filled out, this is the only event which will be logged to console. You should also read "node-ical.update.txt" if you want timezone info for this UID
  const showOnlyTheseUids: string[] = [];

  for await (const calendar of calendars) {
    warn("Fetching data for", calendar.name);
    const data: CalendarResponse = calendar.options.isLocalFile ? nodeIcal.parseFile(calendar.uri) : await nodeIcal.fromURL(calendar.uri);

    let rawEvents: CalendarComponent[];
    if (showOnlyTheseUids.length > 0) {
      rawEvents = Object.values(data).filter((ev: CalendarComponent) => ev.type === "VEVENT" && showOnlyTheseUids.includes(ev.uid));
      warn("Showing only raw events for UIDs:", showOnlyTheseUids);
      console.log(rawEvents);
    } else {
      console.log(data);
    }

    const activeData: IcalCalendarEvent[] = getActiveEvents(calendar.tz, data, calendar.eventLimit, calendar.logProperties, showOnlyTheseUids);

    let activeEvents: IcalCalendarEvent[];
    if (showOnlyTheseUids.length > 0) {
      activeEvents = activeData.filter((ev: IcalCalendarEvent) => showOnlyTheseUids.find((uid: string) => ev.uid.startsWith(uid)));
      warn("Showing only active events starting with these UIDs:", showOnlyTheseUids);
      console.log(activeEvents);
    } else {
      console.log(activeData);
    }
  }
})();
