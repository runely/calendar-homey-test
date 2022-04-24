'use strict'

const path = require('path')

const saveFile = require('../debug/save-ics-file')

const { info, warn, error } = require('../../config') // { info, warn, error, debug }

const getContent = require('./get-ical-contents')
const getActiveEvents = require('./get-active-events')

module.exports = async calendarsItem => {
  let calendar = []

  // get ical events
  let { name, uri, eventLimit, options, tz, logProperties } = calendarsItem
  const isLocalFile = (options.isLocalFile !== undefined && options.isLocalFile) || false
  if (uri === '') {
    warn(`getEvents: Calendar '${name}' has empty uri. Skipping...`)
    return []
  } else if (!isLocalFile && !uri.includes('http://') && !uri.includes('https://') && !uri.includes('webcal://')) {
    warn(`getEvents: Uri for calendar '${name}' is invalid. Skipping...`)
    return []
  }

  if (uri.indexOf('webcal://') === 0) {
    uri = uri.replace('webcal://', 'https://')
    info(`getEvents: Calendar '${name}': webcal found and replaced with https://`)
  }

  info(`getEvents: Getting events (${eventLimit.value} ${eventLimit.type} ahead) for calendar '${name}' (${uri}) (${tz})`)

  try {
    const data = await getContent(uri, isLocalFile)
    const d = options.saveAll || options.saveActive ? new Date() : undefined

    if (options.saveAll) {
      const rawPath = path.join(__dirname, `../../contents/raw/${name}_${d.getDate()}.${(d.getMonth() + 1)}.${d.getFullYear()}.${typeof data === 'object' ? 'json' : 'ics'}`)
      warn(`About to save file to path '${rawPath}'`)
      saveFile((typeof data === 'object' ? JSON.stringify(data, null, 4) : data), rawPath)
      warn('Raw file saved')
    }

    const activeEvents = getActiveEvents(tz, data, eventLimit, logProperties)
    info(`getEvents: Events for calendar '${name}' found. Event count: ${activeEvents.length}\n`)
    calendar = { name, events: activeEvents }

    if (options.saveActive) {
      const activePath = path.join(__dirname, `../../contents/active/${name}_${d.getDate()}.${(d.getMonth() + 1)}.${d.getFullYear()}.${typeof activeEvents === 'object' ? 'json' : 'ics'}`)
      warn(`About to save file to path '${activePath}'`)
      saveFile((typeof activeEvents === 'object' ? JSON.stringify(activeEvents, null, 4) : activeEvents), activePath)
      warn('Active file saved')
    }
  } catch (error_) {
    const errorString = typeof error_ === 'object' ? error_.message : error_

    error(`getEvents: Failed to get events for calendar '${name}' '${uri}' :`, errorString, '\n')
  }

  return calendar
}
