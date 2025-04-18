# Quick Task Voice Agent Frontend

A Next.js + TypeScript web client for a voice‑driven productivity assistant.  
This app records your voice, transcribes it with OpenAI Whisper, routes text to the Quick Task agent, and plays back the agent’s response using ElevenLabs TTS.

---

## 🚀 Features

- **Voice Command Recording**  
  Capture spoken input via the browser’s microphone.  
- **Speech‑to‑Text**  
  Transcribe audio using OpenAI Whisper (via `/api/transcribe`).  
- **Agent Chat**  
  Send user text to the Supervisor Agent backend (`/api/agent-chat`) and receive a text response.  
- **Text‑to‑Speech**  
  Convert the agent’s reply into audio with ElevenLabs (`/api/text-to-speech`) and play it back.  
- **Simple UI**  
  A minimal interface for recording, viewing transcript, and listening to responses.

---

## 📦 Tech Stack

- **Framework:** Next.js (App Router)  
- **Language:** TypeScript  
- **Styling:** global CSS (can be swapped for Tailwind or other)  
- **TTS:** ElevenLabs API  
- **STT:** OpenAI Whisper API  
- **API Routes:**  
  - `/api/transcribe`  
  - `/api/agent-chat`  
  - `/api/text-to-speech`

---

## 🛠️ Prerequisites

- **Node.js** v18+  
- **pnpm** (or npm/yarn)  
- **Environment variables** (see below)  

---

## 🔧 Setup & Installation

1. **Clone the repo**  
   ```bash
   https://github.com/shreyasskasetty/quick-task.git
   cd quick-task/voice-agent-frontend
   ```

2. **Install dependencies**  
   ```bash
   pnpm install
   ```

3. **Configure environment variables**  
   Create a `.env.local` in the project root:
   ```ini
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```
   - `NEXT_PUBLIC_OPENAI_API_KEY` for Whisper transcription  
   - `NEXT_PUBLIC_ELEVENLABS_API_KEY` for ElevenLabs text‑to‑speech  

4. **Run the development server**  
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Usage

1. Click the **Record** button and speak your command.  
2. The app will display the transcribed text.  
3. Your text is sent to the voice‑agent backend.  
4. The response is fetched as text, then converted to audio and played automatically.  
5. Repeat as needed to manage calendar events, emails, tasks, or recall memory.

---

## 📂 Project Structure

```
voice-agent-frontend/
├── public/
│   ├── file.svg
│   ├── globe.svg
│   └── … (static assets)
├── src/
│   └── app/
│       ├── api/
│       │   ├── transcribe/ 
│       │   │   └── route.ts     # Handles Whisper STT
│       │   ├── agent-chat/      
│       │   │   └── route.ts     # Proxies to Supervisor Agent
│       │   └── text-to-speech/  
│       │       └── route.ts     # Handles ElevenLabs TTS
│       ├── globals.css
│       ├── layout.tsx
│       ├── page-v1.tsx         # (Optional legacy UI)
│       └── page.tsx            # Main chat interface
├── .env.example
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── eslint.config.mjs
└── tsconfig.json
```

---

## 🤝 Contributing

1. Fork and clone the repo  
2. Create a branch (`git checkout -b feature/xyz`)  
3. Implement your changes, commit, and push  
4. Open a PR against `main`  

Please follow the existing code style and run any linting/tests before submitting.

---

## 📄 License

MIT © Shreyas Shivakumar Kasetty, Texas A&M University