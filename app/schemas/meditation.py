from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class MeditationScriptRequest(BaseModel):
    """User emotional state and situational context in natural language."""

    context: str = Field(
        ...,
        min_length=10,
        max_length=8000,
        description="Current feelings and situation the meditation should address.",
        examples=[
            "I have an important technical interview tomorrow and I feel overwhelmed and can't sleep."
        ],
    )
    locale: Optional[Literal["en", "ko"]] = Field(
        None,
        description='Script language: "en" or "ko". Omit to use server APP_LOCALE.',
    )


class MeditationScriptResponse(BaseModel):
    """Generated script plus metadata for debugging and versioning."""

    prompt_version: str
    provider: str
    model: str
    script: str
    locale: Literal["en", "ko"] = Field(
        ...,
        description='Effective locale used for this script (request `locale` or APP_LOCALE).',
    )


class MeditationSpeechRequest(BaseModel):
    """Existing meditation script text to synthesize as speech."""

    script: str = Field(
        ...,
        min_length=1,
        max_length=50000,
        description="Full meditation script text (e.g. output from POST /meditation/script).",
    )


class MeditationSpeechStreamRequest(BaseModel):
    """Full script; server splits into sentences and streams one MP3 chunk per line (NDJSON)."""

    script: str = Field(
        ...,
        min_length=1,
        max_length=50000,
        description="Meditation script text to synthesize in sentence-sized streaming chunks.",
    )
    voice_preset: Optional[str] = Field(
        None,
        description="Optional: bella_style | marcus_style | calm_female_conversational | default | env.",
        examples=["bella_style"],
    )
    voice_id: Optional[str] = Field(
        None,
        description="Optional: override preset and ELEVENLABS_VOICE_ID with a raw ElevenLabs voice_id.",
    )


class MeditationSessionResponse(MeditationScriptResponse):
    """Script plus MP3 payload for clients that want one round-trip (demo / mobile)."""

    audio_format: str = "mp3"
    audio_base64: str = Field(..., description="MP3 bytes, base64-encoded.")
    audio_truncated: bool = Field(
        False,
        description="True if the TTS provider input was truncated (see server logs).",
    )
