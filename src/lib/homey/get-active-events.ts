import { DateTime, type DateTimeMaybeValid, Duration } from "luxon";
import type { CalendarComponent, EventInstance, ParameterValue, VEvent } from "node-ical";
import nodeICal from "node-ical";

import { dataInfo, debug, error, info, warn } from "../../config.js";

import type { BusyStatus, CalendarEvent } from "../../types/IcalCalendar";
import type { IcalCalendarEventLimit, IcalCalendarLogProperty } from "../../types/IcalCalendarImport";

import { getDateTime, getZonedDateTime, guessTimezone } from "../luxon-fns.js";

import { extractFreeBusy } from "./extract-freebusy.js";
import { extractMeetingUrl } from "./extract-meeting-url.js";
import { hasData } from "./has-data.js";

const untilRegexp = /UNTIL=(\d{8}T\d{6})/;

const convertToText = (prop: string, value: ParameterValue | undefined, uid: string): string => {
  if (value === undefined) {
    warn(`getActiveEvents/convertToText - '${prop}' was undefined. Using empty string for '${uid}'`);
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  warn(`getActiveEvents/convertToText - '${prop}' has params. Using 'val' of ParameterValue for '${uid}':`, value);
  return value.val;
};

const createNewEvent = (event: VEvent, start: DateTime<true>, end: DateTime<true>, uid: string, isFullDay: boolean): CalendarEvent => {
  // dig out free/busy status (if any)
  const freeBusy: BusyStatus | undefined = extractFreeBusy(event);

  const description: string = convertToText("description", event.description, event.uid);

  // dig out a meeting url (if any)
  const meetingUrl: string = extractMeetingUrl(description) || "";

  const calendarEvent: CalendarEvent = {
    start: start.setLocale("nb-NO"),
    dateType: event.datetype,
    end: end.setLocale("nb-NO"),
    uid,
    description: convertToText("description", event.description, event.uid),
    location: convertToText("location", event.location, event.uid),
    summary: convertToText("summary", event.summary, event.uid),
    fullDayEvent: isFullDay
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

const filterOutUnwantedEvents = (
  events: (CalendarComponent | undefined)[],
  eventLimitStart: DateTime<true>,
  eventLimitEnd: DateTime<true>
): VEvent[] => {
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

  const filteredEvents: VEvent[] = events.filter((event: CalendarComponent | undefined) => {
    if (!event) {
      nonVEvents++;
      return false;
    }

    // Needed to let TypeScript know that event is of type VEvent
    if (event.type !== "VEVENT") {
      nonVEvents++;
      return false;
    }

    if (!event.rrule) {
      if (!hasData(event.start)) {
        error(
          `[ERROR] - getActiveEvents/filterOutUnwantedEvents: Missing DTSTART (${event.start} (${event.start?.tz || "undefined TZ"})) on non-recurring event UID '${event.uid}'. Skipping event.`
        );
        regularInvalidVEvents++;
        return false;
      }

      const startMillis: number = event.start.getTime();
      const endMillis: number = (event.end ?? event.start).getTime();
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

export const getActiveEvents = (
  timezone: string | undefined,
  data: (CalendarComponent | undefined)[],
  eventLimit: IcalCalendarEventLimit,
  logProperties: IcalCalendarLogProperty[],
  showLuxonDebugInfo: boolean // same as logAllEvents in calendar-homey
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

  const actualEvents: VEvent[] = filterOutUnwantedEvents(data, eventLimitStart, eventLimitEnd);

  const loggedEventUids: Set<string> = new Set();

  for (const event of actualEvents) {
    const eventInstances: EventInstance[] = nodeICal.expandRecurringEvent(event, {
      excludeExdates: true,
      expandOngoing: true,
      includeOverrides: true,
      from: eventLimitStart.toJSDate(),
      to: eventLimitEnd.toJSDate()
    });

    if (eventInstances.length === 0) {
      warn(`getActiveEvents - No event instances found for event UID '${event.uid}' after expanding events. Skipping event.`);
      continue;
    }

    const fixedEventUids: Set<string> = new Set();

    for (const eventInstance of eventInstances) {
      if (!fixedEventUids.has(eventInstance.event.uid)) {
        // set properties to be text value IF it's an object
        eventInstance.event.uid = convertToText("uid", eventInstance.event.uid, eventInstance.event.uid);
        eventInstance.event.summary = convertToText("summary", eventInstance.summary, eventInstance.event.uid);
        eventInstance.event.location = convertToText("location", eventInstance.event.location, eventInstance.event.uid);
        eventInstance.event.description = convertToText("description", eventInstance.event.description, eventInstance.event.uid);

        fixedEventUids.add(eventInstance.event.uid);
      }

      eventInstance.summary = eventInstance.event.summary; // ensure eventInstance summary is converted to text as well

      const eventEndTz: string | undefined = eventInstance.end?.tz || eventInstance.start.tz;
      if (!eventInstance.end) {
        warn(
          `getActiveEvents - End is not specified on event UID '${eventInstance.event.uid}'. Using start TZ as end TZ: ${eventInstance.event.start.tz || "undefined TZ"}`
        );
      }

      if (Array.isArray(logProperties) && logProperties.length > 0 && !loggedEventUids.has(eventInstance.event.uid)) {
        logProperties.forEach((prop: IcalCalendarLogProperty) => {
          if (prop === "event") {
            dataInfo(`${eventInstance.event.uid} - ${prop.toUpperCase()} for '${eventInstance.summary}' :`, eventInstance);
          } else if (prop in eventInstance.event && eventInstance.event[prop] !== undefined) {
            dataInfo(`${eventInstance.event.uid} - ${prop.toUpperCase()} in '${eventInstance.summary}' :`, eventInstance.event[prop]);
          }
        });

        console.log("Adding", eventInstance.event.uid);
        loggedEventUids.add(eventInstance.event.uid);
      }

      dataInfo("getActiveEvents - Original event start / end :", eventInstance.start.toISOString(), eventInstance.end.toISOString());
      const startDate: DateTime<true> | null = getDateTime(
        eventInstance.start,
        eventInstance.event.start.tz,
        usedTZ,
        eventInstance.isFullDay,
        !showLuxonDebugInfo
      );
      const endDate: DateTime<true> | null = getDateTime(eventInstance.end, eventEndTz, usedTZ, eventInstance.isFullDay, !showLuxonDebugInfo);

      if (!startDate || !endDate) {
        error(
          `getActiveEvents - start (${startDate}) and/or end (${endDate}) is invalid on '${eventInstance.summary}' (${eventInstance.event.uid}). Skipping this event`
        );

        continue;
      }

      if (eventInstance.isRecurring) {
        recurrenceEventCount++;

        // NOTE: IF toISODate fails, fallback month will be a single digit IF month is < 10
        const startDateIso: string = startDate.toISODate() || `${startDate.year}-${startDate.month}-${startDate.day}`;
        const recurringEventUid = `${eventInstance.event.uid}_${startDateIso}`;

        info(
          `getActiveEvents - Recurrence Summary: '${eventInstance.summary}' -- Start: '${startDate.toFormat("dd.MM.yyyy HH:mm:ss")}' (${startDate.toISO()} (${startDate.zoneName})) -- End: '${endDate.toFormat("dd.MM.yyyy HH:mm:ss")}' (${endDate.toISO()} (${endDate.zoneName})) -- UID: '${recurringEventUid}' -- DateType: '${eventInstance.isFullDay ? "FULL DAY" : "PARTIAL DAY"}'`
        );

        events.push(createNewEvent(eventInstance.event, startDate, endDate, recurringEventUid, eventInstance.isFullDay));

        continue;
      }

      regularEventCount++;

      info(
        `getActiveEvents - Summary: '${eventInstance.summary}' -- Start: '${startDate.toFormat("dd.MM.yyyy HH:mm:ss")}' (${startDate.toISO()} (${startDate.zoneName})) -- End: '${endDate.toFormat("dd.MM.yyyy HH:mm:ss")}' (${endDate.toISO()} (${endDate.zoneName})) -- UID: '${eventInstance.event.uid}' -- DateType: '${eventInstance.isFullDay ? "FULL DAY" : "PARTIAL DAY"}'`
      );

      events.push(createNewEvent(eventInstance.event, startDate, endDate, eventInstance.event.uid, eventInstance.isFullDay));
    }
  }

  debug(`get-active-events: Recurrences: ${recurrenceEventCount} -- Regulars: ${regularEventCount}`);

  return events;
};
