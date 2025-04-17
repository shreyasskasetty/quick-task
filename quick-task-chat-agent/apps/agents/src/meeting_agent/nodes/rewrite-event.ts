import { z } from "zod";
import { CalendarAgentState, CalendarAgentUpdate } from "../types.js"
import { ChatOpenAI } from "@langchain/openai";

const currentTimestamp = new Date().toISOString();
const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// Prompt for rewriting an event.
const REWRITE_EVENT_PROMPT = `You're an AI scheduling assistant tasked with rewriting an event for the user.
<timestamp>
  Current Timestamp: ${currentTimestamp}
  Timezone: ${currentTimeZone}
</timestamp>
Here is the current state of the event:
<event>
  <summary>
    {SUMMARY}
  </summary>
  <description>
    {DESCRIPTION}
  </description>
  <eventType>
    {EVENT_TYPE}
  </eventType>
  <start_datetime>
    {START_DATETIME}
  </start_datetime>
  <duration>
    {DURATION_HOUR} hour(s) and {DURATION_MINUTES} minute(s)
  </duration>
  <location>
    {LOCATION}
  </location>
  <attendees>
    {ATTENDEES}
  </attendees>
  <sendUpdates>
    {SEND_UPDATES}
  </sendUpdates>
  <visibility>
    {VISIBILITY}
  </visibility>
  <recurrence>
    {RECURRENCE}
  </recurrence>
  <transparency>
    {TRANSPARENCY}
  </transparency>
  <create_meeting_room>
    {CREATE_MEETING_ROOM}
  </create_meeting_room>
  <timezone>
    {TIMEZONE}
  </timezone>
</event>

Here is the user's response, which may include requests for changes to the event details:
<user-response>
{USER_RESPONSE}
</user-response>

Please rewrite the event according to the user's request. Do NOT modify any details the user does not explicitly ask to change.`;


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

export async function rewriteEvent(
  state: CalendarAgentState,
): Promise<CalendarAgentUpdate> {
  if (
    !state.humanResponse?.args ||
    typeof state.humanResponse.args !== "string"
  ) {
    throw new Error(
      "Cannot rewrite event if human response args is not defined, or not of type string."
    );
  }
  if (!state.event) {
    throw new Error("Cannot rewrite event if event is undefined.");
  }

  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
  }).bindTools(
    [
      {
        name: "write_event",
        description: "Rewrite an event invite based on the conversation history",
        schema: sendEventSchema,
      },
    ],
    {
      tool_choice: "write_event",
    },
  );

  const prompt = REWRITE_EVENT_PROMPT
  .replace("{SUMMARY}", state.event.summary || "")
  .replace("{DESCRIPTION}", state.event.description || "")
  .replace("{EVENT_TYPE}", state.event.eventType || "")
  .replace("{START_DATETIME}", state.event.start_datetime)
  .replace("{DURATION_HOUR}", String(state.event.event_duration_hour ?? "0"))
  .replace("{DURATION_MINUTES}", String(state.event.event_duration_minutes ?? "0"))
  .replace("{LOCATION}", state.event.location || "")
  .replace("{ATTENDEES}", state.event.attendees ? state.event.attendees.join(", ") : "")
  .replace("{SEND_UPDATES}", typeof state.event.sendUpdates === "boolean" ? String(state.event.sendUpdates) : "")
  .replace("{VISIBILITY}", state.event.visibility || "")
  .replace("{RECURRENCE}", state.event.recurrence ? state.event.recurrence.join(", ") : "")
  .replace("{TRANSPARENCY}", state.event.transparency || "")
  .replace("{CREATE_MEETING_ROOM}", typeof state.event.create_meeting_room === "boolean" ? String(state.event.create_meeting_room) : "")
  .replace("{TIMEZONE}", state.event.timezone || "")
  .replace("{USER_RESPONSE}", state.humanResponse.args);


  const response = await model.invoke([{ role: "user", content: prompt }]);

  const toolCall = response.tool_calls?.[0]?.args as
    | z.infer<typeof sendEventSchema>
    | undefined;
  if (!toolCall) {
    throw new Error("Failed to generate event");
  }

  return {
    event: toolCall,
    messages: [response],
  };
}
