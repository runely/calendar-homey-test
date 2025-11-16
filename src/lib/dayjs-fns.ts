import dayjs, { Dayjs } from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(advancedFormat)
dayjs.extend(localizedFormat)
dayjs.extend(timezone)
dayjs.extend(utc)

export const dayjsIfy = (date: Dayjs | Date | number | string, timezone: string | undefined = undefined) => {
  if (date instanceof Dayjs) {
    return date;
  }
  
  if (typeof date === 'number') {
    return timezone
      ? dayjs.tz(date, timezone) 
      : dayjs(date);
  }

  return timezone
    ? dayjs.tz(date, timezone)
    : dayjs(date);
}

export const getGuessedTimezone = (): string => {
  return dayjs.tz.guess();
}

export const toIsoString = (dayjsObj: Dayjs): string => {
  return dayjsObj.format("YYYY-MM-DDTHH:mm:ss.SSSZ");
}
