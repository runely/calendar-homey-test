import type { DateTime } from "luxon";
import type { Valid } from "luxon/src/_util";
import type { IcalCalendarEvent } from "./IcalCalendarEvent";

export type IcalCalendar = {
  events: IcalCalendarEvent[];
  calendarName: string;
};

export type IcalOccurence = {
  occurenceStart: DateTime<Valid>;
  lookupKey: string;
};
