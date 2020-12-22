'use strict'

const saveFile = require('../debug/save-ics-file')

const config = require('../../config');
const eventLimit = config.eventLimit();
const { info, warn, error, debug } = config;

const getContent = require('./get-ical-contents')
const getActiveEvents = require('./get-active-events')
const sortEvents = require('./sort-events')

module.exports = (uris, saveAll = false, saveActive = false) => {
  return new Promise(async (resolve, reject) => {
    let calendars = uris
    let calendarsEvents = []

    // get ical events
    if (calendars) {
      info('getEvents: Getting calendars:', calendars.length, '\n')

      for (let i = 0; i < calendars.length; i++) {
        let { name, uri } = calendars[i]
        if (uri === '') {
          warn(`getEvents: Calendar '${name}' has empty uri. Skipping...`)
          continue
        } else if (uri.indexOf('http://') === -1 && uri.indexOf('https://') === -1 && uri.indexOf('webcal://') === -1) {
          warn(`getEvents: Uri for calendar '${name}' is invalid. Skipping...`)
          continue
        }

        if (uri.indexOf('webcal://') === 0) {
          uri = uri.replace('webcal://', 'https://')
          info(`getEvents: Calendar '${name}': webcal found and replaced with https://`)
        }

        info(`getEvents: Getting events (${eventLimit.value} ${eventLimit.type} ahead) for calendar '${name}'`)

        await getContent(uri)
          .then(data => {
            let d
            if (saveAll || saveActive) d = new Date()

            if (saveAll) {
              warn(`About to save file to path '${__dirname}/../../tests/contents/debug/all_${name}_${d.getDate()}.${(d.getMonth() + 1)}.${d.getFullYear()}.${typeof data === 'object' ? 'json' : 'ics'}'`)
              saveFile((typeof data === 'object' ? JSON.stringify(data, null, 4) : data), `${__dirname}/../../tests/contents/debug/all_${name}_${d.getDate()}.${(d.getMonth() + 1)}.${d.getFullYear()}.${typeof data === 'object' ? 'json' : 'ics'}`)
              warn('File saved')
            }

            const activeEvents = getActiveEvents(data, eventLimit)
            info(`getEvents: Events for calendar '${name}' found. Event count:`, activeEvents.length, '\n')
            calendarsEvents.push({ name, events: activeEvents })

            if (saveActive) {
              warn(`About to save file to path '${__dirname}/../../tests/contents/debug/active_${name}_${d.getDate()}.${(d.getMonth() + 1)}.${d.getFullYear()}.${typeof activeEvents === 'object' ? 'json' : 'ics'}'`)
              saveFile((typeof activeEvents === 'object' ? JSON.stringify(activeEvents, null, 4) : activeEvents), `${__dirname}/../../tests/contents/debug/active_${name}_${d.getDate()}.${(d.getMonth() + 1)}.${d.getFullYear()}.${typeof activeEvents === 'object' ? 'json' : 'ics'}`)
              warn('File saved')
            }
          })
          .catch(err => {
            const errorStr = typeof err === 'object' ? err.message : err

            error(`getEvents: Failed to get events for calendar '${name}', using url '${uri}':`, errorStr, '\n')
          })
      }
    } else {
      info('getEvents: Add at least one calendar in config.js')
    }

    sortEvents(calendarsEvents)

    resolve(calendarsEvents)
  })
}
