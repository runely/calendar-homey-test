'use strict';

const nodeIcal = require('node-ical');
const { error, debug } = require('../../config'); // { info, warn, error, debug }

module.exports = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    nodeIcal.async.fromURL(url, options, (error_, data) => {
      if (error_) {
        error('get-ical-content: Failed getting data via node-ical:', error_);
        reject(error_);
      }

      debug('get-ical-content: Success getting data via node-ical:');
      resolve(data);
    });
  });
};
