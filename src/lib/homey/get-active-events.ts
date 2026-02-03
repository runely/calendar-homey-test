import deepClone from "lodash.clonedeep";
import { DateTime, type DateTimeMaybeValid, Duration } from "luxon";
import type { Valid } from "luxon/src/_util";
import type { CalendarComponent, CalendarResponse, DateWithTimeZone, ParameterValue, VEvent } from "node-ical";

import { debug, error, info, warn } from "../../config.js";

import type { BusyStatus, CalendarEvent, IcalOccurence } from "../../types/IcalCalendar";
import type { IcalCalendarEventLimit, IcalCalendarLogProperty } from "../../types/IcalCalendarImport";

import { getDateTime, getZonedDateTime, guessTimezone } from "../luxon-fns.js";

import { extractFreeBusy } from "./extract-freebusy.js";
import { extractMeetingUrl } from "./extract-meeting-url.js";
import { hasData } from "./has-data.js";

const untilRegexp = /UNTIL=(\d{8}T\d{6})/;

const createDateWithTimeZone = (date: Date, timeZone: string | undefined): DateWithTimeZone => {
  return Object.defineProperty(date, "tz", {
    value: timeZone,
    enumerable: false,
    configurable: true,
    writable: false
  }) as DateWithTimeZone;
};

const convertToText = (prop: string, value: ParameterValue, uid: string): string => {
  if (value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  warn(`getActiveEvents/convertToText - '${prop}' has params. Using 'val' of ParameterValue '${uid}':`, value);
  return value.val;
};

const createNewEvent = (event: VEvent, start: DateTime<true>, end: DateTime<true>): CalendarEvent => {
  // dig out free/busy status (if any)
  const freeBusy: BusyStatus | undefined = extractFreeBusy(event);

  const description: string = convertToText("description", event.description, event.uid);

  // dig out a meeting url (if any)
  const meetingUrl: string = extractMeetingUrl(description) || "";

  const calendarEvent: CalendarEvent = {
    start: start.setLocale("nb-NO"),
    dateType: event.datetype,
    end: end.setLocale("nb-NO"),
    uid: event.uid,
    description: convertToText("description", event.description, event.uid),
    location: convertToText("location", event.location, event.uid),
    summary: convertToText("summary", event.summary, event.uid),
    fullDayEvent: event.datetype === "date"
  };

  // TODO: Any point in adding created date?

  if (freeBusy) {
    calendarEvent.freeBusy = freeBusy;
  }

  if (meetingUrl) {
    calendarEvent.meetingUrl = meetingUrl;
  }

  return calendarEvent;
};

const filterOutUnwantedEvents = (events: CalendarComponent[], eventLimitStart: DateTime<Valid>, eventLimitEnd: DateTime<Valid>): VEvent[] => {
  const eventLimitStartMillis: number = eventLimitStart.toUTC().toJSDate().getTime();
  const eventLimitEndMillis: number = eventLimitEnd.toUTC().toJSDate().getTime();

  // statistics only
  let nonVEvents: number = 0;
  let regularInvalidVEvents: number = 0;
  let regularVEventsPast: number = 0;
  let regularVEventsInside: number = 0;
  let recurringVEventsWithoutUntil: number = 0;
  let recurringVEventsWithPastUntil: number = 0;
  let recurringVEventsWithFutureUntil: number = 0;

  const filteredEvents: VEvent[] = events.filter((event: CalendarComponent) => {
    // Needed to let TypeScript know that event is of type VEvent
    if (event.type !== "VEVENT") {
      nonVEvents++;
      return false;
    }

    if (!event.rrule) {
      if (!hasData(event.start) || !hasData(event.end)) {
        error(
          `[ERROR] - getActiveEvents/filterOutUnwantedEvents: Missing DTSTART (${event.start} (${event.start?.tz || "undefined TZ"})) and/or DTEND (${event.end} (${event.end?.tz || "undefined TZ"})) on non-recurring event UID '${event.uid}'. Skipping event.`
        );
        regularInvalidVEvents++;
        return false;
      }

      const startMillis: number = event.start.getTime();
      const endMillis: number = event.end.getTime();
      const isRegularEventInside: boolean =
        (startMillis >= eventLimitStartMillis && endMillis <= eventLimitEndMillis) || // event fully inside range
        (startMillis <= eventLimitStartMillis && endMillis >= eventLimitEndMillis) || // event fully outside range (ongoing)
        (startMillis <= eventLimitStartMillis && endMillis > eventLimitStartMillis) || // event starting before range, ending after start limit (ongoing)
        (startMillis >= eventLimitStartMillis && startMillis < eventLimitEndMillis && endMillis >= eventLimitEndMillis); // event starting inside range, ending after range (ongoing)

      if (isRegularEventInside) {
        regularVEventsInside++;
        return isRegularEventInside;
      }

      regularVEventsPast++;
      return isRegularEventInside;
    }

    const untilMatch: RegExpExecArray | null = untilRegexp.exec(event.rrule.toString());
    if (!untilMatch || untilMatch.length < 2) {
      recurringVEventsWithoutUntil++;
      return true;
    }

    const untilString: string | undefined = untilMatch[1];
    if (!untilString) {
      warn(`filterOutUnwantedEvents: UNTIL string extraction failed for event UID '${event.uid}'. Skipping event.`);
      recurringVEventsWithoutUntil++;
      return false;
    }

    const untilDateTime: DateTimeMaybeValid = DateTime.fromFormat(untilString, "yyyyMMdd'T'HHmmss", { zone: "utc" });
    if (!untilDateTime.isValid) {
      warn(`filterOutUnwantedEvents: UNTIL date parsing failed for event UID '${event.uid}'. Skipping event. Reason: ${untilDateTime.invalidReason}`);
      recurringVEventsWithoutUntil++;
      return false;
    }

    // keep only events where untilDateTime is after now
    const untilMillis: number = (untilDateTime as DateTime<true>).toMillis();
    const isRecurringUntilFuture: boolean =
      (untilMillis > eventLimitStartMillis && untilMillis >= eventLimitEndMillis) ||
      (untilMillis > eventLimitStartMillis && untilMillis <= eventLimitEndMillis);

    if (isRecurringUntilFuture) {
      recurringVEventsWithFutureUntil++;
      return isRecurringUntilFuture;
    }

    recurringVEventsWithPastUntil++;
    return isRecurringUntilFuture;
  }) as VEvent[];

  debug(
    `filterOutUnwantedEvents: Filtered out events numbers -- nonVEvents: ${nonVEvents} -- regularInvalidVEvents: ${regularInvalidVEvents} -- regularVEventsPast: ${regularVEventsPast} -- recurringVEventsWithPastUntil: ${recurringVEventsWithPastUntil} -- recurringVEventsWithoutUntil: ${recurringVEventsWithoutUntil} -- regularVEventsInside: ${regularVEventsInside} -- recurringVEventsWithFutureUntil: ${recurringVEventsWithFutureUntil}. Totally filtered from ${events.length} to ${filteredEvents.length} events.`
  );

  return filteredEvents;
};

const getClonedEvent = (event: VEvent): VEvent => {
  const clonedEvent: VEvent = deepClone(event) as VEvent;
  clonedEvent.start = event.start;
  clonedEvent.end = event.end;
  clonedEvent.created = event.created;
  clonedEvent.dtstamp = event.dtstamp;
  clonedEvent.lastmodified = event.lastmodified;
  clonedEvent.rrule = event.rrule;
  clonedEvent.recurrences = event.recurrences;
  clonedEvent.exdate = event.exdate;

  return clonedEvent;
};

const getRecurrenceDates = (
  event: VEvent,
  eventLimitStart: DateTime<true>,
  eventLimitEnd: DateTime<true>,
  localTimeZone: string,
  showLuxonDebugInfo: boolean,
  printOccurrences: boolean
): IcalOccurence[] => {
  const instances = new Map<string, IcalOccurence>();

  if (event.rrule) {
    const occurrences: Date[] = event.rrule.between(eventLimitStart.toJSDate(), eventLimitEnd.toJSDate(), true);
    if (printOccurrences) {
      console.log("occurrences", occurrences);
    }

    for (const date of occurrences) {
      const occurence: DateTime<true> | null = getDateTime({
        dateWithTimeZone: createDateWithTimeZone(date, event.start.tz || undefined),
        localTimeZone: localTimeZone,
        fullDayEvent: event.datetype === "date",
        keepOriginalZonedTime: true,
        quiet: !showLuxonDebugInfo
      });
      if (!occurence) {
        warn(`getRecurrenceDates: Invalid occurrence date for event UID '${event.uid}'. Skipping this occurrence.`);
        continue;
      }

      const occurenceUtc: DateTime<true> = occurence.toUTC();
      const occurenceStamp: string | null = occurenceUtc.toISO();
      const lookupKey: string | null = occurenceUtc.toISODate();
      if (!occurenceStamp || !lookupKey) {
        warn(`getRecurrenceDates: Invalid occurrenceStamp or lookupKey for event UID '${event.uid}'. Skipping this occurrence.`);
        continue;
      }

      if (event.recurrences?.[lookupKey]) {
        warn(`getRecurrenceDates: Recurrence override found for event UID '${event.uid}' on date '${lookupKey}'. Skipping occurrence.`);
        continue;
      }

      if (instances.has(occurenceStamp)) {
        warn(`getRecurrenceDates: Duplicate occurrence found for event UID '${event.uid}' on date '${lookupKey}'. Skipping duplicate.`);
        continue;
      }

      instances.set(occurenceStamp, {
        occurenceStart: occurence,
        lookupKey
      });
    }
  }

  if (event.recurrences) {
    for (const recurrence of Object.values(event.recurrences)) {
      const recurStart: DateTime<true> | null =
        recurrence?.start instanceof Date
          ? getDateTime({
              dateWithTimeZone: createDateWithTimeZone(recurrence.start, recurrence.start.tz || undefined),
              localTimeZone: localTimeZone,
              fullDayEvent: event.datetype === "date",
              keepOriginalZonedTime: true,
              quiet: !showLuxonDebugInfo
            })
          : null;

      const recurId: DateTimeMaybeValid | null = recurrence?.recurrenceid instanceof Date ? DateTime.fromJSDate(recurrence.recurrenceid) : null;

      if (!recurStart || !recurId || !recurId.isValid) {
        warn(`getRecurrenceDates: Invalid recurrence or recurrenceId found for event UID '${event.uid}'. Skipping this recurrence.`);
        continue;
      }

      if (!(recurStart.toMillis() >= eventLimitStart.toMillis() && recurStart.toMillis() <= eventLimitEnd.toMillis())) {
        continue;
      }

      const recurUtc: DateTime<true> = recurStart.toUTC();
      const recurUtcIso: string | null = recurUtc.toISODate();
      if (!recurUtcIso) {
        warn(`getRecurrenceDates: Invalid recurUtcIso for event UID '${event.uid}'. Skipping this recurrence.`);
        continue;
      }

      const recurStamp: string | null = recurUtc.toISO();
      if (!recurStamp) {
        warn(`getRecurrenceDates: Invalid recurStamp for event UID '${event.uid}'. Skipping this recurrence.`);
        continue;
      }

      instances.set(recurStamp, {
        occurenceStart: recurStart,
        lookupKey: recurUtcIso
      });
    }
  }

  return Array.from(instances.values()).sort((a: IcalOccurence, b: IcalOccurence) => a.occurenceStart.toMillis() - b.occurenceStart.toMillis());
};

const shouldKeepOriginalZonedTime = (
  event: VEvent,
  eventTimezone: string | undefined,
  localTimezone: string,
  isRecurrenceOverride: boolean = false
): boolean => {
  if ("APPLE-CREATOR-IDENTITY" in event) {
    // NOTE: Apple Calendar needs special handling here because they store the timeZoned time as local time
    return true;
  }

  if (isRecurrenceOverride) {
    // for recurrence overrides, we always want to keep the original timezone to avoid shifting issues
    return true;
  }

  /* NOTE: Exchange Calendar uses Windows timezones and node-ical replaces them with IANA timezones.
           Exchange Calendar stores the timeZoned time as local time, same as with Apple Calendar.
           Interesting to see if this breaks any timezone conversion out there.
  */
  return eventTimezone !== localTimezone;
};

export const getActiveEvents = (
  timezone: string | undefined,
  data: CalendarResponse,
  eventLimit: IcalCalendarEventLimit,
  logProperties: IcalCalendarLogProperty[],
  showLuxonDebugInfo: boolean, // same as logAllEvents in calendar-homey
  printOccurrences: boolean
): CalendarEvent[] => {
  const usedTZ: string = timezone || guessTimezone();
  const eventLimitStart: DateTime<true> = getZonedDateTime(DateTime.now(), usedTZ).startOf("day");
  const eventLimitEnd: DateTime<true> = getZonedDateTime(DateTime.now(), usedTZ)
    .plus(Duration.fromObject({ [eventLimit.type]: eventLimit.value }))
    .endOf("day");
  const events: CalendarEvent[] = [];
  let recurrenceEventCount: number = 0;
  let regularEventCount: number = 0;

  debug(
    `getActiveEvents: Using timezone '${usedTZ}' -- Event limit start: '${eventLimitStart.toFormat("dd.MM.yyyy HH:mm:ss")}' -- Event limit end: '${eventLimitEnd.toFormat("dd.MM.yyyy HH:mm:ss")}' -- logPropertiesCount: ${logProperties.length}`
  );

  const actualEvents: VEvent[] = filterOutUnwantedEvents(Object.values(data), eventLimitStart, eventLimitEnd);

  for (const event of actualEvents) {
    if (event.recurrenceid) {
      warn(`getActiveEvents - RecurrenceId for (${event.uid}) should be handled in getOccurrenceDates. Skipping.`);
      continue;
    }

    // set properties to be text value IF it's an object
    event.summary = convertToText("summary", event.summary, event.uid);
    event.location = convertToText("location", event.location, event.uid);
    event.description = convertToText("description", event.description, event.uid);
    event.uid = convertToText("uid", event.uid, event.uid);

    const startDate: DateTime<true> | null = getDateTime({
      dateWithTimeZone: event.start,
      localTimeZone: usedTZ,
      fullDayEvent: event.datetype === "date",
      keepOriginalZonedTime: shouldKeepOriginalZonedTime(event, event.start.tz, usedTZ),
      quiet: !showLuxonDebugInfo
    });
    const endDate: DateTime<true> | null = getDateTime({
      dateWithTimeZone: event.end,
      localTimeZone: usedTZ,
      fullDayEvent: event.datetype === "date",
      keepOriginalZonedTime: shouldKeepOriginalZonedTime(event, event.end.tz, usedTZ),
      quiet: !showLuxonDebugInfo
    });

    if (!startDate || !endDate) {
      error(`getActiveEvents - DTSTART (${startDate}) and/or DTEND (${endDate}) is invalid on '${event.summary}' (${event.uid})`);

      continue;
    }

    if (event.rrule) {
      // Recurring event
      let logged: boolean = false;
      const recurrenceDates: IcalOccurence[] = getRecurrenceDates(
        event,
        eventLimitStart,
        eventLimitEnd,
        usedTZ,
        showLuxonDebugInfo,
        printOccurrences
      );

      if (recurrenceDates.length === 0) {
        warn(`getActiveEvents - No recurrence dates in time range found for event UID '${event.uid}'. Skipping this recurring event.`);

        continue;
      }

      for (const { occurenceStart, lookupKey } of recurrenceDates) {
        if (event.exdate?.[lookupKey]) {
          warn(`getActiveEvents - ExDate found for event UID '${event.uid}' on date '${lookupKey}'. Skipping this recurrence.`);
          continue;
        }

        let currentEvent: VEvent = getClonedEvent(event);
        let currentDuration: Duration<true> = endDate.diff(startDate);
        let currentStartDate: DateTime<true> | null = occurenceStart;

        if (currentEvent.recurrences?.[lookupKey]) {
          // we found an override, so for this recurrence, use a potentially different start/end.
          currentEvent = currentEvent.recurrences[lookupKey] as VEvent;
          warn(`getActiveEvents - Found recurrence override for event UID '${event.uid}' on date '${lookupKey}'. Using overridden start/end.`);

          currentStartDate = getDateTime({
            dateWithTimeZone: createDateWithTimeZone(currentEvent.start, currentEvent.start.tz || undefined),
            localTimeZone: usedTZ,
            fullDayEvent: event.datetype === "date",
            keepOriginalZonedTime: shouldKeepOriginalZonedTime(event, currentEvent.start.tz, usedTZ, true),
            quiet: !showLuxonDebugInfo
          });

          const overrideEndDate: DateTime<true> | null = getDateTime({
            dateWithTimeZone: createDateWithTimeZone(currentEvent.end, currentEvent.end.tz || undefined),
            localTimeZone: usedTZ,
            fullDayEvent: event.datetype === "date",
            keepOriginalZonedTime: shouldKeepOriginalZonedTime(event, currentEvent.end.tz, usedTZ, true),
            quiet: !showLuxonDebugInfo
          });

          if (!currentStartDate || !overrideEndDate) {
            error(
              `getActiveEvents - DTSTART and/or DTEND is invalid on RECURRENCE OVERRIDE for '${currentEvent.summary}' (${currentEvent.uid}) with lookupKey '${lookupKey}'`
            );

            continue;
          }

          currentDuration = overrideEndDate.diff(currentStartDate);
        }

        const currentEndDate: DateTime<true> = currentStartDate.plus(currentDuration);

        if (currentEndDate.toMillis() < eventLimitStart.toMillis() || currentStartDate.toMillis() > eventLimitEnd.toMillis()) {
          warn(
            `getActiveEvents - Recurrence occurence is not inside event limit on event UID '${event.uid}' on date '${lookupKey}'. Start: '${currentStartDate.toFormat("dd.MM.yyyy HH:mm:ss")}' (${currentStartDate.toISO()} (${currentStartDate.zoneName})). End: '${currentEndDate.toFormat("dd.MM.yyyy HH:mm:ss")}' (${currentEndDate.toISO()} (${currentEndDate.zoneName})). Skipping this recurrence.`
          );
          continue;
        }

        recurrenceEventCount++;

        if (!logged && Array.isArray(logProperties) && logProperties.length > 0) {
          logProperties.forEach((prop: IcalCalendarLogProperty) => {
            if (prop === "event") {
              console.log(prop.toUpperCase(), `for '${event.summary}' :`, currentEvent);
            } else {
              // @ts-expect-error
              console.log(prop.toUpperCase(), `in '${event.summary}' :`, currentEvent[prop]);
            }
          });
          logged = true;
        }

        // NOTE: IF toISODate fails, fallback month will be a single digit IF month is < 10
        const startDateIso: string = currentStartDate.toISODate() || `${currentStartDate.year}-${currentStartDate.month}-${currentStartDate.day}`;
        currentEvent.uid = `${currentEvent.uid}_${startDateIso}`;

        info(
          `getActiveEvents - Recurrence Summary: '${currentEvent.summary}' -- Start: '${currentStartDate.toFormat("dd.MM.yyyy HH:mm:ss")}' (${currentStartDate.toISO()} (${currentStartDate.zoneName})) -- End: '${currentEndDate.toFormat("dd.MM.yyyy HH:mm:ss")}' (${currentEndDate.toISO()} (${currentEndDate.zoneName})) -- UID: '${currentEvent.uid}' -- DateType: '${event.datetype === "date" ? "FULL DAY" : "PARTIAL DAY"}'`
        );
        events.push(createNewEvent(currentEvent, currentStartDate, currentEndDate));
      }

      continue;
    }

    regularEventCount++;

    info(
      `getActiveEvents - Summary: '${event.summary}' -- Start: '${startDate.toFormat("dd.MM.yyyy HH:mm:ss")}' (${startDate.toISO()} (${startDate.zoneName})) -- End: '${endDate.toFormat("dd.MM.yyyy HH:mm:ss")}' (${endDate.toISO()} (${endDate.zoneName})) -- UID: '${event.uid}' -- DateType: '${event.datetype === "date" ? "FULL DAY" : "PARTIAL DAY"}'`
    );

    logProperties.forEach((prop: IcalCalendarLogProperty) => {
      if (prop === "event") {
        console.log(prop.toUpperCase(), `for '${event.summary}' :`, event);
      } else {
        // @ts-expect-error
        console.log(prop.toUpperCase(), `in '${event.summary}' :`, event[prop]);
      }
    });

    events.push(createNewEvent(event, startDate, endDate));
  }

  debug(`get-active-events: Recurrences: ${recurrenceEventCount} -- Regulars: ${regularEventCount}`);

  return events;
};
