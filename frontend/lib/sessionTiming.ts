import type { AppLocale } from "@/lib/i18n";

/** Fixed beginner session target (no user picker). */
export const SESSION_MIN_MINUTES = 3;
export const SESSION_MAX_MINUTES = 5;

/** Calm TTS pace with implied pauses (~words per minute). */
const WPM_CALM = 110;

export function formatSessionClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function countSpokenUnits(text: string, locale: AppLocale): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  if (locale === "ko") {
    return trimmed.replace(/\s+/g, "").length;
  }
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/** Rough spoken duration from script text (for stream / words-only progress). */
export function estimateScriptDurationSeconds(script: string, locale: AppLocale): number {
  const units = countSpokenUnits(script, locale);
  if (locale === "ko") {
    const minutes = units / 320;
    return Math.round(minutes * 60);
  }
  const minutes = units / WPM_CALM;
  return Math.round(minutes * 60);
}

export function clampSessionEstimate(seconds: number): number {
  const minS = SESSION_MIN_MINUTES * 60;
  const maxS = SESSION_MAX_MINUTES * 60;
  return Math.min(maxS, Math.max(minS, seconds));
}
