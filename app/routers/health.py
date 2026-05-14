"""Liveness/readiness — cheap checks for orchestrators and sanity after deploy."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
async def live() -> dict[str, str]:
    """Process is up (does not check LLM/TTS/AWS)."""
    return {"status": "ok"}


@router.get("/ready")
async def ready() -> dict[str, Any]:
    """
    Readiness placeholder. Phase 2+ can add DynamoDB ping, etc.
    Keeps async signature for consistency with I/O-bound checks later.
    """
    return {"status": "ok", "checks": {}}
