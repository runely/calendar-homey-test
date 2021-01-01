const chalk = require('chalk');

module.exports.calendars = () => {
  return require('./calendars.json').calendars.filter(calendar => calendar.import);
};

/** @function
 * EventLimits for calendar events.
 * value : is a number.
 * type :  is one of "days", "hours", "milliseconds", "minutes", "months", "quarters", "seconds", "weeks", "years"
 */
module.exports.eventLimit = () => {
  return {
    value: 2,
    type: 'months'
  };
};

/** @function
 * Debug options for ical file / events retrieved
 * saveAll : if false, all events retrieved/parsed through node-ical will NOT be saved. if true, all events retrieved/parsed through node-ical will be saved. (.json file)
 * saveActive : if false, active events retrieved/parsed through node-ical will NOT be saved. if true, active events retrieved/parsed through node-ical will be saved. (.json file)
 */
module.exports.debugOptions = () => {
  return {
    saveAll: false,
    saveActive: false
  };
};

/** @function
 * Log a info message to console
 * @param {string} message - Message to be written out to console
 * @param {any} additional - Any number of additional info to log out
 */
module.exports.info = (message, ...additional) => {
  console.log(chalk.white(message, additional));
};

/** @function
 * Log a warning message to console
 * @param {string} message - Message to be written out to console
 * @param {any} additional - Any number of additional info to log out
 */
module.exports.warn = (message, ...additional) => {
  console.warn(chalk.yellow(message, additional));
};

/** @function
 * Log a error message to console
 * @param {string} message - Message to be written out to console
 * @param {any} additional - Any number of additional info to log out
 */
module.exports.error = (message, ...additional) => {
  console.error(chalk.red(message, additional));
};

/** @function
 * Log a debug message to console
 * @param {string} message - Message to be written out to console
 * @param {any} additional - Any number of additional info to log out
 */
module.exports.debug = (message, ...additional) => {
  console.log(chalk.cyan(message, additional));
};