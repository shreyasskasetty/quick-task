# Quick Task Agents

Quick Task Agents is a modular set of services and interfaces designed to help busy professionals manage day‑to‑day tasks through natural language interactions—via chat or voice. Leveraging four core components, the system can schedule meetings, send emails, add calendar reminders, surface top-priority tasks, and automatically extract to‑dos from incoming emails.

## Demo Video
[![Watch on YouTube](https://img.youtube.com/vi/7E7uXJyFoS8/maxresdefault.jpg)](https://www.youtube.com/watch?v=7E7uXJyFoS8)

## Agents & Components

- **email-listener-agent**  
  A background daemon that monitors your inbox, extracts actionable items (e.g., “Please review the report by Friday”), and adds the tasks to your to‑do list.

- **quick-task-chat-agent**  
  The central chat interface handling user commands. It interprets requests like scheduling meetings, sending emails, adding reminders, and fetching top tasks based on deadlines and stored context.

- **voice-agent-backend**  
  The speech‑processing service that converts voice input into text commands, interfaces with the chat agent, and returns spoken or text results.

- **voice-agent-frontend**  
  A lightweight client application (web or mobile) providing microphone access for voice interactions and displaying responses from the backend.

## Key Features & User Stories

1. **Schedule Meeting**  
   As a busy professional, ask the bot to schedule a meeting with one or more attendees; it checks everyone’s availability within business hours and creates a calendar event.

2. **Send Email**  
   Quickly draft and send emails via chat or voice. The agent will ask follow‑up questions if details (recipient, subject, body) are missing.

3. **Add Calendar Reminder**  
   Add reminders for tasks or events by specifying time and description, ensuring you never miss important deadlines.

4. **Fetch Top 5 Tasks**  
   Retrieve your top five priority tasks for the day, prioritized by upcoming deadlines and previously stored context.

5. **Auto‑Extract Tasks from Email**  
   Automatically scan newly received emails, extract tasks with deadlines and context, and notify you for approval before adding them to your to‑do list.

## Getting Started

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   ```
2. **Configure composio API key** for email access, calendar APIs, and voice services in each agent’s `.env` file.
3. **Install libraries** Install all the libraries required
4. **Run each component** in its directory, e.g.:
   ```bash
   cd email-listener-agent && python main.py
   ```
5. **Interact** via the chat agent (CLI or web UI) or the voice frontend.
---

