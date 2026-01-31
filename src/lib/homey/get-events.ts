import { Blob } from "node:buffer";
import { join } from "node:path";
import nodeIcal, { type CalendarComponent, type CalendarResponse } from "node-ical";
import { debug, error, info, warn } from "../../config.js";
import type { Calendar, CalendarEvent } from "../../types/IcalCalendar";
import type { IcalCalendarImport } from "../../types/IcalCalendarImport";
import { downloadIcsFile } from "../debug/download-ics-file.js";
import { saveIcsFile } from "../debug/save-ics-file.js";
import { getActiveEvents } from "./get-active-events.js";

const createDateFilename = (name: string, date: Date): string => {
  return `${name}_${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
};

const printEventsByIndex = (printEventByIndex: number, values: CalendarComponent[]): void => {
  if (printEventByIndex > values.length) {
    warn(`Requested event index (${printEventByIndex}) is greater than event length (${values.length}) present in calendar file`);
    return;
  }

  info(`Print of event on index ${printEventByIndex}`);
  const value: CalendarComponent | undefined = values[printEventByIndex];
  if (value === undefined) {
    warn(`Requested event on index (${printEventByIndex}) was undefined`);
    return;
  }

  console.dir(value);
};

const printEventsByUids = (data: CalendarResponse, values: CalendarComponent[], printEventByUIDs: string[]): void => {
  const lowerCasedKeys: string[] = Object.keys(data).map((k: string) => k.toLowerCase());

  for (const uid of printEventByUIDs) {
    const lowerCasedUID: string = uid.toLowerCase();

    if (!lowerCasedKeys.includes(lowerCasedUID)) {
      warn(`Requested event by UID (${uid}) is not present in calendar file`);
      continue;
    }

    info(`Print of event by UID ${uid}`);
    const eventIndex: number = lowerCasedKeys.findIndex((k: string) => k === lowerCasedUID);
    if (eventIndex === -1) {
      warn(`Key (${lowerCasedUID}) is not present in calendar file`);
      continue;
    }

    const value: CalendarComponent | undefined = values[eventIndex];
    if (value === undefined) {
      warn(`Event on index ${eventIndex} in calendar file was undefined`);
      continue;
    }

    console.dir(value);
  }
};

export const getEvents = async (calendarsItem: IcalCalendarImport): Promise<Calendar | null> => {
  const calendar: Calendar = {
    calendarName: "N/A",
    events: []
  };

  // get ical events
  const { name, eventLimit, options, tz, logProperties } = calendarsItem;
  let { uri } = calendarsItem;
  const isLocalFile: boolean = (options.isLocalFile !== undefined && options.isLocalFile) || false;

  if (uri === "") {
    warn(`getEvents: Calendar '${name}' has empty uri. Skipping...`);
    return null;
  }

  if (!isLocalFile && !uri.includes("http://") && !uri.includes("https://") && !uri.includes("webcal://")) {
    warn(`getEvents: Uri for calendar '${name}' is invalid. Skipping...`);
    return null;
  }

  if (uri.indexOf("webcal://") === 0) {
    uri = uri.replace("webcal://", "https://");
    info(`getEvents: Calendar '${name}': webcal found and replaced with https://`);
  }

  info(`getEvents: Getting events (${eventLimit.value} ${eventLimit.type} ahead) for calendar '${name}' (${uri}) (${tz})`);

  try {
    const d: Date = new Date();

    if (!isLocalFile && options.downloadIcs) {
      warn(`Trying to download '${name}' from '${uri}'`);
      const icsData: string | null = await downloadIcsFile(name, uri);
      if (icsData !== null) {
        const icsPath: string = join(import.meta.dirname, `../../../contents/ics/${createDateFilename(name, d)}.ics`);
        warn(`About to save ics file to path '${icsPath}'`);
        saveIcsFile(icsData, icsPath);
        warn("Ics file saved");
      }
    }

    const data: CalendarResponse = !isLocalFile ? await nodeIcal.fromURL(uri) : nodeIcal.parseFile(uri);

    debug(`nodeIcal(${!isLocalFile ? "URL" : "FILE"}): Success getting data via node-ical`);

    if (options.saveAll) {
      const rawPath: string = join(
        import.meta.dirname,
        `../../../contents/raw/${createDateFilename(name, d)}.${typeof data === "object" ? "json" : "ics"}`
      );
      warn(`About to save file to path '${rawPath}'`);
      saveIcsFile(typeof data === "object" ? JSON.stringify(data, null, 2) : data, rawPath);
      warn("Raw file saved");
    }

    if (options.printAllEvents) {
      info("Print of all events:");
      console.dir(data);
    }

    const values: CalendarComponent[] = Object.values(data);

    if (options.printEventByIndex !== undefined && options.printEventByIndex > -1) {
      printEventsByIndex(options.printEventByIndex, values);
    }

    if (Array.isArray(options.printEventByUIDs) && options.printEventByUIDs.length > 0) {
      printEventsByUids(data, values, options.printEventByUIDs);
    }

    const activeEvents: CalendarEvent[] = getActiveEvents(
      tz,
      data,
      eventLimit,
      logProperties,
      options.showLuxonDebugInfo || false,
      options.printOccurrences || false
    );
    const totalEventsSize: number = new Blob([JSON.stringify(data)]).size / 1000;

    info(
      `getEvents: Events for calendar '${name}' found. Event count: ${activeEvents.length}. Total event count for calendar: ${Object.keys(data).length}. Total event size for calendar: ${totalEventsSize}KB\n`
    );
    calendar.calendarName = name;
    calendar.events = activeEvents;

    if (options.saveActive) {
      const activePath: string = join(
        import.meta.dirname,
        `../../../contents/active/${createDateFilename(name, d)}.${typeof activeEvents === "object" ? "json" : "ics"}`
      );
      warn(`About to save file to path '${activePath}'`);
      saveIcsFile(typeof activeEvents === "object" ? JSON.stringify(activeEvents, null, 2) : activeEvents, activePath);
      warn("Active file saved");
    }
  } catch (_error) {
    if (_error instanceof Error) {
      error(`getEvents: Failed to get events for calendar '${name}' '${uri}' :`, _error.message, "\n");
      console.table(_error.stack);

      return calendar;
    }

    error(`getEvents: Failed to get events for calendar '${name}' '${uri}' :`, _error, "\n");
  }

  return calendar;
};
