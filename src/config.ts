import chalk from "chalk";

import type { IcalCalendarImport } from "./types/IcalCalendarImport";

export const getCalendars = (): IcalCalendarImport[] => {
  try {
    return (require("../calendars.json") as { calendars: IcalCalendarImport[] }).calendars.filter((calendar: IcalCalendarImport) => calendar.import);
  } catch (err) {
    if (err instanceof Error) {
      error(err.message);
    } else {
      error("Huh?");
    }
    return [];
  }
};

/**
 * Log an info message to console
 *
 * @param message - Message to be written out to console
 * @param additional - Any number of additional info to log out
 */
export const info = (message: string, ...additional: unknown[]): void => {
  console.log(chalk.white(message, additional));
};

/**
 * Log a warning message to console
 *
 * @param message - Message to be written out to console
 * @param additional - Any number of additional info to log out
 */
export const warn = (message: string, ...additional: unknown[]): void => {
  console.warn(chalk.yellow(message, additional));
};

/**
 * Log an error message to console
 *
 * @param message - Message to be written out to console
 * @param additional - Any number of additional info to log out
 */
export const error = (message: string, ...additional: unknown[]): void => {
  console.error(chalk.red(message, additional));
};

/**
 * Log a debug message to console
 *
 * @param message - Message to be written out to console
 * @param additional - Any number of additional info to log out
 */
export const debug = (message: string, ...additional: unknown[]): void => {
  console.log(chalk.cyan(message, additional));
};

/*const memUse = (msg?: string) => {
  const used = process.memoryUsage()
  if (msg && msg.trim() !== "") {
    error(msg)
  }

  for (const key in used) {
    error(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`)
  }
  console.log('')
}*/

/*module.exports = {
  calendars,
  info,
  warn,
  error,
  debug,
  memUse
}*/
