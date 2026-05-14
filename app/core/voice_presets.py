"""Premade ElevenLabs voice IDs suited for calm / meditation-style delivery.

IDs come from the official ElevenLabs `text-to-speech` examples (public premade catalog).
Names in the UI (Sarah, George) may differ from product marketing labels such as
“Bella” or “Marcus”; treat presets as **calm female** vs **calm male narrative**.

Re-verify under your account if a voice returns ``voice_not_found``:
https://elevenlabs.io/app/voice-library
"""

from __future__ import annotations

# preset_key -> (voice_id, short description for API clients)
VOICE_PRESET_IDS: dict[str, tuple[str, str]] = {
    # Soft female — good for gentle / “Bella-like” calm guidance
    "bella_style": ("EXAVITQu4vr4xnSDxMaL", "Sarah — soft female (calm / Bella-like)"),
    # Narrative male — good for grounded / “Marcus-like” calm guidance
    "marcus_style": ("JBFqnCBsd6RMkjVDRZzb", "George — narrative male (calm / Marcus-like)"),
    # Extra calm female option from the same official list
    "calm_female_conversational": (
        "XB0fDUnXU5powFXDhCwa",
        "Charlotte — conversational female",
    ),
}


def list_voice_presets() -> list[dict[str, str]]:
    """Public metadata for UI or `/docs` consumers."""
    return [
        {"preset": key, "voice_id": vid, "description": desc}
        for key, (vid, desc) in VOICE_PRESET_IDS.items()
    ]


def resolve_voice_id(
    *,
    voice_id: str | None,
    voice_preset: str | None,
    default_voice_id: str,
) -> tuple[str, str | None]:
    """
    Return (voice_id, preset_used_or_none).

    Precedence: explicit ``voice_id`` > ``voice_preset`` > ``default_voice_id``.
    """
    if voice_id and voice_id.strip():
        return voice_id.strip(), None
    if voice_preset and voice_preset.strip():
        key = voice_preset.strip().lower()
        if key in ("default", "env"):
            return default_voice_id, None
        if key not in VOICE_PRESET_IDS:
            from app.core.exceptions import AppError

            allowed = ", ".join(sorted(VOICE_PRESET_IDS.keys()))
            raise AppError(
                f"Unknown voice_preset '{voice_preset}'. Use: {allowed}, default, env.",
                status_code=400,
            )
        vid, _ = VOICE_PRESET_IDS[key]
        return vid, key
    return default_voice_id, None
