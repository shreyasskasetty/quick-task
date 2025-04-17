from __future__ import print_function
import os.path
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def get_gmail_service():
    """Shows basic usage of the Gmail API.
    Lists the user's Gmail labels.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens.
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    service = build('gmail', 'v1', credentials=creds)
    return service

def get_gmail_messages(max_results=10):
    """
    Retrieve Gmail messages from the user's inbox.
    
    Args:
        max_results (int): Maximum number of messages to return.
    
    Returns:
        List of message objects with id, threadId, and snippet.
    """
    try:
        service = get_gmail_service()
        results = service.users().messages().list(
            userId='me', maxResults=max_results).execute()
        messages = results.get('messages', [])
        
        if not messages:
            print("No messages found.")
            return []
        
        full_messages = []
        for message in messages:
            msg = service.users().messages().get(
                userId='me', id=message['id'], format='metadata').execute()
            full_messages.append(msg)
        
        return full_messages
    except Exception as error:
        print(f"An error occurred: {error}")
        return None

def get_message_details(message_id):
    """
    Get full details of a specific Gmail message.
    
    Args:
        message_id (str): The ID of the message to retrieve.
    
    Returns:
        A message object with full details including headers and body.
    """
    try:
        service = get_gmail_service()
        message = service.users().messages().get(
            userId='me', id=message_id, format='full').execute()
        return message
    except Exception as error:
        print(f"An error occurred: {error}")
        return None