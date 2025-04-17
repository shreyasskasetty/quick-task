# listeners/email_listener.py
from composio_langchain import ComposioToolSet
from agents import *
from config import COMPOSIO_API_KEY
from graph.nodes import create_graph
from listeners.utils import extract_email_details
class EmailListener:
    def __init__(self):
        self.composio_toolset = ComposioToolSet(api_key=COMPOSIO_API_KEY)
        self.listener = self.composio_toolset.create_trigger_listener()
        self.agent = create_graph()

    def handle_new_email(self, event):
        """Callback function for new email events."""
        try:
            message_id = event.payload.get("threadId")
            email_input = extract_email_details(event.payload)
            print(email_input)
            self.agent.invoke({"email_input": email_input})
        except Exception as e:
            print(f"Error handling new email: {e}")

    def start(self):
        """Start listening for new email events."""
        self.listener.callback(filters={"trigger_name": "GMAIL_NEW_GMAIL_MESSAGE"})(self.handle_new_email)
        self.listener.wait_forever()

if __name__ == "__main__":
    listener = EmailListener()
    listener.start()