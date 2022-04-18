'use strict'

const nodeIcal = require('node-ical')
const { error, debug } = require('../../config') // { info, warn, error, debug }

module.exports = async (url, isLocalFile, options = {}) => {
  try {
    const func = !isLocalFile ? nodeIcal.async.fromURL : nodeIcal.async.parseFile
    const data = await func(url, !isLocalFile ? options : undefined)
    debug(`get-ical-content(${!isLocalFile ? 'URL' : 'FILE'}): Success getting data via node-ical`)
    return data
  } catch (error_) {
    error(`get-ical-content(${!isLocalFile ? 'URL' : 'FILE'}): Failed getting data via node-ical:`, error_)
    throw error_
  }
}
