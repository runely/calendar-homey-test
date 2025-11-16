import type { IcalCalendarEvent } from "./IcalCalendarEvent";

export type IcalCalendar = {
  events: IcalCalendarEvent[];
  calendarName: string;
};
