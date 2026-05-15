"""Environment-driven settings. Keeps secrets out of code (loaded from .env locally, env vars in AWS)."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Single source of truth for configuration and secrets.

    Values are populated from the process environment and optional `.env` (dev only).
    **Never** embed API keys or tokens as non-empty defaults in source control—use `None`
    for secrets and provide real values via environment / `.env`.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "AI Meditation API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Comma-separated in .env; parsed to list for CORSMiddleware.
    # Defaults cover Next dev on localhost vs 127.0.0.1 and ports 3000–3002.
    CORS_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:3001,http://127.0.0.1:3001,"
        "http://localhost:3002,http://127.0.0.1:3002"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_origins(cls, v: str | list[str]) -> str:
        if isinstance(v, list):
            return ",".join(v)
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # Default script/UI language when clients omit `locale` on meditation POST bodies.
    APP_LOCALE: Literal["en", "ko"] = "en"

    @field_validator("APP_LOCALE", mode="before")
    @classmethod
    def normalize_app_locale(cls, v: object) -> str:
        if v is None:
            return "en"
        s = str(v).strip().lower()
        if s in ("en", "english"):
            return "en"
        if s in ("ko", "kr", "korean", "한국어"):
            return "ko"
        raise ValueError("APP_LOCALE must be 'en' or 'ko'")

    # --- LLM (Phase 1) ---
    LLM_PROVIDER: str = "openai"
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_URL: str = "https://api.openai.com/v1/chat/completions"
    ANTHROPIC_API_URL: str = "https://api.anthropic.com/v1/messages"
    OPENAI_MODEL: str = "gpt-4o-mini"
    ANTHROPIC_MODEL: str = "claude-3-5-haiku-20241022"
    ANTHROPIC_API_VERSION: str = "2023-06-01"
    LLM_TIMEOUT_SECONDS: float = 60.0

    # --- ElevenLabs TTS (Phase 1) ---
    ELEVENLABS_API_KEY: Optional[str] = None
    ELEVENLABS_API_BASE: str = "https://api.elevenlabs.io/v1"
    # Default: premade soft female (Sarah) — calm / "Bella-like"; override in `.env` or use `/voice-presets`.
    ELEVENLABS_VOICE_ID: str = "EXAVITQu4vr4xnSDxMaL"
    ELEVENLABS_MODEL_ID: str = "eleven_multilingual_v2"
    ELEVENLABS_OUTPUT_FORMAT: str = "mp3_44100_128"
    TTS_TIMEOUT_SECONDS: float = 120.0
    TTS_MAX_INPUT_CHARS: int = 12000


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
