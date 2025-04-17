# config.py
import os

# OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
COMPOSIO_API_KEY = os.getenv("COMPOSIO_API_KEY")
# Composio Toolset Actions
OUTLOOK_ACTIONS = ["OUTLOOK_OUTLOOK_GET_MESSAGE"]
GOOGLE_TASKS_ACTIONS = ["GOOGLETASKS_INSERT_TASK", "GOOGLETASKS_LIST_TASK_LISTS"]
TASK_LIST_TITLE = "Email Tasks"
PROFILE = {
    "full_name": "Shreyas",
    "name": "Shreyas",
    "user_profile_background": "Shreyas is a busy executive who receives a lot of emails. He needs help managing his tasks efficiently.",
}