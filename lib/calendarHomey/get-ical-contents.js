'use strict'

const nodeIcal = require('node-ical')
const { info, warn, error, debug } = require('../../config');

module.exports = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      nodeIcal.async.fromURL(url, options, (err, data) => {
        if (err) {
          error('get-ical-content: Failed getting data via node-ical:', err)
          reject(err)
        }

        debug('get-ical-content: Success getting data via node-ical:');
        resolve(data)
      })
    }
    catch (err) {
      error(`get-ical-content: Failed getting data via node-ical for url '${url}': `, err);
      reject(err);
    }
  })
}
