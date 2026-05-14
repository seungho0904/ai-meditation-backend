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
cp .env.example .env
# Edit .env: API keys, LLM_PROVIDER, APP_LOCALE (en | ko), CORS_ORIGINS, etc.
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend (Next.js)

Second terminal:

```bash
cd frontend
cp .env.local.example .env.local
# NEXT_PUBLIC_API_BASE — API origin (default http://127.0.0.1:8000)
# NEXT_PUBLIC_DEFAULT_LOCALE — first-visit UI locale: en | ko (default en)
npm install
npm run dev
```

Open the URL printed by Next (often [http://localhost:3000](http://localhost:3000)). If ports 3000–3002 are busy, Next picks the next free port — **add that origin** to backend `CORS_ORIGINS` (comma-separated) so browser calls succeed.

- **API docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  
- **OpenAPI JSON:** [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

## Configuration

Load settings via **`pydantic-settings`** in `app/core/config.py` from the environment and optional **`.env`** (local only). Copy **`.env.example`** → **`.env`**; never commit `.env`.

| Area | Purpose |
|------|---------|
| `PROJECT_NAME`, `API_V1_STR`, `DEBUG` | App metadata and `/api/v1` prefix |
| `CORS_ORIGINS` | Comma-separated browser origins (include every Next dev origin you use) |
| `APP_LOCALE` | Default script language when `locale` is omitted on meditation POST bodies: `en` \| `ko` |
| `LLM_PROVIDER`, `OPENAI_*`, `ANTHROPIC_*`, `LLM_TIMEOUT_SECONDS` | LLM provider and timeouts |
| `ELEVENLABS_*`, `TTS_*` | Voice, model, format, TTS limits |

## API overview

Routes live under **`/api/v1`**.

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health/live` | Process is up |
| `GET` | `/api/v1/health/ready` | Placeholder readiness |

### Meditation

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/meditation/script` | Body: `{ "context": "...", "locale"?: "en" \| "ko" }` (10–8000 chars). Returns `script`, `locale`, `prompt_version`, `provider`, `model`. |
| `GET` | `/api/v1/meditation/voice-presets` | ElevenLabs calm presets (`bella_style`, …). |
| `POST` | `/api/v1/meditation/speech` | Body: `{ "script": "..." }` → binary MP3. |
| `POST` | `/api/v1/meditation/speech-stream` | NDJSON stream of sentence-sized MP3 chunks. |
| `POST` | `/api/v1/meditation/session` | Same body as `/script` (including optional `locale`); LLM + TTS → `script`, `locale`, `audio_base64`, `audio_truncated`. |

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
.env.example
AI_CONTEXT.md
CHANGELOG.md
TODO.md
```

## Development notes

- Shared **`httpx.AsyncClient`** in app lifespan; read timeout `max(LLM_TIMEOUT_SECONDS, TTS_TIMEOUT_SECONDS)`.
- New tunables: add typed fields on **`Settings`**, not scattered `os.getenv`.

## License

Not specified; add a `LICENSE` file when you choose one.
