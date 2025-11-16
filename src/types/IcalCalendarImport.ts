import type { ManipulateType } from 'dayjs'

export type IcalCalendarLogProperty =
| 'params'
| 'tzid'
| 'description'
| 'rrule'
| 'recurrences'
| 'recurrenceid'
| 'exdate'
| 'uid'
| 'summary'
| 'start'
| 'datetype'
| 'end'
| 'class'
| 'priority'
| 'dtstamp'
| 'transparency'
| 'status'
| 'sequence'
| 'location'
| 'method'
| 'prodid'
| 'version'
| 'WR-CALNAME'
| 'WR-TIMEZONE'
| 'LIC-LOCATION'
| 'created'
| 'lastmodified'
| 'organizer'
| 'attendee'
| 'url'
| 'attach'
| 'categories'
| 'calscale'
| 'MICROSOFT-CDO-APPT-SEQUENCE'
| 'MICROSOFT-CDO-BUSYSTATUS'
| 'MICROSOFT-CDO-INTENDEDSTATUS'
| 'MICROSOFT-CDO-ALLDAYEVENT'
| 'MICROSOFT-CDO-IMPORTANCE'
| 'MICROSOFT-CDO-INSTTYPE'
| 'MICROSOFT-DONOTFORWARDMEETING'
| 'MICROSOFT-DISALLOW-COUNTER'
| 'MICROSOFT-CDO-OWNERAPPTID'
| 'MICROSOFT-EVENTPROPERTIESTODELETE'
| 'MICROSOFT-ONLINEMEETINGCONFLINK'
| 'MICROSOFT-ONLINEMEETINGINFORMATION'
| 'MICROSOFT-SCHEDULINGSERVICEUPDATEURL'
| 'MICROSOFT-SKYPETEAMSMEETINGURL'
| 'MICROSOFT-SKYPETEAMSPROPERTIES'
| 'MICROSOFT-LOCATIONS'
| 'MS-OLK-AUTOFILLLOCATION'
| 'MS-OLK-CONFTYPE'
| 'APPLE-STRUCTURED-LOCATION'
| 'APPLE-TRAVEL-ADVISORY-BEHAVIOR'
| 'APPLE-TRAVEL-START';

export type IcalCalendarEventLimit = {
  value: number;
  type: ManipulateType;
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
  tz?: string;
};
