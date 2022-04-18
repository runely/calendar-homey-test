'use strict'

const moment = require('moment-timezone')
const { sortEvents } = require('./sort-events')

module.exports = (calendars, timezone) => {
  const eventsToday = []
  const now = timezone ? moment.tz(timezone) : moment()

  calendars.forEach(calendar => {
    calendar.events.forEach(event => {
      const startDiff = now.diff(event.start)
      const endDiff = now.diff(event.end)
      const startIsSameDay = event.start.isSame(now, 'day')

      const todayNotStartedYet = (startDiff < 0 && startIsSameDay)
      const todayAlreadyStarted = (startDiff > 0 && startIsSameDay && endDiff < 0)
      const startPastButNotStopped = (startDiff > 0 && !startIsSameDay && endDiff < 0)
      if (todayNotStartedYet || todayAlreadyStarted || startPastButNotStopped) {
        eventsToday.push({ ...event, calendarname: calendar.name })
      }
    })
  })

  sortEvents(eventsToday)
  return eventsToday
}
