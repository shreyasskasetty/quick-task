from typing import List, Union
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from pydantic import BaseModel, Field

class ChatInputType(BaseModel):
    messages: List[Union[HumanMessage, AIMessage, SystemMessage]]
