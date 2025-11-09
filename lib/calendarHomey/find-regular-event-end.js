const dayjs = require('dayjs')

const durationUnits = [
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
]

const getDurationUnit = (str, unit) => {
  const regex = new RegExp(`\\d+${unit}`, 'g')
  return str.search(regex) >= 0 ? Number.parseInt(str.substring(str.search(regex), str.indexOf(unit))) : 0
}

const getMoment = (date, timezone) => timezone ? moment.tz(date, timezone) : moment(date)

module.exports = (event, timezone) => {
  if (event.end) return getMoment(event.end, timezone)
  else if (event.datetype && event.datetype === 'date' && (!event.duration || typeof event.duration !== 'string')) return getMoment(event.start, timezone).add(1, 'day')
  else if (event.datetype && event.datetype === 'date-time') return getMoment(event.start, timezone)
  else {
    let end = getMoment(event.start, timezone)
    durationUnits.forEach(unit => {
      const durationUnit = getDurationUnit(event.duration, unit.abbr)
      end = event.duration.startsWith('-') ? end.subtract(durationUnit, unit.name) : end.add(durationUnit, unit.name)
    })
    return end
  }
}
