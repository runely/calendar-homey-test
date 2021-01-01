'use strict';

const nodeIcal = require('node-ical');
const { error, debug } = require('../../config'); // { info, warn, error, debug }

module.exports = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      nodeIcal.async.fromURL(url, options, (err, data) => {
        if (err) {
          error('get-ical-content: Failed getting data via node-ical:', err);
          reject(err);
        }

        debug('get-ical-content: Success getting data via node-ical:');
        resolve(data);
      });
    } catch (error_) {
      error(`get-ical-content: Failed getting data via node-ical for url '${url}': `, error_);
      reject(error_);
    }
  });
};
