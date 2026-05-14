# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### 2026-05-15

- Add ElevenLabs TTS: `app/services/tts.py`, settings (`ELEVENLABS_*`, `TTS_TIMEOUT_SECONDS`, `TTS_MAX_INPUT_CHARS`), `POST /api/v1/meditation/speech` (MP3 binary), `POST /api/v1/meditation/session` (LLM then TTS, JSON with base64 MP3 + `audio_truncated`); extend shared `httpx` read timeout to `max(LLM, TTS)`; update `.env.example`, `README`, `TODO`.

### 2026-05-14

- Add Phase 1 LLM integration: shared `httpx.AsyncClient` in app lifespan; `POST /api/v1/meditation/script` supporting OpenAI Chat Completions and Anthropic Messages (env `LLM_PROVIDER`, API keys, models, timeouts); versioned prompts in `app/core/prompts/meditation_v1.py`; Pydantic request/response schemas; `AppError` JSON handler; extend `Settings` and `.env.example`.

### 2026-05-13

- Add FastAPI backend scaffold: versioned `/api/v1` routes, `core` (pydantic-settings, logging), `routers` (health), `services` placeholder, async lifespan, CORS defaults for Next.js; add `requirements.txt` (FastAPI, Uvicorn, pydantic-settings, httpx), `.env.example`, `.gitignore`, and README run instructions.
