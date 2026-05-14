"""Meditation script generation HTTP routes."""

from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import Response, StreamingResponse

from app.core.config import settings
from app.core.exceptions import AppError
from app.core.voice_presets import list_voice_presets
from app.schemas.meditation import (
    MeditationScriptRequest,
    MeditationScriptResponse,
    MeditationSessionResponse,
    MeditationSpeechRequest,
    MeditationSpeechStreamRequest,
)
from app.services.llm import generate_meditation_script
from app.services.meditation_flow import generate_script_and_audio
from app.services.tts import synthesize_speech
from app.services.tts_stream import stream_script_audio_ndjson

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/meditation", tags=["meditation"])


def _get_http_client(request: Request) -> httpx.AsyncClient:
    client = getattr(request.app.state, "http_client", None)
    if client is None:
        logger.error("http_client missing from app.state")
        raise AppError("Server is not fully initialized.", status_code=500)
    return client


@router.post(
    "/script",
    response_model=MeditationScriptResponse,
    summary="Generate a personalized meditation script",
)
async def create_meditation_script(
    body: MeditationScriptRequest,
    request: Request,
) -> MeditationScriptResponse:
    client = _get_http_client(request)
    return await generate_meditation_script(client, body, settings)


@router.get(
    "/voice-presets",
    summary="List calm / meditation-oriented ElevenLabs voice presets",
)
async def voice_presets() -> dict[str, list[dict[str, str]]]:
    return {"presets": list_voice_presets()}


@router.post(
    "/speech",
    summary="Synthesize speech (MP3) from an existing script",
    response_class=Response,
    responses={
        200: {
            "content": {"audio/mpeg": {}},
            "description": "Binary MP3 audio.",
        }
    },
)
async def synthesize_meditation_speech(
    body: MeditationSpeechRequest,
    request: Request,
) -> Response:
    client = _get_http_client(request)
    audio, _truncated = await synthesize_speech(client, body.script, settings)
    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={"Content-Disposition": 'inline; filename="meditation.mp3"'},
    )


@router.post(
    "/speech-stream",
    summary="Stream TTS as NDJSON (one MP3 chunk per sentence, progressive playback)",
    responses={
        200: {
            "content": {"application/x-ndjson": {}},
            "description": "NDJSON: metadata line, then chunk lines with base64 MP3, then end line.",
        }
    },
)
async def synthesize_meditation_speech_stream(
    body: MeditationSpeechStreamRequest,
    request: Request,
) -> StreamingResponse:
    client = _get_http_client(request)
    return StreamingResponse(
        stream_script_audio_ndjson(
            client,
            body.script,
            voice_id=body.voice_id,
            voice_preset=body.voice_preset,
            cfg=settings,
        ),
        media_type="application/x-ndjson",
    )


@router.post(
    "/session",
    response_model=MeditationSessionResponse,
    summary="Generate script (LLM) then speech (ElevenLabs) in one request",
)
async def create_meditation_session(
    body: MeditationScriptRequest,
    request: Request,
) -> MeditationSessionResponse:
    client = _get_http_client(request)
    return await generate_script_and_audio(client, body, settings)
