import type { IcalCalendarEvent } from "../../types/IcalCalendarEvent";

export const extractMeetingUrl = (event: IcalCalendarEvent): string | null => {
  if (event.description === "") {
    return null;
  }

  const match: RegExpExecArray | null = /https?:\/\/teams.microsoft.com\/l\/meetup-join\/[^>]+|https?:\/\/\S[^\n]+/.exec(event.description);
  return match ? match[0] : null;
};
