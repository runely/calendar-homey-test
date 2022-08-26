'use strict'

const moment = require('moment-timezone')
const deepClone = require('lodash.clonedeep')
const { debug } = require('../../config') // { info, warn, error, debug }
const getRegularEventEnd = require('./find-regular-event-end')
const hasData = require('./has-data')
// const outputEvent = require('../debug/out-events-readable');

const test = (summary, start, end, recurring = false, timezone, ...rest) => {
  debug(`Type: '${!recurring ? 'Regular' : 'Recurring'}' -- Summary: '${summary}' -- Start: '${start}' -- End: '${end}' -- Timezone: '${timezone}' `, ...rest)
}

const getDuration = (start, end) => Number.parseInt(moment(end).format('x')) - Number.parseInt(moment(start).format('x'))
const getEnd = (start, duration, timezone) => timezone ? moment.tz((Number.parseInt(moment(start).format('x')) + duration), 'x', timezone) : moment((Number.parseInt(moment(start).format('x')) + duration), 'x')
const convertToText = (prop, value) => {
  if (typeof value === 'object') {
    debug(`getActiveEvents/convertToText - '${prop}' was object. Using 'val' of object`)
    return value.val
  }
  return value
}
const isIvalidTZ = tz => {
  const invalid = ['Customized Time Zone', 'undefined']
  return tz && invalid.map(i => tz.includes(i)).includes(true)
}
const removeInvalidTZ = event => {
  // remove 'Customized Time Zone*'
  try {
    if (isIvalidTZ(event.start.tz)) {
      console.log(`Invalid timezone (${event.start.tz}) found on`, event.summary)
      delete event.start.tz
      delete event.end.tz
      event.skipTZ = true
    }
    if (event.exdate) {
      for (const exdate in event.exdate) {
        if (isIvalidTZ(event.exdate[exdate].tz)) {
          delete event.exdate[exdate].tz
          delete event.exdate[exdate].tz
        }
      }
    }
    if (event.rrule) {
      if (event.rrule.origOptions && isIvalidTZ(event.rrule.origOptions.tzid)) {
        delete event.rrule.origOptions.tzid
        delete event.rrule.origOptions.tzid
      }
      if (event.rrule.options && isIvalidTZ(event.rrule.options.tzid)) {
        delete event.rrule.options.tzid
        delete event.rrule.options.tzid
      }
    }
  } catch (error) {
    console.log('Failed to remove invalid time zone:', error)
  }
}

module.exports = (timezone, data, eventLimit, logProperties) => {
  const usedTZ = timezone || moment.tz.guess()
  const now = moment.tz(usedTZ)
  const eventLimitStart = moment.tz(usedTZ).startOf('day')
  const eventLimitEnd = moment.tz(usedTZ).endOf('day').add(eventLimit.value, eventLimit.type)
  const events = []
  let recurrenceEventCount = 0
  let regularEventCount = 0

  for (const event of Object.values(data)) {
    if (event.type !== 'VEVENT') {
      continue
    }

    // set properties to be text value IF it's an object: https://github.com/jens-maus/node-ical/blob/cbb76af87ff6405f394acf993889742885cce0a0/ical.js#L78
    event.summary = convertToText('summary', event.summary)
    event.location = convertToText('location', event.location)
    event.description = convertToText('description', event.description)
    event.uid = convertToText('uid', event.uid)

    // stop if required properties are missing
    if (!hasData(event.start) || !hasData(event.end)) {
      throw new Error(`"DTSTART" and/or "DTEND" is missing in event with UID: ${event.uid}`)
    }

    // remove invalid timezones from event
    removeInvalidTZ(event)

    // recurring event
    if (typeof event.rrule !== 'undefined') {
      try {
        // getting the set of start dates between eventLimitStart and eventLimitEnd
        //      Include dates which falls on until date: true||false
        const dates = event.rrule.between(eventLimitStart.toDate(), eventLimitEnd.toDate(), true)

        // getting the set of dates between rrule start and rrule until (if until is null, use eventLimitEnd.toDate())
        //      Include dates which falls on until date: true||false
        const rruleStart = (event.rrule.options && event.rrule.options.dtstart) || eventLimitStart.toDate()
        const rruleEnd = (event.rrule.options && event.rrule.options.until) || eventLimitEnd.toDate()
        // first get all dates between start and end. then filter only those where date isn't after eventLimitEnd and isn't already present in dates
        const ongoingDates = event.rrule.between(rruleStart, rruleEnd, true).filter(date => !moment(date).isAfter(eventLimitEnd.toDate()) && !dates.map(d => d.getTime() === date.getTime()).includes(true))
        ongoingDates.forEach(date => dates.push(date))

        // the "dates" array contains the set of dates within our desired date range range that are valid
        // for the recurrence rule.  *However*, it's possible for us to have a specific recurrence that
        // had its date changed from outside the range to inside the range.  One way to handle this is
        // to add *all* recurrence override entries into the set of dates that we check, and then later
        // filter out any recurrences that don't actually belong within our range.
        if (event.recurrences !== undefined) {
          for (const r in event.recurrences) {
            if (!Object.prototype.hasOwnProperty.call(event.recurrences, r)) {
              continue
            }

            // only add dates that weren't already in the range we added from the rrule so that
            // we don't double-add those events.
            const rDate = new Date(r)
            if (moment(rDate).isBetween(eventLimitStart, eventLimitEnd) === true) {
              const existAlready = dates.filter(date => date === rDate)
              if (!existAlready) {
                dates.push(rDate)
              }
            }
          }
        }

        // convert all recurring dates from UTC to local moment instances IF event.skipTZ doesn't exist or is false
        const localDates = dates.map(date => event.skipTZ ? moment(date.toISOString()) : moment.tz(date.toISOString(), usedTZ))

        let logged = false
        localDates.forEach(date => {
          let newEvent = deepClone(event)
          if (event.exdate) {
            // "exdate" is an invalid array. And since "deepClone" only clones valid values, "exdate" becomes an empty array.
            // To make up for this we have to add the original "exdate" property to the cloned object
            newEvent.exdate = event.exdate
          }
          let duration = getDuration(event.start, event.end)
          let addEvent = true
          const offsetThis = moment.tz(event.start, usedTZ).utcOffset()
          // hacky wacky shitty thing that works and takes dst into account. Thanks to Mats!
          let start = event.skipTZ ? moment(date) : moment.tz(date, usedTZ).add(offsetThis, 'minutes')
          let end = event.skipTZ ? getEnd(start, duration) : getEnd(start, duration, usedTZ)

          if (event.start.toUTCString().includes('00:00:00')) {
            start = moment(date.toDate())
            end = getEnd(date.toDate(), duration)
          }

          // use just the date of the recurrence to look up overrides and exceptions (i.e. chop off time information)
          const dateLookupKey = date.toISOString().slice(0, 10)
          // exdates are stored in UTC with GMT timezone. dates found with rrule.between are also stored in UTC BUT has no timezone information.
          // These dates can then be different even though they actually are the same.
          const previousDay = (event.skipTZ ? moment(date) : moment.tz(date, usedTZ)).subtract(1, 'day')
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
          // make sure the end time hasn't already past and that start time isn't too long into the future
          if (end.isBefore(now) || start.isAfter(eventLimitEnd)) {
            addEvent = false
          } else if (newEvent.exdate !== undefined) {
            if (!logged && Array.isArray(logProperties) && logProperties.length > 0) {
              logProperties.forEach(prop => {
                if (prop === 'event') console.log(prop.toUpperCase(), `for '${event.summary}' :`, newEvent)
                else console.log(prop.toUpperCase(), `in '${event.summary}' :`, newEvent[prop])
              })
              logged = true
            }
            // if there's no recurrence override, check for an exception date. Exception dates represent exceptions to the rule.
            if (newEvent.exdate[dateLookupKey] !== undefined) {
              // this date is an exception date, which means we should skip it in the recurrence pattern.
              const exdate = event.skipTZ ? moment(newEvent.exdate[dateLookupKey]) : moment.tz(newEvent.exdate[dateLookupKey], usedTZ)
              if (exdate.isSame(start, 'day')) {
                console.log(`Skipping '${newEvent.uid}' @ `, date, '(', newEvent.exdate[dateLookupKey], ')', 'because it exists in exdate by date lookup key')
                addEvent = false
              }
            }
            if (newEvent.exdate[previousDayLookupKey] !== undefined && newEvent.datetype === 'date') {
              // this date is an exception date; because of timezones it appears as previousDay even though it is equal to date; which means we should skip it in the recurrence pattern.
              const exdate = event.skipTZ ? moment(newEvent.exdate[previousDayLookupKey]) : moment.tz(newEvent.exdate[previousDayLookupKey], usedTZ)
              if (exdate.isSame(start, 'day')) {
                console.log(`Skipping '${newEvent.uid}' @ `, date, '(', newEvent.exdate[previousDayLookupKey], ')', 'because it exists in exdate by previousDay lookup key')
                addEvent = false
              }
            }
          }

          if (addEvent) {
            test(event.summary, start, end, (typeof event.rrule !== 'undefined'), usedTZ, 'offset: ', start.utcOffset(), `${event.start.toUTCString().includes('00:00:00') ? ` full day (${event.start.toUTCString()})` : ''}`)
            newEvent.start = start
            newEvent.end = end
            newEvent.uid = `${newEvent.uid}_${start.toDate().toISOString().slice(0, 10)}`

            events.push(newEvent)
            recurrenceEventCount++
          }
        })
      } catch (_err) {
        console.log(`Recurring -- Something weird on event '${event.summary}':`, event, 'ERROR ::', _err)
      }
    } else {
      try {
        // regular event
        const start = event.skipTZ || event.start.toUTCString().includes('00:00:00') ? moment(event.start) : moment.tz(event.start, usedTZ)
        const end = event.skipTZ || event.start.toUTCString().includes('00:00:00') ? getRegularEventEnd(event) : getRegularEventEnd(event, usedTZ)

        // only add event if
        //    end hasn't happend yet AND start is between eventLimitStart and eventLimitEnd
        // ||
        //    start has happend AND end hasn't happend yet (ongoing)
        if ((now.diff(end, 'seconds') < 0 && start.isBetween(eventLimitStart, eventLimitEnd) === true) || (now.diff(start, 'seconds') > 0 && now.diff(end, 'seconds') < 0)) {
          events.push({ ...event, start, end })
          logProperties.forEach(prop => {
            if (prop === 'event') console.log(prop.toUpperCase(), `for '${event.summary}' :`, event)
            else console.log(prop.toUpperCase(), `in '${event.summary}' :`, event[prop])
          })
          test(event.summary, start, end, (typeof event.rrule !== 'undefined'), usedTZ, 'offset: ', end.utcOffset())
          regularEventCount++
        }
      } catch (_err) {
        console.log(`Regular -- Something weird on event '${event.summary}':`, event, 'ERROR ::', _err)
      }
    }
  }

  debug(`get-active-events: Recurrances: ${recurrenceEventCount} -- Regulars: ${regularEventCount}`)

  // keep only properties used
  return events.map(event => {
    return {
      start: event.start,
      datetype: event.datetype,
      end: event.end,
      uid: event.uid,
      description: event.description,
      location: event.location,
      summary: event.summary
    }
  })
}
