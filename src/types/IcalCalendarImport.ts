import type { DurationUnit } from "luxon";

export type IcalCalendarLogProperty =
  | "event"
  | "type"
  | "method"
  | "dtstamp"
  | "uid"
  | "sequence"
  | "transparency"
  | "class"
  | "summary"
  | "start"
  | "datetype"
  | "end"
  | "location"
  | "description"
  | "url"
  | "completion"
  | "created"
  | "lastmodified"
  | "rrule"
  | "attendee"
  | "recurrences"
  | "status"
  | "organizer"
  | "exdate"
  | "geo"
  | "recurrenceid"
  | "alarms"
  | "params"
  | "MICROSOFT-CDO-APPT-SEQUENCE"
  | "MICROSOFT-CDO-BUSYSTATUS"
  | "MICROSOFT-CDO-INTENDEDSTATUS"
  | "MICROSOFT-CDO-ALLDAYEVENT"
  | "MICROSOFT-CDO-IMPORTANCE"
  | "MICROSOFT-CDO-INSTTYPE"
  | "MICROSOFT-DONOTFORWARDMEETING"
  | "MICROSOFT-DISALLOW-COUNTER"
  | "MICROSOFT-CDO-OWNERAPPTID"
  | "MICROSOFT-EVENTPROPERTIESTODELETE"
  | "MICROSOFT-ONLINEMEETINGCONFLINK"
  | "MICROSOFT-ONLINEMEETINGINFORMATION"
  | "MICROSOFT-SCHEDULINGSERVICEUPDATEURL"
  | "MICROSOFT-SKYPETEAMSMEETINGURL"
  | "MICROSOFT-SKYPETEAMSPROPERTIES"
  | "MICROSOFT-LOCATIONS"
  | "MS-OLK-AUTOFILLLOCATION"
  | "MS-OLK-CONFTYPE"
  | "APPLE-STRUCTURED-LOCATION"
  | "APPLE-TRAVEL-ADVISORY-BEHAVIOR"
  | "APPLE-TRAVEL-START";

export type IcalCalendarEventLimit = {
  value: number;
  type: DurationUnit;
};

export type IcalCalendarImport = {
  name: string;
  uri: string;
  import: boolean;
  eventLimit: IcalCalendarEventLimit;
  options: {
    isLocalFile?: boolean;
    downloadIcs?: boolean;
    saveAll?: boolean;
    saveActive?: boolean;
    showMeetingUrls?: boolean;
    printAllEvents?: boolean;
    printEventByIndex?: number;
    printEventByUIDs?: string[];
  };
  logProperties: IcalCalendarLogProperty[];
  tz: string;
};
