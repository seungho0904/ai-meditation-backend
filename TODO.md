# Project TODO

> Phase 1 per `AI_CONTEXT.md`. Update when starting or finishing work.

## Phase 1 — MVP (Core Features)

### Backend — FastAPI foundation

- [x] Python dependencies (`requirements.txt`: FastAPI, Uvicorn, pydantic-settings, httpx)
- [x] `app/` layout: `main.py`, `core/`, `routers/`, `services/`
- [x] `pydantic-settings` + `.env.example` (CORS, debug, `APP_LOCALE`, LLM/TTS keys)
- [x] `/api/v1` prefix and CORS for local Next.js (extend origins if dev server uses non-3000 ports)
- [x] Health: `GET /api/v1/health/live`, `GET /api/v1/health/ready` (placeholder checks until Phase 2+)
- [x] Async lifespan (shared `httpx.AsyncClient`)
- [x] `.gitignore`, `README.md`

### Backend — LLM & meditation

- [x] Shared `httpx.AsyncClient` in lifespan
- [x] OpenAI / Anthropic via `LLM_PROVIDER` and env keys
- [x] Versioned prompts — **`meditation_v2`** (zenit persona + `locale`-aware script language; `PROMPT_VERSION` traceable)
- [x] Pydantic schemas + `POST /meditation/script` + error handling
- [x] Optional `locale` on script/session; default `APP_LOCALE`; response field `locale`

### Backend — ElevenLabs TTS

- [x] Async TTS service
- [x] Script → audio (full MP3 + one-shot session)
- [x] Sentence NDJSON stream + `GET /meditation/voice-presets`
- [ ] (Optional) S3 upload + presigned URL — Phase 1 currently streams / returns bytes to client

### Frontend — Next.js (zenit)

- [x] Next.js 14 + Tailwind under `frontend/`
- [x] Context form, script display, full-session MP3 + optional sentence stream
- [x] **zenit** branding: metadata title, ZenBar wordmark, soft-dawn UI, VoiceSphere (non-harsh orb)
- [x] **Locales:** `LocaleProvider`, `lib/i18n.ts`, EN/KO toggle, send `locale` to API, `NEXT_PUBLIC_DEFAULT_LOCALE`

---

## Phase 2+ (next)

- [ ] DynamoDB schemas + basic auth (meditation history)
- [ ] S3 caching / presigned URLs for audio
- [ ] Pytest for core routers / services
- [ ] Docker + deploy (AWS API + Vercel frontend)
- [ ] Venting / chat expansion (Phase 3)

## Notes

- **CORS:** If `npm run dev` binds to `localhost:3001+`, add each origin to `CORS_ORIGINS`.
- **npm audit:** Vulnerability reports from `npm install` do not block `next dev`; triage with `npm audit` before `npm audit fix --force` (can introduce breaking upgrades).
