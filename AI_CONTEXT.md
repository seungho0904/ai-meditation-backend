# Project Name: AI-Powered Guided Meditation & Venting Web App
**Status:** Phase 1 (MVP) — LLM + ElevenLabs TTS (`POST /api/v1/meditation/script`, `/meditation/speech`, `/meditation/session`). **Next:** Next.js UI + optional S3 presigned URLs per roadmap.

## 1. Project Objective
- **Core Functionality:** A web application that receives a user's current emotional state and situational context to generate a real-time, personalized guided meditation script, delivered via high-quality Text-to-Speech (TTS).
- **Future Expansion:** An interactive, two-way AI "venting" and counseling feature where users can share their struggles and receive empathetic, context-aware responses.
- **Portfolio Goal (US Tech Market Focus):** Keep the frontend UI clean and minimal, while heavily demonstrating robust backend API design in Python. The project must showcase strong competencies in LLM prompt engineering, asynchronous handling of 3rd-party APIs, and practical AWS cloud infrastructure integration.

## 2. Tech Stack
- **Backend:** Python, FastAPI (focusing on asynchronous processing, high concurrency, and type hinting).
- **Frontend:** Next.js (React), TailwindCSS (for a clean, responsive, and mobile-friendly UI).
- **Database & Cloud (AWS):** 
  - AWS DynamoDB (NoSQL for scalable user state and meditation log storage).
  - AWS S3 (for audio file caching and secure storage).
- **AI & 3rd Party APIs:** 
  - LLM: OpenAI API (gpt-4o-mini) or Anthropic Claude API (for script generation and chatbot logic).
  - TTS: ElevenLabs API (for high-fidelity, emotional voice synthesis).
- **DevOps & Quality (Bonus for Portfolio):** Docker (for containerization), Pytest (for unit testing).

## 3. System Architecture & Workflow (Phase 1)
1. **Client (Frontend):** The user inputs their current emotional state via a text form (e.g., "I have an important technical interview tomorrow and I'm feeling overwhelmed").
2. **Backend (FastAPI):** 
   - Constructs an optimized prompt and asynchronously calls the LLM API.
   - Streams the text response from the LLM directly to the TTS API to minimize latency.
   - Temporarily uploads the generated audio payload to AWS S3 and generates a pre-signed URL (or streams it directly to the client).
3. **Client (Frontend):** Receives the payload and renders the audio player alongside the text script for the user.

## 4. Development Roadmap

### Phase 1: MVP (Core Features) - **[Current Focus]**
- Initialize FastAPI project structure (separating routers, services, and configurations).
- Integrate LLM API and establish the prompt engineering pipeline for meditation scripts.
- Integrate ElevenLabs TTS API with asynchronous audio processing.
- Develop a basic Next.js UI (text input form and audio playback).

### Phase 2: User Data & Cloud Infrastructure (Enhancement)
- Design and integrate AWS DynamoDB schemas.
- Implement basic user authentication (JWT/Session) to track individual meditation histories.
- Implement a caching mechanism using AWS S3 (e.g., if a similar prompt/state is requested, reuse existing audio to optimize API costs and reduce latency).
- Write basic unit tests (Pytest) for core API endpoints.

### Phase 3: Venting Chat & Cloud Deployment (Expansion)
- Introduce an interactive "Venting" chatbot using RAG (Retrieval-Augmented Generation) or conversation memory based on the user's past meditation logs.
- Containerize the backend using Docker.
- Deploy the backend infrastructure using AWS (e.g., EC2 or Lambda + API Gateway) and host the frontend on Vercel.

## 5. Coding Guidelines for AI Assistant (Cursor Rules)
- **English as Default Language:** Use **English by default** for everything the assistant writes or updates in this repository unless the user explicitly asks for another language for a specific item. This includes: `README`, `TODO`, `CHANGELOG`, edits to `AI_CONTEXT` (without changing locked design sections), OpenAPI titles/summaries, log messages intended for operators, proposed Git commit messages, and checklist / planning text. **Identifiers, docstrings, and user-facing API copy** should also be English unless product requirements say otherwise—so the user does not need to repeat “use English” each session.
- **Backend-Heavy Logic:** Keep all core business logic, prompt engineering, and external API calls (LLM, TTS) strictly on the backend. The frontend should remain lightweight and API keys must be securely protected.
- **Secrets & environment variables:** Never hardcode API keys, tokens, or other secrets in Python source, tests, or comments. Load **all** configuration (including secrets) exclusively through **`pydantic-settings`** in `app/core/config.py` (`Settings` / `get_settings()`), backed by process environment variables and optionally a **local-only** `.env` file (never commit `.env`). Do **not** scatter `os.getenv(...)` across the codebase for secrets or tunables—if a new value is needed, **add a typed field on `Settings`** so validation and documentation stay centralized. (Settings reads the same OS environment as `os.getenv`; this rule chooses one canonical entry point.)
- **Strictly Asynchronous:** Use `async/await` for all I/O-bound operations (especially LLM and TTS network requests) to prevent blocking the event loop and ensure scalability.
- **Clean Architecture:** Strictly separate concerns. Use `routers` for endpoint definitions, `services` for business logic, and `core/config` for environment variables and prompt templates.
- **Robust Error Handling & Logging:** Implement clear exception handling for external API timeouts or failures, and log errors properly for easier debugging.
- **No Over-engineering:** Stick to the requirements of the current phase. Keep the code modular but simple enough to easily explain during a technical interview. Do not introduce complex design patterns unless absolutely necessary.