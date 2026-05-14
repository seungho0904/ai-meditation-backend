"""Orchestrate LLM script generation + ElevenLabs TTS for one-shot MVP flows."""

from __future__ import annotations

import base64
from typing import Optional

import httpx

from app.core.config import Settings, settings
from app.schemas.meditation import (
    MeditationScriptRequest,
    MeditationScriptResponse,
    MeditationSessionResponse,
)
from app.services.llm import generate_meditation_script
from app.services.tts import synthesize_speech


async def generate_script_and_audio(
    client: httpx.AsyncClient,
    body: MeditationScriptRequest,
    cfg: Optional[Settings] = None,
) -> MeditationSessionResponse:
    """
    Run LLM then TTS asynchronously; return script metadata plus base64 MP3 for simple clients.
    """
    cfg = cfg or settings
    script_resp: MeditationScriptResponse = await generate_meditation_script(client, body, cfg)
    audio_bytes, audio_truncated = await synthesize_speech(client, script_resp.script, cfg)
    b64 = base64.b64encode(audio_bytes).decode("ascii")

    return MeditationSessionResponse(
        prompt_version=script_resp.prompt_version,
        provider=script_resp.provider,
        model=script_resp.model,
        script=script_resp.script,
        locale=script_resp.locale,
        audio_format="mp3",
        audio_base64=b64,
        audio_truncated=audio_truncated,
    )
