import type { DateWithTimeZone } from "node-ical";

export type GetDateTimeOptions = {
  dateWithTimeZone: DateWithTimeZone;
  localTimeZone: string;
  fullDayEvent: boolean;
  keepOriginalZonedTime: boolean;
  quiet: boolean;
};
