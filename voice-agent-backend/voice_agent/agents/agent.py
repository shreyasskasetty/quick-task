from langgraph.prebuilt import create_react_agent
from langchain.chat_models import init_chat_model
from voice_agent.agents.constants import EMAIL_COMPOSIO_TOOLS, CALENDAR_COMPOSIO_TOOLS, TASKS_COMPOSIO_TOOLS
from voice_agent.prompts import EMAIL_AGENT_PROMPT, CALENDAR_AGENT_PROMPT, TODO_AGENT_PROMPT
from datetime import datetime
import math
import types
import uuid
from langgraph.store.memory import InMemoryStore
from voice_agent.agents.tools import manage_memory_tool, search_memory_tool
from voice_agent.prompts import agent_system_prompt_memory

class MemoryAgent:
    def __init__(self, profile):
        self.memory_tools = []
        self.profile = profile
        self.model = init_chat_model("openai:gpt-4o", temperature=0)
        self.tools = [manage_memory_tool, search_memory_tool]
        self.store = InMemoryStore(index={"embed": "openai:text-embedding-3-small"})
        self.agent = create_react_agent(
                model = self.model,
                tools=self.tools,
                name="memory_agent",
                prompt=self.create_prompt(),
            )
    def get_agent(self,):
        return self.agent
    
    def create_prompt(self):
        prompt = agent_system_prompt_memory.format(
                instructions="Whenever user asserts something important or interesting, remember it. Anything related to prioritization, meetings, prefrences, or anything else that might be useful to remember.", 
                **self.profile
            )
class EmailAgent:
    def __init__(self, composio_toolset):
        self.email_tools = []
        self.model = init_chat_model("openai:gpt-4o", temperature=0)
        self.tools = composio_toolset.get_tools(actions=EMAIL_COMPOSIO_TOOLS)
        self.agent = create_react_agent(
                model = self.model,
                tools=self.tools,
                name="email_agent",
                prompt=EMAIL_AGENT_PROMPT,
            )
    def get_agent(self,):
        return self.agent

class CalendarAgent:
    def __init__(self, composio_toolset):
        self.email_tools = []
        self.model = init_chat_model("openai:gpt-4o", temperature=0)
        self.tools = composio_toolset.get_tools(actions=CALENDAR_COMPOSIO_TOOLS)
        self.agent = create_react_agent(
                model = self.model,
                tools=self.tools,
                name="calendar_agent",
                prompt=CALENDAR_AGENT_PROMPT.format(time=datetime.now().astimezone().isoformat()),
            )
    def get_agent(self,):
        return self.agent

class TodoAgent:
    def __init__(self, composio_toolset):
        self.email_tools = []
        self.model = init_chat_model("openai:gpt-4o", temperature=0)
        self.tools = composio_toolset.get_tools(actions=TASKS_COMPOSIO_TOOLS)
        self.agent = create_react_agent(
                model = self.model,
                tools=self.tools,
                name="tasks_agent",
                prompt=TODO_AGENT_PROMPT.format(time=datetime.now().astimezone().isoformat()),

            )
            
    def get_agent(self,):
        return self.agent