import { CalendarEvent, CalendarAgentState, CalendarAgentUpdate } from "../types.js";
import { HumanInterrupt, HumanResponse } from "@langchain/langgraph/prebuilt";
import { interrupt } from "@langchain/langgraph";

export async function interruptEvent(
  state: CalendarAgentState,
): Promise<CalendarAgentUpdate> {
  if (!state.event) {
    throw new Error("Cannot interrupt if event is undefined.");
  }

  const description = `# New Meeting Event Request

## Summary (Title)
${state.event.summary}

## Description (HTML allowed)
${state.event.description}

## Event Type
${state.event.eventType}

## Start Datetime
${state.event.start_datetime}

## Duration
${state.event.event_duration_hour} hour(s) and ${state.event.event_duration_minutes} minute(s)

## Location
${state.event.location}

## Timezone
${state.event.timezone}

## Visibility
${state.event.visibility}

## Transparency (Busy/Available)
${state.event.transparency}

## Recurrence
${state.event.recurrence}

## Guests Can Modify Event
${state.event.guests_can_modify}

## Attendees (Emails)
${state.event.attendees}

## Send Updates to Attendees
${state.event.send_updates}

## Create Meeting Room (Google Meet)
${state.event.create_meeting_room}

## Guest Options
- Guests Can See Other Guests: ${state.event.guestsCanSeeOtherGuests}
- Guests Can Invite Others: ${state.event.guestsCanInviteOthers}

## Response Instructions

- **Response**: Any response submitted will be passed to an LLM to rewrite the event details. Feel free to modify fields such as summary, description, event type, start datetime, duration, location, etc.
- **Edit or Accept**: Editing/Accepting this event will schedule it.
- **Ignore**: Ignoring will end the conversation and the event will not be scheduled.
`;

  const res = interrupt<HumanInterrupt[], HumanResponse[]>([
    {
      action_request: {
        action: "New Meeting Event Draft",
        args: {
          ...state.event,
        },
      },
      description,
      config: {
        allow_ignore: true,
        allow_respond: true,
        allow_edit: true,
        allow_accept: true,
      },
    },
  ])[0];

  if (["ignore", "response", "accept"].includes(res.type)) {
    return {
      humanResponse: res,
    };
  }

  console.log(res.args);

  // Validate that the essential fields are provided in an edit response.
  // Here we require at a minimum: summary, start_datetime, event_duration_hour, event_duration_minutes, and eventType.
  if (
    typeof res.args !== "object" ||
    !res.args ||
    !("summary" in res.args) ||
    !("start_datetime" in res.args) ||
    !("event_duration_hour" in res.args) ||
    !("event_duration_minutes" in res.args) ||
    !("eventType" in res.args)
  ) {
    throw new Error(
      "If response type is edit, args must be an object with 'summary', 'start_datetime', 'event_duration_hour', 'event_duration_minutes', and 'eventType' fields."
    );
  }

  const {
    summary,
    description: eventDescription,
    eventType,
    start_datetime,
    event_duration_hour,
    event_duration_minutes,
    calendar_id,
    create_meeting_room,
    guestsCanSeeOtherGuests,
    guestsCanInviteOthers,
    location,
    transparency,
    visibility,
    timezone,
    recurrence,
    guests_can_modify,
    attendees,
    send_updates,
  } = res.args as CalendarEvent;

  return {
    event: {
      summary,
      description: eventDescription,
      eventType,
      start_datetime,
      event_duration_hour,
      event_duration_minutes,
      calendar_id,
      create_meeting_room,
      guestsCanSeeOtherGuests,
      guestsCanInviteOthers,
      location,
      transparency,
      visibility,
      timezone,
      recurrence,
      guests_can_modify,
      attendees,
      send_updates,
    },
    humanResponse: res,
  };
}
