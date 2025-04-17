import base64
from typing import Dict, Tuple
from datetime import datetime

def extract_email_details(payload: Dict) -> Dict:
    """
    Extracts sender, recipient, subject, and body from a Gmail API payload.
    
    Args:
        payload: Dictionary containing Gmail message data
        
    Returns:
        Tuple of (sender, to, subject, body)
    """
    # Extract basic fields
    sender = payload.get("sender", "")
    to = payload.get("to", "")
    subject = payload.get("subject", "")
    messageTimestamp = payload.get("messageTimestamp", datetime.now().isoformat())
    # Extract body text
    body = ""
    
    # Case 1: Body is directly in messageText
    if "messageText" in payload:
        body = payload["messageText"].strip()
    
    # Case 2: Body is in payload parts (base64 encoded)
    elif "payload" in payload and "parts" in payload["payload"]:
        for part in payload["payload"]["parts"]:
            if part["mimeType"] == "text/plain":
                body_data = part["body"].get("data", "")
                if body_data:
                    body = base64.b64decode(body_data).decode("utf-8").strip()
                break
    
    # Clean up line breaks and whitespace
    body = " ".join(body.split()) if body else "[No body content]"
    email_input = {
        "author": sender,
        "to": to,
        "subject": subject,
        "email_thread": body,
        "timestamp": messageTimestamp
    }
    return email_input