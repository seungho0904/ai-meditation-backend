# Project TODO

> Phase 1 per `AI_CONTEXT.md` MVP. Update this file when starting or finishing work.

## Phase 1 — MVP (Core Features)

### Backend — FastAPI foundation

- [x] Define Python dependencies at repo root (`requirements.txt`: FastAPI, Uvicorn, pydantic-settings, httpx)
- [x] `app/` package layout: `main.py`, `core/` (config, logging), `routers/`, `services/`
- [x] `pydantic-settings`-based configuration and `.env.example` (CORS, debug flags, etc.)
- [x] API version prefix `/api/v1` and CORS (defaults for local Next.js)
- [x] Health routes: `GET /api/v1/health/live`, `GET /api/v1/health/ready` (`ready` is a placeholder for Phase 2+ checks)
- [x] `async` lifespan hooks (for shared HTTP clients and similar later)
- [x] `.gitignore` (venv, `.env`, caches, etc.) and `README.md` local run instructions

### Backend — LLM

- [x] Register and tear down a shared `httpx.AsyncClient` (or per-provider clients) in lifespan
- [x] Choose OpenAI or Anthropic and wire env-based API keys (backend-only, per `AI_CONTEXT`)
- [x] Prompt template module for meditation scripts (under `core` or `services`, versionable)
- [x] Pydantic schema for emotional/situational input and script-generation router + service (`async` LLM calls)
- [x] LLM timeouts, error handling, and logging (clear HTTP responses on external API failure)

### Backend — ElevenLabs TTS

- [x] ElevenLabs async call service layer
- [x] Script text → audio bytes pipeline (Phase 1 architecture: tied to LLM output)
- [ ] (Optional) Stub or minimal S3 upload + presigned URL — scope per Phase 1 workflow in `AI_CONTEXT`

### Frontend — Next.js

- [ ] Initialize Next.js + Tailwind (monorepo vs separate directory TBD)
- [ ] Text form for emotional / situational input
- [ ] Display API response (script + audio URL/stream) and audio playback

---

## Notes

- **Current priority:** Next.js + Tailwind UI (text form, show script, play MP3 from `/meditation/session` or decode `audio_base64`).
