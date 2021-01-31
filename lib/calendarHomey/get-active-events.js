'use strict'

const moment = require('moment')

const { debug } = require('../../config') // { info, warn, error, debug }

// const outputEvent = require('../debug/out-events-readable');

const test = (summary, start, end, recurring = false, startTimezoneOffset = null) => {
  debug(`Type: '${!recurring ? 'Regular' : 'Recurring'}' -- Summary: '${summary}' -- Start: '${start}' -- End: '${end}' -- TimezoneOffset: '${startTimezoneOffset || 'null'}'`)
}

module.exports = (data, eventLimit) => {
  const now = moment()
  const eventLimitStart = moment().startOf('day')
  const eventLimitEnd = moment().endOf('day').add(eventLimit.value, eventLimit.type)
  let events = []
  let recurrenceEventCount = 0
  let regularEventCount = 0

  for (const k in data) {
    if (!Object.prototype.hasOwnProperty.call(data, k)) {
      continue
    }

    if (data[k].type !== 'VEVENT') {
      continue
    }

    const event = data[k]

    // set summary to be a text value IF it's an object: https://github.com/jens-maus/node-ical/blob/cbb76af87ff6405f394acf993889742885cce0a0/ical.js#L78
    event.summary = typeof event.summary === 'object' ? event.summary.val : event.summary

    // recurring event
    if (typeof event.rrule !== 'undefined') {
      // getting the set of start dates between eventLimitStart and eventLimitEnd
      //      Include dates which falls on until date: true||false
      const dates = event.rrule.between(eventLimitStart.toDate(), eventLimitEnd.toDate(), true)

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

      dates.forEach(date => {
        let newEvent = { ...event }
        let duration = Number.parseInt(moment(event.end).format('x')) - Number.parseInt(moment(event.start).format('x'))
        let addEvent = true
        const offsetThis = date.getTimezoneOffset()
        // hacky wacky shitty thing that works and takes dst into account. Thanks to Mats!
        let start = moment(new Date(date.setHours(date.getHours() - ((event.start.getTimezoneOffset() - offsetThis) / 60))))

        // use just the date of the recurrence to look up overrides and exceptions (i.e. chop off time information)
        const dateLookupKey = date.toISOString().slice(0, 10)

        // for each date that we're checking, it's possible that there is a recurrence override for that one day.
        if ((newEvent.recurrences !== undefined) && (newEvent.recurrences[dateLookupKey] !== undefined)) {
          // we found an override, so for this recurrence, use a potentially different title, start date, and duration.
          newEvent = newEvent.recurrences[dateLookupKey]
          start = moment(newEvent.start)
          duration = Number.parseInt(moment(newEvent.end).format('x')) - Number.parseInt(moment(start).format('x'))
        } else if ((newEvent.exdate !== undefined) && (newEvent.exdate[dateLookupKey] !== undefined)) {
          // if there's no recurrence override, check for an exception date. Exception dates represent exceptions to the rule.
          // this date is an exception date, which means we should skip it in the recurrence pattern.
          addEvent = false
        }

        if (addEvent) {
          const end = moment(Number.parseInt(start.format('x')) + duration, 'x')

          if (end.isBefore(now) || start.isAfter(eventLimitEnd)) {
            // outputEvent(newEvent, `Recurring event is already ended (${end.isBefore(now)}) or event is starting after eventLimitEnd (${start.isAfter(eventLimitEnd)})`)
            addEvent = false
          }

          if (addEvent) {
            test(event.summary, start, end, (typeof event.rrule !== 'undefined'), event.end)
            newEvent.start = start
            newEvent.end = end
            newEvent.uid = `${newEvent.uid}_${start.toDate().toISOString().slice(0, 10)}`

            events.push(newEvent)
            recurrenceEventCount++
          }
        }
      })
    } else {
      // regular event
      const start = moment(event.start)
      const end = moment(event.end)

      // only add event if
      //    end hasn't happend yet AND start is between eventLimitStart and eventLimitEnd
      // ||
      //    start has happend AND end hasn't happend yet (ongoing)
      if ((now.diff(end, 'seconds') < 0 && start.isBetween(eventLimitStart, eventLimitEnd) === true) || (now.diff(start, 'seconds') > 0 && now.diff(end, 'seconds') < 0)) {
        events.push({ ...event, start, end })
        test(event.summary, start, end, (typeof event.rrule !== 'undefined'), event.end)
        regularEventCount++
      }
    }
  }

  // remove unnecessary objects from events
  events = events.map(event => {
    delete event.rrule
    if (event.exdate !== undefined) {
      delete event.exdate
    }

    delete event.recurrences

    return event
  })

  debug(`get-active-events: Recurrances: ${recurrenceEventCount} -- Regulars: ${regularEventCount}`)

  return events
}
