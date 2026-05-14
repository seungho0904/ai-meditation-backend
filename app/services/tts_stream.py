"""Sentence-chunked TTS streaming (NDJSON) for progressive playback on the client."""

from __future__ import annotations

import base64
import json
import re
from collections.abc import AsyncIterator
from typing import Optional

import httpx

from app.core.config import Settings, settings
from app.core.voice_presets import resolve_voice_id
from app.services.tts import synthesize_speech


def split_into_sentence_chunks(text: str, min_chars: int = 12) -> list[str]:
    """
    Split a script into sentence-like segments for sequential TTS.

    Merges very short tails so we do not send single-word fragments to ElevenLabs.
    If there is almost no punctuation, returns the whole script as one chunk.
    """
    text = text.strip()
    if not text:
        return []
    parts = re.split(r"(?<=[.!?。…\n])\s+", text)
    segments = [p.strip() for p in parts if p.strip()]
    if not segments:
        return [text]
    chunks: list[str] = []
    buf = ""
    for seg in segments:
        if not buf:
            buf = seg
            continue
        if len(buf) < min_chars:
            buf = f"{buf} {seg}"
        else:
            chunks.append(buf)
            buf = seg
    if buf:
        chunks.append(buf)
    return chunks


async def ndjson_sentence_audio_stream(
    client: httpx.AsyncClient,
    script: str,
    cfg: Settings,
    *,
    voice_id: str | None = None,
    voice_preset: str | None = None,
) -> AsyncIterator[bytes]:
    """
    Yield NDJSON lines: metadata, one object per sentence chunk (base64 MP3), then end.

    Client flow: parse each line as JSON; for ``type == "chunk"``, decode ``audio_base64``
    to MP3 bytes and play (e.g. queue in Web Audio / ``<audio>`` blobs in order).
    """
    vid, preset_used = resolve_voice_id(
        voice_id=voice_id,
        voice_preset=voice_preset,
        default_voice_id=cfg.ELEVENLABS_VOICE_ID,
    )
    sentences = split_into_sentence_chunks(script)
    meta = {
        "type": "metadata",
        "voice_id": vid,
        "voice_preset": preset_used,
        "chunk_count": len(sentences),
        "format": "mp3",
    }
    yield (json.dumps(meta) + "\n").encode("utf-8")

    for i, sentence in enumerate(sentences):
        audio, truncated = await synthesize_speech(
            client, sentence, cfg, voice_id=vid
        )
        payload = {
            "type": "chunk",
            "index": i,
            "text": sentence,
            "audio_base64": base64.b64encode(audio).decode("ascii"),
            "truncated": truncated,
        }
        yield (json.dumps(payload, ensure_ascii=False) + "\n").encode("utf-8")

    yield (json.dumps({"type": "end"}) + "\n").encode("utf-8")


async def stream_script_audio_ndjson(
    client: httpx.AsyncClient,
    script: str,
    *,
    voice_id: str | None = None,
    voice_preset: str | None = None,
    cfg: Optional[Settings] = None,
) -> AsyncIterator[bytes]:
    cfg = cfg or settings
    async for line in ndjson_sentence_audio_stream(
        client,
        script,
        cfg,
        voice_id=voice_id,
        voice_preset=voice_preset,
    ):
        yield line
