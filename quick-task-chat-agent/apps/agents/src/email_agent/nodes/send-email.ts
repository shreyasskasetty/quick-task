import { v4 as uuidv4 } from "uuid";
import { AIMessage } from "@langchain/langgraph-sdk";
import { EmailAgentState, EmailAgentUpdate } from "../types.js";
import { ChatOpenAI } from "@langchain/openai";
import { getEmailTools } from "./tools.js";
import { z } from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const BooleanSchema = z.object({
  result: z.boolean().describe("Final true/false determination")
});

import { JsonOutputParser } from "@langchain/core/output_parsers";
import { exec } from "child_process";
import { SystemMessage } from "@langchain/core/messages";
const parser = new JsonOutputParser<typeof BooleanSchema>();

export async function sendEmail(
  _state: EmailAgentState,
): Promise<EmailAgentUpdate> {
  // Should yield a gen ui component rendering a 'sent' email.
  // This is a placeholder for the actual email sending logic.
  const tools = await getEmailTools();
  const email = _state.email;



  const PROMPT = `You are an excelent AI email assistant, tasked with sending an email for the user.
    <tools>
    OUTLOOK_OUTLOOK_SEND_EMAIL: Use this tool to send an email.
    </tools>
    <instructions>
    Given the email, send it using the GMAIL_SEND_EMAIL tool and return if the email was successfully sent or not. Just send the email once and end.
    <email>
    <subject>
      ${email?.subject}
    </subject>
    <body>
      ${email?.body}
    </body>
    <to>
      ${email?.to}
    </to>
    </email>
    <note>
    Populate only the fields that are required for each tool based on the user's request. Do not populate emtpty fields or have those fields. For Example, if users asks to send an email without any attachment then you dont need to have that field at all.
    When a user requests an action related to emails, determine the appropriate tool to use based on their request. Always confirm the action with the user before executing it. If the user provides incomplete information, ask clarifying questions to gather the necessary details
    </note>
  `
   const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0,
    });

  const agent = createReactAgent({llm: model,
    tools: tools,
    prompt: PROMPT
  });
  const response = await agent.invoke(
    { messages: [new SystemMessage(PROMPT)] },
  );
  // const outputPrompt = `You are an intelligent AI assistant who is an expert at determining if email send tool response was sucessful or not. If successfully sent return true else false.
  // <response>
  // ${response}
  // </response`;
  // const status = await outputModel.invoke(outputPrompt);
  console.log(response.messages[response.messages.length - 1].content);
  const tmpAiMessage: AIMessage = {
    type: "ai",
    id: uuidv4(),
    content: "Successfully sent email.",
  };
  return {
    messages: [tmpAiMessage],
  };
}
