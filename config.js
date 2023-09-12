const chalk = require('chalk')

const calendars = () => {
  try {
    return require('./calendars.json').calendars.filter(calendar => calendar.import)
  } catch (error) {
    this.error(error)
    return { calendars: [] }
  }
}

/** @function
 * Log a info message to console
 * @param {string} message - Message to be written out to console
 * @param {any} additional - Any number of additional info to log out
 */
const info = (message, ...additional) => {
  console.log(chalk.white(message, additional))
}

/** @function
 * Log a warning message to console
 * @param {string} message - Message to be written out to console
 * @param {any} additional - Any number of additional info to log out
 */
const warn = (message, ...additional) => {
  console.warn(chalk.yellow(message, additional))
}

/** @function
 * Log a error message to console
 * @param {string} message - Message to be written out to console
 * @param {any} additional - Any number of additional info to log out
 */
const error = (message, ...additional) => {
  console.error(chalk.red(message, additional))
}

/** @function
 * Log a debug message to console
 * @param {string} message - Message to be written out to console
 * @param {any} additional - Any number of additional info to log out
 */
const debug = (message, ...additional) => {
  console.log(chalk.cyan(message, additional))
}

const memuse = (msg = '') => {
  const used = process.memoryUsage()
  if (msg !== '') {
    error(msg)
  }
  for (const key in used) {
    error(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`)
  }
  console.log('')
}

module.exports = {
  calendars,
  info,
  warn,
  error,
  debug,
  memuse
}
