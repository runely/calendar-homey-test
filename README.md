![ts](https://badgen.net/badge/Built%20With/TypeScript/blue)
[![Formatted with Biome](https://img.shields.io/badge/Formatted_and_Linted_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev/)

# Test IcalCalendar behavior

This Node.js app will let you test [IcalCalendar](https://github.com/runely/calendar-homey) behavior:

* Get a list of the events retrieved from your calendar(s)
* Get the next event happening across all your calendars
* Get a list of your events happening today
* Get a list of your events happening tomorrow

## Setup

1. Clone the repo
    ```bash
    git clone https://github.com/runely/calendar-homey-test.git
    ```
2. Install dependencies
    ```bash
    npm i
    ```
3. Add your calendars
    1. Create the file `calendars.json`
    2. Insert the following to test the test calendar
        ```json
        {
            "calendars": [
                {
                    "name": "Default",
                    "uri": "https://raw.githubusercontent.com/runely/calendar-homey-test/master/calendars/default.ics",
                    "import": true,
                    "eventLimit": {
                        "value": 2,
                        "type": "months"
                    },
                    "options": {
                        "downloadIcs": false,
                        "saveAll": false,
                        "saveActive": false,
                        "showMeetingUrls": false,
                        "printAllEvents": false,
                        "printEventByIndex": -1,
                        "printEventByUIDs": []
                    },
                    "logProperties": [],
                    "tz": "Europe/Oslo"
                }
            ]
        }
        ```
    3. Add your own calendars to the list
        1. If you want to test a local ics file, swap out the uri with full path to the ics file and add `"isLocalFile": true` to `"options"`

## Usage

* Get a list of the events retrieved from your calendar(s)
    ```bash
    npm run calendars
    ```
* Get the next event happening across all your calendars as well
    ```bash
    npm run calendars-and-next-event
    ```
* Get a list of your events happening today as well
    ```bash
    npm run calendars-and-todays-events
    ```
* Get a list of your events happening tomorrow as well
    ```bash
    npm run calendars-and-tomorrows-events
    ```

## Configuration

To change how far into the future you want to retrieve events:
1. Open `calendars.json` and find the calendar you want to adjust
2. Change `value` to any number and `type` to one of the predefined types
    1. "days", "hours", "milliseconds", "minutes", "months", "quarters", "seconds", "weeks", "years"

If you want to download the actual *.ics file from the given URL:
1. Open `calendars.json` and find the calendar you want to adjust
2. Set `downloadIcs` to `true` to save the ics file, otherwise set it to `false`
3. If set to `true`, the file will be saved to `contents/ics/<name>_<date>.ics`

If you want to save all events retrieved/parsed through [node-ical](https://github.com/jens-maus/node-ical):
1. Open `calendars.json` and find the calendar you want to adjust
2. Set `saveAll` to `true` to save the file, otherwise set it to `false`
3. If set to `true`, the file will be saved to `contents/raw/<name>_<date>.json`

If you want to save active events retrieved/parsed through [node-ical](https://github.com/jens-maus/node-ical):
1. Open `calendars.json` and find the calendar you want to adjust
2. Set `saveActive` to `true` to save the file, otherwise set it to `false`
3. If set to `true`, the file will be saved to `contents/active/<name>_<date>.json`

Change *timezone* per calendar:
1. Open `calendars.json` and find the calendar you want to adjust
2. Add or change the property `tz` and set the *timezone* you want for that calendar

Show meeting urls:
1. Open `calendars.json` and find the calendar you want to adjust
2. Change `showMeetingUrl` from **false** to **true**

Print all events to console:
1. Open `calendars.json` and find the calendar you want to adjust
2. Change `printAllEvents` from **false** to **true**

Print event by index to console:
1. Open `calendars.json` and find the calendar you want to adjust
2. Change `printEventByIndex` from **-1** to **0 or higher**

Print event by UIDs to console:
1. Open `calendars.json` and find the calendar you want to adjust
2. Change `printEventByUIDs` from **[]** to **["UID-of-event-1","UID-of-event-2"]**

Add properties you want printed to console per event per calendar:
1. Open `calendars.json` and find the calendar you want to adjust
2. Add `event` to the `logProperties` array for console logging out the whole event

    AND/OR

3. Add one or more of these event property names to the `logProperties` array
    - `type`
    - `params`
    - `tzid`
    - `description`
    - `rrule`
    - `recurrences`
    - `recurrenceid`
    - `exdate`
    - `uid`
    - `summary`
    - `start`
    - `datetype`
    - `end`
    - `class`
    - `priority`
    - `dtstamp`
    - `transparency`
    - `status`
    - `sequence`
    - `location`
    - `method`
    - `prodid`
    - `version`
    - `WR-CALNAME`
    - `WR-TIMEZONE`
    - `LIC-LOCATION`
    - `created`
    - `lastmodified`
    - `organizer`
    - `attendee`
    - `url`
    - `attach`
    - `categories`
    - `calscale`
    - `MICROSOFT-CDO-APPT-SEQUENCE`
    - `MICROSOFT-CDO-BUSYSTATUS`
    - `MICROSOFT-CDO-INTENDEDSTATUS`
    - `MICROSOFT-CDO-ALLDAYEVENT`
    - `MICROSOFT-CDO-IMPORTANCE`
    - `MICROSOFT-CDO-INSTTYPE`
    - `MICROSOFT-DONOTFORWARDMEETING`
    - `MICROSOFT-DISALLOW-COUNTER`
    - `MICROSOFT-CDO-OWNERAPPTID`
    - `MICROSOFT-EVENTPROPERTIESTODELETE`
    - `MICROSOFT-ONLINEMEETINGCONFLINK`
    - `MICROSOFT-ONLINEMEETINGINFORMATION`
    - `MICROSOFT-SCHEDULINGSERVICEUPDATEURL`
    - `MICROSOFT-SKYPETEAMSMEETINGURL`
    - `MICROSOFT-SKYPETEAMSPROPERTIES`
    - `MICROSOFT-LOCATIONS`
    - `MS-OLK-AUTOFILLLOCATION`
    - `MS-OLK-CONFTYPE`
    - `APPLE-STRUCTURED-LOCATION`
    - `APPLE-TRAVEL-ADVISORY-BEHAVIOR`
    - `APPLE-TRAVEL-START`
