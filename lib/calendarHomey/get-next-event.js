'use strict'

const moment = require('moment-timezone')

module.exports = (calendars, timezone) => {
  let minutesUntilStart = 1000000000000000000000000000
  const nextEvent = {}
  const now = timezone ? moment.tz(timezone) : moment()

  calendars.forEach(calendar => {
    calendar.events.forEach(event => {
      const startDiff = Math.round(event.start.diff(now, 'minutes', true))
      const endDiff = Math.round(event.end.diff(now, 'minutes', true))

      if (startDiff >= 0 && startDiff < minutesUntilStart) {
        minutesUntilStart = startDiff
        nextEvent.startsIn = startDiff
        nextEvent.endsIn = endDiff
        nextEvent.event = event
        nextEvent.calendarName = calendar.name
      }
    })
  })

  return nextEvent
}
