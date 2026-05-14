from __future__ import annotations

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


class MeditationScriptResponse(BaseModel):
    """Generated script plus metadata for debugging and versioning."""

    prompt_version: str
    provider: str
    model: str
    script: str


class MeditationSpeechRequest(BaseModel):
    """Existing meditation script text to synthesize as speech."""

    script: str = Field(
        ...,
        min_length=1,
        max_length=50000,
        description="Full meditation script text (e.g. output from POST /meditation/script).",
    )


class MeditationSessionResponse(MeditationScriptResponse):
    """Script plus MP3 payload for clients that want one round-trip (demo / mobile)."""

    audio_format: str = "mp3"
    audio_base64: str = Field(..., description="MP3 bytes, base64-encoded.")
    audio_truncated: bool = Field(
        False,
        description="True if the TTS provider input was truncated (see server logs).",
    )
