"""Async LLM calls for meditation script generation (OpenAI or Anthropic via httpx)."""

from __future__ import annotations

import logging
from typing import Any, Literal, Optional

import httpx

from app.core.config import Settings, settings
from app.core.exceptions import AppError
from app.core.prompts import PROMPT_VERSION, format_user_message, system_prompt
from app.schemas.meditation import MeditationScriptRequest, MeditationScriptResponse

logger = logging.getLogger(__name__)

LLMProvider = Literal["openai", "anthropic"]


def _require_key(provider: LLMProvider, cfg: Settings) -> str:
    if provider == "openai":
        if not cfg.OPENAI_API_KEY:
            raise AppError(
                "OpenAI is selected but OPENAI_API_KEY is not set.",
                status_code=503,
            )
        return cfg.OPENAI_API_KEY
    if not cfg.ANTHROPIC_API_KEY:
        raise AppError(
            "Anthropic is selected but ANTHROPIC_API_KEY is not set.",
            status_code=503,
        )
    return cfg.ANTHROPIC_API_KEY


def _normalize_provider(value: str) -> LLMProvider:
    v = value.strip().lower()
    if v in ("openai", "anthropic"):
        return v  # type: ignore[return-value]
    raise AppError(
        f"Unsupported LLM_PROVIDER '{value}'. Use 'openai' or 'anthropic'.",
        status_code=500,
    )


async def _call_openai(
    client: httpx.AsyncClient,
    cfg: Settings,
    user_message: str,
) -> str:
    api_key = _require_key("openai", cfg)
    payload: dict[str, Any] = {
        "model": cfg.OPENAI_MODEL,
        "temperature": 0.7,
        "messages": [
            {"role": "system", "content": system_prompt()},
            {"role": "user", "content": user_message},
        ],
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    r = await client.post(cfg.OPENAI_API_URL, headers=headers, json=payload)
    r.raise_for_status()
    data = r.json()
    try:
        return str(data["choices"][0]["message"]["content"]).strip()
    except (KeyError, IndexError, TypeError) as e:
        logger.error("Unexpected OpenAI response shape: %s", str(data)[:2000])
        raise AppError("Unexpected response from OpenAI.", status_code=502) from e


async def _call_anthropic(
    client: httpx.AsyncClient,
    cfg: Settings,
    user_message: str,
) -> str:
    api_key = _require_key("anthropic", cfg)
    payload: dict[str, Any] = {
        "model": cfg.ANTHROPIC_MODEL,
        "max_tokens": 4096,
        "temperature": 0.7,
        "system": system_prompt(),
        "messages": [{"role": "user", "content": user_message}],
    }
    headers = {
        "x-api-key": api_key,
        "anthropic-version": cfg.ANTHROPIC_API_VERSION,
        "content-type": "application/json",
    }
    r = await client.post(cfg.ANTHROPIC_API_URL, headers=headers, json=payload)
    r.raise_for_status()
    data = r.json()
    try:
        parts = data["content"]
        if not parts:
            raise KeyError("empty content")
        return str(parts[0]["text"]).strip()
    except (KeyError, IndexError, TypeError) as e:
        logger.error("Unexpected Anthropic response shape: %s", str(data)[:2000])
        raise AppError("Unexpected response from Anthropic.", status_code=502) from e


async def generate_meditation_script(
    client: httpx.AsyncClient,
    body: MeditationScriptRequest,
    cfg: Optional[Settings] = None,
) -> MeditationScriptResponse:
    """
    Build prompts and call the configured LLM provider asynchronously.
    """
    cfg = cfg or settings
    provider = _normalize_provider(cfg.LLM_PROVIDER)
    user_message = format_user_message(body.context)

    try:
        if provider == "openai":
            script = await _call_openai(client, cfg, user_message)
            model = cfg.OPENAI_MODEL
        else:
            script = await _call_anthropic(client, cfg, user_message)
            model = cfg.ANTHROPIC_MODEL
    except httpx.TimeoutException as e:
        logger.warning("LLM request timed out: %s", e)
        raise AppError("LLM request timed out. Try again with a shorter context.", status_code=504) from e
    except httpx.HTTPStatusError as e:
        text = (e.response.text or "")[:2000]
        logger.warning(
            "LLM HTTP error status=%s body=%s",
            e.response.status_code,
            text,
        )
        raise AppError(
            "LLM provider returned an error. Check server logs for details.",
            status_code=502,
        ) from e
    except httpx.RequestError as e:
        logger.error("LLM transport error: %s", e)
        raise AppError(
            "Could not reach LLM provider. Verify network connectivity and DNS.",
            status_code=502,
        ) from e

    if not script:
        raise AppError("LLM returned an empty script.", status_code=502)

    return MeditationScriptResponse(
        prompt_version=PROMPT_VERSION,
        provider=provider,
        model=model,
        script=script,
    )
