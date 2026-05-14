"""Async ElevenLabs text-to-speech (HTTP API via shared httpx client)."""

from __future__ import annotations

import logging

from typing import Optional

import httpx

from app.core.config import Settings, settings
from app.core.exceptions import AppError

logger = logging.getLogger(__name__)


def _tts_input_text(full_script: str, cfg: Settings) -> tuple[str, bool]:
    """
    Return text sent to ElevenLabs and whether it was truncated.
    Long LLM outputs can exceed provider limits or slow synthesis; cap for reliability.
    """
    max_chars = max(500, cfg.TTS_MAX_INPUT_CHARS)
    stripped = full_script.strip()
    if len(stripped) <= max_chars:
        return stripped, False
    logger.warning("Truncating TTS input from %s to %s chars", len(stripped), max_chars)
    return stripped[:max_chars], True


async def synthesize_speech(
    client: httpx.AsyncClient,
    text: str,
    cfg: Optional[Settings] = None,
) -> tuple[bytes, bool]:
    """
    Call ElevenLabs `text-to-speech` and return MP3 bytes plus truncation flag.
    """
    cfg = cfg or settings
    if not cfg.ELEVENLABS_API_KEY:
        raise AppError(
            "ElevenLabs is not configured: set ELEVENLABS_API_KEY in the environment.",
            status_code=503,
        )

    tts_text, truncated = _tts_input_text(text, cfg)
    if not tts_text:
        raise AppError("Cannot synthesize empty script text.", status_code=400)

    url = f"{cfg.ELEVENLABS_API_BASE.rstrip('/')}/text-to-speech/{cfg.ELEVENLABS_VOICE_ID}"
    payload: dict[str, str] = {
        "text": tts_text,
        "model_id": cfg.ELEVENLABS_MODEL_ID,
        "output_format": cfg.ELEVENLABS_OUTPUT_FORMAT,
    }
    headers = {
        "xi-api-key": cfg.ELEVENLABS_API_KEY,
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
    }

    try:
        r = await client.post(url, json=payload, headers=headers)
        r.raise_for_status()
    except httpx.TimeoutException as e:
        logger.warning("TTS request timed out: %s", e)
        raise AppError(
            "Text-to-speech request timed out. Try a shorter script.",
            status_code=504,
        ) from e
    except httpx.HTTPStatusError as e:
        body = (e.response.text or "")[:2000]
        logger.warning("TTS HTTP error status=%s body=%s", e.response.status_code, body)
        raise AppError(
            "ElevenLabs returned an error. Check server logs for details.",
            status_code=502,
        ) from e
    except httpx.RequestError as e:
        logger.error("TTS transport error: %s", e)
        raise AppError(
            "Could not reach ElevenLabs. Verify network connectivity and DNS.",
            status_code=502,
        ) from e

    audio = r.content
    if not audio:
        raise AppError("ElevenLabs returned empty audio.", status_code=502)

    return audio, truncated
