# Changelog

All notable changes to this project will be documented in this file.

**Date:** `2026-05-13` (all entries below are from this day; **order in time:** ① earliest → ④ latest).

---

## 2026-05-13

### ① Earliest — FastAPI backend scaffold

- Add FastAPI backend scaffold: versioned `/api/v1` routes, `core` (pydantic-settings, logging), `routers` (health), `services` placeholder, async lifespan, CORS defaults for Next.js; add `requirements.txt` (FastAPI, Uvicorn, pydantic-settings, httpx), `.env.example`, `.gitignore`, and README run instructions.

### ② — Phase 1 LLM integration

- Add Phase 1 LLM integration: shared `httpx.AsyncClient` in app lifespan; `POST /api/v1/meditation/script` supporting OpenAI Chat Completions and Anthropic Messages (env `LLM_PROVIDER`, API keys, models, timeouts); versioned prompts in `app/core/prompts/meditation_v1.py`; Pydantic request/response schemas; `AppError` JSON handler; extend `Settings` and `.env.example`.

### ③ — ElevenLabs TTS, streaming, session

- Add **sentence-chunked TTS streaming**: `POST /api/v1/meditation/speech-stream` returns NDJSON (`application/x-ndjson`) with per-sentence base64 MP3 for progressive playback.
- Add `GET /api/v1/meditation/voice-presets` and `app/core/voice_presets.py`: calm presets `bella_style`, `marcus_style`, `calm_female_conversational` (premade IDs from official ElevenLabs `text-to-speech` examples).
- Default `ELEVENLABS_VOICE_ID` is **Sarah** (`EXAVITQu4vr4xnSDxMaL`, soft female / Bella-like); older Rachel id `21m00TcmT4D76dWDzgHP` can return `voice_not_found` — override from [Voices](https://elevenlabs.io/app/voice-library) if needed.
- Add ElevenLabs TTS: `app/services/tts.py`, settings (`ELEVENLABS_*`, `TTS_TIMEOUT_SECONDS`, `TTS_MAX_INPUT_CHARS`), `POST /api/v1/meditation/speech` (MP3 binary), `POST /api/v1/meditation/session` (LLM then TTS, JSON with base64 MP3 + `audio_truncated`); extend shared `httpx` read timeout to `max(LLM, TTS)`; update `.env.example`, `README`, `TODO`.

### ④ Latest — Next.js UI, zenit branding, docs sync

- Add **Next.js 14 + Tailwind** under `frontend/`: context form, script generation, full-session MP3 (`/meditation/session`), sentence-stream playback (`/meditation/speech-stream`), voice preset picker; `NEXT_PUBLIC_API_BASE` via `.env.local.example`; update `README`, `TODO`, `.gitignore`.
- **Zen-style UI pass:** glassmorphism, off-white base, soft sky/sage ambience, **Voice Sphere** (aurora + breath sync to audio), Inter + wide tracking, long transitions; compose vs listen views; later consolidated under **zenit** branding.
- **Branding:** Product name **zenit**; browser metadata `zenit | AI Meditation`; sticky **ZenBar** wordmark + **EN / KO** locale switcher.
- **Backend — prompts & locale:** `app/core/prompts/meditation_v2.py` — zenit persona (warm guide + single-sentence reframing insight; short lines; no generic “hello” / “안녕하세요” script openers); script language via **`APP_LOCALE`** and optional request **`locale`** (`en` \| `ko`); **`locale`** echoed on script/session responses (`PROMPT_VERSION` e.g. `meditation_v2_zenit_i18n`). `meditation_v1` retained in tree for history; **`__init__.py` imports v2**.
- **Backend — config:** `Settings.APP_LOCALE` with validation; `.env.example` documents `APP_LOCALE`.
- **Frontend — i18n:** `LocaleProvider` (`localStorage` key `zenit-locale`), `lib/i18n.ts` copy for `en` / `ko`, `document.documentElement.lang` sync, `NEXT_PUBLIC_DEFAULT_LOCALE` in `.env.local.example`.
- **Frontend — UX:** **VoiceSphere** **soft dawn** look (pastel halo, bright-centered pearl orb, sage/sky mist); page base **~`#e8ecf4`**, light glass panels, subtle noise; slow transitions (~1s) and slow breath animation while loading or during playback.
- **Docs:** `README.md`, `AI_CONTEXT.md`, `TODO.md`, `CHANGELOG.md` aligned with current MVP.
- **Frontend — connectivity:** `fetchDemoReadiness()` calls `GET /api/v1/health/ready` to separate **API offline** vs **keys missing** (`demo_ready`); compose view shows amber (offline) or violet (misconfigured) banners + retry.
- **Session + voice:** `POST /meditation/session` accepts optional `voice_preset` / `voice_id`; full-session MP3 uses the same preset resolution as streaming.
- **Run locally:** default `CORS_ORIGINS` covers localhost / 127.0.0.1 ports 3000–3002; `GET /` on the API returns doc links; root `npm run dev:stack` runs API + Next together (`concurrently`).
- **MVP polish:** session MP3 auto-plays after **Begin**; words-only listen view surfaces stream CTA; `npm run setup` / `npm run smoke` scripts; improved FastAPI error messages in the UI.
