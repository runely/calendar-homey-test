'use strict'

const path = require('path')
const nodeIcal = require('node-ical')
const { Blob } = require('node:buffer')

const saveFile = require('../debug/save-ics-file')

const { debug, info, warn, error, memuse } = require('../../config') // { info, warn, error, debug }
const getActiveEvents = require('./get-active-events')

module.exports = async calendarsItem => {
  const calendar = {}

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
    //memuse(`Before importing '${name}'`)
    const data = await (!isLocalFile ? nodeIcal.fromURL(uri) : nodeIcal.parseFile(uri))
    //memuse(`After importing '${name}'`)
    debug(`nodeIcal(${!isLocalFile ? 'URL' : 'FILE'}): Success getting data via node-ical`)
    const d = options.saveAll || options.saveActive ? new Date() : undefined

    if (options.saveAll) {
      const rawPath = path.join(__dirname, `../../contents/raw/${name}_${d.getDate()}.${(d.getMonth() + 1)}.${d.getFullYear()}.${typeof data === 'object' ? 'json' : 'ics'}`)
      warn(`About to save file to path '${rawPath}'`)
      saveFile((typeof data === 'object' ? JSON.stringify(data, null, 4) : data), rawPath)
      warn('Raw file saved')
    }

    //memuse(`Before getting active events for '${name}'`)
    const activeEvents = getActiveEvents(tz, data, eventLimit, logProperties)
    const totalEventsSize = new Blob([JSON.stringify(data)]).size / 1000
    //memuse(`After getting active events for '${name}'`)
    info(`getEvents: Events for calendar '${name}' found. Event count: ${activeEvents.length}. Total event count for calendar: ${Object.keys(data).length}.  Total event size for calendar: ${totalEventsSize}KB\n`)
    calendar.name = name
    calendar.events = activeEvents

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
