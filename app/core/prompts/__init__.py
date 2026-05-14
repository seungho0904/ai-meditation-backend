"""Versioned prompt templates (keep filenames/suffixes when behavior changes)."""

from app.core.prompts.meditation_v1 import (
    PROMPT_VERSION,
    format_user_message,
    system_prompt,
)

__all__ = ["PROMPT_VERSION", "format_user_message", "system_prompt"]
