# Project: **zenit** — AI-Powered Guided Meditation Web App

**Product name:** zenit (browser title: `zenit | AI Meditation`).  
**Status:** Phase 1 (MVP) — **shipped:** FastAPI API + Next.js UI with script generation, full-session MP3, sentence-stream TTS, bilingual UI (`en` / `ko`), and versioned LLM prompts (`meditation_v2_*`). **Deferred:** S3 presigned URLs, DynamoDB, auth (Phase 2+).

## 1. Project Objective

- **Core:** Users describe how they feel; the app generates a personalized guided meditation script (LLM) and plays it via ElevenLabs TTS (full MP3 and/or streamed sentences).
- **Brand experience:** Calm, minimal, and trustworthy — **soft dawn / mist** visual language (not harsh black voids); central orb reads as a **moon-pearl / breath** focal point, not a face-like mask.
- **Future:** Two-way “venting” / counseling and cloud persistence per roadmap.
- **Portfolio:** Clean Next.js UI + strong FastAPI design (async I/O, typed config, versioned prompts, OpenAPI).

## 2. Tech Stack

- **Backend:** Python 3.9+, FastAPI, `httpx`, `pydantic-settings`.
- **Frontend:** Next.js 14, React 18, Tailwind CSS, TypeScript.
- **AI:** OpenAI Chat Completions or Anthropic Messages (`LLM_PROVIDER`); ElevenLabs TTS (streaming + presets).
- **Cloud (later):** DynamoDB, S3 — per Phase 2 in roadmap below.

## 3. System Architecture & Workflow (Phase 1)

1. **Client:** User enters context (10–8000 chars), chooses voice preset, selects UI locale (`en` | `ko`). Optional: words-only script or full session (script + MP3).
2. **API:** Builds prompts from `app/core/prompts/meditation_v2.py` (persona + `locale`-driven script language), calls LLM, then TTS as needed; returns JSON (and binary routes where applicable).
3. **Client:** Renders script, plays audio, optional NDJSON sentence stream.

*Note:* Phase 1 returns audio to the client directly (base64 / stream); S3 presigned flow remains roadmap.

## 4. Development Roadmap

### Phase 1: MVP — **[current baseline]**

- [x] FastAPI layout, health, CORS, shared `httpx` client.
- [x] LLM script + ElevenLabs speech + session + speech-stream + voice presets.
- [x] Next.js UI: compose / listen, VoiceSphere, glass panels, slow transitions.
- [x] **zenit** branding, **v2 prompts** (warm guide + reframing insight; no generic “hello” openers in script rules).
- [x] **Locales:** `APP_LOCALE`, request `locale`, response `locale`; Next `LocaleProvider`, `localStorage`, EN/KO copy.

### Phase 2: User Data & Cloud

- DynamoDB, auth, S3 caching / presigned URLs, Pytest for core routes.

### Phase 3: Venting & Deployment

- Venting chatbot, Docker, AWS + Vercel.

## 5. Coding Guidelines for AI Assistant (Cursor Rules)

- **English as default (repository):** Use **English** for `README`, `TODO`, `CHANGELOG`, edits to this file (except locked product names/lines the user pins), OpenAPI operator-facing strings, commit messages, and planning text unless the user requests a specific exception.
- **Supported product locales:** **`en` (default)** and **`ko`**. Server: `APP_LOCALE` in `.env`; optional `locale` on `POST /api/v1/meditation/script` and `POST /api/v1/meditation/session`; responses include `locale`. Client: persist UI language (e.g. `zenit-locale` in `localStorage`), send `locale` with script/session requests; `NEXT_PUBLIC_DEFAULT_LOCALE` for first paint. Repo docs stay English; **in-app** strings live in `frontend/lib/i18n.ts`.
- **Backend-heavy:** Business logic, prompts, and third-party calls stay in FastAPI; no API keys in the browser bundle.
- **Secrets:** Only via `Settings` in `app/core/config.py` + `.env` (never commit `.env`).
- **Async:** `async`/`await` for LLM/TTS and external HTTP.
- **Architecture:** Routers → services → `core` (config, prompts).
- **Errors & logging:** Structured handling for timeouts and provider failures.
- **No over-engineering:** Keep MVP explainable in an interview.

## 6. Product Notes — zenit (locked for consistency)

- **LLM persona (v2):** A warm, spacious guide (short lines, breath-friendly pacing) combined with **one crisp reframing sentence** after moments of reassurance (insight without jargon). Script language enforced by `locale` + prompt tails in `meditation_v2.py` (`PROMPT_VERSION` traceable).
- **UI:** Inter (400/600), wide tracking on body; sticky **ZenBar** with wordmark **zenit** + locale toggle; optional SVG noise at very low opacity; **VoiceSphere** = soft pastel halo + single bright-centered orb (sage / sky / violet mist), slow breath animation while loading or during playback.
