import type { IcalCalendarEvent } from "./IcalCalendarEvent";
import {DateTime} from "luxon";
import type {Valid} from "luxon/src/_util";

export type IcalCalendar = {
  events: IcalCalendarEvent[];
  calendarName: string;
};

export type IcalOccurence = {
  occurenceStart: DateTime<Valid>;
  lookupKey: string;
};
