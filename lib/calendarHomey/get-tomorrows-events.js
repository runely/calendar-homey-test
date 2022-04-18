'use strict'

const moment = require('moment-timezone')
const { sortEvents } = require('./sort-events')

module.exports = (calendars, timezone) => {
  const eventsTomorrow = []
  const tomorrowStart = (timezone ? moment.tz(timezone) : moment()).add(1, 'day').startOf('day')

  calendars.forEach(calendar => {
    calendar.events.forEach(event => {
      const startDiff = tomorrowStart.diff(event.start)
      const endDiff = tomorrowStart.diff(event.end)
      const startIsSameDay = event.start.isSame(tomorrowStart, 'day')

      const tomorrowNotStartedYet = (startDiff < 0 && startIsSameDay)
      const startPastButNotStopped = (startDiff > 0 && !startIsSameDay && endDiff < 0)
      if (tomorrowNotStartedYet || startPastButNotStopped) {
        eventsTomorrow.push({ ...event, calendarname: calendar.name })
      }
    })
  })

  sortEvents(eventsTomorrow)
  return eventsTomorrow
}
