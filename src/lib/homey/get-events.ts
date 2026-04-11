import { Blob } from "node:buffer";
import { join } from "node:path";
import nodeIcal, { type CalendarComponent, type CalendarResponse } from "node-ical";
import { debug, error, info, warn } from "../../config.js";
import type { Calendar, CalendarEvent } from "../../types/IcalCalendar.js";
import type { IcalCalendarImport } from "../../types/IcalCalendarImport.js";
import { downloadIcsFile } from "../debug/download-ics-file.js";
import { saveIcsFile } from "../debug/save-ics-file.js";
import { getActiveEvents } from "./get-active-events.js";
import { getFilteredIcsContent } from "./get-filtered-ics-content.js";

const createDateFilename = (name: string, date: Date): string => {
  return `${name}_${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
};

const getNodeIcalContent = async (
  filterIcs: boolean,
  filteredIcsContent: string | null,
  isLocalFile: boolean,
  uri: string
): Promise<CalendarResponse> => {
  if (filterIcs && filteredIcsContent) {
    info("getNodeIcalContent: Getting node-ical content from filtered ics content");
    return await nodeIcal.async.parseICS(filteredIcsContent);
  }

  if (!isLocalFile) {
    info("getNodeIcalContent: Getting node-ical content from url");
    return await nodeIcal.fromURL(uri);
  }

  info("getNodeIcalContent: Getting node-ical content from local file");
  return nodeIcal.parseFile(uri);
};

const printEventsByIndex = (printEventByIndex: number, values: (CalendarComponent | undefined)[]): void => {
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

const printEventsByUids = (data: CalendarResponse, values: (CalendarComponent | undefined)[], printEventByUIDs: string[]): void => {
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

  const filteredIcsContent: string | null = options.filterIcs
    ? await getFilteredIcsContent(uri, isLocalFile, eventLimit, options.eventStartThreshold)
    : null;

  if (options.filterIcs && !filteredIcsContent) {
    throw new Error("getFilteredIcsContent returned an empty ics string");
  }

  if (options.filterIcs && filteredIcsContent && options.saveFilteredIcs) {
    warn(`Trying to save filtered ICS '${name}' from '${uri}'`);
    const icsPath: string = join(import.meta.dirname, `../../../contents/ics/${createDateFilename(name, d)}_filtered.ics`);
    warn(`About to save filtered ics file to path '${icsPath}'`);
    saveIcsFile(filteredIcsContent, icsPath);
    warn("Filtered ics file saved");
  }

  try {
    const data: CalendarResponse = await getNodeIcalContent(options.filterIcs ?? false, filteredIcsContent, isLocalFile, uri);

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

    const values: (CalendarComponent | undefined)[] = Object.values(data);

    if (options.printAllEvents) {
      info("Print of all events:");
      console.dir(values.filter((v: CalendarComponent | undefined) => v !== undefined && v.type === "VEVENT"));
    }

    if (options.printEventByIndex !== undefined && options.printEventByIndex > -1) {
      printEventsByIndex(options.printEventByIndex, values);
    }

    if (Array.isArray(options.printEventByUIDs) && options.printEventByUIDs.length > 0) {
      printEventsByUids(data, values, options.printEventByUIDs);
    }

    const activeEvents: CalendarEvent[] = getActiveEvents(
      tz,
      values,
      eventLimit,
      logProperties,
      options.showLuxonDebugInfo || false,
      options.eventStartThreshold
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
