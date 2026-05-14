# AI Meditation API

FastAPI backend for an AI-powered guided meditation experience: turn a short description of how the user feels into a personalized script (OpenAI or Anthropic), then optionally synthesize it with ElevenLabs TTS. Phase 1 focuses on the API; a Next.js UI is planned next (see `TODO.md`).

For product goals, stack, and assistant rules, see **`AI_CONTEXT.md`**. API and dependency changes are summarized in **`CHANGELOG.md`**.

## Requirements

- **Python** 3.9+ (the checked-in `.venv` uses 3.9.6; use any compatible 3.9+ interpreter)
- **API keys** (backend only; never commit real keys):
  - One of: **OpenAI** or **Anthropic** (see `LLM_PROVIDER` in `.env.example`)
  - **ElevenLabs** for speech endpoints

## Quick start

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set OPENAI_API_KEY and/or ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, LLM_PROVIDER, etc.
uvicorn app.main:app --reload
```

- **Interactive docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  
- **OpenAPI JSON:** [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

## Configuration

All tunables and secrets load through **`pydantic-settings`** in `app/core/config.py` from the process environment and an optional **`.env`** file (local only). Copy **`.env.example`** to `.env` and fill in values; do not commit `.env`.

Notable groups:

| Area | Purpose |
|------|---------|
| `PROJECT_NAME`, `API_V1_STR`, `DEBUG` | App metadata and version prefix (`/api/v1`) |
| `CORS_ORIGINS` | Comma-separated browser origins (default includes `http://localhost:3000` for Next.js) |
| `LLM_PROVIDER`, `OPENAI_*`, `ANTHROPIC_*`, `LLM_TIMEOUT_SECONDS` | LLM provider and timeouts |
| `ELEVENLABS_*`, `TTS_*` | Voice, model, output format, TTS limits |

## API overview

All versioned routes live under **`/api/v1`**.

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health/live` | Process is up |
| `GET` | `/api/v1/health/ready` | Placeholder readiness (`checks` empty until Phase 2+) |

### Meditation

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/meditation/script` | JSON body: `{ "context": "..." }` (10–8000 chars). Returns `script` plus `provider`, `model`, `prompt_version`. |
| `POST` | `/api/v1/meditation/speech` | JSON body: `{ "script": "..." }`. Returns **binary MP3** (`audio/mpeg`). |
| `POST` | `/api/v1/meditation/session` | Same body as `/script`. Runs LLM then TTS; returns script fields plus `audio_base64` (MP3), `audio_truncated`. |

Errors from the app use a JSON body `{ "detail": "<message>" }` for `AppError` responses.

## Project layout

```text
app/
  main.py              # FastAPI app, CORS, lifespan (shared httpx client)
  core/                # config, logging, prompts, exceptions
  routers/             # health, meditation
  schemas/             # Pydantic request/response models
  services/            # llm, tts, meditation_flow
requirements.txt
.env.example
AI_CONTEXT.md          # product + engineering context
CHANGELOG.md
TODO.md
```

## Development notes

- **Async I/O:** LLM and TTS calls use the shared `httpx.AsyncClient` created in the app lifespan; read timeout is `max(LLM_TIMEOUT_SECONDS, TTS_TIMEOUT_SECONDS)`.
- **Adding settings:** New secrets or tunables should be added as typed fields on `Settings` in `app/core/config.py`, not scattered `os.getenv` calls (see `AI_CONTEXT.md`).

## License

Not specified in this repository; add a `LICENSE` file when you choose one.
