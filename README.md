# zenit — AI Meditation

FastAPI backend plus a **Next.js** app in `frontend/`: describe how you feel, generate a guided meditation script, then play **full-session MP3** or **sentence-streamed** audio. Product name: **zenit**.

Product goals, stack, and assistant rules: **`AI_CONTEXT.md`**. API and UX changes: **`CHANGELOG.md`**. Work queue: **`TODO.md`**.

## Requirements

- **Python** 3.9+ (a checked-in `.venv` may use 3.9.x; any compatible 3.9+ is fine)
- **Node.js** 18+ and npm (`frontend/`)
- **API keys** (backend only; never commit real keys):
  - **OpenAI** and/or **Anthropic** (`LLM_PROVIDER` in `.env.example`)
  - **ElevenLabs** for speech endpoints

## Quick start

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
npm run setup               # copies .env + frontend/.env.local only if missing
# Edit `.env`: API keys, LLM_PROVIDER, APP_LOCALE (en | ko), CORS_ORIGINS, etc.
uvicorn app.main:app --reload --reload-dir app --host 127.0.0.1 --port 8000
```

### Verify the API (smoke test)

With the API running:

```bash
npm run smoke
# or: API_BASE=http://127.0.0.1:8000 bash scripts/smoke.sh
```

Exits non-zero if `demo_ready` is false (missing LLM or ElevenLabs keys in `.env`).

### One terminal: API + Next (optional)

With the same **activated** `.venv` (so `python` resolves to the venv interpreter), from the repo root:

```bash
npm install
npm run dev:stack
```

This runs the API on **127.0.0.1:8000** and `next dev` in `frontend/`. Stop with one `Ctrl+C` (`-k` tears down both).

### Frontend (Next.js)

Second terminal (if you are **not** using `dev:stack`):

```bash
cd frontend
cp -n .env.local.example .env.local
# NEXT_PUBLIC_API_BASE — API origin (default http://127.0.0.1:8000)
# NEXT_PUBLIC_DEFAULT_LOCALE — first-visit UI locale: en | ko (default en)
npm install
npm run dev
```

From the **repo root**, you can also run `npm run dev` / `npm run build` (they delegate to `frontend/`).

Open the URL printed by Next (often [http://localhost:3000](http://localhost:3000)). Default `CORS_ORIGINS` already allows **localhost** and **127.0.0.1** on ports **3000–3002**; if Next uses another port, add that origin to `CORS_ORIGINS` (comma-separated).

Opening [http://127.0.0.1:8000/](http://127.0.0.1:8000/) returns a small JSON map with links to `/docs` and health routes.

### Slow or “stuck” `next build`

The line **“Creating an optimized production build …”** can sit there for **several minutes** on first build (Webpack + minify + type checks). That is normal on slower disks or first run after `node_modules` / cache changes.

1. **Confirm it is still working:** Activity Monitor should show **Node** using CPU (not 0% forever). If CPU is 0% for 10+ minutes, it may be wedged — cancel (`Ctrl+C`) and try step 2.
2. **Clean and retry:**
   ```bash
   cd frontend
   rm -rf .next node_modules/.cache
   npm run build:memory
   ```
   `build:memory` raises the Node heap limit (helps if the process dies or stalls near OOM).
3. **Reduce interference:** pause heavy backup / antivirus real-time scan on the project folder; close extra editors or other `node` / `next dev` processes.
4. **File descriptor limits (macOS):** if you saw `EMFILE` during `next dev`, run `ulimit -n 10240` in the same terminal before `npm run build`.
5. **Still failing:** upgrade Node to the current **LTS** and run `npm install` again in `frontend/`.

- **API docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  
- **OpenAPI JSON:** [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

## Configuration

Load settings via **`pydantic-settings`** in `app/core/config.py` from the environment and optional **`.env`** (local only; **gitignored** — the app never deletes or rewrites it). Copy **`.env.example`** → **`.env`** for a new machine (`cp -n` avoids clobbering an existing file); never commit `.env`.

| Area | Purpose |
|------|---------|
| `PROJECT_NAME`, `API_V1_STR`, `DEBUG` | App metadata and `/api/v1` prefix |
| `CORS_ORIGINS` | Comma-separated browser origins; **127.0.0.1:3000–3003** are always merged in code so a short `.env` value does not block the UI |
| `APP_LOCALE` | Default script language when `locale` is omitted on meditation POST bodies: `en` \| `ko` |
| `LLM_PROVIDER`, `OPENAI_*`, `ANTHROPIC_*`, `LLM_TIMEOUT_SECONDS` | LLM provider and timeouts |
| `ELEVENLABS_*`, `TTS_*` | Voice, model, format, TTS limits |

## API overview

Routes live under **`/api/v1`**.

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health/live` | Process is up |
| `GET` | `/api/v1/health/ready` | Config flags only (no secrets): `llm_provider`, `llm_configured`, `tts_configured`, `demo_ready` (LLM + TTS both set). |

### Meditation

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/meditation/script` | Body: `{ "context": "...", "locale"?: "en" \| "ko" }` (10–8000 chars). Returns `script`, `locale`, `prompt_version`, `provider`, `model`. |
| `GET` | `/api/v1/meditation/voice-presets` | ElevenLabs calm presets (`bella_style`, …). |
| `POST` | `/api/v1/meditation/speech` | Body: `{ "script": "..." }` → binary MP3. |
| `POST` | `/api/v1/meditation/speech-stream` | NDJSON stream of sentence-sized MP3 chunks. |
| `POST` | `/api/v1/meditation/session` | Same body as `/script` plus optional `voice_preset` / `voice_id` for TTS; LLM + TTS → `script`, `locale`, `audio_base64`, `audio_truncated`. |

Prompts live in **`app/core/prompts/meditation_v2.py`** (version string in responses). Errors: JSON `{ "detail": "<message>" }` for `AppError`.

## Project layout

```text
app/                   # FastAPI
  main.py
  core/                # config, prompts (meditation_v2), exceptions, voice_presets
  routers/
  schemas/
  services/            # llm, tts, tts_stream, meditation_flow
frontend/              # Next.js 14 + Tailwind
  app/
  components/
  lib/                 # api.ts, i18n.ts
requirements.txt
tests/README.md        # automated tests deferred for MVP; folder kept for future
.env.example
AI_CONTEXT.md
CHANGELOG.md
TODO.md
```

## Development notes

- Shared **`httpx.AsyncClient`** in app lifespan; read timeout `max(LLM_TIMEOUT_SECONDS, TTS_TIMEOUT_SECONDS)`.
- New tunables: add typed fields on **`Settings`**, not scattered `os.getenv`.

### Automated tests

**Deferred** while MVP/demo work is prioritized. See **`tests/README.md`**. No `pytest` in `requirements.txt` for now.

## License

Not specified; add a `LICENSE` file when you choose one.
