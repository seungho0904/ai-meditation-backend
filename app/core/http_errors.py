"""Map httpx failures to short, demo-friendly API error messages."""

from __future__ import annotations

import httpx

from app.core.exceptions import AppError


def raise_llm_transport_error(exc: httpx.RequestError) -> None:
    raise _transport_app_error("LLM", exc)


def raise_tts_transport_error(exc: httpx.RequestError) -> None:
    raise _transport_app_error("TTS", exc)


def raise_llm_http_error(exc: httpx.HTTPStatusError) -> None:
    status = exc.response.status_code
    if status in (401, 403):
        raise AppError(
            "LLM API key was rejected. Check OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.",
            status_code=502,
        ) from exc
    raise AppError(
        "LLM provider returned an error. Check server logs for details.",
        status_code=502,
    ) from exc


def raise_tts_http_error(exc: httpx.HTTPStatusError) -> None:
    status = exc.response.status_code
    if status in (401, 403):
        raise AppError(
            "ElevenLabs API key was rejected. Check ELEVENLABS_API_KEY in .env.",
            status_code=502,
        ) from exc
    raise AppError(
        "ElevenLabs returned an error. Check server logs for details.",
        status_code=502,
    ) from exc


def _transport_app_error(label: str, exc: httpx.RequestError) -> AppError:
    if isinstance(exc, httpx.ProxyError):
        return AppError(
            f"{label} request blocked by an HTTP proxy or VPN. "
            "Unset HTTP_PROXY/HTTPS_PROXY for local dev or allow the provider API host.",
            status_code=502,
        )
    if isinstance(exc, httpx.ConnectError):
        return AppError(
            f"Could not connect to the {label} provider. Check network and DNS.",
            status_code=502,
        )
    msg = str(exc).strip()
    if "proxy" in msg.lower() or "403" in msg:
        return AppError(
            f"{label} request blocked by a proxy. Unset HTTP_PROXY/HTTPS_PROXY and restart the API.",
            status_code=502,
        )
    return AppError(
        f"Could not reach the {label} provider. Check internet and API keys in .env.",
        status_code=502,
    )
