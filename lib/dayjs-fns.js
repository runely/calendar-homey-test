const dayjs = require('dayjs')
const dayjsLocalizedFormat = require('dayjs/plugin/localizedFormat')
const dayjsTimezone = require('dayjs/plugin/timezone')
const dayjsUtc = require('dayjs/plugin/utc')

dayjs.extend(dayjsLocalizedFormat)
dayjs.extend(dayjsTimezone)
dayjs.extend(dayjsUtc)

const dayjsIfy = value => typeof value.format === 'undefined'
  ? dayjs(value)
  : value

const dayjsTimezoneIfy = (date, timezone) => timezone
  ? dayjs.tz(date, timezone)
  : dayjsIfy(date)

module.exports = {
  dayjsIfy,
  dayjsTimezoneIfy
}