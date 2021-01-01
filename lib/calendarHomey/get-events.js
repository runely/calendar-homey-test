'use strict';

const path = require('path');

const saveFile = require('../debug/save-ics-file');

const config = require('../../config');
const eventLimit = config.eventLimit();
const { info, warn, error } = config; // { info, warn, error, debug }

const getContent = require('./get-ical-contents');
const getActiveEvents = require('./get-active-events');
const sortEvents = require('./sort-events');

module.exports = (uris, saveAll = false, saveActive = false) => {
  return new Promise(async resolve => {
    const calendars = uris;
    const calendarsEvents = [];

    // get ical events
    if (calendars) {
      info('getEvents: Getting calendars:', calendars.length, '\n');

      for (let { name, uri } of calendars) {
        if (uri === '') {
          warn(`getEvents: Calendar '${name}' has empty uri. Skipping...`);
          continue;
        } else if (!uri.includes('http://') && !uri.includes('https://') && !uri.includes('webcal://')) {
          warn(`getEvents: Uri for calendar '${name}' is invalid. Skipping...`);
          continue;
        }

        if (uri.indexOf('webcal://') === 0) {
          uri = uri.replace('webcal://', 'https://');
          info(`getEvents: Calendar '${name}': webcal found and replaced with https://`);
        }

        info(`getEvents: Getting events (${eventLimit.value} ${eventLimit.type} ahead) for calendar '${name}'`);

        await getContent(uri)
          .then(data => {
            let d;
            if (saveAll || saveActive) {
              d = new Date();
            }

            if (saveAll) {
              const rawPath = path.join(__dirname, `../../tests/contents/debug/all_${name}_${d.getDate()}.${(d.getMonth() + 1)}.${d.getFullYear()}.${typeof data === 'object' ? 'json' : 'ics'}`);
              warn(`About to save file to path '${rawPath}'`);
              saveFile((typeof data === 'object' ? JSON.stringify(data, null, 4) : data), rawPath);
              warn('Raw file saved');
            }

            const activeEvents = getActiveEvents(data, eventLimit);
            info(`getEvents: Events for calendar '${name}' found. Event count:`, activeEvents.length, '\n');
            calendarsEvents.push({ name, events: activeEvents });

            if (saveActive) {
              const activePath = path.join(__dirname, `../../tests/contents/debug/active_${name}_${d.getDate()}.${(d.getMonth() + 1)}.${d.getFullYear()}.${typeof activeEvents === 'object' ? 'json' : 'ics'}`);
              warn(`About to save file to path '${activePath}'`);
              saveFile((typeof activeEvents === 'object' ? JSON.stringify(activeEvents, null, 4) : activeEvents), activePath);
              warn('Active file saved');
            }
          })
          .catch(error_ => {
            const errorString = typeof error_ === 'object' ? error_.message : error_;

            error(`getEvents: Failed to get events for calendar '${name}', using url '${uri}':`, errorString, '\n');
          });
      }
    } else {
      info('getEvents: Add at least one calendar in config.js');
    }

    sortEvents(calendarsEvents);

    resolve(calendarsEvents);
  });
};
