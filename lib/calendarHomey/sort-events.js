'use strict'

module.exports = calendars => {
  return calendars.forEach(calendar => {
    const sortedEvents = calendar.events.sort((a, b) => {
      return a.start - b.start
    })

    return { ...calendar, events: sortedEvents }
  })
}

/* module.exports = events => {
  return events.sort((a, b) => a.start - b.start);
}; */
