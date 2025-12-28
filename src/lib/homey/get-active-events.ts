import deepClone from "lodash.clonedeep";
import { DateTime, type DateTimeMaybeValid, Duration } from "luxon";
import type { Valid } from "luxon/src/_util";
import type { CalendarComponent, CalendarResponse, DateWithTimeZone, VEvent } from "node-ical";

import type { IcalOccurence } from "../../types/IcalCalendar";
import type { BusyStatus, IcalCalendarEvent } from "../../types/IcalCalendarEvent";
import type { IcalCalendarEventLimit, IcalCalendarLogProperty } from "../../types/IcalCalendarImport";

import { extractFreeBusy } from "./extract-freebusy.js";
import { extractMeetingUrl } from "./extract-meeting-url.js";
import { luxGuessTimezone, luxGetZonedDateTime, luxStartOf, luxGetCorrectDateTime } from "../luxon-fns.js";
import { debug, warn } from "../../config.js";

const untilRegexp = new RegExp("UNTIL=(\\d{8}T\\d{6})");

const createDateWithTimeZone = (date: Date, timeZone: string | undefined): DateWithTimeZone => {
  return Object.defineProperty(date, 'tz', {
    value: timeZone,
    enumerable: false,
    configurable: true,
    writable: false,
  }) as DateWithTimeZone;
}

const convertToText = (prop: string, value: { params: unknown, val: string } | string, uid: string): string => {
  if (typeof value === 'object') {
    debug(`getActiveEvents/convertToText - '${prop}' was object. Using 'val' of object '${uid}'`);
    return value.val;
  }

  return value;
}

const createCalendarEvent = (event: VEvent, start: DateTime<Valid>, end: DateTime<Valid>): IcalCalendarEvent => {
  // dig out free/busy status (if any)
  const freeBusy: BusyStatus | undefined = extractFreeBusy(event);

  // dig out a meeting url (if any)
  const meetingUrl = extractMeetingUrl(event) || ''

  const calendarEvent: IcalCalendarEvent = {
    start,
    dateType: event.datetype,
    end,
    uid: event.uid,
    description: event.description,
    location: event.location,
    summary: event.summary,
    fullDayEvent: event.datetype === "date"
  };

  if (freeBusy) {
    calendarEvent.freeBusy = freeBusy;
  }

  if (meetingUrl) {
    calendarEvent.meetingUrl = meetingUrl;
  }

  return calendarEvent;
}

const filterOutUnwantedEvents = (events: CalendarComponent[], eventLimitStart: DateTime<Valid>, eventLimitEnd: DateTime<Valid>): VEvent[] => {
  const eventLimitStartMillis: number = eventLimitStart.toUTC().toJSDate().getTime();
  const eventLimitEndMillis: number = eventLimitEnd.toUTC().toJSDate().getTime();

  // statistics only
  let nonVEvents: number = 0;
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
      const startMillis: number = event.start.getTime();
      const endMillis: number = event.end.getTime();
      const isRegularEventInside: boolean = (startMillis >= eventLimitStartMillis && endMillis <= eventLimitEndMillis) // event fully inside range
        || (startMillis <= eventLimitStartMillis && endMillis >= eventLimitEndMillis) // event fully outside range (ongoing)
        || (startMillis <= eventLimitStartMillis && endMillis > eventLimitStartMillis) // event starting before range, ending after start limit (ongoing)
        || (startMillis >= eventLimitStartMillis && startMillis < eventLimitEndMillis && endMillis >= eventLimitEndMillis); // event starting inside range, ending after range (ongoing)
      if (isRegularEventInside) {
        regularVEventsInside++;
      } else {
        regularVEventsPast++;
      }
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
    const untilMillis: number = (untilDateTime as DateTime<Valid>).toMillis();
    const isRecurringUntilFuture: boolean = (untilMillis > eventLimitStartMillis && untilMillis >= eventLimitEndMillis) || (untilMillis > eventLimitStartMillis && untilMillis <= eventLimitEndMillis);
    if (isRecurringUntilFuture) {
      recurringVEventsWithFutureUntil++;
    } else {
      recurringVEventsWithPastUntil++;
    }
    return isRecurringUntilFuture;
  }) as VEvent[];
  
  debug(`filterOutUnwantedEvents: Filtered out events numbers -- nonVEvents: ${nonVEvents} -- regularVEventsPast: ${regularVEventsPast} -- recurringVEventsWithPastUntil: ${recurringVEventsWithPastUntil} -- recurringVEventsWithoutUntil: ${recurringVEventsWithoutUntil} -- regularVEventsInside: ${regularVEventsInside} -- recurringVEventsWithFutureUntil: ${recurringVEventsWithFutureUntil}. Totally filtered from ${events.length} to ${filteredEvents.length} events.`);
  
  return filteredEvents;
}

const getRecurrenceDates = (event: VEvent, eventLimitStart: DateTime<Valid>, eventLimitEnd: DateTime<Valid>, localTimeZone: string): IcalOccurence[] => {
  const instances = new Map<string, IcalOccurence>();

  for (const date of event.rrule!.between(eventLimitStart.toJSDate(), eventLimitEnd.toJSDate(), true)) {
    const occurence: DateTime<Valid> = luxGetCorrectDateTime({
      dateWithTimeZone: createDateWithTimeZone(date, event.rrule?.options.tzid || event.start.tz || undefined),
      localTimeZone: localTimeZone,
      fullDayEvent: event.datetype === "date",
      keepOriginalZonedTime: true,
      quiet: false
    });

    const occurenceUtc: DateTime<Valid> = occurence.toUTC();
    const occurenceStamp: string = occurenceUtc.toISO();
    const lookupKey: string = occurenceUtc.toISODate();
    if (event.recurrences && event.recurrences[lookupKey]) {
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

  if (event.recurrences) {
    for (const recurrence of Object.values(event.recurrences)) {
      const recurStart: DateTime<Valid> | null = recurrence?.start instanceof Date
        ? luxGetCorrectDateTime({
            dateWithTimeZone: createDateWithTimeZone(recurrence.start, recurrence.start.tz || undefined),
            localTimeZone: localTimeZone,
            fullDayEvent: event.datetype === "date",
            keepOriginalZonedTime: true,
            quiet: false
          })
        : null;

      const recurId: DateTimeMaybeValid | null = recurrence?.recurrenceid instanceof Date
        ? DateTime.fromJSDate(recurrence.recurrenceid)
        : null;

      if (!recurStart || !recurId || !recurId.isValid) {
        warn(`getRecurrenceDates: Invalid recurrence or recurrenceid found for event UID '${event.uid}'. Skipping this recurrence.`);
        continue;
      }

      if (!(recurStart.toMillis() >= eventLimitStart.toMillis() && recurStart.toMillis() <= eventLimitEnd.toMillis())) {
        continue;
      }

      const recurUtc: DateTimeMaybeValid = recurStart.toUTC();
      const recurStamp: string = recurUtc.toISO();
      instances.set(recurStamp, {
        occurenceStart: recurStart,
        lookupKey: recurUtc.toISODate()
      });
    }
  }

  return Array
    .from(instances.values())
    .sort((a: IcalOccurence, b: IcalOccurence) => a.occurenceStart.toMillis() - b.occurenceStart.toMillis());
}

export const getActiveEvents = (
  timezone: string | undefined,
  data: CalendarResponse,
  eventLimit: IcalCalendarEventLimit,
  logProperties: IcalCalendarLogProperty[]
): IcalCalendarEvent[] => {
  const usedTZ: string = timezone || luxGuessTimezone();
  const now: DateTime<Valid> = luxGetZonedDateTime(DateTime.local(), usedTZ); //.plus({ day: -10 });
  const eventLimitStart: DateTime<Valid> = luxStartOf(luxGetZonedDateTime(DateTime.local(), usedTZ), "day"); //.plus({ day: -10 });

  const eventLimitDuration: Duration = Duration.fromObject({ [eventLimit.type]: eventLimit.value });
  const eventLimitEnd: DateTime<Valid> = DateTime.local().endOf("day").plus(eventLimitDuration); //.plus({ day: -10 });
  const events: IcalCalendarEvent[] = [];
  let recurrenceEventCount: number = 0;
  let regularEventCount: number = 0;

  debug(
    `get-active-events: Using timezone '${usedTZ}' -- Now: '${now.toFormat("dd.MM.yyyy HH:mm:ss")}' -- Event limit start: '${eventLimitStart.toFormat("dd.MM.yyyy HH:mm:ss")}' -- Event limit end: '${eventLimitEnd.toFormat("dd.MM.yyyy HH:mm:ss")}' -- logPropertiesCount: ${logProperties.length}`
  );

  const actualEvents: VEvent[] = filterOutUnwantedEvents(Object.values(data), eventLimitStart, eventLimitEnd);
  for (const event of actualEvents) {
    if (event.recurrenceid) {
      // TODO: Fix handling of recurrenceid events
      warn(`We don't care about recurrenceid for now (${event.uid})`);
      debug(`Recurrence override start/end. Summary: '${event.summary}'`);
      continue;
    }

    // set properties to be text value IF it's an object
    event.summary = convertToText('summary', event.summary, event.uid);
    event.location = convertToText('location', event.location, event.uid);
    event.description = convertToText('description', event.description, event.uid);
    event.uid = convertToText('uid', event.uid, event.uid);

    const startDate: DateTime<Valid> = luxGetCorrectDateTime({ dateWithTimeZone: event.start, localTimeZone: usedTZ, fullDayEvent: event.datetype === "date", keepOriginalZonedTime: false, quiet: true });
    const endDate: DateTime<Valid> = luxGetCorrectDateTime({ dateWithTimeZone: event.end, localTimeZone: usedTZ, fullDayEvent: event.datetype === "date", keepOriginalZonedTime: false, quiet: true });

    if (event.rrule) {
      // Recurring event
      debug(`Recurrence start. Summary: '${event.summary}'`)

      let logged: boolean = false;
      const recurrenceDates: IcalOccurence[] = getRecurrenceDates(event, eventLimitStart, eventLimitEnd, usedTZ);
      for (const { occurenceStart, lookupKey } of recurrenceDates) {
        let currentEvent: VEvent = deepClone(event);
        let currentDuration: Duration<true> = endDate.diff(startDate);

        let currentStartDate: DateTime<Valid> = occurenceStart;

        if (currentEvent.recurrences && currentEvent.recurrences[lookupKey]) {
          // we found an override, so for this recurrence, use a potentially different start/end
          currentEvent = currentEvent.recurrences[lookupKey] as VEvent;
          warn(`Found recurrence override for event UID '${event.uid}' on date '${lookupKey}'. Using overridden start/end.`);

          currentStartDate = luxGetCorrectDateTime({
            dateWithTimeZone: createDateWithTimeZone(currentEvent.start, currentEvent.start.tz || undefined),
            localTimeZone: usedTZ,
            fullDayEvent: event.datetype === "date",
            keepOriginalZonedTime: false,
            quiet: true
          });

          const overrideEndDate: DateTime<Valid> = luxGetCorrectDateTime({
            dateWithTimeZone: createDateWithTimeZone(currentEvent.end, currentEvent.end.tz || undefined),
            localTimeZone: usedTZ,
            fullDayEvent: event.datetype === "date",
            keepOriginalZonedTime: false,
            quiet: true
          });

          currentDuration = overrideEndDate.diff(currentStartDate);
        } else if (currentEvent.exdate && currentEvent.exdate[lookupKey]) {
          warn(`ExDate found for event UID '${event.uid}' on date '${lookupKey}'. Skipping this recurrence.`);
          continue;
        }

        const currentEndDate: DateTime<Valid> = currentStartDate.plus(currentDuration);

        if (currentEndDate.toMillis() < eventLimitStart.toMillis() || currentStartDate.toMillis() > eventLimitEnd.toMillis()) {
          warn(`Skipping recurrence for event UID '${event.uid}' on date '${lookupKey}' as it is outside event limits.`);
          continue;
        }

        recurrenceEventCount++;

        if (!logged && Array.isArray(logProperties) && logProperties.length > 0) {
          logProperties.forEach((prop: IcalCalendarLogProperty) => {
            if (prop === 'event') {
              console.log(prop.toUpperCase(), `for '${event.summary}' :`, currentEvent);
            } else {
              // @ts-expect-error
              console.log(prop.toUpperCase(), `in '${event.summary}' :`, currentEvent[prop]);
            }
          });
          logged = true;
        }

        console.log('Start:', currentEvent.start.toISOString(), currentEvent.start.tz, "-- Converted:", currentStartDate.toISO(), currentStartDate.zoneName);
        console.log('End:', currentEvent.end.toISOString(), currentEvent.start.tz, "-- Converted:", currentEndDate.toISO(), currentEndDate.zoneName);

        currentEvent.uid = `${currentEvent.uid}_${currentStartDate.toISO().slice(0, 10)}`

        debug(
          `Recurrence Summary: '${currentEvent.summary}' -- Start: '${currentStartDate.toFormat("dd.MM.yyyy HH:mm:ss")}' -- End: '${currentEndDate.toFormat("dd.MM.yyyy HH:mm:ss")}' -- UID: '${currentEvent.uid}'`
        );
        events.push(createCalendarEvent(currentEvent, currentStartDate, currentEndDate));
      }

      debug(`Recurrence end. Summary: '${event.summary}'`)
      continue;
    }

    debug(`Summary start: '${event.summary}'`)

    regularEventCount++;

    logProperties.forEach((prop: IcalCalendarLogProperty) => {
      if (prop === 'event') {
        console.log(prop.toUpperCase(), `for '${event.summary}' :`, event);
      } else {
        // @ts-expect-error
        console.log(prop.toUpperCase(), `in '${event.summary}' :`, event[prop]);
      }
    });

    console.log('Start:', event.start.toISOString(), event.start.tz, "-- Converted:", startDate.toISO(), startDate.zoneName);
    console.log('End:', event.end.toISOString(), event.start.tz, "-- Converted:", endDate.toISO(), endDate.zoneName);

    debug(
      `Summary: '${event.summary}' -- Start: '${startDate.toFormat("dd.MM.yyyy HH:mm:ss")}' -- End: '${endDate.toFormat("dd.MM.yyyy HH:mm:ss")}' -- UID: '${event.uid}'`
    );

    debug(`Summary end: '${event.summary}'`)
    events.push(createCalendarEvent(event, startDate, endDate));
  }

  debug(`get-active-events: Recurrences: ${recurrenceEventCount} -- Regulars: ${regularEventCount}`);

  return events;
};
