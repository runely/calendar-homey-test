'use strict'

const moment = require('moment')
const sortEvents = require('./sort-events')

module.exports = (calendars) => {
  const eventsToday = []
  const now = moment()

  calendars.map(calendar => {
    calendar.events.map(event => {
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
