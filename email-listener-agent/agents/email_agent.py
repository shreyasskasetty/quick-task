# agents/email_agent.py
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from langchain_openai import ChatOpenAI
from composio_langchain import ComposioToolSet
from config import OUTLOOK_ACTIONS
from config import COMPOSIO_API_KEY

class EmailAgent:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0)
        self.composio_toolset = ComposioToolSet(api_key=COMPOSIO_API_KEY)
        self.tools = self.composio_toolset.get_tools(actions=OUTLOOK_ACTIONS)
        self.prompt = hub.pull("hwchase17/openai-functions-agent")

    def extract_actionable_items(self, message_id):
        """Extract actionable items from an email."""
        agent = create_openai_functions_agent(self.llm, self.tools, self.prompt)
        agent_executor = AgentExecutor(agent=agent, tools=self.tools, verbose=True)
        task = f"""
        Action: Extract actionable items from email

        Instructions:
        1. Retrieve the email using the provided Message ID and User ID.
        2. Analyze the email content for any actionable items or tasks.
        3. For each actionable item found:
           - Extract the task description
           - Note the source (e.g., sender's name or email address)
        Note:
        Examples/Types of Actionable Emails (Extract as Tasks):
        
        Direct Requests: "Send the report by Friday."

        Follow-Ups: "Review the contract and share feedback."

        Scheduling: "Suggest times for the Q3 meeting."

        Approvals: "Approve the budget proposal."

        Deadlines: "Deliver design mockups by tomorrow."

        Info Requests: "Provide latest sales figures."

        Problem-Solving: "Fix the website issue ASAP."

        Collaboration: "Share input on the social media strategy."

        Feedback: "Review the draft by Wednesday."

        Delegation: "Handle vendor negotiations."

        **Non-Actionable Emails (Ignore):**

        Informational: "Here’s the meeting agenda."

        FYI: "FYI, client call went well."

        Acknowledgments: "Thanks for the report!"

        Updates: "Project is on track."

        Note: Any email that is marketing or promotional in nature should be ignored. Many apartment leasing emails are marketing emails. Anyone who contacts for questions related to that should be ignored.
        Focus on emails that explicitly ask you to do something.
        Return only the list of actionable items or 'None'. Do not include any explanations or additional text.

        Inject these field values exactly as it is in the tool function OUTLOOK_OUTLOOK_GET_MESSAGE
        Message ID: {message_id}
        User ID: me
        Note: if the task has a due date, include as due date. 
        Actionable Tasks (if any) Output Format: (Strictly follow this format)
        [Task Description, Source]
        else Output format: None
        """

        result = agent_executor.invoke({"input": task})
        return result.get("output")