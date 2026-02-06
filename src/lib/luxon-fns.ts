import { DateTime, type DateTimeMaybeValid, type ZoneOptions } from "luxon";

import { debug, error } from "../config.js";

export const getZonedDateTime = (dateTime: DateTime<true> | DateTime<false>, timezone: string, options?: ZoneOptions): DateTime<true> => {
  if (!dateTime.isValid) {
    throw new Error(`getZonedDateTime: Invalid DateTime object. Cannot set zone. Reason: ${dateTime.invalidReason}`);
  }

  const zonedDateTime: DateTimeMaybeValid = dateTime.setZone(timezone, options);
  if (!zonedDateTime.isValid) {
    throw new Error(`getZonedDateTime: Failed to set zone '${timezone}'. Reason: ${zonedDateTime.invalidReason}`);
  }

  return zonedDateTime as DateTime<true>;
};

export const getDateTime = (
  date: Date,
  timezone: string | undefined,
  localTimezone: string,
  fullDayEvent: boolean,
  quiet: boolean
): DateTime<true> | null => {
  try {
    if (fullDayEvent) {
      /*
        - FullDayRegular: node-ical gir tilbake start i UTC ferdig konvertert. Lokal tiddsone må settes på etterpå uten konvertering
        - FullDayRecurring: node-ical gir tilbake instance (fra between) i UTC ferdig konvertert. Lokal tiddsone må settes på etterpå uten konvertering
      */
      const fullDayDateTime: DateTimeMaybeValid = DateTime.fromJSDate(date, { zone: "utc" }).setZone(localTimezone, { keepLocalTime: true });
      if (!fullDayDateTime.isValid) {
        error(
          `getDateTime: FULL-DAY :: Invalid DateTime generated :: Date: '${date}' :: Timezone: 'utc' :: LocalTimezone: '${localTimezone}' :: FullDayEvent: ${fullDayEvent} -> Reason: ${fullDayDateTime.invalidReason}`
        );
        return null;
      }

      if (!quiet) {
        debug(
          `getDateTime: FULL-DAY :: Date: '${date}' :: Timezone: 'utc' :: LocalTimezone: '${localTimezone}' => fullDayDateTime: '${fullDayDateTime.toISO()}' (tz: '${fullDayDateTime.zoneName}')`
        );
      }

      return fullDayDateTime as DateTime<true>;
    }

    /*
      "Exchange" / "iCloud" / "Probably any other calendar provider" that stores TZID on the DTSTART - which means that the value in DTSTART is already stored in that timezone
      - Regular: node-ical gir tilbake start i UTC og fromJSDate må bruke tz fra event.start. Lokal tidssone settes på etterpå (setZone)
      - Recurring: node-ical gir tilbake instance (fra between) i UTC og fromJSDate må bruke tz fra event.start (IKKE fra instance da den er undefined). Lokal tidssone kan så settes på etterpå (setZone)

      Google Calendar / Probably any other calendar provider that stores UTC on the DTSTART - which means that the value in DTSTART is in UTC
      - Regular: node-ical gir tilbake start i UTC og fromJSDate må bruke lokal tz HVIS event.start.tz er undefined eller er UTC/Etc. Lokal tidssone settes på etterpå (setZone)
      - Recurring: node-ical gir tilbake instance (fra between) i UTC og fromJSDate må bruke lokal tz HVIS event.start.tz er undefined eller er UTC/Etc. Lokal tidssone kan settes på etterpå (setZone). Er det samme som ble brukt ved konvertering er det ingen endring
    */

    const usedTimezone: string = timezone || "utc";
    const dateTime: DateTimeMaybeValid = DateTime.fromJSDate(date, { zone: usedTimezone }).setZone(localTimezone);
    if (!dateTime.isValid) {
      error(
        `getDateTime: Invalid DateTime generated :: Date: '${date}' :: Timezone: '${usedTimezone}' :: LocalTimezone: '${localTimezone}' :: FullDayEvent: ${fullDayEvent} -> Reason: ${dateTime.invalidReason}`
      );
      return null;
    }

    if (!quiet) {
      debug(
        `getDateTime: Date: '${date}' :: Timezone: '${usedTimezone}' :: LocalTimezone: '${localTimezone}' :: FullDayEvent: ${fullDayEvent} => dateTime: '${dateTime.toISO()}' (tz: '${dateTime.zoneName}')`
      );
    }

    return dateTime as DateTime<true>;
  } catch (err) {
    error(
      `getDateTime: Failed to get DateTime. Date: ${date} :: Timezone: '${timezone}' :: LocalTimezone: ${localTimezone} :: FullDayEvent: ${fullDayEvent} ->`,
      err
    );

    return null;
  }
};

export const guessTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
