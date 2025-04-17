// Main graph
import {
  LangGraphRunnableConfig,
  START,
  StateGraph,
  END,
  Annotation,
  AnnotationRoot,
} from "@langchain/langgraph";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { initChatModel } from "langchain/chat_models/universal";
import { ChatOpenAI } from "@langchain/openai";
import { initializeTools, getEmailTools, getCalendarTools, getTodoTools } from "./tools.js";
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { EMAIL_AGENT_PROMPT, CALENDAR_AGENT_PROMPT, TODO_AGENT_PROMPT, SUPERVISOR_AGENT_PROMPT } from "./prompts.js";
import {
  ConfigurationAnnotation,
  ensureConfiguration,
} from "./configuration.js";
import { GraphAnnotation } from "./state.js";
import { getStoreFromConfigOrThrow, splitModelAndProvider } from "./utils.js";
// import { agent as emailAgentV1 } from "src/email_agent/index.js";
async function callModel(
  state: typeof GraphAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<{ messages: BaseMessage[] }> {
  const llm = await initChatModel();
  const store = getStoreFromConfigOrThrow(config);
  const configurable = ensureConfiguration(config);
  const memories = await store.search(["memories", configurable.userId], {
    limit: 10,
  });

  let formatted =
    memories
      ?.map((mem) => `[${mem.key}]: ${JSON.stringify(mem.value)}`)
      ?.join("\n") || "";
  if (formatted) {
    formatted = `\n<memories>\n${formatted}\n</memories>`;
  }

  const sys = configurable.systemPrompt
    .replace("{user_info}", formatted)
    .replace("{time}", new Date().toISOString());

  const tools = initializeTools(config);
  const boundLLM = llm.bind({
    tools: tools,
    tool_choice: "auto",
  });

  const result = await boundLLM.invoke(
    [{ role: "system", content: sys }, ...state.messages],
    {
      configurable: splitModelAndProvider(configurable.model),
    },
  );

  return { messages: [result] };
}

async function storeMemory(
  state: typeof GraphAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<{ messages: BaseMessage[] }> {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  const toolCalls = lastMessage.tool_calls || [];

  const tools = initializeTools(config);
  const upsertMemoryTool = tools[0];

  const savedMemories = await Promise.all(
    toolCalls.map(async (tc) => {
      return await upsertMemoryTool.invoke(tc);
    }),
  );

  return { messages: savedMemories };
}

function routeMessage(
  state: typeof GraphAnnotation.State,
): "store_memory" | typeof END {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls?.length) {
    return "store_memory";
  }
  return END;
}

// Create the graph + all nodes
export const builder = new StateGraph(
  {
    stateSchema: GraphAnnotation,
  },
  ConfigurationAnnotation
)
  .addNode("agent", callModel)
  .addNode("tools", storeMemory)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", routeMessage, {
    store_memory: "tools",
    [END]: END,
  })
  .addEdge("tools", "agent");
const memoryAgent = builder.compile({name: "memory_agent"});

/**
 * Email Agent
 */

const model = new ChatOpenAI({modelName: "gpt-4o"});
const emailTools = await getEmailTools();
const calendarTools = await getCalendarTools();
const todoTools = await getTodoTools();
export const emailAgent = createReactAgent({
  llm: model,
  tools: emailTools,
  name: "email_agent",
  prompt: EMAIL_AGENT_PROMPT.replace("{time}", new Date().toISOString())
});

export const calendarAgent = createReactAgent({
  llm: model,
  tools: calendarTools,
  name: "calendar_agent",
  prompt: CALENDAR_AGENT_PROMPT.replace("{time}", new Date().toISOString())
});

export const todoTaskAgent = createReactAgent({
  llm: model,
  tools: todoTools,
  name: "todo_agent",
  prompt: TODO_AGENT_PROMPT.replace("{time}", new Date().toISOString())
});

const workflow = createSupervisor({
  stateSchema: GraphAnnotation,
  agents: [emailAgent, calendarAgent, todoTaskAgent, memoryAgent as any],
  llm: model,
  supervisorName: "supervisor",
  prompt: SUPERVISOR_AGENT_PROMPT,
})

export const graph = workflow.compile();
graph.name = "QuickTaskAgent";
