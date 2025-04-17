import { Annotation } from "@langchain/langgraph";
import { GenerativeUIAnnotation } from "../types.js";
import { HumanResponse } from "@langchain/langgraph/prebuilt";

export type Email = {
  subject: string;
  body: string;
  to: string;
};

/**
 * Represents a calendar event used for scheduling meetings.
 * The properties are based on the provided input schema.
 */
export type CalendarEvent = {
  /**
   * Description of the event. Can contain HTML.
   */
  description?: string;
  
  /**
   * Type of the event, immutable after creation.
   * Allowed values: 'default', 'outOfOffice', 'focusTime', 'workingLocation'
   */
  eventType?: 'default' | 'outOfOffice' | 'focusTime' | 'workingLocation';
  
  /**
   * If true, a Google Meet link is created and added to the event.
   */
  create_meeting_room?: boolean;
  
  /**
   * Whether attendees other than the organizer can see who the event's attendees are.
   */
  guestsCanSeeOtherGuests?: boolean;
  
  /**
   * Whether attendees other than the organizer can invite others to the event.
   */
  guestsCanInviteOthers?: boolean;
  
  /**
   * Geographic location of the event as free-form text.
   */
  location?: string;
  
  /**
   * Summary (title) of the event.
   */
  summary?: string;
  
  /**
   * Indicates busy status. Allowed values: 'opaque' (busy) or 'transparent' (available).
   */
  transparency?: 'opaque' | 'transparent' | 'default';
  
  /**
   * Event visibility. Allowed values: 'default', 'public', 'private', 'confidential'
   */
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  
  /**
   * IANA timezone name (e.g., 'America/New_York').
   * Required if the datetime is naive. Otherwise, defaults to UTC if omitted.
   */
  timezone?: string;
  
  /**
   * List of recurrence rules (RRULE, EXRULE, RDATE, EXDATE) for recurring events.
   */
  recurrence?: string[];
  
  /**
   * If true, guests can modify the event.
   */
  guests_can_modify?: boolean;
  
  /**
   * List of attendee emails.
   */
  attendees?: string[];
  
  /**
   * Whether to send updates to the attendees (defaults to true).
   */
  send_updates?: boolean;
  
  /**
   * Start datetime for the event in the format YYYY-MM-DDTHH:MM:SS (without timezone offsets).
   * This field is required.
   */
  start_datetime: string;
  
  /**
   * Number of hours for the event duration (0-24).
   */
  event_duration_hour?: number;
  
  /**
   * Number of minutes for the event duration (0-59).
   * Must be less than 60.
   */
  event_duration_minutes?: number;
  
  /**
   * The ID of the Google Calendar. Use 'primary' for the primary calendar.
   */
  calendar_id?: string;

  /*
   * Whether to send updates to attendees (defaults to true).
   */
  sendUpdates?: boolean;

}

export const EmailAgentAnnotation = Annotation.Root({
  messages: GenerativeUIAnnotation.spec.messages,
  email: Annotation<Email | undefined>(),
  humanResponse: Annotation<HumanResponse | undefined>(),
});

export const CalendarAgentAnnotation = Annotation.Root({
  messages: GenerativeUIAnnotation.spec.messages,
  event: Annotation<CalendarEvent | undefined>(),
  humanResponse: Annotation<HumanResponse | undefined>(),
});

export type CalendarAgentState = typeof CalendarAgentAnnotation.State;
export type CalendarAgentUpdate = typeof CalendarAgentAnnotation.Update;

export type EmailAgentState = typeof EmailAgentAnnotation.State;
export type EmailAgentUpdate = typeof EmailAgentAnnotation.Update;
