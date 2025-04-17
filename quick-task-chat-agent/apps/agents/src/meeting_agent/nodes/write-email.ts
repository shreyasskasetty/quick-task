import { z } from "zod";
import { CalendarAgentState, CalendarAgentUpdate } from "../types.js";
import { ChatOpenAI } from "@langchain/openai";
import { formatMessages } from "../../utils/format-messages.js";

const currentTimestamp = new Date().toISOString();
const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const SEND_EVENT_PROMPT = `You're an AI scheduling assistant, tasked with writing an event for the user.
Use the entire conversation history between you and the user to craft the event details.
If there is NOT enough information to schedule an event, respond to the user requesting the missing information.
Required fields:
- summary: The title of the event.
- start_datetime: The start datetime of the event in YYYY-MM-DDTHH:MM:SS format.
- event_duration_hour: The event duration in hours.
- event_duration_minutes: The event duration in minutes.
- eventType: The type of the event (default, outOfOffice, focusTime, workingLocation).
- location: The location of the event (optional).
- description: The details of the event (optional).
- attendees: The list of attendees (optional).
- calendarId: The ID of the calendar (optional).
- sendUpdates: Whether to send updates to attendees (optional).
- visibility: The visibility of the event (optional).
- recurrence: List of RRULE, EXRULE, RDATE, EXDATE lines for recurring events (optional).
- transparency: The transparency of the event (optional).
- create_meeting_room: Whether to create a meeting room (optional).
- timezone: The timezone of the event (optional).
<timestamp>
      Current Timestamp: ${currentTimestamp}
      Timezone: ${currentTimeZone}
</timestamp>
`;

const sendEventSchema = z.object({
  summary: z.string().describe("The title of the event"),
  description: z.string().describe("The details of the event"),
  eventType: z.enum(["default", "outOfOffice", "focusTime", "workingLocation"]).describe("The type of the event"),
  start_datetime: z.string().describe("The start datetime of the event in YYYY-MM-DDTHH:MM:SS format"),
  event_duration_hour: z.number().describe("The duration hours of the event"),
  event_duration_minutes: z.number().describe("The duration minutes of the event"),
  location: z.string().optional().describe("The location of the event"),
  attendees: z.array(z.string()).optional().describe("The list of attendees"),
  sendUpdates: z.boolean().optional().describe("Whether to send updates to attendees"),
  visibility: z.enum(["default", "public", "private", "confidential"]).optional().describe("The visibility of the event"),
  recurrence: z.array(z.string()).optional().describe("List of RRULE, EXRULE, RDATE, EXDATE lines for recurring events."),
  transparency: z.enum(["default", "opaque", "transparent"]).optional().describe("The transparency of the event"),
  create_meeting_room: z.boolean().optional().describe("Whether to create a meeting room"),
  timezone: z.string().optional().describe("The timezone of the event"),
});

export async function writeEvent(
  state: CalendarAgentState,
): Promise<CalendarAgentUpdate> {
  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
  }).bindTools([
    {
      name: "write_event",
      description: "Write an event based on the conversation history",
      schema: sendEventSchema,
    },
  ]);

  const finalPrompt = `${SEND_EVENT_PROMPT}

<conversation>
${formatMessages(state.messages)}
</conversation>`;

  const response = await model.invoke([{ role: "user", content: finalPrompt }]);

  const toolCall = response.tool_calls?.[0]?.args as
    | z.infer<typeof sendEventSchema>
    | undefined;
  if (!toolCall) {
    return {
      messages: [response],
    };
  }

  return {
    event: toolCall,
    messages: [response],
  };
}
