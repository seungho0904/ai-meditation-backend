#!/usr/bin/env bash
# Copy env templates without overwriting existing secrets.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

if [ -f .env ]; then
  echo "✓ .env already exists — left unchanged"
else
  cp -n .env.example .env
  echo "→ Created .env from .env.example — add your API keys before running the API"
fi

if [ -f frontend/.env.local ]; then
  echo "✓ frontend/.env.local already exists — left unchanged"
else
  cp -n frontend/.env.local.example frontend/.env.local
  echo "→ Created frontend/.env.local from example"
fi

echo ""
echo "Next: activate .venv, pip install -r requirements.txt, edit .env, then:"
echo "  npm install && npm run dev:stack"
