import { END, START, StateGraph } from "@langchain/langgraph";
import { CalendarAgentAnnotation, CalendarAgentState } from "./types.js";
import { writeEvent } from "./nodes/write-email.js";
import { interruptEvent } from "./nodes/interrupt.js";
import { sendEvent } from "./nodes/schedule-meeting.js";
import { rewriteEvent } from "./nodes/rewrite-event.js";

function routeAfterInterrupt(
  state: CalendarAgentState,
): typeof END | "sendEvent" | "rewriteEvent" {
  const responseType = state.humanResponse?.type;
  if (!responseType || responseType === "ignore") {
    return END;
  }
  if (responseType === "response") {
    return "rewriteEvent";
  }

  return "sendEvent";
}

function routeAfterWritingEmail(
  state: CalendarAgentState,
): typeof END | "interrupt" {
  if (!state.event) {
    return END;
  }
  return "interrupt";
}

const graph = new StateGraph(CalendarAgentAnnotation)
  .addNode("writeEvent", writeEvent)
  .addNode("interrupt", interruptEvent)
  .addNode("sendEvent", sendEvent)
  .addNode("rewriteEvent", rewriteEvent)
  .addEdge(START, "writeEvent")
  .addConditionalEdges("writeEvent", routeAfterWritingEmail, [END, "interrupt"])
  .addConditionalEdges("interrupt", routeAfterInterrupt, [
    "sendEvent",
    "rewriteEvent",
    END,
  ])
  .addEdge("rewriteEvent", "interrupt")
  .addEdge("sendEvent", END);

export const agent = graph.compile();
agent.name = "calendar_agent";
