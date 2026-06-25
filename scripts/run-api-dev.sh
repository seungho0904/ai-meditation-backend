#!/usr/bin/env bash
# Stable local API: reload only the app/ package (not .venv).
set -euo pipefail
cd "$(dirname "$0")/.."
# System HTTP_PROXY (IDE/VPN) often breaks OpenAI/ElevenLabs from localhost.
unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy ALL_PROXY all_proxy || true
exec python -m uvicorn app.main:app --reload --reload-dir app --host 127.0.0.1 --port 8000
