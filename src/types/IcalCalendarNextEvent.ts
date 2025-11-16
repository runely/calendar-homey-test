import type { IcalCalendarEvent } from "./IcalCalendarEvent";

export type IcalCalendarNextEvent = {
  calendarName: string;
  endsIn: number;
  event: IcalCalendarEvent;
  startsIn: number;
};
