import type { DateWithTimeZone } from "node-ical";

export type GetCorrectDateTimeOptions = {
  dateWithTimeZone: DateWithTimeZone;
  localTimeZone: string;
  fullDayEvent: boolean;
  keepOriginalZonedTime: boolean;
  quiet: boolean;
};
