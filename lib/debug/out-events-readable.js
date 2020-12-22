'use strict'

const moment = require('moment');

const { info, warn, error, debug } = require('../../config');

const momentify = (value) => typeof value.format === 'undefined' ? moment(value) : value;

const printout = (event, properties = []) => {
  let outString = `\t'${event.summary}' :: '${momentify(event.start).format('DD.MM.YYYY HH:mm:ss')}' -> '${momentify(event.end).format('DD.MM.YYYY HH:mm:ss')}'`
  if (properties.length > 0) {
    properties.map(property => {
      outString += ` -- '${property}': (${event[property]})`
    })
  }
  debug(outString)
}

module.exports = (events, message, properties = []) => {
  debug(`\n\n${message}`)
  if (typeof events.map === 'function') {
    events.map(event => {
      printout(event, properties)
    })
  } else {
    printout(events, properties)
  }
}
