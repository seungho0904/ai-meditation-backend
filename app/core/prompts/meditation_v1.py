"""
Meditation script generation — prompt templates (v1).

Bump version constant and filename when changing instructions so logs stay traceable.
"""

from __future__ import annotations

PROMPT_VERSION = "meditation_v1"

SYSTEM_PROMPT = """You are an experienced meditation teacher and spoken-word guide.
You write concise, calming guided meditation scripts meant to be read aloud.
Rules:
- Use second person ("you") and slow, spacious pacing; short paragraphs or line breaks for breaths.
- Do not give medical or crisis advice; if distress sounds severe, gently suggest seeking professional support at the end (one sentence).
- Avoid cultural appropriation or religious claims; stay secular and inclusive.
- Length: about 400–900 words unless the user's situation clearly needs shorter grounding."""

USER_MESSAGE_TEMPLATE = """The practitioner describes their emotional state and situation:

---
{user_context}
---

Produce a single continuous guided meditation script they can follow with eyes closed or softened gaze."""


def format_user_message(user_context: str) -> str:
    return USER_MESSAGE_TEMPLATE.format(user_context=user_context.strip())


def system_prompt() -> str:
    return SYSTEM_PROMPT
