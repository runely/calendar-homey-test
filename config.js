const chalk = require('chalk');

module.exports.calendars = () => {
  try {
    return require('./calendars.json').calendars.filter(calendar => calendar.import);
  } catch (error) {
    this.error(error)
    return { calendars: [] }
  }
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
