/*import type { Dayjs } from "dayjs";
import type { VEvent } from "node-ical";

/!*type DurationUnit = 'W' | 'D' | 'H' | 'M' | 'S';

type DurationUnitItem = {
  name: string;
  abbr: DurationUnit
};

const durationUnits: DurationUnitItem[] = [
  {
    name: 'weeks',
    abbr: 'W'
  },
  {
    name: 'days',
    abbr: 'D'
  },
  {
    name: 'hours',
    abbr: 'H'
  },
  {
    name: 'minutes',
    abbr: 'M'
  },
  {
    name: 'seconds',
    abbr: 'S'
  }
];

const getDurationUnit = (str: string, unit: DurationUnit): number => {
  const regex = new RegExp(`\\d+${unit}`, 'g');
  return str.search(regex) >= 0
    ? Number.parseInt(str.substring(str.search(regex), str.indexOf(unit)))
    : 0;
}*!/

export const findRegularEventEnd = (event: VEvent, timezone: string | undefined): Dayjs => {
  if (event.end) {
    return dayjsIfy(event.end, timezone);
  }

  const end: Dayjs = dayjsIfy(event.start, timezone);

  // NOTE: duration is not a property that exists on VEvent. No need to check this. Leave it here if it's implemented on VEvent later on?<
  /!*if (event.dateType === 'date' && (!event.duration || typeof event.duration !== 'string')) {
    return end.add(1, "day");
  }*!/

  if (event.datetype === "date-time") {
    return end;
  }

  // NOTE: duration is not a property that exists on VEvent. No need to check this. Leave it here if it's implemented on VEvent later on?<
  /!*durationUnits.forEach((unit: DurationUnitItem) => {
    const durationUnit: number = getDurationUnit(event.duration, unit.abbr)
    end = event.duration.startsWith('-') ? end.subtract(durationUnit, unit.name) : end.add(durationUnit, unit.name)
  })*!/

  return end;
};*/
