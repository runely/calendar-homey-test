import { dayjsIfy } from "../dayjs-fns";
import { debug } from '../../config';

import type { VEvent } from "node-ical";

const printOut = (event: VEvent, properties: string[] = []): void => {
  let outString: string = `\t'${event.summary}' :: '${dayjsIfy(event.start).format('DD.MM.YYYY HH:mm:ss')}' -> '${dayjsIfy(event.end).format('DD.MM.YYYY HH:mm:ss')}'`;
  if (properties.length > 0) {
    properties.forEach((property: string) => {
      // @ts-expect-error Whatever
      outString += ` -- '${property}': (${event[property]})`;
    });
  }

  debug(outString);
}

export const printOutEventsReadable = (events: VEvent[], message: string, properties: string[] = []) => {
  debug(`\n\n${message}`);

  events.forEach((event: VEvent) => {
    printOut(event, properties)
  });
}
