# agents/task_agent.py
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from composio_langchain import ComposioToolSet
from langgraph.prebuilt import create_react_agent
from langchain.chat_models import init_chat_model
from prompts import agent_system_prompt, prompt_instructions
from config import GOOGLE_TASKS_ACTIONS, TASK_LIST_TITLE, COMPOSIO_API_KEY, PROFILE
from datetime import datetime

class TaskAgent:
    def __init__(self):
        self.llm = init_chat_model("openai:gpt-4o")
        self.composio_toolset = ComposioToolSet(api_key=COMPOSIO_API_KEY)
        self.tools = self.composio_toolset.get_tools(actions=GOOGLE_TASKS_ACTIONS)
    
    def create_prompt(self, state):
        return [
            {
                "role": "system", 
                "content": agent_system_prompt.format(
                    task_list_title=TASK_LIST_TITLE,
                    instructions=prompt_instructions["agent_instructions"],
                    time=datetime.now().isoformat(),
                    **PROFILE
                    )
            }
        ] + state['messages']
    
    def get_agent(self):
        agent = create_react_agent(
                model = self.llm,
                tools=self.tools,
                prompt=self.create_prompt,
            )
        return agent