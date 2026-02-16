import type { DateTime } from "luxon";
import type { DateType } from "node-ical";

export type BusyStatus = "FREE" | "TENTATIVE" | "BUSY" | "OOF" | "WORKINGELSEWHERE";

export type Calendar = {
  events: CalendarEvent[];
  calendarName: string;
};

export type CalendarEvent = {
  start: DateTime<true>;
  dateType: DateType;
  end: DateTime<true>;
  uid: string;
  description: string | undefined;
  location: string;
  summary: string;
  created?: DateTime<true>;
  fullDayEvent: boolean;
  freeBusy?: BusyStatus;
  meetingUrl?: string;
};

export type CalendarEventExtended = CalendarEvent & {
  calendarName: string;
};

export type HasDataFalsyType = undefined | null | string | [] | object;

export type HasDataTruthyType = boolean | number | [] | string | object;

export type HasDataType = HasDataFalsyType | HasDataTruthyType;

export type NextEvent = {
  calendarName: string;
  endsIn: number;
  event: CalendarEvent;
  startsIn: number;
};
