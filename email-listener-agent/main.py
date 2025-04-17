from dotenv import load_dotenv
import os
from listeners import EmailListener

# Load environment variables from .env file
load_dotenv(".env")

# Ensure required environment variables are set
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY is not set in the .env file.")

if __name__ == "__main__":
    print("Starting Email Listener...")
    email_listener = EmailListener()
    email_listener.start()