# Project TODO

> Aligned with `AI_CONTEXT.md` and the current roadmap. Update checkboxes when work starts or finishes.

## Now — ship & verify (do first)

- [ ] Confirm **no secrets** staged or committed (`.env` must stay ignored; never `git add .env`).
- [ ] **`frontend/`:** run `npm run build` and fix any compile errors before relying on `npm run dev` alone.
- [ ] **`git push`** to `origin` so remote `main` matches local MVP (use `git commit -m "…"`; avoid empty editor commits).
- [ ] Smoke-test locally: `npm run smoke` (API on `:8000`), then Next on printed port — script + session + (optional) stream.

---

## Phase 1 — MVP (core features) — **[baseline done]**

### Backend — FastAPI foundation

- [x] Python dependencies (`requirements.txt`: FastAPI, Uvicorn, pydantic-settings, httpx)
- [x] `app/` layout: `main.py`, `core/`, `routers/`, `services/`
- [x] `pydantic-settings` + `.env.example` (CORS, debug, `APP_LOCALE`, LLM/TTS keys)
- [x] `/api/v1` prefix and CORS for local Next.js (extend origins if dev server uses non-3000 ports)
- [x] Health: `GET /api/v1/health/live`, `GET /api/v1/health/ready` (`checks.demo_ready`, LLM/TTS flags — no secrets)
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
- [ ] (Optional) S3 upload + presigned URL — MVP currently streams / returns bytes to client

### Frontend — Next.js (zenit)

- [x] Next.js 14 + Tailwind under `frontend/`
- [x] Context form, script display, full-session MP3 + optional sentence stream
- [x] **zenit** branding: metadata title, ZenBar wordmark, soft-dawn UI, VoiceSphere
- [x] **Locales:** `LocaleProvider`, `lib/i18n.ts`, EN/KO toggle, send `locale` to API, `NEXT_PUBLIC_DEFAULT_LOCALE`

### Phase 1 — closeout (polish, optional)

- [ ] Run `npm audit` on `frontend/`; apply safe fixes; avoid `npm audit fix --force` unless you accept breaking upgrades.
- [ ] Add a **`LICENSE`** file when you pick a license (noted in `README.md`).
- [ ] (Optional) Rename or document GitHub repo if it still reads “backend-only” while the repo is full-stack.

---

## Phase 2 — quality, deploy, persistence

**Suggested order:**

1. [ ] **Automated API tests** (pytest or unittest) — **deferred**; add when MVP is stable. See `tests/README.md`.
2. [ ] **Deploy path:** Vercel (or similar) for `frontend/`; set `NEXT_PUBLIC_API_BASE` to production API URL.
3. [ ] **Production CORS:** add deployed frontend origin(s) to backend `CORS_ORIGINS` (and any preview URLs if used).
4. [ ] **S3** caching and/or **presigned URLs** for audio (optional cost/latency win).
5. [ ] **DynamoDB** schemas + **basic auth** (meditation history, user-scoped data).

### Phase 2 — ops

- [ ] **Docker** image for API (and/or IaC) when you move off “laptop only” deploys.
- [ ] **AWS** (or chosen host) for API: EC2, Lambda + API Gateway, etc., per `AI_CONTEXT.md`.

---

## Phase 3 — product expansion

- [ ] **Venting / chat** feature (RAG or conversation memory tied to logs, per roadmap).

---

## Notes

- **CORS:** If `npm run dev` uses `localhost:3001+`, add each origin to `CORS_ORIGINS` in backend `.env`.
- **macOS `EMFILE`:** if Next watch errors appear, raise `ulimit -n` or reduce concurrent watchers.
- **Commits:** use `git commit -m "message"` if the editor flow aborts with “empty commit message”.
