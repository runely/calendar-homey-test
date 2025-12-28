import type { DateType } from "node-ical";
import type { DateTime } from "luxon";
import type { Valid } from "luxon/src/_util";

export type BusyStatus = "FREE" | "TENTATIVE" | "BUSY" | "OOF";

export type IcalCalendarEvent = {
  start: DateTime<Valid>;
  dateType: DateType;
  end: DateTime<Valid>;
  uid: string;
  description: string;
  location: string;
  summary: string;
  fullDayEvent: boolean;
  freeBusy?: BusyStatus;
  meetingUrl?: string;
};

export type IcalCalendarEventWithName = IcalCalendarEvent & {
  calendarName: string;
};
