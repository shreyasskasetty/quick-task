from langgraph.graph import StateGraph, START, END
from langgraph.types import Command
from typing import Literal
from prompts import triage_system_prompt, prompt_instructions, triage_user_prompt
from config import PROFILE
from pydantic import BaseModel, Field
from graph.state import State
from typing_extensions import TypedDict, Literal, Annotated
from langchain.chat_models import init_chat_model
from agents.extract_task import TaskAgent
from IPython.display import Image, display

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
llm =  init_chat_model( "openai:gpt-4o")

def triage_router(state: State) -> Command[
    Literal["task_agent", "__end__"]
]:
    author = state['email_input']['author']
    to = state['email_input']['to']
    subject = state['email_input']['subject']
    email_thread = state['email_input']['email_thread']
    timestamp = state['email_input']['timestamp']
    user_prompt = triage_user_prompt.format(
        author=author, 
        to=to, 
        subject=subject, 
        email_thread=email_thread
    )
    llm_router = llm.with_structured_output(Router)
    result = llm_router.invoke(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
    )

    if result.classification == "task":
        print("📧 Classification: TASK - This email has an actionable item")
        goto = "task_agent"
        update = {
            "messages": [
                {
                    "role": "user",
                    "content": f"""Extract the task from the given email and add it to the Google Tasks list.
                     <email>
                     Author: {author}
                     To: {to}
                     Subject: {subject}
                     Email Thread: {email_thread}
                     Timestamp: {timestamp}
                     </email>
                    """,
                }
            ]
        }
    elif result.classification == "ignore":
        print("🚫 Classification: IGNORE - This email can be safely ignored")
        update = None
        goto = END
    else:
        raise ValueError(f"Invalid classification: {result.classification}")
    return Command(goto=goto, update=update)

def create_graph():
    task_agent = TaskAgent()
    agent = task_agent.get_agent()
    email_agent = StateGraph(State)
    email_agent = email_agent.add_node(triage_router)
    email_agent = email_agent.add_node("task_agent", agent)
    email_agent = email_agent.add_edge(START, "triage_router")
    email_agent = email_agent.compile()
    return email_agent

if __name__ == "__main__":
    email_agent = create_graph()
    display(Image(email_agent.get_graph(xray=True).draw_mermaid_png()))