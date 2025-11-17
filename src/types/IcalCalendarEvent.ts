import type { Dayjs } from "dayjs";
import type { DateType } from "node-ical";

export type BusyStatus = "FREE" | "TENTATIVE" | "BUSY" | "OOF";

export type IcalCalendarEvent = {
  start: Dayjs;
  datetype: DateType;
  end: Dayjs;
  uid: string;
  description: string;
  location: string;
  summary: string;
  fullDayEvent: boolean;
  skipTZ: boolean;
  freebusy?: BusyStatus;
  meetingUrl?: string;
};

export type IcalCalendarEventWithName = IcalCalendarEvent & {
  calendarName: string;
};
