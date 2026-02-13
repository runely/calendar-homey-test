import chalk from "chalk";

import type { IcalCalendarImport } from "./types/IcalCalendarImport";

export const getCalendars = async (): Promise<IcalCalendarImport[]> => {
  try {
    const data = (await import("../calendars.json", { with: { type: "json" } })).default as { calendars: IcalCalendarImport[] };
    return data.calendars.filter((calendar: IcalCalendarImport) => calendar.import);
  } catch (err) {
    if (err instanceof Error) {
      error(err.message, err.stack);
      return [];
    }

    error("Huh?", err);
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

/**
 * Log a data info message to console
 *
 * @param message - Message to be written out to console
 * @param additional - Any number of additional info to log out
 */
export const dataInfo = (message: string, ...additional: unknown[]): void => {
  console.log(chalk.green(message), additional);
}
