# agents/task_agent.py
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from langchain_openai import ChatOpenAI
from composio_langchain import ComposioToolSet
from config import GOOGLE_TASKS_ACTIONS, TASK_LIST_TITLE, COMPOSIO_API_KEY
import datetime

class TaskAgent:
    def __init__(self):
        self.llm = ChatOpenAI()
        self.composio_toolset = ComposioToolSet(api_key=COMPOSIO_API_KEY)
        self.tools = self.composio_toolset.get_tools(actions=GOOGLE_TASKS_ACTIONS)
        self.prompt = hub.pull("hwchase17/openai-functions-agent")

    def add_task_to_google_tasks(self, task_description, task_list_name=TASK_LIST_TITLE):
        """Add a task to Google Tasks."""
        agent = create_openai_functions_agent(self.llm, self.tools, self.prompt)
        agent_executor = AgentExecutor(agent=agent, tools=self.tools, verbose=True)

        input = f"""
        Action: Add task to Google Tasks
        Task description: {task_description}
        Task list: {task_list_name}

        Add a due date to task adding todays date or if specific date is given then add that date.
        System Time: {datetime.datetime.now().isoformat()} (in ISO format)
        Instructions:
        add the task to the specified task list in Google Tasks
        """

        result = agent_executor.invoke({"input": input})
        return result.get("output")