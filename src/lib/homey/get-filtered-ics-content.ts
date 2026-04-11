import { readFileSync } from "node:fs";
import { icsFilter } from "ics-filter";
import { DateTime, Duration } from "luxon";

import { error, info } from "../../config.js";

import type { IcalCalendarLimit } from "../../types/IcalCalendarImport.js";

export const getFilteredIcsContent = async (
  url: string,
  isLocalFile: boolean,
  eventLimit: IcalCalendarLimit,
  eventStartThreshold?: IcalCalendarLimit
): Promise<string | null> => {
  try {
    const icsContent: string = await getIcsContent(url, isLocalFile);
    info(`getFilteredIcsContent: Raw ics content length: ${icsContent.length}`);

    const now: DateTime<true> = eventStartThreshold
      ? DateTime.now()
          .startOf("day")
          .minus(Duration.fromObject({ [eventStartThreshold.type]: eventStartThreshold.value }))
      : DateTime.now().startOf("day");

    const eventLimitEnd: DateTime<true> = DateTime.now()
      .endOf("day")
      .plus(Duration.fromObject({ [eventLimit.type]: eventLimit.value }));

    info(
      `getFilteredIcsContent: Filtering events starting from '${now.toFormat("dd.MM.yyyy HH:mm:ss")}' until '${eventLimitEnd.toFormat("dd.MM.yyyy HH:mm:ss")}'`
    );
    const filteredIcsContent: string = icsFilter(icsContent, now.toJSDate(), eventLimitEnd.toJSDate());
    info(`getFilteredIcsContent: Filtered ics content length: ${filteredIcsContent.length}`);

    return filteredIcsContent;
  } catch (err) {
    error("Failed to get filtered ics content:", err);

    return null;
  }
};

const getIcsContent = async (url: string, isLocalFile: boolean): Promise<string> => {
  if (!isLocalFile) {
    return await getIcsContentByUrl(url);
  }

  return readFileSync(url, "utf8");
};

const getIcsContentByUrl = async (url: string): Promise<string> => {
  const response: Response = await fetch(url, {
    method: "GET"
  });

  if (!response.ok) {
    const errorMessage: string = await response.text();
    error(
      `[ERROR] - getIcsContentByUrl: Failed to fetch ICS content. Status: ${response.status}, StatusText: '${response.statusText}'. ErrorMessage: ${errorMessage}`
    );
    throw new Error(`Failed to fetch ICS content. Status: ${response.status}, StatusText: '${response.statusText}'`);
  }

  return response.text();
};
