from pydantic import BaseModel, Field
from typing_extensions import TypedDict, Literal, Annotated
from langchain.chat_models import init_chat_model
from langchain_openai import ChatOpenAI
from composio_langchain import ComposioToolSet
from config import OUTLOOK_ACTIONS, PROFILE
from config import COMPOSIO_API_KEY
from prompts import triage_system_prompt, prompt_instructions, triage_user_prompt

class Router(BaseModel):
    """Analyze the unread email and route it according to its content."""

    reasoning: str = Field(
        description="Step-by-step reasoning behind the classification."
    )
    classification: Literal["ignore", "task"] = Field(
        description="The classification of an email: 'ignore' for irrelevant emails, "
        "'task' for emails that need a reply or is a task for the user.",
)
    
system_prompt = triage_system_prompt.format(
    full_name=PROFILE["full_name"],
    name=PROFILE["name"],
    examples=None,
    user_profile_background=PROFILE["user_profile_background"],
    triage_no=prompt_instructions["triage_rules"]["ignore"],
    triage_email=prompt_instructions["triage_rules"]["task"],
)

class EmailTaskAgent:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0)
        self.llm_router = self.llm.with_structured_output(Router)
        self.composio_toolset = ComposioToolSet(api_key=COMPOSIO_API_KEY)
        self.tools = self.composio_toolset.get_tools(actions=OUTLOOK_ACTIONS)
    