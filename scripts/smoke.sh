#!/usr/bin/env bash
# Quick MVP smoke test — API must already be running on 127.0.0.1:8000
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:8000}"
V1="${API_BASE}/api/v1"

echo "→ GET ${API_BASE}/"
curl -sf "${API_BASE}/" | head -c 200
echo ""
echo ""

echo "→ GET ${V1}/health/live"
curl -sf "${V1}/health/live"
echo ""

echo "→ GET ${V1}/health/ready"
READY_JSON="$(curl -sf "${V1}/health/ready")"
echo "${READY_JSON}"

if command -v python3 >/dev/null 2>&1; then
  DEMO_READY="$(printf '%s' "${READY_JSON}" | python3 -c "import json,sys; print(json.load(sys.stdin).get('checks',{}).get('demo_ready', False))")"
  if [ "${DEMO_READY}" != "True" ]; then
    echo ""
    echo "⚠ demo_ready is false — set LLM + ElevenLabs keys in .env and restart the API."
    exit 1
  fi
fi

echo ""
echo "→ GET ${V1}/meditation/voice-presets"
curl -sf "${V1}/meditation/voice-presets" | head -c 300
echo ""
echo ""
echo "✓ Smoke checks passed (demo_ready=true). Open the Next UI and try Begin or Words only."
