(async () => {
  const config = require('./config')

  const moment = require('moment')
  const yargs = require('yargs/yargs')

  const scriptStart = new Date().getTime()

  const getEvents = require('./lib/calendarHomey/get-events')
  const { sortCalendars } = require('./lib/calendarHomey/sort-events')
  const getNextEvent = require('./lib/calendarHomey/get-next-event')
  const getTodaysEvents = require('./lib/calendarHomey/get-todays-events')
  const getTomorrowsEvents = require('./lib/calendarHomey/get-tomorrows-events')

  const args = yargs(process.argv.slice(2)).argv

  const { info, error, debug, memuse } = config // { info, warn, error, debug }
  const calendars = config.calendars()

  if (!calendars || !Array.isArray(calendars) || calendars.length === 0) {
    info('getEvents: Add at least one calendar in calendar.json')
    process.exit(1)
  }
  info(`fromFile: Getting ${calendars.length} calendars\n`)

  let timezone
  const calendarsEvents = []

  //memuse('Before calendar import')
  for await (const calendar of calendars) {
    const calendarEvents = await getEvents(calendar)
    if (!timezone && calendar.tz) {
      timezone = calendar.tz
    }

    if (calendarEvents.name && calendarEvents.events && calendarEvents.events.length > 0) {
      calendarsEvents.push(calendarEvents)
      if (calendar.options.showMeetingUrls) {
        calendarEvents.events.forEach(event => {
          if (event.meetingUrl) {
            debug(`\nMeeting URL: '${calendarEvents.name}' -- '${event.summary}' -- '${event.meetingUrl}'\n`)
          }
        })
      }
    }
  }
  //memuse(`After all calendar import`)

  if (calendarsEvents.length === 0) {
    error('No calendars returned... Aborting...')
    process.exit(-1)
  }
  sortCalendars(calendarsEvents)

  try {
    let totalCalendarsEvents = 0
    calendarsEvents.forEach(calendar => {
      totalCalendarsEvents += calendar.events.length
    })
    debug(`Total calendar events: ${totalCalendarsEvents}`)

    const scriptGetEvents = new Date().getTime()
    debug(`\tSpent '${(scriptGetEvents - scriptStart) / 1000}' seconds to retrieve calendars`)

    // get next event
    if (args.nextEvent) {
      const nextEvents = getNextEvent(calendarsEvents, timezone)
      info('\nNext event:', JSON.stringify(nextEvents, null, 2))
    }

    // get todays events
    if (args.todaysEvents) {
      const todaysEvents = getTodaysEvents(calendarsEvents, timezone)
      info('\nTodays events:', JSON.stringify(todaysEvents, null, 2))
    }

    // get tomorrows events
    if (args.tomorrowsEvents) {
      const tomorrowsEvents = getTomorrowsEvents(calendarsEvents, timezone)
      info('\nTomorrows events:', JSON.stringify(tomorrowsEvents, null, 2))
    }

    // scriptEnd
    if (args.nextEvent || args.todaysEvents || args.tomorrowsEvents) {
      const scriptEnd = new Date().getTime()
      debug(`\nApp ran for '${(scriptEnd - scriptStart) / 1000}' seconds`)
    }
  } catch (error_) {
    error('ERRRRROOOOOORRRRR: ', error_)

    // scriptEnd
    const scriptEnd = new Date().getTime()
    debug(`\tApp ran for '${(scriptEnd - scriptStart) / 1000}' seconds`)
  }
})()
