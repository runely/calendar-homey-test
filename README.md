﻿# Test IcalCalendar behavior

This nodejs app will let you test [IcalCalendar](https://github.com/runely/calendar-homey) behavior:

* Get a list of the events retrieved from your calendar(s)
* Get the next event happening across all your calendars
* Get a list of your events happening today
* Get a list of your events happening tomorrow

## Setup

1. Clone the repo
    ```bash
    git clone https://github.com/runely/calendar-homey-test.git
    ```
1. Install dependencies
    ```bash
    npm install
    ```
1. Add your calendars
    1. Create the file `calendars.json`
    1. Insert the following to test the test calendar
        ```javascript
        {
            "calendars": [
                {
                    "name": "Default",
                    "uri": "https://github.com/runely/calendar-homey-test/blob/master/calendars/default.ics",
                    "import": true
                }
            ]
        }
        ```
    1. Add your own calendars to the list

## Usage

* Get a list of the events retrieved from your calendar(s)
    ```bash
    npm run calendars
    ```
* Get the next event happening across all your calendars aswell
    ```bash
    npm run calendars-and-next-event
    ```
* Get a list of your events happening today aswell
    ```bash
    npm run calendars-and-todays-events
    ```
* Get a list of your events happening tomorrow aswell
    ```bash
    npm run calendars-and-tomorrows-events
    ```

## Configuration

To change how far into the future you want to retrieve events:
1. Open `config.js` and find the `eventLimit` export
1. Change `value` to any number and `type` to one of the predefined types

If you want to save all events retrieved/parsed through [node-ical](https://github.com/jens-maus/node-ical):
1. Open `config.js` and find the `debugOptions` export
1. Set `saveAll` to `true` to save the file, otherwise set it to `false`
1. File is saved to `tests/contents/debug/all_%calendarname%_dd.MM.yyyy.json`

If you want to save active events retrieved/parsed through [node-ical](https://github.com/jens-maus/node-ical):
1. Open `config.js` and find the `debugOptions` export
1. Set `saveActive` to `true` to save the file, otherwise set it to `false`
1. File is saved to `tests/contents/debug/active_%calendarname%_dd.MM.yyyy.json`