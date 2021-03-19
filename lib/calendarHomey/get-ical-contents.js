'use strict'

const nodeIcal = require('node-ical')
const { error, debug } = require('../../config') // { info, warn, error, debug }

module.exports = (url, isLocalFile, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isLocalFile) {
      nodeIcal.async.fromURL(url, options, (error_, data) => {
        if (error_) {
          error('get-ical-content(URL): Failed getting data via node-ical:', error_)
          reject(error_)
        }

        debug('get-ical-content(URL): Success getting data via node-ical:')
        resolve(data)
      })
    } else {
      nodeIcal.async.parseFile(url, (error_, data) => {
        if (error_) {
          error('get-ical-content(FILE): Failed getting data via node-ical:', error_)
          reject(error_)
        }

        debug('get-ical-content(FILE): Success getting data via node-ical:')
        resolve(data)
      })
    }
  })
}
