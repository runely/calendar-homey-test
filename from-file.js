const moment = require('moment')
const yargs = require('yargs/yargs');

const scriptStart = moment().format('x')

const config = require('./config')

const getEvents = require('./lib/calendarHomey/get-events')
const getNextEvent = require('./lib/calendarHomey/get-next-event')
const getTodaysEvents = require('./lib/calendarHomey/get-todays-events')
const getTomorrowsEvents = require('./lib/calendarHomey/get-tomorrows-events')

const args = yargs(process.argv.slice(2)).argv;

const { info, warn, error, debug } = config;
const debugOptions = config.debugOptions();
const uris = config.calendars();

getEvents(uris, debugOptions.saveAll, debugOptions.saveActive)
  .then(calendarsEvents => {
    debug(`Total calendar events: ${calendarsEvents.reduce((previousCount, nextCount) => { return previousCount + nextCount.events.length }, 0)}`)

    const scriptGetEvents = moment().format('x')
    debug(`\tSpent '${(scriptGetEvents - scriptStart) / 1000}' seconds to retrieve calendars`)

    // get next event
    if (args.nextEvent) {
      let nextEvents = getNextEvent(calendarsEvents);
      info("\nNext event:", JSON.stringify(nextEvents, null, 2));
    }

    // get todays events
    if (args.todaysEvents) {
      let todaysEvents = getTodaysEvents(calendarsEvents);
      info("\nTodays events:", JSON.stringify(todaysEvents, null, 2));
    }

    // get tomorrows events
    if (args.tomorrowsEvents) {
      let tomorrowsEvents = getTomorrowsEvents(calendarsEvents);
      info("\nTomorrows events:", JSON.stringify(tomorrowsEvents, null, 2));
    }

    // scriptEnd
    if (args.nextEvent || args.todaysEvents || args.tomorrowsEvents) {
      const scriptEnd = moment().format('x')
      debug(`\nApp ran for '${(scriptEnd - scriptStart) / 1000}' seconds`)
    }
  })
  .catch(err => {
    error('ERRRRROOOOOORRRRR: ', err)

    // scriptEnd
    const scriptEnd = moment().format('x')
    debug(`\tApp ran for '${(scriptEnd - scriptStart) / 1000}' seconds`)
  })
