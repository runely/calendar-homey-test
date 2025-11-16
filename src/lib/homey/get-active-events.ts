/*const { dayjsIfy, getGuessedTimezone, toIsoString } = require('../dayjs-fns')
const deepClone = require('lodash.clonedeep')
const { debug, warn } = require('../../config')
const getRegularEventEnd = require('./find-regular-event-end')
const hasData = require('./has-data')
const extractMeetingUrl = require('./extract-meeting-url')*/
// const outputEvent = require('../debug/out-events-readable');

import type { Dayjs } from "dayjs";
//import deepClone from 'lodash.clonedeep';

import { debug, warn } from "../../config";
import { dayjsIfy, getGuessedTimezone, toIsoString } from "../dayjs-fns";
/*import { findRegularEventEnd } from './find-regular-event-end';
import { hasData } from "./has-data";
import { extractMeetingUrl } from "./extract-meeting-url";*/
import type { /*CalendarComponent,*/ CalendarResponse, /*DateWithTimeZone, VEvent*/ } from "node-ical";
import type {IcalCalendarEventLimit, IcalCalendarLogProperty} from "../../types/IcalCalendarImport";
import type {IcalCalendarEvent} from "../../types/IcalCalendarEvent";
//import { printOutEventsReadable } from '../debug/out-events-readable';


/*const test = (summary: string, start: Dayjs, end: Dayjs, recurring: boolean = false, timezone: string | undefined, ...rest: unknown[]): void => {
  // TODO: Might need to add format to start and end
  debug(`Type: '${!recurring ? 'Regular' : 'Recurring'}' -- Summary: '${summary}' -- Start: '${start}' (${toIsoString(start)}) -- End: '${end}' (${toIsoString(end)}) -- Timezone: '${timezone}' `, ...rest);
}

const getDuration = (start: DateWithTimeZone, end: DateWithTimeZone): number => {
  return Number.parseInt(dayjsIfy(end).format("x")) - Number.parseInt(dayjsIfy(start).format('x'));
}

const getEnd = (start: Dayjs | Date, duration: number, timezone: string | undefined): Dayjs => {
  const startPlusDuration: number = Number.parseInt(dayjsIfy(start).format("x")) + duration;
  return dayjsIfy(startPlusDuration, timezone)
  //timezone ? moment.tz((Number.parseInt(moment(start).format('x')) + duration), 'x', timezone) : moment((Number.parseInt(moment(start).format('x')) + duration), 'x')
}

const getPaddedDateString = (date: Dayjs): string => {
  const dateParts: string[] = [
    `${date.get('years')}`,
    date.get('months') + 1 > 9
      ? `${date.get('months') + 1}`
      : `0${date.get('months') + 1}`,
    date.get('dates') > 9
      ? `${date.get('dates')}`
      : `0${date.get('dates')}`
  ];
  const timeParts: string[] = [
    date.get('hours') > 9
      ? `${date.get('hours')}`
      : `0${date.get('hours')}`,
    date.get('minutes') > 9
      ? `${date.get('minutes')}`
      : `0${date.get('minutes')}`,
    date.get('seconds') > 9
      ? `${date.get('seconds')}`
      : `0${date.get('seconds')}`
  ];

  return `${dateParts.join('-')}T${timeParts.join(':')}.000Z`;
}

const convertToText = (prop: string, value: { params: unknown, val: string } | string, uid: string) => {
  if (typeof value === 'object') {
    debug(`getActiveEvents/convertToText - '${prop}' was object. Using 'val' of object '${uid}'`);
    return value.val;
  }

  return value;
}

const isInvalidTZ = (tz: string | undefined): boolean => {
  const invalid: string[] = ['Customized Time Zone', 'undefined'];
  if (tz === undefined) {
    return false;
  }

  return invalid.map((i: string) => tz.includes(i)).includes(true)
}

const removeInvalidTZ = (event: VEvent): void => {
  // remove 'Customized Time Zone*'
  try {
    if (isInvalidTZ(event.start.tz)) {
      console.log(`Invalid timezone (${event.start.tz}) found on`, event.summary);
      delete event.start.tz
      delete event.end.tz
      event.skipTZ = true
    }

    if (event.start.tz === 'Africa/Abidjan' && event.dtstamp.tz === 'Etc/UTC') {
      console.log(`Invalid timezone (${event.start.tz}) (this was probably Customized Time Zone) found on`, event.summary, event.uid)
      delete event.start.tz
      delete event.end.tz
      event.skipTZ = true
    }

    if (event.exdate) {
      for (const exdate in event.exdate) {
        if (isInvalidTZ(event.exdate[exdate].tz)) {
          delete event.exdate[exdate].tz
          delete event.exdate[exdate].tz
        }
      }
    }

    if (event.rrule) {
      if (event.rrule.origOptions && isInvalidTZ(event.rrule.origOptions.tzid)) {
        delete event.rrule.origOptions.tzid
        delete event.rrule.origOptions.tzid
      }

      if (event.rrule.options && isInvalidTZ(event.rrule.options.tzid)) {
        delete event.rrule.options.tzid
        delete event.rrule.options.tzid
      }

      if (event.rrule.origOptions.tzid === undefined && event.rrule.options.tzid === undefined) {
        event.skipTZ = true
      }
    } else if (event.start.tz === undefined) {
      event.skipTZ = true
    }
  } catch (error) {
    console.log('Failed to remove invalid time zone:', error)
  }
}

const fixWholeDayExDates = (event: VEvent): void => {
  const eventKeys: string[] = Object.keys(event);
  if (!eventKeys.includes('MICROSOFT-CDO-ALLDAYEVENT') || ('MICROSOFT-CDO-ALLDAYEVENT' in event && (event['MICROSOFT-CDO-ALLDAYEVENT'] as string).toLowerCase() !== 'true')) {
    return;
  }

  if (!eventKeys.includes('exdate')) {
    return;
  }

  const newExDate: Date[] = [];
  warn(`Fixing whole day Microsoft Exchange 365 recurring exdate for UID=${event.uid}:`);
  for (const exDateKey of Object.keys(event.exdate)) {
    const exDateEntry: any = event.exdate[exDateKey];
    const correctDayJs: Dayjs = dayjsIfy(exDateEntry, exDateEntry.tz);
    const correctISO: string = toIsoString(correctDayJs);
    const correctDate: string = correctISO.slice(0, 10);
    newExDate[correctDate] = new Date(correctISO.slice(0, 23));
    warn(`'${exDateEntry.tz}' : '${exDateEntry}' <--> '${newExDate[correctDate]}'`)
  }

  event.exdate = newExDate
}*/

export const getActiveEvents = (timezone: string | undefined, data: CalendarResponse, eventLimit: IcalCalendarEventLimit, logProperties: IcalCalendarLogProperty[], extrasUIDs?: string[]): IcalCalendarEvent[] => {
  const usedTZ: string = timezone || getGuessedTimezone();
  //const now: Dayjs = dayjsIfy(new Date(), usedTZ);
  const eventLimitStart: Dayjs = dayjsIfy(new Date(), usedTZ).startOf('day');
  const eventLimitEnd: Dayjs = dayjsIfy(new Date(), usedTZ).endOf('day').add(eventLimit.value, eventLimit.type);
  /*const events: IcalCalendarEvent[] = [];
  let recurrenceEventCount: number = 0;
  let regularEventCount: number = 0;*/

  for (const event of Object.values(data)) {
    if (event.type !== "VEVENT") {
      continue;
    }
    
    if (event.recurrenceid) {
      debug(`We don't care about recurrenceid for now`);
      continue;
    }

    let startDate: Dayjs = dayjsIfy(event.start);
    let endDate: Dayjs = dayjsIfy(event.end);
    
    if (!event.rrule) {
      // Single event
      if (endDate.isBefore(eventLimitEnd)) {
        continue;
      }

      debug(`Title: '${event.summary}' -- Start: '${startDate.format('LLLL')}' -- End: '${endDate.format('LLLL')}'`);
    }
  }

  /*for (const event of Object.values(data)) {
    if (event.type !== 'VEVENT') {
      continue;
    }

    // stop if required properties are missing
    if (!hasData(event.start) || !hasData(event.end)) {
      throw new Error(`"DTSTART" and/or "DTEND" is missing in event with UID: ${event.uid}`)
    }

    // set properties to be text value IF it's an object: https://github.com/jens-maus/node-ical/blob/cbb76af87ff6405f394acf993889742885cce0a0/ical.js#L78
    event.summary = convertToText('summary', event.summary, event.uid);
    event.location = convertToText('location', event.location, event.uid);
    event.description = convertToText('description', event.description, event.uid);
    event.uid = convertToText('uid', event.uid, event.uid);

    // remove invalid timezones from event
    //removeInvalidTZ(event)

    if (typeof event.rrule === 'undefined') 
      // regular event
      try {
        const skipTZ = event.skipTZ || event.start.toUTCString().includes('00:00:00')
        const start = skipTZ ? moment(event.start) : moment.tz(event.start, usedTZ)
        const end = skipTZ ? getRegularEventEnd(event) : getRegularEventEnd(event, usedTZ)
        if (Array.isArray(extrasUIDs) && extrasUIDs.includes(event.uid)) {
          if (skipTZ) {
            console.log('Start created without timezone', start, start.get('hours'), start.toDate().getHours())
            console.log('End created without timezone', end, end.get('hours'), end.toDate().getHours())
          } else {
            console.log(`Start created with timezone '${usedTZ}'`, start, start.get('hours'), start.toDate().getHours())
            console.log(`End created with timezone '${usedTZ}'`, end, end.get('hours'), end.toDate().getHours())
          }
        }

        // only add event if
        //    end hasn't happened yet AND start is between eventLimitStart and eventLimitEnd
        // ||
        //    start has happened AND end hasn't happened yet (ongoing)
        if ((now.diff(end, 'seconds') < 0 && start.isBetween(eventLimitStart, eventLimitEnd) === true) // ongoing event
            || (now.diff(start, 'seconds') > 0 && now.diff(end, 'seconds') < 0)) { // not started event
          events.push({ ...event, start, end })
          logProperties.forEach(prop => {
            if (prop === 'event') {
              console.log(prop.toUpperCase(), `for '${event.summary}' :`, event)
            } else {
              console.log(prop.toUpperCase(), `in '${event.summary}' :`, event[prop])
            }
          })
          test(event.summary, start, end, (typeof event.rrule !== 'undefined'), usedTZ, 'offset: ', end.utcOffset())
          regularEventCount++
        }
      } catch (_err) {
        console.log(`Regular -- Something weird on event '${event.summary}':`, event, 'ERROR ::', _err)
      }

      continue;
    }

    // recurring event
    try {
      // getting the set of start dates between eventLimitStart and eventLimitEnd
      //      Include dates which falls on until date: true||false
      let dates = event.rrule.between(eventLimitStart.toDate(), eventLimitEnd.toDate(), true)

      // getting the set of dates between rrule start and rrule until (if until is null, use eventLimitEnd.toDate())
      //      Include dates which falls on until date: true||false
      const rruleStart = (event.rrule.options && event.rrule.options.dtstart && moment.tz(event.rrule.options.dtstart, event.rrule.options.tzid || usedTZ).startOf('day').toDate()) || eventLimitStart.toDate()
      const rruleEnd = (event.rrule.options && event.rrule.options.until && moment.tz(event.rrule.options.until, event.rrule.options.tzid || usedTZ).endOf('day').toDate()) || eventLimitEnd.toDate()
      // first get all dates between start and end. then filter only those where date isn't after eventLimitEnd and isn't already present in dates
      const ongoingDates = event.rrule.between(rruleStart, rruleEnd, true).filter(date => !moment(date).isAfter(eventLimitEnd.toDate()) && !dates.map(d => d.getTime() === date.getTime()).includes(true))
      ongoingDates.forEach(date => dates.push(date))

      // the "dates" array contains the set of dates within our desired date range that are valid
      // for the recurrence rule.  *However*, it's possible for us to have a specific recurrence that
      // had its date changed from outside the range to inside the range. One way to handle this is
      // to add *all* recurrence override entries into the set of dates that we check, and then later
      // filter out any recurrences that don't actually belong within our range.
      let recurrencesMoved = []
      if (event.recurrences !== undefined) {
        for (const r of Object.keys(event.recurrences)) {
          const recurrence = event.recurrences[r]

          // remove the original date since this date has been moved
          const rMomentRecurr = recurrence.recurrenceid.toUTCString().includes('00:00:00') ? moment(recurrence.recurrenceid) : moment.tz(recurrence.recurrenceid, usedTZ)
          const rDateRecurr = new Date(getPaddedDateString(rMomentRecurr))
          const newDates = []
          let movedRecurrencesAdded = 0
          dates.forEach(date => {
            const date2 = rDateRecurr
            date2.setHours(date.getHours())
            date2.setMinutes(date.getMinutes())
            date2.setSeconds(date.getSeconds())
            date2.setMilliseconds(date.getMilliseconds())
            if (date.toISOString() !== date2.toISOString()) {
              newDates.push(date)
            } else {
              // keep track of the original date that has been moved so we can find it back further down
              recurrencesMoved.push({
                original: date
              })
              movedRecurrencesAdded++
            }
          })
          dates = newDates

          // add the new date
          // also only add dates that weren't already in the range we added from the rrule so that we don't double-add those events.
          const rMomentStart = recurrence.start.toUTCString().includes('00:00:00') ? moment(recurrence.start) : moment.tz(recurrence.start, usedTZ)
          const rDateStart = new Date(recurrence.start)

          if (rMomentStart.isBetween(eventLimitStart, eventLimitEnd) === true) {
            const existAlready = dates.filter(date => date === rDateStart)
            if (existAlready.length === 0) {
              dates.push(rDateStart)
              if (movedRecurrencesAdded >= 1) {
                recurrencesMoved[recurrencesMoved.length - 1].moved = rDateStart
                if (movedRecurrencesAdded > 1) {
                  console.log(`${movedRecurrencesAdded} recurrences with same key found in '${event.uid}'. Using the last one...`)
                }
              }
              console.log(`Recurrence in '${event.uid}' was moved from '${rMomentRecurr}' to '${rMomentStart}'`)
            }
          } else {
            const rMomentEnd = recurrence.end.toUTCString().includes('00:00:00') ? moment(recurrence.end) : moment.tz(recurrence.end, usedTZ)
            if (rMomentStart.isBefore(eventLimitStart) && rMomentEnd.isAfter(eventLimitStart)) {
              const existAlready = dates.filter(date => date === rDateStart)
              if (existAlready.length === 0) {
                dates.push(rDateStart)
                if (movedRecurrencesAdded >= 1) {
                  recurrencesMoved[recurrencesMoved.length - 1].moved = rDateStart
                  if (movedRecurrencesAdded > 1) {
                    console.log(`${movedRecurrencesAdded} recurrences with same key found in '${event.uid}'. Using the last one...`)
                  }
                }
                console.log(`Recurrence in '${event.uid}' was moved from '${rMomentRecurr}' to '${rMomentStart}' AND is ongoing from '${rMomentStart}' to '${rMomentEnd}'`)
              }
            }
          }
        }
      }

      // convert all recurring dates from UTC to local moment instances IF event.skipTZ doesn't exist or is false
      const localDates = dates.map(date => event.skipTZ ? moment(date.toISOString()) : moment.tz(date.toISOString(), usedTZ))

      fixWholeDayExDates(event)

      let logged = false
      for (const date of localDates) {
        let newEvent = deepClone(event)
        if (event.exdate) {
          // "exdate" is an invalid array. And since "deepClone" only clones valid values, "exdate" becomes an empty array.
          // To make up for this we have to add the original "exdate" property to the cloned object
          newEvent.exdate = event.exdate
        }
        let duration = getDuration(event.start, event.end)
        const offsetThis = moment.tz(event.start, usedTZ).utcOffset()

        // hacky wacky shitty thing that works and takes dst into account. Thanks to Mats!
        let start = event.skipTZ ? moment(date) : moment.tz(date, usedTZ).add(offsetThis, 'minutes')
        let end = event.skipTZ ? getEnd(start, duration) : getEnd(start, duration, usedTZ)
        if (Array.isArray(extrasUIDs) && extrasUIDs.includes(event.uid)) {
          if (event.skipTZ) {
            console.log('Start created without timezone', start, start.get('hours'), start.toDate().getHours())
            console.log('End created without timezone', end, end.get('hours'), end.toDate().getHours())
          } else {
            console.log(`Start created with timezone '${usedTZ}'`, start, start.get('hours'), start.toDate().getHours())
            console.log(`End created with timezone '${usedTZ}'`, end, end.get('hours'), end.toDate().getHours())
          }
        }

        if (event.start.toUTCString().includes('00:00:00')) {
          start = moment(date.toDate())
          end = getEnd(date.toDate(), duration)
          if (Array.isArray(extrasUIDs) && extrasUIDs.includes(event.uid)) {
            console.log('Timezone removed from start (if any) because its a full day event', start, start.get('hours'), start.toDate().getHours())
            console.log('Timezone removed from end (if any) because its a full day event', end, end.get('hours'), end.toDate().getHours())
          }
        }

        // use just the date of the recurrence to look up overrides and exceptions (i.e. chop off time information)
        //const dateLookupKey = moment(start).add(offsetThis, 'minutes').toISOString().slice(0, 10)
        const movedRecurrence = recurrencesMoved.find((rm) => (rm.moved - date.toDate()) === 0)
        const dateLookupKey = (movedRecurrence !== undefined ? moment(movedRecurrence.original) : moment(start)).add(offsetThis, 'minutes').toISOString().slice(0, 10)
        // exdates are stored in UTC with GMT timezone. dates found with rrule.between are also stored in UTC BUT has no timezone information.
        // These dates can then be different even though they actually are the same.
        //const previousDay = (event.skipTZ ? moment(start) : moment(start).add(offsetThis, 'minutes')).subtract(1, 'day')
        const previousDay = (event.skipTZ ? (movedRecurrence !== undefined ? moment(movedRecurrence.original) : moment(start)) : (movedRecurrence !== undefined ? moment(movedRecurrence.original) : moment(start)).add(offsetThis, 'minutes')).subtract(1, 'day')
        const previousDayLookupKey = previousDay.toISOString().slice(0, 10)

        // for each date that we're checking, it's possible that there is a recurrence override for that one day.
        if (newEvent.recurrences !== undefined && newEvent.recurrences[dateLookupKey] !== undefined) {
          // we found an override, so for this recurrence, use a potentially different title, start date, and duration.
          const recdate = event.skipTZ ? moment(newEvent.recurrences[dateLookupKey].start) : moment.tz(newEvent.recurrences[dateLookupKey].start, usedTZ)
          if (recdate.isSame(start, 'day')) {
            newEvent = deepClone(newEvent.recurrences[dateLookupKey])
            start = event.skipTZ ? moment(newEvent.start) : moment.tz(newEvent.start, usedTZ)
            duration = getDuration(newEvent.start, newEvent.end)
            end = event.skipTZ ? getEnd(start, duration) : getEnd(start, duration, usedTZ)
          }
        }
        // for each date that we're checking, it's possible that there is a recurrence override for that one day, and the UTC start time might even move back one day if different timezones
        if (newEvent.recurrences !== undefined && newEvent.recurrences[previousDayLookupKey] !== undefined) {
          // we found an override; because of timezones it appears as previousDay even though it is equal to date; so for this recurrence, use a potentially different title, start date, and duration.
          const recdate = event.skipTZ ? moment(newEvent.recurrences[previousDayLookupKey].start) : moment.tz(newEvent.recurrences[previousDayLookupKey].start, usedTZ)
          if (recdate.isSame(start, 'day')) {
            newEvent = deepClone(newEvent.recurrences[previousDayLookupKey])
            start = event.skipTZ ? moment(newEvent.start) : moment.tz(newEvent.start, usedTZ)
            duration = getDuration(newEvent.start, newEvent.end)
            end = event.skipTZ ? getEnd(start, duration) : getEnd(start, duration, usedTZ)
          }
        }
        // make sure the end time hasn't already past and that start time isn't either long into the future
        
        if (end.isBefore(now) || start.isAfter(eventLimitEnd)) {
          // do not add event
          continue
        }

        if (!logged && Array.isArray(logProperties) && logProperties.length > 0) {
          logProperties.forEach(prop => {
            if (prop === 'event') {
              console.log(prop.toUpperCase(), `for '${event.summary}' :`, newEvent)
            } else {
              console.log(prop.toUpperCase(), `in '${event.summary}' :`, newEvent[prop])
            }
          })
          logged = true
        }

        if (newEvent.exdate !== undefined) {
          // if there's no recurrence override, check for an exception date. Exception dates represent exceptions to the rule.
          if (newEvent.exdate[dateLookupKey] !== undefined) {
            // this date is an exception date, which means we should skip it in the recurrence pattern.
            const exdate = event.skipTZ ? moment(newEvent.exdate[dateLookupKey]) : moment.tz(newEvent.exdate[dateLookupKey], usedTZ)
            if (exdate.isSame(start, 'day')) {
              console.log(`Skipping '${newEvent.uid}' @ `, date, '(', newEvent.exdate[dateLookupKey], ')', 'because it exists in exdate by date lookup key')
              // do not add event
              continue
            }
          }
          if (newEvent.exdate[previousDayLookupKey] !== undefined && newEvent.datetype === 'date') {
            // this date is an exception date; because of timezones it appears as previousDay even though it is equal to date; which means we should skip it in the recurrence pattern.
            const exdate = event.skipTZ ? moment(newEvent.exdate[previousDayLookupKey]) : moment.tz(newEvent.exdate[previousDayLookupKey], usedTZ)
            if (exdate.isSame(start, 'day')) {
              console.log(`Skipping '${newEvent.uid}' @ `, date, '(', newEvent.exdate[previousDayLookupKey], ')', 'because it exists in exdate by previousDay lookup key')
              // do not add event
              continue
            }
          }
        }

        test(event.summary, start, end, (typeof event.rrule !== 'undefined'), usedTZ, 'offset: ', start.utcOffset(), `${event.start.toUTCString().includes('00:00:00') ? ` full day (${event.start.toUTCString()})` : ''}`)
        newEvent.start = start
        newEvent.end = end
        newEvent.uid = `${newEvent.uid}_${start.toDate().toISOString().slice(0, 10)}`

        events.push(newEvent)
        recurrenceEventCount++
      }
    } catch (_err) {
      console.log(`Recurring -- Something weird on event '${event.summary}':`, event, 'ERROR ::', _err)
    }
  }

  debug(`get-active-events: Recurrences: ${recurrenceEventCount} -- Regulars: ${regularEventCount}`)

  // keep only properties used
  return events.map(event => {
    const freebusy = event['MICROSOFT-CDO-BUSYSTATUS'] || event['X-MICROSOFT-CDO-BUSYSTATUS'] || ''

    // dig out a meeting url (if any)
    const meetingUrl = extractMeetingUrl(event) || ''

    return {
      start: event.start,
      datetype: event.datetype,
      end: event.end,
      uid: event.uid,
      description: event.description,
      location: event.location,
      summary: event.summary,
      fullDayEvent: event.datetype === 'date',
      skipTZ: event.skipTZ === true,
      freebusy,
      meetingUrl
    }
  })*/
}
