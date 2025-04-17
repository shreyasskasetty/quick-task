from langgraph_supervisor import create_supervisor
from voice_agent.agents.agent import EmailAgent, CalendarAgent, TodoAgent, MemoryAgent
from composio_langchain import ComposioToolSet
from langchain.chat_models import init_chat_model
from voice_agent.prompts import SUPERVISOR_AGENT_PROMPT
from langgraph.checkpoint.memory import MemorySaver
from typing_extensions import Annotated, TypedDict

class ConfigSchema(TypedDict):
    user_id: str
    thread_id: str

def create_graph():
    profile = {
        "name": "Shreyas",
        "full_name": "Shreyas S Kasetty",
        "user_profile_background": "Student at Texas A&M University pursuing a Master's in Computer Science.",
    }
    composio_toolset = ComposioToolSet(api_key="3objhchznifezy3mxd2d46")
    email_agent = EmailAgent(composio_toolset).get_agent()
    calendar_agent = CalendarAgent(composio_toolset).get_agent()
    tasks_agent = TodoAgent(composio_toolset).get_agent()
    memory_agent = MemoryAgent(profile).get_agent()
    model = init_chat_model("openai:gpt-4o", temperature=0)
    workflow = create_supervisor(
    [email_agent, tasks_agent, calendar_agent, memory_agent],
    model=model,
    prompt= SUPERVISOR_AGENT_PROMPT,
    )

    checkpointer = MemorySaver()
    graph = workflow.compile(checkpointer = checkpointer)
    return graph
