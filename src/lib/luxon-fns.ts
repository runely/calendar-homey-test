import type { DateTimeMaybeValid, DateTimeUnit, StartOfOptions, ZoneOptions } from "luxon";
import { DateTime } from "luxon";
import type { Invalid, Valid } from "luxon/src/_util";
import type { GetCorrectDateTimeOptions } from "../types/luxon-GetCorrectDateTimeOptions";

export function luxGetZonedDateTime(dateTime: DateTime<Valid> | DateTime<Invalid>, timezone: string, options?: ZoneOptions): DateTime<Valid> {
  if (!dateTime.isValid) {
    throw new Error(`luxGetZonedDateTime: Invalid DateTime object. Cannot set zone. Reason: ${dateTime.invalidReason}`);
  }

  const zonedDateTime: DateTimeMaybeValid = dateTime.setZone(timezone, options);
  if (!zonedDateTime.isValid) {
    throw new Error(`luxGetZonedDateTime: Failed to set zone '${timezone}'. Reason: ${zonedDateTime.invalidReason}`);
  }

  return zonedDateTime as DateTime<Valid>;
}

export function luxStartOf(dateTime: DateTime<Valid> | DateTime<Invalid>, unit: DateTimeUnit, options?: StartOfOptions): DateTime<Valid> {
  if (!dateTime.isValid) {
    throw new Error(`luxStartOf: Invalid DateTime object. Cannot get start of '${unit}'. Reason: ${dateTime.invalidReason}`);
  }

  return dateTime.startOf(unit, options);
}

/*export function luxFromISO(isoString: string, options?: DateTimeOptions, quiet: boolean = true): DateTime<Valid> {
  if (!quiet) {
    console.log(`luxFromISO: '${isoString}' :: options:`, options);
  }
  const dateTime: DateTimeMaybeValid = DateTime.fromISO(isoString, options);
  if (!quiet) {
    console.log('luxFromISO:', dateTime);
  }
  if (!dateTime.isValid) {
    throw new Error(`luxFromISO: Failed to parse ISO string '${isoString}'. Reason: ${dateTime.invalidReason}`);
  }

  return dateTime as DateTime<Valid>;
}

export function luxIsBefore(dateTimeA: DateTime<Valid> | DateTime<Invalid>, dateTimeB: DateTime<Valid> | DateTime<Invalid>): boolean {
  if (!dateTimeA.isValid) {
    throw new Error(`luxIsBefore: Invalid DateTime object A. Cannot compare. Reason: ${dateTimeA.invalidReason}`);
  }
  
  if (!dateTimeB.isValid) {
    throw new Error(`luxIsBefore: Invalid DateTime object B. Cannot compare. Reason: ${dateTimeB.invalidReason}`);
  }
  
  return dateTimeA < dateTimeB;
}

export function luxIsAfter(dateTimeA: DateTime<Valid> | DateTime<Invalid>, dateTimeB: DateTime<Valid> | DateTime<Invalid>): boolean {
  if (!dateTimeA.isValid) {
    throw new Error(`luxIsAfter: Invalid DateTime object A. Cannot compare. Reason: ${dateTimeA.invalidReason}`);
  }
  
  if (!dateTimeB.isValid) {
    throw new Error(`luxIsAfter: Invalid DateTime object B. Cannot compare. Reason: ${dateTimeB.invalidReason}`);
  }
  
  return dateTimeA > dateTimeB;
}

export function luxIsBetween(dateTime: DateTime<Valid> | DateTime<Invalid>, start: DateTime<Valid> | DateTime<Invalid>, end: DateTime<Valid> | DateTime<Invalid>, inclusive: boolean = true): boolean {
  if (!dateTime.isValid) {
    throw new Error(`luxIsBetween: Invalid DateTime object. Cannot compare. Reason: ${dateTime.invalidReason}`);
  }
  
  if (!start.isValid) {
    throw new Error(`luxIsBetween: Invalid start DateTime object. Cannot compare. Reason: ${start.invalidReason}`);
  }
  
  if (!end.isValid) {
    throw new Error(`luxIsBetween: Invalid end DateTime object. Cannot compare. Reason: ${end.invalidReason}`);
  }
  
  return inclusive
    ? (dateTime >= start && dateTime <= end)
    : (dateTime > start && dateTime < end);
}*/

export function luxGuessTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function luxGetCorrectDateTime(options: GetCorrectDateTimeOptions): DateTime<Valid> {
  const isoString: string = options.dateWithTimeZone.toISOString().slice(0, -5);

  if (options.fullDayEvent) {
    const fullDayCalDate = DateTime.fromJSDate(options.dateWithTimeZone, { zone: "utc" })
      .setZone(options.localTimeZone, { keepLocalTime: true })
      .startOf("day");
    if (!options.quiet) {
      console.log(
        `luxGetCorrectDateTime: FULL-DAY - original dateWithTimeZone: '${options.dateWithTimeZone.toISOString()}' ::  dateWithTimezone: '${isoString}' (tz: '${options.dateWithTimeZone.tz}') => fullDayCalDate: '${fullDayCalDate.toISO()}' (tz: '${options.localTimeZone}')`
      );
    }

    return fullDayCalDate as DateTime<Valid>;
  }

  if (!options.dateWithTimeZone.tz) {
    const localTzCalDate: DateTimeMaybeValid = DateTime.fromFormat(isoString, "yyyy-MM-dd'T'HH:mm:ss", { zone: options.localTimeZone });
    if (!options.quiet) {
      console.log(
        `luxGetCorrectDateTime: NON-TZ - original dateWithTimeZone: '${options.dateWithTimeZone.toISOString()}' ::  dateWithTimezone: '${isoString}' (tz: '${options.dateWithTimeZone.tz}') => localTzCalDate: '${localTzCalDate.toISO()}' (tz: '${options.localTimeZone}')`
      );
    }

    return localTzCalDate as DateTime<Valid>;
  }

  if (!options.keepOriginalZonedTime) {
    const calDate: DateTimeMaybeValid = DateTime.fromFormat(isoString, "yyyy-MM-dd'T'HH:mm:ss", { zone: options.dateWithTimeZone.tz });
    const localCalDate: DateTimeMaybeValid = calDate.setZone(options.localTimeZone);
    if (!options.quiet) {
      console.log(
        `luxGetCorrectDateTime: TZ - original dateWithTimeZone: '${options.dateWithTimeZone.toISOString()}' :: dateWithTimezone: '${isoString}' (tz: '${options.dateWithTimeZone.tz}') => calDate: '${calDate}' => localDate: '${localCalDate.toISO()}' (tz: '${options.localTimeZone}')`
      );
    }

    return localCalDate as DateTime<Valid>;
  }

  const originalZonedCalDate: DateTimeMaybeValid = DateTime.fromJSDate(options.dateWithTimeZone, { zone: options.dateWithTimeZone.tz });
  const originalZonedLocalCalDate: DateTimeMaybeValid = originalZonedCalDate.setZone(options.localTimeZone);
  if (!options.quiet) {
    console.log(
      `luxGetCorrectDateTime: TZ - original dateWithTimeZone: '${options.dateWithTimeZone.toISOString()}' :: dateWithTimezone: '${isoString}' (tz: '${options.dateWithTimeZone.tz}') => originalZonedCalDate: '${originalZonedCalDate}' => originalZonedLocalCalDate: '${originalZonedLocalCalDate.toISO()}' (tz: '${options.localTimeZone}')`
    );
  }

  return originalZonedLocalCalDate as DateTime<Valid>;
}
