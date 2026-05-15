"""Liveness/readiness — cheap checks for orchestrators and sanity after deploy."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter

from app.core.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
async def live() -> dict[str, str]:
    """Process is up (does not check LLM/TTS/AWS)."""
    return {"status": "ok"}


@router.get("/ready")
async def ready() -> dict[str, Any]:
    """
    Lightweight config flags for demos (no secrets exposed).
    Phase 2+ can add DynamoDB ping, etc.
    """
    cfg = get_settings()
    provider = (cfg.LLM_PROVIDER or "").strip().lower()
    llm_configured = (
        (provider == "openai" and bool(cfg.OPENAI_API_KEY))
        or (provider == "anthropic" and bool(cfg.ANTHROPIC_API_KEY))
    )
    tts_configured = bool(cfg.ELEVENLABS_API_KEY)
    return {
        "status": "ok",
        "checks": {
            "llm_provider": provider,
            "llm_configured": llm_configured,
            "tts_configured": tts_configured,
            "demo_ready": llm_configured and tts_configured,
        },
    }
