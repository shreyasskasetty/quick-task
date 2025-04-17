import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { ensureConfiguration } from "./configuration.js";
import { v4 as uuidv4 } from "uuid";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getStoreFromConfigOrThrow } from "./utils.js";
import { LangGraphToolSet } from "composio-core";
const composioToolset = new LangGraphToolSet({apiKey:"3objhchznifezy3mxd2d46"});

/**
 * Tools for Todo Agent
 */
export async function getTodoTools(){
  const todoTools = await composioToolset.getTools({
    actions: ["GOOGLETASKS_LIST_TASKS", "GOOGLETASKS_LIST_TASK_LISTS", "GOOGLETASKS_GET_TASK_LIST", "GOOGLETASKS_DELETE_TASK", "GOOGLETASKS_INSERT_TASK", "GOOGLETASKS_GET_TASK", "GOOGLETASKS_CREATE_TASK_LIST"]
  })
  return todoTools;
}
/**
 * Tools for Calendar Agent
 */

export async function getCalendarTools(){
  const calendarTools = await composioToolset.getTools({
    actions: ["GOOGLECALENDAR_CREATE_EVENT", "GOOGLECALENDAR_REMOVE_ATTENDEE", "GOOGLECALENDAR_DELETE_EVENT", "GOOGLECALENDAR_FIND_FREE_SLOTS", "GOOGLECALENDAR_QUICK_ADD", "GOOGLECALENDAR_FIND_EVENT", "GOOGLECALENDAR_DELETE_EVENT"]
  })
  return calendarTools;
}
/**
 * Tools for the Email Agent
 */
export async function getEmailTools(){
    const emailTools = await composioToolset.getTools({
      actions: ["GMAIL_SEND_MESSAGE"],
    })
    return emailTools;
}
/**
 * Initialize tools within a function so that they have access to the current
 * state and config at runtime.
 */
export function initializeTools(config?: LangGraphRunnableConfig) {
  /**
   * Upsert a memory in the database.
   * @param content The main content of the memory.
   * @param context Additional context for the memory.
   * @param memoryId Optional ID to overwrite an existing memory.
   * @returns A string confirming the memory storage.
   */
  async function upsertMemory(opts: {
    content: string;
    context: string;
    memoryId?: string;
  }): Promise<string> {
    const { content, context, memoryId } = opts;
    if (!config || !config.store) {
      throw new Error("Config or store not provided");
    }

    const configurable = ensureConfiguration(config);
    const memId = memoryId || uuidv4();
    const store = getStoreFromConfigOrThrow(config);

    await store.put(["memories", configurable.userId], memId, {
      content,
      context,
    });

    return `Stored memory ${memId}`;
  }

  const upsertMemoryTool = tool(upsertMemory, {
    name: "upsertMemory",
    description:
      "Upsert a memory in the database. If a memory conflicts with an existing one, \
      update the existing one by passing in the memory_id instead of creating a duplicate. \
      If the user corrects a memory, update it. Can call multiple times in parallel \
      if you need to store or update multiple memories.",
    schema: z.object({
      content: z.string().describe(
        "The main content of the memory. For example: \
          'User expressed interest in learning about French.'",
      ),
      context: z.string().describe(
        "Additional context for the memory. For example: \
          'This was mentioned while discussing career options in Europe.'",
      ),
      memoryId: z
        .string()
        .optional()
        .describe(
          "The memory ID to overwrite. Only provide if updating an existing memory.",
        ),
    }),
  });

  return [upsertMemoryTool];
}
