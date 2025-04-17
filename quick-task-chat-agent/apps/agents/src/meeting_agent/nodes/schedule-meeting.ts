import { v4 as uuidv4 } from "uuid";
import { AIMessage } from "@langchain/langgraph-sdk";
import { CalendarAgentState, CalendarAgentUpdate } from "../types.js";
import { ChatOpenAI } from "@langchain/openai";
import { getCalendarTools } from "./tools.js";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";

export async function sendEvent(
  state: CalendarAgentState,
): Promise<CalendarAgentUpdate> {
  // This is a placeholder for the actual event scheduling logic.
  const tools = await getCalendarTools();
  const event = state.event;
  const currentTimestamp = new Date().toISOString();
  const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const PROMPT = `You are an excellent AI scheduling assistant, tasked with sending an event for the user.
    <tools>
    CALENDAR_CREATE_EVENT: Use this tool to schedule an event on the calendar.
    </tools>
    <timestamp>
      Current Timestamp: ${currentTimestamp}
      Timezone: ${currentTimeZone}
    </timestamp>
    <instructions>
    Given the event details below, schedule the event using the CALENDAR_CREATE_EVENT tool and return whether the event was successfully scheduled or not. Just schedule the event once and then end.
    <event>
      <summary>
        ${event?.summary}
      </summary>
      <description>
        ${event?.description}
      </description>
      <eventType>
        ${event?.eventType}
      </eventType>
      <start_datetime>
        ${event?.start_datetime}
      </start_datetime>
      <duration>
        ${event?.event_duration_hour || 0} hour(s) and ${event?.event_duration_minutes || 0} minute(s)
      </duration>
      <location>
        ${event?.location || ""}
      </location>
      <attendees>
        ${event?.attendees?.map((attendee) => attendee).join(", ") || ""}
      </attendees>
      <sendUpdates>
        ${event?.sendUpdates || false}
      </sendUpdates>
      <visibility>
        ${event?.visibility || "default"} 
      </visibility>
      <recurrence>
        ${event?.recurrence?.map((rule) => rule).join(", ") || ""}
      </recurrence>
    </event>
    <note>
      Populate only the fields that are required for each tool based on the user's request. Do not include empty fields.
      When a user requests an action related to scheduling events, determine the appropriate tool to use based on their request. Always confirm the action with the user before executing it. If the user provides incomplete information, ask clarifying questions to gather the necessary details.
    </note>
  `;

  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
  });

  const agent = createReactAgent({
    llm: model,
    tools: tools,
    prompt: PROMPT,
  });

  const response = await agent.invoke({
    messages: [new SystemMessage(PROMPT)],
  });

  console.log(response.messages[response.messages.length - 1].content);

  // For the sake of this placeholder, we simply return a success message.
  const tmpAiMessage: AIMessage = {
    type: "ai",
    id: uuidv4(),
    content: "Successfully scheduled event.",
  };

  return {
    messages: [tmpAiMessage],
  };
}
